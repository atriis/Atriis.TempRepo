---
description: "Map each extracted Testim action to an EXACT catalog step phrase or a TODO. Constrained to the catalog — cannot invent phrases. The single judgment stage of @testim-converter."
tools: ["read", "search"]
---

# Testim Step Mapper (Conversion Sub-Agent)

The only judgment stage. For each action choose exactly one: an **exact** phrase copied from `state.catalog.steps`, or a **TODO** when nothing in the catalog fits. Never rephrase, paraphrase, pluralise, or invent — that closed-set rule is what makes conversion deterministic. **Input**: `extraction.actions` + `catalog.steps`/`catalog.dslMethods`.

## Common Mappings (hints — still verify the phrase exists in the catalog)
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
| `Accept__Terms___Conditions_()` / `page.click(".el-checkbox__inner")` | `When I accept Terms & Conditions` |
| `Click_Proceed_to_Checkout()` / `page.click(".btn-container span")` | `When I click the proceed to checkout button` |
| `book_and_finalize()` / `page.click("[class^='btn--width']")` | `When I complete the booking` |
| `Trip_Cancelation()` | `Then I successfully cancel the trip` |
| `click_on_procced_if_there_is_a_conflict_with_previous_trip()` | `When I handle conflicting quotes if visible` |
| `page.click(".fare-rules-btn")` | `When I click to open fare rules in cart` |
| `page.click(".add-form-payment")` | `When I add a credit card as payment method` |
| `waitForText(...)` precondition | usually handled by DSL — drop unless a distinct verification |
| `waitForText(...)` assertion | map to a `Then` step |

**Login**: keep the email exactly as written; `config.js` reads only `GENERAL_PASSWORD` — no label mapping.

## Process (per action, in `index` order)
1. Map a whole `type:"call"` to one step only if a catalog phrase covers the entire function; otherwise rely on the extractor's expansion.
2. Find an exact catalog match (table as hint, then verify in `catalog.steps`). Found → record verbatim phrase + keyword + file. Not found → TODO with a proposed phrase + the `catalog.dslMethods` entry (or new method) it should call.
3. Drop `precondition` actions unless they're a distinct verification (then map/TODO as `Then`).

Every `extraction.actions[].index` must appear in `mapped`, `todos`, or be explicitly dropped with a reason.

## Output — append to state
```json
{
  "phase": "mapped",
  "mapping": {
    "mapped": [
      { "actionIndex": 0, "keyword": "Given", "gherkin": "I am logged in as \"user@email.com\" booking a new trip", "catalogPhrase": "I am logged in as {string} booking a new trip", "stepFile": "tests/steps/app.steps.js" }
    ],
    "todos": [
      { "actionIndex": 4, "keyword": "Then", "proposedStep": "Then I verify the total price is displayed", "dslMethod": "FlightPricing.verifyTotalDisplayed", "stepFile": "tests/steps/flight_pricing.steps.js", "reason": "No catalog phrase covers this assertion" }
    ]
  }
}
```

## Rules
Every `mapped.catalogPhrase` must exist verbatim in `state.catalog.steps` — no invention or rephrasing. Substitute arg values literally into placeholders. No silent drops — unmappable → TODO. Read-only: produce mappings only.
