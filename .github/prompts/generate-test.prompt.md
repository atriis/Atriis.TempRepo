# Generate Test Prompt

## Role
You are acting as a senior QA Automation Engineer specialized in Playwright + JavaScript.

## Source of Truth
You MUST follow `copilot-instructions.md` for:
- project structure
- naming conventions
- existing patterns for tests, DSL, Page Objects, fixtures
- stability and anti-flakiness rules

If your suggestion conflicts with `copilot-instructions.md`, do not proceed with that suggestion.

## Task
Generate a new automated test based on the user’s scenario, using the repository’s existing patterns.

## Requirements
- Prefer reusing existing DSL and Page Object methods.
- If a required DSL method does not exist, do NOT implement it inside the test:
  - Propose the smallest new DSL method signature needed
  - Indicate where it should live
  - Keep it aligned with existing patterns
- Avoid flaky patterns:
  - Do not use hard-coded sleeps unless the repo pattern explicitly requires it
  - Prefer Playwright-native waits/expectations and stable synchronization
- Make the test readable for non-developer QA engineers:
  - Clear step structure (using the repo’s established style)
  - Descriptive test name and tags if the repo uses them
  - Assertions that validate outcomes (not implementation details)

## Output Format
1. Files to create/modify (paths)
2. Test code
3. If needed: proposed DSL method signature(s) (no implementation unless requested)
4. Notes on assumptions and risks (only if necessary)