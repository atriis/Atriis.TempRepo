#!/usr/bin/env node
/**
 * Verify the deferred payload checks registered during a cucumber run, and write each outcome
 * back onto the scenario that registered it.
 *
 * Run it AFTER cucumber-js has exited (the reports are only written at the very end):
 *   npx cucumber-js <path> && npm run deferred:verify          # locally
 *   CI: a step right after the cucumber step, before the report uploads
 *
 * Why: a call made by a background process minutes after the scenario's last action (the passive
 * hotel PNR_AddMultiElements of #85676) used to be awaited inside the scenario with fixed waits.
 * The scenario now registers the check (see src/utils/deferredPayloadChecks.js) and this script
 * polls for every registered check once the run is over, by which time most of the background
 * delay has already passed while other scenarios ran.
 *
 * A failed check is written onto the original scenario as a failed step in
 * test-results/cucumber-report.json and as a <failure> in test-results/cucumber-junit.xml, and
 * the scenario's allure-results entry is set to failed. The CI summary, the nightly rerun plan
 * and the ADO sync read those files, so they all see the scenario as failed. A passed check is
 * added as a passed step in the Cucumber JSON so the report shows it ran.
 *
 * Exit code: 1 when any check failed, 0 otherwise (including when nothing was registered).
 *
 * Env:
 *   DEFERRED_PAYLOAD_CHECK_TIMEOUT_MINUTES   - per check, from its registration (default 15)
 *   DEFERRED_PAYLOAD_CHECK_POLL_INTERVAL_MS  - delay between polls (default 30000)
 */

require("module-alias/register");

// The verifier polls on its own schedule, so the client's quick lookup retries (8 lookups 3s apart
// while a type is not logged yet) would only multiply the list calls of every round — and the
// list endpoint answers a burst with 429. Read before the client is loaded; an explicit value wins.
process.env.PAYLOAD_VALIDATION_LOOKUP_ATTEMPTS = process.env.PAYLOAD_VALIDATION_LOOKUP_ATTEMPTS || "1";

const fs = require("fs");
const path = require("path");
const {
  RESULTS_FILE,
  describeCheck,
  readRegistrations,
  removeRegistrationFiles,
  verifyRegistrations,
} = require("@utils/deferredPayloadChecks");

const CUCUMBER_JSON = path.join("test-results", "cucumber-report.json");
const JUNIT_XML = path.join("test-results", "cucumber-junit.xml");
const ALLURE_DIR = "allure-results";
const STEP_LOCATION = "scripts/verify-deferred-payload-checks.js";

function log(message) {
  console.log(`[deferred-payload-checks] ${message}`);
}

function xmlUnescape(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function xmlEscapeAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, "&#10;");
}

function cdata(value) {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * The run's start time, from the JUnit report. A registration older than it was left behind by an
 * earlier local run that was never verified, and must not be written onto this run's scenarios.
 */
function readRunStartedAt() {
  if (!fs.existsSync(JUNIT_XML)) return null;
  const match = fs.readFileSync(JUNIT_XML, "utf8").match(/<testsuite\b[^>]*\btimestamp="([^"]+)"/);
  const startedAt = match ? new Date(match[1]) : null;
  return startedAt && !Number.isNaN(startedAt.getTime()) ? startedAt : null;
}

function failureMessage(result) {
  return result.checks
    .filter((check) => check.status === "failed")
    .map((check) => check.error)
    .join("\n");
}

/** Pick the report entry for a scenario: same name, and the same line when several share it. */
function pickByLine(candidates, line, getLine) {
  if (candidates.length <= 1 || line == null) return candidates[candidates.length - 1];
  return candidates.find((candidate) => getLine(candidate) === line) || candidates[candidates.length - 1];
}

function patchCucumberJson(results) {
  if (!fs.existsSync(CUCUMBER_JSON)) {
    log(`${CUCUMBER_JSON} not found — Cucumber JSON not updated`);
    return;
  }
  const features = JSON.parse(fs.readFileSync(CUCUMBER_JSON, "utf8"));

  for (const result of results) {
    const { uri, name, line } = result.scenario;
    const feature = features.find((candidate) => String(candidate.uri || "").replace(/\\/g, "/") === uri);
    const elements = (feature?.elements || []).filter((element) => element.type === "scenario" && element.name === name);
    const element = pickByLine(elements, line, (candidate) => candidate.line);
    if (!element) {
      log(`Scenario "${name}" (${uri}) not found in the Cucumber JSON — not updated there`);
      continue;
    }

    const steps = result.checks.map((check) => ({
      keyword: "Then ",
      name: `(verified after the run) ${describeCheck(check)}`,
      line: element.line,
      match: { location: STEP_LOCATION },
      result: {
        status: check.status,
        duration: check.waitedSeconds * 1e9,
        ...(check.status === "failed" && { error_message: check.error }),
      },
    }));
    // Before the trailing After hooks, where the scenario's own last step was.
    const trailingHooks = element.steps.length - element.steps.findLastIndex((step) => !step.hidden) - 1;
    element.steps.splice(element.steps.length - trailingHooks, 0, ...steps);
  }

  fs.writeFileSync(CUCUMBER_JSON, JSON.stringify(features, null, 2));
  log(`Updated ${CUCUMBER_JSON}`);
}

