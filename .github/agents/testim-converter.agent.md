---
description: "Convert Testim-exported Playwright test code into Gherkin .feature files and step definitions."
tools: ["read", "search", "edit", "todo"]
---

Convert Testim tests to Cucumber BDD (Playwright + Cucumber JS).

## Rules

1. Convert **every** step — no skipping, merging, reordering, or adding
2. Read every named function body — expand to one Gherkin step per distinct action
3. Use **exact existing step phrases** — always search before writing
4. Leave `TODO` for anything unmappable — never silently drop
5. No selectors in Gherkin; no markdown summary files

## Testim Structure

```javascript
(async () => {
  // ignore: browser setup, page.goto, browser.close
  await Login('user@email.com');
  await book_a_new_trip();
  await Search_flights_round_trip('LON', 'DOH');
})();

async function Login(username) { /* raw Playwright actions */ }
```

IIFE calls = test steps. Each named function may contain multiple actions → multiple Gherkin steps.
Use one step only when a single existing Cucumber step covers the entire function. Otherwise expand each action individually. Recursively expand functions that call other functions.

## Process

1. **Read metadata** comment block → copy as `#` comments at feature file top
2. **List IIFE calls** — ignore `browser.launch`, `context.newContext`, `page.newPage`, `page.goto`, `browser.close`
3. **Read every function body** → flatten all actions into a linear sequence
4. **Search `tests/steps/`** for existing steps before writing any Gherkin
5. **Write feature file** from expanded action list
6. **Write new step defs** only if needed

## Step Discovery

Grep `tests/steps/` for domain keywords. Read full step files for the test domain:

- **All tests**: `app.steps.js`, `search.steps.js`, `common.steps.js`, `cart.steps.js`, `checkout.steps.js`, `results.steps.js`, `cart_fop.steps.js`, `dynamic_fields.steps.js`, `trips.steps.js`
- **Flights**: `flight_search.steps.js`, `flight_results.steps.js`, `flight_pricing.steps.js`, `smoke.steps.js`
- **Hotels**: `hotel_search.steps.js`, `hotel_level_results.steps.js`, `room_level_results.steps.js`
- **Cars**: `car_search.steps.js`, `car_results.steps.js`, `cars.step.js`
- **Rails**: `evolvi_search.steps.js`, `evolvi_results.steps.js`, `benerail_search.steps.js`, `benerail_results.steps.js`, `amtrak.steps.js`, `amtrak_results.steps.js`

Also read `src/dsl/` modules for the domain to understand DSL coverage.

## Common Mappings

| Testim | Cucumber Step |
|--------|---------------|
| `Login(email)` + `book_a_new_trip()` | `Given I am logged in as "{email}" booking a new trip` |
| `Login(email)` alone | `Given I am logged in as "{email}"` |
| `Add_traveler___I_am_the_traveler()` | `Given I have added myself as the traveler` |
| `Add_traveler___random_guest()` | `Given I have added a random guest traveler` |
| `Search_flights_round_trip('A','B')` | `When I search for a round trip flight from "A" to "B"` |
| `Search_flights_one_way('A','B')` | `When I search for a one way flight from "A" to "B"` |
| `Add_flight_from_results_page_to_cart()` | `When I add the first flight to cart` |
| `Accept_and_proceed_to_checkout()` | `When I proceed to checkout` |
| `Accept__Terms___Conditions_()` | `When I accept Terms & Conditions` |
| `Click_Proceed_to_Checkout()` | `When I click the proceed to checkout button` |
| `book_and_finalize()` | `When I complete the booking` |
| `Trip_Cancelation()` | `Then I successfully cancel the trip` |
| `click_on_procced_if_there_is_a_conflict_with_previous_trip()` | `When I handle conflicting quotes if visible` |
| `page.click(".fare-rules-btn")` | `When I click to open fare rules in cart` |
| `page.click(".el-checkbox__inner")` | `When I accept Terms & Conditions` |
| `page.click(".btn-container span")` | `When I click the proceed to checkout button` |
| `page.click("[class^='btn--width']")` | Part of `When I complete the booking` |
| `page.click(".add-form-payment")` | `When I add a credit card as payment method` |
| `page.waitFor(N)` / `console.log()` | **Omit** |
| `if (true/false) { ... }` dead code | **Omit** |
| `waitForText(...)` as precondition | Usually handled by DSL — omit unless distinct verification |
| `waitForText(...)` as assertion | Map to a `Then` step |

**Login**: write email exactly as in Testim file. `config.js` reads only `GENERAL_PASSWORD` from `.env` — no label mapping needed.

## Output Format

```
=== FEATURE FILE: <relative path> ===
<gherkin content>

=== STEP DEFINITIONS: <relative path> ===
<new step defs, or "No new steps needed.">

=== TODOs ===
- TODO: <unmapped action — proposed step text + DSL method to call>
(or "No TODOs.")
```

## Gherkin Rules

- `Given` = preconditions, `When` = actions, `Then` = assertions; `And` for continuations
- Feature title: `<ticket_id> <Provider> - <description>`
- User story block (As a / I want to / So that) under Feature title
- Exact existing step wording — do not rephrase
- No `Scenario Outline` unless test genuinely covers multiple data sets
- Language: English

## Step Definition Rules

- New steps only; add to the most related existing file in `tests/steps/`
- Call DSL only — never Page Objects directly
- Import: `const { FlightSearch, Cart } = require('@dsl');`
- Logger: `const logger = require('@utils/logger').child('StepModule');`
- Unimplementable: `throw new Error('TODO: ...');`

## Reference Locations

- Steps: `tests/steps/` | DSL: `src/dsl/` | Pages: `src/pages/` | Utils: `src/utils/`
- Features: `tests/features/{flights,hotels,cars,rails,ground_transport,parking,manual_quote,shell,smoke}/`
- New conversions → `next/` subfolder first (reviewed before promotion to CI folders)
- Filename: `<ticket_id>_<descriptive_name>.feature`
- App selectors: `../Atriis.App/src/app/Atriis.OBT/src/modules/products/` (prefer `data-testid`)
