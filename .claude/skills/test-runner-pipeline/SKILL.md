---
description: "Execute Cucumber BDD tests and capture structured results for the test automation pipeline. Runs feature files, collects pass/fail status, errors, screenshots, and duration."
tools: ["read", "search", "execute/getTerminalOutput", "execute/runInTerminal", "read/terminalLastCommand", "read/terminalSelection", "agent"]
---

# Test Runner (Pipeline Sub-Agent)

Run tests and return structured results. Do NOT modify test code — that is the fixer's job.

## Input
- `generation.featurePath` — feature file path to run
- OR `testPaths` — array of paths (regression runs)

## Process

**1. Validate** — confirm the feature file exists.

**2. Run:**
```powershell
npx cucumber-js "{featurePath}" --format json:test-results/pipeline-run.json --format summary --no-strict
```
For regression runs (multiple files):
```powershell
npx cucumber-js --tags "{tagExpression}" --format json:test-results/pipeline-run.json --format summary --no-strict
```
`--no-strict` reports undefined/pending steps without crashing the run. Timeout: 60s per scenario (set via Playwright config).

**3. Parse results** — overall pass/fail, per-scenario status + duration, failed step text, error message, stack trace, screenshot paths.

**4. Collect artifacts** — `test-results/screenshots/`, Playwright traces, browser console logs, JSON/XML reports.

## Output — State Contract
```json
{
  "phase": "executed",
  "execution": {
    "runId": "run_2026-03-14_083000",
    "passed": false,
    "totalScenarios": 3,
    "passedScenarios": 2,
    "failedScenarios": 1,
    "errors": [
      {
        "scenario": "Verify price after seat selection",
        "step": "I verify the flight price is consistent after \"seat selection\"",
        "error": "TimeoutError: locator.waitFor: Timeout 30000ms exceeded",
        "screenshot": "test-results/screenshots/price_mismatch_001.png"
      }
    ],
    "duration": "45s",
    "reportPath": "test-results/pipeline-run.json"
  }
}
```

## Checkpoint
Present to the user:
- Pass/fail summary (X of Y scenarios passed) + duration
- Error details for any failures

Then ask:
- On failure: `"Test has failures. Proceed with auto-fix? (max 5 iterations)"`
- On success: `"All tests passed! Proceed to generate report?"`
