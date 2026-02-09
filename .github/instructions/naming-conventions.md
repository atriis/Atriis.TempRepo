---
applyTo: src/, tests/
description: Naming standards for files, classes, methods, variables, tests, and commits.
---

# Naming Conventions

## Files

| Type | Pattern | Location | Example |
|------|---------|----------|---------|
| Page Object | `*Page.js` | `src/pages/` | `FlightSearchPage.js` |
| Shared Page Object | `*Page.js` | `src/pages/` | `CommonPage.js`, `GeneralElementsPage.js` |
| DSL | `*.js` | `src/dsl/` | `FlightSearch.js`, `Cart.js` |
| DSL Barrel | `index.js` | `src/dsl/` | `index.js` |
| Helper | `*.helper.js` | `src/utils/` | `calendar.helper.js`, `route.helper.js` |
| Utility | `*.js` | `src/utils/` | `wait.js`, `dom.js`, `text.js` |
| Data Generator | `generate*.js` | `src/utils/data/` | `generateRandomGuestData.js` |
| Test Data | `*.json` | `src/data/` | `flights.json`, `tripStatus.json` |
| Playwright Test | `*.spec.js` | `tests/regression/` | `general-flight-add-to-cart.spec.js` |
| Feature File | `*.feature` | `tests/features/` | `flight_add_to_cart.feature` |
| Step Definition | `*.steps.js` or `*.step.js` | `tests/steps/` | `flight.steps.js`, `cars.step.js` |
| Fixture | `*.js` | `tests/fixtures/` | `supplierTest.js` |

### File Naming Examples

```
✅ GOOD                              ❌ BAD
FlightSearchPage.js                  flightSearch.js
CommonPage.js                        header.js
calendar.helper.js                   calendarUtils.js
general-flight-add-to-cart.spec.js   flightTest.js
flight_add_to_cart.feature           flights.feature
generateRandomGuestData.js           randomData.js
```

## Classes (Page Objects Only)

Use **PascalCase** nouns. Only Page Objects use classes in this project:

```js
// ✅ GOOD
class FlightSearchPage { }
class FlightResultsPage { }
class CartPage { }
class CommonPage { }

// ❌ BAD
class flightSearch { }       // Should be PascalCase
class FSP { }                // Not descriptive
```

## DSL Objects

DSLs are **object literals**, named with PascalCase:

```js
// ✅ GOOD
const FlightSearch = { ... };
const Cart = { ... };
const Search = { ... };

// ❌ BAD — not a class
class FlightSearch { constructor(page) { } }
```

## Methods

Use **camelCase** verbs that describe actions or queries.

### DSL Methods (Business Actions)

```js
// ✅ GOOD
searchFlightOneWay(page, routeInput)
searchFlightRoundTrip(page, routeInput)
searchRoundTripRandomFlight(page, region)
addMeAsTraveler(page)
cancelTripStrict(page)
expectBookingStatus(status, { page })

// ❌ BAD
search(page)              // Not specific enough
doBooking(page)           // Don't use 'do'
```

### Page Object Methods (Technical Actions)

```js
// ✅ GOOD
clickFlightTab()
selectCompleteTrip()
fillInFromField(city)
waitForTripOverviewTitle()
hoverTripActionsDropdownIcon()

// ❌ BAD
searchFlight()            // Too business-focused for Page Object
doStuff()                 // Vague
```

### Query Methods (Return Data)

Start with `get`, `is`, `has`:

```js
// ✅ GOOD
getOOPTooltipTextCart()
isTripCancelledMessageVisible()
getProceedWithChangeButton()

// ❌ BAD
tooltipText()             // Unclear it returns data
checkModal()              // Sounds like it does something
```

## SELECTORS Constants

Use **UPPER_SNAKE_CASE** in the `SELECTORS` object:

```js
// ✅ GOOD
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  TRIP_TYPE: '.search-for-select .el-radio',
  QUOTE_STATUS_LABEL: '.app-label--quote',
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
};

// ❌ BAD
const SELECTORS = {
  flightTab: '#tab-flight',        // Should be UPPER_SNAKE_CASE
  'flight-tab': '#tab-flight',     // No kebab-case
};
```

## Variables

Use **camelCase** descriptive nouns:

```js
// ✅ GOOD
const flightSearchPage = new FlightSearchPage(page);
const searchPage = new SearchPage(page);
const routeKey = generateRandomFlightRoute('europe');

// ❌ BAD
const fsp = new FlightSearchPage(page);     // Not descriptive
const SearchResults = [];                    // Should be camelCase
```

### Boolean Variables

Prefix with `is`, `has`, `should`, `can`:

```js
// ✅ GOOD
const isVisible = await proceedBtn.isVisible();
const wasCancelled = await cartPage.isTripCancelledMessageVisible();
let clickedModal = false;

// ❌ BAD
const visible = false;
const cancelled = true;
```

## Test Names

Use descriptive sentences with tags:

```js
// ✅ GOOD
test.describe('[@regression] Add Flight to Cart Flows', () => {
  test('[@priority:critical] Add One-Way Flight to Cart – Should complete one-way add to cart flow', ...);
  test('[@priority:critical] Add Round Trip Flight to Cart – Should complete round trip add to cart flow', ...);
});

// ❌ BAD
test('search test', ...);
test('it works', ...);
test('verify search', ...);
```

## Cucumber Scenarios

```gherkin
# ✅ GOOD
Scenario: Search for one-way domestic flight
Scenario: Book round-trip intercontinental flight

# ❌ BAD
Scenario: Test search
Scenario: Check functionality
```

## Commit Messages

Format: `<type>(<scope>): <message>`

### Types

- `feat` — New feature
- `fix` — Bug fix
- `refactor` — Code restructuring
- `test` — Adding/updating tests
- `docs` — Documentation changes
- `chore` — Maintenance tasks

### Examples

```
✅ GOOD
feat(search): add random flight route selection by region
fix(cart): prevent duplicate items from being added
refactor(data): group flight routes by region in flights.json
test(flights): add intercontinental roundtrip search test
docs(instructions): update DSL guidelines to match actual patterns

❌ BAD
update files
fix bugs
changes
WIP
```

### Guidelines

- Max 80 characters for subject line
- Use imperative mood ("add" not "added")
- Be specific about what changed
- Include affected domain/component in scope

## Summary Checklist

**Files:**
- [ ] Page Objects end with `Page.js`
- [ ] Helpers end with `.helper.js`
- [ ] Tests end with `.spec.js` or `.feature`
- [ ] Data generators start with `generate`

**Code:**
- [ ] Page Object classes use PascalCase
- [ ] DSL objects use PascalCase
- [ ] Methods use camelCase
- [ ] SELECTORS use UPPER_SNAKE_CASE
- [ ] Variables use camelCase
- [ ] Booleans prefixed with `is`/`has`/`was`/`should`/`can`

**Tests:**
- [ ] Test names include tags and business intent
- [ ] Commit messages follow `type(scope): message` format
