---
applyTo: src/, tests/
description: Fast cheat-sheet — skeletons, pointers, and folder navigation. Full patterns live in dsl.md, page-objects.md, cucumber.md.
---

# Quick Reference Guide

A scannable index. For full templates and rules, follow the pointers to the
authoritative files: [dsl.md](dsl.md), [page-objects.md](page-objects.md),
[cucumber.md](cucumber.md).

## Project Structure

```
src/
├── config/      # URLs, viewport, user discovery
├── pages/       # Page Objects (SELECTORS const + class)
├── dsl/         # Business workflows (object literals); index.js = barrel
├── utils/       # Helpers & utilities (data/ = generators)
├── assertions/  # Custom assertions
└── data/        # Test data (JSON)
tests/
├── features/    # Cucumber .feature files, grouped by domain
│               #   (flights, hotels, cars, rails, ground_transport,
│               #    parking, manual_quote, smoke, shell)
├── steps/       # Step definitions (Gherkin → DSL)
└── support/     # Hooks (Before/After) & world.js
```

## Code Skeletons

### Page Object — `SELECTORS` const outside the class, then a class of atomic actions

```js
const SELECTORS = { SUBMIT_BUTTON: '.btn-submit' };

class MyPage {
  constructor(page) { this.page = page; }
  async clickSubmit() { await this.page.click(SELECTORS.SUBMIT_BUTTON); }
}

module.exports = MyPage; // or: { MyPage, SELECTORS }
```

Full pattern (locator rules, shared pages, anti-patterns): see [page-objects.md](page-objects.md).

### DSL — object literal, `page` is always the first argument

```js
const { getPageObject } = require('@utils/pageObjectCache');

const MyWorkflow = {
  async performBusinessAction(page, data) {
    const myPage = getPageObject(page, MyPage);
    await myPage.fillName(data.field1);
    return { success: true };
  },
};

module.exports = MyWorkflow;
```

Full pattern (naming, return values, logging, error messages): see [dsl.md](dsl.md).
Always instantiate Page Objects via `getPageObject(page, PageClass)`, never `new PageClass(page)`.

### Step Definition — match Gherkin, log, call DSL (never raw Playwright)

```js
const { When } = require('@cucumber/cucumber');
const { FlightSearch } = require('@dsl');

When('I search for a one way flight from {string} to {string}',
  async function (from, to) {
    await FlightSearch.searchFlightOneWay(this.page, { from, to });
  });
```

`this` is the World: `this.page`, `this.context`, `this.browser`.
Full step patterns, parameter types, and best practices: see [cucumber.md](cucumber.md#step-definitions).

### Feature File — `@tags`, `Feature`, `Background`, `Scenario`

```gherkin
@regression @flights
Feature: One-Way Flight Search
  Background:
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip

  Scenario: Search returns available flights
    When I search for a one way flight from "lhrToMad"
    Then flight results should be displayed
```

Gherkin keywords, Scenario Outline, and best practices: see [cucumber.md](cucumber.md#feature-files).

## Helper Functions

| Helper (`@utils/...`) | Use |
|------------------------|-----|
| `calendar.helper` → `selectDatesByNthAvailable(page, { startIndex, endIndex })` | Pick dates by Nth available; `endIndex: null` = one-way |
| `wait` → `waitForText(page, SELECTOR, 'text')` | Wait until element contains text |
| `route.helper` → `resolveRoute(input, routes, 'flight')` | Resolve route key OR inline `{ from, to }` → `{ from, to }` |
| `data/generateRandomGuestData()` | → `{ firstName, lastName, dateOfBirth, email, phone }` |
| `data/generateRandomFlightRoute('europe')` | → route key, e.g. `'lhrToMad'` |

## Common Commands

```bash
npx cucumber-js                                          # all tests
npx cucumber-js tests/features/flights/general/x.feature # one feature
npx cucumber-js --tags "@smoke"                          # by tag
npx cucumber-js --tags "@smoke and @flights"             # combine tags
npx cucumber-js --dry-run                                # parse, don't run
```

Full command, tag, and CI/retry reference: see [cucumber.md](cucumber.md#running-tests).

## Data Structure: flights.json

Routes are grouped by region; each entry is `{ from, to }`. A `defaultRoute` key
names the fallback. Reference by key (e.g. `'lhrToMad'`) in features/DSL.

```json
{ "routes": { "europe": { "lhrToMad": { "from": "LHR", "to": "MAD" } } },
  "defaultRoute": "lhrToMad" }
```

## Debugging Tips

```js
await page.pause();                                 // interactive inspector
await page.screenshot({ path: 'screenshot.png' });  // capture
console.log('URL:', page.url());                    // (in DSL prefer logger)
```

For undefined steps, hook failures, and timeouts: see [cucumber.md](cucumber.md#troubleshooting).

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
