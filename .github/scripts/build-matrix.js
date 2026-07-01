#!/usr/bin/env node
/*
 * Dynamically build the Test Suite job matrix from .github/suites.json.
 *
 * Why this exists (replaces the old hand-tuned `shards: N` fields + list-shard.js):
 * shard counts used to be constants maintained by hand. Every time a folder grew,
 * a suite silently crept back over its step timeout until someone re-tuned the
 * number (run #439, and again for Flights General/Amadeus). That treadmill is the
 * root cause of the recurring timeouts.
 *
 * Instead we compute the shard count per suite at run time:
 *   1. Count PICKLES (scenarios, with Scenario Outline examples expanded) per
 *      suite folder using the Gherkin parser — no test code is loaded/executed.
 *   2. shards = ceil(pickles / target), where `target` is the desired scenarios
 *      per shard for that group (config.<group>.target_scenarios_per_shard).
 *   3. Emit one matrix entry per shard. Test jobs run `cucumber-js <folder>
 *      --shard i/N`, which splits at the SCENARIO level (unlike the old
 *      file-index splitter), so even a single heavy Scenario Outline file is
 *      spread across shards.
 *
 * IMPORTANT — `target` bounds each shard's scenario COUNT, not its wall-clock
 * TIME. cucumber's --shard is a pure round-robin (i % N) with no awareness of
 * per-scenario duration or --retry cost, so a shard filled to `target` with
 * slow/flaky scenarios can still approach the step timeout. This removes the
 * old "hand-tuned count falls behind growth" treadmill, but it is NOT a hard
 * guarantee against timeouts. The real safety net is the step timeout +
 * reconcile-suites.js (a timeout goes red and recovers partial counts, never a
 * silent under-count). Keep `target` low enough that a full worst-case shard
 * still fits the step timeout; lower it when per-scenario time / failure rate
 * rises. See suites.json config._target_note.
 *
 * Outputs:
 *   - GITHUB_OUTPUT: `non_booking` / `booking` = compact JSON arrays for
 *     `strategy.matrix.include`.
 *   - expected-suites.json: the SAME expanded suite list, uploaded as an
 *     artifact and consumed by reconcile-suites.js so the "expected suites"
 *     list can never drift from what actually ran (keeps the run-#439 guard).
 *
 * Usage: node .github/scripts/build-matrix.js
 */

const fs = require('fs');
const path = require('path');
const { GherkinStreams } = require('@cucumber/gherkin-streams');
const { IdGenerator } = require('@cucumber/messages');

const MANIFEST = '.github/suites.json';
const DURATIONS = '.github/suite-durations.json';
const EXPECTED_OUT = 'expected-suites.json';
const GROUPS = ['non-booking', 'booking'];
const DEFAULT_TARGET = { 'non-booking': 14, booking: 6 };       // scenarios per shard (count floor)
const DEFAULT_CPU_MIN = { 'non-booking': 15, booking: 15 };     // CPU-minutes per shard (duration weight)

function fail(msg) {
  process.stderr.write(`build-matrix: ${msg}\n`);
  process.exit(1);
}

function findFeatures(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFeatures(full));
    else if (entry.isFile() && entry.name.endsWith('.feature')) out.push(full);
  }
  return out;
}

/** Count pickles (expanded scenarios) across the given .feature files. */
function countPickles(files) {
  return new Promise((resolve, reject) => {
    if (files.length === 0) return resolve(0);
    let n = 0;
    const stream = GherkinStreams.fromPaths(files, {
      newId: IdGenerator.uuid(),
      includeSource: false,
      includeGherkinDocument: false,
      includePickles: true,
    });
    stream.on('data', (e) => { if (e.pickle) n++; });
    stream.on('error', reject);
    stream.on('end', () => resolve(n));
  });
}

