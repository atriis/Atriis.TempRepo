---
applyTo: src/, tests/
description: Code templates, Playwright cheat sheet, commands, debugging tips, and folder navigation.
---

# Quick Reference Guide

## Project Structure

```
AtriisAutomation/
├── src/
│   ├── pages/          # Page Objects (SELECTORS + class)
│   ├── dsl/            # Business workflows (object literals)
│   │   └── index.js    # Barrel export
│   ├── utils/          # Helpers & utilities
│   │   └── data/       # Data generators
│   ├── data/           # Test data (JSON)
│   └── config/         # Configuration
├── tests/
│   ├── features/       # Cucumber .feature files
│   ├── regression/     # Playwright .spec.js files
│   ├── fixtures/       # Custom fixtures (supplierTest.js)
│   ├── steps/          # Step definitions
│   ├── smoke/          # Smoke tests
│   └── support/        # Hooks & world
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

### Playwright Test Template

```js
const { test } = require('@fixtures/supplierTest');
const { Search, MyWorkflow } = require('@dsl');

test.describe('[@regression] Feature Name', () => {
  test('[@priority:critical] Should do something', async ({ newTripPageFor }) => {
    console.log('Step 1: Login');
    const page = await newTripPageFor('amadeus', 'user_one');

    console.log('Step 2: Add traveler');
    await Search.addMeAsTraveler(page);

    console.log('Step 3: Perform action');
    const result = await MyWorkflow.performBusinessAction(page, data);
  });
});
```

### Cucumber Feature Template

```gherkin
@regression
Feature: [Feature Name]
  As a [user type]
  I want to [action]
  So that [benefit]

  Scenario: [Success scenario]
    Given I am logged in as "amadeus" user "user_one"
    And I add myself as traveler
    When I [action]
    Then I should see [expected result]
```

### Step Definition Template

```js
const { Given, When, Then } = require('@cucumber/cucumber');
const { Search } = require('@dsl');

Given('I am logged in as {string} user {string}', async function (supplier, user) {
  this.page = await this.newTripPageFor(supplier, user);
});

Given('I add myself as traveler', async function () {
  await Search.addMeAsTraveler(this.page);
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
# Run specific test file
npx playwright test tests/regression/flights/general/general-flight-add-to-cart.spec.js

# Run with grep (specific test name)
npx playwright test tests/regression/flights/general/general-flight-add-to-cart.spec.js --grep "Add One-Way Flight"

# Run headed (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run with UI mode
npx playwright test --ui

# Show report
npx playwright show-report
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
| Write Playwright test | `tests/regression/` |
| Write Cucumber scenario | `tests/features/` |
| Implement steps | `tests/steps/*.steps.js` |
| Create utility function | `src/utils/` |
| Update fixtures | `tests/fixtures/supplierTest.js` |
| Update configuration | `playwright.config.js`, `cucumber.js`, `src/config/config.js` |
