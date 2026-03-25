---
applyTo: tests/features/, tests/steps/, tests/support/
description: Cucumber BDD framework configuration, execution flow, hooks, world setup, and integration patterns for this project.
---

# Cucumber BDD Implementation Guide

## Overview

This project uses **Cucumber.js** (^12.6.0) to execute Gherkin feature files as behavior-driven tests. Cucumber integrates Playwright for browser automation and provides a human-readable test interface.

### Execution Flow

```
Feature File (Gherkin)
    ↓
Cucumber Parser (reads .feature files)
    ↓
Step Definition Matcher (finds matching step functions)
    ↓
Before Hook (sets up browser, logs in, books new trip)
    ↓
Step Functions Execute (call DSL methods)
    ↓
After Hook (captures screenshot on failure, records for retry)
    ↓
Cucumber Report (json, junit, progress formatters)
```

---

## Configuration

### cucumber.js

Located at root, defines how Cucumber runs tests:

```javascript
module.exports = {
  default: {
    // Load order matters: World first, then hooks, then steps
    require: [
      'tests/support/world.js',           // World class
      'tests/support/hooks.js',           // Before/After hooks
      'tests/support/retry-handler.js',   // CI retry logic
      'tests/steps/**/*.js',              // All step definitions
      'tests/support/**/*.js'             // Support files
    ],
    
    // Output formats
    format: [
      'progress',                         // Console progress
      '@cucumber/pretty-formatter',       // Colored output
      'json:test-results/cucumber-report.json',  // JSON for CI/reports
      'junit:test-results/cucumber-junit.xml'    // JUnit for integrations
    ],
    
    // Retry: Only in CI, configured by environment variables
    retry: process.env.CI ? 1 : 0,  // Retry once in CI; never locally
  }
}
```

### Running Tests

```bash
# All tests
npx cucumber-js

# Specific feature file
npx cucumber-js tests/features/flights/general/one_way_search.feature

# By tags (smoke tests)
npx cucumber-js --tags "@smoke"

# Multiple tag filters (AND logic)
npx cucumber-js --tags "@flights and @priority:critical"

# Exclude tags (NOT logic)
npx cucumber-js --tags "not @slow"

# List scenarios without executing (dry-run)
npx cucumber-js --dry-run

# Strict mode (fail if skipped scenarios exist)
npx cucumber-js --strict

# Publish report to Cucumber Cloud
npx cucumber-js --publish

# With retry in CI
CI=true RETRY_COUNT=3 RETRY_DELAY=2000 npx cucumber-js
```

---

## World and Hooks

### World (`tests/support/world.js`)

The **World** is a shared context object passed to every step function as `this`.

```javascript
class CustomWorld {
  constructor() {
    this.browser = null;      // Playwright Browser
    this.context = null;      // Playwright BrowserContext
    this.page = null;         // Playwright Page
  }
  
  async init() {
    // Initialize browser (called by hooks)
  }
  
  async cleanup() {
    // Close browser (called by After hook)
  }
}
```

**Accessing in step definitions:**

```javascript
Given('I am on the search page', async function () {
  // this = CustomWorld instance
  await this.page.goto('/search');  // Access page
});
```

### Before Hook (`tests/support/hooks.js`)

Runs **before every scenario** to set up browser, context, and login.

#### Setup Flow

1. **Detect provider & user from environment/tags**
   ```bash
   # Environment variables (highest priority)
   PROVIDER=galileo USER_KEY=user_two npx cucumber-js
   
   # Feature tags (medium priority)
   @provider:lufthansa @user:user_three
   Scenario: ...
   
   # Defaults (lowest priority)
   provider: "amadeus"
   userKey: "user_one"
   ```

2. **Validate user exists in config**
   ```javascript
   const user = config.users?.[provider]?.[userKey];
   if (!user) throw new Error(`User not found...`);
   ```

