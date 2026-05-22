/**
 * Payload validation client for distributor requests.
 *
 * Uses the internal API workflow:
 *  1) GET /api/distributor-requests?tripId={tripId}
 *  2) GET /api/distributor-requests/{rowKey}/content?tripId={tripId}&type={request|response}
 *
 * Required env vars:
 *   PAYLOAD_VALIDATION_INTERNAL_ATRIIS_BASE_URL — internal API base URL
 *   PAYLOAD_VALIDATION_INTERNAL_ATRIIS_TOKEN    — bearer token used to bootstrap access
 *   PAYLOAD_VALIDATION_LOOKBACK_MINUTES         — how far back to search (default: 60)
 *   PAYLOAD_VALIDATION_TIMEOUT_MS               — per-operation timeout in ms
 */

const { payloadValidation } = require("@config/config");
const logger = require("@utils/logger").child("PayloadValidationClient");

const DEFAULT_LOOKUP_ATTEMPTS = 3;
const DEFAULT_LOOKUP_RETRY_MS = 3000;

/**
 * Timeout wrapper to prevent indefinite iteration in asynchronous flows.
 * @param {Promise<any>} promise
 * @param {number} timeoutMs
 * @param {string} operationName
 * @returns {Promise<any>}
 */
async function withTimeout(promise, timeoutMs, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Payload Validation API operation "${operationName}" timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

/**
 * Parse timestamp-like values safely.
 * @param {string|Date|number} value
 * @returns {Date|null}
 */
function parseTimestamp(value) {
  if (!value) return null;
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }
  return dateValue;
}

/**
 * Normalize entry keys from the internal API response.
 * Supports both PascalCase and camelCase properties.
 *
 * @param {object} entry
 * @param {string|number} expectedTripId
 * @returns {object|null}
 */
function normalizeEntry(entry, expectedTripId) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const rowKey = entry.RowKey || entry.rowKey;
  const timestampRaw = entry.Timestamp || entry.timestamp;
  const timestamp = parseTimestamp(timestampRaw);
  const normalizedTripId = expectedTripId ? String(expectedTripId) : null;

  if (!rowKey || !timestamp) {
    return null;
  }

  return {
    tripId: normalizedTripId,
    rowKey,
    requestType: entry.RequestType || entry.requestType || null,
    sid: entry.Sid || entry.sid || null,
    transactionId: entry.TransactionId || entry.transactionId || null,
    timestamp,
  };
}

/**
 * Fetch JSON from the internal API with per-operation timeout.
 *
 * @param {string} url
 * @param {number} operationTimeoutMs
 * @param {string} operationName
 * @param {string|null} token
 * @param {boolean} includeAuth
 * @returns {Promise<any>}
 */
