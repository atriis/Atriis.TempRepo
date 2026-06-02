---
description: "Orchestrator for completing incomplete tests: scans feature files for TODO comments, implements missing step definitions, DSL methods, and page object updates, then runs and fixes iteratively until the test passes."
tools: ["read", "search", "edit", "execute/getTerminalOutput", "execute/runInTerminal", "read/terminalLastCommand", "read/terminalSelection", "agent"]
---

# TODO Resolver Pipeline

## Role
Resolve TODO comments in feature files by implementing missing steps, DSL methods, and page objects. Iterate until tests pass.

## Output Discipline
- 1–3 sentences or a flat list per update. No restating the full plan. Report only what changed.

## Trigger
```
@todo-pipeline tests/features/hotels/to_adjust/22074_file.feature
@todo-pipeline tests/features/hotels/to_adjust/
@todo-pipeline --scan
@todo-pipeline --scan --domain hotels
```

## Pipeline
Phase 1 → Phase 2 → Phase 3 → Phase 4 (loop ≤5) → Phase 4.5 → Phase 4.6 → Phase 5 → Phase 6 → Phase 7 → Phase 8

---

## Phase 1: Scan

```powershell
# Single file
Select-String -Path "{featurePath}" -Pattern "TODO" | ForEach-Object { $_.Line.Trim() }
# Folder/full scan
Get-ChildItem -Recurse -Filter "*.feature" "{path}" | Select-String -Pattern "TODO"
```

Classify each TODO:

| Category | Pattern |
|----------|---------|
| `step` | "Create step" / "Implement step" |
| `dsl` | "Create DSL" / "calls DSL method" |
| `page` | "Page Object" / "add locator" |
| `locator` | "Locator needs" / "Replace with" / "selector" |
| `other` | Anything else |

Resolve domain from file path (`tests/features/{domain}/`) or feature tags. Default: shell.

**CHECKPOINT**: Show files/TODO counts/breakdown by category. Ask: "Found {N} TODOs in {M} files. Which files/folders should I process?"
- If `--scan` found many → suggest batches of 3–5.

---

## Phase 2: Implement (one file at a time)

### 2a: Read context
Feature file → step definitions → DSL files → page objects → `@domain-{domain}`.

### 2b: UNDERSTAND → SCAN → CREATE (mandatory order)

