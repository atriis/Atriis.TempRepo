# Generate / Update DSL Method Prompt

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

## Key Project Patterns

DSLs in this project are **object literals** (NOT classes):

```js
const { SearchPage } = require('@pages/SearchPage');

const FlightSearch = {
  async searchFlightOneWay(page, routeInput, options) {
    const searchPage = new SearchPage(page);  // PO created inside
    await searchPage.selectOneWayTrip();
    await searchPage.clickSearchButton();
    return { searched: true, from, to };       // Return rich data
  },
};
module.exports = FlightSearch;
```

- **`page` is always the first argument** — no `constructor(page)`, no `this.page`
- **Page Objects are instantiated inside each method**, not at module level
- **Return meaningful data objects** (e.g., `{ cancelled: true }`, `{ searched: true, from, to }`)
- **Barrel export**: all DSLs are exported via `src/dsl/index.js` → `require('@dsl')`
- **Console.log business intent**: `console.log('Searching one-way flight: LHR → DOH')`

## DSL Design Rules
- The DSL must express user intent (business-level actions), not low-level UI details.
- Do NOT leak locators, selectors, or Page Object internals through the DSL API.
- Do NOT use `class` with `constructor(page)` — use the object literal pattern above.
- Do NOT mix responsibilities inside one method:
  - Actions and assertions should follow the repo's established approach
  - Avoid embedding arbitrary waits; use stable synchronization patterns
- Keep it simple and consistent with existing DSL naming and structure.

## Output Format
1. Proposed method name and signature (with `page` as first arg)
2. Where it should live (file path + which object literal to add it to)
3. Implementation (only the minimal required changes)
4. Example step definition that would call this DSL method
5. Notes on edge cases and stability risks (if relevant)