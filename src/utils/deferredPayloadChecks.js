/**
 * Deferred payload checks — assertions on calls the app logs minutes AFTER the scenario's last action.
 *
 * Some calls are made by a background process, not by the flow the scenario drives: the passive
 * PNR_AddMultiElements that mirrors a Non-GDS hotel into the Amadeus PNR lands 3-10 minutes after
 * the booking (#85676). Waiting for it inside the scenario holds a browser and a parallel worker
 * idle for that whole time. Instead the scenario REGISTERS the check and finishes; once the whole
 * run is over, scripts/verify-deferred-payload-checks.js polls the trip log for every registered
 * check. By then most of the minutes have already gone by running other scenarios.
 *
 *   1. In the scenario: `Then after the run, the "request" payload for request type "X" should
 *      contain:` + a table of texts — stores the check on the world (no waiting).
 *   2. After hook (tests/support/hooks.js): a scenario that PASSED writes its checks to
 *      test-results/deferred-payload-checks/. A failed attempt writes nothing, so with --retry only
 *      the attempt that actually passed is verified.
 *   3. After the run: the verify script polls each check until every text is found or the
 *      deadline passes, then writes the outcome back onto the original scenario in the Cucumber
 *      JSON, JUnit and Allure results, so CI summaries, the rerun plan and the ADO sync see it.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { fetchPayloadFromStorage, downloadPayloadByRowKey } = require("@utils/payloadValidationClient");
const logger = require("@utils/logger").child("DeferredPayloadChecks");

const REGISTRATIONS_DIR = path.join("test-results", "deferred-payload-checks");
const RESULTS_FILE = path.join("test-results", "deferred-payload-checks-results.json");

// Counted from the moment the scenario registered the check (right after the action that triggers
// the background call), not from when verification starts. The hotel passive has been logged 2-5
// minutes after booking on staging (trips 3905743, 3901797), and up to 10 is expected; 15 leaves
// room for a slow staging day. It is only an upper bound: a check stops polling as soon as every
// text is found. Override per run with the env var below.
const DEFAULT_TIMEOUT_MINUTES = 15;
const DEFAULT_POLL_INTERVAL_MS = 30000;
// One listing round: when the type is not logged yet the client retries its own lookups before
// giving up, so the round needs more than the client's 60s default.
const LIST_TIMEOUT_MS = 90000;
const DOWNLOAD_TIMEOUT_MS = 60000;

function getTimeoutMinutes() {
  const value = Number(process.env.DEFERRED_PAYLOAD_CHECK_TIMEOUT_MINUTES);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MINUTES;
}

function getPollIntervalMs() {
  const value = Number(process.env.DEFERRED_PAYLOAD_CHECK_POLL_INTERVAL_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POLL_INTERVAL_MS;
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Persist one passed scenario's checks. One file per scenario: parallel workers are separate
 * processes, so a shared file would need locking.
 *
 * @param {object} registration
 * @param {{uri: string, name: string, line: number|null, featureName: string}} registration.scenario
 * @param {string} registration.notBefore - ISO time the scenario started; older calls are ignored
 * @param {Array<{source: string, requestType: string, tripId: string, expectedTexts: string[], registeredAt: string}>} registration.checks
 * @returns {string} the written file path
 */
function writeRegistration(registration) {
  fs.mkdirSync(REGISTRATIONS_DIR, { recursive: true });
  const file = path.join(REGISTRATIONS_DIR, `${Date.now()}-${process.pid}-${crypto.randomUUID()}.json`);
  fs.writeFileSync(file, JSON.stringify(registration, null, 2));
  return file;
}

/** @returns {Array<object & {file: string}>} every registration on disk, oldest first */
function readRegistrations() {
  if (!fs.existsSync(REGISTRATIONS_DIR)) return [];
  return fs
    .readdirSync(REGISTRATIONS_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => {
      const file = path.join(REGISTRATIONS_DIR, name);
      try {
        return { ...JSON.parse(fs.readFileSync(file, "utf8")), file };
      } catch (error) {
        logger.warn("Skipping unreadable deferred check registration", { file, error: error.message });
        return null;
      }
    })
    .filter(Boolean);
}

function removeRegistrationFiles(registrations) {
  for (const { file } of registrations) {
    fs.rmSync(file, { force: true });
  }
}

function describeCheck(check) {
  return `the "${check.source}" payload for request type "${check.requestType}" contains ` +
    check.expectedTexts.map((text) => `"${text}"`).join(", ");
}

