#!/usr/bin/env node
/**
 * Standalone connection test for the internal Payload Validation API
 * (the same endpoint used by src/utils/payloadValidationClient.js).
 *
 * Reads its config the same way the test framework does (.env via
 * PAYLOAD_VALIDATION_INTERNAL_ATRIIS_BASE_URL / _TOKEN), so it will surface
 * the exact same connectivity/config issues a real test run would hit —
 * without needing to run a full Cucumber scenario first.
 *
 * Usage:
 *   node scripts/check-payload-api.js --tripId 3768378
 *   node scripts/check-payload-api.js --tripId 3768378 --requestType "Amadeus4.Car_LocationList"
 *   node scripts/check-payload-api.js --tripId 3768378 --requestType "Amadeus4.Car_Location*"
 *   node scripts/check-payload-api.js 3768378 "Amadeus4.Car_Location*"   (positional shorthand)
 *   node scripts/check-payload-api.js --tripId 3768378 --requestType "Amadeus4.Car_LocationList" --search "MADX03"
 *   node scripts/check-payload-api.js --tripId 3768378 --search "MADX03" --source response
 *
 * Flags:
 *   --tripId <id>        required — trip id to look up
 *   --requestType <rt>   optional — exact match or "*" wildcard (e.g. "Car_Location*")
 *   --search <pattern>   optional — downloads matching entries' content and checks for an
 *                         exact substring match (case-insensitive) inside the payload body
 *   --source <s>         optional — which content to search: "request", "response", or
 *                         "both" (default: "both"). Only used with --search.
 *   --limit <n>          optional — max entries to download content for when using --search
 *                         (default: 20, newest first)
 *   --verbose            print the full raw entry list as JSON
 */

require("module-alias/register");
const config = require("@config/config");

function parseArgs(argv) {
  const args = { tripId: null, requestType: null, verbose: false, search: null, source: "both", limit: 20 };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tripId" || arg === "--trip") {
      args.tripId = argv[++i];
    } else if (arg === "--requestType" || arg === "--type") {
      args.requestType = argv[++i];
    } else if (arg === "--search") {
      args.search = argv[++i];
    } else if (arg === "--source") {
      args.source = argv[++i];
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i]);
    } else if (arg === "--verbose" || arg === "-v") {
      args.verbose = true;
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    }
  }

  if (!args.tripId) args.tripId = positional[0] || null;
  if (!args.requestType) args.requestType = positional[1] || null;

  if (!["request", "response", "both"].includes(args.source)) {
    console.error(`Invalid --source "${args.source}". Must be "request", "response", or "both".`);
    process.exit(1);
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    args.limit = 20;
  }

  return args;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Mirrors buildRequestTypeMatcher in src/utils/payloadValidationClient.js
function buildRequestTypeMatcher(requestTypePattern) {
  if (!requestTypePattern) {
    return { hasWildcard: false, matches: () => true };
  }

  const normalizedPattern = String(requestTypePattern).trim();
  const hasWildcard = normalizedPattern.includes("*");

  if (!hasWildcard) {
    return { hasWildcard, matches: (value) => value === normalizedPattern };
  }

  const regexPattern = `^${normalizedPattern.split("*").map(escapeRegex).join(".*")}$`;
  const requestTypeRegex = new RegExp(regexPattern);
  return { hasWildcard, matches: (value) => requestTypeRegex.test(String(value || "")) };
}

