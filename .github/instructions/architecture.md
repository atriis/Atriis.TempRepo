---
applyTo: src/, tests/
description: Layer responsibilities, data flow, dependency rules, and structural organization patterns.
---

# Architecture Guidelines

## Overview

```
┌─────────────────────────────────────────┐
│         Tests / Feature Files          │  ← Business scenarios
├─────────────────────────────────────────┤
│     DSL (Domain-Specific Language)     │  ← Business workflows
├─────────────────────────────────────────┤
│          Page Objects                   │  ← UI interactions
├─────────────────────────────────────────┤
│    Helpers / Utilities / Data          │  ← Shared utilities
├─────────────────────────────────────────┤
│       Playwright / Browser             │  ← Browser automation
└─────────────────────────────────────────┘
```

## Layer Responsibilities

| Layer | Location | Responsibility | Allowed Dependencies |
|-------|----------|----------------|---------------------|
| **Tests** | `tests/` | Business scenarios, assertions | DSL only (via `@dsl`) |
| **DSL** | `src/dsl/` | Business workflows (object literals) | Page Objects, Helpers |
| **Page Objects** | `src/pages/` | UI interactions, SELECTORS const | Playwright, Helpers |
| **Helpers** | `src/utils/` | Utilities, data generation | Minimal (some import SELECTORS from Pages) |

## Path Aliases

Configured in `jsconfig.json`:

```js
require('@dsl')           // → src/dsl/index.js (barrel export)
require('@pages/...')     // → src/pages/
require('@data/...')      // → src/data/
require('@utils/...')     // → src/utils/
require('@config/...')    // → src/config/
require('@fixtures/...')  // → tests/fixtures/
```

## Data Flow Rules

```
✅ ALLOWED                          ❌ FORBIDDEN
Test → DSL → Page Object → PW      Test ─X─> Page Object
Test, DSL, PO → Helper             Test ─X─> Playwright directly
                                    DSL ─X─> Playwright directly
```

## DSL Pattern: Object Literals

DSLs use **object literal modules** (not classes). `page` is the first argument:

```js
// ✅ ACTUAL pattern
const FlightSearch = {
  async searchFlightOneWay(page, routeInput, options) {
    const searchPage = new SearchPage(page);  // Page Object created inside
    await searchPage.selectOneWayTrip();
    await searchPage.clickSearchButton();
  },
};
module.exports = FlightSearch;
```

## Test Pattern: Fixtures + Static DSL

Tests use custom fixtures from `@fixtures/supplierTest`:

```js
const { test } = require('@fixtures/supplierTest');
const { Search, FlightSearch, Cart } = require('@dsl');

test('Add flight to cart', async ({ newTripPageFor }) => {
  const page = await newTripPageFor('amadeus', 'user_one');
  await Search.addMeAsTraveler(page);
  await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');
  await Cart.expectBookingStatus('Pending booking', { page });
});
```

**Two fixture patterns**:
- `newTripPageFor(provider, userKey)` — explicit user, most common
- `newTripPage` — cross-supplier, uses project config

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

## Shared UI Elements

No `*Component.js` files. Use dedicated Page Objects:

- `CommonPage.js` — OOP indicators, shared validation elements
- `GeneralElementsPage.js` — Notifications, common UI feedback

## Project Structure

```
src/
├── pages/              # Page Objects (SELECTORS + class)
│   ├── SearchPage.js
│   ├── FlightSearchPage.js
│   ├── CartPage.js
│   ├── CommonPage.js
│   └── GeneralElementsPage.js
├── dsl/                # Business workflows (object literals)
│   ├── index.js        # Barrel export
│   ├── FlightSearch.js
│   ├── Cart.js
│   └── Search.js
├── utils/              # Helpers
│   ├── calendar.helper.js
│   ├── route.helper.js
│   ├── wait.js
│   └── data/
│       ├── generateRandomGuestData.js
│       └── generateRandomFlightRoute.js
├── data/               # Test data (JSON)
│   ├── flights.json
│   └── tripStatus.json
└── config/
    └── config.js

tests/
├── features/           # Cucumber scenarios (.feature)
├── regression/         # Playwright tests (.spec.js)
├── fixtures/           # Custom fixtures (supplierTest.js)
├── steps/              # Step definitions
└── support/            # Hooks & world
```

## When to Create New Files

| Type | Create When | Naming |
|------|------------|--------|
| Page Object | New page/section, file >200 lines | `*Page.js` |
| DSL | New business domain, file >300 lines | Descriptive noun (`FlightSearch.js`) |
| Helper | Pure utility needed across layers | `*.helper.js` |

## Anti-Patterns

- **God Objects**: Don't put search + results + pricing in one file
- **Layer Bypassing**: Tests must not use Page Objects or raw selectors
- **Class-based DSL**: Don't use `class` with `constructor(page)` for DSLs
- **Circular Dependencies**: Page Objects must not import DSLs

## Architecture Checklist

- [ ] Dependencies flow downward only
- [ ] DSLs are object literals, not classes
- [ ] Tests use fixtures for login, `@dsl` for actions
- [ ] SELECTORS defined at top of Page Object files
- [ ] Path aliases used (`@dsl`, `@pages`, etc.)
- [ ] No layer bypassing
