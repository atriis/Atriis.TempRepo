---
applyTo: tests/
description: Writing readable tests with Playwright and Cucumber. Covers fixtures, structure, assertions, and best practices.
---

# Test Guidelines

## Purpose

Tests validate business requirements by orchestrating DSL methods and asserting expected outcomes. Tests should read like user journeys.

## Core Principles

| ✅ Do | ❌ Don't |
|-------|----------|
| Read like user journeys | Read like UI scripts |
| Use DSL methods only (via `@dsl`) | Use Page Objects or raw selectors |
| Use fixtures for login/setup | Call `page.goto()` manually |
| Validate single intent per test | Mix unrelated assertions |
| Be deterministic and independent | Depend on execution order |

## Fixtures: Login & Trip Setup

Tests use custom fixtures from `@fixtures/supplierTest`, **not** `@playwright/test`:

### `newTripPageFor(provider, userKey)` — Specific User (Most Common)

```js
const { test } = require('@fixtures/supplierTest');
const { Search, FlightSearch } = require('@dsl');

test('Search flight', async ({ newTripPageFor }) => {
  const page = await newTripPageFor('amadeus', 'user_one');
  await Search.addMeAsTraveler(page);
  await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');
});
```

### `newTripPage` — Cross-Supplier (Project Config)

```js
test('Book flight', async ({ newTripPage }) => {
  const page = newTripPage;  // Supplier from project config
  await Search.addMeAsTraveler(page);
});
```

## Playwright Test Structure (Actual Pattern)

```js
const { test } = require('@fixtures/supplierTest');
const { Search, FlightSearch, FlightResults, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Add Flight to Cart Flows', () => {
  test('[@priority:critical] Add One-Way Flight to Cart', async ({ newTripPageFor }) => {
    // Step 1: Login + Book a New Trip (handled by fixture)
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('amadeus', 'user_one');

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight
    console.log('Step 3: Search for a one-way flight (London → Doha)');
    await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

    // Step 4: Add first flight to cart
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Assert booking status
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });
  });
});
```

### Key Patterns:
- **Tags**: `[@regression]`, `[@priority:critical]` in describe/test names
- **Console logs**: Step-by-step progress logging
- **DSL calls**: Static method calls with `page` first arg
- **No `page.goto()`**: Fixtures handle navigation
- **No `new DSL(page)`**: DSLs are object literals, called statically

## Test Independence

Each test must be fully self-contained:

```js
// ✅ GOOD: Self-contained — fixture creates clean state
test('Add flight to cart', async ({ newTripPageFor }) => {
  const page = await newTripPageFor('amadeus', 'user_one');
  await Search.addMeAsTraveler(page);
  await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');
  await FlightResults.addFirstFlightToCart(page);
});

// ❌ BAD: Depends on previous test state
test('Add flight to cart', async ({ newTripPageFor }) => {
  // Assumes search was already done — will fail if run alone
  await FlightResults.addFirstFlightToCart(page);
});
```

## Assertions

### Use DSL Assertion Methods

```js
// ✅ GOOD: DSL handles the assertion detail
await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });
await Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(page);
```

### Direct Assertions When Needed

```js
// ✅ GOOD: Business outcome validation
const result = await Cart.cancelTripStrict(page);
expect(result.cancelled).toBe(true);
```

## Test Data

### Routes from flights.json

```js
// Route key — resolved by resolveRoute helper
await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

// Inline object — for one-off scenarios
await FlightSearch.searchFlightRoundTrip(page, { from: 'PAR', to: 'AMS' });

// Random route by region
await FlightSearch.searchRoundTripRandomFlight(page, 'intercontinental');

// Default route (europe) — no parameter needed
await FlightSearch.searchRoundTripRandomFlight(page);
```

### Status data from tripStatus.json

```js
const tripStatus = require('@data/tripStatus.json');
await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });
```

## Test Descriptions

Use business intent with tags:

```js
// ✅ GOOD: Clear business intent with tags
test.describe('[@regression] Add Flight to Cart Flows', () => {
  test('[@priority:critical] Add One-Way Flight to Cart – Should complete one-way add to cart flow', ...);
  test('[@priority:critical] Add Round Trip Flight to Cart – Should complete round trip add to cart flow', ...);
});

// ❌ BAD: Technical or vague
test('test search', ...);
test('verify page loads', ...);
```

## Cucumber Tests

### Feature File

```gherkin
@regression
Feature: Flight Search
  As a traveler
  I want to search for flights
  So that I can find the best option for my trip

  Scenario: Search for one-way domestic flight
    Given I am logged in as "amadeus" user "user_one"
    And I add myself as traveler
    When I search for a one-way flight from "LHR" to "DOH"
    Then I should see available flights
```

### Step Definitions

```js
const { Given, When, Then } = require('@cucumber/cucumber');
const { Search, FlightSearch } = require('@dsl');

Given('I am logged in as {string} user {string}', async function (supplier, user) {
  this.page = await this.newTripPageFor(supplier, user);
});

Given('I add myself as traveler', async function () {
  await Search.addMeAsTraveler(this.page);
});

When('I search for a one-way flight from {string} to {string}',
  async function (from, to) {
    await FlightSearch.searchFlightOneWay(this.page, { from, to });
  }
);
```

## Test Organization

```
tests/
├── features/           # Cucumber .feature files
│   ├── flights/
│   │   ├── general/
│   │   ├── lufthansa/
│   │   └── travel_policy/
│   ├── hotels/
│   └── cars/
├── regression/         # Playwright .spec.js files
│   ├── flights/
│   │   ├── general/
│   │   ├── afkl/
│   │   └── ...
│   ├── hotels/
│   └── cars/
├── smoke/              # Critical path smoke tests
├── fixtures/           # Custom fixtures (supplierTest.js)
├── steps/              # Cucumber step definitions
└── support/            # Hooks & world
```

## Anti-Patterns

```js
// ❌ 1. Using Page Objects directly in tests
const searchPage = new FlightSearchPage(page);
await searchPage.clickFlightTab();

// ❌ 2. Raw Playwright selectors in tests
await page.click('#search-button');

// ❌ 3. Using @playwright/test instead of @fixtures/supplierTest
const { test } = require('@playwright/test');  // WRONG

// ❌ 4. Calling page.goto() in tests
await page.goto('/flights');  // Fixture handles this

// ❌ 5. Creating DSL instances
const flightSearch = new FlightSearch(page);  // DSLs are object literals
```

## Summary Checklist

- [ ] Uses `require('@fixtures/supplierTest')` for test import
- [ ] Uses fixtures (`newTripPageFor` / `newTripPage`) for login
- [ ] DSL methods called statically via `@dsl` barrel
- [ ] No Page Objects, selectors, or `page.goto()` in tests
- [ ] Each test is independent and self-contained
- [ ] Descriptive test name with tags
- [ ] Console logs for step-by-step progress
- [ ] Assertions validate business outcomes
