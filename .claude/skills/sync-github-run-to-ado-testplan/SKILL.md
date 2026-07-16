---
name: sync-github-run-to-ado-testplan
description: >
  Given a GitHub Actions run from THIS repo (run id or URL) and an ADO Test Plan
  ID (or URL), downloads the run's cucumber JUnit artifacts, maps each feature's
  leading ADO test-case id to a test point, and PATCHes each point's outcome
  directly — without creating a test run. Passed → passed, Failed → notApplicable.
  Skips scenarios with no numeric ADO id prefix and fully-skipped test cases.
  Never overwrites protected outcomes (passed, blocked, failed). Prompts for the
  run and plan if not supplied.
---

# GitHub Run → ADO Test Plan Result Updater

Adapted from `UpdateFromTestim-adoTestPlan` for the **Atriis.Test.Automation** repo.
Instead of a Testim CSV export, the input is a **GitHub Actions run** — the user
names which run to sync. Everything downstream (matching, the confirmation
checkpoint, the direct point-outcome PATCH, the protected-outcome rule, the
summary) is unchanged from the Testim agent.

Given a run and an ADO Test Plan, you download the run's cucumber JUnit artifacts,
extract each test case's outcome, match them to test points in the plan, and
PATCH each point's outcome directly.

## Inputs

| Input       | Description                                              | Example |
| ----------- | -------------------------------------------------------- | ------- |
| `githubRun` | GitHub Actions **run id** (or the full run URL) in this repo | `29483079203` or `https://github.com/<org>/<repo>/actions/runs/29483079203` |
| `planId`    | ADO Test Plan ID (or the full test plan URL)             | `74856` or `https://dev.azure.com/atriis/TMC2/_testPlans/execute?planId=74856` |

**If either input is missing, ASK the user for it first — this is Phase 0.** The
whole point of this skill vs. the Testim agent is that the *user names the run*.

**Extracting the run id from a URL:** `.../actions/runs/29483079203` → `29483079203`.
**Extracting the plan id from a URL:** take the `planId` query parameter →
`...?planId=74856` → `74856`.

**Auth prerequisite:** ADO calls use a Bearer token from the Azure CLI (this repo's
convention — see `scripts/sync-results-to-ado-testplan.js`). The user must be
logged in:

```powershell
az login   # once per machine/session if needed
$env:ADO_TOKEN = (az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)
```

`499b84ac-1321-427f-aa17-267ca6975798` is the Azure DevOps application id. If
`ADO_TOKEN` is empty after this, stop and tell the user to run `az login` — do
not proceed. (The original Testim agent used a PAT via `AZURE_DEVOPS_PAT`; this
repo standardizes on `az`. If you must use a PAT instead, set
`Authorization: Basic base64(":{PAT}")` in the two node scripts below.)

**GitHub auth:** `gh` must be authenticated (`gh auth status`). Artifacts are
pulled with `gh run download`.

**Runtime:** Node.js (`node`). All temp files (scripts + JSON + the downloaded
artifacts) live in an OS-temp working dir, **outside the repo**:
`$env:TEMP\ado-testplan-sync\`. It's created on demand (`New-Item -Force` /
`gh run download --dir` make it). When writing the scripts with a file tool,
resolve `$env:TEMP` to its absolute path first. Never write temp files into the
`c:\DEV\Atriis.Test.Automation` repo.

## Pipeline

- **Phase 0** — Resolve inputs (prompt the user for the run and/or plan if missing)
- **Phase 1** — Download the run's artifacts → parse cucumber JUnit → outcomes per test case
- **Phase 2** — Fetch plan structure → suites + test points + current outcomes
- **Phase 3** — CHECKPOINT: show update preview, wait for confirmation
- **Phase 4** — PATCH test point outcomes directly in ADO
- **Phase 5** — Report summary + clean up

---

## Phase 0: Resolve inputs

If `githubRun` was not given, ask the user which run to sync. Offer recent runs
for convenience:

```powershell
gh run list --limit 10
```

If `planId` was not given, ask for it. You can list recent plans read-only with
the fetch script's list mode if helpful, or just ask.

Extract the numeric run id and plan id (from URLs if pasted). Then obtain the
token (see Auth prerequisite above) before Phase 2.

## Phase 1: Download the run's artifacts and parse JUnit

Each suite job uploads a `<suite_id>-results` artifact containing
`test-results/cucumber-junit.xml`. `gh run download` fetches them all into
subfolders. The matching key is the **leading number** of
`<testcase classname="...">` — cucumber writes the feature title (prefixed with
its ADO test-case id, e.g. `29426 Sabre - ...`) into `classname`.

Write this script to `$env:TEMP\ado-testplan-sync\_temp_gh_parse.js`:

```js
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('usage: node _temp_gh_parse.js <resultsDir>'); process.exit(2); }

