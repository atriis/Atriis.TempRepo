---
applyTo: src/, tests/
description: Layer responsibilities, data flow, dependency rules, and structural organization patterns.
---

# Architecture Guidelines

## Overview – Cucumber BDD Layers

```
┌─────────────────────────────────────────────────────┐
│     Gherkin Feature Files (tests/features/)        │  ← User stories
│     (Human-readable scenarios)                      │
├─────────────────────────────────────────────────────┤
│     Step Definitions (tests/steps/)                │  ← Parameter extraction
│     (Connect Gherkin to DSL)                        │
├─────────────────────────────────────────────────────┤
│     DSL (Domain-Specific Language) (src/dsl/)      │  ← Business workflows
├─────────────────────────────────────────────────────┤
│     Page Objects (src/pages/)                       │  ← UI selectors & actions
├─────────────────────────────────────────────────────┤
│     Helpers / Utilities / Data (src/utils/, etc.)  │  ← Shared code
├─────────────────────────────────────────────────────┤
│     Playwright Browser Automation                  │  ← Browser control
└─────────────────────────────────────────────────────┘
```

## Layer Responsibilities

| Layer | Location | Responsibility | Calls Only |
|-------|----------|----------------|-----------|
| **Gherkin Features** | `tests/features/` | Scenarios in human-readable BDD language | Step definitions (implicit) |
| **Step Definitions** | `tests/steps/` | Extract parameters, invoke DSL methods | DSL methods |
| **DSL** | `src/dsl/` | Business workflows, assertions | Page Objects, Helpers |
| **Page Objects** | `src/pages/` | UI selectors, atomic Playwright actions | Playwright APIs, Helpers |
| **Helpers** | `src/utils/` | Utility functions, data generation | Minimal (Playwright, external libs) |

## Data Flow (Strict One-Way)

```
Feature File
    ↓ (Gherkin step "When I search...")
Step Definition
    ↓ (calls DSL method)
DSL Method
    ↓ (composes Page Object calls)
Page Object
    ↓ (uses Playwright APIs)
Playwright Browser
```

### Forbidden Data Flow

```
❌ Feature File → Page Object (skip layers)
❌ Feature File → Playwright APIs (skip layers)
❌ DSL → Playwright APIs (skip Page Objects)
❌ Page Objects → DSL (circular/backwards)
❌ Tests/Steps → Page Objects (must use DSL)
```

## DSL Pattern: Object Literals

DSLs use **object literal modules** (not classes). `page` is the first argument:

```js
// ✅ ACTUAL pattern
const { SearchPage } = require('@pages/SearchPage');
const { getPageObject } = require('@utils/pageObjectCache');

const FlightSearch = {
  async searchFlightOneWay(page, routeInput, options) {
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.selectOneWayTrip();
    await searchPage.clickSearchButton();
  },
};
module.exports = FlightSearch;
```

Always instantiate Page Objects from DSLs through `getPageObject(page, PageClass)` so the project-wide page-object cache is used.

## Step Definition Pattern: Cucumber

Step definitions connect Gherkin to DSL:

```javascript
// tests/steps/flight_search.steps.js
const { When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { FlightSearch, FlightResults } = require('@dsl');

// Step definitions call DSL methods
When('I search for a one-way flight from {string} to {string}',
  async function (origin, destination) {
    // Call DSL method with this.page from the Cucumber World
    await FlightSearch.searchFlightOneWay(this.page, origin, destination);
  }
);

Then('flight results are displayed', async function () {
  expect(
    await FlightResults.areResultsVisible(this.page)
  ).toBe(true);
});
```

Use regular `function` handlers in step definitions when the step needs access to the Cucumber World. The active page lives on `this.page`, not `global.page`.

## Page Object Pattern: SELECTORS + Class

```js
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  TRIP_TYPE: '.search-for-select .el-radio',
};

class FlightSearchPage {
  constructor(page) { this.page = page; }
  async clickFlightTab() {
    await this.page.click(SELECTORS.FLIGHT_TAB);
  }
}

module.exports = FlightSearchPage;
// Some files export: module.exports = { CartPage, SELECTORS };
```

## Path Aliases

Configured in `jsconfig.json`:

```js
require('@dsl')           // → src/dsl/index.js (barrel export)
require('@pages/...')     // → src/pages/
require('@data/...')      // → src/data/
require('@utils/...')     // → src/utils/
require('@config/...')    // → src/config/
```
## Project Structure

```
src/
├── pages/              # Page Objects (SELECTORS const + class)
│   ├── SearchPage.js
│   ├── FlightSearchPage.js
│   ├── CartPage.js
│   ├── CommonPage.js
│   └── GeneralElementsPage.js
├── dsl/                # Business workflows (object literals)
│   ├── index.js        # Barrel export (exports all DSLs)
│   ├── FlightSearch.js
│   ├── Cart.js
│   └── Search.js
├── utils/              # Helpers & utilities
│   ├── browserFactory.js
│   ├── calendar.helper.js
│   ├── route.helper.js
│   ├── wait.js
│   ├── dom.js
│   └── data/
│       ├── generateRandomGuestData.js
│       └── generateRandomFlightRoute.js
├── data/               # Static test data (JSON)
│   ├── flights.json
│   ├── tripStatus.json
│   └── cards.json
└── config/
    └── config.js       # Centralized configuration

tests/
├── features/           # Cucumber Gherkin scenarios (.feature)
│   ├── smoke/          # Smoke tests (critical path)
│   ├── flights/
│   │   ├── general/    # Supplier-agnostic tests
│   │   ├── daily_flights/
│   │   └── lufthansa/  # Supplier-specific
│   ├── hotels/
│   ├── cars/
│   └── ...
├── steps/              # Step definitions (Cucumber glue code)
│   ├── app.steps.js
│   ├── flight_search.steps.js
│   ├── flight_results.steps.js
│   ├── cart.steps.js
│   └── ...
└── support/
    ├── hooks.js        # Cucumber Before/After lifecycle
    └── world.js        # Custom World class
```

## When to Create New Files

| Type | Create When | Naming |
|------|------------|--------|
| Feature File | New business scenario area | `*_*.feature` (kebab-case) |
| Step Definition | New step patterns | `*_steps.js` |
| Page Object | New page/section, file >200 lines | `*Page.js` |
| DSL | New business domain, file >300 lines | Descriptive noun (`FlightSearch.js`) |
| Helper | Pure utility needed across layers | `*.helper.js` |

## Anti-Patterns

- **God Objects**: Don't put search + results + pricing in one file
- **Layer Bypassing**: Gherkin must only reference DSL (via steps), never Page Objects or selectors
- **Class-based DSL**: Don't use `class` with `constructor(page)` for DSLs
- **Circular Dependencies**: Page Objects must not import DSLs
- **Business Logic in Steps**: Steps are glue; logic goes in DSL
- **Business Logic in Pages**: Pages have selectors and Playwright actions only

## Architecture Checklist

- [ ] Dependencies flow downward only (Feature → Steps → DSL → Pages → Playwright)
- [ ] DSLs are object literals, not classes
- [ ] Gherkin scenarios are human-readable (domain language, not UI details)
- [ ] Step definitions only extract parameters and call DSL methods
- [ ] SELECTORS defined at top of Page Object files
- [ ] Assertions in DSL layer (or critical steps), not in Page Objects
- [ ] No layer bypassing (no Test → Page, no DSL → Playwright)
- [ ] Page parameter always first in DSL methods
- [ ] All DSLs exported via `src/dsl/index.js` barrel export