3. **Launch browser & create context**
   ```javascript
   this.browser = await launchBrowser();
   this.context = await this.browser.newContext({
     viewport: { width: 1920, height: 1080 },
     screen: { width: 1920, height: 1080 },
     ignoreHTTPSErrors: true,
   });
   this.page = await this.context.newPage();
   ```

4. **Navigate & login**
   ```javascript
   await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
   await App.loginAs(this.page, user);
   ```

5. **Book new trip** (unless `@loginOnly` tag present)
   ```javascript
   if (!isLoginOnly(pickle)) {
     this.page = await App.bookANewTrip(this.page);
   }
   ```

#### Skip Before Hook

If a scenario uses **parameterized login steps**, the Before hook detects and skips:

```gherkin
# Before hook SKIPS (parameterized login)
Scenario: Search flights
  Given I am logged in as "amadeus" "user_one"
  # ^ Before hook auto-skips; this step handles login

# Before hook RUNS (no parameterized login)
Scenario: Public page test
  When I navigate to landing page
  Then landing page loads
```

### After Hook (`tests/support/hooks.js`)

Runs **after every scenario** (even if failed).

#### On Failure

1. **Capture screenshot**
   ```javascript
   const screenshot = await this.page.screenshot({ fullPage: true });
   ```

2. **Save to disk**
   ```
   test-results/screenshots/
   ├── scenario_name_TIMESTAMP.png
   ├── flight_search_TIMESTAMP.png
   └── ...
   ```

3. **Attach to Cucumber report**
   ```javascript
   this.attach(screenshot, 'image/png');
   ```

4. **Record for retry** (CI only)
   ```javascript
   recordFailure(scenario.pickle.name);
   ```

#### Cleanup

Always closes browser, context, and page:

```javascript
if (this.page) await this.page.close();
if (this.context) await this.context.close();
if (this.browser) await this.browser.close();
```

---

## Step Definitions

### Location & Organization

```
tests/steps/
├── flight_search.steps.js    # All flight search steps
├── flight_results.steps.js   # All flight results steps
├── hotel_search.steps.js     # All hotel search steps
├── cart.steps.js             # Cart operations
├── checkout.steps.js         # Checkout workflow
├── common.steps.js           # Generic steps (assertions, helpers)
├── app.steps.js              # App-level steps (login, navigation)
└── smoke.steps.js            # Smoke test specific steps
```

**Rule**: Group steps by **feature/domain**, not by step type (Given/When/Then).

### Pattern

Every step definition:
- **Matches** Gherkin text with parameters
- **Logs** the action (for debugging)
- **Calls DSL** method (never direct Playwright)
- **Handles** errors gracefully

#### Basic Example

```javascript
const { When } = require('@cucumber/cucumber');
const { FlightSearch } = require('@dsl');
const logger = require('@utils/logger').child('FlightSearch');

When("I search for a one way flight from {string} to {string}", 
  async function (from, to) {
    // Log the action
    logger.info('Searching for one-way flight', { from, to });
    
    // Call DSL (never raw Playwright)
    await FlightSearch.searchFlightOneWay(this.page, { from, to });
  }
);
```

### Parameter Types

| Type | Format | Example |
|------|--------|---------|
| String | `{string}` | "LHR", "user_one", "amadeus" |
| Number | `{int}` | 2, 42, 3 |
| Float | `{float}` | 1.5, 99.99, 1234.567 |

```javascript
// String parameter
When('I search from {string}', async function (cityCode) {
  // cityCode = "LHR"
});

// Multiple parameters
When('I book {int} seats for {float} each', async function (count, price) {
  // count = 2 (number)
  // price = 150.50 (float)
});
```

### Best Practices

#### ✅ DO

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');
const { FlightSearch, Cart } = require('@dsl');
const logger = require('@utils/logger').child('FlightSearch');

// 1. Log what you're doing
When('I search for a flight', async function () {
  logger.info('Searching for flight');
  await FlightSearch.search(this.page);
});