async function downloadContent({ baseUrl, token, tripId, rowKey, source }) {
  const url = new URL(`/api/distributor-requests/${encodeURIComponent(rowKey)}/content`, baseUrl);
  url.searchParams.set("tripId", tripId);
  url.searchParams.set("type", source);

  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url.toString(), { method: "GET", headers });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}${bodyText ? ` — ${bodyText}` : ""}`);
  }

  const json = await response.json();
  const content = json?.Content ?? json?.content;
  if (typeof content !== "string") {
    throw new Error("response did not include a string \"Content\" field");
  }
  return content;
}

// Exact substring match, case-insensitive — same semantics as the DSL's plain-text contains check.
function findMatch(content, pattern) {
  const index = content.toLowerCase().indexOf(String(pattern).toLowerCase());
  if (index === -1) return null;

  const contextRadius = 60;
  const start = Math.max(0, index - contextRadius);
  const end = Math.min(content.length, index + pattern.length + contextRadius);
  const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
  return { index, snippet: `${start > 0 ? "…" : ""}${snippet}${end < content.length ? "…" : ""}` };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.tripId) {
    console.error(
      "Usage: node scripts/check-payload-api.js --tripId <id> [--requestType <type|wildcard*>] " +
      "[--search <pattern> [--source request|response|both] [--limit <n>]] [--verbose]",
    );
    process.exit(1);
  }

  const baseUrl = config.payloadValidation.internalAtriisBaseUrl;
  const token = config.payloadValidation.internalAtriisToken;

  if (!baseUrl) {
    console.error("PAYLOAD_VALIDATION_INTERNAL_ATRIIS_BASE_URL is not set. Add it to your .env file.");
    process.exit(1);
  }

  const url = new URL("/api/distributor-requests", baseUrl);
  url.searchParams.set("tripId", args.tripId);

  console.log(`Connecting to ${url.toString()}`);
  console.log(`Trip ID: ${args.tripId}`);
  console.log(`Request type filter: ${args.requestType || "(none — showing all)"}\n`);

  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const startedAt = Date.now();
  let response;
  try {
    response = await fetch(url.toString(), { method: "GET", headers });
  } catch (networkError) {
    const cause = networkError.cause?.message || networkError.cause?.code || networkError.message;
    console.error(`Connection FAILED after ${Date.now() - startedAt}ms.`);
    console.error(`Ensure you are connected to VPN. Underlying error: ${cause}`);
    process.exit(1);
  }
  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    console.error("Connection reached the API but it returned an error.");
    console.error(`Status: ${response.status} (${latencyMs}ms)`);
    if (bodyText) console.error(`Body: ${bodyText}`);
    process.exit(1);
  }

  const json = await response.json();
  const entries = Array.isArray(json?.entries) ? json.entries : [];

  console.log(`Connection OK — HTTP ${response.status} in ${latencyMs}ms`);
  console.log(`Total entries for trip ${args.tripId}: ${entries.length}\n`);

  if (args.verbose) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }

  const matcher = buildRequestTypeMatcher(args.requestType);
  const matches = entries.filter((entry) => matcher.matches(entry.requestType || entry.RequestType));

  if (args.requestType) {
    console.log(`Matching "${args.requestType}": ${matches.length} entr${matches.length === 1 ? "y" : "ies"}\n`);
  }

  const toShow = args.requestType ? matches : entries;
  if (toShow.length === 0) {
    console.log("No entries to show.");
    const availableTypes = [...new Set(entries.map((e) => e.requestType || e.RequestType).filter(Boolean))].sort();
    if (availableTypes.length > 0) {
      console.log(`\nAvailable request types for this trip: ${availableTypes.join(", ")}`);
    }
    return;
  }

  const sorted = toShow.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (args.search) {
    const candidates = sorted.slice(0, args.limit);
    if (sorted.length > candidates.length) {
      console.log(`Searching content of the ${candidates.length} newest entries (of ${sorted.length} total — raise --limit to search more).\n`);
    }

    const sourcesToCheck = args.source === "both" ? ["request", "response"] : [args.source];
    let matchCount = 0;

    for (const entry of candidates) {
      console.log(`- ${entry.requestType || entry.RequestType} (${entry.timestamp}, rowKey: ${entry.rowKey})`);

      for (const source of sourcesToCheck) {
        try {
          const content = await downloadContent({ baseUrl, token, tripId: args.tripId, rowKey: entry.rowKey, source });
          const found = findMatch(content, args.search);
          if (found) {
            matchCount++;
            console.log(`  [${source}] MATCH — "${args.search}"`);
            console.log(`    ...${found.snippet}...`);
          } else {
            console.log(`  [${source}] no match`);
          }
        } catch (error) {
          console.log(`  [${source}] ERROR downloading content: ${error.message}`);
        }
      }
      console.log("");
    }

    console.log(`Found "${args.search}" in ${matchCount} of ${candidates.length * sourcesToCheck.length} checked payload(s).`);
    return;
  }

  sorted.forEach((entry) => {
    console.log(`- ${entry.requestType || entry.RequestType}`);
    console.log(`  timestamp: ${entry.timestamp}`);
    console.log(`  sid: ${entry.sid || "(none)"}  rowKey: ${entry.rowKey}`);
    console.log(`  request:  ${entry.requestBlobName}`);
    console.log(`  response: ${entry.responseBlobName}`);
    console.log("");
  });
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
