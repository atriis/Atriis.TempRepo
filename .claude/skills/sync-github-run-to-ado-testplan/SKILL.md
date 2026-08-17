---
name: sync-github-run-to-ado-testplan
description: >
  Given a GitHub Actions run from THIS repo (run id or URL) and an ADO Test Plan
  ID (or URL), downloads the run's cucumber JUnit artifacts, maps each feature's
  leading ADO test-case id to a test point, and PATCHes each point's outcome
  directly — without creating a test run. Passed → passed, Failed → notApplicable.
  The test inventory and the hybrid marking are always read from origin/main.
  Skips scenarios with no numeric ADO id prefix, fully-skipped test cases, tests
  that do not exist on main, and HYBRID tests (which must stay Active in ADO
  whether they pass or fail).
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
- **Phase 1b** — Scan the repo's feature files → the set of HYBRID test-case ids to exclude
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

**The run must be a `main` run.** Results from a branch run reflect that branch's
feature files, not the tests of record. Check the branch before doing any work:

```powershell
$runBranch = (gh run view $RUN --json headBranch --jq .headBranch)
```

If `$runBranch` is not `main`, stop and tell the user which branch it is. Only
continue if they explicitly confirm they want that run synced anyway — and if
they do, keep the `main`-based rules in Phase 1b exactly as they are (the test
inventory still comes from `main`, never from the run's branch).

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

// Handles both self-closing <testcase .../> and <testcase ...>...</testcase>.
// The open tag is scanned quote-aware rather than matched with /<testcase\b([^>]*?)>/:
// `[^>]*?` stops at the FIRST `>`, including one inside a quoted attribute value,
// so a feature title containing `>` (e.g. TC 64409 "... inProgress > &quot;Confirmation
// in progress&quot; ...") truncates the attrs group mid-value, classname parses as
// empty, and the whole test case is silently dropped as "no leading numeric ADO id".
function parseJunit(xml) {
    const rows = [];
    const TAG = '<testcase';
    let i = 0;
    while ((i = xml.indexOf(TAG, i)) !== -1) {
        let j = i + TAG.length, quote = null, end = -1;
        for (; j < xml.length; j++) {
            const c = xml[j];
            if (quote) { if (c === quote) quote = null; continue; }
            if (c === '"' || c === "'") { quote = c; continue; }
            if (c === '>') { end = j; break; }
        }
        if (end === -1) break;   // truncated file
        const selfClose = xml[end - 1] === '/';
        const attrs = xml.slice(i + TAG.length, selfClose ? end - 1 : end);
        const cm = /classname="([^"]*)"/.exec(attrs);
        const classname = cm ? cm[1] : '';

        let outcome = 'Passed', next = end + 1;
        if (!selfClose) {
            const close = xml.indexOf('</testcase>', end);
            const body = close === -1 ? xml.slice(end + 1) : xml.slice(end + 1, close);
            if (/<failure\b/.test(body) || /<error\b/.test(body)) outcome = 'Failed';
            else if (/<skipped\b/.test(body)) outcome = 'Skipped';
            next = close === -1 ? xml.length : close + '</testcase>'.length;
        }
        rows.push({ classname, outcome });
        i = next;
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

## Phase 1b: Read `main` — the test inventory and the HYBRID exclusion set

**`main` is the only source of truth for what a test is.** Both facts this phase
produces — *does this test case exist at all* and *is it hybrid* — are read from
`origin/main`, never from the local working tree and never from the run's own
commit. A sync must produce the same decisions regardless of which branch the
user has checked out or what they have uncommitted.

This phase emits two sets: `onMain` (every test-case id that has a feature file on
`main`) and `hybrid` (the subset that must never be stamped).

**Hybrid tests must stay `Active` in the ADO plan whether they passed or failed
in the run.** A hybrid test is only half-automated — the automation drives the UI
but a human still verifies the other half (the GDS/supplier request, the email,
the log). A green automation run therefore does *not* mean the test case passed,
so the point must never be stamped.

The JUnit artifact cannot tell you this: the cucumber junit formatter writes only
`classname` and `name` — **no tags**. The hybrid marking lives in the repo, and
it is inconsistent (only ~half of the hybrid features carry the `@hybrid` tag).
Treat a feature as hybrid if **any** of these is true:

1. it has the `@hybrid` tag,
2. its `Feature:` title contains "hybrid" (any case),
3. its filename contains "hybrid",
4. its `# Labels:` header comment lists `hybrid`.

Write this script to `$env:TEMP\ado-testplan-sync\_temp_gh_hybrid.js`:

```js
const fs = require('fs');
const path = require('path');

const root = process.argv[2];   // <repo>/tests/features
const OUT = process.argv[3];
if (!root || !OUT) { console.error('usage: node _temp_gh_hybrid.js <featuresDir> <outPath>'); process.exit(2); }

function walk(d, out = []) {
    if (!fs.existsSync(d)) return out;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) walk(full, out);
        else if (/\.feature$/i.test(e.name)) out.push(full);
    }
    return out;
}

// Same key the JUnit classname uses: the leading ADO id. Fall back to the
// filename, then to the first id anywhere in the title (covers titles like
// "HYBRID 68135 United NDC ..." and "hybrid_for_44798 Benerail ...").
function resolveId(title, base) {
    let m = /^\s*(\d{3,6})\b/.exec(title);   if (m) return m[1];
    m = /^\s*(\d{3,6})\b/.exec(base);        if (m) return m[1];
    // "hybrid_for_44798 ..." — `_` is a word char, so \b never fires there.
    const ANY = /(?<!\d)(\d{3,6})(?!\d)/;
    m = ANY.exec(title) || ANY.exec(base);   return m ? m[1] : null;
}

const files = walk(root);
const hybrid = {};   // tc_id -> { title, file, reasons[] }   (never stamped)
const onMain = {};   // tc_id -> { title, file }              (every test case on main)
for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const base = path.basename(f);
    const tm = /^[ \t]*Feature:[ \t]*(.+)$/m.exec(text);
    const title = tm ? tm[1].trim() : '';

    const id = resolveId(title, base);
    if (!id) continue;   // no ADO id -> the parser drops it anyway
    if (!onMain[id]) onMain[id] = { title: title || base, file: path.relative(root, f) };

    const labelLine = /^#[ \t]*Labels:(.*)$/mi.exec(text);
    const reasons = [];
    if (/(^|\s)@hybrid\b/m.test(text)) reasons.push('@hybrid tag');
    if (/hybrid/i.test(title)) reasons.push('title');
    if (/hybrid/i.test(base)) reasons.push('filename');
    if (labelLine && /(^|[,;\s])hybrid([,;\s]|$)/i.test(labelLine[1])) reasons.push('Labels header');
    if (!reasons.length) continue;

    if (hybrid[id]) { for (const r of reasons) if (!hybrid[id].reasons.includes(r)) hybrid[id].reasons.push(r); }
    else hybrid[id] = { title: title || base, file: path.relative(root, f), reasons };
}

fs.writeFileSync(OUT, JSON.stringify({ featureCount: files.length, hybrid, onMain }), 'utf8');
console.log(JSON.stringify({
    featureCount: files.length,
    onMainCount: Object.keys(onMain).length,
    hybridCount: Object.keys(hybrid).length
}));
```

**Always scan `main` — never the local working tree.** Neither the inventory nor
the exclusion set may depend on which branch the user happens to have checked out,
or on uncommitted edits to a feature file. Export `tests/features` from
`origin/main` into the temp dir and scan that copy:

```powershell
$repo = "c:\DEV\Atriis.Test.Automation"
$work = "$env:TEMP\ado-testplan-sync"
$featuresSrc = "$work\main-features"

# Refresh origin/main. If the fetch fails (offline / auth), WARN and continue with
# the local origin/main ref — but never silently fall back to the working tree.
git -C $repo fetch --quiet origin main
if ($LASTEXITCODE -ne 0) { Write-Warning "git fetch failed - using the local origin/main ref, which may be stale" }

$mainSha = (git -C $repo rev-parse --short origin/main)
if ($LASTEXITCODE -ne 0) { throw "origin/main could not be resolved - cannot build the hybrid set" }

Remove-Item $featuresSrc -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $featuresSrc | Out-Null
# --output, NOT a pipe: PowerShell's pipeline is text-based and corrupts the
# binary tar stream that `git archive | tar -x` relies on.
git -C $repo archive --output "$work\main-features.tar" origin/main tests/features
tar -x -f "$work\main-features.tar" -C $featuresSrc

$hybridRaw = node $work\_temp_gh_hybrid.js $featuresSrc\tests\features $work\_temp_hybrid.json
```

Report the resolved `$mainSha` in the Phase 3 preview so the user can see exactly
which revision the hybrid set came from.

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
const mainScan = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
const hybridSet = mainScan.hybrid || {};
const onMain = mainScan.onMain || {};
const OUT = process.argv[5];
const PROTECTED = new Set(['passed', 'blocked', 'failed']);
// Anything that is not one of these reads as "Active" in the Test Plan UI.
const ACTIVE = new Set(['', 'unspecified', 'none', 'active']);

const willUpdate = [], protectedSkip = [], notFound = [], hybridSkip = [], notOnMain = [];
for (const r of parse.results) {
    // Only tests that exist on main are synced. A result for a feature that is
    // not on main came from a branch (or was renamed/deleted since) and must not
    // be written to the plan.
    if (!onMain[r.tc_id]) { notOnMain.push({ tc_id: r.tc_id, classname: r.classname, runOutcome: r.outcome }); continue; }

    // HYBRID: never stamped — the test case must stay Active regardless of the
    // run outcome, because a human still verifies the non-automated half.
    if (hybridSet[r.tc_id]) {
        const pts = plan.tcToPoints[r.tc_id] || [];
        for (const p of pts) hybridSkip.push({ tc_id: r.tc_id, runOutcome: r.outcome, title: hybridSet[r.tc_id].title, reasons: hybridSet[r.tc_id].reasons, ...p });
        if (!pts.length) hybridSkip.push({ tc_id: r.tc_id, runOutcome: r.outcome, title: hybridSet[r.tc_id].title, reasons: hybridSet[r.tc_id].reasons, currentOutcome: '(not in plan)' });
        continue;
    }
    const pts = plan.tcToPoints[r.tc_id];
    if (!pts || !pts.length) { notFound.push(r.tc_id); continue; }
    for (const p of pts) {
        if (PROTECTED.has(p.currentOutcome)) protectedSkip.push({ tc_id: r.tc_id, ...p });
        else willUpdate.push({ tc_id: r.tc_id, outcome: r.outcome, suiteId: p.suiteId, suiteName: p.suiteName, testPointId: p.testPointId, currentOutcome: p.currentOutcome });
    }
}

// Hybrid points that a PREVIOUS sync already stamped are no longer Active.
// Reported so the user can decide; never reset automatically.
const hybridStale = hybridSkip.filter(h => h.currentOutcome !== '(not in plan)' && !ACTIVE.has(h.currentOutcome));

fs.writeFileSync(OUT, JSON.stringify(willUpdate), 'utf8');
fs.writeFileSync(OUT.replace(/\.json$/, '-hybrid.json'), JSON.stringify(hybridSkip), 'utf8');
console.log(JSON.stringify({
    planName: plan.planName,
    willUpdate_passed: willUpdate.filter(u => u.outcome === 'passed').length,
    willUpdate_notApplicable: willUpdate.filter(u => u.outcome === 'notApplicable').length,
    willUpdate_total: willUpdate.length,
    protectedCount: protectedSkip.length,
    hybridCount: hybridSkip.length,
    hybridPassedInRun: hybridSkip.filter(h => h.runOutcome === 'passed').length,
    hybridFailedInRun: hybridSkip.filter(h => h.runOutcome === 'notApplicable').length,
    hybridStale,
    notOnMainCount: notOnMain.length,
    notOnMain,
    notFound
}));
```

Run:

```powershell
$diffRaw = node $env:TEMP\ado-testplan-sync\_temp_gh_diff.js $env:TEMP\ado-testplan-sync\_temp_parse.json $env:TEMP\ado-testplan-sync\_temp_fetch.json $env:TEMP\ado-testplan-sync\_temp_hybrid.json $env:TEMP\ado-testplan-sync\_temp_updates.json
```

Classification (checked in this order):
- **Not on `main`** → `notOnMain` (no feature file on main — branch-only or since renamed/deleted)
- **Hybrid** → `hybridSkip` (never written — stays Active, pass or fail)
- **Not found** → `notFound` (test case has no point in the plan)
- **Found, `currentOutcome` in {passed, blocked, failed}** → `protected` (every matching point — untouched)
- **Found, not protected** → `willUpdate`

Present:

```
===========================================================================
GITHUB RUN → ADO UPDATE PREVIEW
Plan:  #{planId} "{planName}"
Run:   {githubRun}  (branch: {runBranch})
Tests: origin/main @ {mainSha} — {onMainCount} test cases, {hybridCount} hybrid
===========================================================================

WILL BE UPDATED ({willUpdate_total} test points):
  passed={N}   notApplicable={N}
  NOTE: a run FAILURE is written as ADO "notApplicable" (not "failed") —
        this is the Testim agent's contract, carried over intentionally.

SKIPPED — HYBRID, LEFT ACTIVE ({hybridCount} test points):
  passed in run={N}   failed in run={N}
  Hybrid tests are never stamped — a human still verifies the non-automated half.
  Hybrid set read from origin/main @ {mainSha} ({hybridCount} ids)
  TC IDs: {comma-separated hybrid tc_ids}

SKIPPED — NOT ON MAIN ({notOnMainCount} test cases):
  No feature file on origin/main — branch-only, or renamed/deleted since the run.
  TC IDs: {comma-separated notOnMain tc_ids}

SKIPPED — PROTECTED ({protectedCount} test points):
  (currentOutcome is passed / blocked / failed — will not overwrite)

NOT FOUND IN PLAN ({N} test cases):
  TC IDs: {comma-separated notFound}

Proceed and PATCH {willUpdate_total} test points in plan #{planId}?
  -> Yes   -> No (abort)
===========================================================================
```

**Do not proceed to Phase 4 until the user explicitly says Yes.**

**If `hybridStale` is non-empty**, add this note under the hybrid block — those
points are not Active because an *earlier* sync (before this rule existed) already
stamped them:

```
  WARNING: {N} hybrid point(s) are currently {outcome}, not Active:
    TC {tc_id} "{title}" -> {currentOutcome}
  Skipping them keeps them as-is; it does not restore them to Active.
  Reset them to Active as well? -> Yes / No (default No)
```

Only if the user says Yes, reset those points in Phase 4 with the same
PATCH endpoint and body `{ "resetToActive": true }` (not an `outcome` value).
Never do this unprompted.

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
Remove-Item $env:TEMP\ado-testplan-sync\_temp_gh_hybrid.js -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_parse.json   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_fetch.json   -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_hybrid.json  -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_updates.json -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\_temp_updates-hybrid.json -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\main-features.tar -ErrorAction SilentlyContinue
# Remove-Item -Recurse can return before Windows releases the directory handle,
# leaving the (now empty) root behind. Retry once; a leftover empty dir is
# harmless either way — Phase 1b recreates it.
Remove-Item $env:TEMP\ado-testplan-sync\main-features -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\main-features -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $env:TEMP\ado-testplan-sync\gh-run-$RUN -Recurse -Force -ErrorAction SilentlyContinue
```

Print the final summary:

```
GitHub run {githubRun} → ADO Plan {planId} ({planName})

Metric                    Count
──────────────────────────────────────────────────
Updated → passed          {N}
Updated → notApplicable   {N}    (Failed in the run)
Skipped (not on main)     {N}    (no feature file on origin/main)
Skipped (hybrid)          {N}    (left Active — pass or fail)
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
- **Never stamp a HYBRID test case** — hybrid points stay `Active` whether the run
  passed or failed, because only half the test is automated. The hybrid set comes
  from Phase 1b, *not* from the JUnit artifact — the junit formatter emits no tags.
  Hybrid is checked **before** the protected/not-found rules, so a hybrid id never
  reaches `willUpdate`. Resetting an already-stamped hybrid point back to Active
  requires an explicit Yes at the checkpoint.
- **`main` is the source of truth for the tests** — both the test inventory
  (`onMain`) and the hybrid set are read from `origin/main`, exported with
  `git archive` into `$env:TEMP\ado-testplan-sync\main-features\`. Never the local
  working tree, never the run's own commit. The decisions must be identical no
  matter which branch is checked out or what is uncommitted. Show the `main` SHA
  in the preview.
- **Only sync tests that exist on `main`** — a result whose tc id has no feature
  file on `main` is branch-only (or renamed/deleted since) and is never written.
- **The run itself should be a `main` run** — check `headBranch` in Phase 0 and
  require explicit confirmation before syncing a branch run.
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