// 2. Use parameters for variables
When('I search from {string} to {string}', async function (from, to) {
  await FlightSearch.searchRoute(this.page, from, to);
});

// 3. Handle errors with context
Then('flight results are displayed', async function () {
  const visible = await FlightSearch.verifyResultsVisible(this.page);
  if (!visible) {
    throw new Error('Flight results not visible after search');
  }
});

// 4. Call DSL methods, not Page Objects
When('I add the flight to cart', async function () {
  await Cart.addFlight(this.page);  // ✅ DSL
});
```

#### ❌ DON'T

```javascript
// 1. Don't use raw Playwright
When('I search', async function () {
  await this.page.click('#search-button');  // ❌ Direct Playwright
});

// 2. Don't hardcode data
When('I search', async function () {
  await FlightSearch.search(this.page, "LHR");  // ❌ Hardcoded
});

// 3. Don't call Page Objects directly
When('I click search', async function () {
  const page = new FlightSearchPage(this.page);  // ❌ Direct PO
  await page.clickSearch();
});

// 4. Don't silently fail
Then('results show', async function () {
  const visible = await FlightSearch.verifyVisible(this.page);
  // ❌ No error thrown if invisible
});
```

### Existing Step Catalog

Reference existing steps before creating new ones:

```bash
# View all available steps
grep -r "When\|Then\|Given" tests/steps/*.js | grep -v "module.exports"
```

**Common patterns already implemented:**

- **Flight search**: `I search for a one way flight from {string} to {string}`
- **Hotel search**: `I search for hotels in {string}`
- **Cart operations**: `I add the flight to cart`, `I proceed to checkout`
- **Assertions**: `the flight should be visible`, `the price should equal {float}`
- **Navigation**: `I navigate to the trips page`, `I logout`

---

## Feature Files

### Organization

```
tests/features/
├── flights/
│   ├── general/           # Tests across all providers
│   │   ├── one_way_search.feature
│   │   ├── round_trip_search.feature
│   │   └── add_to_cart.feature
│   ├── smoke/             # Critical path tests
│   │   └── smoke.feature
│   └── supplier-specific/ # Provider-specific tests
│       ├── lufthansa.feature
│       └── air_france.feature
├── hotels/
│   ├── general/
│   └── supplier-specific/
├── cars/
├── rails/
├── ground_transport/
├── parking/
├── manual_quote/
└── shell/                 # Basic tests (no complex workflows)
```

### Structure

```gherkin
# tests/features/flights/general/one_way_search.feature

@regression @flights
Feature: One-Way Flight Search
  As a travel booker
  I want to search for one-way flights
  So that I can find the best option

  Background:
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler

  @priority:critical
  Scenario: Search returns available flights
    When I search for a one way flight from "lhrToMad"
    Then flight results should be displayed
    And the price should be greater than 0

  @priority:high @slow
  Scenario Outline: Search in different regions
    When I search for a one way flight from "<route>"
    Then flight results should be displayed

    Examples:
      | route      |
      | lhrToMad   |
      | cdgToLhr   |
      | nycToLax   |
```

### Gherkin Keywords

| Keyword | Purpose | Use |
|---------|---------|-----|
| `Feature:` | Feature description | Title, user story, benefit |
| `Background:` | Shared setup | Login, traveler setup (runs before each scenario) |
| `Scenario:` | Single test case | One business outcome |
| `Scenario Outline:` | Parameterized test | Multiple data variations |
| `Given` | Precondition | System state before action (setup) |
| `When` | Action | What the user does |
| `Then` | Outcome | What the user expects to see |
| `And` / `But` | Extension | Additional Given/When/Then clauses |
| `Examples:` | Data table | Parameters for Scenario Outline |

### Best Practices

#### ✅ DO

```gherkin
@regression @flights @priority:critical
Feature: Flight Search
  As a travel booker
  I want to search for flights
  So that I can complete my booking

  Background:
    Given I am logged in as "amadeus" "user_one" booking a new trip

  # One scenario = one business outcome
  Scenario: Search returns available flights
    When I search for a one way flight from "lhrToMad"
    Then flight results should be displayed

  # Multiple examples with Scenario Outline
  Scenario Outline: Search in different regions
    When I search from "<from>" to "<to>"
    Then results should display

    Examples:
      | from | to   |
      | LHR  | MAD  |
      | CDG  | LHR  |
```

#### ❌ DON'T

```gherkin
# Don't use technical language
Scenario: Click search button and assert DOM
  # ❌ Technical, not business-focused

# Don't skip Background setup
Scenario: User searches
  Given I click login button
  And I fill email field
  # ❌ Duplicate login code instead of using Background

# Don't use vague assertions
Scenario: Flight search
  Then the page loads
  # ❌ Vague; what specifically?

# Don't hardcode data in Gherkin
Scenario: Search from London to Madrid
  When I enter "LHR" in departure field
  # ❌ Hardcoded; use parameters instead
```

---

## Tags

### Usage

Tags filter which scenarios run. Format: `@tagname`

```gherkin
@regression @flights @priority:critical
Scenario: Search for flights
  ...

@smoke @provider:amadeus
Scenario: Login works
  ...
```

### Standard Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@smoke` | Critical path tests | Login, search, book |
| `@regression` | Full regression suite | All features |
| `@priority:critical` | Must-pass tests | Core functionality |
| `@priority:high` | Important tests | Common workflows |
| `@priority:medium` | Normal tests | Secondary workflows |
| `@slow` | Long-running tests | Full booking flow |
| `@fast` | Quick tests | Validation checks |
| `@provider:PROVIDER` | Provider-specific | `@provider:amadeus`, `@provider:lufthansa` |
| `@user:USERKEY` | User-specific | `@user:user_two`, `@user:user_with_policy` |
| `@loginOnly` | Skip new trip booking | Just login, no trip |
| `@wip` | Work-in-progress | Incomplete scenarios |
| `@skip` | Skip entirely | Broken or disabled |

### Running by Tags

```bash
# Smoke tests
npx cucumber-js --tags "@smoke"

# Regression AND flights
npx cucumber-js --tags "@regression and @flights"

# Critical OR high priority
npx cucumber-js --tags "@priority:critical or @priority:high"

# Everything except slow tests
npx cucumber-js --tags "not @slow"

# Amadeus provider AND regression
npx cucumber-js --tags "@provider:amadeus and @regression"

# Not slow AND not wip
npx cucumber-js --tags "not @slow and not @wip"
```

### Tag Mechanics

**Before Hook** reads tags to determine setup:

```javascript
// Extract provider from tag
function getProviderFromTags(pickle) {
  const tag = pickle.tags.find(t => t.name.startsWith("@provider:"));
  return tag ? tag.name.replace("@provider:", "") : null;
}

// Extract user from tag
function getUserKeyFromTags(pickle) {
  const tag = pickle.tags.find(t => t.name.startsWith("@user:"));
  return tag ? tag.name.replace("@user:", "") : null;
}

// Check if login-only
function isLoginOnly(pickle) {
  return pickle.tags.some(t => t.name === "@loginOnly");
}
```

---

## Provider & User Configuration

### Config Structure

Located in `src/config/config.js`:

```javascript
const config = {
  baseUrl: "https://atriis-platform.com",
  viewport: { width: 1920, height: 1080 },
  
  users: {
    amadeus: {
      user_one: { email: "user@amadeus.com", password: "pwd" },
      user_two: { email: "user2@amadeus.com", password: "pwd" },
    },
    lufthansa: {
      user_one: { email: "user@luft.com", password: "pwd" },
    },
    // ... other providers
  }
};
```

### Environment Variable Discovery

Users are auto-discovered from environment variables:

```bash
# Env var pattern: PROVIDER_USER_KEY_EMAIL
AMADEUS_USER_ONE_EMAIL="user@amadeus.com"
AMADEUS_USER_TWO_EMAIL="user2@amadeus.com"

# Auto-discovered as:
config.users.amadeus.user_one = { email: "user@amadeus.com", ... }
```

**Config loads in this order:**
1. Environment variables (highest priority)
2. Hardcoded users object
3. File-based configuration

---

## Retry Logic (CI Only)

### When Retry Activates

Retry **only** activates in CI environments:

```bash
# Local development (no retry)
npx cucumber-js

# CI with retry
CI=true RETRY_COUNT=3 RETRY_DELAY=2000 npx cucumber-js
```

### How It Works

**Setup** (`tests/support/retry-handler.js`):

```javascript
// Only retry in CI
retry: process.env.CI ? 1 : 0,

// Configure delay
RETRY_DELAY=2000  // Wait 2 seconds between retries
```

**Failure Recording**:

```javascript
// After Hook records failures for CI retry
if (scenario.result.status === "failed") {
  recordFailure(scenario.pickle.name);
}
```

### Running with Retry

```bash
# CI environment with retry
CI=true RETRY_COUNT=3 RETRY_DELAY=2000 npx cucumber-js

# Retry only specific tag
CI=true npx cucumber-js --tags "@flaky"
```

---

## Execution Examples

### Daily Regression

```bash
# All regression tests (may take 30+ minutes)
npx cucumber-js --tags "@regression"

# Exclude slow tests for faster feedback
npx cucumber-js --tags "@regression and not @slow"
```

### Smoke Testing

```bash
# Quick smoke (5-10 minutes)
npx cucumber-js --tags "@smoke"

# Smoke by provider
npx cucumber-js --tags "@smoke and @provider:amadeus"
```

### Provider-Specific Testing

```bash
# All Lufthansa tests
npx cucumber-js --tags "@provider:lufthansa"

# Critical Lufthansa tests
npx cucumber-js --tags "@provider:lufthansa and @priority:critical"
```

### Feature Development

```bash
# New flight feature in progress
npx cucumber-js tests/features/flights/general/new_feature.feature

# With dry-run to parse without executing
npx cucumber-js tests/features/flights/general/new_feature.feature --dry-run
```

### CI Pipeline

```bash
# Full suite with retry
CI=true RETRY_COUNT=2 RETRY_DELAY=1000 npx cucumber-js

# Critical tests first
CI=true npx cucumber-js --tags "@priority:critical"

# Then regression
CI=true npx cucumber-js --tags "@regression"
```

---

## Common Patterns

### Parameterized Login

Use when you need multiple users in one test:

```gherkin
Scenario: Different users see different pricing
  Given I am logged in as "amadeus" "user_one"
  When I search for a flight
  Then the price should equal {float}
```

**Step definition:**

```javascript
Given('I am logged in as {string}', 
  async function (userKey) {
    const { provider, userConfig } = config.resolveUser(userKey);
    if (!userConfig) throw new Error(`User not found`);
    
    await this.page.goto(config.baseUrl);
    await App.loginAs(this.page, userConfig);
  }
);
```

### Shared Context in Steps

Data passed between steps via `this.world`:

```javascript
// First step: store data
When('I select a flight', async function () {
  const flight = await FlightSearch.getFirstFlight(this.page);
  this.selectedFlight = flight;  // Store for later steps
});

// Later step: use stored data
Then('the flight should be in cart', async function () {
  const cartFlight = await Cart.getFirstFlight(this.page);
  if (cartFlight.id !== this.selectedFlight.id) {
    throw new Error('Wrong flight in cart');
  }
});
```

### Error Messages with Context

Always provide diagnostic info:

```javascript
Then('flight price is correct', async function () {
  const displayedPrice = await FlightSearch.getPrice(this.page);
  const expectedPrice = 450.00;
  
  if (displayedPrice !== expectedPrice) {
    throw new Error(
      `Price mismatch:\n` +
      `  Expected: $${expectedPrice}\n` +
      `  Actual: $${displayedPrice}\n` +
      `  Difference: $${Math.abs(displayedPrice - expectedPrice)}\n` +
      `  Flight: ${this.selectedFlight?.id || 'unknown'}`
    );
  }
});
```

---

## Troubleshooting

### "Step is undefined"

**Problem**: Gherkin step has no matching step definition.

```
Undefined step: "When I do something unusual"
```

**Solution**:
1. Check spelling in Gherkin vs step definition
2. Check parameter types match: `{string}` vs `{int}`
3. Verify step file is in `tests/steps/`
4. Restart Cucumber process

```bash
# Dry run to find undefined steps
npx cucumber-js --dry-run
```

### "Before hook failed"

**Problem**: Browser launch, login, or trip booking failed.

**Common causes**:
- User not found in config
- Network/timeout during login
- Application unavailable

**Debug**:
```bash
# Run single scenario to isolate
npx cucumber-js tests/features/smoke/smoke.feature

# Check logs for specific error
# Look in console output for exact failure point
```

### "Timeout waiting for selector"

**Problem**: Page element not found within timeout (120s).

**Solution**:
1. Verify selector is correct (check Page Object)
2. Check application is responsive
3. Increase timeout if genuinely slow:
   ```javascript
   setDefaultTimeout(180000);  // 3 minutes in step file
   ```

### "Retry keeps failing"

**Problem**: Scenario fails multiple times in CI retry.

**Diagnosis**:
1. Check `test-results/screenshots/` for visual evidence
2. Run locally to reproduce:
   ```bash
   npx cucumber-js tests/features/...feature
   ```
3. Check for:
   - Flaky waits (should use explicit waits, not hard delays)
   - Application state issues
   - Network problems

---

## Best Practices Summary

| Practice | Do | Don't |
|----------|----|----|
| **Scenario size** | Small, focused | Large, complex journeys |
| **Parameters** | Use `{string}`, `{int}` | Hardcode values |
| **DSL calls** | Always use DSL | Raw Playwright in steps |
| **Error messages** | Descriptive with context | Silent failures |
| **Logging** | `logger.info()` in steps | `console.log()` |
| **Tags** | Use standard tags | Invent new tag types |
| **Feature files** | Organize by domain | Mix domains |
| **Hooks** | Use for setup/cleanup | Business logic in hooks |
| **World** | Store test data | Complex objects |

---

## Quick Reference

### Commands

```bash
# Run all tests
npx cucumber-js

# By tag
npx cucumber-js --tags "@smoke"

# Dry run
npx cucumber-js --dry-run

# Specific file
npx cucumber-js tests/features/flights/general/one_way_search.feature

# With retry in CI
CI=true RETRY_COUNT=2 npx cucumber-js
```

### Key Files

| File | Purpose |
|------|---------|
| `cucumber.js` | Configuration & formatters |
| `tests/support/world.js` | Context/World class |
| `tests/support/hooks.js` | Before/After lifecycle |
| `tests/steps/*.js` | Step definitions |
| `tests/features/**/*.feature` | Gherkin scenarios |
| `src/dsl/*.js` | Business workflows (called by steps) |
| `src/pages/*.js` | Page Objects (called by DSL) |

### Tag Shortcuts

```bash
npx cucumber-js --tags "@smoke"                    # Smoke tests
npx cucumber-js --tags "@regression"               # Regression suite
npx cucumber-js --tags "@priority:critical"        # Critical tests only
npx cucumber-js --tags "@provider:amadeus"         # Amadeus provider
npx cucumber-js --tags "not @slow"                 # Exclude slow tests
```

