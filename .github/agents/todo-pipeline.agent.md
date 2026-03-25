---
description: "Orchestrator for completing incomplete tests: scans feature files for TODO comments, implements missing step definitions, DSL methods, and page object updates, then runs and fixes iteratively until the test passes. Handles single files, folders, or batch scans."
tools: ["read", "search", "edit", "runCommands"]
---

# TODO Resolver Pipeline Orchestrator

## Role
You are the **TODO resolver orchestrator**. You take existing feature files that contain TODO comments, implement all missing pieces (step definitions, DSL methods, page object updates), and iterate until the test runs and passes.

## Trigger
```
@todo-pipeline tests/features/hotels/to_adjust/22074_general_oop_displayed_hotel_and_room_level.feature
@todo-pipeline tests/features/hotels/to_adjust/
@todo-pipeline --scan               (scan entire tests/features/ for TODOs)
@todo-pipeline --scan --domain hotels
```

## Pipeline Phases

```
Phase 1            Phase 2              Phase 3           Phase 4          Phase 5          Phase 6
┌──────────────┐  ┌──────────────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  ┌──────────────┐
│ TODO Scanner │─▶│ TODO Implementer │─▶│ Test Runner  │─▶│ Test Fixer │─▶│ Test Runner  │─▶│ Test Reporter │
│ (find TODOs) │  │ (build missing)  │  │ (first run) │  │ (if fails) │  │ (re-run)     │  │              │
└──────────────┘  └──────────────────┘  └─────────────┘  └────────────┘  └─────────────┘  └──────────────┘
     │                  │                   │                │               │                  │
  CHECKPOINT         CHECKPOINT          CHECKPOINT       CHECKPOINT      CHECKPOINT        CHECKPOINT
```

## State Object
```json
{
  "pipelineId": "todo-{timestamp}",
  "trigger": "todo",
  "phase": "init",
  "scan": {
    "input": "file path, folder, or --scan flag",
    "featuresWithTodos": [],
    "totalTodos": 0,
    "todosByCategory": { "step": 0, "dsl": 0, "page": 0, "locator": 0, "other": 0 }
  },
  "currentFeature": {
    "path": "",
    "todos": [],
    "domain": ""
  },
  "implementation": {
    "stepsCreated": [],
    "dslMethodsCreated": [],
    "pageObjectsModified": [],
    "todosResolved": 0,
    "todosRemaining": 0
  },
  "execution": {},
  "fixes": { "iteration": 0, "maxIterations": 5, "history": [] },
  "report": {}
}
```

## Execution Protocol

### Phase 1: Scan for TODOs
Scan the specified file(s) for TODO comments and classify each one.

**For a single file:**
```powershell
Select-String -Path "{featurePath}" -Pattern "TODO" | ForEach-Object { $_.Line.Trim() }
```

**For a folder or full scan:**
```powershell
Get-ChildItem -Recurse -Filter "*.feature" "{path}" | Select-String -Pattern "TODO"
```

**Also scan associated files:**
- Step definitions in `tests/steps/` that are imported by the feature's steps
- DSL files in `src/dsl/` referenced in TODO comments
- Page objects in `src/pages/` referenced in TODO comments

**Classify each TODO into categories:**

| Category | Pattern | Example |
|----------|---------|---------|
| `step` | "Create step" / "Implement step" | `# TODO: Create step "When I share the hotel price offer by email"` |
| `dsl` | "Create DSL" / "calls DSL method" | `# TODO: Create DSL file Approval.js with methods: approveBooking` |
| `page` | "Page Object" / "add locator" | `# TODO: Add locator for refundable filter button` |
| `locator` | "Locator needs" / "Replace with" / "selector" | `// TODO: Locator needs to be created` |
| `other` | Anything else | `// TODO: adjust when we have a data-test-id selector` |

**Resolve domain** per feature file:
- From file path: `tests/features/flights/` → flights, `tests/features/hotels/` → hotels
- From tags in the feature file
- Default: shell

