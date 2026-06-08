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

function parseJunit(xml) {
  // Match both self-closing <testcase .../> and <testcase ...>...</testcase>
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const bodyOrClose = m[2];
    const body = m[3] || '';
    const cm = /classname="([^"]*)"/.exec(attrs);
    const classname = cm ? cm[1] : '';
    const idMatch = /^\s*(\d{3,6})\b/.exec(classname);
    if (!idMatch) continue; // no ADO id prefix -> skip
    const id = idMatch[1];
    let outcome = 'Passed';
    if (bodyOrClose !== '/>') {
      if (/<failure\b/.test(body) || /<error\b/.test(body)) outcome = 'Failed';
      else if (/<skipped\b/.test(body)) outcome = 'NotApplicable';
    }
    results.push({ id, outcome, classname });
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
