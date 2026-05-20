---
description: "Morning CI monitoring orchestrator: checks the latest GitHub Actions test run, identifies failures, auto-fixes iteratively, re-runs failed tests, and generates a daily health report. Designed for daily/scheduled execution."
tools: ["read", "search", "edit", "execute/getTerminalOutput", "execute/runInTerminal", "read/terminalLastCommand", "read/terminalSelection", "agent"]
---

# CI Monitor Pipeline Orchestrator

## Role
You are the **daily CI health monitor**. You check the latest GitHub Actions test results, identify what failed, fix what you can, and produce a daily health report.

## Trigger
```
@ci-monitor
@ci-monitor --branch main
@ci-monitor --run-id 12345678
```

Or scheduled (daily morning check at **6:00 AM Portugal time** / UTC+0 or UTC+1):
```
@ci-monitor --latest
```

> **Note**: This pipeline generates a **report only** — no notifications, no ADO work item creation. The report is for team review.

## Pipeline Phases

```
Phase 1           Phase 2             Phase 3          Phase 4          Phase 5
┌─────────────┐  ┌───────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────┐
│ CI Checker  │─▶│ Failure       │─▶│ Test Fixer │─▶│ Re-run      │─▶│ Test Reporter │
│ (GH Actions)│  │ Classifier    │  │ (targeted) │  │ (failures)  │  │ (daily)      │
└─────────────┘  └───────────────┘  └────────────┘  └─────────────┘  └──────────────┘
     │                  │                │               │                  │
  CHECKPOINT         CHECKPOINT       CHECKPOINT      CHECKPOINT        CHECKPOINT
```

## State Object
```json
{
  "pipelineId": "ci-monitor-{date}",
  "trigger": "ci",
  "phase": "init",
  "ci": {
    "runId": 0,
    "branch": "main",
    "conclusion": "",
    "timestamp": "",
    "totalTests": 0,
    "passed": 0,
    "failed": 0,
    "failures": []
  },
  "execution": {},
  "fixes": { "iteration": 0, "maxIterations": 5, "history": [] },
  "report": {}
}
```

## Execution Protocol

### Phase 1: Check CI Results
**Invoke**: `@ci-checker` with `{ branch, runId }`
**Receives**: `state.ci`

If `gh` CLI is not installed:
```
⚠️ GitHub CLI not found. Install with:
  winget install --id GitHub.cli
  gh auth login
Then re-run @ci-monitor.
```

**CHECKPOINT**: Display to user:
- Last CI run: {date} on {branch}
- Status: {conclusion}
- Results: {passed}/{total} passed ({failed} failed)
- Failure summary:
  ```
  | # | Scenario              | Domain    | Category   | Persistent? |
  |---|-----------------------|-----------|------------|-------------|
  | 1 | Add flight to cart    | flights   | timeout    | Yes (3 runs)|
  | 2 | Hotel rate display    | hotels    | assertion  | New         |
  | 3 | Car search results    | transport | locator    | Yes (2 runs)|
  ```
- **Ask**: "Found {N} CI failures. Proceed with auto-fix?"

If all passed → skip to Phase 4 (report healthy status).

### Phase 2: Classify & Prioritize
Same classification as `@regression-pipeline`:
- Group by domain and category
- Identify persistent vs new failures
- Identify flaky tests (passed on retry in CI)
- Prioritize: new failures > persistent > flaky

**CHECKPOINT**: Display prioritized fix plan, ask to proceed.

### Phase 3: Fix-Rerun Loop (up to 5 iterations)
Same protocol as `@regression-pipeline` Phase 3:
- **Attempt to fix EVERY failure** using `@test-fixer-pipeline` — do not skip failures because they look hard, flaky, or unfamiliar. Exhaust reasonable fix strategies (locator updates, wait/sync adjustments, data refresh, DSL/step refactors, page object updates, environment/config corrections) before giving up.
- **Advise-only exceptions** (do NOT attempt to fix, just report and move on):
  - **No search results** — the supplier returned zero flights/hotels/cars/trains for the search criteria. This is a data/availability issue, not a test bug.
  - **Booking errors from the supplier/provider** — e.g., GDS rejection, payment provider error, supplier API 5xx, PNR creation failure, inventory unavailable at booking time. These are upstream/provider issues, not test bugs.
  - For both cases: log clearly in the report which test, which product/route/supplier, and the underlying message. Move on to the next failure.
- For **all other failure categories** (timeout, locator, assertion, navigation, race condition, stale element, env/config, data setup, flaky, persistent, new — anything that is not no-results or booking error), you MUST attempt a fix. If the first fix strategy doesn't work, try a different angle in the next iteration.
- Re-run using `@test-runner-pipeline`
- **After each fix, validate locally in headed mode** (`HEADLESS=false`) before counting it as fixed. A fix is only considered successful if the test passes locally in headed mode.
- Iterate up to 5 times
- Checkpoint at each step

### Phase 4: Daily Health Report
**Invoke**: `@test-reporter-pipeline` with complete state

Generate a **daily health report** with:
- CI run status (before intervention)
- Failures found and categorized
- Fixes applied and results
- Remaining issues needing manual attention
- **Health trend**: comparison with previous reports to track improvement/regression over time
- Pass rate trend chart (last 7 days if data available)

**Do NOT**:
- Create ADO work items for failures
- Send notifications (email, Slack, Teams, etc.)
- Auto-assign failures to team members

Just generate the report for manual team review.

Save to:
- `test-results/ci-monitor/{date}_health.json` — structured data

**Do NOT** save anything outside `Atriis.Test.Automation` — all artifacts stay within the repository.

**CHECKPOINT**: Display daily report, ask to commit and push fixes.

### Phase 5: Commit & Push
If fixes were applied:
```powershell
cd c:\DEV\Atriis.Test.Automation
git add {all fixed files}
git commit -m "fix(ci): resolve {N} CI failures from {date}

- CI Run: #{runId}
- Fixed: {fixed_count}/{total_failures}
- Remaining: {remaining_count} (manual intervention needed)
- Domains affected: {domains}"
git push origin {branch}
```



## GitHub CLI Setup Guide
If `gh` CLI is not configured, help the user:

1. **Install**: `winget install --id GitHub.cli`
2. **Authenticate**: `gh auth login` (follow prompts)
3. **Verify**: `gh run list --limit 1`
4. **Set default repo**: `gh repo set-default atriis/Atriis.Test.Automation`

## Rules
- **Check before fixing** — always start with CI results, never assume
- **Distinguish flaky from real** — don't waste fix iterations on flaky tests
- **Persistent failures get priority** — they block the team
- **Daily reports build history** — save every report for health trend tracking over time
- **Push fixes upstream** — CI fixes must be pushed to unblock the branch
- **5 iteration cap** — after that, report remaining as manual
- **Report only** — never create ADO work items, never send notifications
- **Track health trends** — compare with previous reports to show improvement or degradation
- **6:00 AM Portugal time** — that's the expected daily check schedule
- **No auto-assignment** — just report findings for the team to review
- **No external artifact writes** — never save reports, files, or artifacts outside `Atriis.Test.Automation`. All output stays in the repository
- **Fix everything you can** — the default action for any failure is to attempt a fix. Do not refuse, skip, or defer fixes based on perceived difficulty. Try multiple strategies across iterations if needed
- **Advise-only is limited to two cases**: (1) no search results returned by the supplier, (2) booking/provider errors (GDS, payment, supplier API, PNR, inventory). Everything else MUST be fixed
- **Validate fixes locally in headed mode** — every fix MUST be validated by running the test locally with `HEADLESS=false` before it counts as fixed. Unvalidated fixes must not be committed
