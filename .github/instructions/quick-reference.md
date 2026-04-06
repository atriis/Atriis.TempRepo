---
applyTo: src/, tests/
description: Code templates, Playwright cheat sheet, commands, debugging tips, and folder navigation.
---

# Quick Reference Guide

## Project Structure

```
AtriisAutomation/
├── src/
│   ├── config/         # Configuration (URLs, viewport, user discovery)
│   ├── pages/          # Page Objects (SELECTORS + class)
│   ├── dsl/            # Business workflows (object literals)
│   │   └── index.js    # Barrel export
│   ├── utils/          # Helpers & utilities
│   │   └── data/       # Data generators
│   ├── assertions/     # Custom assertions
│   └── data/           # Test data (JSON)
├── tests/
│   ├── features/       # Cucumber .feature files (Gherkin scenarios)
│   │   ├── flights/    # Flight search & booking tests
│   │   ├── hotels/     # Hotel search & booking tests
│   │   ├── cars/       # Car rental tests
│   │   ├── rails/      # Train & Amtrak tests
│   │   ├── ground_transport/  # Ground transport tests
│   │   ├── parking/    # Parking tests
│   │   ├── manual_quote/      # Manual quote tests
│   │   ├── smoke/      # Smoke tests (critical paths)
│   │   └── shell/      # Basic shell tests
│   ├── steps/          # Step definitions (Gherkin → DSL mapping)
│   └── support/        # Hooks (Before, After) & world configuration
```

## Code Templates

### Page Object Template

```js
const { waitForText } = require('@utils/wait');

/**
 * Page Object for [Page Name]
 */
const SELECTORS = {
  SUBMIT_BUTTON: '.btn-submit',
  NAME_INPUT: "[placeholder='Name']",
  LOADING_SPINNER: '.loading-spinner',
};

class MyPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async clickSubmit() {
    await this.page.click(SELECTORS.SUBMIT_BUTTON);
  }

  async fillName(name) {
    await this.page.fill(SELECTORS.NAME_INPUT, name);
  }

  async waitForLoadingComplete() {
    await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });
  }
}

module.exports = MyPage;
// Or: module.exports = { MyPage, SELECTORS };
```

### DSL Template

```js
const MyPage = require('@pages/MyPage');

/**
 * Business workflows for [Domain/Feature]
 */
const MyWorkflow = {
  /**
   * [Business action description]
   * @param {import('@playwright/test').Page} page
   * @param {Object} data - Input data
   * @returns {Promise<Object>} Result data
   */
  async performBusinessAction(page, data) {
    console.log(`Performing action with ${data.field1}`);

    const myPage = new MyPage(page);
    await myPage.fillName(data.field1);
    await myPage.clickSubmit();

    return { success: true };
  },
};

module.exports = MyWorkflow;
```

### Cucumber Feature Template

```gherkin
@regression @flights
Feature: Flight Search and Booking
  As a business traveler
  I want to search for flights and add them to my cart
  So that I can complete my travel booking

  Background:
    Given I am logged in as "ruimariano" booking a new trip

  Scenario: Search for a one-way flight
    When I search for a one-way flight from "LHR" to "MAD"
    And I select a flight option
    Then I should see flight details displayed
    And the flight should be added to my cart

  Scenario Outline: Search for flights with different trip types
    When I search for a <trip_type> from "LAX" to "JFK"
    Then I should see <expected_results> flight options

    Examples:
      | trip_type     | expected_results |
      | one-way       | multiple         |
      | round-trip    | round-trip       |
      | multi-city    | multi-leg        |
```

### Step Definition Template (Gherkin → DSL)

```js
const { Given, When, Then } = require('@cucumber/cucumber');
const { App, FlightSearch } = require('@dsl');

// World (this) provides:
// - this.page: Playwright page object (set by Before hook)
// - this.newTripPageFor(supplier, userKey): Login helper

Given('I am logged in as {string}', async function (userKey) {
  // Before hook sets up browser & page; helper method logs in
  const session = await App.loginAsUserAndBookANewTrip(userKey);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
});

When('I search for a one-way flight from {string} to {string}', async function (from, to) {
  await FlightSearch.selectOneWay(this.page);
  await FlightSearch.selectRoute(this.page, from, to);
  await FlightSearch.search(this.page);
});

Then('I should see flight details displayed', async function () {
  const isVisible = await FlightSearch.verifyFlightDetailsVisible(this.page);
  if (!isVisible) throw new Error('Flight details not displayed');
});
```

## Playwright Cheat Sheet

### Locators