/**
 * Poll the trip log until every expected text is found, or the deadline passes.
 *
 * Same semantics as the live `should contain` steps after their multi-call fallback: each text
 * must appear in at least one logged call of the request type. Every round re-lists the trip and
 * downloads only the calls it has not seen yet, so a slow background call costs one listing per
 * round rather than re-downloading every body.
 *
 * @returns {Promise<object>} the check's result: status "passed" | "failed", missing texts, calls inspected
 */
async function verifyCheck({ notBefore, check, timeoutMinutes, pollIntervalMs }) {
  const { tripId } = check;
  const startedAt = Date.now();
  const deadline = new Date(check.registeredAt).getTime() + timeoutMinutes * 60 * 1000;
  const payloadsByRowKey = new Map();
  let lastError = null;
  let rounds = 0;
  let missing = [...check.expectedTexts];

  for (;;) {
    rounds++;
    try {
      const minutesSinceStart = (Date.now() - new Date(notBefore).getTime()) / 60000;
      const listing = await fetchPayloadFromStorage({
        source: check.source,
        requestType: check.requestType,
        tripId,
        notBefore: new Date(notBefore),
        // A long suite can verify a check an hour after its scenario ran; the client's default
        // window would no longer reach back to the call. notBefore stays the real floor.
        lookbackMinutes: Math.ceil(minutesSinceStart) + 5,
        listOnly: true,
        timeoutMs: LIST_TIMEOUT_MS,
      });
      lastError = null;
      for (const entry of listing.entries) {
        if (payloadsByRowKey.has(entry.rowKey)) continue;
        try {
          const payload = await downloadPayloadByRowKey({
            tripId,
            rowKey: entry.rowKey,
            source: check.source,
            timeoutMs: DOWNLOAD_TIMEOUT_MS,
          });
          payloadsByRowKey.set(entry.rowKey, payload);
        } catch (error) {
          // The listing can show a row before its body is readable; the next round retries it.
          lastError = error;
        }
      }
    } catch (error) {
      // "No request payload found" until the background call is logged — keep polling.
      lastError = error;
    }

    const payloads = [...payloadsByRowKey.values()];
    missing = check.expectedTexts.filter((text) => !payloads.some((payload) => payload.includes(text)));
    const base = {
      ...check,
      callsInspected: payloadsByRowKey.size,
      rounds,
      waitedSeconds: Math.round((Date.now() - startedAt) / 1000),
    };

    if (missing.length === 0) {
      return { ...base, status: "passed", missing: [] };
    }
    if (Date.now() + pollIntervalMs > deadline) {
      return {
        ...base,
        status: "failed",
        missing,
        error:
          `Deferred check failed: ${describeCheck(check)}. ` +
          `Not found within ${timeoutMinutes} min of the check being registered: ` +
          `${missing.map((text) => `"${text}"`).join(", ")}. ` +
          `Inspected ${payloadsByRowKey.size} "${check.requestType}" call(s) of trip ${tripId}.` +
          (lastError ? ` Last lookup error: ${lastError.message}` : ""),
      };
    }
    logger.info("Deferred check not satisfied yet — polling again", {
      tripId,
      requestType: check.requestType,
      missing,
      callsInspected: payloadsByRowKey.size,
      nextPollInSeconds: Math.round(pollIntervalMs / 1000),
    });
    await sleep(pollIntervalMs);
  }
}

/**
 * Verify every check of every registration, a few at a time (the internal API rate-limits bursts).
 *
 * @returns {Promise<Array<object>>} one result per registration: its scenario, trips, status and check results
 */
async function verifyRegistrations(registrations, { concurrency = 3 } = {}) {
  const timeoutMinutes = getTimeoutMinutes();
  const pollIntervalMs = getPollIntervalMs();
  const results = new Array(registrations.length);
  let next = 0;

  async function worker() {
    while (next < registrations.length) {
      const index = next++;
      const registration = registrations[index];
      const checks = [];
      for (const check of registration.checks) {
        checks.push(await verifyCheck({
          notBefore: registration.notBefore,
          check,
          timeoutMinutes,
          pollIntervalMs,
        }));
      }
      results[index] = {
        scenario: registration.scenario,
        tripIds: [...new Set(registration.checks.map((check) => check.tripId))],
        status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
        checks,
      };
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, registrations.length) }, worker));
  return results;
}

module.exports = {
  REGISTRATIONS_DIR,
  RESULTS_FILE,
  describeCheck,
  writeRegistration,
  readRegistrations,
  removeRegistrationFiles,
  verifyRegistrations,
};