function patchJunit(failedResults) {
  if (failedResults.length === 0) return;
  if (!fs.existsSync(JUNIT_XML)) {
    log(`${JUNIT_XML} not found — JUnit report not updated`);
    return;
  }
  let xml = fs.readFileSync(JUNIT_XML, "utf8");
  let newFailures = 0;

  for (const result of failedResults) {
    const { featureName, name } = result.scenario;
    const testcases = [...xml.matchAll(/<testcase\b([^>]*?)(\/?)>/g)]
      .map((match) => {
        const attributes = Object.fromEntries(
          [...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, xmlUnescape(value)]),
        );
        return { match, attributes, selfClosing: match[2] === "/" };
      })
      .filter(({ attributes }) => attributes.classname === featureName &&
        (attributes.name === name || String(attributes.name).includes(name)));
    // The last attempt is the one that passed and registered the check.
    const testcase = testcases[testcases.length - 1];
    if (!testcase) {
      log(`Scenario "${name}" not found in the JUnit report — not updated there`);
      continue;
    }

    const message = failureMessage(result);
    const failure =
      `<failure type="DeferredPayloadCheck" message="${xmlEscapeAttribute(message)}">${cdata(message)}</failure>`;
    const start = testcase.match.index;
    const openTag = testcase.match[0];
    const replacement = testcase.selfClosing
      ? `${openTag.replace(/\s*\/>$/, ">")}\n    ${failure}\n  </testcase>`
      : `${openTag}\n    ${failure}`;
    const closeIndex = xml.indexOf("</testcase>", start);
    const alreadyFailed = !testcase.selfClosing && /<failure\b/.test(xml.slice(start, closeIndex));
    xml = xml.slice(0, start) + replacement + xml.slice(start + openTag.length);
    if (!alreadyFailed) newFailures++;
  }

  xml = xml.replace(/(<testsuite\b[^>]*\bfailures=")(\d+)(")/, (_, before, count, after) =>
    `${before}${Number(count) + newFailures}${after}`);
  fs.writeFileSync(JUNIT_XML, xml);
  log(`Updated ${JUNIT_XML}`);
}

function patchAllure(failedResults) {
  if (failedResults.length === 0 || !fs.existsSync(ALLURE_DIR)) return;
  const files = fs.readdirSync(ALLURE_DIR).filter((file) => file.endsWith("-result.json"));
  let updated = 0;
  const allureResults = files.map((file) => {
    const fullPath = path.join(ALLURE_DIR, file);
    return { fullPath, data: JSON.parse(fs.readFileSync(fullPath, "utf8")) };
  });

  for (const result of failedResults) {
    const fullName = `${result.scenario.uri}#${result.scenario.name}`;
    const attempts = allureResults
      .filter(({ data }) => data.fullName === fullName)
      .sort((a, b) => (a.data.stop || 0) - (b.data.stop || 0));
    const latest = attempts[attempts.length - 1];
    if (!latest) {
      log(`Scenario "${result.scenario.name}" not found in ${ALLURE_DIR} — not updated there`);
      continue;
    }

    const message = failureMessage(result);
    const now = Date.now();
    latest.data.status = "failed";
    latest.data.statusDetails = { message, trace: message };
    latest.data.steps = [
      ...(latest.data.steps || []),
      ...result.checks.map((check) => ({
        name: `(verified after the run) ${describeCheck(check)}`,
        status: check.status,
        stage: "finished",
        statusDetails: check.status === "failed" ? { message: check.error } : {},
        start: now,
        stop: now,
        steps: [],
        attachments: [],
        parameters: [],
      })),
    ];
    fs.writeFileSync(latest.fullPath, JSON.stringify(latest.data));
    updated++;
  }
  if (updated > 0) log(`Updated ${updated} result(s) in ${ALLURE_DIR}`);
}

async function main() {
  let registrations = readRegistrations();
  if (registrations.length === 0) {
    log("No deferred payload checks registered — nothing to verify");
    return 0;
  }

  const runStartedAt = readRunStartedAt();
  if (runStartedAt) {
    const stale = registrations.filter((registration) => new Date(registration.notBefore) < runStartedAt);
    if (stale.length > 0) {
      log(`Discarding ${stale.length} registration(s) left over from a run before ${runStartedAt.toISOString()}`);
      removeRegistrationFiles(stale);
      registrations = registrations.filter((registration) => !stale.includes(registration));
    }
  }
  if (registrations.length === 0) {
    log("No deferred payload checks registered by this run — nothing to verify");
    return 0;
  }

  log(`Verifying ${registrations.length} scenario(s) with deferred payload checks`);
  const results = await verifyRegistrations(registrations);

  for (const result of results) {
    log(`${result.status.toUpperCase()}  ${result.scenario.featureName} — ${result.scenario.name} (trip ${result.tripIds.join(", ")})`);
    for (const check of result.checks) {
      log(`  ${check.status === "passed" ? "ok  " : "FAIL"} ${describeCheck(check)} ` +
        `(${check.callsInspected} call(s) inspected, waited ${check.waitedSeconds}s)`);
      if (check.status === "failed") log(`       ${check.error}`);
    }
  }

  const failed = results.filter((result) => result.status === "failed");
  patchCucumberJson(results);
  patchJunit(failed);
  patchAllure(failed);

  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
  removeRegistrationFiles(registrations);

  if (process.env.GITHUB_ACTIONS) {
    for (const result of failed) {
      const title = `Deferred payload check failed: ${result.scenario.featureName}`;
      console.log(`::error title=${title}::${failureMessage(result).replace(/\r?\n/g, "%0A")}`);
    }
  }

  log(`${results.length - failed.length} passed, ${failed.length} failed — details in ${RESULTS_FILE}`);
  return failed.length > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`[deferred-payload-checks] ${error.stack || error.message}`);
    process.exit(1);
  });
