---
name: batch-test-fixer
description: Batch test runner and TODO resolver. Accepts 3 test cases with respective users, runs them sequentially, collects TODO comments, implements fixes, and reruns until each test passes.
tools:
  - runSubagent
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
- Understand the missing implementation from context (Gherkin step, expected behavior)
- Implement the function/method
- Update step definitions or DSL as needed
- Commit atomically: `fix(<scope>): implement TODO for {test_id}`

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

- **Atomic commits**: Each TODO fix is committed separately with clear scope
- **Error handling**: If test fails after 5 iterations, report failure and move to next test
- **No skipping**: All 3 tests processed regardless of individual outcomes
- **State preservation**: Commits ensure no local changes are lost

## Exit Criteria

All 3 tests have been:
1. ✅ Executed at least once
2. ✅ Analyzed for TODO comments
3. ✅ Fixed iteratively (up to 5 attempts)
4. ✅ Final status reported (passing or failed with reason)