// Reduce many scenarios -> one outcome per test case (worst wins).
const RANK = { Failed: 3, Passed: 2, Skipped: 1 };
function worse(a, b) { if (!a) return b; return RANK[b] > RANK[a] ? b : a; }

function findJunit(d, out = []) {
    if (!fs.existsSync(d)) return out;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) findJunit(full, out);
        else if (/cucumber-junit.*\.xml$/i.test(e.name)) out.push(full);
    }
    return out;
}

function parseJunit(xml) {
    // Match both self-closing <testcase .../> and <testcase ...>...</testcase>
    const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
    const rows = [];
    let m;
    while ((m = re.exec(xml)) !== null) {
        const attrs = m[1], closeOrBody = m[2], body = m[3] || '';
        const cm = /classname="([^"]*)"/.exec(attrs);
        const classname = cm ? cm[1] : '';
        let outcome = 'Passed';
        if (closeOrBody !== '/>') {
            if (/<failure\b/.test(body) || /<error\b/.test(body)) outcome = 'Failed';
            else if (/<skipped\b/.test(body)) outcome = 'Skipped';
        }
        rows.push({ classname, outcome });
    }
    return rows;
}

const files = findJunit(dir);
const byId = new Map();   // tc_id -> { outcome, classname }
const skipped = [];       // rows we will NOT write

for (const f of files) {
    const xml = fs.readFileSync(f, 'utf8');
    for (const r of parseJunit(xml)) {
        const idm = /^\s*(\d{3,6})\b/.exec(r.classname);
        if (!idm) { skipped.push({ classname: r.classname, reason: 'no leading numeric ADO id' }); continue; }
        const tc_id = idm[1];
        const prev = byId.get(tc_id);
        byId.set(tc_id, { outcome: worse(prev && prev.outcome, r.outcome), classname: r.classname });
    }
}

const results = [];
for (const [tc_id, { outcome, classname }] of byId) {
    if (outcome === 'Passed') results.push({ tc_id, classname, outcome: 'passed' });
    else if (outcome === 'Failed') results.push({ tc_id, classname, outcome: 'notApplicable' }); // Testim mapping
    else skipped.push({ tc_id, classname, reason: 'all scenarios skipped/pending' });
}

console.log(JSON.stringify({ fileCount: files.length, results, skipped }));
```

Run:

```powershell
$dest = "$env:TEMP\ado-testplan-sync\gh-run-$RUN"
New-Item -ItemType Directory -Force $dest | Out-Null
# Only the JUnit artifacts (one "<suite_id>-results" per suite). This avoids
# pulling the heavy -traces / -screenshots artifacts. (The glob also matches
# "<suite_id>-allure-results"; harmless — the parser only reads cucumber-junit*.xml.)
gh run download $RUN --dir $dest --pattern "*-results"
$parseRaw = node $env:TEMP\ado-testplan-sync\_temp_gh_parse.js $dest
[System.IO.File]::WriteAllText("$env:TEMP\ado-testplan-sync\_temp_parse.json", $parseRaw, (New-Object System.Text.UTF8Encoding $false))
```

(`$RUN` is the resolved numeric run id.) Results are already deduplicated by
`tc_id` inside the script — worst outcome wins across all suites in the run.

Display a brief parse summary:

```
Parsed {fileCount} JUnit file(s) -> {N} testable test cases:
  passed          : {N}
  notApplicable   : {N}  (Failed in the run)
  Excluded:
    no ADO id prefix : {N}
    all skipped      : {N}
