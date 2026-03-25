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

- **Playwright** (^1.40.0): Browser automation and synchronization
- **Cucumber** (^12.6.0): BDD test runner and Gherkin feature parsing
- **Allure** (v3.6.0): Test reporting with screenshots and attachments
- **JavaScript (ES6+)**: Test implementation language
- **Node.js** (>=18.0.0): Runtime

---

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture Layers](#architecture-layers)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [Test Reports (Allure)](#test-reports-allure)
- [Test Organization](#test-organization)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [AI Agent Ecosystem](#ai-agent-ecosystem)
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
│       └── retry-handler.js          # CI-only retry logic for failed scenarios
├── .github/
│   ├── workflows/
│   │   └── test-suite.yml            # CI/CD pipeline (GitHub Actions)
│   ├── agents/                       # AI agent definitions (20 agents)
│   │   ├── ado-pipeline.agent.md     # ADO → full test lifecycle orchestrator
│   │   ├── feature-pipeline.agent.md # Manual description → test orchestrator
│   │   ├── regression-pipeline.agent.md  # Run suite → fix → report
│   │   ├── ci-monitor.agent.md       # Daily CI health check orchestrator
│   │   ├── todo-pipeline.agent.md    # Resolve TODO comments orchestrator
│   │   ├── domain-flights.agent.md   # Flight domain knowledge
│   │   ├── domain-hotels.agent.md    # Hotel domain knowledge
│   │   ├── domain-transportation.agent.md # Transportation domain knowledge
│   │   ├── domain-shell.agent.md     # Cross-domain/generic patterns
│   │   └── ...                       # Sub-agents and standalone agents
│   ├── instructions/                 # Detailed architecture guides
│   │   ├── page-objects.md
│   │   ├── dsl.md
│   │   ├── tests.md
│   │   ├── architecture.md
│   │   └── ...
│   ├── AGENTS.md                     # Agent registry and architecture
│   └── copilot-instructions.md       # AI Copilot coding rules
├── cucumber.js                       # Cucumber configuration (formats, retry, paths)
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

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0 — [Download](https://nodejs.org/)
- **npm** — included with Node.js

### Installation

```bash
# 1. Clone the repository
git clone <REPOSITORY_URL>
cd Atriis.Test.Automation

# 2. Install Node dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps

# 4. Create the allure-results directory (required before first run)
#    The allure-cucumberjs formatter writes here on every test run.
mkdir allure-results
```

> **Why is `allure-results/` required?**
> The Cucumber formatter `allure-cucumberjs/reporter` is always active and writes results to
> `allure-results/` on every execution. The directory must exist before the first run.

---

## Environment Setup

### 1. Copy the environment template

```bash
cp .env.example .env
```

### 2. Fill in the required values

```bash
########################################
# Application Configuration
########################################
AUTOMATION_APP_BASEURL=https://atriis-stg.app
AUTOMATION_HEADLESS=false         # true for CI, false for local debugging
AUTOMATION_TIMEOUT_MS=30000       # default operation timeout in ms

########################################
# User Authentication — Simple Label Format (Recommended)
# Format:  USER_<LABEL>=email@domain.com
# Gherkin: Given I am logged in as "bruna"
########################################
USER_BRUNA=bruna@company.com
USER_ELI=eli@company.com
# ... add more as needed

GENERAL_PASSWORD=your_shared_password
```

See `.env.example` for the complete list including GDS/NDC supplier-specific users.

### 3. Verify the setup

```bash
# Dry-run: list all scenarios without opening a browser
npx cucumber-js --dry-run
```

---

### User System

#### Simple Label Users (Recommended)

Add `USER_<LABEL>=email@company.com` to `.env`:

```bash
USER_BRUNA=bruna@atriis.com
USER_TESTER=tester@atriis.com
```

Reference in Gherkin with a single string:

```gherkin
Given I am logged in as "bruna" booking a new trip
Given I am logged in as "tester" booking a new trip
```

The framework resolves the email from the environment variable automatically — no changes to `config.js` needed.

#### Adding a User to CI (GitHub Secrets)

1. Add a secret in **GitHub → Settings → Secrets → Actions**:
   - Name: `USER_BRUNA`, Value: `bruna@company.com`
2. Reference it in `.github/workflows/test-suite.yml` under the job's `env:` block:
   ```yaml
   env:
     USER_BRUNA: ${{ secrets.USER_BRUNA }}
     GENERAL_PASSWORD: ${{ secrets.GENERAL_PASSWORD }}
   ```

#### Legacy Provider-Based Users (Still Supported)

```bash
# .env
AMADEUS_USER_ONE_EMAIL=user@company.com
```

```gherkin
# Feature file (legacy format)
Given I am logged in as "amadeus" "user_one"
```

---

## Running Tests

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run bdd` | Run all Cucumber scenarios |
| `npm run bdd:smoke` | Smoke tests only |
| `npm run bdd:flights:general` | All flight tests |
| `npm run bdd:flights:lufthansa` | Lufthansa-specific flight tests |
| `npm run bdd:hotels:general` | All hotel tests |
| `npm run bdd:cars:general` | All car tests |
| `npm run bdd:manual_quote` | Manual quote tests |

### Cucumber CLI

```bash
# Run all scenarios
npx cucumber-js

# Run a specific feature file
npx cucumber-js tests/features/flights/general/basic_flight_search.feature

# Run by folder (product domain)
npx cucumber-js tests/features/flights/
npx cucumber-js tests/features/hotels/

# Run by tags
npx cucumber-js --tags "@smoke"
npx cucumber-js --tags "@smoke and @priority:critical"
npx cucumber-js --tags "@provider:amadeus"
npx cucumber-js --tags "not @slow"

# Dry run (list all scenarios, no browser)
npx cucumber-js --dry-run

# Run with visible browser (headed mode)
AUTOMATION_HEADLESS=false npx cucumber-js

# Run a single scenario by name
npx cucumber-js --name "Book a round-trip flight"
```

### Tag Reference

| Tag | Examples | Purpose |
|-----|----------|---------|
| **Scope** | `@smoke`, `@regression` | Test suite level |
| **Priority** | `@priority:critical`, `@priority:high`, `@priority:low` | Importance filter |
| **Provider** | `@provider:amadeus`, `@provider:lufthansa`, `@provider:ratehawk` | Supplier filter |
| **Product** | `@flights`, `@hotels`, `@cars`, `@rails` | Product domain filter |

---

## Test Reports (Allure)

Allure is the primary report format. The formatter runs on every test execution and writes raw results to `allure-results/`.

### Generating and Viewing the Report

```bash
# Generate the HTML report from the latest results:
npx allure generate ./allure-results -o allure-report --clean

# Open the report in your browser:
npx allure open allure-report
```

### What Is Included

- Pass/Fail status per scenario and step
- **Screenshots** automatically attached to failing scenarios
- Playwright traces on failure (when `AUTOMATION_ENABLE_TRACING=true`)
- Test duration and timeline view
- Suite breakdown by feature file

### Resetting Results Before a Fresh Run

```bash
# Windows
rd /s /q allure-results && mkdir allure-results

# macOS / Linux
rm -rf allure-results && mkdir allure-results
```

### Other Report Formats

| Format | Location | Purpose |
|--------|----------|---------|
| Allure JSON | `allure-results/` | Source for `npx allure generate` |
| Cucumber JSON | `test-results/cucumber-report.json` | Custom tooling, CI artifacts |
| JUnit XML | `test-results/cucumber-junit.xml` | GitHub Actions dorny/test-reporter |
| Screenshots (PNG) | `test-results/screenshots/` | Saved on failure: `scenario_name_TIMESTAMP.png` |

---

## Test Organization

### Feature File Structure

```gherkin
# tests/features/flights/general/search-one-way.feature

@flights @regression
Feature: One-Way Flight Search
  As a travel booker
  I want to search for one-way flights
  So I can book the best option for my trip

  @smoke @priority:critical
  Scenario: Search returns results for valid route
    Given I am logged in as "bruna" booking a new trip
    When I search for a one-way flight from "LON" to "NYC"
    Then flight results are displayed
    And results show at least 1 flight
```

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Smoke** | `tests/features/smoke/` | Critical path validation, run before deployments |
| **General** | `tests/features/*/general/` | Core functionality, supplier-agnostic |
| **Daily Regression** | `tests/features/*/daily_flights/` | Full regression suite run daily |
| **Supplier-Specific** | `tests/features/*/<supplier>/` | Supplier-specific behaviour (Lufthansa, Amadeus, etc.) |

### Step Definitions and DSL Connection

```javascript
// tests/steps/flight_search.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { FlightSearch, FlightResults } = require('@dsl');

When('I search for a one-way flight from {string} to {string}',
  async function (origin, destination) {
    await FlightSearch.searchOneWayFlight(this.page, origin, destination);
  }
);

Then('flight results are displayed', async function () {
  await FlightResults.verifyResultsVisible(this.page);
});
```

---

## CI/CD Integration

### GitHub Actions

The framework runs on GitHub Actions via `.github/workflows/test-suite.yml`:

| Job | Purpose | Trigger |
|-----|---------|---------|
| `smoke-tests` | Critical path validation | Push, PR, daily |
| `daily-flights` | Flight regression suite | Daily at 21:00 UTC |
| `daily-hotels` | Hotel regression suite | Daily at 21:00 UTC |
| `daily-cars` | Car regression suite | Daily at 21:00 UTC |
| `daily-rails` | Rail regression suite | Daily at 21:00 UTC |
| `daily-shell` | Cross-domain tests | Daily at 21:00 UTC |
| `summary` | Aggregate results | Always (after jobs) |

### Retry Logic (CI Only)

- **Activated when**: `CI=true` (GitHub Actions sets this automatically)
- **Retries**: `RETRY_COUNT` env var (default: 2)
- **Delay**: `RETRY_DELAY` env var (default: 2000ms)
- **Locally**: Retries are disabled for faster feedback

### CI Reports

| Report | Where to find it | Available on |
|--------|-----------------|-------------|
| GitHub Step Summary | Run → Summary tab | All trigger types |
| dorny Check Run | Commit → Checks tab | Push + PR |

---

## Debugging

### Common Issues

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| `allure-results/ not found` | Directory missing | Run `mkdir allure-results` before first run |
| **Element not found** | Locator mismatch or timing | Check Page Object locator; use explicit waits |
| **Timeout errors** | Page not loaded, slow network | Increase `AUTOMATION_TIMEOUT_MS`; use `wait.js` utilities |
| **Authentication fails** | Missing/incorrect credentials | Verify `.env` values; check CI secrets match env var names |
| **Flaky tests** | Hard waits (`page.waitForTimeout`) | Replace with dynamic waits like `waitForText()` |
| **Scenario hangs** | Missing timeouts on Playwright APIs | Add timeout to `waitForSelector`, `waitForNavigation`, etc. |

### Debugging Techniques

**Run a single scenario with verbose output:**
```bash
npx cucumber-js tests/features/flights/general/basic_search.feature --format progress-bar
```

**Enable browser visibility:**
```bash
AUTOMATION_HEADLESS=false npx cucumber-js
```

**Enable slow motion (see each action step-by-step):**
```bash
AUTOMATION_SLOW_MO=500 npx cucumber-js
```

**Enable Playwright tracing:**
```bash
AUTOMATION_ENABLE_TRACING=true npx cucumber-js
# Traces saved to test-results/ — open with:
npx playwright show-trace test-results/trace.zip
```

**View all test artifacts after failure:**
- Screenshots: `test-results/screenshots/`
- Allure report: `npx allure generate ./allure-results -o allure-report --clean && npx allure open allure-report`

---

## AI Agent Ecosystem

This project includes **20 custom AI agents** that automate the test lifecycle. See [.github/AGENTS.md](.github/AGENTS.md) for the full registry and architecture.

### Quick Reference

| Agent | How to invoke | Purpose |
|-------|--------------|---------|
| `@ado-pipeline` | `@ado-pipeline 74500` | ADO work item → generate test → run → fix → report |
| `@feature-pipeline` | Describe scenario | QA description → working automated test |
| `@regression-pipeline` | `@regression-pipeline @smoke` | Run suite → fix failures → generate report |
| `@ci-monitor` | — | Check CI → fix failures → daily health report |
| `@todo-pipeline` | Path to feature file | Implement missing steps/DSL → run until passing |
| `@code-reviewer` | — | Review code quality against project patterns |
| `@generate-dsl-method` | Describe the method | Focused DSL method creation |
| `@test-case-converter` | Paste manual test | ADO/spreadsheet/docs → Gherkin feature files |
| `@testim-converter` | Paste Testim test | Legacy Testim tests → Cucumber BDD format |
| `@context-bridge` | — | Coverage gaps, selector discovery, bug-to-test |

---

## Contributing

### For QA Engineers

1. **Write Gherkin that reads like a user story**
   ```gherkin
   Given I am logged in as "bruna" booking a new trip
   When I search for a one-way flight from "LON" to "NYC"
   Then flight results are displayed
   ```

2. **Use DSL methods** — never write Playwright code directly in step definitions
   ```javascript
   // ✅ GOOD — Use DSL
   await FlightSearch.searchOneWayFlight(page, 'LON', 'NYC');

   // ❌ BAD — Don't call Playwright directly in steps
   await page.fill('input[name="from"]', 'LON');
   ```

3. **Add appropriate tags**
   ```gherkin
   @smoke @priority:critical @provider:amadeus
   Scenario: Book a flight
   ```

4. **Keep scenarios independent** — no shared state between scenarios

### For Developers

1. **Locators in Page Objects only** — declare in constructor
   ```javascript
   constructor(page) {
     this.page = page;
     this.emailInput = page.locator('input[name="email"]');
     this.loginButton = page.locator('[data-testid="login-button"]');
   }
   ```

2. **DSL composes Page methods into workflows**
   ```javascript
   async loginAs(page, label) {
     const loginPage = getPageObject(page, LoginPage);
     const user = resolveUser(label);
     await loginPage.fillEmail(user.email);
     await loginPage.fillPassword(user.password);
     await loginPage.clickLogin();
   }
   ```

3. **Validate inputs in DSL methods**
   ```javascript
   async selectFlight(page, flightIndex) {
     if (!page) throw new Error('page parameter is required');
     if (typeof flightIndex !== 'number') {
       throw new Error(`flightIndex must be a number, got: ${typeof flightIndex}`);
     }
   }
   ```

4. **Prefer `data-testid` locators** — check `../Atriis.App/src/app/Atriis.OBT/` for actual selector values

### Code Style

- **Method names**: Start with a verb — `selectFlight()`, `addPassenger()`, `clickSubmit()`
- **Class names**: Noun describing the page — `FlightSearchPage`, `CartPage`
- **Constants**: UPPER_SNAKE_CASE at module level — `MAX_WAIT_TIME`, `SELECTORS`
- **Comments**: Explain **why**, not what
  ```javascript
  // GDS pricing is cached for 90s — re-search to get fresh prices after hold
  await FlightSearch.retrySearch(page);
  ```

### Detailed Guidelines

| Topic | Document |
|-------|----------|
| Page Objects | [.github/instructions/page-objects.md](.github/instructions/page-objects.md) |
| DSL Methods | [.github/instructions/dsl.md](.github/instructions/dsl.md) |
| Gherkin / Steps | [.github/instructions/tests.md](.github/instructions/tests.md) |
| Architecture | [.github/instructions/architecture.md](.github/instructions/architecture.md) |
| Error Handling | [.github/instructions/error-handling.md](.github/instructions/error-handling.md) |
| Playwright Best Practices | [.github/instructions/playwright-best-practices.md](.github/instructions/playwright-best-practices.md) |
| Naming Conventions | [.github/instructions/naming-conventions.md](.github/instructions/naming-conventions.md) |
| Commit Guidelines | [.github/instructions/commit-guidelines.md](.github/instructions/commit-guidelines.md) |
| Quick Reference | [.github/instructions/quick-reference.md](.github/instructions/quick-reference.md) |
