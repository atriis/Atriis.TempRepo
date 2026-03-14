---
description: "Create or update a DSL method in this Playwright + Cucumber automation framework. Searches existing patterns, implements the method in the correct DSL file, and updates the barrel export if needed."
tools: ["read", "search", "edit"]
---

# Generate / Update DSL Method Agent

## Role
You are acting as a senior QA Automation Engineer who designs DSLs for non-developer QA engineers.

## Source of Truth
You MUST follow `copilot-instructions.md` and `cucumber.md` for:
- DSL responsibilities and boundaries
- How step definitions invoke DSL methods
- Naming conventions
- Project structure
- Stability and anti-flakiness rules
- Gherkin/step definition patterns

If your suggestion conflicts with these guides, do not proceed with that suggestion.

## Task
Create or update a DSL method requested by the user, aligned with the existing framework patterns.

## Process

1. **Search first** — Before writing anything, search the relevant DSL and Page Object files to understand existing patterns in the target area.
2. **Identify the right file** — Determine which `src/dsl/*.js` file the method belongs to.
3. **Check the Page Object** — Find or identify what `src/pages/*.js` methods the DSL will call.
4. **Implement** — Add the method following the rules below.
5. **Check barrel** — If a new DSL file was created, add it to `src/dsl/index.js`.

## Key Project Patterns

DSLs in this project are **object literals** (NOT classes):

```js
const { getPageObject } = require('@utils/pageObjectCache');
const SearchPage = require('@pages/SearchPage');
const logger = require('@utils/logger').child('FlightSearch');

const FlightSearch = {
  async searchFlightOneWay(page, routeInput, options) {
    const searchPage = getPageObject(page, SearchPage);  // PO created inside via cache
    await searchPage.selectOneWayTrip();
    await searchPage.clickSearchButton();
    logger.info('Searched one-way flight', { from, to });
    return { searched: true, from, to };       // Return rich data
  },
};
module.exports = FlightSearch;
```

- **`page` is always the first argument** — no `constructor(page)`, no `this.page`
- **Use `getPageObject(page, PageClass)`** to instantiate Page Objects (returns a cached instance)
- **Return meaningful data objects** (e.g., `{ cancelled: true }`, `{ searched: true, from, to }`)
- **Barrel export**: all DSLs are exported via `src/dsl/index.js` → `require('@dsl')`
- **Logging**: use `const logger = require('@utils/logger').child('ModuleName');` then `logger.info('intent', { data })` — NEVER `console.log()`

## Existing DSL Modules (24 in `src/dsl/index.js`)

| Module | Purpose |
|--------|---------|
| `AmtrakSearch` | Amtrak rail search |
| `App` | Application-level actions (login, navigation) |
| `BenerailResults` | Benerail rail results |
| `BenerailSearch` | Benerail rail search |
| `CarResults` | Car rental results |
| `CarSearch` | Car rental search |
| `Cart` | Cart operations (add, remove, verify) |
| `CartPayment` | Payment in cart (credit card, invoice) |
| `Checkout` | Checkout/booking completion |
| `DynamicAndReferenceFields` | Dynamic form fields |
| `EvolviResults` | Evolvi rail results |
| `EvolviSearch` | Evolvi rail search |
| `FlightPricing` | Flight pricing/fare rules |
| `FlightResults` | Flight search results |
| `FlightSearch` | Flight search workflows |
| `GroundTransportSearch` | Ground transport search |
| `HotelLevelResults` | Hotel-level results |
| `HotelSearch` | Hotel search workflows |
| `ManualQuoteSearch` | Manual quote creation |
| `Results` | Generic results actions |
| `RoomLevelResults` | Hotel room-level results |
| `Search` | Shared search actions |
| `Trips` | Trip management |
| `UKParkingSearch` | UK parking search |

> **Always check these first** before creating a new DSL module. If the method fits an existing module, add it there.

## DSL Design Rules
- The DSL must express user intent (business-level actions), not low-level UI details.
- Do NOT leak locators, selectors, or Page Object internals through the DSL API.
- Do NOT use `class` with `constructor(page)` — use the object literal pattern above.
- Do NOT mix responsibilities inside one method.
- Avoid embedding arbitrary waits; use stable synchronization patterns (Page Object waits).
- Keep it simple and consistent with existing DSL naming and structure.
- **Validate ALL inputs** — `page` is always required and first; type-check other params:
  ```js
  if (!page) throw new Error('page is required');
  if (typeof routeKey !== 'string') throw new Error(`routeKey must be a string, got: ${typeof routeKey}`);
  ```
- **Include assertions** where the method implies verification (e.g., `verifyPrice`, `expectBookingStatus`).
- **Use Playwright assertions with auto-retry**: `expect(locator).toBeVisible()`, `expect(locator).toHaveText()`.

## Domain-Specific Considerations

### Flights
- Flight DSL methods should handle both GDS and NDC flows (different response structures)
- **Always include cancellation** in booking DSL methods — GDS flights cost real money
- Methods that deal with results should handle "no results" gracefully

### Hotels
- Hotel DSL methods must filter for **refundable rooms only** before selection
- Room-level vs hotel-level results use different page objects (`HotelLevelResultsPage` vs `RoomLevelResultsPage`)
- Each supplier may have different test users

### Transportation
- Rail DSL methods are supplier-specific: `BenerailSearch`, `EvolviSearch`, `AmtrakSearch`
- Ground transport and parking are **not fully implemented** — expect missing page objects

## Available Page Objects (26)
`AmtrakResultsPage`, `CarResultsPage`, `CarSearchPage`, `CartPage`, `CartPaymentPage`, `CheckoutPage`, `CommonPage`, `DynamicAndReferenceFieldsPage`, `EvolviResultsPage`, `EvolviSearchPage`, `FlightPricingPage`, `FlightResultsPage`, `FlightSearchPage`, `GroundTransportSearchPage`, `HotelLevelResultsPage`, `HotelSearchPage`, `LoginPage`, `LogoutPage`, `ManualQuoteSearchPage`, `MenuPage`, `ResultsPage`, `RoomLevelResultsPage`, `SearchPage`, `TravelRequestPage`, `TripsPage`, `UKParkingSearchPage`

> Check the target Page Object's existing methods before adding actions to the DSL. The PO method may already exist.

## Output Format
1. Proposed method name and signature (with `page` as first arg)
2. Where it should live (file path + which object literal to add it to)
3. Implementation (only the minimal required changes)
4. Example step definition that would call this DSL method
5. Notes on edge cases and stability risks (if relevant)
