require("module-alias/register");
const { expect } = require("@playwright/test");
const { fetchPayloadFromStorage, buildRequestTypeMatcher } = require("@utils/payloadValidationClient");
const logger = require("@utils/logger").child("PayloadValidation-DSL");

// Request-count polling. Distributor logs are published asynchronously, so counts are read
// repeatedly until they stop changing rather than trusted on the first read.
const COUNT_POLL_INTERVAL_MS = 2000;
const COUNT_STABLE_READS = 2;
const COUNT_SETTLE_TIMEOUT_MS = 30000;
const ANCHOR_TIMEOUT_MS = 60000;
// Upper bound when every request of a type must be downloaded and inspected, not just the latest
// few. Well above any realistic per-trip volume so the set is never silently truncated.
const MAX_REQUESTS_TO_INSPECT = 200;
// Downloading every payload takes far longer than fetching the latest one, and the volume is
// highest exactly when a request is being repeated - the case this check exists to catch.
const INSPECT_ALL_TIMEOUT_MS = 180000;
// Matches every request type in the trip log. The storage client turns "*" into a regex
// (buildRequestTypeMatcher), which is how a whole-trip inventory is read without naming a type.
const ALL_REQUEST_TYPES_WILDCARD = "*";

function buildKey(source, requestType) {
  return `${source.toLowerCase()}::${requestType.trim()}`;
}

function assertWorld(world) {
  if (!world || typeof world !== "object") {
    throw new Error("world context is required");
  }
}

function normalizeSource(source) {
  if (!source || typeof source !== "string") {
    throw new Error("source must be a non-empty string");
  }

  const normalized = source.trim().toLowerCase();
  if (normalized !== "request" && normalized !== "response" && normalized !== "block") {
    throw new Error(`source must be either \"request\", \"response\" or \"block\", got: ${source}`);
  }

  return normalized;
}