```

**Stop here if `results` is empty.**

## Phase 2: Fetch plan structure

Write this script to `$env:TEMP\ado-testplan-sync\_temp_gh_fetch.js`:

```js
const https = require('https');
const fs = require('fs');

const PLAN_ID = process.argv[2];
const OUT = process.argv[3];
const ORG = 'atriis', PROJECT = 'TMC2';
if (!PLAN_ID || !OUT) { console.error('usage: node _temp_gh_fetch.js <planId> <outPath>'); process.exit(2); }

const token = process.env.ADO_TOKEN || '';
if (!token) { console.error('ERROR: ADO_TOKEN not set. Run: $env:ADO_TOKEN = (az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798 --query accessToken -o tsv)'); process.exit(1); }
const authHeader = 'Bearer ' + token;

function adoGet(p, contToken) {
    return new Promise((resolve, reject) => {
        let url = `https://dev.azure.com/${ORG}/${PROJECT}/${p}`;
        if (contToken) url += (url.includes('?') ? '&' : '?') + 'continuationToken=' + encodeURIComponent(contToken);
        https.get(url, { headers: { Authorization: authHeader, Accept: 'application/json' } }, res => {
            let b = '';
            res.on('data', d => b += d);
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${b.slice(0, 200)}`));
                resolve({ data: JSON.parse(b), cont: res.headers['x-ms-continuationtoken'] || null });
            });
        }).on('error', reject);
    });
}

async function main() {
    const { data: plan } = await adoGet(`_apis/testplan/Plans/${PLAN_ID}?api-version=7.0`);
    process.stderr.write(`Plan: ${plan.name}\n`);

    const suites = [];
    let cont = null;
    do {
        const { data, cont: c } = await adoGet(`_apis/testplan/Plans/${PLAN_ID}/suites?api-version=7.0`, cont);
        suites.push(...(data.value || []));
        cont = c;
        process.stderr.write(`  ${suites.length} suites...\n`);
    } while (cont);

    const tcToPoints = {};
    let total = 0;
    for (const s of suites) {
        let skip = 0;
        while (true) {
            const { data } = await adoGet(`_apis/testplan/Plans/${PLAN_ID}/Suites/${s.id}/TestPoint?api-version=7.0&$top=200&$skip=${skip}`);
            const pts = data.value || [];
            for (const p of pts) {
                const tcId = String(p.testCaseReference.id);
                const cur = (p.results && p.results.outcome) ? p.results.outcome.toLowerCase() : '';
                (tcToPoints[tcId] || (tcToPoints[tcId] = [])).push({ suiteId: s.id, suiteName: s.name, testPointId: p.id, currentOutcome: cur });
                total++;
            }
            if (pts.length < 200) break;
            skip += 200;
        }
    }

    process.stderr.write(`Total: ${suites.length} suites, ${total} points\n`);
    fs.writeFileSync(OUT, JSON.stringify({ planName: plan.name, suiteCount: suites.length, testPointCount: total, tcToPoints }), 'utf8');
}
main().catch(e => { console.error(e.message); process.exit(1); });
```

Run:

```powershell
node $env:TEMP\ado-testplan-sync\_temp_gh_fetch.js $PLAN $env:TEMP\ado-testplan-sync\_temp_fetch.json
```

Stop and show the error to the user if the script fails.

## Phase 3: CHECKPOINT — confirm before patching

Always show this preview and wait for explicit confirmation before writing
anything to ADO. Build the update set with this script — it cross-references the
parse results against the plan and applies the protected-outcome rule.

Write this script to `$env:TEMP\ado-testplan-sync\_temp_gh_diff.js`:

```js
const fs = require('fs');
const parse = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const plan = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const OUT = process.argv[4];
const PROTECTED = new Set(['passed', 'blocked', 'failed']);

const willUpdate = [], protectedSkip = [], notFound = [];
for (const r of parse.results) {
    const pts = plan.tcToPoints[r.tc_id];
    if (!pts || !pts.length) { notFound.push(r.tc_id); continue; }
    for (const p of pts) {
        if (PROTECTED.has(p.currentOutcome)) protectedSkip.push({ tc_id: r.tc_id, ...p });
        else willUpdate.push({ tc_id: r.tc_id, outcome: r.outcome, suiteId: p.suiteId, suiteName: p.suiteName, testPointId: p.testPointId, currentOutcome: p.currentOutcome });
    }
}

fs.writeFileSync(OUT, JSON.stringify(willUpdate), 'utf8');
console.log(JSON.stringify({
    planName: plan.planName,
    willUpdate_passed: willUpdate.filter(u => u.outcome === 'passed').length,
    willUpdate_notApplicable: willUpdate.filter(u => u.outcome === 'notApplicable').length,
    willUpdate_total: willUpdate.length,
    protectedCount: protectedSkip.length,
    notFound
}));
```

Run:

```powershell
$diffRaw = node $env:TEMP\ado-testplan-sync\_temp_gh_diff.js $env:TEMP\ado-testplan-sync\_temp_parse.json $env:TEMP\ado-testplan-sync\_temp_fetch.json $env:TEMP\ado-testplan-sync\_temp_updates.json
```

Classification:
- **Not found** → `notFound` (test case has no point in the plan)
- **Found, `currentOutcome` in {passed, blocked, failed}** → `protected` (every matching point — untouched)
- **Found, not protected** → `willUpdate`

Present:

```
===========================================================================
GITHUB RUN → ADO UPDATE PREVIEW
Plan:  #{planId} "{planName}"
Run:   {githubRun}
===========================================================================

WILL BE UPDATED ({willUpdate_total} test points):
  passed={N}   notApplicable={N}
  NOTE: a run FAILURE is written as ADO "notApplicable" (not "failed") —
        this is the Testim agent's contract, carried over intentionally.

SKIPPED — PROTECTED ({protectedCount} test points):
  (currentOutcome is passed / blocked / failed — will not overwrite)

NOT FOUND IN PLAN ({N} test cases):
  TC IDs: {comma-separated notFound}

Proceed and PATCH {willUpdate_total} test points in plan #{planId}?
  -> Yes   -> No (abort)
===========================================================================
```

**Do not proceed to Phase 4 until the user explicitly says Yes.**

## Phase 4: PATCH test point outcomes

Write this script to `$env:TEMP\ado-testplan-sync\_temp_gh_push.js`:

```js
const https = require('https');
const fs = require('fs');

const PLAN_ID = process.argv[2];
const UPDATES_PATH = process.argv[3];
const ORG = 'atriis', PROJECT = 'TMC2';
const MAX_RETRIES = 5, RETRY_DELAY_MS = 15000;
if (!PLAN_ID || !UPDATES_PATH) { console.error('usage: node _temp_gh_push.js <planId> <updatesJsonPath>'); process.exit(2); }

const token = process.env.ADO_TOKEN || '';
if (!token) { console.error('ERROR: ADO_TOKEN not set'); process.exit(1); }
const authHeader = 'Bearer ' + token;
const updates = JSON.parse(fs.readFileSync(UPDATES_PATH, 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

function adoPatch(suiteId, pointId, outcome) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ outcome });
        const req = https.request({
            hostname: 'dev.azure.com',
            path: `/${ORG}/${PROJECT}/_apis/test/Plans/${PLAN_ID}/Suites/${suiteId}/points/${pointId}?api-version=7.0`,
            method: 'PATCH',
            headers: { Authorization: authHeader, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => res.statusCode >= 400 ? reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0, 200)}`)) : resolve());
        });
        req.on('error', reject);
        req.write(body); req.end();
    });
}

