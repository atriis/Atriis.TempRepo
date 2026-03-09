# Atriis Automation Framework

A **Playwright + Cucumber BDD** test automation framework for a corporate travel booking platform.

## Overview

This framework enables behavior-driven testing for a multi-product travel platform supporting flights, hotels, cars, rail, ground transportation, parking, and manual quotes. Tests are written in human-readable Gherkin syntax and execute against multiple suppliers and user types.

### Design Principles

- **Clarity over Cleverness**: Simple, explicit code that non-developers can understand
- **Stability over Speed**: Reliable tests with built-in resilience (timeouts, retries)
- **Separation of Concerns**: Layered architecture keeps business logic, UI interactions, and test scenarios distinct
- **Minimal Duplication**: Reusable DSL methods and utilities prevent test code repetition

### Technology Stack

- **Playwright**: Browser automation and synchronization
- **Cucumber**: BDD test runner and Gherkin feature parsing
- **JavaScript (ES6+)**: Test implementation language
- **Node.js**: Runtime (>=18.0.0 required)

---

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture Layers](#architecture-layers)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Organization](#test-organization)
- [Debugging](#debugging)
- [Contributing](#contributing)

---

## Project Structure

```
atriis-automation/
├── src/
│   ├── config/
│   │   └── config.js                 # Central configuration: URLs, viewport, user discovery
│   ├── pages/                        # Page Object Layer (25+ page classes)
│   │   ├── LoginPage.js              # Login form interactions
│   │   ├── SearchPage.js             # Input forms, traveler selection, date picking
│   │   ├── FlightResultsPage.js      # Flight results, pricing options, fare rules
│   │   ├── CartPage.js               # Trip summary, payment options, trip cancellation
│   │   ├── CheckoutPage.js           # Final booking confirmation
│   │   ├── ResultsPage.js            # Generic result buttons (Add to Trip, Select)
│   │   ├── CommonPage.js             # Shared UI patterns across all pages
│   │   └── ...                       # Additional page objects (Hotels, Cars, Rails, etc.)
│   ├── dsl/                          # Domain-Specific Language Layer (27+ DSL classes)
│   │   ├── App.js                    # Application workflows (login, logout, book trip)
│   │   ├── Search.js                 # Traveler and search field interactions
│   │   ├── FlightSearch.js           # Flight search workflows (one-way, round-trip)
│   │   ├── FlightResults.js          # Flight result selection and pricing
│   │   ├── Flight Pricing.js         # Pricing option selection
│   │   ├── Cart.js                   # Trip management (hold, cancel, share)
│   │   ├── Checkout.js               # Final booking steps
│   │   ├── CartPayment.js            # Payment method selection and card details
│   │   ├── Results.js                # Generic result actions (shared across products)
│   │   ├── HotelSearch.js            # Hotel search flows
│   │   ├── CarSearch.js              # Car rental search flows
│   │   ├── GroundTransportSearch.js  # Ground transport search flows
│   │   ├── BenerailSearch.js         # Rail search (Benerail)
│   │   ├── AmtrakSearch.js           # Rail search (Amtrak)
│   │   └── ...                       # Other product DSLs
│   ├── utils/
│   │   ├── browserFactory.js         # Browser launch with CI detection (headless, slowmo)
│   │   ├── dom.js                    # DOM utilities (getText, extractNumber, scrollToElement)
│   │   ├── wait.js                   # Wait utilities (waitForText with timeout)
│   │   ├── logger.js                 # Structured logging
│   │   ├── calendar.helper.js        # Date picker interactions
│   │   ├── text.js                   # Text formatting utilities
│   │   ├── numbers.js                # Number parsing and validation
│   │   ├── route.helper.js           # Flight route data lookups
│   │   ├── pageObjectCache.js        # Page object instance caching
│   │   ├── priceExtraction.js        # Price parsing from DOM
│   │   ├── search.constants.js       # Search parameter constants
│   │   └── data/
│   │       ├── generateRandomGuestData.js  # Faker-based test data generation
│   │       └── generateRandomFlightRoute.js
│   ├── assertions/
│   │   └── numberAssertions.js       # Reusable number comparison assertions
│   └── data/                         # Static test data (JSON)
│       ├── flights.json
│       ├── hotels.json
│       ├── cars.json
│       ├── cards.json
│       └── ...                       # Other product data
├── tests/
│   ├── features/                     # Cucumber Feature Files (Gherkin)
│   │   ├── smoke/                    # Critical path smoke tests
│   │   ├── flights/
│   │   │   ├── daily_flights/        # Daily regression suite
│   │   │   ├── general/              # General flight booking tests
│   │   │   └── lufthansa/            # Supplier-specific (Lufthansa) tests
│   │   ├── hotels/                   # Hotel booking features
│   │   ├── cars/                     # Car rental features
│   │   ├── ground_transport/         # Ground transport features
│   │   ├── rails/                    # Rail booking features
│   │   ├── manual_quote/             # Manual quote features
│   │   ├── parking/                  # Parking features
│   │   └── shell/                    # Complex multi-product flows
│   ├── steps/                        # Step Definitions (Glue Code)
│   │   ├── app.steps.js              # Login/logout/app-level steps
│   │   ├── search.steps.js           # Traveler and search field steps
│   │   ├── flight_search.steps.js    # Flight search steps
│   │   ├── flight_results.steps.js   # Flight result selection steps
│   │   ├── cart.steps.js             # Cart and trip management steps
│   │   ├── checkout.steps.js         # Booking confirmation steps
│   │   ├── common.steps.js           # Shared validation steps
│   │   └── ...                       # Other product step definitions
│   └── support/
│       ├── hooks.js                  # Cucumber lifecycle hooks (Before/After scenario)
│       ├── world.js                  # Custom World class (shared context)
│       ├── retry-handler.js          # CI-only retry logic for failed scenarios
│       └── browserFactory.js         # Browser launch configuration
├── .github/
│   ├── workflows/
│   │   └── test-suite.yml            # CI/CD pipeline (GitHub Actions)
│   ├── instructions/                 # Detailed architecture guides
│   │   ├── page-objects.md
│   │   ├── dsl.md
│   │   ├── tests.md
│   │   ├── architecture.md
│   │   └── ...
│   └── README.md                     # AI Copilot usage guide
├── cucumber.js                       # Cucumber configuration
├── playwright.config.js              # Playwright runner configuration (used by Playwright Test only)
├── package.json
├── .env.example                      # Environment variable template
├── .gitignore
└── README.md                         # This file
```

---

## Architecture Layers

The framework uses strict **layered separation of concerns**:

```
┌──────────────────────────────────────────────┐
│           TESTS (Cucumber Features)          │
│  ├─ Gherkin scenarios in .feature files      │
│  └─ Readable: "Given I am logged in as..."   │
└────────────────┬─────────────────────────────┘
                 │ Uses only DSL methods
                 ▼
┌──────────────────────────────────────────────┐
│    DSL (Domain-Specific Language)            │
│  ├─ Business workflows (FlightSearch.js)     │
│  ├─ Composes Page methods into actions       │
│  ├─ Assertions (expect) live here            │
│  └─ Example: searchFlightOneWay(page, from)  │
└────────────────┬─────────────────────────────┘
                 │ Uses only Page Object methods
                 ▼
┌──────────────────────────────────────────────┐
│       PAGE OBJECTS (UI Interactions)         │
│  ├─ Locators declared in constructor         │
│  ├─ Low-level UI actions only                │
│  ├─ Example: fillEmail(), clickLoginButton() │
│  └─ No assertions, no business logic         │
└────────────────┬─────────────────────────────┘
                 │ Uses Playwright APIs
                 ▼
┌──────────────────────────────────────────────┐
│        UTILITIES (Helpers & Reused Code)     │
│  ├─ DOM helpers (waitForText, extractNumber) │
│  ├─ Data generators (Faker)                  │
│  ├─ Calendar/date helpers                    │
│  └─ Logging and constants                    │
└──────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | May Use | May NOT Use |
|-------|---|---|---|
| **Tests** | Orchestrate scenarios | DSL methods only | Page objects, Playwright APIs |
| **DSL** | Business workflows, assertions | Page objects, utils | Playwright APIs directly |
| **Pages** | UI selectors and actions | Playwright APIs, utils | Business logic, assertions |
| **Utils** | Helpers and data | Playwright, external libs | Business logic, Page objects |

### Strict Rules

- **Pages**: Only locators and atomic UI actions (click, fill, waitFor)
- **DSL**: Compose page methods into workflows; assert expected outcomes
- **Tests**: Call DSL methods; no raw selectors or Playwright calls
- **No Circular Dependencies**: Utils never depend on Pages or DSL

---

### Fixture Selection Guide

Use this decision tree to choose the correct fixture:

```
What type of test is this?
│
├── GENERAL test (tests/regression/*/general/)
│   └── Use: newTripPage
│       User doesn't matter, runs with default supplier
│
├── CROSS-SUPPLIER test (tests/regression/*/cross-supplier/)
│   └── Use: newTripPage
│       Runs once per supplier, user selected automatically
│
└── SUPPLIER-SPECIFIC test (tests/regression/*/gds/amadeus/, etc.)
    └── Do different tests need different users?
        ├── NO  → Use: newTripPage (simpler, uses user_one)
        └── YES → Use: newTripPageAs('user_key')
```

### Available Fixtures

| Fixture | Purpose | Returns |
|---------|---------|--------|
| `newTripPage` | Login + start new trip | Page at trip screen |
| `loggedInPage` | Login only | Page at dashboard |
| `newTripPageAs` | Login as specific user + trip | Function (call with user key) |
| `loggedInPageAs` | Login as specific user only | Function (call with user key) |

### Fixture Usage Examples

```javascript
// General or cross-supplier tests (most common)
test('Book flight', async ({ newTripPage }) => {
  const page = newTripPage;
  await Search.addTravellerImTheTraveller(page);
  // ...
});

// Supplier-specific tests needing different users
test('Traveler books', async ({ newTripPageAs }) => {
  const page = await newTripPageAs('user_one');
});

test('Approver reviews', async ({ newTripPageAs }) => {
  const page = await newTripPageAs('user_two');
});
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** installed

### Installation

```bash
# Clone the repository
git clone <REPOSITORY_URL>
cd atriis-automation

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in required credentials:
   ```bash
   # App Configuration
   AUTOMATION_APP_BASEURL=https://ui.gtp-staging.com
   
   # Dynamic User Discovery (auto-loaded from environment)
   # Format: PROVIDER_USER_KEY_EMAIL=email@example.com
   AMADEUS_USER_ONE_EMAIL=user1@amadeus.com
   AMADEUS_USER_TWO_EMAIL=user2@amadeus.com
   LUFTHANSA_USER_ONE_EMAIL=user@lufthansa.com
   GENERAL_PASSWORD=your_secure_password
   
   # Viewport override (optional; defaults in config.js)
   VIEWPORT=1280x720
   ```

3. Verify configuration loads correctly:
   ```bash
   npx cucumber-js --dry-run  # List all scenarios without running
   ```

### Dynamic User Discovery

Users are automatically discovered from environment variables - **no need to update `config.js`**!

**How it works:**
- Environment variable: `AMADEUS_USER_ONE_EMAIL=user@example.com`
- Extracted provider: `amadeus`
- Extracted key: `user_one`
- Referenced in Gherkin: `Given I am logged in as "amadeus" "user_one"`

**Adding a new user:**
1. Add to `.env`:
   ```bash
   PROVIDER_USER_KEY_EMAIL=email@example.com
   # Example: AMADEUS_USER_FOUR_EMAIL=user4@amadeus.com
   ```

2. Use in Gherkin feature file:
   ```gherkin
   Given I am logged in as "amadeus" "user_four"
   When I search for a flight
   Then results are displayed
   ```

3. Use in step definitions:
   ```javascript
   Given('I am logged in as {string} {string}', async (provider, userKey) => {
     await app.loginAndBookANewTrip(provider, userKey);
   });
   ```

**CI Setup:**
- Add environment variable to GitHub Secrets
- Add to workflow job's `env:` section in `.github/workflows/test-suite.yml`

**Naming Convention:**
- Standard: `PROVIDER_USER_KEY_EMAIL` → `provider.user_key`
- Example: `AMADEUS_USER_ONE_EMAIL` → `amadeus.user_one`
- Example: `LUFTHANSA_JOHN_DOE_EMAIL` → `lufthansa.john_doe`

---

## Running Tests

### Using Cucumber CLI

Tests are executed using Cucumber (BDD test runner) with Playwright for browser automation.

```bash
# Run all scenarios
npx cucumber-js

# Run specific feature file
npx cucumber-js tests/features/flights/general/basic_flight_search.feature

# Run all flights tests
npx cucumber-js tests/features/flights/

# List all scenarios without running
npx cucumber-js --dry-run

# Run with specific tags
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@smoke and @priority:critical"
npx cucumber-js --tags "not @slow"

# Run with detailed output
npx cucumber-js --format progress-bar
npx cucumber-js --format json > results.json
npx cucumber-js --format html:cucumber-report.html

# Run in specific environment
AUTOMATION_APP_BASEURL=https://ui.gtp-dev.com npx cucumber-js
```

### Test Organization

**By Product:**
- `tests/features/flights/` — Flight booking scenarios
- `tests/features/hotels/` — Hotel booking scenarios
- `tests/features/cars/` — Car rental scenarios
- `tests/features/ground_transport/` — Ground transport scenarios
- `tests/features/rails/` — Rail (Amtrak, Benerail) scenarios
- `tests/features/manual_quote/` — Manual quote scenarios
- `tests/features/parking/` — Parking scenarios
- `tests/features/shell/` — Complex multi-product workflows

**By Test Type:**
- `tests/features/smoke/` — Critical path smoke tests (fast validation)
- `tests/features/*/general/` — General product scenarios
- `tests/features/*/daily_flights/` — Daily regression suite
- `tests/features/*/<supplier>/` — Supplier-specific tests (Lufthansa, Amadeus, etc.)

### Gherkin Scenario Tags

Tests use tags in Gherkin feature files for categorization:

```gherkin
@regression @priority:high @provider:amadeus
Scenario: Book a round-trip flight with multiple passengers
  Given I am logged in as "amadeus" "user_one"
  When I search for a flight from "LON" to "NYC"
  Then flight results are displayed
  And I can select a flight for booking
```

### Available Tag Categories

| Tag Type | Examples | Usage |
|----------|----------|-------|
| **Test Level** | `@smoke`, `@regression` | Filter by test scope |
| **Priority** | `@priority:critical`, `@priority:high` | Filter by importance |
| **Provider** | `@provider:amadeus`, `@provider:lufthansa` | Filter by supplier |
| **Feature** | `@flights`, `@hotels`, `@complex` | Filter by product |
| **Performance** | `@slow`, `@fast` | Filter by execution time |

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all Cucumber scenarios |
| `npm run test:smoke` | Run smoke tests only |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Run in debug mode with DevTools |

---

## Test Organization

### Feature File Structure

Each feature file describes user scenarios in Gherkin (human-readable BDD syntax):

```gherkin
# tests/features/flights/general/search-one-way.feature

Feature: One-Way Flight Search
  As a travel booker
  I want to search for one-way flights
  So I can book the best option for my trip

  Background:
    Given I am logged in as "amadeus" "user_one"

  @smoke @priority:critical
  Scenario: Search returns results for valid route
    When I search for a one-way flight from "LON" to "NYC"
    Then flight results are displayed
    And results show at least 1 flight

  @regression @priority:high
  Scenario: Pagination works for large result sets
    When I search for a one-way flight from "LON" to "NYC"
    And I scroll to the next results page
    Then more results are displayed
```

### Step Definitions and DSL Connection

Step definitions (in `tests/steps/`) call DSL methods to execute business workflows:

```javascript
// tests/steps/flight_search.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { app, FlightSearch, FlightResults } = require('@dsl');

When('I search for a one-way flight from {string} to {string}', 
  async (origin, destination) => {
    await FlightSearch.searchOneWayFlight(
      global.page,
      origin,
      destination
    );
  }
);

Then('flight results are displayed', async () => {
  expect(await FlightResults.areResultsVisible(global.page)).toBe(true);
});
```

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Smoke** | `tests/features/smoke/` | Critical path validation, run before deployments |
| **General** | `tests/features/*/general/` | Supplier-agnostic scenarios covering core functionality |
| **Daily Regression** | `tests/features/*/daily_flights/` | Comprehensive daily regression suite |
| **Supplier-Specific** | `tests/features/*/<supplier>/` | Supplier-specific behavior (Lufthansa, Amadeus, etc.) |

---

## CI/CD Integration

### GitHub Actions

The framework includes GitHub Actions workflows in `.github/workflows/`:

- **test-suite.yml**: Runs smoke, daily, and shell tests on push/PR

### Retry Logic (CI Only)

Failed scenarios automatically retry in CI environments:
- **When**: Only when `CI=true` environment variable is set
- **Retries**: Configured via `RETRY_COUNT` env var (default: 2)
- **Delay Between Retries**: Configured via `RETRY_DELAY` env var (default: 2000ms)
- **Local Execution**: No retries (faster feedback for development)

The retry mechanism is implemented in:
- `tests/support/retry-handler.js` — Tracks and manages retries
- `cucumber.js` — Configures native Cucumber retry setting based on CI status

### Artifacts Generated on Failure

| Artifact | Format | Location | Purpose |
|----------|--------|----------|---------|
| Screenshots | PNG | `test-results/screenshots/` | Visual debugging of failure point |
| Cucumber Report | JSON | `test-results/cucumber-report.json` | Detailed scenario results |
| Cucumber Report | JUnit XML | `test-results/cucumber-junit.xml` | CI/CD integration format |

**Screenshot Naming:** `scenario_name_TIMESTAMP.png` (e.g., `search_returns_results_2026-02-23T10-30-45-123Z.png`)

---

## Debugging

### Common Issues

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| **Element not found** | Locator mismatch or timing | Check Page Object locator, use explicit waits in Page methods |
| **Timeout errors** | Page not loaded, slow network | Increase timeout, use `wait.js` utilities |
| **Authentication fails** | Missing/incorrect credentials | Verify `.env` file, check CI secrets, ensure env var naming matches |
| **Scenario hangs** | Missing timeouts on Playwright APIs | Add timeout to `waitForEvent('page')`, `waitForNavigation()`, etc. |
| **Flaky tests** | Hard waits (sleep), missing waits | Replace `page.waitForTimeout()` with dynamic waits like `waitForText()` |

### Debugging Techniques

**Run a single scenario with verbose output:**
```bash
npx cucumber-js tests/features/flights/general/basic_search.feature --format progress-bar
```

**Run tests by a specific label:**
```bash
npx cucumber-js --tags "@label:booking"
```

**Run tests with multiple labels (OR condition):**
```bash
npx cucumber-js --tags "@label:booking or @label:results"
npx cucumber-js --tags "@label:booking and @label:results"
npx cucumber-js --tags "@label:booking and not @label:results"
```

**Enable browser visibility (headed mode):**
```bash
HEADLESS=false npx cucumber-js
```

**Enable debug logging:**
```bash
DEBUG=* npx cucumber-js
```

**Inspect DOM elements and network:**
Access video recordings and screenshots in `test-results/screenshots/` after test failure.

### Test Artifacts

On failure, the framework automatically captures:
- **Screenshots**: Saved to `test-results/screenshots/scenario_name_TIMESTAMP.png`
- **Cucumber JSON Report**: `test-results/cucumber-report.json` (includes embedded screenshots)
- **Cucumber JUnit Report**: `test-results/cucumber-junit.xml` (for CI integrations)

---

## Contributing

### For QA Engineers

1. **Write Gherkin scenarios that read like user stories**
   ```gherkin
   Given I am logged in as "amadeus" "user_one"
   When I search for a one-way flight from "LON" to "NYC"
   Then flight results are displayed
   ```

2. **Use step definitions and DSL methods** — never write Playwright code directly
   ```javascript
   // ✅ GOOD - Use DSL
   await FlightSearch.searchOneWayFlight(page, 'LON', 'NYC');
   
   // ❌ BAD - Don't use Playwright API directly
   await page.fill('input[name="from"]', 'LON');
   ```

3. **Add appropriate tags for filtering and categorization**
   ```gherkin
   @smoke @priority:critical @provider:amadeus
   Scenario: Book a flight
   ```

4. **Keep scenarios independent** — no shared state between scenarios

5. **Document why, not what**
   ```javascript
   // ✅ GOOD - Explains intention
   // Verify that international routes show visa warnings
   expect(visaWarningShown).toBe(true);
   
   // ❌ BAD - Restates the code
   // Check if visa warning element is visible
   ```

### For Developers

1. **Locators in Page Objects only** — declare at top of constructor
   ```javascript
   constructor(page) {
     this.page = page;
     this.emailInput = page.locator('input[name="email"]');
     this.loginButton = page.locator('button:has-text("Sign In")');
   }
   ```

2. **Page Objects contain only UI interactions** — no business logic
   ```javascript
   // ✅ GOOD - Atomic UI action
   async fillEmail(email) {
     await this.emailInput.fill(email);
   }
   
   // ❌ BAD - Business logic in Page Object
   async loginWithRetry(email, password) {
     for (let i = 0; i < 3; i++) {
       try {
         await this.fillEmail(email);
         await this.fillPassword(password);
         await this.clickLogin();
         break;
       } catch (e) {
         // retry logic
       }
     }
   }
   ```

3. **DSL composes Page methods into workflows**
   ```javascript
   async loginAs(page, provider, userKey) {
     const loginPage = new LoginPage(page);
     const user = config.getUser(provider, userKey);
     
     await loginPage.fillEmail(user.email);
     await loginPage.fillPassword(user.password);
     await loginPage.clickLogin();
     // DSL level assertions
     expect(await loginPage.isLoggedIn()).toBe(true);
   }
   ```

4. **Validate inputs in DSL methods** per [error handling guidelines](./.github/instructions/error-handling.md)
   ```javascript
   async selectFlight(page, flightIndex) {
     if (!page) throw new Error('page parameter is required');
     if (typeof flightIndex !== 'number') {
       throw new Error(`flightIndex must be a number, got: ${typeof flightIndex}`);
     }
     if (flightIndex < 0) {
       throw new Error(`flightIndex must be >= 0, got: ${flightIndex}`);
     }
     // ... implementation
   }
   ```

5. **Follow existing patterns** — check similar files before inventing new approaches

### Code Style Guide

- **Method names**: Start with verb, describe action clearly
  - ✅ `selectFlight()`, `addPassenger()`, `clickSubmit()`
  - ❌ `flight()`, `passenger()`, `submit()`

- **Class names**: Nouns describing the page or concept
  - ✅ `FlightSearchPage`, `CartPage`, `CheckoutPage`
  - ❌ `SearchFlightPage`, `Page1`, `Stage2`

- **Constants**: UPPER_SNAKE_CASE for module-level constants
  - ✅ `MAX_WAIT_TIME`, `SELECTORS`, `DEFAULT_TIMEOUT`
  - ❌ `maxWaitTime`, `MAX_waitTime`, `maxwaiter`

- **Comments**: Explain **why** decisions were made, not what code does
  ```javascript
  // ✅ GOOD - Explains intent
  // Wait for network activity to settle before proceeding
  // (GDS takes 2-3s to return pricing options)
  await page.waitForLoadState('networkidle');
  
  // ❌ BAD - Restates code
  // Wait for network idle state
  await page.waitForLoadState('networkidle');
  ```

### Layer Responsibilities (Summary)

| Layer | Should Contain | Should NOT Contain |
|-------|---|---|
| **Page Object** | Locators, UI actions (click, fill, type) | Business logic, assertions, wait logic |
| **DSL** | Workflows, test data building, assertions | Selectors, raw Playwright calls, UI details |
| **Step Definition** | Parametrization, context building | Business logic (use DSL instead) |
| **Utilities** | Helpers (DOM, calendar, data), logging | Page objects, DSL methods |

---

## Architecture Guidelines

For comprehensive architecture and design decision documentation, see:
- [.github/instructions/page-objects.md](./.github/instructions/page-objects.md) — Page Object patterns and locator strategies
- [.github/instructions/dsl.md](./.github/instructions/dsl.md) — DSL composition and business workflow design
- [.github/instructions/architecture.md](./.github/instructions/architecture.md) — Overall layer separation and data flow
- [.github/instructions/error-handling.md](./.github/instructions/error-handling.md) — Validation and error message patterns
- [.github/instructions/tests.md](./.github/instructions/tests.md) — Gherkin scenario writing
- [.github/instructions/playwright-best-practices.md](./.github/instructions/playwright-best-practices.md) — Playwright API usage patterns

---

## Using Copilot in This Repository

This project is optimized for AI-assisted development using GitHub Copilot. For safe, consistent AI guidance:

→ **[Start Here: How to Use Copilot](./.github/README.md)**

Key resources:
- **.github/copilot-instructions.md** — AI rules, architecture principles, layer responsibilities
- **.github/instructions/** — Detailed guidelines for each architectural layer
- **prompts/** → Approved prompt templates (Code Review, Test Generation, DSL Updates, Error Diagnosis)

**Never invent new prompts.** Always use approved templates from the `prompts/` folder.

---