```js
// CSS selectors (primary pattern in this project)
page.locator('.submit-button')
page.locator('#flight-tab')
page.locator("[placeholder='From']")

// Role selectors
page.locator("role=button[name='Cancel trip']")

// Text selectors
page.locator("text='Cancellation confirmed!'")

// Semantic (when available)
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email Address')
page.getByPlaceholder('Enter destination')
page.getByTestId('submit-button')
```

### Actions

```js
await this.page.click(SELECTORS.BUTTON)
await this.page.fill(SELECTORS.INPUT, 'text')
await this.page.hover(SELECTORS.ELEMENT)
await element.waitFor({ state: 'visible' })
await element.waitFor({ state: 'hidden' })
await this.page.waitForSelector(SELECTORS.ELEMENT)
await this.page.waitForLoadState('networkidle')
```

### Assertions

```js
const { expect } = require('@playwright/test');

// Visibility
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()

// Text
await expect(locator).toHaveText('Expected')
await expect(locator).toContainText('Part', { ignoreCase: true })

// State
await expect(button).toBeEnabled()
await expect(checkbox).toBeChecked()

// Count
await expect(page.locator('.item')).toHaveCount(5)
```

## Helper Functions

### Calendar Helper (`@utils/calendar.helper`)

```js
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');

// Select departure date only (one-way)
await selectDatesByNthAvailable(page, {
  startIndex: 3,
  endIndex: null,
});

// Select departure + return (round-trip)
await selectDatesByNthAvailable(page, {
  startIndex: 3,
  endIndex: 10,
});
```

### Wait Utility (`@utils/wait`)

```js
const { waitForText } = require('@utils/wait');

// Wait for element to contain specific text
await waitForText(page, SELECTORS.STATUS_LABEL, 'Pending booking');
```

### Route Helper (`@utils/route.helper`)

```js
const { resolveRoute, resolveLocation } = require('@utils/route.helper');

// Resolve from key → { from, to }
const route = resolveRoute('lhrToDoh', flightRoutes.routes, 'flight');

// Resolve inline object → passes through
const route = resolveRoute({ from: 'PAR', to: 'AMS' }, routes, 'flight');
```

### Random Data Generators (`@utils/data/`)

```js
const { generateRandomGuestData } = require('@utils/data/generateRandomGuestData');
const { generateRandomFlightRoute } = require('@utils/data/generateRandomFlightRoute');

const guest = generateRandomGuestData();
// → { firstName, lastName, dateOfBirth, email, phone }

const routeKey = generateRandomFlightRoute('europe');
// → e.g., 'lhrToMad'
```

## Common Commands

```bash
# Run all Cucumber tests
npx cucumber-js

# Run specific feature file
npx cucumber-js tests/features/flights/general/flight-add-to-cart.feature

# Run with specific tags (smoke tests)
npx cucumber-js --tags "@smoke"

# Run with multiple tags (smoke AND flights)
npx cucumber-js --tags "@smoke and @flights"

# Run excluding tags (all tests except slow)
npx cucumber-js --tags "not @slow"

# Run with dry-run (parse features without executing)
npx cucumber-js --dry-run

# Run with specific formatter (json, html, progress, summary)
npx cucumber-js --format json:reports/report.json

# Run with retry logic (CI environment only)
CI=true RETRY_COUNT=3 npx cucumber-js

# Show available step definitions
npx cucumber-js --dry-run --require steps/
```

## Data Structure: flights.json

```json
{
  "routes": {
    "us": {
      "nycToLax": { "from": "NYC", "to": "LAX" },
      "atlToMco": { "from": "ATL", "to": "MCO" }
    },
    "europe": {
      "lhrToMad": { "from": "LHR", "to": "MAD" },
      "cdgToLhr": { "from": "CDG", "to": "LHR" }
    },
    "intercontinental": {
      "lhrToDoh": { "from": "LHR", "to": "DOH" },
      "lhrToJfk": { "from": "LHR", "to": "JFK" }
    }
  },
  "defaultRoute": "lhrToMad"
}
```

## Debugging Tips

```js
// Pause execution (interactive mode)
await page.pause();

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Console output
console.log('Current URL:', page.url());
console.log('Element text:', await element.textContent());
```

## Folder Navigation

| Need to... | Go to... |
|------------|----------|
| Find UI selectors | `src/pages/*Page.js` (SELECTORS const) |
| Understand workflows | `src/dsl/*.js` |
| Add test data | `src/data/*.json` |
| Write Gherkin scenario | `tests/features/` |
| Implement steps | `tests/steps/*.steps.js` |
| Add hooks (login, etc.) | `tests/support/hooks.js` |
| Create utility function | `src/utils/` |
| Update configuration | `cucumber.js`, `src/config/config.js`, `playwright.config.js` |
