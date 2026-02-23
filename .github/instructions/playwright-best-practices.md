---
applyTo: src/pages/, src/dsl/
description: Locator strategies, waits, assertions, form handling, and browser automation patterns for Page Objects and DSL methods in Cucumber BDD context.
---

# Playwright Best Practices

## Context in Cucumber BDD

In this framework, **only Page Objects and DSL methods interact directly with Playwright**:

```
Gherkin Scenarios
    ↓
Step Definitions (extract parameters, call DSL)
    ↓
DSL Methods (business workflows, assertions)
    ↓ Calls Page Objects
Page Objects (UI selectors, atomic actions) ← THIS LAYER uses Playwright
    ↓
Playwright APIs
```

**This guide applies to**: Page Objects (`src/pages/`) and DSL methods (`src/dsl/`) that compose Page Object calls.

**Not applicable to**: Gherkin scenarios or step definitions (they call DSL, never touch Playwright directly).

## Locator Strategy

### This Project's Pattern

Page Objects use a `SELECTORS` constant with CSS/attribute selectors:

```js
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  TRIP_TYPE: '.search-for-select .el-radio',
  JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS: "text='Cancellation confirmed!'",
};
```

### Selector Priority (When Adding New Ones)

1. **`data-testid`** — Most stable, designed for testing
2. **Role selectors** — `role=button[name='...']`
3. **Attribute selectors** — `[placeholder='...']`, `[aria-label='...']`
4. **ID selectors** — `#element-id`
5. **Class selectors** — `.class-name` (less stable but commonly used)
6. **CSS chains** — Last resort, avoid deep nesting

### Use Specific Selectors

```js
// ✅ GOOD: Specific
SUBMIT_BUTTON: "role=button[name='Submit Order']"
CANCEL_BUTTON: "role=button[name='Cancel trip']"

// ❌ BAD: Too generic
BUTTON: 'button'  // Which button?
```

## Waiting Strategies

### Auto-Waiting

Playwright auto-waits for actionability. Trust it for basic actions:

```js
// ✅ GOOD: Playwright waits automatically for click/fill
await this.page.click(SELECTORS.BUTTON);
await this.page.fill(SELECTORS.INPUT, 'text');
```

### Explicit Waits (When Needed)

```js
// ✅ GOOD: Wait for specific state
await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });
await this.page.waitForLoadState('networkidle');

// ✅ GOOD: Wait for element visibility
await element.waitFor({ state: 'visible' });
await element.waitFor({ state: 'hidden' });

// ✅ GOOD: waitForText helper (waits for element to contain text)
const { waitForText } = require('@utils/wait');
await waitForText(page, SELECTORS.STATUS_LABEL, 'Pending booking');
```

### Race Conditions (Actual Pattern)

```js
// ✅ GOOD: Race between two possible outcomes
await Promise.race([
  checkoutHeading.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
  proceedBtn.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
]);

// Then handle whichever appeared
if (await proceedBtn.isVisible()) {
  await proceedBtn.click();
}
```

### Documented Timeouts

If you **must** use `waitForTimeout`, explain why:

```js
// ✅ ACCEPTABLE: Documented workaround
await page.waitForTimeout(500);  // Calendar widget has known animation delay

// ❌ BAD: Arbitrary timeout without reason
await page.waitForTimeout(3000);
```

## Assertions

### Use Playwright Assertions (Auto-Retry)

Assertions should use Playwright's `expect()` for auto-retry stability. **In Cucumber BDD**, assertions typically live in **DSL methods**, not in Page Objects:

```js
// Page Object (src/pages/)
class CartPage {
  async getBookingStatus() {
    return await this.page.locator(SELECTORS.STATUS_LABEL).textContent();
  }
}

// DSL (src/dsl/Cart.js) — Contains assertion logic
async expectBookingStatus(page, expectedStatus, { timeout = 60000 } = {}) {
  const proceedBtn = new CartPage(page);
  const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL);
  
  // Assert using Playwright expect (auto-retry)
  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toContainText(expectedStatus, { timeout, ignoreCase: true });
}
```

**Step Definition** (calls DSL):
```js
Then('the booking status should be {string}', async function (status) {
  await Cart.expectBookingStatus(this.page, status);
});
```

### Assertion Pattern

```js
// ✅ GOOD: Auto-retry assertions (use in DSL/Page Objects)
await expect(locator).toBeVisible();
await expect(locator).toBeVisible({ timeout: 60000 });
await expect(locator).toContainText('Pending booking', { ignoreCase: true });
await expect(locator).toBeHidden();

// ❌ BAD: No auto-retry (don't use)
const isVisible = await locator.isVisible();
expect(isVisible).toBe(true);  // Can fail due to timing
```

## Forms and Inputs

### Filling Inputs (Actual Pattern)

