require("module-alias/register");
const { expect } = require("@playwright/test");
const { fetchPayloadFromStorage } = require("@utils/payloadValidationClient");
const logger = require("@utils/logger").child("PayloadValidation-DSL");

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

function parseJsonPayload(payload, source, requestType) {
  try {
    return JSON.parse(payload);
  } catch {
    throw new Error(
      `Captured ${source} payload for request type \"${requestType}\" is not valid JSON. Use text-based assertions (contains) or capture a JSON payload.`
    );
  }
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

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

/**
 * Extracts a value at a specific key path from a JSON object.
 * Key path supports dot notation: "data.address.street"
 * Returns the extracted value as a JSON string.
 * Throws error if key path not found.
 */
function extractJsonBlockByKey(jsonString, keyPath) {
  if (!jsonString || typeof jsonString !== "string") {
    throw new Error("jsonString must be a non-empty string");
  }

  if (!keyPath || typeof keyPath !== "string") {
    throw new Error("keyPath must be a non-empty string");
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error(`Invalid JSON for block extraction: ${jsonString.substring(0, 100)}`);
  }

  const extracted = getByPath(parsed, keyPath);
  if (extracted === undefined) {
    throw new Error(`Key path "${keyPath}" not found in JSON object`);
  }

  return JSON.stringify(extracted, null, 2);
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

    world.capturedParserPayloads[key] = {
      source: normalizedSource,
      requestType: normalizedRequestType,
      payload,
      capturedAt: new Date().toISOString(),
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
      }
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
      let payloadString = rawPayload;
      let isJson = false;
      try {
        const parsed = JSON.parse(rawPayload);
        payloadString = JSON.stringify(parsed);
        isJson = true;
      } catch { /* XML or plain text */ }

      const onKeyExpression = parseOnKeyExpression(expectedText);
      if (onKeyExpression) {
        const { key, typedValue, rawValue } = onKeyExpression;
        if (isJson) {
          let parsed;
          try { parsed = JSON.parse(rawPayload); } catch { parsed = null; }
          const actual = parsed !== null ? getByPath(parsed, key) : undefined;
          if (actual === undefined) {
            throw new Error(`JSON key "${key}" not found in captured ${source} payload for request type "${requestType}"`);
          }
          if (actual !== typedValue) {
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

            if (actualValue !== typedValue) {
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
          // JSON: Extract the value at the key path
          const extracted = extractJsonBlockByKey(rawPayload, blockExpression.blockTag);
          const extracted_parsed = JSON.parse(extracted);
          const normalizedLookup = normalizeForContains(blockExpression.text);
          
          // Check if the extracted block contains the text
          const blockString = JSON.stringify(extracted_parsed);
          if (!normalizeForContains(blockString).includes(normalizedLookup)) {
            throw new Error(`No block match for "${blockExpression.text}" found in extracted JSON key "${blockExpression.blockTag}" for request type "${requestType}"`);
          }
          
          logger.info(`Block match found in JSON: keyPath="${blockExpression.blockTag}" text="${blockExpression.text}"`);
          return { blockPayload: extracted, blockFilters: {} };
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
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      const result = runAssertion(payloadRecord.payload, payloadRecord.filters || {});
      if (result.blockPayload) {
        this.setCapturedPayload(world, "block", requestType, result.blockPayload, result.blockFilters);
      }
      return;
    } catch (err) {
      firstError = err;
      logger.debug(`Fast-path assertion failed, scanning all candidates: ${err.message}`);
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

  async expectCapturedPayloadNotContains(page, world, source, requestType, expectedText) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!expectedText || typeof expectedText !== "string") {
      throw new Error("expectedText must be a non-empty string");
    }

    logger.debug(`Asserting payload does not contain: source="${source}" requestType="${requestType}" expectedText="${expectedText.substring(0, 100)}${expectedText.length > 100 ? "..." : ""}"`);

    const runAssertion = (rawPayload) => {
      let payloadString = rawPayload;
      let isJson = false;
      try {
        const parsed = JSON.parse(rawPayload);
        payloadString = JSON.stringify(parsed);
        isJson = true;
      } catch { /* XML or plain text */ }

      const onKeyExpression = parseOnKeyExpression(expectedText);
      if (onKeyExpression) {
        const { key, typedValue, rawValue } = onKeyExpression;
        if (isJson) {
          let parsed;
          try { parsed = JSON.parse(rawPayload); } catch { parsed = null; }
          const actual = parsed !== null ? getByPath(parsed, key) : undefined;
          if (actual !== undefined && actual === typedValue) {
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

            if (actualValue === typedValue) {
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
          const extracted = extractJsonBlockByKey(rawPayload, blockExpression.blockTag);
          const extractedParsed = JSON.parse(extracted);
          const normalizedLookup = normalizeForContains(blockExpression.text);
          const blockString = JSON.stringify(extractedParsed);
          if (normalizeForContains(blockString).includes(normalizedLookup)) {
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
    try {
      const payloadRecord = this.getCapturedPayload(world, source, requestType);
      runAssertion(payloadRecord.payload);
      return;
    } catch (err) {
      firstError = err;
      logger.debug(`Fast-path not-contains assertion failed, scanning all candidates: ${err.message}`);
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

    const payloadRecord = this.getCapturedPayload(world, source, requestType);
    const payload = payloadRecord.payload;

    // Extract all tag values from expected XML
    const expectedPairs = extractXmlKeyValuePairs(expectedXmlBlock);

    if (expectedPairs.length === 0) {
      throw new Error(
        `No XML key-value pairs found in expected block for ${source} payload for request type "${requestType}"`
      );
    }

    // Check each expected value exists in the payload
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
  },

  async expectCapturedPayloadContainsJsonBlock(page, world, source, requestType, expectedJsonBlock) {
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

    try {
      actualJson = JSON.parse(payload);
    } catch {
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
            errors.push(`Missing key "${currentPath}"`);
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

    try {
      actualJson = JSON.parse(payload);
    } catch {
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
};

module.exports = PayloadValidation;
