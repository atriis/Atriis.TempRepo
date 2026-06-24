---
applyTo: tests/features/, tests/steps/
description: Writing readable Gherkin scenarios and step definitions for BDD tests. Covers feature files, step syntax, and best practices.
---

# Gherkin Scenario Writing & Step Definitions

## Purpose

Scenarios describe **what users do and what they expect** in human-readable language (Gherkin). Step definitions are the code that makes scenarios executable, calling DSL methods to perform actions.

Architecture & data flow: see [architecture.md](architecture.md).

## Core Principles for Gherkin

| ✅ Do | ❌ Don't |
|-------|----------|
| Read like user stories | Read like code |
| Use domain language ("search", "book") | Use UI language ("click button", "fill field") |
| One action per step | Multiple actions in one step |
| Use step parameters for variables | Hardcode test data |
| Be idempotent — run in any order | Depend on execution order |
| Use proper tags for filtering | No tags or vague tags |

## Feature File Structure

```gherkin
# tests/features/flights/general/one_way_search.feature

Feature: One-Way Flight Search
  As a travel booker
  I want to search for one-way flights
  So I can book the best option for my trip

  Background:
    Given I am logged in as "ruimariano" booking a new trip
    And I am on the New Trip page

  @smoke @priority:critical @provider:amadeus
  Scenario: Search returns results for valid route
    When I search for a one-way flight from "LON" to "NYC"
    Then flight results are displayed
    And results show at least 1 flight

  @regression @priority:high @slow
  Scenario: Pagination works for large result sets
    When I search for a one-way flight from "LON" to "NYC"
    And I scroll to the next results page
    Then more results are displayed
```

### Gherkin Keywords

- **Feature**: Top-level description (readable title)
- **Background**: Runs before each scenario (login, setup)
- **Scenario**: Single test case (Given-When-Then flow)
- **Given**: Precondition (state setup)
- **When**: Action (what the user does)
- **Then**: Expected outcome (assertions)
- **And/But**: Continuation of previous line

### Step Parameters

Use `{string}` or `{int}` placeholders for variables:

```gherkin
# Variables can be used in steps
When I search for a one-way flight from "LON" to "NYC"
# Variables extracted to step definition parameters
When('I search for a one-way flight from {string} to {string}', 
  async (origin, destination) => { ... }
)
```

## Step Definition Implementation

Step definitions live in `tests/steps/` and connect Gherkin to DSL:

### Basic Step Definition Pattern

```javascript
// tests/steps/flight_search.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { App, FlightSearch, FlightResults } = require('@dsl');

// Background steps (setup)
Given('I am logged in as {string}', 
  async function (userKey) {
    const session = await App.loginAsUserAndBookANewTrip(userKey);
    this.browser = session.browser;
    this.context = session.context;
    this.page = session.page;
  }
);

Given('I am on the New Trip page', async function () {
  expect(await App.isOnNewTripPage(this.page)).toBe(true);
});

// Action steps (When)
When('I search for a one-way flight from {string} to {string}', 
  async function (origin, destination) {
    await FlightSearch.searchOneWayFlight(this.page, origin, destination);
  }
);

// Assertion steps (Then)
Then('flight results are displayed', async function () {
  expect(
    await FlightResults.areResultsVisible(this.page)
  ).toBe(true);
});

Then('results show at least {int} flight', async function (count) {
  const resultCount = await FlightResults.getFlightCount(this.page);
  expect(resultCount).toBeGreaterThanOrEqual(count);
});
```

### Context Access

The current page is stored on the Cucumber World as `this.page` (set by the login step or the Before hook). Use regular `function` handlers in step definitions whenever you need access to the World — arrow functions do not bind the Cucumber World correctly.