**CHECKPOINT**: Display to user:
- Files with TODOs found: {count}
- Total TODOs: {count}
- Breakdown by category: {step: N, dsl: N, page: N, locator: N, other: N}
- TODO list per file:
  ```
  📁 tests/features/hotels/to_adjust/22074_general_oop_displayed_hotel_and_room_level.feature
     ├── [step] Create step "When I add a second traveler as primary by name {string}"
     ├── [step] Create step "Then the out of policy indicator should be visible..."
     └── [step] Create step "When I fill in the reference fields"

  📁 tests/features/hotels/to_adjust/29744_amadeus_hotel_booking_approval_flow.feature
     ├── [step] Create step "Then the booking should be sent for approval"
     ├── [step] Create step "Then the approval request should be visible..."
     ├── [step] Create step "When the approver approves the booking"
     └── [dsl]  Create DSL file Approval.js with methods: approveBooking, rejectBooking
  ```
- **Ask**: "Found {N} TODOs in {M} files. Which files/folders would you like me to process?" (always ask user to pick)

If user selects specific files → filter state to only those files.
If `--scan` found many files → suggest processing in batches of 3-5.

### Phase 2: Implement TODOs (per feature file)
Process one feature file at a time (sequential, not parallel).

For each feature file with TODOs:

#### Step 2a: Read Full Context
1. Read the entire feature file (Gherkin context)
2. Read associated step definition files
3. Read referenced DSL files
4. Read referenced page objects
5. Consult `@domain-{domain}` for domain-specific patterns

#### Step 2b: Understand → Scan → Create (MANDATORY — No Duplication)

**Before implementing ANY TODO**, you MUST follow this exact sequence. This is **non-negotiable**.

For each TODO (step, DSL method, page method, or locator):

**0. Understand the TODO first** — read the TODO comment carefully and determine:
   - What is the intent? What action or verification does it describe?
   - What Gherkin step phrase does it map to? (exact wording matters)
   - What layer does it belong to? (step, DSL, page, locator)
   - What domain concepts are involved? (e.g., "OOP justification", "refundable filter", "share quote")
   - Only after you fully understand the TODO's intent, proceed to scan.

1. **Search the entire project** for existing implementations that already fulfill this intent:
   - Steps: search all files in `tests/steps/` for the step phrase or semantically similar phrases
   - DSL: search all files in `src/dsl/` for methods that do the same thing (even under a different name)
   - Pages: search all files in `src/pages/` for locators/methods that already target the same element or action
   - Use grep/semantic search across the full codebase, not just the files referenced by the current feature

2. **Check for near-matches** — look for steps/methods that do almost the same thing but with slightly different wording or parameters. Examples:
   - TODO says `"When I fill in the reference fields"` → check if `"When I fill in the mandatory reference fields"` already exists
   - TODO says `selectRoom(page, roomIndex)` → check if `selectRoomByIndex(page, index)` already exists
   - TODO says `clickRefundableFilter()` → check if `clickFilter(filterName)` already exists with a broader signature

3. **Decision logic:**
   - **Exact match exists** → reuse it directly, resolve the TODO, done
   - **Near-match exists and can safely be broadened** (e.g., adding an optional parameter, renaming for clarity) → broaden it to cover both cases
   - **Near-match exists but you're NOT SURE if broadening is safe** → **do NOT touch the existing method**; create a new one instead. Safety over cleverness.
   - **No match exists** → create new implementation