function parseBlockExpression(expectedText) {
  if (!expectedText || typeof expectedText !== "string") {
    return null;
  }

  const value = expectedText.trim();

  // Supported examples:
  // ("MADRID ATOCHA RRS").block("locationAddress")
  // "MADRID ATOCHA RRS".block("locationAddress")
  // MADRID ATOCHA RRS.block(locationAddress)
  const quotedInParens = value.match(/^\(\s*(["'])([\s\S]*?)\1\s*\)\.block\(\s*(["']?)([\s\S]*?)\3\s*\)$/);
  const quoted = value.match(/^(["'])([\s\S]*?)\1\.block\(\s*(["']?)([\s\S]*?)\3\s*\)$/);
  const plain = value.match(/^([\s\S]*?)\.block\(\s*(["']?)([\s\S]*?)\2\s*\)$/);

  let text;
  let blockTag;

  if (quotedInParens) {
    text = quotedInParens[2].trim();
    blockTag = quotedInParens[4].trim();
  } else if (quoted) {
    text = quoted[2].trim();
    blockTag = quoted[4].trim();
  } else if (plain) {
    text = plain[1].trim();
    blockTag = plain[3].trim();
  } else {
    return null;
  }

  if (!text) {
    throw new Error(`Invalid block expression \"${expectedText}\": text cannot be empty`);
  }

  if (!blockTag) {
    throw new Error(`Invalid block expression \"${expectedText}\": block tag cannot be empty`);
  }

  return { text, blockTag };
}

function extractXmlBlocksByTag(xmlPayload, blockTag) {
  const safeTag = escapeRegex(blockTag);
  // Namespace-agnostic on both sides: find an opening tag for blockTag regardless of any
  // namespace prefix (e.g. <vehicle:VehicleLocation>), then independently scan forward for
  // the next closing tag with the same local name, whatever ITS prefix is. The two sides are
  // never required to share a prefix - simpler and less fragile than parsing/backreferencing
  // the exact prefix, and it still works for plain (unprefixed) tags used by other suppliers.
  const openTagRegex = new RegExp(`<(?:[\\w.-]+:)?${safeTag}\\b[^>]*>`, "gi");
  const closeTagRegex = new RegExp(`<\\/(?:[\\w.-]+:)?${safeTag}>`, "i");

  const blocks = [];
  let openMatch;
  while ((openMatch = openTagRegex.exec(xmlPayload)) !== null) {
    const openTag = openMatch[0];

    if (openTag.endsWith("/>")) {
      blocks.push(openTag);
      continue;
    }

    const searchFrom = openMatch.index + openTag.length;
    const closeMatch = closeTagRegex.exec(xmlPayload.slice(searchFrom));
    if (!closeMatch) {
      continue; // No closing tag found below this open tag - skip it.
    }

    const blockEnd = searchFrom + closeMatch.index + closeMatch[0].length;
    blocks.push(xmlPayload.slice(openMatch.index, blockEnd));
    openTagRegex.lastIndex = blockEnd;
  }

  return blocks;
}

function normalizeRequestType(requestType) {
  if (!requestType || typeof requestType !== "string") {
    throw new Error("requestType must be a non-empty string");
  }

  return requestType.trim();
}

function getByPath(objectValue, path) {
  if (!path || typeof path !== "string") {
    throw new Error("path must be a non-empty string");
  }

  const keys = path.match(/[^.[\]]+/g);
  if (!keys || keys.length === 0) {
    throw new Error(`Invalid path: ${path}`);
  }

  return keys.reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), objectValue);
}

function getScenarioIdentifiers(world) {
  return {
    tripId: world.tripId || world.currentTripId || world.createdTripId || null,
    transactionId: world.transactionId || null,
    sid: world.sid || null,
  };
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

// A single read can land mid-burst while the logs are still being published, so poll until
// the count repeats COUNT_STABLE_READS times in a row before trusting it.
async function settleRequestCount(countRequests, { requestType }) {
  const deadline = Date.now() + COUNT_SETTLE_TIMEOUT_MS;
  let settledCount = await countRequests();
  let consecutiveMatches = 1;

  while (consecutiveMatches < COUNT_STABLE_READS && Date.now() < deadline) {
    await sleep(COUNT_POLL_INTERVAL_MS);
    const currentCount = await countRequests();

    if (currentCount === settledCount) {
      consecutiveMatches += 1;
    } else {
      settledCount = currentCount;
      consecutiveMatches = 1;
    }
  }

  if (consecutiveMatches < COUNT_STABLE_READS) {
    logger.warn(`Request count for "${requestType}" never settled - using the last read`, {
      requestType,
      settledCount,
      consecutiveMatches,
      settleTimeoutMs: COUNT_SETTLE_TIMEOUT_MS,
    });
  }

  return settledCount;
}

// Some suppliers log the JSON body with the call's own diagnostics appended after it - Travelport
// stores "{body}Endpoint URL: ..., Request Details, {headers}" and "{body}  Response Details,
// {headers}". That is two documents in one blob, so a straight parse throws and every path
// assertion is unusable. Reading just the first complete document recovers the body; a payload
// that really is malformed still lands in the error below.
// A leading document followed by an XML body is not that case: BA NDC stores
// '{"SOAPAction":"OrderCreate17_2_V5"}<OrderCreateRQ ...>', where the JSON is only the SOAP
// header and the XML is the payload, so it is left to the XML path.
function extractLeadingJsonDocument(payload) {
  if (typeof payload !== "string") return null;

  const start = payload.search(/[{[]/);
  if (start === -1) return null;

  const opening = payload[start];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < payload.length; i++) {
    const character = payload[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }

    if (character === "\"") inString = true;
    else if (character === opening) depth++;
    else if (character === closing && --depth === 0) {
      if (payload.slice(i + 1).trimStart().startsWith("<")) return null;
      try {
        return JSON.parse(payload.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
}

// Every assertion that parses a CAPTURED payload goes through this, so a supplier that appends
// diagnostics to the body stays fully assertable. Returns null when there is no JSON to read.
function tryParseCapturedJson(payload) {
  try {
    return JSON.parse(payload);
  } catch {
    return extractLeadingJsonDocument(payload);
  }
}

function parseJsonPayload(payload, source, requestType) {
  const parsed = tryParseCapturedJson(payload);
  if (parsed !== null) {
    return parsed;
  }

  throw new Error(
    `Captured ${source} payload for request type \"${requestType}\" is not valid JSON. Use text-based assertions (contains) or capture a JSON payload.`
  );
}

// Decides whether an assertion should treat a payload as JSON, tolerating the same appended
// diagnostics extractLeadingJsonDocument() handles - without it a Travelport body is misread as
// XML and every JSON-shaped assertion silently takes the exact-tag-match path instead.
function coerceJsonPayload(rawPayload) {
  const parsed = tryParseCapturedJson(rawPayload);
  return parsed === null
    ? { payloadString: rawPayload, isJson: false }
    : { payloadString: JSON.stringify(parsed), isJson: true };
}

function parseSplitExpression(expectedText) {
  if (!expectedText || typeof expectedText !== "string") {
    return null;
  }

  const rawValue = expectedText.trim();
  const indexMatch = rawValue.match(/\[(\d+)\]\s*$/);
  const index = indexMatch ? Number(indexMatch[1]) : null;
  const value = indexMatch ? rawValue.slice(0, indexMatch.index).trim() : rawValue;

  // Supported examples:
  // ("A, B, C").split(,)
  // ('A, B, C').split(',')
  // A, B, C.split(,)
  const quotedInParens = value.match(/^\(\s*(["'])([\s\S]*?)\1\s*\)\.split\(\s*(["']?)(.*?)\3\s*\)$/);
  const plain = value.match(/^([\s\S]*?)\.split\(\s*(["']?)(.*?)\2\s*\)$/);

  let content;
  let delimiter;

  if (quotedInParens) {
    content = quotedInParens[2];
    delimiter = quotedInParens[4];
  } else if (plain) {
    content = plain[1]?.trim();
    delimiter = plain[3];
  } else {
    return null;
  }

  if (delimiter === undefined || delimiter === null || delimiter === "") {
    throw new Error(`Invalid split expression \"${expectedText}\": delimiter cannot be empty`);
  }

  const splitParts = content
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);

  if (index !== null) {
    if (index < 0 || index >= splitParts.length) {
      throw new Error(
        `Invalid split expression \"${expectedText}\": index ${index} is out of range for ${splitParts.length} split part(s)`
      );
    }

    return [splitParts[index]];
  }

  return splitParts;
}

function parseOnKeyExpression(expectedText) {
  if (!expectedText || typeof expectedText !== "string") {
    return null;
  }

  const value = expectedText.trim();

  // Supported examples:
  // "false".onKey("isCardAuthenticationRequired")
  // false.onKey(isCardAuthenticationRequired)
  // ("false").onKey("isCardAuthenticationRequired")
  const quotedInParens = value.match(/^\(\s*(["']?)([\s\S]*?)\1\s*\)\.onKey\(\s*(["']?)([\s\S]*?)\3\s*\)$/);
  const quoted = value.match(/^(["']?)([\s\S]*?)\1\.onKey\(\s*(["']?)([\s\S]*?)\3\s*\)$/);

  let rawValue;
  let key;

  if (quotedInParens) {
    rawValue = quotedInParens[2].trim();
    key = quotedInParens[4].trim();
  } else if (quoted && quoted[4]) {
    rawValue = quoted[2].trim();
    key = quoted[4].trim();
  } else {
    return null;
  }

  if (!key) {
    throw new Error(`Invalid onKey expression "${expectedText}": key cannot be empty`);
  }

  // Type-coerce the value so booleans and numbers compare correctly in JSON.
  let typedValue;
  if (rawValue === "true") typedValue = true;
  else if (rawValue === "false") typedValue = false;
  else if (/^-?\d+$/.test(rawValue)) typedValue = Number.parseInt(rawValue, 10);
  else if (/^-?\d*\.\d+$/.test(rawValue)) typedValue = Number.parseFloat(rawValue);
  else typedValue = rawValue;

  return { rawValue, typedValue, key };
}

// JSON APIs often represent numeric/boolean identifiers as strings (e.g. loyalty numbers,
// postal codes). onKey() type-coerces the expected value for convenience, so comparisons must
// also accept the equivalent string/number/boolean representation on the actual side.
function onKeyValuesMatch(actual, typedValue) {
  if (actual === typedValue) return true;
  if (typeof actual === typeof typedValue) return false;
  return String(actual) === String(typedValue);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The Storage client throws instead of returning an empty set when a request type was never
// logged. For an "exactly N" assertion that is a legitimate reading of zero, not a failure.
function isNoPayloadFoundError(error) {
  return /No (?:request|response) payload found/i.test(error?.message || "");
}

/**
 * Looks for a named parameter in a payload, whatever shape the supplier uses for it: the same
 * name arrives as an XML attribute (OfferID="..."), an XML tag (<OfferID>...</OfferID>) or a
 * JSON key ("OfferID": ...) depending on the request type. Anything that is not a plain
 * identifier (e.g. a whole fragment like 'AccountCode="ABC"') is matched as raw text instead.
 *
 * @returns {{form: string, value: string|null}|null} null when the parameter is absent.
 */
function findParameterInPayload(payload, parameterName) {
  return collectParameterValues(payload, parameterName)[0] || null;
}

// A parameter that is not a plain identifier cannot have its value read out - the caller passed a
// whole fragment, so there is nothing left to compare against.
function isPlainParameterName(parameterName) {
  return /^[\w.:-]+$/.test(parameterName);
}

// A JSON key whose value is an array captures as '["abc"' because the value branch stops at the
// closing bracket. The brackets and quotes are noise for identity comparison and would make the
// same id read as two different values if one payload wrapped it and another did not.
function normalizeParameterValue(value) {
  return typeof value === "string" ? value.replace(/^[[\s"]+|[\]\s"]+$/g, "") : "";
}

/**
 * Every occurrence of a named parameter in one payload, in document order.
 *
 * A request routinely carries the same parameter more than once - one DepartureDateTime per leg,
 * one OfferID per offer - so presence and value checks both need the full list rather than the
 * first hit. Same three shapes as findParameterInPayload().
 *
 * @returns {Array<{form: string, value: string|null}>} empty when the parameter is absent.
 */
function collectParameterValues(payload, parameterName) {
  if (!isPlainParameterName(parameterName)) {
    return payload.toLowerCase().includes(parameterName.toLowerCase())
      ? [{ form: "text", value: null }]
      : [];
  }

  const safeName = escapeRegex(parameterName);
  const forms = [
    { form: "xml attribute", regex: new RegExp(`\\b${safeName}\\s*=\\s*"([^"]*)"`, "gi") },
    { form: "xml tag", regex: new RegExp(`<(?:[\\w.-]+:)?${safeName}\\b[^>]*>\\s*([^<]*)`, "gi") },
    { form: "json key", regex: new RegExp(`"${safeName}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|[^,}\\]\\s]+)`, "gi") },
  ];

  const occurrences = [];

  for (const { form, regex } of forms) {
    for (const match of payload.matchAll(regex)) {
      const raw = (match[1] ?? "").trim();
      // The JSON branch captures the quotes with the value; they only clutter the log line.
      const value = form === "json key" && raw.startsWith('"') && raw.endsWith('"')
        ? raw.slice(1, -1)
        : raw;
      occurrences.push({ form, value });
    }
  }

  return occurrences;
}

/**
 * Downloads every request of a type logged for the current trip, for assertions that must look
 * at the whole set rather than the latest payload. A truncated set is fatal: the request that
 * breaks the rule could be the one that was dropped, so a partial read would silently pass.
 *
 * @param {string} purpose Completes the sentence "Cannot <purpose>: ..." in the truncation error.
 * @param {"request"|"response"} [source] Which side to download. Defaults to "request": the
 *        count and uniqueness assertions inspect what was SENT. Pass "response" when the value
 *        under test is only in the reply.
 */
async function fetchAllRequestsForTrip(world, requestType, purpose, source = "request") {
  const identifiers = getScenarioIdentifiers(world);
  if (!identifiers.tripId) {
    throw new Error(
      `Cannot inspect "${requestType}" requests: no trip id is available on the world context.`
    );
  }

  const result = await fetchPayloadFromStorage({
    source,
    requestType,
    tripId: identifiers.tripId,
    transactionId: identifiers.transactionId,
    sid: identifiers.sid,
    returnAllMatches: true,
    maxMatches: MAX_REQUESTS_TO_INSPECT,
    timeoutMs: INSPECT_ALL_TIMEOUT_MS,
  });

  if (result.metadata.totalMatches > result.metadata.returnedMatches) {
    throw new Error(
      `Cannot ${purpose}: only ${result.metadata.returnedMatches} of ` +
      `${result.metadata.totalMatches} "${requestType}" requests were downloaded. ` +
      `Raise MAX_REQUESTS_TO_INSPECT so every request is inspected.`
    );
  }

  return result;
}

function globToRegexPattern(globPattern) {
  return `^${String(globPattern || "")
    .split("*")
    .map((part) => escapeRegex(part))
    .join(".*")}$`;
}

function parseMapExpression(expectedText) {
  if (!expectedText || typeof expectedText !== "string") {
    return null;
  }

  const value = expectedText.trim();

  // Supported examples:
  // ("Railway Station").map("MADX*")
  // "Railway Station".map("MADX*")
  // Railway Station.map(MADX*)
  const quotedInParens = value.match(/^\(\s*(["'])([\s\S]*?)\1\s*\)\.map\(\s*(["'])([\s\S]*?)\3\s*\)$/);
  const quoted = value.match(/^(["'])([\s\S]*?)\1\.map\(\s*(["'])([\s\S]*?)\3\s*\)$/);
  const plain = value.match(/^([\s\S]*?)\.map\(\s*(["']?)([\s\S]*?)\2\s*\)$/);

  let mappedLabel;
  let pattern;

  if (quotedInParens) {
    mappedLabel = quotedInParens[2].trim();
    pattern = quotedInParens[4].trim();
  } else if (quoted) {
    mappedLabel = quoted[2].trim();
    pattern = quoted[4].trim();
  } else if (plain) {
    mappedLabel = plain[1].trim();
    pattern = plain[3].trim();
  } else {
    return null;
  }

  if (!mappedLabel) {
    throw new Error(`Invalid map expression \"${expectedText}\": mapped label cannot be empty`);
  }

  if (!pattern) {
    throw new Error(`Invalid map expression \"${expectedText}\": pattern cannot be empty`);
  }

  return { mappedLabel, pattern };
}

function normalizeForContains(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripParentheticalQualifiers(value) {
  return String(value || "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts all XML tag values from an XML string.
 * E.g., <tag>value</tag> → ["tag:value"]
 * Ignores whitespace and formatting differences.
 * Returns an array of {tag, value} pairs.
 */
function extractXmlKeyValuePairs(xmlString) {
  if (!xmlString || typeof xmlString !== "string") {
    throw new Error("xmlString must be a non-empty string");
  }

  const pairs = [];
  // Match opening tags (with or without attributes) and simple content:
  // <tag>content</tag> or <tag attr="...">content</tag>
  // The opening tag may carry attributes (e.g. xmlns) before the closing ">".
  // Tag names may be namespace-qualified (e.g. <common_v54_0:Street>...</common_v54_0:Street>),
  // so the name can contain underscores, digits, hyphens, periods, and a colon-separated prefix.
  const tagRegex = /<([a-zA-Z_][\w.-]*(?::[a-zA-Z_][\w.-]*)?)(?:\s[^>]*)?>([^<]*?)<\/\1>/g;

  let match;
  while ((match = tagRegex.exec(xmlString)) !== null) {
    const tagName = match[1];
    const tagValue = match[2].trim();
    if (tagValue) {
      // Only include non-empty values
      pairs.push({ tag: tagName, value: tagValue });
    }
  }

  return pairs;
}

function extractXmlAttributeValues(xmlString) {
  if (!xmlString || typeof xmlString !== "string") {
    throw new Error("xmlString must be a non-empty string");
  }

  const values = [];
  const attributeRegex = /\s+[a-zA-Z_:][a-zA-Z0-9_.:-]*\s*=\s*(["'])(.*?)\1/g;

  let match;
  while ((match = attributeRegex.exec(xmlString)) !== null) {
    const attributeValue = match[2]?.trim();
    if (attributeValue) {
      values.push(attributeValue);
    }
  }

  return values;
}

// Reads named attributes off a block's opening tag only, so a nested child's attribute of the
// same name is never mistaken for the parent's. Namespace prefixes on the attribute are ignored.
function readXmlAttributes(blockXml, attributeNames) {
  const openTag = (String(blockXml || "").match(/<[^>]*>/) || [""])[0];
  const attributes = {};
  for (const name of attributeNames) {
    const match = openTag.match(
      new RegExp(`\\s(?:[\\w.-]+:)?${escapeRegex(name)}\\s*=\\s*(["'])(.*?)\\1`, "i")
    );
    attributes[name] = match ? match[2].trim() : null;
  }
  return attributes;
}

// Collects every value stored under `keyName`, at any depth, in document order.
function collectJsonValuesByKey(node, keyName, found = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectJsonValuesByKey(item, keyName, found));
    return found;
  }

  if (node && typeof node === "object") {
    Object.entries(node).forEach(([key, value]) => {
      if (key === keyName) {
        found.push(value);
      }
      collectJsonValuesByKey(value, keyName, found);
    });
  }

  return found;
}

// Returns every candidate block for a .block() expression, so the caller can pick the one holding
// the text it is looking for — the same way the XML branch gathers all <tag> blocks first. A
// dotted keyPath stays an explicit address from the root; a bare key also searches nested objects,
// because a supplier can bury the block (a Locator inside a ReceiptConfirmation) at a position
// that shifts between bookings, and pinning an array index there makes the assertion flaky.
function extractJsonBlocksByKey(jsonString, keyPath) {
  if (!jsonString || typeof jsonString !== "string") {
    throw new Error("jsonString must be a non-empty string");
  }

  if (!keyPath || typeof keyPath !== "string") {
    throw new Error("keyPath must be a non-empty string");
  }

  const parsed = tryParseCapturedJson(jsonString);
  if (parsed === null) {
    throw new Error(`Invalid JSON for block extraction: ${jsonString.substring(0, 100)}`);
  }

  const candidates = [];
  const atPath = getByPath(parsed, keyPath);
  if (atPath !== undefined) {
    candidates.push(atPath);
  }

  if (!/[.[\]]/.test(keyPath)) {
    collectJsonValuesByKey(parsed, keyPath).forEach((value) => {
      if (!candidates.includes(value)) {
        candidates.push(value);
      }
    });
  }

  if (candidates.length === 0) {
    throw new Error(`Key path "${keyPath}" not found in JSON object`);
  }

  return candidates;
}

const PayloadValidation = {
  setCapturedPayload(world, source, requestType, payload, filters = {}) {
    assertWorld(world);

    if (!world.capturedParserPayloads) {
      world.capturedParserPayloads = {};
    }

    const normalizedSource = normalizeSource(source);
    const normalizedRequestType = normalizeRequestType(requestType);
    const key = buildKey(normalizedSource, normalizedRequestType);

    // Monotonic counter, not the wall clock: several payloads can be stored inside the same
    // millisecond, and "the previous capture" has to be resolvable without ties.
    world.capturedPayloadSequence = (world.capturedPayloadSequence || 0) + 1;

    world.capturedParserPayloads[key] = {
      source: normalizedSource,
      requestType: normalizedRequestType,
      payload,
      capturedAt: new Date().toISOString(),
      sequence: world.capturedPayloadSequence,
      // rowKey identifies ONE stored call. The request and the response of that call share it,
      // which is what lets a later step capture the counterpart of this exact payload.
      rowKey: filters.rowKey || null,
      pinned: filters.pinned === true,
      filters: {
        tripId: filters.tripId || null,
        transactionId: filters.transactionId || null,
        sid: filters.sid || null,
      },
    };

    logger.info(`Payload stored: source="${normalizedSource}" requestType="${normalizedRequestType}"`, {
      key,
      payloadSize: payload ? payload.length : 0,
      capturedAt: world.capturedParserPayloads[key].capturedAt,
      rowKey: world.capturedParserPayloads[key].rowKey,
      pinned: world.capturedParserPayloads[key].pinned,
      filters: world.capturedParserPayloads[key].filters,
    });

    return world.capturedParserPayloads[key];
  },

  async capturePayloadByRequestType(page, world, source, requestType, options = {}) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);

    const normalizedSource = normalizeSource(source);
    const normalizedRequestType = normalizeRequestType(requestType);

    logger.info(`Capturing payload from Azure Storage`, {
      source: normalizedSource,
      requestType: normalizedRequestType,
      tripId: options.tripId,
      transactionId: options.transactionId,
      sid: options.sid,
    });

    const captureResult = await fetchPayloadFromStorage({
      source: normalizedSource,
      requestType: normalizedRequestType,
      tripId: options.tripId,
      transactionId: options.transactionId,
      sid: options.sid,
    });

    logger.info(`Payload captured successfully from Storage source="${normalizedSource}" requestType="${normalizedRequestType}"`, {
      payloadSize: captureResult.payload ? captureResult.payload.length : 0,
      blobName: captureResult.metadata?.blobName,
      timestamp: captureResult.metadata?.timestamp,
    });

    return this.setCapturedPayload(
      world,
      normalizedSource,
      normalizedRequestType,
      captureResult.payload,
      {
        tripId: options.tripId,
        transactionId: options.transactionId,
        sid: options.sid,
        rowKey: captureResult.metadata?.rowKey,
      }
    );
  },

  /**
   * Capture the latest payload of a request type logged at or after `notBefore`, and pin it.
   *
   * Why this exists: on a fixed, reused trip the storage already holds calls of the same type from
   * earlier runs. capturePayloadByRequestType can hand back one of those while this run's call is
   * still being published, and its assertion fallback scans them all — so an old call made on a
   * fixed build can turn a broken build green. The floor keeps old calls out of the lookup (the
   * lookup retries until a new one lands), and pinning keeps the assertion on this one call.
   *
   * @param {Date} notBefore - moment noted before the action that sends the call
   */
  async capturePayloadSentSince(page, world, source, requestType, notBefore, options = {}) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);

    if (!(notBefore instanceof Date) || Number.isNaN(notBefore.getTime())) {
      throw new Error(
        `[PayloadValidation.capturePayloadSentSince] no valid start time was noted, got: ${notBefore}. ` +
        `Run "I note the time before new payload requests are sent" before the action.`
      );
    }

    const normalizedSource = normalizeSource(source);
    const normalizedRequestType = normalizeRequestType(requestType);

    let captureResult;
    try {
      captureResult = await fetchPayloadFromStorage({
        source: normalizedSource,
        requestType: normalizedRequestType,
        tripId: options.tripId,
        transactionId: options.transactionId,
        sid: options.sid,
        notBefore,
      });
    } catch (error) {
      throw new Error(
        `[PayloadValidation.capturePayloadSentSince] No "${normalizedRequestType}" ${normalizedSource} was logged ` +
        `for trip ${options.tripId} at or after ${notBefore.toISOString()}. Older calls of this type were ignored on purpose. ` +
        `Underlying error: ${error.message}`
      );
    }

    return this.setCapturedPayload(
      world,
      normalizedSource,
      normalizedRequestType,
      captureResult.payload,
      {
        tripId: options.tripId,
        transactionId: options.transactionId,
        sid: options.sid,
        rowKey: captureResult.metadata?.rowKey,
        pinned: true,
      }
    );
  },

  /**
   * Capture the counterpart of the payload captured most recently for `previousSource`.
   *
   * Why this exists: {@link capturePayloadByRequestType} always takes the LATEST call of a request
   * type, and {@link expectCapturedPayloadContains} passes if ANY call of that type satisfies the
   * assertion. Both are right for duplicate parallel traffic, and both are wrong when a trip
   * deliberately sends several semantically different calls of the same type (e.g. one
   * post-creation Sabre TravelItineraryAddInfoRQ per frequent flyer carrier) — a response
   * assertion could then go green on a sibling call's response.
   *
   * This method reads the request/response pair of ONE call: it takes the rowKey of the payload
   * already captured (and possibly narrowed by an assertion) for `previousSource`, and stores the
   * other side of that same row. The stored record is marked `pinned`, so later assertions on it
   * never fall back to scanning other calls of the same type.
   *
   * @param {import('playwright').Page} page
   * @param {object} world - Cucumber world
   * @param {string} source - the side to capture now: "request" or "response"
   * @param {string} previousSource - the side already captured: "response" or "request"
   * @returns {Promise<object>} the stored payload record
   */
  async capturePayloadFromPreviousCapture(page, world, source, previousSource) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);

    const normalizedSource = normalizeSource(source);
    const normalizedPreviousSource = normalizeSource(previousSource);

    if (normalizedSource === "block" || normalizedPreviousSource === "block") {
      throw new Error(
        `Capturing from a previous capture only supports "request" and "response", got source="${source}" previous="${previousSource}"`
      );
    }

    if (normalizedSource === normalizedPreviousSource) {
      throw new Error(
        `Capturing the "${normalizedSource}" payload from the previous "${normalizedPreviousSource}" is a no-op. ` +
        `Use the opposite sources, e.g. capture the "response" from the previous "request".`
      );
    }

    const previousRecord = this.getLastCapturedPayloadBySource(world, normalizedPreviousSource);
    const requestType = previousRecord.requestType;

    if (!previousRecord.rowKey) {
      throw new Error(
        `The previously captured ${normalizedPreviousSource} payload for request type "${requestType}" has no stored rowKey, ` +
        `so its ${normalizedSource} counterpart cannot be resolved. Capture it with a Storage capture step first.`
      );
    }

    const identifiers = getScenarioIdentifiers(world);

    logger.info(`Capturing the counterpart of the previous capture`, {
      source: normalizedSource,
      previousSource: normalizedPreviousSource,
      requestType,
      rowKey: previousRecord.rowKey,
      ...identifiers,
    });

    let captureResult;
    try {
      captureResult = await fetchPayloadFromStorage({
        source: normalizedSource,
        requestType,
        tripId: identifiers.tripId || previousRecord.filters?.tripId,
        transactionId: identifiers.transactionId || previousRecord.filters?.transactionId,
        sid: identifiers.sid || previousRecord.filters?.sid,
        rowKey: previousRecord.rowKey,
      });
    } catch (error) {
      throw new Error(
        `Could not capture the ${normalizedSource} payload of the previously captured ` +
        `${normalizedPreviousSource} "${requestType}" (rowKey ${previousRecord.rowKey}). ` +
        `Underlying error: ${error.message}`
      );
    }

    const record = this.setCapturedPayload(
      world,
      normalizedSource,
      requestType,
      captureResult.payload,
      {
        tripId: captureResult.metadata?.tripId || identifiers.tripId,
        transactionId: captureResult.metadata?.transactionId || identifiers.transactionId,
        sid: captureResult.metadata?.sid || identifiers.sid,
        rowKey: captureResult.metadata?.rowKey || previousRecord.rowKey,
        pinned: true,
      }
    );

    logger.info(`Counterpart payload captured and pinned`, {
      source: normalizedSource,
      requestType,
      rowKey: record.rowKey,
      payloadSize: record.payload ? record.payload.length : 0,
    });

    return record;
  },

  /**
   * Return the payload record most recently stored for a given source, whichever request type it
   * belongs to. "Most recently stored" includes payloads promoted by an assertion's multi-match
   * scan, so this resolves to the call the previous step actually validated.
   */
  getLastCapturedPayloadBySource(world, source) {
    assertWorld(world);
    const normalizedSource = normalizeSource(source);

    const records = Object.values(world.capturedParserPayloads || {}).filter(
      (record) => record.source === normalizedSource
    );

    if (records.length === 0) {
      throw new Error(
        `No ${normalizedSource} payload has been captured yet. Run a capture step for it first.`
      );
    }

    return records.reduce((latest, record) =>
      (record.sequence || 0) > (latest.sequence || 0) ? record : latest
    );
  },

  getCapturedPayload(world, source, requestType) {
    assertWorld(world);
    const normalizedSource = normalizeSource(source);
    const normalizedRequestType = normalizeRequestType(requestType);

    const key = buildKey(normalizedSource, normalizedRequestType);
    const payloadRecord = world.capturedParserPayloads?.[key];

    if (!payloadRecord) {
      logger.warn(`Captured payload not found: source="${normalizedSource}" requestType="${normalizedRequestType}"`, {
        key,
        availableKeys: Object.keys(world.capturedParserPayloads || {}),
      });
      throw new Error(
        `No captured ${normalizedSource} payload found for request type \"${normalizedRequestType}\". Run a capture step first.`
      );
    }

    logger.debug(`Retrieving captured payload: source="${normalizedSource}" requestType="${normalizedRequestType}"`, {
      key,
      payloadSize: payloadRecord.payload ? payloadRecord.payload.length : 0,
      capturedAt: payloadRecord.capturedAt,
    });

    return payloadRecord;
  },

  /**
   * Parse a captured payload record's body as JSON, tolerating diagnostics a supplier appends
   * after the document. Throws when the body holds no JSON.
   */
  parseCapturedPayloadJson(payloadRecord) {
    if (!payloadRecord || typeof payloadRecord !== "object") {
      throw new Error(`[PayloadValidation.parseCapturedPayloadJson] "payloadRecord" must be a captured payload record, got: ${typeof payloadRecord}`);
    }
    return parseJsonPayload(payloadRecord.payload, payloadRecord.source, payloadRecord.requestType);
  },

  async expectCapturedPayloadContains(page, world, source, requestType, expectedText) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedText || typeof expectedText !== "string") {
      throw new Error("expectedText must be a non-empty string");
    }

    logger.debug(`Asserting payload contains: source="${source}" requestType="${requestType}" expectedText="${expectedText.substring(0, 100)}${expectedText.length > 100 ? "..." : ""}"`);

    // Inner assertion runner — receives a raw payload string, throws if assertion fails.
    // Returns { blockPayload, blockFilters } when a .block() match was found (caller stores it).
    const runAssertion = (rawPayload, filters = {}) => {
      const { payloadString, isJson } = coerceJsonPayload(rawPayload);

      const onKeyExpression = parseOnKeyExpression(expectedText);
      if (onKeyExpression) {
        const { key, typedValue, rawValue } = onKeyExpression;
        if (isJson) {
          const parsed = tryParseCapturedJson(rawPayload);
          const actual = parsed !== null ? getByPath(parsed, key) : undefined;
          if (actual === undefined) {
            throw new Error(`JSON key "${key}" not found in captured ${source} payload for request type "${requestType}"`);
          }
          if (!onKeyValuesMatch(actual, typedValue)) {
            throw new Error(`JSON key "${key}" expected ${JSON.stringify(typedValue)} but got ${JSON.stringify(actual)} in captured ${source} payload for request type "${requestType}"`);
          }
          logger.info(`onKey matched JSON: key="${key}" value=${JSON.stringify(typedValue)}`);
        } else {
          // Some captured payloads are wrappers containing JSON fragments instead of pure JSON.
          // Try key lookup in a JSON fragment before falling back to XML tag lookup.
          const safeKey = escapeRegex(key);
          const jsonFragmentRegex = new RegExp(
            `"${safeKey}"\\s*:\\s*(true|false|-?\\d+(?:\\.\\d+)?|"(?:\\\\.|[^"\\\\])*")`,
            "i"
          );
          const jsonFragmentMatch = rawPayload.match(jsonFragmentRegex);
          if (jsonFragmentMatch) {
            const actualRaw = jsonFragmentMatch[1];
            let actualValue;
            if (actualRaw === "true") {
              actualValue = true;
            } else if (actualRaw === "false") {
              actualValue = false;
            } else if (/^-?\d+$/.test(actualRaw)) {
              actualValue = Number.parseInt(actualRaw, 10);
            } else if (/^-?\d*\.\d+$/.test(actualRaw)) {
              actualValue = Number.parseFloat(actualRaw);
            } else {
              try {
                actualValue = JSON.parse(actualRaw);
              } catch {
                actualValue = actualRaw.replace(/^"|"$/g, "");
              }
            }

            if (!onKeyValuesMatch(actualValue, typedValue)) {
              throw new Error(`JSON key "${key}" expected ${JSON.stringify(typedValue)} but got ${JSON.stringify(actualValue)} in captured ${source} payload for request type "${requestType}"`);
            }

            logger.info(`onKey matched JSON fragment: key="${key}" value=${JSON.stringify(typedValue)}`);
            return {};
          }

          // XML: look for <key>value</key>
          const xmlRegex = new RegExp(`<${safeKey}>\\s*([^<]*)\\s*<\\/${safeKey}>`, "i");
          const xmlMatch = rawPayload.match(xmlRegex);
          if (xmlMatch) {
            const actualXml = xmlMatch[1].trim();
            if (actualXml !== rawValue) {
              throw new Error(`XML tag <${key}> expected "${rawValue}" but got "${actualXml}" in captured ${source} payload for request type "${requestType}"`);
            }
            logger.info(`onKey matched XML tag: key="${key}" value="${rawValue}"`);
            return {};
          }

          // XML attribute fallback: look for key="value" inside any opening tag.
          const xmlAttributeRegex = new RegExp(`\\b${safeKey}\\s*=\\s*(["'])(.*?)\\1`, "i");
          const xmlAttributeMatch = rawPayload.match(xmlAttributeRegex);
          if (!xmlAttributeMatch) {
            throw new Error(`XML key "${key}" (as tag or attribute) not found in captured ${source} payload for request type "${requestType}"`);
          }

          const actualAttributeValue = xmlAttributeMatch[2].trim();
          if (actualAttributeValue !== rawValue) {
            throw new Error(`XML attribute ${key} expected "${rawValue}" but got "${actualAttributeValue}" in captured ${source} payload for request type "${requestType}"`);
          }

          logger.info(`onKey matched XML attribute: key="${key}" value="${rawValue}"`);
        }
        return {};
      }

      const blockExpression = parseBlockExpression(expectedText);
      if (blockExpression) {
        if (isJson) {
          const candidates = extractJsonBlocksByKey(rawPayload, blockExpression.blockTag);
          const normalizedLookup = normalizeForContains(blockExpression.text);
          const matched = candidates.find((candidate) =>
            normalizeForContains(JSON.stringify(candidate)).includes(normalizedLookup)
          );
          if (matched === undefined) {
            throw new Error(`No block match for "${blockExpression.text}" found in extracted JSON key "${blockExpression.blockTag}" for request type "${requestType}"`);
          }

          logger.info(`Block match found in JSON: keyPath="${blockExpression.blockTag}" text="${blockExpression.text}" candidates=${candidates.length}`);
          return { blockPayload: JSON.stringify(matched, null, 2), blockFilters: {} };
        } else {
          const blocks = extractXmlBlocksByTag(rawPayload, blockExpression.blockTag);
          logger.debug(`Block expression parsed: blockTag="${blockExpression.blockTag}" text="${blockExpression.text}" blocksFound=${blocks.length}`);
          if (blocks.length === 0) {
            throw new Error(`No <${blockExpression.blockTag}> blocks found in captured ${source} payload for request type "${requestType}"`);
          }
          const normalizedLookup = normalizeForContains(blockExpression.text);
          const matchedBlock = blocks.find((block) => {
            const keyValuePairs = extractXmlKeyValuePairs(block);
            const attributeValues = extractXmlAttributeValues(block);

            const hasExactTagValueMatch = keyValuePairs.some(
              (pair) => normalizeForContains(pair.value) === normalizedLookup
            );
            const hasExactAttributeValueMatch = attributeValues.some(
              (value) => normalizeForContains(value) === normalizedLookup
            );

            return hasExactTagValueMatch || hasExactAttributeValueMatch;
          });
          if (!matchedBlock) {
            throw new Error(`No <${blockExpression.blockTag}> block with exact tag-value or attribute-value match for "${blockExpression.text}" found in captured ${source} payload for request type "${requestType}"`);
          }
          logger.info(`Block match found: blockTag="${blockExpression.blockTag}" text="${blockExpression.text}"`);
          return { blockPayload: matchedBlock, blockFilters: {} };
        }
      }

      const mapExpression = parseMapExpression(expectedText);
      if (mapExpression) {
        const patternRegex = new RegExp(globToRegexPattern(mapExpression.pattern), "i");
        if (isJson) {
          if (!patternRegex.test(payloadString)) {
            throw new Error(`Map expression failed for "${mapExpression.mappedLabel}": no value matched pattern "${mapExpression.pattern}" in captured JSON payload for request type "${requestType}"`);
          }
          logger.info(`Map expression matched in JSON: mappedLabel="${mapExpression.mappedLabel}" pattern="${mapExpression.pattern}"`);
        } else {
          const locationCodeRegex = /<locationCode>\s*([^<]+?)\s*<\/locationCode>/gi;
          const locationCodes = [];
          let locationCodeMatch;
          while ((locationCodeMatch = locationCodeRegex.exec(rawPayload)) !== null) {
            locationCodes.push(locationCodeMatch[1].trim());
          }
          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          const attributeValues = extractXmlAttributeValues(rawPayload);
          const searchableValues = [
            ...locationCodes,
            ...keyValuePairs.map((pair) => pair.value),
            ...attributeValues,
          ];

          logger.debug(
            `Map expression evaluation: pattern="${mapExpression.pattern}" searchableValues=${searchableValues.length}`,
            { sampleValues: searchableValues.slice(0, 10) }
          );

          const hasPatternMatch = searchableValues.some((value) => patternRegex.test(value));

          // Semantic fallback: when map is called as label.map(label),
          // allow matching the qualifier-stripped label (e.g., "Lisbon (City Center)" -> "Lisbon").
          const normalizedPattern = normalizeForContains(mapExpression.pattern);
          const normalizedMappedLabel = normalizeForContains(mapExpression.mappedLabel);
          const isLabelPattern = normalizedPattern === normalizedMappedLabel;
          let hasSemanticLabelMatch = false;
          if (!hasPatternMatch && isLabelPattern) {
            const simplifiedLabel = stripParentheticalQualifiers(mapExpression.mappedLabel);
            if (simplifiedLabel) {
              const normalizedSimplifiedLabel = normalizeForContains(simplifiedLabel);
              hasSemanticLabelMatch = searchableValues.some(
                (value) => normalizeForContains(value) === normalizedSimplifiedLabel
              );
            }
          }

          const hasMappedCode = hasPatternMatch || hasSemanticLabelMatch;
          if (!hasMappedCode) {
            throw new Error(`Map expression failed for "${mapExpression.mappedLabel}": no XML value or attribute matched pattern "${mapExpression.pattern}"`);
          }
          logger.info(`Map expression matched: mappedLabel="${mapExpression.mappedLabel}" pattern="${mapExpression.pattern}"`);
        }
        return {};
      }

      const splitParts = parseSplitExpression(expectedText);
      if (splitParts && splitParts.length > 0) {
        let missingParts;
        if (!isJson) {
          // XML: each split part must be an exact value of some XML tag (case-insensitive, whitespace-normalized)
          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          missingParts = splitParts.filter((part) => {
            const normalizedPart = normalizeForContains(part);
            return !keyValuePairs.some((pair) => normalizeForContains(pair.value) === normalizedPart);
          });
        } else {
          // JSON: substring match across the full payload string
          const normalizedPayload = normalizeForContains(payloadString);
          missingParts = splitParts.filter((part) => !normalizedPayload.includes(normalizeForContains(part)));
        }
        if (missingParts.length > 0) {
          throw new Error(`Expected split parts not found as exact values in captured ${source} payload for request type "${requestType}": ${missingParts.join(", ")}`);
        }
        return {};
      }

      if (source.toLowerCase() === "block") {
        const normalizedLookup = normalizeForContains(expectedText);
        if (isJson) {
          if (!normalizeForContains(payloadString).includes(normalizedLookup)) {
            throw new Error(`No exact match found for "${expectedText}" in captured block JSON payload for request type "${requestType}".`);
          }
        } else {
          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          const hasExactMatch = keyValuePairs.some((pair) => normalizeForContains(pair.value) === normalizedLookup);
          if (!hasExactMatch) {
            throw new Error(`No exact key-value match found for "${expectedText}" in captured block payload for request type "${requestType}".`);
          }
        }
        return {};
      }

      // Plain text substring match
      if (!payloadString.includes(expectedText)) {
        logger.warn(`Plain text match failed: expectedText="${expectedText}"`);
        throw new Error(`Expected text "${expectedText}" not found in captured ${source} payload for request type "${requestType}"`);
      }
      logger.info(`Plain text match found: expectedText="${expectedText.substring(0, 100)}${expectedText.length > 100 ? "..." : ""}"`);
      return {};
    };

    // Try the currently captured (latest) payload first — fast path.
    let firstError = null;
    let pinnedRecord = null;
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      if (payloadRecord.pinned) {
        pinnedRecord = payloadRecord;
      }
      const result = runAssertion(payloadRecord.payload, payloadRecord.filters || {});
      if (result.blockPayload) {
        this.setCapturedPayload(world, "block", requestType, result.blockPayload, result.blockFilters);
      }
      return;
    } catch (err) {
      firstError = err;
      logger.debug(`Fast-path assertion failed: ${err.message}`);
    }

    // A pinned payload was captured as the counterpart of ONE specific call. Scanning sibling
    // calls of the same request type is exactly what pinning exists to prevent, so fail here.
    if (pinnedRecord) {
      throw new Error(
        `Assertion failed on the pinned ${source} payload for request type "${requestType}" ` +
        `(rowKey ${pinnedRecord.rowKey}). Other calls of this request type were NOT checked, ` +
        `because this payload was captured from a specific previous capture. ` +
        `Error: ${firstError.message}`
      );
    }

    // Fallback: same request type can appear multiple times (parallel traffic).
    // Scan all recent matching entries and pass if any satisfies the assertion.
    const identifiers = getScenarioIdentifiers(world);
    let multiMatchResult;
    try {
      multiMatchResult = await fetchPayloadFromStorage({
        source,
        requestType,
        tripId: identifiers.tripId,
        transactionId: identifiers.transactionId,
        sid: identifiers.sid,
        returnAllMatches: true,
      });
    } catch {
      // Storage fallback unavailable — surface the original assertion error.
      throw firstError;
    }

    logger.debug(`Multi-match fallback: scanning ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);

    for (const match of multiMatchResult.matches) {
      try {
        const result = runAssertion(match.payload, {
          tripId: match.metadata.tripId,
          transactionId: match.metadata.transactionId,
          sid: match.metadata.sid,
        });
        // Found a matching candidate — promote it to the cached payload.
        this.setCapturedPayload(world, source, requestType, match.payload, {
          tripId: match.metadata.tripId,
          transactionId: match.metadata.transactionId,
          sid: match.metadata.sid,
          rowKey: match.metadata.rowKey,
        });
        if (result.blockPayload) {
          this.setCapturedPayload(world, "block", requestType, result.blockPayload, result.blockFilters);
        }
        logger.info(`Multi-match fallback succeeded: found matching payload among ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);
        return;
      } catch {
        // This candidate does not match — try the next.
      }
    }

    throw new Error(
      `Expected content not found in any of the ${multiMatchResult.metadata.returnedMatches} captured ${source} payload(s) for request type "${requestType}". ` +
      `Last error on fast path: ${firstError.message}`
    );
  },

  /**
   * Passes when the captured payload contains at least one of the given texts. Each option goes
   * through expectCapturedPayloadContains, so pinning and the multi-call fallback behave the same.
   */
  async expectCapturedPayloadContainsAny(page, world, source, requestType, expectedTexts) {
    if (!Array.isArray(expectedTexts) || expectedTexts.length === 0) {
      throw new Error("expectedTexts must be a non-empty array");
    }

    const errors = [];
    for (const expectedText of expectedTexts) {
      try {
        await this.expectCapturedPayloadContains(page, world, source, requestType, expectedText);
        logger.info(`Captured ${source} payload for request type "${requestType}" contains "${expectedText}"`);
        return;
      } catch (err) {
        errors.push(`"${expectedText}": ${err.message}`);
      }
    }

    throw new Error(
      `Captured ${source} payload for request type "${requestType}" contains none of the expected texts:\n` +
      errors.join("\n")
    );
  },

  async expectCapturedPayloadNotContains(page, world, source, requestType, expectedText) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedText || typeof expectedText !== "string") {
      throw new Error("expectedText must be a non-empty string");
    }

    logger.debug(`Asserting payload does not contain: source="${source}" requestType="${requestType}" expectedText="${expectedText.substring(0, 100)}${expectedText.length > 100 ? "..." : ""}"`);

    const runAssertion = (rawPayload) => {
      const { payloadString, isJson } = coerceJsonPayload(rawPayload);

      const onKeyExpression = parseOnKeyExpression(expectedText);
      if (onKeyExpression) {
        const { key, typedValue, rawValue } = onKeyExpression;
        if (isJson) {
          const parsed = tryParseCapturedJson(rawPayload);
          const actual = parsed !== null ? getByPath(parsed, key) : undefined;
          if (actual !== undefined && onKeyValuesMatch(actual, typedValue)) {
            throw new Error(`JSON key "${key}" unexpectedly matched ${JSON.stringify(typedValue)} in captured ${source} payload for request type "${requestType}"`);
          }
          logger.info(`onKey not contains passed for JSON: key="${key}" value=${JSON.stringify(typedValue)}`);
        } else {
          const safeKey = escapeRegex(key);
          const jsonFragmentRegex = new RegExp(
            `"${safeKey}"\\s*:\\s*(true|false|-?\\d+(?:\\.\\d+)?|"(?:\\\\.|[^"\\\\])*")`,
            "i"
          );
          const jsonFragmentMatch = rawPayload.match(jsonFragmentRegex);
          if (jsonFragmentMatch) {
            const actualRaw = jsonFragmentMatch[1];
            let actualValue;
            if (actualRaw === "true") {
              actualValue = true;
            } else if (actualRaw === "false") {
              actualValue = false;
            } else if (/^-?\d+$/.test(actualRaw)) {
              actualValue = Number.parseInt(actualRaw, 10);
            } else if (/^-?\d*\.\d+$/.test(actualRaw)) {
              actualValue = Number.parseFloat(actualRaw);
            } else {
              try {
                actualValue = JSON.parse(actualRaw);
              } catch {
                actualValue = actualRaw.replace(/^"|"$/g, "");
              }
            }

            if (onKeyValuesMatch(actualValue, typedValue)) {
              throw new Error(`JSON key "${key}" unexpectedly matched ${JSON.stringify(typedValue)} in captured ${source} payload for request type "${requestType}"`);
            }

            logger.info(`onKey not contains passed for JSON fragment: key="${key}" value=${JSON.stringify(typedValue)}`);
            return {};
          }

          const xmlRegex = new RegExp(`<${safeKey}>\\s*([^<]*)\\s*<\\/${safeKey}>`, "i");
          const xmlMatch = rawPayload.match(xmlRegex);
          if (xmlMatch) {
            const actualXml = xmlMatch[1].trim();
            if (actualXml === rawValue) {
              throw new Error(`XML tag <${key}> unexpectedly matched "${rawValue}" in captured ${source} payload for request type "${requestType}"`);
            }
          }

          const xmlAttributeRegex = new RegExp(`\\b${safeKey}\\s*=\\s*(["'])(.*?)\\1`, "i");
          const xmlAttributeMatch = rawPayload.match(xmlAttributeRegex);
          if (xmlAttributeMatch) {
            const actualAttributeValue = xmlAttributeMatch[2].trim();
            if (actualAttributeValue === rawValue) {
              throw new Error(`XML attribute ${key} unexpectedly matched "${rawValue}" in captured ${source} payload for request type "${requestType}"`);
            }
          }

          logger.info(`onKey not contains passed for XML: key="${key}" value="${rawValue}"`);
        }
        return {};
      }

      const blockExpression = parseBlockExpression(expectedText);
      if (blockExpression) {
        if (isJson) {
          const candidates = extractJsonBlocksByKey(rawPayload, blockExpression.blockTag);
          const normalizedLookup = normalizeForContains(blockExpression.text);
          if (candidates.some((candidate) => normalizeForContains(JSON.stringify(candidate)).includes(normalizedLookup))) {
            throw new Error(`Unexpected block match for "${blockExpression.text}" found in extracted JSON key "${blockExpression.blockTag}" for request type "${requestType}"`);
          }

          logger.info(`Block not contains passed in JSON: keyPath="${blockExpression.blockTag}" text="${blockExpression.text}"`);
          return {};
        }

        const blocks = extractXmlBlocksByTag(rawPayload, blockExpression.blockTag);
        if (blocks.length === 0) {
          logger.info(`Block not contains passed: no <${blockExpression.blockTag}> blocks found`);
          return {};
        }

        const normalizedLookup = normalizeForContains(blockExpression.text);
        const matchedBlock = blocks.find((block) => {
          const keyValuePairs = extractXmlKeyValuePairs(block);
          return keyValuePairs.some((pair) => normalizeForContains(pair.value) === normalizedLookup);
        });

        if (matchedBlock) {
          throw new Error(`Unexpected <${blockExpression.blockTag}> block with exact key-value match for "${blockExpression.text}" found in captured ${source} payload for request type "${requestType}"`);
        }

        logger.info(`Block not contains passed: blockTag="${blockExpression.blockTag}" text="${blockExpression.text}"`);
        return {};
      }

      const mapExpression = parseMapExpression(expectedText);
      if (mapExpression) {
        const patternRegex = new RegExp(globToRegexPattern(mapExpression.pattern), "i");
        if (isJson) {
          if (patternRegex.test(payloadString)) {
            throw new Error(`Map expression unexpectedly matched for "${mapExpression.mappedLabel}": found value matching pattern "${mapExpression.pattern}" in captured JSON payload for request type "${requestType}"`);
          }
          logger.info(`Map not contains passed in JSON: mappedLabel="${mapExpression.mappedLabel}" pattern="${mapExpression.pattern}"`);
        } else {
          const locationCodeRegex = /<locationCode>\s*([^<]+?)\s*<\/locationCode>/gi;
          const locationCodes = [];
          let locationCodeMatch;
          while ((locationCodeMatch = locationCodeRegex.exec(rawPayload)) !== null) {
            locationCodes.push(locationCodeMatch[1].trim());
          }

          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          const attributeValues = extractXmlAttributeValues(rawPayload);
          const searchableValues = [
            ...locationCodes,
            ...keyValuePairs.map((pair) => pair.value),
            ...attributeValues,
          ];

          const hasPatternMatch = searchableValues.some((value) => patternRegex.test(value));

          const normalizedPattern = normalizeForContains(mapExpression.pattern);
          const normalizedMappedLabel = normalizeForContains(mapExpression.mappedLabel);
          const isLabelPattern = normalizedPattern === normalizedMappedLabel;
          let hasSemanticLabelMatch = false;
          if (!hasPatternMatch && isLabelPattern) {
            const simplifiedLabel = stripParentheticalQualifiers(mapExpression.mappedLabel);
            if (simplifiedLabel) {
              const normalizedSimplifiedLabel = normalizeForContains(simplifiedLabel);
              hasSemanticLabelMatch = searchableValues.some(
                (value) => normalizeForContains(value) === normalizedSimplifiedLabel
              );
            }
          }

          const hasMappedCode = hasPatternMatch || hasSemanticLabelMatch;
          if (hasMappedCode) {
            throw new Error(`Map expression unexpectedly matched for "${mapExpression.mappedLabel}": found XML value or attribute matching pattern "${mapExpression.pattern}"`);
          }
          logger.info(`Map not contains passed: mappedLabel="${mapExpression.mappedLabel}" pattern="${mapExpression.pattern}"`);
        }
        return {};
      }

      const splitParts = parseSplitExpression(expectedText);
      if (splitParts && splitParts.length > 0) {
        let foundParts;
        if (!isJson) {
          // XML: each split part uses exact XML tag value matching.
          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          foundParts = splitParts.filter((part) => {
            const normalizedPart = normalizeForContains(part);
            return keyValuePairs.some((pair) => normalizeForContains(pair.value) === normalizedPart);
          });
        } else {
          // JSON: substring check across the full payload string.
          const normalizedPayload = normalizeForContains(payloadString);
          foundParts = splitParts.filter((part) => normalizedPayload.includes(normalizeForContains(part)));
        }
        if (foundParts.length > 0) {
          throw new Error(`Expected split parts NOT to be present in captured ${source} payload for request type "${requestType}", but found: ${foundParts.join(", ")}`);
        }
        return {};
      }

      if (source.toLowerCase() === "block") {
        const normalizedLookup = normalizeForContains(expectedText);
        if (isJson) {
          if (normalizeForContains(payloadString).includes(normalizedLookup)) {
            throw new Error(`Unexpected match found for "${expectedText}" in captured block JSON payload for request type "${requestType}".`);
          }
        } else {
          const keyValuePairs = extractXmlKeyValuePairs(rawPayload);
          const hasExactMatch = keyValuePairs.some((pair) => normalizeForContains(pair.value) === normalizedLookup);
          if (hasExactMatch) {
            throw new Error(`Unexpected exact key-value match found for "${expectedText}" in captured block payload for request type "${requestType}".`);
          }
        }
        return {};
      }

      if (payloadString.includes(expectedText)) {
        throw new Error(`Unexpected text "${expectedText}" found in captured ${source} payload for request type "${requestType}"`);
      }

      logger.info(`Plain text not contains passed: expectedText="${expectedText.substring(0, 100)}${expectedText.length > 100 ? "..." : ""}"`);
      return {};
    };

    let firstError = null;
    let pinnedRecord = null;
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      if (payloadRecord.pinned) {
        pinnedRecord = payloadRecord;
      }
      runAssertion(payloadRecord.payload);
      return;
    } catch (err) {
      firstError = err;
      logger.debug(`Fast-path not-contains assertion failed: ${err.message}`);
    }

    // See the same guard in expectCapturedPayloadContains: a pinned payload must never be
    // satisfied by a sibling call of the same request type.
    if (pinnedRecord) {
      throw new Error(
        `Not-contains assertion failed on the pinned ${source} payload for request type "${requestType}" ` +
        `(rowKey ${pinnedRecord.rowKey}). Other calls of this request type were NOT checked, ` +
        `because this payload was captured from a specific previous capture. ` +
        `Error: ${firstError.message}`
      );
    }

    const identifiers = getScenarioIdentifiers(world);
    let multiMatchResult;
    try {
      multiMatchResult = await fetchPayloadFromStorage({
        source,
        requestType,
        tripId: identifiers.tripId,
        transactionId: identifiers.transactionId,
        sid: identifiers.sid,
        returnAllMatches: true,
      });
    } catch {
      throw firstError;
    }

    logger.debug(`Multi-match fallback (not contains): scanning ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);

    for (const match of multiMatchResult.matches) {
      try {
        runAssertion(match.payload);
        this.setCapturedPayload(world, source, requestType, match.payload, {
          tripId: match.metadata.tripId,
          transactionId: match.metadata.transactionId,
          sid: match.metadata.sid,
          rowKey: match.metadata.rowKey,
        });
        logger.info(`Multi-match fallback (not contains) succeeded: found matching payload among ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);
        return;
      } catch {
        // This candidate does not satisfy the not-contains assertion.
      }
    }

    throw new Error(
      `Expected content to be absent in all checked payloads, but no candidate satisfied not-contains for ${source} request type "${requestType}". ` +
      `Last error on fast path: ${firstError.message}`
    );
  },

  async expectCapturedPayloadPathExists(page, world, source, requestType, path) {
    if (!page) {
      throw new Error("page is required");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const json = parseJsonPayload(payloadRecord.payload, source, requestType);
    const value = getByPath(json, path);

    if (value === undefined || value === null) {
      throw new Error(
        `Path "${path}" not found in captured ${source} payload for request type "${requestType}"`
      );
    }
  },

  // Carries a value from one payload to an assertion on another. The identifiers a supplier hands
  // back in a search response are the only proof that a later request re-sent the SAME offer
  // rather than a re-searched substitute, and their values are unknowable before the run. Stored
  // on the World so any later assertion can reference it as {name} via resolveWorldPlaceholders().
  async storeCapturedPayloadPathValue(page, world, source, requestType, path, variableName) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!variableName || typeof variableName !== "string") {
      throw new Error("variableName must be a non-empty string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const json = parseJsonPayload(payloadRecord.payload, source, requestType);
    const value = getByPath(json, path);

    if (value === undefined || value === null) {
      throw new Error(
        `Path "${path}" not found in captured ${source} payload for request type "${requestType}"`
      );
    }

    // Only a primitive can be substituted into an expected string; an object would silently
    // resolve to "[object Object]" and make the later assertion pass or fail for the wrong reason.
    if (typeof value === "object") {
      throw new Error(
        `Path "${path}" in captured ${source} payload for request type "${requestType}" resolved to ${Array.isArray(value) ? "an array" : "an object"}, not a single value. Point the path at a leaf.`
      );
    }

    world[variableName] = String(value);
    return world[variableName];
  },

  async expectCapturedPayloadPath(page, world, source, requestType, path, operator, expectedValue) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!operator || typeof operator !== "string") {
      throw new Error("operator must be a non-empty string");
    }

    if (expectedValue === undefined || expectedValue === null || typeof expectedValue !== "string") {
      throw new Error("expectedValue must be a non-empty string");
    }

    const normalizedOperator = operator.trim().toLowerCase();
    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const json = parseJsonPayload(payloadRecord.payload, source, requestType);
    const value = getByPath(json, path);

    if (value === undefined || value === null) {
      throw new Error(
        `Path "${path}" not found in captured ${source} payload for request type "${requestType}"`
      );
    }

    const actualText = String(value);

    try {
      if (["equals", "equal", "be", "=="].includes(normalizedOperator)) {
        expect(actualText).toBe(expectedValue);
        return;
      }

      if (["contains", "include"].includes(normalizedOperator)) {
        expect(actualText).toContain(expectedValue);
        return;
      }

      if (["matches", "match", "regex"].includes(normalizedOperator)) {
        const regex = new RegExp(expectedValue);
        expect(regex.test(actualText)).toBeTruthy();
        return;
      }

      throw new Error(
        `Unsupported operator "${operator}". Supported operators: equals, contains, matches`
      );
    } catch (error) {
      throw new Error(
        `Path "${path}" value does not match expected expression. Expected ${normalizedOperator} "${expectedValue}", got: "${actualText}"`
      );
    }
  },

  async expectCapturedPayloadPathContains(page, world, source, requestType, path, expectedValue) {
    if (!page) {
      throw new Error("page is required");
    }

    if (expectedValue === undefined || expectedValue === null || typeof expectedValue !== "string") {
      throw new Error("expectedValue must be a non-empty string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const json = parseJsonPayload(payloadRecord.payload, source, requestType);
    const value = getByPath(json, path);

    if (value === undefined || value === null) {
      throw new Error(
        `Path "${path}" not found in captured ${source} payload for request type "${requestType}"`
      );
    }

    const actualText = String(value);
    if (!actualText.includes(expectedValue)) {
      throw new Error(
        `Path "${path}" expected to contain "${expectedValue}", but got: "${actualText}"`
      );
    }

    logger.info(`Path "${path}" contains expected value: "${expectedValue}"`);
  },

  async expectCapturedPayloadPathNotContains(page, world, source, requestType, path, expectedValue) {
    if (!page) {
      throw new Error("page is required");
    }

    if (expectedValue === undefined || expectedValue === null || typeof expectedValue !== "string") {
      throw new Error("expectedValue must be a non-empty string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const json = parseJsonPayload(payloadRecord.payload, source, requestType);
    const value = getByPath(json, path);

    if (value === undefined || value === null) {
      throw new Error(
        `Path "${path}" not found in captured ${source} payload for request type "${requestType}"`
      );
    }

    const actualText = String(value);
    if (actualText.includes(expectedValue)) {
      throw new Error(
        `Path "${path}" expected not to contain "${expectedValue}", but got: "${actualText}"`
      );
    }

    logger.info(`Path "${path}" does not contain: "${expectedValue}"`);
  },

  async expectCapturedPayloadContainsXmlBlock(page, world, source, requestType, expectedXmlBlock) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedXmlBlock || typeof expectedXmlBlock !== "string") {
      throw new Error("expectedXmlBlock must be a non-empty XML string");
    }

    // Extract all tag values from expected XML
    const expectedPairs = extractXmlKeyValuePairs(expectedXmlBlock);

    if (expectedPairs.length === 0) {
      throw new Error(
        `No XML key-value pairs found in expected block for ${source} payload for request type "${requestType}"`
      );
    }

    // Inner assertion runner — receives a raw payload string, throws if any expected value is absent.
    const runAssertion = (payload) => {
      const missingValues = [];
      for (const pair of expectedPairs) {
        if (!payload.includes(pair.value)) {
          missingValues.push({ tag: pair.tag, value: pair.value });
        }
      }

      if (missingValues.length > 0) {
        const missing = missingValues.map((m) => `<${m.tag}>${m.value}</${m.tag}>`).join(", ");
        throw new Error(
          `Expected XML values not found in captured ${source} payload for request type "${requestType}". Missing: ${missing}`
        );
      }
    };

    // Try the currently captured (latest) payload first — fast path.
    let firstError = null;
    let pinnedRecord = null;
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      if (payloadRecord.pinned) {
        pinnedRecord = payloadRecord;
      }
      runAssertion(payloadRecord.payload);
      return;
    } catch (err) {
      firstError = err;
      logger.debug(`Fast-path XML block assertion failed: ${err.message}`);
    }

    // A pinned payload was captured as the counterpart of ONE specific call. Scanning sibling
    // calls of the same request type is exactly what pinning exists to prevent, so fail here.
    if (pinnedRecord) {
      throw new Error(
        `Assertion failed on the pinned ${source} payload for request type "${requestType}" ` +
        `(rowKey ${pinnedRecord.rowKey}). Other calls of this request type were NOT checked, ` +
        `because this payload was captured from a specific previous capture. ` +
        `Error: ${firstError.message}`
      );
    }

    // Fallback: the same request type can cover several distinct calls, and the capture always
    // takes the latest one. Amadeus cryptic commands are the clearest case — one save fires
    // RFATRIIS, the 2/ID-<number> update, ER and IG under a single request type, all within the
    // same second. Scan every recent matching entry and pass if any satisfies the assertion.
    const identifiers = getScenarioIdentifiers(world);
    let multiMatchResult;
    try {
      multiMatchResult = await fetchPayloadFromStorage({
        source,
        requestType,
        tripId: identifiers.tripId,
        transactionId: identifiers.transactionId,
        sid: identifiers.sid,
        returnAllMatches: true,
      });
    } catch {
      // Storage fallback unavailable — surface the original assertion error.
      throw firstError;
    }

    logger.debug(`Multi-match fallback: scanning ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);

    for (const match of multiMatchResult.matches) {
      try {
        runAssertion(match.payload);
        // Found a matching candidate — promote it to the cached payload.
        this.setCapturedPayload(world, source, requestType, match.payload, {
          tripId: match.metadata.tripId,
          transactionId: match.metadata.transactionId,
          sid: match.metadata.sid,
          rowKey: match.metadata.rowKey,
        });
        logger.info(`Multi-match fallback succeeded: found matching XML block among ${multiMatchResult.metadata.returnedMatches} candidate(s) for requestType="${requestType}"`);
        return;
      } catch {
        // This candidate does not match — try the next.
      }
    }

    throw new Error(
      `Expected XML values not found in any of the ${multiMatchResult.metadata.returnedMatches} captured ${source} payload(s) for request type "${requestType}". ` +
      `Last error on fast path: ${firstError.message}`
    );
  },

  /**
   * Deep-subset check of a captured JSON payload against an expected JSON block.
   * By default an expected `null` requires the key to be present with a null value. With
   * `nullMatchesMissing`, an expected `null` is also met by an absent key — for suppliers whose
   * serializer drops null properties (e.g. the TransferzPay-by-creditcard log omits refusalReason).
   *
   * @param {{nullMatchesMissing?: boolean}} [options]
   */
  async expectCapturedPayloadContainsJsonBlock(page, world, source, requestType, expectedJsonBlock, { nullMatchesMissing = false } = {}) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedJsonBlock || typeof expectedJsonBlock !== "string") {
      throw new Error("expectedJsonBlock must be a non-empty JSON string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const payload = payloadRecord.payload;

    let expectedJson;
    let actualJson;

    try {
      expectedJson = JSON.parse(expectedJsonBlock);
    } catch {
      throw new Error(
        `Invalid JSON in expected block for ${source} payload for request type "${requestType}": ${expectedJsonBlock.substring(0, 100)}`
      );
    }

    actualJson = tryParseCapturedJson(payload);
    if (actualJson === null) {
      throw new Error(
        `Captured ${source} payload for request type "${requestType}" is not valid JSON for JSON block validation`
      );
    }

    // Deep subset check — all keys in expectedJson must exist in actualJson with matching values.
    // Arrays are validated as:
    // - expected [] => actual must be []
    // - expected [x, y] => each expected item must be matched by at least one actual item
    const validateJsonBlock = (expected, actual, path = "") => {
      if (Array.isArray(expected)) {
        if (!Array.isArray(actual)) {
          return [`Expected array at "${path}", got ${typeof actual}`];
        }

        if (expected.length === 0) {
          return actual.length === 0
            ? []
            : [`At "${path}": expected empty array, got ${JSON.stringify(actual)}`];
        }

        const errors = [];
        for (const expectedItem of expected) {
          const candidateErrors = actual.map((actualItem, index) => ({
            index,
            errors: validateJsonBlock(expectedItem, actualItem, `${path}[${index}]`),
          }));

          const exactMatch = candidateErrors.find((candidate) => candidate.errors.length === 0);
          if (!exactMatch) {
            const bestCandidate = candidateErrors.reduce((best, current) => {
              if (!best) return current;
              return current.errors.length < best.errors.length ? current : best;
            }, null);

            if (bestCandidate && bestCandidate.errors.length > 0) {
              errors.push(bestCandidate.errors[0]);
            } else {
              errors.push(`At "${path}": expected item not found`);
            }
          }
        }

        return errors;
      }

      if (typeof expected === "object" && expected !== null) {
        if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
          return [`Expected object at "${path}", got ${Array.isArray(actual) ? "array" : typeof actual}`];
        }

        const errors = [];
        for (const [key, expectedValue] of Object.entries(expected)) {
          const currentPath = path ? `${path}.${key}` : key;
          const actualValue = actual[key];

          if (actualValue === undefined) {
            if (!(nullMatchesMissing && expectedValue === null)) {
              errors.push(`Missing key "${currentPath}"`);
            }
            continue;
          }

          errors.push(...validateJsonBlock(expectedValue, actualValue, currentPath));
        }

        return errors;
      }

      return actual === expected
        ? []
        : [`At "${path}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
    };

    const errors = validateJsonBlock(expectedJson, actualJson);
    if (errors.length > 0) {
      const firstError = errors[0];
      throw new Error(
        `Expected JSON block not found in captured ${source} payload for request type "${requestType}".\nError:\n${firstError}`
      );
    }

    logger.info(`JSON block validated successfully: source="${source}" requestType="${requestType}"`);
  },

  async expectCapturedPayloadNotContainsXmlBlock(page, world, source, requestType, expectedXmlBlock) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedXmlBlock || typeof expectedXmlBlock !== "string") {
      throw new Error("expectedXmlBlock must be a non-empty XML string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const payload = payloadRecord.payload;

    const expectedPairs = extractXmlKeyValuePairs(expectedXmlBlock);

    if (expectedPairs.length === 0) {
      throw new Error(
        `No XML key-value pairs found in expected block for ${source} payload for request type "${requestType}"`
      );
    }

    const foundValues = [];
    for (const pair of expectedPairs) {
      // Use >value< boundary to avoid matching substrings (e.g. "Inclusive" inside "Inclusive Plus")
      // Works with namespaced tags (e.g. <xs:Value>Inclusive</xs:Value>) unlike full-element string match
      if (payload.includes(`>${pair.value}<`)) {
        foundValues.push({ tag: pair.tag, value: pair.value });
      }
    }

    if (foundValues.length > 0) {
      const found = foundValues.map((m) => `<${m.tag}>${m.value}</${m.tag}>`).join(", ");
      throw new Error(
        `Expected XML values NOT to be in captured ${source} payload for request type "${requestType}", but found: ${found}`
      );
    }

    logger.info(`XML block confirmed not present in payload: source="${source}" requestType="${requestType}"`);
  },

  async expectCapturedPayloadNotContainsJsonBlock(page, world, source, requestType, expectedJsonBlock) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedJsonBlock || typeof expectedJsonBlock !== "string") {
      throw new Error("expectedJsonBlock must be a non-empty JSON string");
    }

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const payload = payloadRecord.payload;

    let expectedJson;
    let actualJson;

    try {
      expectedJson = JSON.parse(expectedJsonBlock);
    } catch {
      throw new Error(
        `Invalid JSON in expected block for ${source} payload for request type "${requestType}": ${expectedJsonBlock.substring(0, 100)}`
      );
    }

    actualJson = tryParseCapturedJson(payload);
    if (actualJson === null) {
      throw new Error(
        `Captured ${source} payload for request type "${requestType}" is not valid JSON for JSON block validation`
      );
    }

    const validateJsonBlockNotPresent = (expected, actual, path = "") => {
      const foundPairs = [];

      for (const [key, expectedValue] of Object.entries(expected)) {
        const currentPath = path ? `${path}.${key}` : key;
        const actualValue = actual[key];

        if (actualValue !== undefined) {
          if (typeof expectedValue === "object" && expectedValue !== null && !Array.isArray(expectedValue)) {
            if (typeof actualValue === "object" && actualValue !== null && !Array.isArray(actualValue)) {
              foundPairs.push(...validateJsonBlockNotPresent(expectedValue, actualValue, currentPath));
            }
          } else if (actualValue === expectedValue) {
            foundPairs.push(`"${currentPath}": ${JSON.stringify(actualValue)}`);
          }
        }
      }

      return foundPairs;
    };

    const foundPairs = validateJsonBlockNotPresent(expectedJson, actualJson);
    if (foundPairs.length > 0) {
      throw new Error(
        `Expected JSON block NOT to be in captured ${source} payload for request type "${requestType}", but found: ${foundPairs.join(", ")}`
      );
    }

    logger.info(`JSON block confirmed not present in payload: source="${source}" requestType="${requestType}"`);
  },

  /**
   * Assert that a specific key in a captured JSON payload has the expected value.
   * Supports dot notation for nested keys.
   */
  async expectCapturedJsonKeyValue(world, source, requestType, key, expectedValue) {
    const keyParts = key.split(".");

    const extractValueFromPayload = (payload) => {
      let json;
      try {
        json = JSON.parse(payload);
      } catch {
        if (keyParts.length === 1) {
          const escapedKey = keyParts[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const primitiveValuePattern = new RegExp(
            `"${escapedKey}"\\s*:\\s*(true|false|-?\\d+(?:\\.\\d+)?|"(?:[^"\\\\]|\\\\.)*")`,
            "i"
          );
          const match = payload.match(primitiveValuePattern);

          if (match) {
            const rawValue = match[1];
            if (rawValue === "true") {
              return true;
            }
            if (rawValue === "false") {
              return false;
            }
            if (/^-?\d+$/.test(rawValue)) {
              return Number.parseInt(rawValue, 10);
            }
            if (/^-?\d*\.\d+$/.test(rawValue)) {
              return Number.parseFloat(rawValue);
            }
            if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
              return rawValue.slice(1, -1).replace(/\\"/g, '"');
            }
          }
        }

        throw new Error(
          `Captured ${source} payload for request type "${requestType}" is not valid JSON and does not contain a detectable key-value fragment for "${key}".`
        );
      }

      let value = json;
      for (const part of keyParts) {
        if (value && Object.prototype.hasOwnProperty.call(value, part)) {
          value = value[part];
        } else {
          throw new Error(
            `Key "${key}" not found in captured JSON payload for request type "${requestType}".`
          );
        }
      }

      return value;
    };

    let lastError = null;

    // First, validate current captured payload (fast path).
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      const currentValue = extractValueFromPayload(payloadRecord.payload);

      if (currentValue === expectedValue) {
        return;
      }

      lastError = new Error(
        `Expected key "${key}" to have value ${JSON.stringify(expectedValue)}, but got ${JSON.stringify(currentValue)} in captured JSON payload for request type "${requestType}".`
      );
    } catch (error) {
      lastError = error;
    }

    // Fallback: some request types (e.g. Booking) can be emitted multiple times quickly.
    // Validate against multiple matching rows and pass if any has the expected key/value.
    const identifiers = getScenarioIdentifiers(world);
    const multiMatchResult = await fetchPayloadFromStorage({
      source,
      requestType,
      tripId: identifiers.tripId,
      transactionId: identifiers.transactionId,
      sid: identifiers.sid,
      returnAllMatches: true,
    });

    for (const match of multiMatchResult.matches) {
      try {
        const candidateValue = extractValueFromPayload(match.payload);
        if (candidateValue === expectedValue) {
          this.setCapturedPayload(world, source, requestType, match.payload, {
            tripId: match.metadata.tripId,
            transactionId: match.metadata.transactionId,
            sid: match.metadata.sid,
            rowKey: match.metadata.rowKey,
          });
          return;
        }
      } catch {
        // Ignore this candidate and keep scanning others.
      }
    }

    throw new Error(
      `No ${source} payload for request type "${requestType}" matched key "${key}" with value ${JSON.stringify(expectedValue)} across ${multiMatchResult.metadata.returnedMatches} candidate(s). Last error: ${lastError?.message || "n/a"}`
    );
  },

  /**
   * How many distributor requests of a given type were logged for the current trip.
   * Only the total is needed, so a single payload is downloaded - metadata.totalMatches
   * already reports every match. Throws when the request type was never logged.
   */
  async getRequestCount(world, requestType) {
    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);
    const identifiers = getScenarioIdentifiers(world);

    if (!identifiers.tripId) {
      throw new Error(
        `Cannot count "${normalizedRequestType}" requests: no trip id is available on the world context.`
      );
    }

    const result = await fetchPayloadFromStorage({
      source: "request",
      requestType: normalizedRequestType,
      tripId: identifiers.tripId,
      transactionId: identifiers.transactionId,
      sid: identifiers.sid,
      returnAllMatches: true,
      maxMatches: 1,
    });

    return result.metadata.totalMatches;
  },

  /**
   * Waits until at least one request of the given type has been logged for the trip.
   * Used to prove a stage of the flow reached the supplier before counting anything else.
   */
  async waitForRequestType(world, requestType) {
    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    const deadline = Date.now() + ANCHOR_TIMEOUT_MS;
    let lastError;

    while (Date.now() < deadline) {
      try {
        const count = await this.getRequestCount(world, normalizedRequestType);
        logger.info(`Request type "${normalizedRequestType}" is present in the trip log`, { count });
        return count;
      } catch (error) {
        lastError = error;
        await sleep(COUNT_POLL_INTERVAL_MS);
      }
    }

    throw new Error(
      `Request type "${normalizedRequestType}" was never logged for this trip within ${ANCHOR_TIMEOUT_MS}ms. ` +
      `Last error: ${lastError?.message || "n/a"}`
    );
  },

  /**
   * Stores the current number of requests of a given type as the baseline for a later
   * comparison. Fails when the type has never been sent - that means the flow under test
   * never reached this supplier, which would make the later comparison meaningless.
   */
  async captureRequestCount(page, world, requestType) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    let baselineCount;
    try {
      baselineCount = await settleRequestCount(() => this.getRequestCount(world, normalizedRequestType), {
        requestType: normalizedRequestType,
      });
    } catch (error) {
      throw new Error(
        `Could not establish a baseline count for "${normalizedRequestType}" requests: no such request has ` +
        `been logged for this trip. Check that the selected flight is really served by the expected supplier. ` +
        `Underlying error: ${error.message}`
      );
    }

    if (!world.capturedRequestCounts) {
      world.capturedRequestCounts = {};
    }

    world.capturedRequestCounts[normalizedRequestType] = {
      count: baselineCount,
      capturedAt: new Date().toISOString(),
    };

    logger.info(`Baseline request count captured for "${normalizedRequestType}"`, { count: baselineCount });

    return baselineCount;
  },

  /**
   * Asserts no further request of the given type was sent since the baseline was captured.
   *
   * `anchorRequestType` is a request the flow is known to send after the baseline (e.g.
   * SelectFlight for add to cart). Waiting for it first proves that stage's traffic has been
   * published, so an unchanged count means "nothing was re-sent" and not "nothing logged yet".
   */
  async expectRequestCountUnchanged(page, world, requestType, anchorRequestType) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);
    const normalizedAnchor = normalizeRequestType(anchorRequestType);

    const baselineRecord = world.capturedRequestCounts?.[normalizedRequestType];
    if (!baselineRecord) {
      throw new Error(
        `No baseline count captured for "${normalizedRequestType}". Run the capture step first.`
      );
    }

    await this.waitForRequestType(world, normalizedAnchor);

    const currentCount = await settleRequestCount(() => this.getRequestCount(world, normalizedRequestType), {
      requestType: normalizedRequestType,
    });

    logger.info(`Comparing "${normalizedRequestType}" request count against the baseline`, {
      baselineCount: baselineRecord.count,
      currentCount,
      anchorRequestType: normalizedAnchor,
    });

    expect(
      currentCount,
      `Expected no additional "${normalizedRequestType}" requests after "${normalizedAnchor}", but the count ` +
      `went from ${baselineRecord.count} (captured at ${baselineRecord.capturedAt}) to ${currentCount}. ` +
      `${currentCount - baselineRecord.count} extra request(s) were sent - the previously retrieved pricing ` +
      `data was not reused.`
    ).toBe(baselineRecord.count);
  },

  /**
   * Reads the named fields out of every occurrence of an XML block in the trip's logged calls of a
   * type. Generic plumbing only: no meaning is attached to the fields, that belongs in the product
   * DSL calling this (see FlightResults.captureFareFamilyDescriptions for the fare-family use).
   *
   * For more than one tag, or when the answer depends on which blocks share a call, use
   * collectXmlBlockAttributesPerCall instead.
   *
   * Scoped to the block on purpose. A reply carries several unrelated `description` or `name` nodes,
   * so reading the fields off the whole payload would mix records that have nothing to do with each
   * other; extracting the block first keeps each field set with the record it came from.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "Amadeus4.Fare_MasterPricerTravelBoardSearch9"
   * @param {string} blockTag - e.g. "familyInformation"
   * @param {string[]} fieldNames - e.g. ["fareFamilyname", "description", "carrier"]
   * @param {{source?: string, purpose?: string}} [options] - source defaults to "request"
   * @returns {Promise<{blocks: Array<Object<string, string|null>>}>}
   */
  async collectXmlBlockFieldsForTrip(world, requestType, blockTag, fieldNames, options = {}) {
    assertWorld(world);
    if (typeof blockTag !== "string" || !blockTag.trim()) {
      throw new Error(
        `[PayloadValidation.collectXmlBlockFieldsForTrip] "blockTag" must be a non-empty string, got: ${blockTag}`
      );
    }
    if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
      throw new Error(
        `[PayloadValidation.collectXmlBlockFieldsForTrip] "fieldNames" must be a non-empty array, got: ${fieldNames}`
      );
    }

    const { source = "request", purpose } = options;
    const normalizedRequestType = normalizeRequestType(requestType);

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      purpose || `collect "${blockTag}" fields`,
      source
    );

    const blocks = [];
    for (const match of result.matches) {
      for (const block of extractXmlBlocksByTag(match.payload, blockTag)) {
        const fields = {};
        for (const fieldName of fieldNames) {
          fields[fieldName] = (collectParameterValues(block, fieldName)[0]?.value || "").trim() || null;
        }
        blocks.push(fields);
      }
    }

    logger.info("Collected XML block fields for the trip", {
      requestType: normalizedRequestType,
      source,
      blockTag,
      fieldNames,
      blocks: blocks.length,
    });

    return { blocks };
  },

  /**
   * Reads a nested XML structure out of every payload of a type logged for the trip, returning one
   * entry per call. Per call and not flattened on purpose: a response that defines ids locally (an
   * NDC price-class list numbered PC1..PCn) numbers them differently in the next response, so
   * blocks read across calls can only be resolved against the ids of the call they came from.
   *
   * `blockSpecs` maps a tag name to what to read from each of its occurrences:
   *   { fields: ["OfferID"], attributes: ["CancelFeeInd"], blocks: { Child: { ...same shape } } }
   * Fields and attributes come back as arrays of every occurrence in document order, never just
   * the first: a block that repeats an element - a service listing the four segments it applies to
   * - loses exactly the data being asked about when only the first value is kept. Nested reads are
   * scoped to their parent block; attributes are read off the block's own opening tag.
   *
   * Generic plumbing only: this attaches no meaning to any tag. The product DSL that names the tags
   * owns that (see FlightResults.captureAmadeusNdcBrandOffers for the NDC offer use of this).
   *
   * @param {object} world
   * @param {string} requestType - e.g. "*AMA_TravelOfferPriceRQ*"
   * @param {object} blockSpecs - tag name -> { fields?, attributes?, blocks? }
   * @param {{source?: string, purpose?: string}} [options]
   * @returns {Promise<{perCall: Array<Record<string, object[]>>}>}
   */
  async collectXmlBlockTreesPerCall(world, requestType, blockSpecs, options = {}) {
    assertWorld(world);
    if (!blockSpecs || typeof blockSpecs !== "object" || Object.keys(blockSpecs).length === 0) {
      throw new Error(
        `[PayloadValidation.collectXmlBlockTreesPerCall] "blockSpecs" must be a non-empty object, got: ${blockSpecs}`
      );
    }

    const { source = "response", purpose } = options;
    const normalizedRequestType = normalizeRequestType(requestType);

    await this.waitForRequestType(world, normalizedRequestType);

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      purpose || `collect ${Object.keys(blockSpecs).join(", ")} blocks`,
      source
    );

    const readBlock = (blockXml, spec) => {
      const tree = {};
      for (const fieldName of spec.fields || []) {
        tree[fieldName] = collectParameterValues(blockXml, fieldName).map((o) => o.value);
      }
      if (spec.attributes && spec.attributes.length > 0) {
        Object.assign(tree, readXmlAttributes(blockXml, spec.attributes));
      }
      for (const [childTag, childSpec] of Object.entries(spec.blocks || {})) {
        tree[childTag] = extractXmlBlocksByTag(blockXml, childTag)
          .map((child) => readBlock(child, childSpec));
      }
      return tree;
    };

    const perCall = result.matches.map((match) => {
      const call = {};
      for (const [blockTag, spec] of Object.entries(blockSpecs)) {
        call[blockTag] = extractXmlBlocksByTag(match.payload, blockTag)
          .map((block) => readBlock(block, spec));
      }
      return call;
    });

    logger.info("Collected XML block trees per call", {
      requestType: normalizedRequestType,
      source,
      calls: perCall.length,
      blocksPerCall: perCall.map((call) =>
        Object.entries(call).map(([tag, blocks]) => `${tag}:${blocks.length}`).join(" ")
      ),
    });

    return { perCall };
  },

  /**
   * Counts occurrences of a named parameter in each request of a type logged for the trip - e.g.
   * how many `<rateCategory>` entries each `Fare_GetFareFamilyDescription` call carries. Generic
   * plumbing only: no product meaning is attached to the count here, that belongs in the product
   * DSL calling this (see FlightResults.expectFareFamilyDescriptionsBatched for the fare-family
   * use of this).
   *
   * The wait and settle are not decoration: the distributor log publishes asynchronously, so an
   * immediate read can land between the chunks of a split batch and undercount it.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "*Fare_GetFareFamilyDescription*"
   * @param {string} parameterName - e.g. "rateCategory"
   * @returns {Promise<{perCall: Array<{entries: number, values: string[]}>, entriesTotal: number}>}
   */
  async collectParameterOccurrencesPerCall(world, requestType, parameterName) {
    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    await this.waitForRequestType(world, normalizedRequestType);
    await settleRequestCount(() => this.getRequestCount(world, normalizedRequestType), {
      requestType: normalizedRequestType,
    });

    const batched = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      `collect "${parameterName}" occurrences per call`
    );
    const perCall = batched.matches.map((match) => {
      const values = collectParameterValues(match.payload, parameterName).map((o) => o.value);
      return { entries: values.length, values };
    });
    const entriesTotal = perCall.reduce((sum, call) => sum + call.entries, 0);

    logger.info("Collected parameter occurrences per call", {
      requestType: normalizedRequestType,
      parameterName,
      calls: perCall.length,
      entriesTotal,
      entriesPerCall: perCall.map((call) => call.entries),
    });

    return { perCall, entriesTotal };
  },

  /**
   * Returns every payload of a type logged for the trip, untouched, for content this DSL cannot
   * parse generically - a supplier's own trace format. Prefer the structured readers for XML or JSON.
   *
   * @param {object} world
   * @param {string} requestType
   * @param {{source?: string, purpose?: string}} [options] - source defaults to "request"
   * @returns {Promise<{payloads: string[]}>}
   */
  async collectPayloadsForTrip(world, requestType, options = {}) {
    assertWorld(world);
    const { source = "request", purpose } = options;
    const normalizedRequestType = normalizeRequestType(requestType);

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      purpose || `read "${normalizedRequestType}" payloads`,
      source
    );
    const payloads = result.matches.map((match) => match.payload);

    logger.info("Collected payloads for the trip", {
      requestType: normalizedRequestType,
      source,
      payloads: payloads.length,
      sizes: payloads.map((p) => p.length),
    });

    return { payloads };
  },

  /**
   * Reads the named attributes of every occurrence of an XML block, per call. Per call because a
   * call is what ties its blocks together; several tags in one pass because fetching the same large
   * payloads twice gets rate-limited. For one tag whose blocks stand on their own, use
   * collectXmlBlockFieldsForTrip, which reads the block's contents rather than its attributes.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "AirPriceRsp"
   * @param {Object<string, string[]>} blockSpecs - tag to attributes, e.g. { Brand: ["Name"] }
   * @param {{source?: string, purpose?: string}} [options] - source defaults to "request"
   * @returns {Promise<{perCall: Array<Object<string, Array<Object<string, string|null>>>>}>}
   */
  async collectXmlBlockAttributesPerCall(world, requestType, blockSpecs, options = {}) {
    assertWorld(world);
    const tags = Object.keys(blockSpecs || {});
    if (tags.length === 0) {
      throw new Error(
        `[PayloadValidation.collectXmlBlockAttributesPerCall] "blockSpecs" must name at least one block tag.`
      );
    }
    for (const tag of tags) {
      if (!Array.isArray(blockSpecs[tag]) || blockSpecs[tag].length === 0) {
        throw new Error(
          `[PayloadValidation.collectXmlBlockAttributesPerCall] "${tag}" must list at least one attribute.`
        );
      }
    }

    const { source = "request", purpose } = options;
    const normalizedRequestType = normalizeRequestType(requestType);

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      purpose || `collect ${tags.map((t) => `"${t}"`).join(" and ")} attributes`,
      source
    );

    const perCall = result.matches.map((match) => {
      const byTag = {};
      for (const tag of tags) {
        const openTagRegex = new RegExp(`<(?:[\\w.-]+:)?${escapeRegex(tag)}\\b[^>]*>`, "gi");
        byTag[tag] = (match.payload.match(openTagRegex) || []).map((openTag) => {
          const attributes = {};
          for (const attributeName of blockSpecs[tag]) {
            const found = openTag.match(new RegExp(`\\b${escapeRegex(attributeName)}\\s*=\\s*"([^"]*)"`, "i"));
            attributes[attributeName] = found ? found[1].trim() || null : null;
          }
          return attributes;
        });
      }
      return byTag;
    });

    logger.info("Collected XML block attributes per call", {
      requestType: normalizedRequestType,
      source,
      tags,
      calls: perCall.length,
      blocksPerCall: perCall.map((byTag) => tags.map((t) => `${t}:${byTag[t].length}`).join(" ")),
    });

    return { perCall };
  },

  /**
   * Reads the named fields inside every occurrence of an XML block, per call. The contents
   * counterpart of collectXmlBlockAttributesPerCall, and per call for the same reason: a supplier
   * that prices a whole itinerary in one call says which leg got which fare inside that one reply.
   * For fields whose blocks stand on their own across the trip, use collectXmlBlockFieldsForTrip.
   *
   * Each field returns every occurrence in document order, so a block holding the same field twice
   * - a segment's board and off point, say - stays self-contained.
   *
   * @param {object} world
   * @param {string} requestType - e.g. "*Fare_InformativePricingWithoutPNR*"
   * @param {Object<string, string[]>} blockSpecs - tag to fields, e.g. { segmentLevelGroup: ["itemNumber"] }
   * @param {{source?: string, purpose?: string}} [options] - source defaults to "request"
   * @returns {Promise<{perCall: Array<Object<string, Array<Object<string, string[]>>>>}>}
   */
  async collectXmlBlockFieldsPerCall(world, requestType, blockSpecs, options = {}) {
    assertWorld(world);
    const tags = Object.keys(blockSpecs || {});
    if (tags.length === 0) {
      throw new Error(
        `[PayloadValidation.collectXmlBlockFieldsPerCall] "blockSpecs" must name at least one block tag.`
      );
    }
    for (const tag of tags) {
      if (!Array.isArray(blockSpecs[tag]) || blockSpecs[tag].length === 0) {
        throw new Error(
          `[PayloadValidation.collectXmlBlockFieldsPerCall] "${tag}" must list at least one field.`
        );
      }
    }

    const { source = "request", purpose } = options;
    const normalizedRequestType = normalizeRequestType(requestType);

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      purpose || `collect ${tags.map((t) => `"${t}"`).join(" and ")} fields`,
      source
    );

    const perCall = result.matches.map((match) => {
      const byTag = {};
      for (const tag of tags) {
        byTag[tag] = extractXmlBlocksByTag(match.payload, tag).map((block) => {
          const fields = {};
          for (const fieldName of blockSpecs[tag]) {
            fields[fieldName] = collectParameterValues(block, fieldName)
              .map((occurrence) => (occurrence.value || "").trim())
              .filter(Boolean);
          }
          return fields;
        });
      }
      return byTag;
    });

    logger.info("Collected XML block fields per call", {
      requestType: normalizedRequestType,
      source,
      tags,
      calls: perCall.length,
      blocksPerCall: perCall.map((byTag) => tags.map((t) => `${t}:${byTag[t].length}`).join(" ")),
    });

    return { perCall };
  },

  /**
   * Asserts that no two requests of the given type carry the same value for a named parameter.
   *
   * For OfferPrice the parameter is OfferID: each request should price a different offer, so the
   * same offer id appearing twice means the supplier was asked to re-price something already priced.
   * Run this once every request of that type has been sent - it looks at the whole trip.
   *
   * The parameter is found in whatever shape the supplier uses - XML attribute, XML tag or JSON key
   * (Sabre NDC sends {"query":[{"offerItemId":["..."]}]}). It fails when no request carries it at
   * all, rather than reporting zero duplicates from nothing.
   */
  async expectRequestAttributeValuesAreUnique(page, world, requestType, attributeName) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    if (!attributeName || typeof attributeName !== "string") {
      throw new Error("attributeName must be a non-empty string");
    }

    const identifiers = getScenarioIdentifiers(world);
    if (!identifiers.tripId) {
      throw new Error(
        `Cannot inspect "${normalizedRequestType}" requests: no trip id is available on the world context.`
      );
    }

    const result = await fetchPayloadFromStorage({
      source: "request",
      requestType: normalizedRequestType,
      tripId: identifiers.tripId,
      transactionId: identifiers.transactionId,
      sid: identifiers.sid,
      returnAllMatches: true,
      maxMatches: MAX_REQUESTS_TO_INSPECT,
      timeoutMs: INSPECT_ALL_TIMEOUT_MS,
    });

    // A truncated set would silently weaken the assertion - duplicates could live in the dropped tail.
    if (result.metadata.totalMatches > result.metadata.returnedMatches) {
      throw new Error(
        `Cannot verify unique "${attributeName}" values: only ${result.metadata.returnedMatches} of ` +
        `${result.metadata.totalMatches} "${normalizedRequestType}" requests were downloaded. ` +
        `Raise MAX_REQUESTS_TO_INSPECT so every request is inspected.`
      );
    }

    const requestsByValue = new Map();

    result.matches.forEach((match, index) => {
      // collectParameterValues, not a local regex: the same identifier arrives as an XML attribute
      // on some suppliers and as a JSON key on others. Sabre NDC sends
      // {"query":[{"offerItemId":["..."]}]}, which an XML-attribute regex never matches - and a
      // miss here is silent, leaving zero duplicates and a green assertion that checked nothing.
      const values = new Set(
        collectParameterValues(match.payload, attributeName)
          .map((occurrence) => normalizeParameterValue(occurrence.value))
          .filter(Boolean)
      );
      if (values.size === 0) {
        logger.warn(`No "${attributeName}" found in a "${normalizedRequestType}" request`, {
          requestIndex: index,
          rowKey: match.metadata.rowKey,
        });
      }
      for (const value of values) {
        if (!requestsByValue.has(value)) requestsByValue.set(value, []);
        requestsByValue.get(value).push(match.metadata.timestamp);
      }
    });

    // Every request missing the attribute means nothing was compared. Reporting zero duplicates
    // there would be a pass that proves nothing, so it fails as a wrong-attribute-name mistake.
    if (result.matches.length > 0 && requestsByValue.size === 0) {
      throw new Error(
        `None of the ${result.matches.length} "${normalizedRequestType}" request(s) carry a ` +
        `"${attributeName}", so uniqueness could not be checked. Asserting on it would pass without ` +
        `validating anything - check the parameter name against a real payload.`
      );
    }

    const duplicates = [...requestsByValue.entries()].filter(([, timestamps]) => timestamps.length > 1);

    logger.info(`Checked "${attributeName}" uniqueness across "${normalizedRequestType}" requests`, {
      requests: result.matches.length,
      distinctValues: requestsByValue.size,
      duplicates: duplicates.length,
    });

    expect(
      duplicates.length,
      `Every "${normalizedRequestType}" request must carry a different "${attributeName}", but ` +
      `${duplicates.length} value(s) were requested more than once across ${result.matches.length} request(s):\n` +
      duplicates
        .map(([value, timestamps]) => `  ${attributeName}="${value}" sent ${timestamps.length}x at ${timestamps.join(", ")}`)
        .join("\n")
    ).toBe(0);
  },

  /**
   * Asserts the trip sent exactly `expectedCount` requests of the given type.
   *
   * Unlike expectRequestCountUnchanged() this is an absolute check and needs no baseline, so use
   * it when the flow prescribes how many calls the supplier should receive - one OfferPrice per
   * selected offer, for example. Run it once the stage under test has finished: the count is
   * settled before it is compared, but settling only proves the number stopped moving, not that
   * every request has been published yet.
   *
   * An expected count of 0 is allowed - "the type was never logged" reads as zero rather than an
   * error. That case cannot distinguish "never sent" from "not published yet", so pair it with a
   * step that proves the flow reached the supplier.
   */
  async expectRequestCountEquals(page, world, requestType, expectedCount) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    const expected = Number(expectedCount);
    if (!Number.isInteger(expected) || expected < 0) {
      throw new Error(`expectedCount must be a non-negative integer, got: ${expectedCount}`);
    }

    const readCount = async () => {
      try {
        return await this.getRequestCount(world, normalizedRequestType);
      } catch (error) {
        if (isNoPayloadFoundError(error)) {
          return 0;
        }
        throw error;
      }
    };

    const actualCount = await settleRequestCount(readCount, { requestType: normalizedRequestType });

    logger.info(`Comparing "${normalizedRequestType}" request count against the expected total`, {
      expected,
      actualCount,
    });

    expect(
      actualCount,
      `Expected exactly ${expected} "${normalizedRequestType}" request(s) to have been sent for this trip, ` +
      `but ${actualCount} were logged.`
    ).toBe(expected);
  },

  /**
   * Builds the inventory of every request type the trip logged, without downloading any payload.
   *
   * This is the capture half of an ABSENCE check. Capturing by request type cannot serve one:
   * capturePayloadByRequestType throws "No request payload found" when the type is missing, which
   * is the very outcome the test wants to prove, so the scenario would error instead of passing.
   * Reading the whole inventory first turns that into an ordinary assertion over a known list -
   * and, unlike a not-found error, it also shows WHICH types were sent when the check fails.
   *
   * The listing is fetched with the "*" request-type wildcard (see buildRequestTypeMatcher in
   * payloadValidationClient) and listOnly, so only entry metadata crosses the wire.
   */
  async captureRequestTypes(page, world, source) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);

    const normalizedSource = normalizeSource(source);
    // "block" is a derived, in-memory source (see parseBlockExpression) - there is nothing in
    // Storage to enumerate for it, so it is rejected here rather than confusing the API later.
    if (normalizedSource === "block") {
      throw new Error(
        `[PayloadValidation.captureRequestTypes] "source" must be "request" or "response" to ` +
        `enumerate Storage types, got: ${source}. "block" only exists as an extracted fragment ` +
        `of an already-captured payload.`
      );
    }

    const identifiers = getScenarioIdentifiers(world);

    if (!identifiers.tripId) {
      throw new Error(
        "[PayloadValidation.captureRequestTypes] Cannot list the request types for this trip: " +
        "no trip id is available on the world context. The trip id is captured by the " +
        '"I am logged in as ... booking a new trip" step - ensure it ran before this step.'
      );
    }

    logger.debug("Listing every request type logged for the trip", {
      source: normalizedSource,
      ...identifiers,
    });

    let result;
    try {
      result = await fetchPayloadFromStorage({
        source: normalizedSource,
        requestType: ALL_REQUEST_TYPES_WILDCARD,
        tripId: identifiers.tripId,
        transactionId: identifiers.transactionId,
        sid: identifiers.sid,
        listOnly: true,
        timeoutMs: INSPECT_ALL_TIMEOUT_MS,
      });
    } catch (error) {
      // An empty listing means the trip logged nothing at all - never that the type under test is
      // absent. Letting it through as an empty inventory would pass every absence check for free.
      if (isNoPayloadFoundError(error)) {
        throw new Error(
          `[PayloadValidation.captureRequestTypes] No ${normalizedSource} was logged for trip ` +
          `${identifiers.tripId} at all. The trip never reached a supplier, or the logs had not ` +
          `been published yet - either way the request-type inventory cannot be trusted. ` +
          `Original: ${error.message}`
        );
      }
      throw new Error(
        `[PayloadValidation.captureRequestTypes] Failed to list the ${normalizedSource} types for trip ` +
        `${identifiers.tripId}. The distributor-requests API may be unreachable or the trip ` +
        `context (sid/transactionId) may not match. Original: ${error.message}`
      );
    }

    const entries = result.entries || [];
    const types = [...new Set(entries.map((entry) => entry.requestType).filter(Boolean))].sort();

    world.capturedRequestTypes = {
      source: normalizedSource,
      types,
      entryCount: entries.length,
      capturedAt: new Date().toISOString(),
      filters: {
        tripId: identifiers.tripId,
        transactionId: identifiers.transactionId,
        sid: identifiers.sid,
      },
    };

    logger.info(`Captured ${types.length} distinct ${normalizedSource} type(s) for the trip`, {
      entryCount: entries.length,
      types,
    });

    return world.capturedRequestTypes;
  },

  /**
   * Asserts a request type is absent from the inventory captured by captureRequestTypes.
   *
   * Matching goes through buildRequestTypeMatcher, the same wildcard rule the storage lookup uses,
   * so "*" means what it means everywhere else in this framework. An absence check needs it: several
   * suppliers suffix the logged type with the corporate account code that produced the call
   * ("Sabre NDC Flight Search FROCDE", "Sabre NDC Flight Search aaaaaa"), so an exact-match
   * assertion on the bare name would clear a trip that DID send the request - passing for exactly
   * the reason the test exists to rule out. Feature files spell the family out: "... Search*".
   *
   * The diagnostic IS the failure here - "it was sent" is useless without the list of what else
   * the trip sent - so this throws with the full inventory rather than leaning on expect(), whose
   * custom message is discarded by this repo's @playwright/test.
   */
  async expectCapturedRequestTypesNotContaining(world, source, requestType) {
    assertWorld(world);

    const normalizedSource = normalizeSource(source);
    const normalizedRequestType = normalizeRequestType(requestType);
    const captured = world.capturedRequestTypes;

    if (!captured) {
      throw new Error(
        `[PayloadValidation.expectCapturedRequestTypesNotContaining] No ${normalizedSource} type ` +
        `inventory is on the world context. The "I capture all the {source} types from Storage" ` +
        `step must run before this assertion.`
      );
    }

    if (captured.source !== normalizedSource) {
      throw new Error(
        `[PayloadValidation.expectCapturedRequestTypesNotContaining] The captured inventory is for ` +
        `"${captured.source}", but the assertion asked about "${normalizedSource}". Capture the ` +
        `matching source before asserting on it.`
      );
    }

    // Lower-cased on both sides: the storage lookup matches case-sensitively, but an absence check
    // errs toward matching MORE, not less - a casing difference must fail the test, never silently
    // clear it.
    const matcher = buildRequestTypeMatcher(normalizedRequestType.toLowerCase());
    const offenders = captured.types.filter((type) => matcher.matches(type.trim().toLowerCase()));

    if (offenders.length > 0) {
      throw new Error(
        `[PayloadValidation.expectCapturedRequestTypesNotContaining] Request type ` +
        `"${normalizedRequestType}" WAS sent for trip ${captured.filters.tripId}, but this test ` +
        `requires it never to be sent. Matched as: ${offenders.map((t) => `"${t}"`).join(", ")}. ` +
        `All ${captured.types.length} ${normalizedSource} type(s) logged for the trip: ` +
        `${captured.types.join(", ")}.`
      );
    }

    logger.info(`Request type "${normalizedRequestType}" is absent from the trip log, as expected`, {
      source: normalizedSource,
      typesLogged: captured.types.length,
      types: captured.types,
    });
  },

  /**
   * Asserts that every request of the given type carries the named parameter.
   *
   * The uniqueness check only warns when a request is missing the attribute, so this is the step
   * that fails when one request in a set was built without it. The parameter is matched as an XML
   * attribute, an XML tag or a JSON key (see findParameterInPayload), so the same phrase works
   * whatever shape the supplier's payload takes.
   *
   * Run it once every request of that type has been sent - it looks at the whole trip.
   */
  async expectEveryRequestContainsParameter(page, world, requestType, parameterName) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    if (!parameterName || typeof parameterName !== "string") {
      throw new Error("parameterName must be a non-empty string");
    }

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      `verify every request carries "${parameterName}"`
    );

    const missing = [];
    const found = [];

    result.matches.forEach((match, index) => {
      const hit = findParameterInPayload(match.payload, parameterName);
      if (hit) {
        found.push({ index, form: hit.form, value: hit.value, timestamp: match.metadata.timestamp });
      } else {
        missing.push({ index, timestamp: match.metadata.timestamp, rowKey: match.metadata.rowKey });
      }
    });

    logger.info(`Checked "${parameterName}" presence across "${normalizedRequestType}" requests`, {
      requests: result.matches.length,
      withParameter: found.length,
      missing: missing.length,
      values: found.map((entry) => entry.value).filter(Boolean),
    });

    expect(
      missing.length,
      `Every "${normalizedRequestType}" request must carry "${parameterName}", but ` +
      `${missing.length} of ${result.matches.length} request(s) did not:\n` +
      missing
        .map((entry) => `  request #${entry.index + 1} sent at ${entry.timestamp} (rowKey ${entry.rowKey})`)
        .join("\n")
    ).toBe(0);
  },

  /**
   * Asserts that every request of the given type carries the named parameter with a value that
   * contains `expectedValue`.
   *
   * Substring, not equality, so a scenario can pin the part it actually cares about - the 07:00:00
   * inside <DepartureDateTime>2026-10-08T07:00:00</DepartureDateTime> - without hard-coding a date
   * that moves with the test data.
   *
   * A request may carry the parameter several times (one per leg, one per offer); the request
   * passes when *any* occurrence matches, since the others legitimately hold different values.
   * That also means an unscoped check cannot tell the legs apart: pass `withinBlock` to confine
   * the search to one XML block, so <ReturnDateTime><DepartureDateTime> is asserted separately
   * from the outbound one and a swap between them fails.
   *
   * Run it once every request of that type has been sent - it looks at the whole trip.
   *
   * @param {string|null} [withinBlock] XML tag whose block(s) the parameter must be found inside.
   */
  async expectEveryRequestParameterContains(page, world, requestType, parameterName, expectedValue, withinBlock = null) {
    if (!page) {
      throw new Error("page is required");
    }

    assertWorld(world);
    const normalizedRequestType = normalizeRequestType(requestType);

    if (!parameterName || typeof parameterName !== "string") {
      throw new Error("parameterName must be a non-empty string");
    }

    if (!isPlainParameterName(parameterName)) {
      throw new Error(
        `parameterName must be a bare tag, attribute or key name (e.g. "DepartureDateTime"), got: ` +
        `"${parameterName}". Pass the value to look for as the expected value instead.`
      );
    }

    if (withinBlock !== null && !isPlainParameterName(String(withinBlock))) {
      throw new Error(
        `withinBlock must be a bare XML tag name (e.g. "ReturnDateTime"), got: "${withinBlock}".`
      );
    }

    if (!expectedValue || typeof expectedValue !== "string") {
      throw new Error("expectedValue must be a non-empty string");
    }

    const scopeLabel = withinBlock ? `"${parameterName}" within <${withinBlock}>` : `"${parameterName}"`;

    const result = await fetchAllRequestsForTrip(
      world,
      normalizedRequestType,
      `verify every request carries ${scopeLabel} containing "${expectedValue}"`
    );

    const failures = [];
    let matchedRequests = 0;

    result.matches.forEach((match, index) => {
      // Without a block the whole payload is one scope; with one, each occurrence of that block is
      // searched separately so a value sitting in a sibling leg cannot satisfy the assertion.
      const scopes = withinBlock ? extractXmlBlocksByTag(match.payload, withinBlock) : [match.payload];
      const occurrences = scopes.flatMap((scope) => collectParameterValues(scope, parameterName));
      const hit = occurrences.some((occurrence) => (occurrence.value || "").includes(expectedValue));

      if (hit) {
        matchedRequests += 1;
        return;
      }

      failures.push({
        index,
        timestamp: match.metadata.timestamp,
        rowKey: match.metadata.rowKey,
        blockCount: withinBlock ? scopes.length : null,
        found: occurrences.map((occurrence) => occurrence.value),
      });
    });

    logger.info(`Checked ${scopeLabel} values across "${normalizedRequestType}" requests`, {
      requests: result.matches.length,
      expectedValue,
      matchedRequests,
      failures: failures.length,
    });

    const describeFailure = (entry) => {
      if (withinBlock && entry.blockCount === 0) {
        return `no <${withinBlock}> block in the payload at all`;
      }
      if (entry.found.length === 0) {
        return withinBlock
          ? `no "${parameterName}" inside the ${entry.blockCount} <${withinBlock}> block(s)`
          : `no "${parameterName}" in the payload at all`;
      }
      return `found ${parameterName}: ${entry.found.map((value) => `"${value}"`).join(", ")}`;
    };

    expect(
      failures.length,
      `Every "${normalizedRequestType}" request must carry ${scopeLabel} containing ` +
      `"${expectedValue}", but ${failures.length} of ${result.matches.length} request(s) did not:\n` +
      failures
        .map((entry) =>
          `  request #${entry.index + 1} sent at ${entry.timestamp} (rowKey ${entry.rowKey}) - ` +
          describeFailure(entry)
        )
        .join("\n")
    ).toBe(0);
  },
};

module.exports = PayloadValidation;
