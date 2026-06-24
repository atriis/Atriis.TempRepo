#!/usr/bin/env node
/*
 * Reconciles the suites that were SUPPOSED to run (from .github/suites.json)
 * against the result artifacts that actually arrived, and writes an
 * authoritative summary to $GITHUB_STEP_SUMMARY.
 *
 * Why this exists: each suite's cucumber-report.json / cucumber-junit.xml is
 * flushed only when the run finishes. When a job hits its step timeout (or
 * crashes), the process is killed mid-run and those files are never written —
 * the `if: always()` upload then ships an empty artifact. The old report job
 * merged "whatever showed up", so a timed-out suite silently vanished from the
 * count and, because its failure count was 0, the run could even read as
 * "ALL TESTS PASSED". (See run #439: Hotels Non Booking + Flights General Non
 * Booking timed out at 60 min, dropping ~127 scenarios from the headline.)
 *
 * This script makes that impossible:
 *   1. A suite with no usable results is reported loudly as NO RESULTS and
 *      fails the report job (non-zero exit) so the run goes red.
 *   2. For a timed-out suite we recover the scenarios that DID complete from
 *      the incrementally-written cucumber message stream (messages.ndjson),
 *      labelled INCOMPLETE, so the count reflects reality instead of 0.
 *
 * Inputs (relative to CWD = repo root in the report job):
 *   .github/suites.json                                  - expected suites
 *   all-results/<suite_id>-report/cucumber-report.json   - normal results
 *   all-results/<suite_id>-messages/messages.ndjson      - stream (timeout fallback)
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = 'all-results';
const MANIFEST = '.github/suites.json';

function appendSummary(md) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) fs.appendFileSync(file, md + '\n');
  else process.stdout.write(md + '\n');
}

/** Count scenarios from a cucumber JSON report. Returns null if unusable. */
function fromJsonReport(suiteId) {
  const file = path.join(RESULTS_DIR, `${suiteId}-report`, 'cucumber-report.json');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return null; }
  if (!raw.trim()) return null;
  let data;
  try { data = JSON.parse(raw); } catch { return null; }

  const features = Array.isArray(data) ? data : [data];
  let passed = 0, failed = 0, skipped = 0, total = 0;
  for (const feature of features) {
    for (const el of (feature.elements || [])) {
      if (el.type !== 'scenario') continue;
      total++;
      const steps = el.steps || [];
      const hasFail = steps.some(s => s.result && s.result.status === 'failed');
      const allSkip = steps.every(s => !s.result || ['skipped', 'undefined', 'pending'].includes(s.result.status));
      if (hasFail) failed++;
      else if (allSkip) skipped++;
      else passed++;
    }
  }
  if (total === 0) return null;
  return { passed, failed, skipped, total, source: 'json' };
}

/**
 * Recover scenario counts from the cucumber message stream. The `message`
 * formatter writes one NDJSON object per event as it happens, so even a
 * killed process leaves every COMPLETED scenario on disk. Mirrors the JSON
 * classification: a scenario fails if any step failed; else passes if any
 * step passed; otherwise it counts as skipped. Retried attempts
 * (willBeRetried) are discarded so only the final attempt is counted.
 */
function fromMessageStream(suiteId) {
  const file = path.join(RESULTS_DIR, `${suiteId}-messages`, 'messages.ndjson');
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { return null; }

  const hasFail = {};   // testCaseStartedId -> bool
  const hasPass = {};   // testCaseStartedId -> bool
  let passed = 0, failed = 0, skipped = 0, total = 0;

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; } // tolerate a truncated final line

    if (msg.testStepFinished) {
      const id = msg.testStepFinished.testCaseStartedId;
      const status = (msg.testStepFinished.testStepResult || {}).status;
      if (status === 'FAILED' || status === 'AMBIGUOUS' || status === 'UNDEFINED') hasFail[id] = true;
      else if (status === 'PASSED') hasPass[id] = true;
    } else if (msg.testCaseFinished) {
      const id = msg.testCaseFinished.testCaseStartedId;
      if (msg.testCaseFinished.willBeRetried) {       // attempt will be retried; drop it
        delete hasFail[id]; delete hasPass[id];
        continue;
      }
      total++;
      if (hasFail[id]) failed++;
      else if (hasPass[id]) passed++;
      else skipped++;
      delete hasFail[id]; delete hasPass[id];
    }
  }
  if (total === 0) return null;
  return { passed, failed, skipped, total, source: 'recovered' };
}