async function fetchJson(url, operationTimeoutMs, operationName, token, includeAuth) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), operationTimeoutMs);

  try {
    const headers = { Accept: "application/json" };
    if (includeAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
    } catch (networkError) {
      const cause = networkError.cause?.message || networkError.cause?.code || networkError.message;
      const isAborted = networkError.name === "AbortError";
      throw new Error(
        isAborted
          ? `Payload Validation API request timed out after ${operationTimeoutMs}ms for operation "${operationName}". URL: ${url}`
          : `Unable to reach internal payload validation API for operation "${operationName}". ` +
            `URL: ${url}. ` +
            `Ensure you are connected to VPN. Underlying error: ${cause}`
      );
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      throw new HttpError(
        `Internal payload validation API call failed for ${operationName}. ` +
        `Status: ${response.status}. URL: ${url}. ` +
        (bodyText ? `Body: ${bodyText}` : ""),
        response.status
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch content payload for a specific row key.
 *
 * @param {object} args
 * @param {string} args.baseUrl
 * @param {string} args.tripId
 * @param {string} args.rowKey
 * @param {"request"|"response"} args.source
 * @param {number} args.operationTimeoutMs
 * @param {string|null} args.token
 * @param {boolean} args.includeAuth
 * @returns {Promise<string>}
 */
async function downloadPayload({ baseUrl, tripId, rowKey, source, operationTimeoutMs, token, includeAuth }) {
  const operationDeadline = Date.now() + operationTimeoutMs;

  function remainingTimeoutMs(operationName) {
    const remaining = operationDeadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`Payload Validation API operation "${operationName}" timed out after ${operationTimeoutMs}ms`);
    }
    return remaining;
  }

  async function sleepWithinBudget(delayMs, operationName) {
    const remaining = remainingTimeoutMs(operationName);
    if (delayMs > remaining) {
      throw new Error(`Payload Validation API operation "${operationName}" timed out after ${operationTimeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const encodedRowKey = encodeURIComponent(rowKey);
  const url = new URL(`/api/distributor-requests/${encodedRowKey}/content`, baseUrl);
  url.searchParams.set("tripId", tripId);
  url.searchParams.set("type", source);

  let responseJson;
  try {
    responseJson = await fetchJson(
      url.toString(),
      remainingTimeoutMs(`get content (${source})`),
      `get content (${source})`,
      token,
      includeAuth
    );
  } catch (error) {
    if (!includeAuth && token && error instanceof HttpError && error.statusCode === 401) {
      responseJson = await fetchJson(
        url.toString(),
        remainingTimeoutMs(`get content (${source}) retry with auth`),
        `get content (${source}) retry with auth`,
        token,
        true
      );
    } else if (token && error instanceof HttpError && error.statusCode === 400) {
      await sleepWithinBudget(2000, `get content (${source}) retry after 400`);
      responseJson = await fetchJson(
        url.toString(),
        remainingTimeoutMs(`get content (${source}) retry after 400`),
        `get content (${source}) retry after 400`,
        token,
        true
      );
    } else {
      throw error;
    }
  }

  const payload = responseJson?.Content ?? responseJson?.content;
  if (typeof payload !== "string") {
    throw new Error(
      `Internal payload validation API returned invalid content payload for rowKey "${rowKey}" ` +
      `and source "${source}". Expected { Content: string }.`
    );
  }

  return payload;
}

/**
 * Fetch a request or response payload from internal distributor requests API.
 *
 * @param {object} options
 * @param {"request"|"response"} options.source  - which content type to download
 * @param {string}  options.requestType           - e.g. "Amadeus4.Car_LocationList"
 * @param {string}  options.tripId                - required trip identifier
 * @param {string}  [options.transactionId]       - optional additional filter
 * @param {number}  [options.lookbackMinutes]     - defaults to config value
 * @returns {Promise<{ payload: string, metadata: object }>}
 */
async function fetchPayloadFromAzureStorage({ source, requestType, tripId, transactionId, sid, lookbackMinutes, returnAllMatches = false, maxMatches } = {}) {
  if (!source || !["request", "response"].includes(source)) {
    throw new Error(`source must be "request" or "response", got: ${source}`);
  }
  if (!requestType || typeof requestType !== "string") {
    throw new Error("requestType must be a non-empty string");
  }
  if (!tripId || String(tripId).trim() === "") {
    throw new Error("tripId is required for internal payload validation API calls");
  }

  const baseUrl = payloadValidation.internalAtriisBaseUrl;
  if (!baseUrl) {
    throw new Error(
      "PAYLOAD_VALIDATION_INTERNAL_ATRIIS_BASE_URL is not set. " +
      "Add it to your .env file to enable payload capture from internal API."
    );
  }
  const token = payloadValidation.internalAtriisToken || null;

  const lookback = lookbackMinutes ?? payloadValidation.lookbackMinutes;
  const operationTimeoutMs = payloadValidation.timeoutMs;
  const configuredMaxRequestsMatches = payloadValidation.maxRequestsMatches;
  const maxRequestsMatches = Number(maxMatches ?? configuredMaxRequestsMatches);
  const lookupAttempts = Number(
    process.env.PAYLOAD_VALIDATION_LOOKUP_ATTEMPTS || process.env.AZURE_STORAGE_LOOKUP_ATTEMPTS || DEFAULT_LOOKUP_ATTEMPTS
  );
  const lookupRetryMs = Number(
    process.env.PAYLOAD_VALIDATION_LOOKUP_RETRY_MS || process.env.AZURE_STORAGE_LOOKUP_RETRY_MS || DEFAULT_LOOKUP_RETRY_MS
  );
  const operationDeadline = Date.now() + operationTimeoutMs;

  const tripIdString = String(tripId).trim();
  let firstListCallIncludeAuth = Boolean(token);

  function remainingTimeoutMs(operationName) {
    const remaining = operationDeadline - Date.now();
    if (remaining <= 0) {
      throw new Error(`Payload Validation API operation "${operationName}" timed out after ${operationTimeoutMs}ms`);
    }
    return remaining;
  }

  async function sleepWithinBudget(delayMs, operationName) {
    const remaining = remainingTimeoutMs(operationName);
    if (delayMs > remaining) {
      throw new Error(`Payload Validation API operation "${operationName}" timed out after ${operationTimeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  function buildFilter(minutesBack, options = {}) {
    const {
      transactionIdOverride = transactionId,
      sidOverride = sid,
      includeRequestType = true,
      includeTripId = true,
      includeTransactionId = true,
      includeSid = true,
    } = options;

    return {
      minutesBack,
      fromDate: new Date(Date.now() - minutesBack * 60 * 1000),
      toDate: new Date(),
      includeRequestType,
      includeTripId,
      includeTransactionId,
      includeSid,
      transactionIdOverride,
      sidOverride,
    };
  }

  function describeFilter(criteria) {
    return JSON.stringify({
      from: criteria.fromDate.toISOString(),
      to: criteria.toDate.toISOString(),
      tripId: criteria.includeTripId ? tripIdString : "<ignored>",
      requestType: criteria.includeRequestType ? requestType : "<ignored>",
      transactionId: criteria.includeTransactionId ? (criteria.transactionIdOverride || null) : "<ignored>",
      sid: criteria.includeSid ? (criteria.sidOverride || null) : "<ignored>",
    });
  }

  async function listTripEntries(includeAuth, operationName) {
    const listUrl = new URL("/api/distributor-requests", baseUrl);
    listUrl.searchParams.set("tripId", tripIdString);
    return await fetchJson(listUrl.toString(), remainingTimeoutMs(operationName), operationName, token, includeAuth);
  }

  async function queryEntries(criteria) {
    let includeAuth = false;
    if (firstListCallIncludeAuth) {
      includeAuth = true;
      firstListCallIncludeAuth = false;
    }

    let rawEntries;
    try {
      rawEntries = await listTripEntries(includeAuth, "list distributor requests");
    } catch (error) {
      if (!includeAuth && token && error instanceof HttpError && error.statusCode === 401) {
        rawEntries = await listTripEntries(true, "list distributor requests retry with auth");
      } else if (token && error instanceof HttpError && error.statusCode === 400) {
        // The API can return 400 "Restart login cookie not found" transiently.
        // Wait briefly and retry with auth to recover.
        await sleepWithinBudget(2000, "list distributor requests retry after 400");
        rawEntries = await listTripEntries(true, "list distributor requests retry after 400");
      } else {
        throw error;
      }
    }

    const entries = Array.isArray(rawEntries) ? rawEntries : [];
    const queryEntriesResult = [];
    for (const rawEntry of entries) {
      const entry = normalizeEntry(rawEntry, tripIdString);
      if (!entry) continue;

      if (entry.timestamp < criteria.fromDate || entry.timestamp > criteria.toDate) continue;
      if (criteria.includeRequestType && entry.requestType !== requestType) continue;
      if (criteria.includeTransactionId && criteria.transactionIdOverride && entry.transactionId !== criteria.transactionIdOverride) continue;
      if (criteria.includeSid && criteria.sidOverride && entry.sid !== criteria.sidOverride) continue;

      queryEntriesResult.push(entry);
    }

    return queryEntriesResult;
  }

  // Some environments publish logs later than expected. Retry with a wider window before failing.
  const expandedLookback = Math.max(lookback * 3, 180);

  let strictFilter = "";
  let expandedFilter = null;
  let sidFallbackFilter = null;
  let transactionFallbackFilter = null;
  let inferredSidFallbackFilter = null;
  let inferredTransactionFallbackFilter = null;
  let entries = [];

  let inferredSid = null;
  let inferredTransactionId = null;
  let inferredContextLoaded = false;

  async function loadInferredContextIfNeeded() {
    if (inferredContextLoaded || !tripId) {
      return;
    }

    const tripContextFilter = buildFilter(expandedLookback, {
      includeRequestType: false,
      includeTransactionId: false,
      includeSid: false,
    });
    const tripContextEntries = await withTimeout(
      queryEntries(tripContextFilter),
      remainingTimeoutMs("query tripContext"),
      "query tripContext"
    );
    tripContextEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    inferredSid = tripContextEntries.find((entry) => entry.sid)?.sid || null;
    inferredTransactionId = tripContextEntries.find((entry) => entry.transactionId)?.transactionId || null;
    inferredContextLoaded = true;
  }

  for (let attempt = 1; attempt <= lookupAttempts; attempt++) {
    entries = [];

    strictFilter = buildFilter(lookback);
    entries = await withTimeout(queryEntries(strictFilter), remainingTimeoutMs("query strict"), "query strict");

    if (entries.length === 0 && expandedLookback > lookback) {
      expandedFilter = buildFilter(expandedLookback);
      entries = await withTimeout(queryEntries(expandedFilter), remainingTimeoutMs("query expanded"), "query expanded");
    }

    if (entries.length === 0 && sid && tripId) {
      sidFallbackFilter = buildFilter(expandedLookback, {
        includeTripId: false,
        includeTransactionId: false,
      });
      entries = await withTimeout(queryEntries(sidFallbackFilter), remainingTimeoutMs("query sid fallback"), "query sid fallback");
    }

    if (entries.length === 0 && transactionId && tripId) {
      transactionFallbackFilter = buildFilter(expandedLookback, {
        includeTripId: false,
        includeSid: false,
      });
      entries = await withTimeout(
        queryEntries(transactionFallbackFilter),
        remainingTimeoutMs("query transactionId fallback"),
        "query transactionId fallback"
      );
    }

    if (entries.length === 0 && !inferredContextLoaded && (!sid || !transactionId)) {
      await loadInferredContextIfNeeded();
    }

    if (entries.length === 0 && inferredSid && !sid) {
      inferredSidFallbackFilter = buildFilter(expandedLookback, {
        sidOverride: inferredSid,
        includeTripId: false,
        includeTransactionId: false,
      });
      entries = await withTimeout(
        queryEntries(inferredSidFallbackFilter),
        remainingTimeoutMs("query inferred sid fallback"),
        "query inferred sid fallback"
      );
    }

    if (entries.length === 0 && inferredTransactionId && !transactionId) {
      inferredTransactionFallbackFilter = buildFilter(expandedLookback, {
        transactionIdOverride: inferredTransactionId,
        includeTripId: false,
        includeSid: false,
      });
      entries = await withTimeout(
        queryEntries(inferredTransactionFallbackFilter),
        remainingTimeoutMs("query inferred transactionId fallback"),
        "query inferred transactionId fallback"
      );
    }

    if (entries.length > 0) {
      break;
    }

    expandedFilter = null;
    sidFallbackFilter = null;
    transactionFallbackFilter = null;
    inferredSidFallbackFilter = null;
    inferredTransactionFallbackFilter = null;

    if (attempt < lookupAttempts) {
      logger.info("Retrying payload validation lookup", {
        retry: attempt,
        source,
        requestType,
        tripId: tripIdString,
        delayMs: lookupRetryMs,
      });
      await sleepWithinBudget(lookupRetryMs, "lookup retry delay");
    }
  }

  if (entries.length === 0) {
    const hint = tripId ? ` for trip "${tripId}"` : "";
    let availableRequestTypesHint = "";

    if (tripId) {
      const diagnosticFilter = buildFilter(expandedLookback, {
        includeRequestType: false,
        includeTransactionId: false,
        includeSid: false,
      });
      const diagnosticEntries = await withTimeout(
        queryEntries(diagnosticFilter),
        remainingTimeoutMs("query diagnosticEntries"),
        "query diagnosticEntries"
      );
      const requestTypes = [...new Set(diagnosticEntries.map((entry) => entry.requestType).filter(Boolean))].sort();
      if (requestTypes.length > 0) {
        availableRequestTypesHint = ` Available request types in this window: ${requestTypes.join(", ")}.`;
      }
    }

    throw new Error(
      `No ${source} payload found for request type "${requestType}"${hint} ` +
      `in the last ${lookback} minutes (expanded search: ${expandedLookback} minutes). ` +
      `Searched endpoint: /api/distributor-requests, strict filter: ${describeFilter(strictFilter)}` +
      (expandedFilter ? `, expanded filter: ${describeFilter(expandedFilter)}` : "") +
      (sidFallbackFilter ? `, sid fallback filter: ${describeFilter(sidFallbackFilter)}` : "") +
      (transactionFallbackFilter ? `, transactionId fallback filter: ${describeFilter(transactionFallbackFilter)}` : "") +
      (inferredSidFallbackFilter ? `, inferred sid fallback filter: ${describeFilter(inferredSidFallbackFilter)}` : "") +
      (inferredTransactionFallbackFilter ? `, inferred transactionId fallback filter: ${describeFilter(inferredTransactionFallbackFilter)}` : "") +
      availableRequestTypesHint
    );
  }

  // Sort newest first and take the latest entry (or return multiple matches when requested)
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (returnAllMatches) {
    const limitedEntries = entries.slice(0, Math.max(1, Number.isFinite(maxRequestsMatches) ? maxRequestsMatches : 10));
    const matches = [];

    for (const entry of limitedEntries) {
      const payload = await downloadPayload({
        baseUrl,
        tripId: tripIdString,
        rowKey: entry.rowKey,
        source,
        operationTimeoutMs: remainingTimeoutMs(`get content (${source})`),
        token,
        includeAuth: false,
      });
      matches.push({
        payload,
        metadata: {
          tripId: entry.tripId,
          requestType: entry.requestType || requestType,
          sid: entry.sid,
          transactionId: entry.transactionId,
          rowKey: entry.rowKey,
          timestamp: entry.timestamp,
        },
      });
    }

    return {
      matches,
      metadata: {
        requestType,
        source,
        totalMatches: entries.length,
        returnedMatches: matches.length,
      },
    };
  }

  const latest = entries[0];

  const payload = await downloadPayload({
    baseUrl,
    tripId: tripIdString,
    rowKey: latest.rowKey,
    source,
    operationTimeoutMs: remainingTimeoutMs(`get content (${source})`),
    token,
    includeAuth: false,
  });

  return {
    payload,
    metadata: {
      tripId:        latest.tripId,
      requestType:   latest.requestType || requestType,
      sid:           latest.sid,
      transactionId: latest.transactionId,
      rowKey:        latest.rowKey,
      timestamp:     latest.timestamp,
    },
  };
}

module.exports = { fetchPayloadFromAzureStorage };