```js
// ✅ GOOD: Using this.page.fill with SELECTORS
await this.page.fill(SELECTORS.TRAVELER_NAME_FIELD, name);
await this.page.fill(SELECTORS.EMAIL_INPUT, email);

// For autocomplete fields — type slowly then select
await this.page.fill(SELECTORS.FROM_PLACEHOLDER, city);
// Then wait for dropdown and select option
```

### Clicking Elements

```js
// ✅ Direct click
await this.page.click(SELECTORS.FLIGHT_TAB);

// ✅ Nth element
await this.page.locator(SELECTORS.TRIP_TYPE).nth(0).click();

// ✅ Hover then click
await this.page.hover(SELECTORS.DROPDOWN_ICON);
await this.page.click(SELECTORS.DROPDOWN_OPTION);
```

### Checkboxes

```js
// ✅ Click on checkbox selector
await this.page.click(SELECTORS.TERMS_CHECKBOX);
```

## Handling Dynamic Content

### Loading States

```js
// ✅ GOOD: Wait for loading to finish
async waitForSearchComplete() {
  await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'visible' });
  await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });
}
```

### Network State

```js
// ✅ GOOD: Wait for network idle
await page.waitForLoadState('networkidle');
```

### Conditional Elements

```js
// ✅ GOOD: Check visibility before action (actual pattern)
const proceedBtn = cartPage.getProceedWithChangeButton();
if (await proceedBtn.isVisible()) {
  await proceedBtn.click();
### Interactive Debugging

```js
// Pause execution for interactive debugging (access page, inspect, etc.)
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug-screenshot.png' });

// Full page screenshot
await page.screenshot({ path: 'full-page.png', fullPage: true });

// Console output for debugging
console.log('Current URL:', page.url());
```

### In Cucumber Context

**Automatic screenshot capture on failure** is handled by the [After hook](./cucumber.md#after-hook):
- Screenshots saved to `test-results/screenshots/`
- Automatically attached to Cucumber report
- No manual action needed in DSL/Page Objects

For debugging tests locally, use `logger.info()` in step definitions and DSL methods instead of `console.log()`:

```js
// Step Definition
When('I search for a flight', async function () {
  logger.info('Searching for one-way flight', { from, to });
  await FlightSearch.searchFlightOneWay(this.page, from, to);
}

## Screenshots and Debugging

```js
// Pause execution for interactive debugging
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug-screenshot.png' });

// Full page screenshot
await page.screenshot({ path: 'full-page.png', fullPage: true });

// Console output for debugging
console.log('Current URL:', page.url());
```

## Common Patterns (hard to maintain, brittle)
this.page.locator('div > ul > li:first-child > button');

// ❌ Arbitrary timeouts without explanation
await page.waitForTimeout(5000);

// ❌ No auto-retry assertions
const text = await element.textContent();
expect(text).toBe('Expected');  // Use await expect(element).toHaveText()

// ❌ Locators defined in test/DSL (should be in SELECTORS)
await page.click('.submit-button');  // Move to Page Object SELECTORS

// ❌ Assertions in Page Objects (belongs in DSL)
// Page Objects should only have getters and actions, not assertions
class CartPage {
  async expectStatusVisible() {  // ❌ WRONG: assertion logic in Page Object
    await expect(...).toBeVisible();
  }
}

// ✅ CORRECT: DSL contains assertions, Page Objects have actions
// CartPage.js
async getStatus() {
  return await this.page.locator(SELECTORS.STATUS).textContent();
}

// Cart.js (DSL)
async expectStatus(page, expectedStatus) {
  const cartPage = new CartPage(page);
  const locator = page.locator(SELECTORS.STATUS);
  await expect(locator).toContainText(expectedStatus);
}
await this.page.locator(SELECTORS.FLIGHT_CARD).first().click();
await this.page.locator(SELECTORS.FLIGHT_CARD).nth(2).click();
```

## Anti-Patterns

```js
// ❌ Deep CSS chains
this.page.locator('div > ul > li:first-child > button');

// ❌ Arbitrary timeouts without explanation
await page.waitForTimeout(5000);

// ❌ No auto-retry assertions
const text = await element.textContent();
expect(text).toBe('Expected');  // Use expect(element).toHaveText()

// ❌ Locators defined in test/DSL (should be in SELECTORS)
await page.click('.submit-button');  // Move to Page Object SELECTORS
```

## Checklist

- [ ] Selectors defined in SELECTORS const in Page Objects
- [ ] Use specific selectors (not generic)
- [ ] Trust Playwright auto-waiting for basic actions
- [ ] Use `expect()` assertions with auto-retry (in DSL/Page Objects)
- [ ] Comment any `waitForTimeout()` usage
- [ ] Wait for loading states explicitly
- [ ] Handle race conditions with `Promise.race`
- [ ] Use `page.pause()` for interactive debugging
- [ ] Assertions in DSL, not in Page Objects
- [ ] No Playwright code in step definitions (call DSL instead)
