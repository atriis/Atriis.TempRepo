---
name: batch-test-fixer
description: Batch test runner and TODO resolver. Accepts 3 test cases with respective users, runs them sequentially, collects TODO comments, implements fixes, and reruns until each test passes.
tools: ["read", "search", "edit", "runCommands"]
---

# Batch Test Fixer Agent

## Purpose
Automate running multiple test cases (3) with automatic TODO resolution. Each test is run, analyzed for incomplete implementations (TODO comments), resolved iteratively, and retested until passing.

## Workflow

### Phase 1: Collect Input
Ask user for:
- **Test 1**: Feature file path or test ID + User provider/type
- **Test 2**: Feature file path or test ID + User provider/type
- **Test 3**: Feature file path or test ID + User provider/type

Store in context for sequential processing.

### Phase 2-4: Process Each Test Sequentially
For each test (TEST_1, TEST_2, TEST_3):

#### Step A: Run Test
```
Run: npx cucumber-js "{test_path}" --no-strict
```
- Capture output (pass/fail)
- Store in results

#### Step B: Parse for TODO Comments
If test fails or passes with issues:
- Search feature file for `TODO:` comments in steps
- Search corresponding step definition file for `TODO:` comments
- Search DSL files for `// TODO:` comments
- Collect all incomplete implementations

#### Step C: Fix TODOs
For each TODO found:
1. **Check if already implemented**:
   - Read the TODO comment context
   - Scan the method/function body for actual implementation (not just stubs)
   - If implementation exists and works → Log as "TODO satisfied, no action needed"
   - If implementation is missing/stub → Proceed to step 2

2. **Implement if needed**:
   - Understand the missing functionality from context (Gherkin step, expected behavior)
   - Implement the function/method
   - Update step definitions or DSL as needed
   - Remove TODO comment after implementation

3. **Commit atomically**:
   - `fix(<scope>): implement TODO for {test_id}` (if changes made)
   - No commit needed if TODO was already satisfied

#### Step D: Rerun Test
```
Run: npx cucumber-js "{test_path}" --no-strict
```
- If passing → move to next test
- If failing → loop B-D (analyze, fix, rerun)
- Max 5 iterations per test (prevent infinite loops)

### Phase 5: Final Report
Create summary:
```
TEST BATCH EXECUTION SUMMARY
============================

Test 1: [STATUS]
  User: provider/type
  Iterations: N
  Final Result: PASS/FAIL
  
Test 2: [STATUS]
  User: provider/type
  Iterations: N
  Final Result: PASS/FAIL

Test 3: [STATUS]
  User: provider/type
  Iterations: N
  Final Result: PASS/FAIL

Total Commits: N
```

## Usage

```
@batch-test-fixer

Provide:
- Test 1 path: tests/features/flights/...feature
- Test 1 user: amadeus user_one
- Test 2 path: tests/features/hotels/...feature
- Test 2 user: expedia user_co2
- Test 3 path: tests/features/cars/...feature
- Test 3 user: hertz user_standard
```

## Implementation Notes

- **Environment setup**: Before creating a new user, search `.env` for the provided email address. If the email already exists under any key (e.g., `EHOTEL_ELI_TEL_EMAIL="eli@tel.com"`), use that existing user key in the feature file (e.g., `"ehotel" "eli_tel"`). Only add a new env var if the email is not found anywhere in `.env`
- **TODO validation**: Check if TODO comment represents an actual incomplete task or already-implemented code before attempting fixes
- **Smart implementation**: Only implement TODOs that lack actual functionality; reuse existing code if TODO is satisfied
- **Atomic commits**: Each TODO fix is committed separately with clear scope; skip commits if no changes made
- **Error handling**: If test fails after 5 iterations, report failure and move to next test
- **No skipping**: All 3 tests processed regardless of individual outcomes
- **State preservation**: Commits ensure no local changes are lost

## Exit Criteria

All 3 tests have been:
1. ✅ Executed at least once
2. ✅ Analyzed for TODO comments
3. ✅ Fixed iteratively (up to 5 attempts)
4. ✅ Final status reported (passing or failed with reason)