async function main() {
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
  catch (e) { fail(`could not read ${MANIFEST}: ${e.message}`); }

  const config = manifest.config || {};

  // Optional measured durations (per base suite_id). Used to give slower suites
  // MORE shards than count alone would — the count target is still the floor,
  // and the per-shard wall-time warning in the test jobs is the real-time guard.
  let durations = {};
  try { durations = (JSON.parse(fs.readFileSync(DURATIONS, 'utf8')).suites) || {}; }
  catch { durations = {}; }  // absent/unreadable => count-based sizing only

  const matrices = {};          // group -> [ matrix entry ]
  const expected = {};          // group -> [ same entries ] (for the manifest artifact)
  const summaryRows = [];       // for the step summary

  for (const group of GROUPS) {
    const suites = manifest[group] || [];
    const target = (config[group] && config[group].target_scenarios_per_shard) || DEFAULT_TARGET[group];
    const cpuBudget = (config[group] && config[group].cpu_minutes_per_shard) || DEFAULT_CPU_MIN[group];
    if (!Number.isInteger(target) || target < 1) fail(`invalid target_scenarios_per_shard for "${group}": ${target}`);
    if (!(cpuBudget > 0)) fail(`invalid cpu_minutes_per_shard for "${group}": ${cpuBudget}`);

    const entries = [];
    for (const suite of suites) {
      if (!suite.suite_id || !suite.suite_name || !suite.test_path) {
        fail(`suite in "${group}" missing suite_id/suite_name/test_path: ${JSON.stringify(suite)}`);
      }
      if (!fs.existsSync(suite.test_path)) fail(`test_path does not exist: ${suite.test_path}`);

      const files = findFeatures(suite.test_path);
      const pickles = await countPickles(files);
      if (pickles === 0) fail(`suite "${suite.suite_id}" has 0 scenarios under ${suite.test_path}`);

      // Count-based shard count (the safety floor for suites with no timing history).
      const countShards = Math.max(1, Math.ceil(pickles / target));
      // Duration-based shard count: give slow suites more shards. Uses measured
      // CPU-minutes as a relative weight (it under-counts wall time, but ranks
      // suites correctly; absolute safety comes from the count floor + warning).
      const cpuMin = durations[suite.suite_id] ? durations[suite.suite_id].cpu_seconds / 60 : 0;
      const durShards = cpuMin > 0 ? Math.ceil(cpuMin / cpuBudget) : 0;
      // Never more shards than scenarios (no empty shard).
      const shards = Math.min(pickles, Math.max(1, countShards, durShards));
      const driver = shards === pickles && pickles < Math.max(countShards, durShards) ? 'pickle-cap'
        : durShards > countShards ? 'duration' : 'count';

      if (shards === 1) {
        entries.push({
          suite_id: suite.suite_id,
          suite_name: suite.suite_name,
          test_path: suite.test_path,
          shard: 1,
          shards: 1,
        });
      } else {
        for (let i = 1; i <= shards; i++) {
          entries.push({
            suite_id: `${suite.suite_id}-${i}`,
            suite_name: `${suite.suite_name} (${i}/${shards})`,
            test_path: suite.test_path,
            shard: i,
            shards,
          });
        }
      }
      summaryRows.push({ group, name: suite.suite_name, files: files.length, pickles, cpuMin: Math.round(cpuMin), countShards, durShards, shards, driver });
    }
    matrices[group] = entries;
    expected[group] = entries;
  }

  // 1) job matrices -> GITHUB_OUTPUT (compact single-line JSON)
  const out = process.env.GITHUB_OUTPUT;
  const outLines = [
    `non_booking=${JSON.stringify(matrices['non-booking'])}`,
    `booking=${JSON.stringify(matrices['booking'])}`,
  ];
  if (out) fs.appendFileSync(out, outLines.join('\n') + '\n');
  else outLines.forEach((l) => process.stdout.write(l + '\n'));

  // 2) expected-suites manifest -> artifact for reconcile-suites.js
  fs.writeFileSync(EXPECTED_OUT, JSON.stringify({ 'non-booking': expected['non-booking'], booking: expected['booking'] }, null, 2));

  // 3) human-readable summary
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  const md = [];
  md.push('## 🧮 Dynamic suite matrix');
  md.push('');
  md.push('Shards = `max(count-based, duration-based)`, capped at scenario count. `count` = ceil(scenarios / target); `duration` = ceil(measured CPU-min / cpu budget). No hand-tuning.');
  md.push('');
  md.push('| Group | Suite | Files | Scenarios | CPU-min | count→ | dur→ | Shards | Driver |');
  md.push('|-------|-------|------:|----------:|--------:|------:|-----:|-------:|--------|');
  for (const r of summaryRows) md.push(`| ${r.group} | ${r.name} | ${r.files} | ${r.pickles} | ${r.cpuMin || '—'} | ${r.countShards} | ${r.durShards || '—'} | ${r.shards} | ${r.driver} |`);
  const totalJobs = matrices['non-booking'].length + matrices['booking'].length;
  md.push('');
  md.push(`**Total jobs:** ${totalJobs} (${matrices['non-booking'].length} non-booking + ${matrices['booking'].length} booking)`);
  if (summaryFile) fs.appendFileSync(summaryFile, md.join('\n') + '\n');
  process.stdout.write(md.join('\n') + '\n');
}

main().catch((e) => fail(e.stack || e.message));
