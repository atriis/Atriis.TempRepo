---
applyTo: src/, tests/
description: Naming standards for files, classes, methods, variables, and tests.
---

# Naming Conventions

## Files

| Type | Pattern | Location | Example |
|------|---------|----------|---------|
| Page Object | `*Page.js` | `src/pages/` | `FlightSearchPage.js` |
| Shared Page Object | `*Page.js` | `src/pages/` | `CommonPage.js` |
| DSL | `*.js` | `src/dsl/` | `FlightSearch.js`, `Cart.js` |
| DSL Barrel | `index.js` | `src/dsl/` | `index.js` |
| Helper | `*.helper.js` | `src/utils/` | `calendar.helper.js`, `route.helper.js` |
| Utility | `*.js` | `src/utils/` | `wait.js`, `dom.js`, `text.js` |
| Data Generator | `generate*.js` | `src/utils/data/` | `generateRandomGuestData.js` |
| Test Data | `*.json` | `src/data/` | `flights.json`, `tripStatus.json` |
| Feature File | `*.feature` | `tests/features/` | `flight_add_to_cart.feature` |
| Step Definition | `*.steps.js` | `tests/steps/` | `flight_search.steps.js`, `car_search.steps.js` |
| Hook File | `*.js` | `tests/support/` | `hooks.js`, `world.js` |

### File Naming Examples

```
✅ GOOD                              ❌ BAD
FlightSearchPage.js                  flightSearch.js
CommonPage.js                        header.js
calendar.helper.js                   calendarUtils.js
flight_search.steps.js               flightTest.js
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
const flightSearchPage = getPageObject(page, FlightSearchPage);
const searchPage = getPageObject(page, SearchPage);
const routeKey = generateRandomFlightRoute('europe');

// ❌ BAD
const fsp = getPageObject(page, FlightSearchPage);     // Not descriptive
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

## Gherkin Scenario Names

Use descriptive user-intent statements:

```gherkin
# ✅ GOOD
Scenario: Search for one-way domestic flight
Scenario: Book round-trip intercontinental flight
Scenario: Add passenger to flight booking
Scenario: Cancel trip and receive refund

# ❌ BAD
Scenario: Test search
Scenario: Check functionality
Scenario: Verify page loads
Scenario: User does something
```

## Gherkin Steps

Use domain language (user intent), not UI language:

```gherkin
# ✅ GOOD
Given I am logged in as "ruimariano" booking a new trip
When I search for a one-way flight from "LHR" to "MAD"
Then I should see available flight options

# ❌ BAD
Given I click login button with ID submit-btn
When I click #search and fill #from with LHR
Then the results div with class flight-options should be visible
```

## Commit Messages

Commit naming follows Conventional Commits (`<type>(<scope>): <subject>`). See [commit-guidelines.md](commit-guidelines.md) for types, scopes, examples, and the pre-commit checklist.

## Summary Checklist

**Files:**
- [ ] Page Objects end with `Page.js`
- [ ] Helpers end with `.helper.js`
- [ ] Feature files end with `.feature`, step definitions with `.steps.js`
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