1. **Understand**: intent, Gherkin phrase, layer, domain concepts.
2. **Scan** across `tests/steps/`, `src/dsl/`, `src/pages/` for existing or near-matching implementations.
3. **Decide**:
   - Exact match → reuse.
   - Near-match, safe to broaden → broaden.
   - Near-match, unsure → create new (don't touch existing).
   - No match → create new.

> When in doubt, don't touch existing code. Duplication is safer than breaking shared methods.

### 2c: Implement bottom-up

1. **Locators** — check `../Atriis.App/src/app/Atriis.App/` for `data-testid` first. Fall back: role > CSS > XPath. Add to SELECTORS constant.
2. **Page Object methods** — one Playwright action per method. `try/catch` with descriptive re-throw. All selectors via `SELECTORS.SOME_NAME`.
3. **DSL methods** — scan first. Validate all params. Compose from page methods. Assert with custom messages. Re-throw with business context. Update `src/dsl/index.js` if new file.
4. **Steps** — scan first. Shared steps before file-specific. One step per phrase. Call DSL, log with `logger`.
5. **Other** — implement if actionable; leave future-note TODOs as-is.

### 2d: Remove resolved TODOs
Delete the `# TODO:` line. No replacement. No blank lines left behind. Keep "adjust when…" / "replace with…" TODOs.

### 2e: Verify syntax
Gherkin parses, step signatures match, DSL methods exported, no circular imports.

**CHECKPOINT**: TODOs resolved/total, artifacts created, TODOs left with reason. Ask: "Implementation complete. Proceed with test run?"

---

## Phase 3: First Test Run

Invoke `@test-runner-pipeline`. **CHECKPOINT**: passed/failed, scenario counts, errors. Ask to proceed with fixes or move on.

---

## Phase 4: Fix Loop (≤5 iterations)

**Triage first**:
- Zero search results (hotels/flights/cars/rails) → **STOP**. Mark blocked, move to next file.
- Code/locator/step error → fix.

Invoke `@test-fixer-pipeline` + `@domain-{domain}`. Re-run after each fix. If still failing at iteration 5 → mark "needs manual intervention", move on.

---

## Phase 4.5: Dedup & Dead Code

Run after Phase 4, before moving files.

- **Page Objects**: grep each new/modified method in `src/dsl/`. Remove uncalled methods and their SELECTORS entries.
- **DSL**: grep each new/modified method in `tests/steps/`. Remove uncalled methods.
- **Duplicate steps**: same phrase in 2+ files → consolidate to one (prefer shared files).
- **Duplicate DSL**: same method in 2+ files → consolidate or flag.
- After any removal: `node -c "{filePath}"` on all modified files. Re-run tests.
- If cleanup breaks a previously passing test → **revert the cleanup immediately**.

**CHECKPOINT**: dead methods removed, duplicates consolidated, near-duplicates flagged, re-run result.

---

## Phase 4.6: Code Review (mandatory — cannot be skipped)

Invoke `@code-reviewer` with `strictness=strict` on all created/modified files.

Review checks: layer separation, reuse, patterns (object literal DSL, `page` first param, `getPageObject()`, SELECTORS, regular functions in steps), input validation, logging, naming, domain safety, no duplication, meaningful returns, Gherkin quality.

**Verdicts**:
- **PASS** → proceed.
- **PASS WITH COMMENTS** (🟢 only) → log suggestions, proceed.
- **PASS WITH COMMENTS** (🟡) → fix all 🟡 before proceeding.
- **FAIL** (🔴) → auto-fix mechanical blockers; ambiguous → `#TODO: {description}`; max 3 iterations. Re-run tests after fixes. Remaining blockers → flag in report, proceed.

If review fix breaks a passing test → revert that fix immediately.

**CHECKPOINT**: verdict, blocker counts (found/fixed/remaining), iterations used, re-run result.

---

## Phase 5: File Placement

Do not move feature files. Do not update CI. Leave placement to the user.

---

## Phase 6: Next File

Repeat Phase 2–5 for each selected file.

---

## Phase 7: Report

```
TODO RESOLVER PIPELINE REPORT
Files: {N} | TODOs found: {N} | Resolved: {N} | Kept: {N}
Results: {file} ✅/❌ ({resolved}/{total} TODOs)
Artifacts: {N} steps, {N} DSL methods, {N} page files modified
Cleanup: {N} dead methods, {N} dead selectors, {N} duplicate steps
Review: {verdict} | Blockers: {found}/{fixed}/{remaining} | Iterations: {N}/3
Fix iterations: {N} total
```

Ask to commit.

---

## Phase 8: Commit

```powershell
git add {files}
git commit -m "feat(todo-resolver): implement {N} TODOs across {M} feature files"
```

---

## Batch Strategy

Group by domain. Shared TODOs first. Dedup across files before creating. Batches of 3–5.

---

## Error Messaging Standards (mandatory)

Every `throw`, `expect`, `waitFor`, and `catch` must answer: WHAT was attempted, WHERE it failed, WHY (likely cause).

**Format**: `[Layer.method] What was attempted. Why it likely failed. Original: {err.message}`

**Rule 1 — No naked Playwright timeouts**
```javascript
// ✅
async clickBookButton() {
  try {
    await this.page.locator(SELECTORS.BOOK_BUTTON).click({ timeout: 15000 });
  } catch (err) {
    throw new Error(`[CartPage.clickBookButton] Could not click "Book" button (${SELECTORS.BOOK_BUTTON}). Button not visible/enabled in 15s — cart may be empty or modal blocking. Original: ${err.message}`);
  }
}
```

**Rule 2 — Input validation names the param + received value**
```javascript
if (!Array.isArray(travelers) || travelers.length === 0)
  throw new Error(`[HotelBooking.addTravelers] "travelers" must be non-empty array, got: ${typeof travelers} (${JSON.stringify(travelers)})`);
```

**Rule 3 — Every assertion has a custom message**
```javascript
await expect(page.locator(SELECTORS.PRICE), 'Hotel price in cart did not match selected rate — fee may have been added at cart step').toHaveText('€250.00');
```

**Rule 4 — DSL wraps workflows with business context**
```javascript
try { await resultsPage.selectHotelByName(hotelName); }
catch (err) { throw new Error(`[HotelBooking.bookHotel] Failed to select hotel "${hotelName}": ${err.message}`); }
```

**Rule 5 — Never swallow errors**. Every `catch` re-throws with context. No silent `return false`.

**Rule 6 — `logger.debug()` before risky DSL operations** for CI breadcrumbs.

Phase 4.6 blocks (🔴) on: naked timeouts, missing `try/catch`, missing `[Layer.method]` prefix, `expect()` without message, validation without param name/received value.

---

## Rules

- **UNDERSTAND → SCAN → CREATE** — always, for every TODO.
- **Never duplicate** — reuse existing if intent matches.
- **If unsure about broadening, don't touch it** — create new.
- **Always ask user to pick files** before processing.
- **Bottom-up**: locators → page objects → DSL → steps.
- **`data-testid` first** — then role > CSS > XPath.
- **Centralize selectors** in SELECTORS constant — no inline strings in methods.
- **Remove TODO comments cleanly** — no blank lines left.
- **Never remove future-note TODOs** ("adjust when…", "replace when…").
- **No auto file moves or CI updates**.
- **One file at a time**.
- **5 fix iterations max** per file.
- **Phase 4.5 always runs** after Phase 4.
- **Phase 4.6 is mandatory** — never skip.
- **No search results = STOP** — mark blocked, move on.

### Hotels — Critical Cost Rules
- **Never book non-refundable hotels** — add refundable filter step if missing.
- **Filter by refundable at room level** before selecting any room.
- **Verify refundable status in cart** before checkout.
- **Always cancel hotel bookings** at end of scenario. If cancellation step missing, add it.
- If safeguards are missing → flag to user before proceeding.