async function patchWithRetry(u) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try { await adoPatch(u.suiteId, u.testPointId, u.outcome); return { ok: true }; }
        catch (e) {
            if (attempt === MAX_RETRIES) return { ok: false, error: e.message };
            process.stderr.write(`  Retry ${attempt}/${MAX_RETRIES} for TC ${u.tc_id}: ${e.message}\n`);
            await sleep(RETRY_DELAY_MS);
        }
    }
}

async function main() {
    const stats = { updated_passed: [], updated_notApplicable: [], errors: [] };
    let done = 0;
    for (const u of updates) {
        const r = await patchWithRetry(u);
        done++;
        if (r.ok) (u.outcome === 'passed' ? stats.updated_passed : stats.updated_notApplicable).push(u.tc_id);
        else stats.errors.push({ tc_id: u.tc_id, testPointId: u.testPointId, error: r.error });
        if (done % 50 === 0) process.stderr.write(`Progress: ${done}/${updates.length}\n`);
    }
    process.stderr.write(`Done: ${done} processed\n`);
    console.log(JSON.stringify(stats));
}
main().catch(e => { console.error(e.message); process.exit(1); });
```

Run:

```powershell
$pushRaw = node $env:TEMP\ado-testplan-sync\_temp_gh_push.js $PLAN $env:TEMP\ado-testplan-sync\_temp_updates.json 2>&1
$jsonLine = ($pushRaw | Where-Object { $_ -match '^\{' }) -join ''
$stats = $jsonLine | ConvertFrom-Json
```

## Phase 5: Summary and clean up

Delete temp files:

```powershell
Remove-Item $env:TEMP\ado-testplan-sync\_temp_gh_parse.js  -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_gh_fetch.js  -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_gh_diff.js   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_gh_push.js   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_parse.json   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_fetch.json   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_updates.json -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\gh-run-$RUN -Recurse -Force -ErrorAction SilentlyContinue
```

Print the final summary:

```
GitHub run {githubRun} → ADO Plan {planId} ({planName})

