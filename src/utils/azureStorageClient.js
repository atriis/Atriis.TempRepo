/**
 * Azure Storage client for payload capture.
 *
 * Queries the Azure Table Storage `AmadeusLogEntity` table by TripId + RequestType,
 * then downloads and decrypts the request or response blob.
 *
 * NOTE: Despite the legacy name "AmadeusLogEntity", this table stores logs from ALL GDS providers
 * (Amadeus, Galileo, Sabre, Fusion, Ypsilon, etc.) and all request types.
 *
 * Storage layout (mirrors TMC2StorageViewer):
 *   Table  : AmadeusLogEntity  (PartitionKey = TripId as string, stores all GDS/providers)
 *   Blobs  : container "xml{MMyyyy}" (e.g. "xml052026"), AES-128-CBC encrypted
 *
 * Required env vars:
 *   AZURE_STORAGE_CONNECTION_STRING   — connection string for the storage account
 *   AZURE_STORAGE_LOOKBACK_MINUTES    — how far back to search (default: 60)
 *   AZURE_STORAGE_TIMEOUT_MS          — per-operation timeout in ms (default: 30000)
 */

const { TableClient } = require("@azure/data-tables");
const { BlobServiceClient } = require("@azure/storage-blob");
const crypto = require("crypto");
const config = require("@config/config");

// AES-128-CBC key and IV shared with TMC2StorageViewer / the platform.
// Source: TMC2StorageViewer App.config "SymmerticEncryption".
const AES_KEY = Buffer.from("+oT+yb8ouVJIa5USbBZqwQ==", "base64");
const AES_IV  = Buffer.from("oHuUytGEdvLePEEJA62iaw==", "base64");

// Table name (legacy naming—despite "Amadeus" in the name, stores all GDS providers: Amadeus, Galileo, Sabre, etc.)
const TABLE_NAME = "AmadeusLogEntity";

const DEFAULT_LOOKUP_ATTEMPTS = 6;
const DEFAULT_LOOKUP_RETRY_MS = 3000;

/**
 * Decrypt a base64-encoded AES-128-CBC ciphertext.
 * @param {string} base64Text
 * @returns {string} plaintext
 */
function decryptBlob(base64Text) {
  const ciphertext = Buffer.from(base64Text, "base64");
  const decipher = crypto.createDecipheriv("aes-128-cbc", AES_KEY, AES_IV);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Build a list of container name candidates to try for a given blob, starting from
 * the current month and going back up to 12 months (matching TMC2StorageViewer logic).
 * @param {Date} referenceDate
 * @returns {string[]}
 */
function buildContainerCandidates(referenceDate) {
  const candidates = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(referenceDate);
    d.setMonth(d.getMonth() - i);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    candidates.push(`xml${mm}${yyyy}`);
  }
  return candidates;
}

/**
 * Download and decrypt a blob from Azure Blob Storage, trying container name
 * candidates from newest month backwards until one succeeds.
 *
 * @param {BlobServiceClient} blobServiceClient
 * @param {string} blobName
 * @param {Date} referenceDate
 * @returns {Promise<string>} decrypted content
 */
async function downloadBlob(blobServiceClient, blobName, referenceDate) {
  const containerCandidates = buildContainerCandidates(referenceDate);

  for (const containerName of containerCandidates) {
    try {
      const containerClient = blobServiceClient.getContainerClient(containerName);
      const blobClient = containerClient.getBlobClient(blobName);
      const downloadResponse = await blobClient.download();
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      return decryptBlob(raw);
    } catch {
      // Container or blob not found — try next month candidate
    }
  }

  throw new Error(`Blob "${blobName}" not found in any container candidate (tried: ${containerCandidates.join(", ")})`);
}

/**
 * Fetch a request or response payload from Azure Table Storage + Blob Storage.
 *
 * @param {object} options
 * @param {"request"|"response"} options.source  - which blob to download
 * @param {string}  options.requestType           - e.g. "Amadeus4.Car_LocationList"
 * @param {string}  [options.tripId]              - PartitionKey filter (highly recommended)
 * @param {string}  [options.transactionId]       - optional additional filter
 * @param {number}  [options.lookbackMinutes]     - defaults to config value
 * @returns {Promise<{ payload: string, metadata: object }>}
 */
