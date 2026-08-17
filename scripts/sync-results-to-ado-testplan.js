#!/usr/bin/env node
/**
 * Sync GitHub Actions test results to an Azure DevOps Test Plan.
 *
 * Reads cucumber JUnit XML (one file per matrix suite), extracts the leading
 * ADO test-case ID from each <testcase classname="..."> (the feature title,
 * which is prefixed with the ADO ID, e.g. "29426 Sabre - ..."), reduces to a
 * single outcome per test case, then publishes those outcomes as an ADO Test
 * Run against the matching test points in a Test Plan.
 *
 * Auth: uses the Azure CLI ("az account get-access-token"). Run `az login`
 *       first. Defaults target org "atriis" / project "TMC2".
 *
 * DRY-RUN BY DEFAULT. Pass --apply to actually create the run in ADO.
 *
 * Usage:
 *   # List recent plans (read-only) so you can pick a --plan id:
 *   node scripts/sync-results-to-ado-testplan.js
 *
 *   # Download a GitHub run's artifacts, then dry-run against a plan:
 *   node scripts/sync-results-to-ado-testplan.js --run 25846495423 --plan 74856
 *
 *   # Dry-run from a results dir you already have:
 *   node scripts/sync-results-to-ado-testplan.js --results test-results/ci-run-25846495423 --plan 74856
 *
 *   # Actually publish the run to ADO:
 *   node scripts/sync-results-to-ado-testplan.js --run 25846495423 --plan 74856 --apply
 *
 * Flags:
 *   --run <id>       GitHub Actions run id to `gh run download` first
 *   --results <dir>  Directory to scan for cucumber-junit.xml (default: test-results)
 *   --plan <id>      Target ADO Test Plan id (required for matching/apply)
 *   --suite <id>     Restrict to a single suite (default: all suites in the plan)
 *   --name "<text>"  Test run name (default: auto from plan + timestamp)
 *   --org <org>      ADO org (default: atriis)
 *   --project <p>    ADO project (default: TMC2)
 *   --apply          Actually create & complete the run (otherwise dry-run)
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// ── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { results: 'test-results', org: 'atriis', project: 'TMC2', apply: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--run': out.run = next(); break;
      case '--results': out.results = next(); break;
      case '--plan': out.plan = next(); break;
      case '--suite': out.suite = next(); break;
      case '--name': out.name = next(); break;
      case '--org': out.org = next(); break;
      case '--project': out.project = next(); break;
      case '--add-missing': out.addMissing = true; break;
      case '--mark-points': out.markPoints = true; break;
      case '--apply': out.apply = true; break;
      default: console.error(`Unknown arg: ${a}`); process.exit(2);
    }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const base = `https://dev.azure.com/${args.org}/${args.project}/_apis`;

// ── auth ───────────────────────────────────────────────────────────────────
const ADO_RESOURCE = '499b84ac-1321-427f-aa17-267ca6975798'; // Azure DevOps app id
function getToken() {
  try {
    const out = execSync(`az account get-access-token --resource ${ADO_RESOURCE} -o json`,
      { encoding: 'utf8' });
    return JSON.parse(out).accessToken;
  } catch (e) {
    console.error('Failed to get ADO token. Run `az login` first.\n', e.stderr || e.message);
    process.exit(1);
  }
}

async function ado(method, urlPath, body) {
  const url = urlPath.startsWith('http') ? urlPath : `${base}/${urlPath}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': body ? 'application/json' : 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${url} -> ${res.status}\n${text.slice(0, 1000)}`);
  }
  return text ? JSON.parse(text) : null;
}

// ── junit parsing ─────────────────────────────────────────────────────────────
function findJunitFiles(dir) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findJunitFiles(full));
    else if (/cucumber-junit.*\.xml$/i.test(entry.name)) found.push(full);
  }
  return found;
}

// outcome precedence for reducing many scenarios -> one test case result
const RANK = { Failed: 3, Passed: 2, NotApplicable: 1 };
function worse(a, b) {
  if (!a) return b;
  return RANK[b] > RANK[a] ? b : a;
}

// Handles both self-closing <testcase .../> and <testcase ...>...</testcase>.
// The open tag is scanned quote-aware rather than matched with /<testcase\b([^>]*?)>/:
// `[^>]*?` stops at the FIRST `>`, including one inside a quoted attribute value, so a
// feature title containing `>` (e.g. TC 64409 "... inProgress > &quot;Confirmation in
// progress&quot; ...") truncates the attrs group mid-value, classname parses as empty,
// and the whole test case is silently dropped as having no ADO id prefix.
function parseJunit(xml) {
  const TAG = '<testcase';
  const results = [];
  let i = 0;
  while ((i = xml.indexOf(TAG, i)) !== -1) {
    let j = i + TAG.length;
    let quote = null;
    let end = -1;
    for (; j < xml.length; j++) {
      const c = xml[j];
      if (quote) {
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'") {
        quote = c;
        continue;
      }
      if (c === '>') {
        end = j;
        break;
      }
    }
    if (end === -1) break; // truncated file
    const selfClose = xml[end - 1] === '/';
    const attrs = xml.slice(i + TAG.length, selfClose ? end - 1 : end);
    const cm = /classname="([^"]*)"/.exec(attrs);
    const classname = cm ? cm[1] : '';

    let outcome = 'Passed';
    let next = end + 1;
    if (!selfClose) {
      const close = xml.indexOf('</testcase>', end);
      const body = close === -1 ? xml.slice(end + 1) : xml.slice(end + 1, close);
      if (/<failure\b/.test(body) || /<error\b/.test(body)) outcome = 'Failed';
      else if (/<skipped\b/.test(body)) outcome = 'NotApplicable';
      next = close === -1 ? xml.length : close + '</testcase>'.length;
    }
    i = next;

    const idMatch = /^\s*(\d{3,6})\b/.exec(classname);
    if (!idMatch) continue; // no ADO id prefix -> skip
    results.push({ id: idMatch[1], outcome, classname });
  }
  return results;
}

function collectResults(dir) {
  const files = findJunitFiles(dir);
  const byId = new Map(); // id -> { outcome, classname }
  for (const f of files) {
    const xml = fs.readFileSync(f, 'utf8');
    for (const r of parseJunit(xml)) {
      const prev = byId.get(r.id);
      byId.set(r.id, { outcome: worse(prev?.outcome, r.outcome), classname: r.classname });
    }
  }
  return { files, byId };
}

// ── ADO discovery ─────────────────────────────────────────────────────────────
async function listPlans() {
  const data = await ado('GET', `testplan/plans?api-version=7.1`);
  return (data.value || []).sort((a, b) => b.id - a.id);
}

async function getSuites(planId) {
  const data = await ado('GET', `testplan/Plans/${planId}/suites?api-version=7.1`);
  return data.value || [];
}

async function getPoints(planId, suiteId) {
  // Legacy test API returns points with testCase.id + integer point id
  const data = await ado('GET', `test/Plans/${planId}/Suites/${suiteId}/points?api-version=7.1`);
  return data.value || [];
}

// Batch-resolve work item types so we only add real Test Cases to a suite.
async function getWorkItemTypes(ids) {
  const types = new Map();
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200).map(Number);
    const data = await ado('POST', `wit/workitemsbatch?api-version=7.1`,
      { ids: batch, fields: ['System.WorkItemType'] });
    for (const w of data.value || []) types.set(String(w.id), w.fields['System.WorkItemType']);
  }
  return types;
}

// Bulk-add Test Case work items to a static suite (creates test points).
async function addTestCasesToSuite(planId, suiteId, ids) {
  const body = ids.map(id => ({ workItem: { id: Number(id) } }));
  await ado('POST', `testplan/Plans/${planId}/Suites/${suiteId}/TestCase?api-version=7.1`, body);
}

// Directly set test-point outcomes (what the "Mark outcome" button does) so the
// manual Execute grid's filter + "% run" reflect them. Accepts testplan enum
// values: passed | failed | notApplicable | blocked | active | notRun ...
async function markPointOutcomes(planId, suiteId, items) {
  for (let i = 0; i < items.length; i += 100) {
    const body = items.slice(i, i + 100).map(it => ({ id: it.pointId, results: { outcome: it.outcome } }));
    await ado('PATCH', `testplan/Plans/${planId}/Suites/${suiteId}/TestPoint?api-version=7.1`, body);
  }
}
const MARK_OUTCOME = { Passed: 'passed', Failed: 'failed', NotApplicable: 'notApplicable' };

// ── main ───────────────────────────────────────────────────────────────────
let TOKEN;
(async () => {
  // optionally pull the GitHub run's artifacts
  if (args.run) {
    const dest = path.join(args.results, `gh-run-${args.run}`);
    fs.mkdirSync(dest, { recursive: true });
    console.log(`Downloading GitHub run ${args.run} artifacts -> ${dest} ...`);
    execSync(`gh run download ${args.run} --dir "${dest}"`, { stdio: 'inherit' });
    args.results = dest;
  }

  const { files, byId } = collectResults(args.results);
  if (files.length === 0) {
    console.error(`No cucumber-junit*.xml found under ${args.results}`);
    process.exit(1);
  }
  const counts = { Passed: 0, Failed: 0, NotApplicable: 0 };
  for (const { outcome } of byId.values()) counts[outcome]++;
  console.log(`\nParsed ${files.length} JUnit file(s) -> ${byId.size} unique test cases`);
  console.log(`   Passed: ${counts.Passed}   Failed: ${counts.Failed}   Skipped/NA: ${counts.NotApplicable}\n`);

  TOKEN = getToken();

  // No plan -> list plans and stop (read-only helper).
  if (!args.plan) {
    console.log('No --plan given. Recent Test Plans in', `${args.org}/${args.project}:`);
    const plans = await listPlans();
    for (const p of plans.slice(0, 12)) console.log(`   ${p.id}  ${p.name}`);
    console.log('\nRe-run with --plan <id> (add --apply to publish).');
    return;
  }

  // Build testCaseId -> [pointId] for the plan.
  const suites = args.suite ? [{ id: args.suite }] : await getSuites(args.plan);
  const pointByCase = new Map(); // testCaseId -> pointId
  for (const s of suites) {
    const points = await getPoints(args.plan, s.id);
    for (const pt of points) {
      const tcId = String(pt.testCase?.id ?? '');
      if (tcId && !pointByCase.has(tcId)) pointByCase.set(tcId, pt.id);
    }
  }
  console.log(`Plan ${args.plan}: ${suites.length} suite(s), ${pointByCase.size} test points.\n`);

  // Optionally add run Test Cases that aren't yet in the suite (creates points).
  if (args.addMissing) {
    if (!args.suite) { console.error('--add-missing requires --suite <id>.'); process.exit(2); }
    const candidates = [...byId.keys()].filter(id => !pointByCase.has(id));
    const types = await getWorkItemTypes(candidates);
    const eligible = candidates.filter(id => types.get(id) === 'Test Case');
    const ineligible = candidates.filter(id => types.get(id) && types.get(id) !== 'Test Case');
    console.log(`Add-missing: ${eligible.length} Test Case(s) not yet in suite ${args.suite}.`);
    if (ineligible.length) {
      const groups = {};
      for (const id of ineligible) (groups[types.get(id)] ||= []).push(id);
      for (const [t, arr] of Object.entries(groups))
        console.log(`   skipping ${arr.length} ${t}(s): ${arr.join(', ')}`);
    }
    if (eligible.length && args.apply) {
      console.log(`   adding ${eligible.length} test case(s) to suite ${args.suite} ...`);
      for (let i = 0; i < eligible.length; i += 100) {
        await addTestCasesToSuite(args.plan, args.suite, eligible.slice(i, i + 100));
      }
      // refresh points for the suite
      for (const pt of await getPoints(args.plan, args.suite)) {
        const tcId = String(pt.testCase?.id ?? '');
        if (tcId && !pointByCase.has(tcId)) pointByCase.set(tcId, pt.id);
      }
      console.log(`   suite now has ${pointByCase.size} matchable point(s).`);
    } else if (eligible.length) {
      console.log('   (dry-run — add --apply to actually add them)');
    }
    console.log('');
  }

  // ── mark-points mode: set 3 outcomes directly on every point in the suite ──
  // Passed / Failed for cases covered by the run, NotApplicable for suite cases
  // the run didn't cover. Uses the direct TestPoint outcome API so the manual
  // Execute grid (filter + "% run") reflects it.
  if (args.markPoints) {
    if (!args.suite) { console.error('--mark-points requires --suite <id>.'); process.exit(2); }
    const items = [];
    const tally = { Passed: 0, Failed: 0, NotApplicable: 0 };
    for (const [tcId, pointId] of pointByCase) {
      const outcome = byId.get(tcId)?.outcome || 'NotApplicable'; // not in run -> N/A
      tally[outcome]++;
      items.push({ pointId, outcome: MARK_OUTCOME[outcome] });
    }
    console.log(`Mark-points on suite ${args.suite} (${items.length} point(s)):`);
    console.log(`   Passed: ${tally.Passed}   Failed: ${tally.Failed}   Not applicable (not in run): ${tally.NotApplicable}`);
    if (!args.apply) {
      console.log('\nDRY RUN — nothing was sent to ADO. Add --apply to mark the points.');
      return;
    }
    console.log(`   marking ${items.length} point outcome(s) ...`);
    await markPointOutcomes(args.plan, args.suite, items);
    console.log('   done. The Execute grid Outcome column + filter now reflect these.');
    console.log(`\nSuite URL: https://dev.azure.com/${args.org}/${args.project}/_testPlans/execute?planId=${args.plan}&suiteId=${args.suite}`);
    return;
  }

  // Match run results against plan points.
  const toPublish = []; // { id, pointId, outcome, classname }
  const notInPlan = [];
  for (const [id, { outcome, classname }] of byId) {
    const pointId = pointByCase.get(id);
    if (pointId) toPublish.push({ id, pointId, outcome, classname });
    else notInPlan.push({ id, classname });
  }

  console.log(`Matched ${toPublish.length} test case(s) to plan points:`);
  for (const r of toPublish) console.log(`   #${r.id}  ${r.outcome}  (point ${r.pointId})`);
  if (notInPlan.length) {
    console.log(`\n${notInPlan.length} result(s) in the run but NOT in this plan (skipped):`);
    for (const r of notInPlan) console.log(`   #${r.id}  ${r.classname}`);
  }

  if (toPublish.length === 0) {
    console.log('\nNothing to publish.');
    return;
  }

  if (!args.apply) {
    console.log('\nDRY RUN — nothing was sent to ADO. Re-run with --apply to publish.');
    return;
  }

  // ── publish: create run -> patch results -> complete run ────────────────────
  const runName = args.name || `Automated (GitHub) – plan ${args.plan}`;
  console.log(`\nCreating ADO test run "${runName}" ...`);
  const run = await ado('POST', `test/runs?api-version=7.1`, {
    name: runName,
    plan: { id: String(args.plan) },
    pointIds: toPublish.map(r => r.pointId),
    automated: true,
    state: 'InProgress',
  });
  console.log(`   Run ${run.id} created.`);

  const resultsData = await ado('GET', `test/Runs/${run.id}/results?api-version=7.1`);
  const outcomeByCase = new Map(toPublish.map(r => [r.id, r.outcome]));
  const patch = (resultsData.value || []).map(res => ({
    id: res.id,
    outcome: outcomeByCase.get(String(res.testCase?.id)) || 'NotApplicable',
    state: 'Completed',
    comment: 'Synced from GitHub Actions run',
  }));
  await ado('PATCH', `test/Runs/${run.id}/results?api-version=7.1`, patch);
  await ado('PATCH', `test/Runs/${run.id}?api-version=7.1`, { state: 'Completed' });

  console.log(`   ${patch.length} result(s) published and run completed.`);
  console.log(`\nRun URL: https://dev.azure.com/${args.org}/${args.project}/_TestManagement/Runs?runId=${run.id}&_a=runCharts`);
})().catch(e => {
  console.error('\nERROR:', e.message);
  process.exit(1);
});