function main() {
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
  catch (e) {
    appendSummary(`## ❌ Test coverage reconciliation failed\n\nCould not read \`${MANIFEST}\`: ${e.message}`);
    console.log(`::error::Could not read ${MANIFEST}: ${e.message}`);
    process.exit(1);
  }

  const groups = [
    { label: 'Non-Booking', suites: manifest['non-booking'] || [] },
    { label: 'Booking', suites: manifest['booking'] || [] },
  ];

  const rows = [];
  const missing = [];
  const incomplete = [];
  let totalPassed = 0, totalFailed = 0, totalSkipped = 0, totalScenarios = 0, suitesWithData = 0;
  const expectedCount = groups.reduce((n, g) => n + g.suites.length, 0);

  for (const group of groups) {
    for (const suite of group.suites) {
      const result = fromJsonReport(suite.suite_id) || fromMessageStream(suite.suite_id);
      if (!result) {
        missing.push(suite.suite_name);
        rows.push(`| ${suite.suite_name} | ${group.label} | — | — | — | — | ⛔ NO RESULTS |`);
        continue;
      }
      suitesWithData++;
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalSkipped += result.skipped;
      totalScenarios += result.total;

      let status;
      if (result.source === 'recovered') {
        incomplete.push(suite.suite_name);
        status = '⚠️ INCOMPLETE (recovered)';
      } else if (result.failed > 0) {
        status = '❌ FAIL';
      } else {
        status = '✅ PASS';
      }
      rows.push(`| ${suite.suite_name} | ${group.label} | ${result.passed} | ${result.failed} | ${result.skipped} | ${result.total} | ${status} |`);
    }
  }

  let headline;
  if (missing.length > 0) headline = `⛔ INCOMPLETE RUN — ${missing.length} suite(s) produced no results`;
  else if (incomplete.length > 0) headline = `⚠️ PARTIAL RUN — ${incomplete.length} suite(s) recovered from stream (timed out)`;
  else if (totalFailed > 0) headline = '🔴 SOME TESTS FAILED';
  else headline = '🟢 ALL TESTS PASSED';

  const passRate = totalScenarios > 0 ? ((totalPassed / totalScenarios) * 100).toFixed(1) : '0.0';

  const md = [];
  md.push('## 🧭 Test Coverage Reconciliation');
  md.push('');
  md.push(`**Status:** ${headline}`);
  md.push('');
  md.push('| Metric | Value |');
  md.push('|--------|-------|');
  md.push(`| 🧩 Suites reporting | ${suitesWithData} / ${expectedCount} |`);
  md.push(`| 🧪 Scenarios counted | ${totalScenarios} |`);
  md.push(`| ✅ Passed | ${totalPassed} |`);
  md.push(`| ❌ Failed | ${totalFailed} |`);
  md.push(`| ⏭️ Skipped | ${totalSkipped} |`);
  md.push(`| 📊 Pass Rate | **${passRate}%** |`);
  md.push('');

  if (missing.length > 0) {
    md.push('### ⛔ Suites with no results');
    md.push('');
    md.push('These suites ran but uploaded no usable report — almost always a step **timeout** or crash that killed the process before results were written. Their scenarios are **not** in the counts above. Check the individual job logs.');
    md.push('');
    missing.forEach(n => md.push(`- ${n}`));
    md.push('');
  }
  if (incomplete.length > 0) {
    md.push('### ⚠️ Suites recovered from the message stream');
    md.push('');
    md.push('These suites did not finish (likely timed out), but the scenarios that completed before the kill were recovered from the incremental message stream. Counts are **partial**.');
    md.push('');
    incomplete.forEach(n => md.push(`- ${n}`));
    md.push('');
  }

  md.push('### Per-suite breakdown');
  md.push('');
  md.push('| Suite | Group | Passed | Failed | Skipped | Total | Status |');
  md.push('|-------|-------|--------|--------|---------|-------|--------|');
  rows.forEach(r => md.push(r));
  appendSummary(md.join('\n'));

  // Console diagnostics + job status. Missing suites fail the report job so the
  // run goes red and the nightly notification fires; incomplete suites warn.
  incomplete.forEach(n => console.log(`::warning::Suite "${n}" timed out — counts recovered from stream are partial.`));
  if (missing.length > 0) {
    missing.forEach(n => console.log(`::error::Suite "${n}" produced no results (timed out/crashed before writing its report).`));
    console.log(`::error::${missing.length}/${expectedCount} expected suites are missing from the report. Counts under-represent the run.`);
    process.exit(1);
  }
  console.log(`Reconciliation OK: ${suitesWithData}/${expectedCount} suites reported, ${totalScenarios} scenarios counted.`);
}

main();
