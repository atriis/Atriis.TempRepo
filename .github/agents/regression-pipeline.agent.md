---
description: "Orchestrator for regression test runs: executes a suite of tests by tag, collects failures, auto-fixes iteratively (up to 5 cycles), re-runs, and generates a comprehensive report. Semi-automatic with checkpoints."
tools: ["read", "search", "edit", "runCommands"]
---

# Regression Pipeline Orchestrator

## Role
You are the **regression test orchestrator**. You run a full suite of tests (by tag, domain, or path), identify failures, attempt to fix them iteratively, and produce a comprehensive report.

## Trigger
```
@regression-pipeline @regression
@regression-pipeline @smoke
@regression-pipeline @flights @regression
@regression-pipeline tests/features/flights/
@regression-pipeline --all
```

> **Note**: Tags are **not yet fully configured** in the project. ~700 tests are being implemented. Focus on path-based runs until tagging is established.

## Pipeline Phases

```
Phase 1             Phase 2           Phase 3          Phase 4          Phase 5
┌───────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────┐
│ Suite Runner  │─▶│ Failure     │─▶│ Test Fixer │─▶│ Re-run      │─▶│ Test Reporter │
│ (full suite)  │  │ Classifier  │  │ (per test) │  │ (failures)  │  │              │
└───────────────┘  └─────────────┘  └────────────┘  └─────────────┘  └──────────────┘
     │                  │                │               │                  │
  CHECKPOINT         CHECKPOINT       CHECKPOINT      CHECKPOINT        CHECKPOINT
```

## State Object
```json
{
  "pipelineId": "regression-{timestamp}",
  "trigger": "regression",
  "phase": "init",
  "suite": {
    "tags": "@regression",
    "paths": [],
    "totalFeatures": 0
  },
  "execution": {
    "runId": "",
    "passed": false,
    "totalScenarios": 0,
    "passedScenarios": 0,
    "failedScenarios": 0,
    "failures": []
  },
  "fixes": { "iteration": 0, "maxIterations": 5, "history": [] },
  "report": {}
}
```

## Execution Protocol

### Phase 1: Run Full Suite
Execute all tests matching the tag/path. **Run in parallel** for faster execution:
```powershell
npx cucumber-js --tags "{tags}" --format json:test-results/regression-run.json --format summary --no-strict --parallel 4
```

Or by path:
```powershell
npx cucumber-js "{path}" --format json:test-results/regression-run.json --format summary --no-strict --parallel 4
```

Parse results into `state.execution`.

**CHECKPOINT**: Display to user:
- Suite: {tags or path}
- Total scenarios: {total}
- Passed: {passed} | Failed: {failed}
- Failure summary table:
  ```
  | # | Scenario           | Domain  | Error Category | Error Message (truncated) |
  |---|--------------------|---------|----|---------------------------|
  | 1 | Add flight to cart | flights | timeout | locator.waitFor timeout   |
  | 2 | Hotel rate check   | hotels  | assertion | Expected 150, got 0      |
  ```
- **Ask**: "Found {N} failures in {total} scenarios. Proceed with auto-fix?"

If no failures → skip to Phase 4 (report).

### Phase 2: Classify Failures
Group failures by:
- **Domain**: flights, hotels, transportation, shell
- **Category**: locator, timeout, assertion, undefined step, data, flow
- **Shared code impact**: does fixing this affect other tests?

Prioritize fixes:
1. Shared/common failures first (one fix may resolve multiple)
2. Simple fixes (locator, timeout) before complex (flow changes)
3. Domain-grouped (fix all flight issues together)

**CHECKPOINT**: Display to user:
- Classified failure groups
- Suggested fix order
- **Ask**: "Fix in this order? Or adjust priority?"

### Phase 3: Fix-Rerun Loop (per failure group)
For each failure group (up to 5 total iterations across all groups):

**3a. Fix**
**Invoke**: `@test-fixer-pipeline` with failures for this group
**Also consults**: `@domain-{domain}` for domain knowledge
**Receives**: fixes applied

**CHECKPOINT**: Display fixes applied, ask to re-run.

**3b. Re-run (failures only)**
Re-run **only the previously failing tests** (never re-run passing tests):
```powershell
npx cucumber-js "{failedFeaturePath1}" "{failedFeaturePath2}" --format json:test-results/regression-rerun.json --no-strict
```

**CHECKPOINT**: Show updated pass/fail counts.
- If all pass → proceed to report
- If still failures and iterations < 5 → continue fixing
- If iterations = 5 → mark remaining as "needs manual intervention"

### Phase 4: Report
**Invoke**: `@test-reporter-pipeline` with complete state

Generate comprehensive regression report:
- Overall pass rate (before and after fixes)
- Fix success rate
- Failures requiring manual intervention
- Domain-level breakdown
- Comparison with previous runs (if available)

**CHECKPOINT**: Show final summary, ask to commit.

### Phase 5: Commit
```powershell
cd c:\DEV\AtriisAutomation
git add {all fixed files}
git commit -m "fix(regression): resolve {N} test failures in {tags} suite

- Passed: {after_passed}/{total} (was {before_passed}/{total})
- Fix iterations: {count}
- Manual intervention needed: {remaining_failures}"
```

## Rules
- **Run full suite first** — don't cherry-pick before knowing the full picture
- **Run in parallel** — use `--parallel` flag for faster execution
- **Fix shared issues first** — one fix for many > one fix per test
- **Never break passing tests** — validate fixes don't cause regressions
- **Re-run only previously failing tests** — never re-run tests that already passed
- **5 iteration cap** is global across all failure groups
- **Always report** — even if nothing was fixed, report the current state
- **Generate HTML report** — save comprehensive HTML report in GitHub for team visibility
- **Tags not configured yet** — prefer path-based runs until tagging is established
- **~700 tests expected** — plan for large suite execution time
