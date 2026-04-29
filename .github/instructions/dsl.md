---
applyTo: src/dsl/
description: DSL layer guidelines for business workflows. Covers method design, naming, return values, and error handling.
---

# DSL (Domain-Specific Language) Guidelines

## Purpose

DSL layer translates business intent into UI actions. It provides readable, domain-focused methods that orchestrate Page Object interactions. 

In the Cucumber BDD architecture, **step definitions call DSL methods** to execute business workflows:

```
Gherkin Step (When I search for a flight)
    ↓
Step Definition (calls DSL)
    ↓
DSL Method (composes Page Object calls)
    ↓
Page Object (executes Playwright API)
```

For details on how step definitions invoke DSL methods in Cucumber, see [Cucumber Implementation Guide](./cucumber.md#step-definitions).

## Pattern: Object Literals (Not Classes)

DSLs in this project are **object literal modules**. The `page` object is always the **first argument**.

```js
// ✅ ACTUAL pattern used in this project
const FlightSearchPage = require('@pages/FlightSearchPage');
const { SearchPage } = require('@pages/SearchPage');
const flightRoutes = require('@data/flights.json');
const { getPageObject } = require('@utils/pageObjectCache');
const logger = require('@utils/logger').child('FlightSearch-DSL');
const { resolveRoute } = require('@utils/route.helper');

const FlightSearch = {
  async searchFlightOneWay(page, routeInput = flightRoutes.defaultRoute, options = {}) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Searching one-way flight', { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickSearchButton();

    return { searched: true, from, to };
  },
};

module.exports = FlightSearch;
```

```js
// ❌ NOT USED — class-based pattern
class FlightSearch {
  constructor(page) { this.page = page; }
}
```

## Core Principles

| ✅ Do | ❌ Don't |
|-------|----------|
| Write methods that read like plain English | Describe implementation details |
| Call Page Object methods only | Access `page.locator()` or selectors directly |
| Return meaningful data objects | Return booleans when richer data is available |
| Pass `page` as first argument | Store `page` in `this` (no constructor) |

## Barrel Export

All DSLs are exported via `src/dsl/index.js`:

```js
// Import in tests:
const { Search, FlightSearch, FlightResults, Cart } = require('@dsl');
```

## Method Design

### Good vs Bad Naming

```js
// ✅ GOOD: Reads like business language
await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');
await FlightSearch.searchFlightRoundTrip(page, { from: 'PAR', to: 'AMS' });
await Search.addMeAsTraveler(page);
await Cart.cancelTripStrict(page);

// ❌ BAD: Too technical or vague
await clickSearchButtonAndWaitForResults(page);
await doFlightStuff(page);
```

### Granularity

DSL methods represent **complete business actions**, not UI steps:

```js
// ✅ GOOD: Complete business action
async searchFlightOneWay(page, routeInput, options) {
  const searchPage = getPageObject(page, SearchPage);
  await searchPage.selectOneWayTrip();
  await searchPage.fillInFromField(from);
  await searchPage.fillInToField(to);
  await searchPage.clickSearchButton();
  return { searched: true, from, to };
}

// ❌ BAD: Too granular — belongs in Page Object
async fillSearchForm(page) {
  // Just wrapping Page Object calls adds no value
}
```

## Return Values

Return **rich, meaningful data** that tests or downstream DSLs will need:

```js
// ✅ GOOD: Rich return values (actual patterns)
async cancelTripStrict(page) {
  // ... cancel actions
  return { cancelled: true };
}

async cancelTripSafely(page) {
  try {
    // ... cancel actions
    return { cancelled: true };
  } catch (error) {
    return { cancelled: false, error: error?.message };
  }
}

async acceptTermsAndConditionsAndProceedToCheckout(page) {
  // ... proceed actions
  return { proceeded: true, clickedModal: false };
}
```

## Page Object Instantiation

Create Page Object instances **inside DSL methods** using the shared page-object cache, not at module level:

```js
// ✅ GOOD: Create inside method using the cache
const { getPageObject } = require('@utils/pageObjectCache');

const FlightSearch = {
  async searchFlightOneWay(page, routeInput) {
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);
    // ... use them
  },
};

// ❌ BAD: No constructor pattern
class FlightSearch {
  constructor(page) {
    this.searchPage = new SearchPage(page);
  }
}
```

Always use `getPageObject(page, PageClass)` from `@utils/pageObjectCache`. This caches Page Object instances per page and is the project-standard pattern.

## Logging Guidelines

Use the project logger to explain **business intent**, not UI steps:

```js
const logger = require('@utils/logger').child('FlightSearch-DSL');

// ✅ GOOD: Business context
logger.info(`Starting ${tripType} flight search (${searchType})`, { from, to });
logger.debug('Selecting cheapest available flight');

// ❌ BAD: Restating code
logger.info('Clicking button');
logger.info('Filling input field');
```

In DSL files, prefer `logger.info()` and `logger.debug()` over `console.log()` so output stays consistent with the project logger.

## Error Messages

Throw errors with **business context** and **data**:

```js
// ✅ GOOD: From route.helper.js
throw new Error(
  `Route "${routeInput}" was not found in any group in ${routeType}.json. ` +
  `Check that the key exists and is spelled correctly.`
);

// ❌ BAD: Generic
throw new Error('Search failed');
```

## Assertions in DSL (Exception)

Generally, DSL should **not** contain assertions. However, critical **state validation** is acceptable:

```js
// ✅ ACCEPTABLE: Critical state validation (actual pattern in Cart DSL)
async expectBookingStatus(expectedStatus, { timeout = 60000, page } = {}) {
  const locator = page.locator(CART_SELECTORS.QUOTE_STATUS_LABEL);
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toContainText(expectedStatus, { timeout, ignoreCase: true });
}

// ❌ BAD: Business assertion that belongs in test
async addFlightToCart(page) {
  await pricingPage.clickAddToCart();
  expect(await cartPage.getItemCount()).toBe(1);  // Move to test
}
```

## Data Handling

Use route helpers and data files for flexible input:

```js
// ✅ GOOD: Accept route key OR inline object
async searchFlightOneWay(page, routeInput = flightRoutes.defaultRoute) {
  const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
  // ...
}

// Usage — route key from flights.json
await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

// Usage — inline object
await FlightSearch.searchFlightRoundTrip(page, { from: 'PAR', to: 'AMS' });
```

## Anti-Patterns

```js
// ❌ 1. Accessing Playwright directly
async searchFlight(page) {
  await page.click('#search-btn');  // Use Page Object
}

// ❌ 2. Class-based DSL
class FlightSearch {
  constructor(page) { this.page = page; }
}

// ❌ 3. Vague method names
async doStuff(page) { }
async processForm(page) { }

// ❌ 4. Test logic in DSL
async searchFlight(page) {
  expect(results.length).toBeGreaterThan(0);  // Belongs in test
}
```

## Summary Checklist

- [ ] Object literal pattern (not class)
- [ ] `page` is the first argument to every method
- [ ] Page Objects created inside methods
- [ ] Methods read like business language
- [ ] Returns rich, meaningful data
- [ ] Descriptive console logs
- [ ] JSDoc comments on public methods
- [ ] Error messages include context and data
- [ ] No test assertions (except critical state checks)
- [ ] Exported via barrel in `src/dsl/index.js`
