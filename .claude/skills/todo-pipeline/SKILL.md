---
description: "Orchestrator for completing incomplete tests: sequences scan → plan → implement per file, then run, fix, dedup, and a mandatory code-review gate until the test passes. Holds no implementation logic — sequencing only."
tools: ["read", "search", "edit", "execute/getTerminalOutput", "execute/runInTerminal", "read/terminalLastCommand", "read/terminalSelection", "agent"]
agents: ["todo-scanner", "todo-planner", "todo-implementer", "test-runner-pipeline", "test-fixer-pipeline", "code-reviewer", "domain-flights", "domain-hotels", "domain-shell", "domain-transportation"]
---

# TODO Resolver Pipeline (Orchestrator)

Resolve TODOs by sequencing three delegated stages per file — never by implementing here. The split freezes the decision that drives everything (reuse-vs-create + exact target file) in a read-only planning stage *before* any edit exists, so the implementer cannot rationalize "create new" backward. That DECIDE/DO separation is the source of determinism.

## Source of Truth (priority)
`.github/CLAUDE.md` → `page-objects.md` → `dsl.md` → `error-handling.md` → `@domain-{domain}`.

## Output Discipline
1–3 sentences or a flat list per update. Report only what changed; no plan restatement.

## Trigger
```
@todo-pipeline tests/features/hotels/to_adjust/22074_file.feature
@todo-pipeline tests/features/hotels/to_adjust/
@todo-pipeline --scan [--domain hotels]
```

## State Object — each sub-agent appends its own section, never touches others'
```json
{
  "phase": "init | scanned | planned | implemented | rerun",
  "input": { "paths": [], "domain": null, "scanMode": false },
  "inventory": { "files": [], "todos": [], "byCategory": {}, "byFile": {}, "kept": [] },
  "plan": { "file": "", "artifacts": [], "ambiguous": [], "ordered": [], "safeguards": [] },
  "implementation": { "file": "", "artifactsCreated": [], "todosResolved": [], "todosKept": [], "deadRemoved": [], "syntaxOk": true, "blocked": [] }
}
```
`plan`/`implementation` are per-file — carry the current file's sections forward, accumulate finished files in the report.

## Pipeline
`Scan → per file [Plan → Implement] → Run → Fix(≤5) → Dedup → Review → next file → Report → Commit`

### Phase 1 — Scan → `@todo-scanner`(`input`)
**CHECKPOINT**: files / TODO counts / category breakdown. Ask which files to process. Many (`--scan`) → suggest domain batches of 3–5, shared TODOs first.

### Phase 2a — Plan → `@todo-planner`(one file's `inventory.todos`, `domain`)
If `plan.ambiguous` non-empty → **ask the user** each target-file question before implementing. If `plan.safeguards` flags a missing hotel refundable/cancellation step → confirm before proceeding. Else carry the frozen plan forward.

### Phase 2b — Implement → `@todo-implementer`(`plan`, `domain`)
The only stage that edits. Pass **only** the frozen `plan` + `domain` — never the raw feature text or a re-decide-reuse request. **CHECKPOINT**: resolved/total, artifacts, kept TODOs, `blocked`. Ask: "Proceed with test run?"

### Phase 3 — Run → `@test-runner-pipeline`(featurePath)
**CHECKPOINT**: pass/fail, scenario counts, errors. Ask to fix or move on.

### Phase 4 — Fix loop (≤5) → `@test-fixer-pipeline` + `@domain-{domain}`
Delegate fully (fixer owns triage/iteration). Zero search results → **STOP**, mark blocked, next file. Still failing at iteration 5 → mark "needs manual intervention", move on.

### Phase 4.5 — Dedup (cross-file)
Per-artifact dead code already removed by the implementer; here consolidate across files: duplicate step phrase in 2+ files → one (prefer shared); duplicate DSL → consolidate or flag. After removal: `node -c` modified files, re-run. Cleanup breaks a passing test → **revert immediately**. **CHECKPOINT**: consolidated/flagged, re-run result.

### Phase 4.6 — Code review (mandatory — cannot be skipped)
> ⚠️ **Do not remove or weaken this phase.** It is the *only* code-review gate for `@e2e-test-pipeline`, which intentionally does not call `@code-reviewer` itself and relies on this Phase 4.6 (see e2e-test-pipeline rule #2 and its Phase 6 note). Dropping it silently bypasses code review for the entire e2e flow.

`@code-reviewer` `strictness=strict` on all created/modified files. **Verdicts**: PASS → proceed · 🟢 → log, proceed · 🟡 → fix all first · 🔴 → auto-fix mechanical, ambiguous → `#TODO:`, max 3 iterations, re-run after fixes, remaining → flag and proceed. Review fix breaks a passing test → revert it. **CHECKPOINT**: verdict, blockers (found/fixed/remaining), iterations, re-run result.

### Phase 5 — Placement
Don't move feature files or update CI — leave to the user.

### Phase 6 — Next file
Repeat 2a–4.6 per selected file.

## Retry fast-path — don't redo work
A file already through Phase 2b → never re-scan/re-plan it; only its fix loop continues. If the fix loop changes a planned artifact's target file → re-plan **only that artifact**.

## Phase 7 — Report
```
TODO RESOLVER PIPELINE REPORT
Files: {N} | TODOs found: {N} | Resolved: {N} | Kept: {N}
Results: {file} ✅/❌ ({resolved}/{total})
Artifacts: {N} steps, {N} DSL, {N} pages | Cleanup: {N} dup steps consolidated
Review: {verdict} | Blockers: {found}/{fixed}/{remaining} | Iterations: {N}/3
Fix iterations: {N} | Blocked: {files + reason}
```
Ask to commit.

## Phase 8 — Commit
Delegate to `@commit` (never directly): `feat(todo-resolver): implement {N} TODOs across {M} feature files`

## Rules
1. **No implementation logic here** — delegate scan/plan/implement, carry state forward.
2. **Never skip Phase 2a** — no implementation without a frozen plan.
3. **`plan.ambiguous` blocks** — ask the target-file question; never guess.
4. **One file at a time**; batch by domain, shared TODOs first.
5. **5 fix iterations max**; no search results = STOP, mark blocked, move on.
6. **Phase 4.5 always runs; Phase 4.6 mandatory** — never skip (load-bearing for `@e2e-test-pipeline`).
7. **No auto file moves or CI updates**; commit via `@commit`.

### Hotels — Critical Cost Rules (confirm before Phase 2b if missing)
Never book non-refundable — plan must include a room-level refundable filter before selection. Verify refundable in cart before checkout; always cancel bookings at scenario end. Any of these flagged in `plan.safeguards` → confirm with the user first.
