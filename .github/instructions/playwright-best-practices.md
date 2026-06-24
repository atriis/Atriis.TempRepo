---
applyTo: src/pages/, src/dsl/
description: Wait strategies, race-condition handling, and form/dynamic-content patterns for Playwright in Page Objects and DSL methods.
---

# Playwright Best Practices

## Scope

**Only Page Objects (`src/pages/`) and DSL methods (`src/dsl/`) touch Playwright directly.** Gherkin scenarios and step definitions call DSL and never use Playwright APIs.

This file covers the Playwright-specific concerns that other instruction files don't:

- **Selectors** — `SELECTORS` constant, locator declaration, selector types/priority: see [`page-objects.md`](./page-objects.md).
- **Assertions** — auto-retry `expect()`, and the critical-state-validation exception that lets assertions live in DSL: see [`dsl.md`](./dsl.md).

The rest of this guide is about **waits**, **race conditions**, and **dynamic content** — where most flakiness comes from.

## Waiting Strategies

### Hard rule: no hardcoded sleeps

Never park the test on a fixed timer to "wait for things to settle". When something is slow or racy, escalate in this order:

1. **`waitForSelector` / `locator.waitFor({ state })`** — wait for the *actual* element/state you depend on. Always preferred.
2. **Bump the timeout** on that wait/assertion (e.g. `{ timeout: 60000 }`) — when the element is correct but the backend is slow.
3. **`waitForLoadState('networkidle')`** — last resort, when there is no single element to anchor on.

`waitForTimeout` is a last-last resort and must carry a comment explaining the specific reason.

### Auto-waiting (trust it for basic actions)

Playwright auto-waits for actionability on `click`/`fill`/etc. Don't precede them with a manual visibility wait.

```js
// ✅ GOOD: Playwright waits automatically
await this.page.click(SELECTORS.BUTTON);
await this.page.fill(SELECTORS.INPUT, 'text');
```

### Explicit waits (when you depend on a specific state)

```js
// ✅ Wait for a state transition (spinner appears then disappears)
await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'visible' });
await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });

// ✅ Wait for a specific element to be ready
await element.waitFor({ state: 'visible', timeout: 30000 });

// ✅ waitForText helper — waits for an element to contain text
const { waitForText } = require('@utils/wait');
await waitForText(page, SELECTORS.STATUS_LABEL, 'Pending booking');
```

Always pass an explicit `timeout` on `waitFor` calls.

### Acceptable vs unacceptable timeouts

```js
// ✅ ACCEPTABLE: documented workaround for a known animation
await page.waitForTimeout(500);  // Calendar widget has a known open animation delay

// ❌ BAD: arbitrary sleep with no reason — use waitForSelector instead
await page.waitForTimeout(3000);
```

## Race Conditions

When more than one outcome is possible (e.g. a checkout heading *or* a "proceed" button can appear next), don't guess which — race them, then act on whichever won.

```js
// ✅ GOOD: race two possible outcomes, swallow the loser's timeout
await Promise.race([
  checkoutHeading.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
  proceedBtn.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
]);

// Then handle whichever actually appeared
if (await proceedBtn.isVisible()) {
  await proceedBtn.click();
}
```

## Forms and Inputs

### Filling fields

```js
// ✅ GOOD: this.page.fill with SELECTORS
await this.page.fill(SELECTORS.TRAVELER_NAME_FIELD, name);
await this.page.fill(SELECTORS.EMAIL_INPUT, email);
```

### Autocomplete / typeahead fields

These are a common race source: the dropdown options load asynchronously after typing, so you must wait for the option before selecting it — never assume it's there.

```js
// ✅ GOOD: type, wait for the option, then select
await this.page.fill(SELECTORS.FROM_PLACEHOLDER, city);
await this.page.waitForSelector(SELECTORS.AUTOCOMPLETE_OPTION, { state: 'visible' });
await this.page.click(SELECTORS.AUTOCOMPLETE_OPTION);
```

### Clicking and dropdowns

```js
// ✅ Direct click
await this.page.click(SELECTORS.FLIGHT_TAB);

// ✅ Nth match
await this.page.locator(SELECTORS.TRIP_TYPE).nth(0).click();

// ✅ Hover to reveal, then click (dropdown menus)
await this.page.hover(SELECTORS.DROPDOWN_ICON);
await this.page.click(SELECTORS.DROPDOWN_OPTION);
```

## Dynamic Content

### Loading states

Anchor on the loading indicator's lifecycle rather than sleeping past it.

```js
// ✅ GOOD: wait for loading to finish
async waitForSearchComplete() {
  await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'visible' });
  await this.page.waitForSelector(SELECTORS.LOADING_SPINNER, { state: 'hidden' });
}
```

### Network state

```js
// ✅ Last resort when there's no element to anchor on
await page.waitForLoadState('networkidle');
```

### Conditional elements

Some elements (modals, "proceed with change" prompts) appear only sometimes. Check visibility before acting.

```js
// ✅ GOOD: only act if the element is actually present
const proceedBtn = cartPage.getProceedWithChangeButton();
if (await proceedBtn.isVisible()) {
  await proceedBtn.click();
}
```

## Debugging

Screenshots on failure are captured automatically by the Cucumber [After hook](./cucumber.md#after-hook) (saved to `test-results/screenshots/` and attached to the report) — no manual action needed.

For local debugging use `page.pause()` to step interactively, and `logger.info()` (not `console.log()`) in DSL/step definitions so output stays consistent with the project logger.

## Anti-Patterns

```js
// ❌ Hardcoded sleep instead of waiting for the real state
await page.waitForTimeout(5000);

// ❌ Selecting an autocomplete option without waiting for it to load
await this.page.fill(SELECTORS.FROM_PLACEHOLDER, city);
await this.page.click(SELECTORS.AUTOCOMPLETE_OPTION);  // may not exist yet

// ❌ Manual visibility check that races — use auto-retry expect() (see dsl.md)
const isVisible = await locator.isVisible();
expect(isVisible).toBe(true);
```

## Checklist

- [ ] No hardcoded sleeps — `waitForSelector` > timeout bump > `waitForLoadState('networkidle')`
- [ ] Any `waitForTimeout()` carries a comment explaining the specific reason
- [ ] Trust Playwright auto-waiting for basic `click`/`fill`
- [ ] Explicit `waitFor` calls include a `timeout`
- [ ] Multiple possible outcomes handled with `Promise.race`
- [ ] Autocomplete options awaited before selection
- [ ] Loading states anchored on the spinner lifecycle, not sleeps
- [ ] Conditional elements guarded with a visibility check
- [ ] Selectors → `page-objects.md`; assertions → `dsl.md`