World setup, `this.page`, and hook lifecycle: see [cucumber.md](cucumber.md#world-and-hooks).

### Error Handling in Steps

Catch and clarify errors:

```javascript
Then('flight results are displayed', async function () {
  try {
    expect(await FlightResults.areResultsVisible(this.page)).toBe(true);
  } catch (error) {
    console.error('✗ Results not visible. Possible causes:');
    console.error('  - Search failed to complete');
    console.error('  - Page timeout waiting for results');
    throw error;
  }
});
```

## Tagging Scenarios

Place tags on the line before `Feature:` (applies to all scenarios) or before a `Scenario:` (applies to that scenario):

```gherkin
@smoke @priority:critical @provider:amadeus
Scenario: Book a round-trip flight
```

The full tag catalog (standard tags, provider/user tags, `@loginOnly`) and tag-based test filtering / `--tags` run commands: see [cucumber.md](cucumber.md#tags).

## Feature File Organization

Organize by product, then by test type:

```
tests/features/
├── flights/
│   ├── general/                    # Supplier-agnostic tests
│   │   ├── one_way_search.feature
│   │   ├── round_trip_search.feature
│   │   └── passenger_types.feature
│   ├── direct/                     # Direct flight tests
│   ├── daily_flights/              # Daily regression
│   │   └── daily_regression.feature
│   └── supplier-specific/          # Supplier-specific (Lufthansa, Air France, ...)
│       └── lufthansa_pricing.feature
├── hotels/
│   ├── general/
│   ├── daily_hotels/
│   └── booking_com/
├── cars/
│   ├── general/
│   └── daily_cars/
├── rails/
├── ground_transport/
├── parking/
├── manual_quote/
├── smoke/                          # Critical path smoke tests
└── shell/                          # Basic shell tests
```

## Test Independence & Data

### Idempotent Scenarios

Scenarios must run independently, in any order:

```gherkin
# ✅ GOOD: Each scenario sets its own preconditions
@regression
Scenario: Search displays results
  Given I am logged in as "ruimariano"
  When I search for a one-way flight
  Then results are displayed

# ❌ BAD: Depends on previous scenario state
@regression
Scenario: Pagination works
  # Assumes search was done — fails if run alone
  When I click next page
  Then more results display
```

### Using Step Parameters for Test Data

```gherkin
# Parameterized scenarios — flexible test data
@regression
Scenario Outline: Search works for multiple users
  Given I am logged in as "<label>"
  When I search for a one-way flight from "LON" to "NYC"
  Then flight results are displayed

  Examples:
    | label      |
    | ruimariano |
    | robsoncruz |
    | lidi       |
```

## Assertions in Gherkin

Assertions happen in `Then` steps and DSL methods:

```gherkin
# Simple outcome verification
Then flight results are displayed

# Quantitative assertion
Then results show at least 5 flights

# Status verification
Then booking status is "Pending Booking"
```

In step definitions, use `expect()` for clarity:

```javascript
Then('results show at least {int} flights', async function (count) {
  const flightCount = await FlightResults.getFlightCount(this.page);
  expect(flightCount).toBeGreaterThanOrEqual(count);
});
```

## Best Practices

| ✅ | ❌ |
|----|-----|
| `When I search for a flight` | `When I click the search button and fill departure field` |
| `Then results are displayed` | `Then I can see the results div with class flight-result` |
| `Given I am logged in as "ruimariano"` | `Given I log in with amadeus/@amadeus.com/password123` |
| Use Background for common setup | Repeat setup in every scenario |
| Use descriptive variable names | Use x, y, temp, data1 |
| One scenario per business intent | Multiple intents in one scenario |

Use descriptive scenario names with proper tags:

```gherkin
@regression @flights @priority:critical
Scenario: Add One-Way Flight to Cart
  Given I am logged in as "ruimariano" booking a new trip
  When I search for a one-way flight from "LHR" to "DOH"
  And I select the first available flight
  Then the flight should be added to my cart

@regression @flights @priority:critical
Scenario: Add Round-Trip Flight to Cart
  Given I am logged in as "ruimariano" booking a new trip
  When I search for a round-trip flight from "LAX" to "JFK"
  And I select a flight for both legs
  Then both flights should be added to my cart
```

## Anti-Patterns (What NOT to Do)

```gherkin
# ❌ Technical implementation details in Gherkin
Scenario: Click search button and fill form
  Given I am on the flight search page
  When I click #search-button with class submit-btn
  And I fill in the departure field with text "London"
  Then the results div contains class "flight-result"

# ✅ GOOD: Business intent in Gherkin
Scenario: Search for flights
  When I search for a flight from "London" to "Paris"
  Then I should see available flight options
```

Step-definition wiring anti-patterns (raw Playwright in steps, calling Page Objects directly instead of DSL): see [cucumber.md](cucumber.md#step-definitions).

## Summary Checklist

- [ ] Each scenario describes one business outcome
- [ ] Gherkin uses domain language ("search", "book"), not UI language
- [ ] Step definitions use {string}, {int} parameters for data
- [ ] Step definitions call DSL methods, never Page Objects directly
- [ ] No raw Playwright code in step definitions
- [ ] Scenarios use proper tags (@smoke, @regression, @priority:critical)
- [ ] Scenarios are independent and can run in any order
- [ ] Then steps verify business outcomes, not UI details
- [ ] Feature files organized by product/domain, not by test type