async function fetchPayloadFromAzureStorage({ source, requestType, tripId, transactionId, sid, lookbackMinutes, returnAllMatches = false, maxMatches = 10 } = {}) {
  if (!source || !["request", "response"].includes(source)) {
    throw new Error(`source must be "request" or "response", got: ${source}`);
  }
  if (!requestType || typeof requestType !== "string") {
    throw new Error("requestType must be a non-empty string");
  }

  const connectionString = config.azureStorage.connectionString;
  if (!connectionString) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING is not set. " +
      "Add it to your .env file to enable payload capture from Azure Storage."
    );
  }

  const lookback = lookbackMinutes ?? config.azureStorage.lookbackMinutes;

  const tableClient = TableClient.fromConnectionString(connectionString, TABLE_NAME);
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const lookupAttempts = Number(process.env.AZURE_STORAGE_LOOKUP_ATTEMPTS || DEFAULT_LOOKUP_ATTEMPTS);
  const lookupRetryMs = Number(process.env.AZURE_STORAGE_LOOKUP_RETRY_MS || DEFAULT_LOOKUP_RETRY_MS);

  const blobNameField = source === "request" ? "RequestBlobName" : "ResponseBlobName";

  function buildFilter(minutesBack, options = {}) {
    const {
      transactionIdOverride = transactionId,
      sidOverride = sid,
      includeRequestType = true,
      includeTripId = true,
      includeTransactionId = true,
      includeSid = true,
    } = options;

    const fromDate = new Date(Date.now() - minutesBack * 60 * 1000);
    const toDate = new Date();
    let currentFilter = `Timestamp ge datetime'${fromDate.toISOString()}' and Timestamp le datetime'${toDate.toISOString()}'`;

    if (includeTripId && tripId) {
      currentFilter += ` and PartitionKey eq '${tripId}'`;
    }

    if (includeRequestType) {
      currentFilter += ` and RequestType eq '${requestType}'`;
    }

    if (includeTransactionId && transactionIdOverride) {
      currentFilter += ` and TransactionId eq '${transactionIdOverride}'`;
    }

    if (includeSid && sidOverride) {
      currentFilter += ` and Sid eq '${sidOverride}'`;
    }

    return currentFilter;
  }

  async function queryEntries(filter) {
    const queryEntriesResult = [];
    const queryResult = tableClient.listEntities({ queryOptions: { filter } });

    for await (const entity of queryResult) {
      const blobName = entity[blobNameField];
      if (blobName) {
        queryEntriesResult.push({
          tripId:          entity.partitionKey,
          rowKey:          entity.rowKey,
          requestType:     entity.requestType || entity.RequestType,
          sid:             entity.sid || entity.Sid,
          transactionId:   entity.transactionId || entity.TransactionId,
          blobName,
          timestamp:       entity.timestamp,
        });
      }
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
  if (tripId) {
    const tripContextFilter = buildFilter(expandedLookback, {
      includeRequestType: false,
      includeTransactionId: false,
      includeSid: false,
    });
    const tripContextEntries = await queryEntries(tripContextFilter);
    tripContextEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    inferredSid = tripContextEntries.find((entry) => entry.sid)?.sid || null;
    inferredTransactionId = tripContextEntries.find((entry) => entry.transactionId)?.transactionId || null;
  }

  for (let attempt = 1; attempt <= lookupAttempts; attempt++) {
    entries = [];

    strictFilter = buildFilter(lookback);
    entries = await queryEntries(strictFilter);

    if (entries.length === 0 && expandedLookback > lookback) {
      expandedFilter = buildFilter(expandedLookback);
      entries = await queryEntries(expandedFilter);
    }

    if (entries.length === 0 && sid && tripId) {
      sidFallbackFilter = buildFilter(expandedLookback, {
        includeTripId: false,
        includeTransactionId: false,
      });
      entries = await queryEntries(sidFallbackFilter);
    }

    if (entries.length === 0 && transactionId && tripId) {
      transactionFallbackFilter = buildFilter(expandedLookback, {
        includeTripId: false,
        includeSid: false,
      });
      entries = await queryEntries(transactionFallbackFilter);
    }

    if (entries.length === 0 && inferredSid && !sid) {
      inferredSidFallbackFilter = buildFilter(expandedLookback, {
        sidOverride: inferredSid,
        includeTripId: false,
        includeTransactionId: false,
      });
      entries = await queryEntries(inferredSidFallbackFilter);
    }

    if (entries.length === 0 && inferredTransactionId && !transactionId) {
      inferredTransactionFallbackFilter = buildFilter(expandedLookback, {
        transactionIdOverride: inferredTransactionId,
        includeTripId: false,
        includeSid: false,
      });
      entries = await queryEntries(inferredTransactionFallbackFilter);
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
      await new Promise((resolve) => setTimeout(resolve, lookupRetryMs));
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
      const diagnosticEntries = await queryEntries(diagnosticFilter);
      const requestTypes = [...new Set(diagnosticEntries.map((entry) => entry.requestType).filter(Boolean))].sort();
      if (requestTypes.length > 0) {
        availableRequestTypesHint = ` Available request types in this window: ${requestTypes.join(", ")}.`;
      }
    }

    throw new Error(
      `No ${source} payload found for request type "${requestType}"${hint} ` +
      `in the last ${lookback} minutes (expanded search: ${expandedLookback} minutes). ` +
      `Searched table: ${TABLE_NAME}, strict filter: ${strictFilter}` +
      (expandedFilter ? `, expanded filter: ${expandedFilter}` : "") +
      (sidFallbackFilter ? `, sid fallback filter: ${sidFallbackFilter}` : "") +
      (transactionFallbackFilter ? `, transactionId fallback filter: ${transactionFallbackFilter}` : "") +
      (inferredSidFallbackFilter ? `, inferred sid fallback filter: ${inferredSidFallbackFilter}` : "") +
      (inferredTransactionFallbackFilter ? `, inferred transactionId fallback filter: ${inferredTransactionFallbackFilter}` : "") +
      availableRequestTypesHint
    );
  }

  // Sort newest first and take the latest entry (or return multiple matches when requested)
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (returnAllMatches) {
    const limitedEntries = entries.slice(0, Math.max(1, Number(maxMatches) || 10));
    const matches = [];

    for (const entry of limitedEntries) {
      const payload = await downloadBlob(blobServiceClient, entry.blobName, new Date());
      matches.push({
        payload,
        metadata: {
          tripId: entry.tripId,
          requestType: entry.requestType || requestType,
          sid: entry.sid,
          transactionId: entry.transactionId,
          blobName: entry.blobName,
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

  const payload = await downloadBlob(blobServiceClient, latest.blobName, new Date());

  return {
    payload,
    metadata: {
      tripId:        latest.tripId,
      requestType:   latest.requestType || requestType,
      sid:           latest.sid,
      transactionId: latest.transactionId,
      blobName:      latest.blobName,
      timestamp:     latest.timestamp,
    },
  };
}

module.exports = { fetchPayloadFromAzureStorage };
