# Generate Test Prompt

## Role
You are acting as a senior QA Automation Engineer specialized in Cucumber BDD + Playwright.

## Source of Truth
You MUST follow these guides (in order of priority):
1. `cucumber.md` — Cucumber execution, hooks, step definitions, tags, world setup
2. `copilot-instructions.md` — Overall architecture and AI rules
3. `tests.md` — Gherkin scenario writing guidelines

If your suggestion conflicts with these guides, do not proceed with that suggestion.

## Task
Generate a new automated test (Gherkin feature file + step definitions) based on the user's scenario, using the repository's existing patterns.

## Key Project Patterns

**Tests use Cucumber Gherkin + Step Definitions:**

**Feature File** (`tests/features/flights/general/one_way_search.feature`):
```gherkin
@regression @flights @priority:critical
Feature: Add Flight to Cart
  As a travel booker
  I want to search for flights and add them to cart
  So that I can complete my booking

  Background:
    Given I am logged in as "amadeus" "user_one" booking a new trip

  Scenario: Add one-way flight to cart
    And I have added myself as the traveler
    When I search for a one way flight from "lhrToDoh"
    And I select the first available flight
    Then the flight should be added to my cart
```

**Step Definition** (`tests/steps/flight_search.steps.js`):
```js
const { Given, When, Then } = require('@cucumber/cucumber');
const { Search, FlightSearch } = require('@dsl');
const logger = require('@utils/logger').child('FlightSearch');

When('I search for a one way flight from {string}', async function (routeKey) {
  logger.info('Searching for one-way flight', { routeKey });
  await FlightSearch.searchFlightOneWay(this.page, routeKey);
});
```

- **Feature file**: `tests/features/PRODUCT/TYPE/scenario_name.feature`
- **Step definitions**: `tests/steps/DOMAIN.steps.js` (grouped by feature, not step type)
- **Tags**: `@regression`, `@priority:critical`, `@provider:amadeus`, `@slow` (above Feature/Scenario)
- **World (`this`)**: Provides `this.page`, `this.browser`, `this.context` (set by Before hook)
- **DSL calls**: Static with `page` as first arg: `FlightSearch.searchFlightOneWay(this.page, ...)`
- **Logging**: Use `logger.info('intention', { data })` not `console.log()`
- **Parameters**: Use `{string}`, `{int}`, `{float}` for variables
- **Running**: `npx cucumber-js --tags "@regression"`

## Requirements
- **Gherkin must read like a user story** — domain language, not technical steps
- Prefer reusing existing DSL and Page Object methods.
- If a required DSL method does not exist, do NOT implement it inside the step:
  - Propose the smallest new DSL method signature needed
  - Indicate where it should live (`src/dsl/FileName.js`)
  - Keep it aligned with existing patterns
- Avoid flaky patterns:
  - Do not use hard-coded sleeps unless the repo pattern explicitly requires it
  - Prefer Playwright-native waits/expectations and stable synchronization
- Make the scenario readable for non-developer QA engineers:
  - Clear Gherkin keywords: Given (setup), When (action), Then (outcome)
  - Descriptive scenario names and proper tags
  - Step parameters {string}, {int} instead of hardcoded values
  - Assertions that validate business outcomes (not UI details)
- Do NOT put business logic in step definitions:
  - Step definitions extract parameters and call DSL
  - DSL performs the workflow and validates results

## Output Format
1. Files to create/modify (paths)
   - Feature file path: `tests/features/DOMAIN/TYPE/scenario_name.feature`
   - Step definition file path: `tests/steps/domain.steps.js`
2. **Feature file** (Gherkin scenarios with proper tags)
3. **Step definitions** (Given/When/Then functions that call DSL)
4. If needed: proposed DSL method signature(s) (no implementation unless requested)
5. Notes on assumptions and risks (only if necessary)