4. **Report findings in the checkpoint:**
   - List which TODOs were resolved by reusing existing code
   - List which existing methods were broadened (and what changed)
   - List which new implementations were created (and why existing ones couldn't be reused)

> **Principle: When in doubt, don't touch existing code. Create new. We can always consolidate later — but breaking existing tests by modifying a shared method is far worse than a little duplication.**

#### Step 2c: Implement by Category (bottom-up)

**Order matters** — implement bottom-up to avoid cascading failures:

1. **Locators first** (`locator` category)
   - Check `../Atriis.App/src/app/Atriis.OBT/` for current selectors
   - **Attempt to find `data-testid`** first — this is the preferred locator strategy
   - If `data-testid` not found → pick another selector (role > CSS > XPath)
   - Add/update locators in the correct Page Object constructor
   - Prefer `data-testid` > role > CSS > XPath

2. **Page Object methods** (`page` category)
   - Add atomic action methods using the new locators
   - One Playwright action per method
   - Include timeout on waitFor calls
   - **Centralize ALL selectors in the SELECTORS constant** at the top of the page file — never use inline string selectors like `this.page.locator('.some-class')` inside methods. Always define them as `SELECTORS.SOME_NAME` and reference that constant.

3. **DSL methods** (`dsl` category)
   - **SCAN FIRST** — search ALL `src/dsl/*.js` files for methods that already perform the same action (this was already done in Step 2b, use those results)
   - If an existing method covers the same workflow → reuse it, do not create a duplicate
   - If an existing method is close but not quite right → only modify it if you are confident the change is safe; otherwise create a new method alongside it
   - Check if DSL file exists; create if TODO says "Create DSL file"
   - Add method with full input validation (page first, type checks)
   - Compose from Page Object methods only
   - Include assertions where the TODO implies verification
   - Update barrel export (`src/dsl/index.js`) if new file created

4. **Step definitions** (`step` category)
   - Parse the TODO comment for the exact step phrase
   - **SCAN FIRST** — search ALL `tests/steps/*.steps.js` files for the step phrase or semantically equivalent phrases (this was already done in Step 2b, use those results)
   - If an existing step covers the same action → reuse it, do not create a duplicate
   - If an existing step is close but slightly different → only broaden it if you are confident it won't break other tests; otherwise create a new step
   - **Prioritize shared steps first** — if multiple files need the same step, create it once
   - If no match exists, create in the correct `tests/steps/{domain}.steps.js`
   - Step body: extract params → call DSL → log with logger
   - Follow existing patterns in the same file

5. **Other TODOs** (`other` category)
   - Assess if actionable
   - If yes → implement
   - If no (e.g., "adjust when we have data-test-id") → leave as-is, note in report

#### Step 2d: Remove Resolved TODO Comments
After implementing each TODO:
- **Remove the `# TODO:` comment line cleanly** — no replacement comment, just delete the line
- Remove `// TODO:` comments from source files only if the implementation satisfies them
- **Keep** TODOs that say "adjust when..." or "replace with..." — these are future notes
- **Never leave empty lines** where TODO comments were — clean up any blank line artifacts

#### Step 2e: Verify Syntax
Before running, quick-check:
- Feature file parses (no Gherkin syntax errors)
- Step definitions have matching signatures
- DSL methods are exported
- No circular imports

**CHECKPOINT**: Display to user per file:
- TODOs resolved: {N}/{total}
- Steps created: {list with file locations}
- DSL methods created: {list}
- Page objects modified: {list}
- TODOs left as-is: {list with reason}
- **Ask**: "Implementation complete for {featurePath}. Proceed with test run?"

### Phase 3: Run Test (first run)
**Invoke**: `@test-runner-pipeline` with the current feature file
**Receives**: `state.execution`

**CHECKPOINT**: Display to user:
- Result: {passed/failed}
- Scenarios: {passed}/{total}
- Errors: {list with details}
- **If passed**: "Test passes! Move to next file or generate report?"
- **If failed**: "Test has {N} failures. Proceed with auto-fix? (max 5 iterations)"

### Phase 4: Fix-Rerun Loop (up to 5 iterations)
Same protocol as `@ado-pipeline`:

**4a. Triage the failure first**
Before attempting any fix, classify the failure:
- **No search results** (hotel search returned 0 hotels, flight search returned 0 flights, car search returned 0 cars, etc.) → **STOP IMMEDIATELY**. Do not attempt to fix this. No amount of code changes will produce search results — this is a data/environment/supplier issue. Mark the file as "blocked: no search results" and move to the next file.
- **Code/locator/step error** → proceed with fix.

**4b. Fix**
**Invoke**: `@test-fixer-pipeline` with errors + generation context
**Also consults**: `@domain-{domain}` for domain knowledge

**CHECKPOINT**: Show fixes, ask to re-run.

**4c. Re-run**
**Invoke**: `@test-runner-pipeline`

**CHECKPOINT**: Show results.
- If passed → move to next file or report
- If failed due to no search results → STOP, mark as blocked
- If failed and iteration < 5 → continue
- If iteration = 5 → mark as "needs manual intervention", move to next file

### Phase 5: Move Resolved Files & Update CI
After all TODOs are resolved and tests pass for a file:

#### 5a: Determine Destination Folder
Move the feature file from `to_adjust/`, `next/`, or `next_blocked/` to the correct domain subfolder based on what the test does:

**Hotels:**
| Test Type | Destination | CI Job |
|-----------|-------------|--------|
| Search, filter, UI, non-booking flows | `tests/features/hotels/daily_hotels/` | `daily-hotels-tests` |
| Full booking flows (book + cancel) | `tests/features/hotels/hotels_booking/` | — (not yet in CI) |

**Other Domains:**
| Domain | Destination | CI Job |
|--------|-------------|--------|
| Flights (non-booking) | `tests/features/flights/daily_flights/` | `daily-flights-tests` |
| Cars (non-booking) | `tests/features/cars/daily_cars/` | `daily-cars-tests` |
| Shell | `tests/features/shell/daily_shell/` | `daily-shell-tests` |
| Rails | `tests/features/rails/daily_rails/` | `daily-rails-tests` |

**Decision logic:**
- If the scenario includes steps like "When I complete the booking", "Then the booking should be confirmed", "When I cancel the trip" → it's a **booking** test → `hotels_booking/`
- If the scenario only searches, filters, verifies UI elements, adds to cart but does NOT complete a booking → it's a **daily** test → `daily_hotels/`

#### 5b: Add Users to CI Workflow (`test-suite.yml`)
After moving the file, check if the feature uses any test users that are NOT yet listed in the corresponding CI job's `env:` section in `.github/workflows/test-suite.yml`.

**CRITICAL: Never create duplicate users.** Before adding ANY user to `.env` or CI:
1. **Search `.env` for the email address first** — if the same email already exists under a different `USER_<LABEL>`, do NOT create a new env var. Instead, update the feature file to use the existing label.
   - Example: Feature says `"tree"` → would need `USER_TREE`. But `.env` already has `USER_CHRISTREE="tree@tree.com"` → change the feature to use `"christree"` instead.
2. **Only add truly new users** — users whose email does not appear anywhere in `.env` under any label.
3. **Never add aliases** — one email = one `USER_*` entry. No exceptions.

**Steps for CI workflow updates:**
1. **Extract users from the feature file**: Look for `Given I am logged in as {string}` steps. The user key maps to `USER_<LABEL>` env var (e.g., `"galileogaliei"` → `USER_GALILEOGALIEI`).
2. **Check `.env` for the email** — if the email already exists under a different label, update the feature file to use the existing label. Do NOT create a new env var.
3. **Check `test-suite.yml`**: Search the CI job's env section for each `USER_<LABEL>`. If not present, add it.
4. **Add missing users**: Insert `USER_<LABEL>: ${{ secrets.USER_<LABEL> }}` in the env block of the appropriate CI job, before `GENERAL_PASSWORD`.
5. **Only add to CI jobs whose folder contains the moved file** — e.g., if moved to `daily_hotels/`, add to `daily-hotels-tests`; if moved to `hotels_booking/`, no CI job exists yet so skip this step but note it in the report.

**Example:**
```yaml
# In daily-hotels-tests env section, add:
USER_GALILEOGALIEI: ${{ secrets.USER_GALILEOGALIEI }}
```

> **Note**: The user's email/password must also exist in `.env` for local runs (`USER_GALILEOGALIEI="galileogaliei@gdggalileo.com"`). If the `.env` entry was already added during implementation (Phase 2), no action needed here.

#### 5c: User Placement in `.env` — Group by Supplier
When adding a new user to `.env`, **place it near other users of the same supplier**:
- If the user name contains a recognizable supplier (e.g., `sabre`, `amadeus`, `galileo`, `ratehawk`, `expedia`, etc.) → add the `USER_*` entry next to other users of that supplier in `.env`
- If no supplier can be inferred from the user name → add to a general/shared section
- This keeps `.env` organized and makes it easy to find users per supplier

> **CI (`test-suite.yml`) is different** — there is no supplier grouping in CI. Just find the CI job that matches the folder the test was moved to, and add the `USER_*: ${{ secrets.USER_* }}` reference there.

### Phase 6: Repeat for Next File
If multiple files were selected:
- Move to the next feature file → return to Phase 2
- Track cumulative progress across all files

### Phase 7: Report
**Invoke**: `@test-reporter-pipeline` with complete state

Generate TODO resolution report:
```
═══════════════════════════════════════════════
  TODO RESOLVER PIPELINE REPORT
═══════════════════════════════════════════════
  Files Processed:    5
  Total TODOs Found:  18
  TODOs Resolved:     15
  TODOs Kept:          3 (future notes)

  Results per File:
  ├── 22074_general_oop_... ✅ PASSED → daily_hotels/ (3/3 TODOs)
  ├── 19201_sabre_share_... ✅ PASSED → daily_hotels/ (4/4 TODOs)
  ├── 29744_amadeus_...     ✅ PASSED → hotels_booking/ (4/4 TODOs)
  ├── 28676_general_oop_... ❌ NEEDS MANUAL (2/3 TODOs, 1 locator missing)
  └── 37302_ratehawk_...    ✅ PASSED → daily_hotels/ (2/2 TODOs)

  New Artifacts:
  ├── Step definitions:  8 new steps across 3 files
  ├── DSL methods:       5 new methods in 3 files
  ├── DSL files:         1 new (Approval.js)
  └── Page objects:      3 files modified (4 locators added)

  CI Updates:
  ├── Users added to daily-hotels-tests: USER_GALILEOGALIEI, USER_SHANI_NL
  └── Users skipped (no CI job): USER_TLGG (hotels_booking/)

  Fix Iterations:        7 total across all files
═══════════════════════════════════════════════
```

**CHECKPOINT**: Show report, ask to commit.

### Phase 8: Commit
```powershell
cd c:\DEV\AtriisAutomation
git add {all created/modified files}
git add .github/workflows/test-suite.yml  # if CI users were added
git commit -m "feat(todo-resolver): implement {N} TODOs across {M} feature files

- Steps created: {count}
- DSL methods: {count}
- Page objects modified: {count}
- CI users added: {list}
- All tests passing: {yes/no}"
```

## Batch Processing Strategy
When scanning many files (`--scan`):

1. **Group by domain** — process all flights together, then hotels, etc.
2. **Shared TODOs first** — if multiple files reference the same missing step/DSL, implement once
3. **Dedup across files** — "Create step 'booking should be sent for approval'" appears in multiple files → create once, resolve in all
4. **Batch size** — process 3-5 files per batch, checkpoint between batches
5. **Track dependencies** — if File A's TODO creates a DSL that File B also needs, process A first

## TODO Comment Patterns Recognized
The agent understands these TODO formats:

```gherkin
# Feature file TODOs
# TODO: Create step "When I share the hotel price offer by email" that calls DSL method shareHotelPriceOfferFromResults in HotelSearch.js
# TODO: Implement step to click the "Go back" button in the popup
# TODO: Create step "Then the out of policy indicator should be visible in room level results" that calls DSL method verifyOOPInRoomLevel
```

```javascript
// Source code TODOs
// TODO: Locator needs to be created
// TODO: Replace with data-testid - this selector is fragile
// TODO: Create DSL file Approval.js with methods: approveBooking, rejectBooking, verifyApprovalSent
// TODO: Add return date selection once a stable locator is available
// TODO: Move this to ResultsPage - this is specific to results page.
```

## Integration with Other Pipelines
- `@ado-pipeline` can hand off to `@todo-pipeline` if the generated test has TODOs
- `@regression-pipeline` can invoke `@todo-pipeline` for tests that fail due to undefined steps
- `@ci-monitor` can flag tests with TODOs as "incomplete" in the daily report
- `@batch-test-fixer` can delegate TODO resolution to this pipeline

## Rules
- **UNDERSTAND → SCAN → CREATE (in that order, always)** — for every TODO: (1) read and understand what it's asking for, (2) search `tests/steps/`, `src/dsl/`, and `src/pages/` for existing steps, methods, and locators that already do what the TODO requires or could be broadened to cover it, (3) only create new code if nothing existing can be reused. Never skip straight to creating.
- **Never duplicate** — if an existing step/method/locator already covers the TODO's intent, reuse it
- **If unsure about broadening an existing method, DON'T TOUCH IT** — create a new one instead. Breaking existing tests is worse than having a near-duplicate. We can consolidate later.
- **Always ask user to pick files/folders** — never process everything without confirmation
- **Bottom-up implementation** — scan for existing → locators → page objects → DSL → steps → feature cleanup
- **Attempt `data-testid` first** — if not found in Atriis.App, pick another selector strategy
- **Prioritize shared steps first** — create steps used by multiple files before file-specific ones
- **Remove TODO comments cleanly** — no replacement comment, no empty lines left behind
- **Never remove future-note TODOs** — only remove TODOs that you fully implemented
- **Move resolved files** from source folder to the correct domain subfolder (`daily_hotels/` for non-booking, `hotels_booking/` for booking flows, etc.) — see Phase 5a for decision logic
- **Add users to CI** — after moving, check `test-suite.yml` for missing `USER_*` env vars and add them to the appropriate CI job — see Phase 5b. CI placement is purely by job/folder, not by supplier.
- **Group users by supplier in `.env`** — when adding a new user to `.env`, place it near other users of the same supplier (e.g., sabre users next to sabre users). If no supplier can be inferred, add to a general section — see Phase 5c
- **One file at a time** — complete one feature before moving to the next
- **Respect layer boundaries** — page objects don't get business logic, steps don't get Playwright
- **Source selectors from Atriis.App** — always check the Vue source for real selectors
- **Centralize selectors at the top of page files** — every CSS/XPath/text selector used in a Page Object method MUST be declared in the `SELECTORS` constant at the top of the file, using `UPPER_SNAKE_CASE`. Never inline selector strings like `this.page.locator('.some-class')` inside methods — always reference `SELECTORS.SOME_NAME` instead. This keeps selectors easy to find, update, and reuse.
- **5 fix iterations max** — per file, not per batch
- **No search results = STOP** — if a test fails because a product search (hotels, flights, cars, rails) returned zero results, do NOT attempt to fix it. Search results depend on supplier availability, test data, and environment — no code change can solve this. Mark the file as "blocked: no search results" and move on. We need results in order to proceed with creating or validating steps.

### Hotels — Critical Cost Rules
- **NEVER book non-refundable hotels** — non-refundable bookings cost real money to the company. When implementing hotel booking steps, ALWAYS ensure the scenario filters by refundable rooms first. If a TODO creates a hotel booking flow without a refundable filter step, add one.
- **ALWAYS filter by refundable at room level** — before selecting any room, the scenario MUST include a step that filters results to show only refundable rooms. This is the first safeguard.
- **ALWAYS verify refundable status in cart before booking** — after adding a room to the cart and before proceeding to checkout/booking, the scenario MUST include a step that validates the hotel in the cart is marked as refundable. This is the second safeguard. If either safeguard is missing, add it.
- **ALWAYS cancel hotel booking trips** — every hotel test that completes a booking MUST include a cancellation step at the end. If the feature file doesn't have a cancellation step after booking, add one. Uncancelled bookings are charged to the company.
- If you are generating or implementing hotel steps and the scenario books a hotel without these safeguards, **stop and flag it** to the user before proceeding.
