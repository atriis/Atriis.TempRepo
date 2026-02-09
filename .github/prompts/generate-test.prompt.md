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
Generate a new automated test based on the user's scenario, using the repository's existing patterns.

## Key Project Patterns

Tests use **custom fixtures** (NOT `@playwright/test`):

```js
const { test } = require('@fixtures/supplierTest');
const { Search, FlightSearch, FlightResults, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Add Flight to Cart Flows', () => {
  test('[@priority:critical] Add One-Way Flight to Cart', async ({ newTripPageFor }) => {
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('amadeus', 'user_one');

    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    console.log('Step 3: Search for a one-way flight');
    await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');
  });
});
```

- **`require('@fixtures/supplierTest')`** for `test` — NEVER `@playwright/test`
- **`newTripPageFor(provider, userKey)`** — handles login + trip navigation (most common)
- **`newTripPage`** — cross-supplier, uses project config
- **`require('@dsl')`** barrel import for all DSL access
- **No `page.goto()`** — fixtures handle navigation
- **Console.log** each step for progress tracking
- **Tags**: `[@regression]`, `[@priority:critical]` in describe/test names
- **DSL calls are static** with `page` as first arg: `FlightSearch.searchFlightOneWay(page, ...)`

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