---
applyTo: src/pages/
description: Page Object patterns, SELECTORS constant, locator rules, behavior guidelines, and shared page objects.
---

# Page Objects Guidelines

## Purpose

Page Objects encapsulate UI elements and low-level interactions. They provide a stable interface between DSLs and the UI.

## Pattern: SELECTORS Constant + Class

Page Objects define a `SELECTORS` constant object **outside the class**, then use it in methods:

```js
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  TRIP_TYPE: '.search-for-select .el-radio',
  ADVANCED_SEARCH_BUTTON: '.advanced-search-container .btn',
};

class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  async clickFlightTab() {
    await this.page.click(SELECTORS.FLIGHT_TAB);
  }

  async selectCompleteTrip() {
    await this.page.locator(SELECTORS.TRIP_TYPE).nth(0).click();
  }
}

module.exports = FlightSearchPage;
```

### Exporting SELECTORS

Some Page Objects export SELECTORS for use by helpers or DSLs:

```js
// CartPage.js
module.exports = { CartPage, SELECTORS };

// SearchPage.js
module.exports = { SearchPage, SELECTORS };
```

This allows helpers like `calendar.helper.js` to import SELECTORS directly.

## Instantiation Pattern

Page Objects remain normal classes, but DSL code should obtain them through the shared cache helper:

```js
const { getPageObject } = require('@utils/pageObjectCache');

// ✅ GOOD: project-standard instantiation
const cartPage = getPageObject(page, CartPage);

// ❌ AVOID in DSL code: bypasses cache
const cartPage = new CartPage(page);
```

Use direct `new PageClass(page)` only inside the cache helper itself or in rare low-level utility code that intentionally bypasses the cache.

## Locator Rules

### Declaration

| ✅ Do | ❌ Don't |
|-------|----------|
| Define all selectors in `SELECTORS` constant | Define selectors inline in methods |
| Reuse existing selectors | Create duplicates for same element |
| Add comments for complex selectors | Leave non-obvious selections unexplained |

### Selector Types Used

The project primarily uses CSS selectors in the `SELECTORS` object:

```js
const SELECTORS = {
  // ID selectors
  FLIGHT_TAB: '#tab-flight',

  // Class selectors
  TRIP_TYPE: '.search-for-select .el-radio',

  // Attribute selectors
  JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",

  // Role selectors (used inline when needed)
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",

  // Text selectors
  CANCELLATION_SUCCESS: "text='Cancellation confirmed!'",
};
```

## Method Guidelines

### Behavior Rules

| ✅ Do | ❌ Don't |
|-------|----------|
| Interact with UI elements | Assert business outcomes |
| Use technical method names | Use business-intent names |
| Return UI state/data when needed | Return complex business objects |
| Use `this.page` for all interactions | Use `page` from outside scope |

### Examples (Actual Patterns)

```js
// ✅ GOOD: Technical, clear actions
async clickFlightTab() {
  await this.page.click(SELECTORS.FLIGHT_TAB);
}

async selectCompleteTrip() {
  await this.page.locator(SELECTORS.TRIP_TYPE).nth(0).click();
}

async waitForTripOverviewTitle() {
  await this.page.waitForSelector(SELECTORS.TRIP_OVERVIEW_TITLE);
}

async hoverTripActionsDropdownIcon() {
  await this.page.hover(SELECTORS.TRIP_ACTIONS_DROPDOWN_ICON);
}

// Using waitForText helper
async waitForDetailsText() {
  await waitForText(this.page, SELECTORS.SOME_ELEMENT, 'expected text');
}

// ❌ BAD: Business logic in Page Object
async searchCheapestFlight(data) {
  // Complex workflow belongs in DSL
}
```

## Shared Page Objects

For shared UI elements, use dedicated Page Objects (no `*Component.js` pattern):

```js
// CommonPage.js — OOP indicators, validation elements shared across pages
const SELECTORS = {
  GO_BACK_BUTTON: "button:has-text('Go back')",
  OOP_TOOLTIP_TEXT: '.mb-1',
  OOP_INFO: '.app-out-of-policy',
};

class CommonPage {
  constructor(page) { this.page = page; }

  async waitForOOPVisible() {
    await this.page.locator(SELECTORS.OOP_INFO).waitFor({ state: 'visible', timeout: 30000 });
  }

  async hoverOverOOPInfoIcon() {
    await this.page.locator('span.info-icon', { hasText: 'info' }).nth(1).hover();
  }
}

module.exports = { CommonPage, SELECTORS };
```

## Complete Page Object Template

```js
const { waitForText } = require('@utils/wait');

/**
 * Page Object for [Page Name]
 */
const SELECTORS = {
  // Group by section
  SUBMIT_BUTTON: '.btn-submit',
  NAME_INPUT: "[placeholder='Name']",
  EMAIL_INPUT: "[placeholder='Email']",
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

  async fillEmail(email) {
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  async waitForLoadingComplete() {
    await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });
  }
}

module.exports = MyPage;
// Or: module.exports = { MyPage, SELECTORS };
```

## Anti-Patterns

```js
// ❌ 1. Inline selectors (not in SELECTORS const)
async clickButton() {
  await this.page.click('button.submit');  // Define in SELECTORS
}

// ❌ 2. Business logic in Page Object
async bookFlight(data) {
  // Complex workflow belongs in DSL
}

// ❌ 3. Test assertions in Page Object
async verifyBookingSuccess() {
  expect(this.confirmation).toBeVisible();  // Belongs in test/DSL
}

// ❌ 4. Locators defined in constructor (not the pattern used here)
constructor(page) {
  this.submitButton = page.getByRole('button', { name: 'Submit' });
}
```

## Summary Checklist

- [ ] SELECTORS constant defined outside class
- [ ] All selectors in SELECTORS, not inline
- [ ] Methods have clear, technical names
- [ ] No business logic or test assertions
- [ ] JSDoc comment on constructor
- [ ] Exports class with `module.exports`
- [ ] SELECTORS exported if needed by other files
- [ ] Follows existing naming patterns