Metric                    Count
──────────────────────────────────────────────────
Updated → passed          {N}
Updated → notApplicable   {N}    (Failed in the run)
Skipped (protected)       {N}    (passed/blocked/failed — untouched)
Not found in plan         {N}    TC IDs: ...
Errors                    {N}    (after 5 retries)
```

## Rules

- **Phase 0 first** — if the run or plan id is missing, ask the user. This skill is
  input-by-run: the user names the GitHub Actions run to sync.
- Always run Phase 1 before touching ADO — stop if zero testable results are found.
- **Phase 3 checkpoint is mandatory** — never PATCH anything before the user confirms.
- Only two outcome values are ever written: `passed` and `notApplicable` — nothing else.
- **Never overwrite protected outcomes** — skip any point whose `currentOutcome` is
  `passed`, `blocked`, or `failed`.
- The ADO test case id is the **leading numeric sequence** of the JUnit
  `<testcase classname="...">` (the feature title's ADO prefix).
- Deduplicate by `tc_id` — worst outcome wins across all suites in the run
  (Failed > Passed > Skipped).
- Fully-skipped test cases and classnames with no leading id are **excluded**, not written.
- Auth is a **Bearer token from `az account get-access-token`** (resource
  `499b84ac-1321-427f-aa17-267ca6975798`), stored in `$env:ADO_TOKEN`. Fail with a
  clear message (and tell the user to `az login`) if it's empty.
- Use Node.js — write scripts as `.js` files to `$env:TEMP\ado-testplan-sync\`. Never embed
  multiline JavaScript in a PowerShell here-string.
- Save JSON without BOM: `[System.IO.File]::WriteAllText(path, data, (New-Object System.Text.UTF8Encoding $false))`.
- Retry each PATCH up to 5 times with a 15-second delay.
- Accept a URL or numeric id for both run and plan — extract the run id from
  `/actions/runs/<id>` and the plan id from the `planId=` query parameter.
- Delete all temp files (and the downloaded `gh-run-*` folder) on completion or error.
- **Never write to the `Atriis.Test.Automation` repo** — all temp files go in `$env:TEMP\ado-testplan-sync\`.

## Relationship to `scripts/sync-results-to-ado-testplan.js`

That committed script does a *different* job: it creates an ADO **Test Run** and
maps run-Failed → **failed** (a real failure), using the same `az` auth and the
same JUnit classname key. This skill instead marks **point outcomes directly**
(the "Mark outcome" button behavior), maps Failed → **notApplicable**, and skips
protected outcomes — faithfully preserving the Testim agent's contract. Use the
committed script when you want a Test Run record; use this skill when you want to
stamp point outcomes exactly as the Testim flow did.
