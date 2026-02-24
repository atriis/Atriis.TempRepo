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

const FlightSearch = {
  async searchFlightOneWay(page, routeInput, options) {
    const searchPage = getPageObject(page, SearchPage);  // PO created inside via cache
    await searchPage.selectOneWayTrip();
    await searchPage.clickSearchButton();
    return { searched: true, from, to };       // Return rich data
  },
};
module.exports = FlightSearch;
```

- **`page` is always the first argument** — no `constructor(page)`, no `this.page`
- **Use `getPageObject(page, PageClass)`** to instantiate Page Objects (uses cache)
- **Return meaningful data objects** (e.g., `{ cancelled: true }`, `{ searched: true, from, to }`)
- **Barrel export**: all DSLs are exported via `src/dsl/index.js` → `require('@dsl')`
- **Logging**: use `logger.info('intent', { data })`, not `console.log()`

## DSL Design Rules
- The DSL must express user intent (business-level actions), not low-level UI details.
- Do NOT leak locators, selectors, or Page Object internals through the DSL API.
- Do NOT use `class` with `constructor(page)` — use the object literal pattern above.
- Do NOT mix responsibilities inside one method.
- Avoid embedding arbitrary waits; use stable synchronization patterns.
- Keep it simple and consistent with existing DSL naming and structure.

## Output Format
1. Proposed method name and signature (with `page` as first arg)
2. Where it should live (file path + which object literal to add it to)
3. Implementation (only the minimal required changes)
4. Example step definition that would call this DSL method
5. Notes on edge cases and stability risks (if relevant)
