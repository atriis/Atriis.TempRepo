# Atriis Automation

A production-grade **Playwright + JavaScript** test automation framework for a corporate travel booking platform.

## Overview

This framework automates end-to-end testing for a multi-product travel platform supporting **flights, hotels, cars, rail, ground transportation, and parking** across multiple suppliers (GDS systems, NDC, LCC, and direct integrations).

### Goals

- **Stability**: Tests fail only when real bugs exist, not due to flaky behavior
- **Readability**: Tests read like user journeys, accessible to non-developer QA engineers
- **Scalability**: Same test logic runs across different suppliers, users, and environments
- **Maintainability**: Clear separation of concerns with Page Object Model + DSL architecture

---

## Table of Contents

- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Cross-Supplier Testing](#cross-supplier-testing)
- [User-Based Execution](#user-based-execution)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Organization](#test-organization)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [Contributing](#contributing)
- [AI Prompts](#ai-prompts)

---

## Project Structure

```
atriis-automation/
├── src/
│   ├── config/               # Environment-driven configuration
│   │   └── config.js         # Central config: URLs, users per supplier
│   ├── dsl/                  # Domain Specific Language (business workflows)
│   │   ├── App.js            # Application-level actions (login, logout)
│   │   ├── FlightSearch.js   # Flight search workflows
│   │   ├── FlightResults.js  # Flight results interactions
│   │   ├── Cart.js           # Cart operations
│   │   ├── Checkout.js       # Checkout workflows
│   │   └── ...               # Other product DSLs
│   ├── pages/                # Page Object Model implementations
│   │   ├── LoginPage.js      # Login page interactions
│   │   ├── FlightSearchPage.js
│   │   ├── FlightResultsPage.js
│   │   └── ...               # One page per screen
│   ├── utils/                # Helpers and utilities
│   │   ├── calendar.helper.js
│   │   ├── wait.js
│   │   └── dom.js
│   └── data/                 # Test data files
│       ├── flights.json      # Flight routes and defaults
│       ├── hotels.json
│       └── ...
├── tests/
│   ├── fixtures/             # Playwright fixtures (test setup)
│   │   └── supplierTest.js   # Supplier-aware test fixture
│   ├── smoke/                # Critical path smoke tests
│   └── regression/           # Comprehensive regression suites
│       ├── flights/
│       │   ├── general/      # Supplier-agnostic flight tests
│       │   ├── cross-supplier/  # Tests that run against all suppliers
│       │   ├── gds/          # GDS-specific (Amadeus, Sabre, Galileo)
│       │   ├── ndc/          # NDC-specific tests
│       │   └── lcc/          # Low-cost carrier tests
│       ├── hotels/
│       ├── cars/
│       ├── rails/
│       └── ground-transportation/
├── playwright.config.js      # Playwright configuration with projects
├── package.json
└── .env                      # Environment variables (not committed)
```

---

## Architecture

The framework follows a **layered architecture** that separates concerns and enables non-technical QA engineers to write tests:

```
┌─────────────────────────────────────────────────────────────┐
│                         TESTS                                │
│   • Scenario orchestration                                   │
│   • Uses DSL methods only                                    │
│   • Reads like user journeys                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                          DSL                                 │
│   • Business actions in domain language                      │
│   • Combines Page Object methods into workflows              │
│   • Example: FlightSearch.searchFlightOneWay(page, 'route')  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                      PAGE OBJECTS                            │
│   • UI elements and low-level actions                        │
│   • Locators declared at top of constructor                  │
│   • Example: fillEmail(), clickLoginButton()                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                        UTILS                                 │
│   • Helpers: calendar, waits, data generators                │
│   • No UI interaction logic                                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Locators live in Page Objects only** — no separate selector files
- **DSL never accesses Playwright APIs directly** — only calls Page Object methods
- **Tests never use raw selectors** — only DSL methods
- **Each test is independent** — no shared state between tests

---

## Cross-Supplier Testing

The framework enables running the **same test logic across different suppliers** without code duplication.

### How It Works

1. **Projects define supplier context**: Each Playwright project includes a `supplierContext` with `provider` and `userKey`

2. **Fixtures read supplier context**: The `supplierTest.js` fixture reads the project's supplier context and logs in with the correct user

3. **Tests are supplier-agnostic**: Test code doesn't know which supplier it's running against

```javascript
// playwright.config.js (simplified)
projects: [
  {
    name: 'flights:amadeus',
    testDir: 'tests/regression/flights/gds/amadeus',
    use: {
      supplierContext: { provider: 'amadeus', userKey: 'user_one' }
    }
  },
  {
    name: 'flights:sabre',
    testDir: 'tests/regression/flights/gds/sabre',
    use: {
      supplierContext: { provider: 'sabre', userKey: 'user_one' }
    }
  }
]
```

### Cross-Supplier Test Example

Tests in `cross-supplier/` folders run against **all configured suppliers** for that product:

```javascript
// tests/regression/flights/cross-supplier/flight-search.spec.js
const { test, expect } = require('../../../fixtures/supplierTest');

test('Search returns results', async ({ newTripPage }) => {
  // This test runs for every supplier in the flightsAll group
  await Search.addTravellerImTheTraveller(newTripPage);
  await FlightSearch.searchFlightOneWay(newTripPage, 'lhrToDoh');
  expect(await FlightResults.isResultDisplayed(newTripPage)).toBe(true);
});
```

### Supplier Groups

Suppliers are organized by product capability in `playwright.config.js`:

| Group | Suppliers |
|-------|-----------|
| `gds` | Amadeus, Sabre, Galileo |
| `flightsNdc` | AFKL, British, Lufthansa, United, Iberia, American |
| `flightsLowCost` | Galileo ACH, Amadeus Light Ticketing, Fusion, Ypsilon |
| `hotels` | Expedia, Booking.com, RateHawk, eHotel, Premier Inn, Travelodge |
| `cars` | Sunny Cars (+ GDS) |
| `rails` | Benerail, Amtrak, Evolvi |
| `groundTransport` | Groundscope, Transferz |

---

## User-Based Execution

Each supplier has one or more test users defined in configuration. The framework automatically selects the correct user based on the project being run.

### Configuration Structure

```javascript
// src/config/config.js
const config = {
  baseUrl: getEnv('AUTOMATION_APP_BASEURL'),
  users: {
    amadeus: {
      user_one: { email: getEnv('AMADEUS_USER_ONE_EMAIL'), password: getEnv('GENERAL_PASSWORD') },
      user_two: { email: getEnv('AMADEUS_USER_TWO_EMAIL'), password: getEnv('GENERAL_PASSWORD') }
    },
    sabre: {
      user_one: { email: getEnv('SABRE_USER_ONE_EMAIL'), password: getEnv('GENERAL_PASSWORD') }
    },
    // ... other suppliers
  }
};
```

### Environment Variables

Create a `.env` file with your credentials:

```env
AUTOMATION_APP_BASEURL=https://ui.gtp-staging.com

# GDS Users
AMADEUS_USER_ONE_EMAIL=user@amadeus.com
AMADEUS_USER_TWO_EMAIL=user2@amadeus.com
SABRE_USER_ONE_EMAIL=user@sabre.com
GALILEO_USER_ONE_EMAIL=user@galileo.com

# Hotel Users
RATEHAWK_USER_ONE_EMAIL=user@ratehawk.com
EXPEDIA_USER_ONE_EMAIL=user@expedia.com
BOOKINGCOM_USER_ONE_EMAIL=user@bookingcom.com

# Shared
GENERAL_PASSWORD=your_password_here
```

### How Users Are Selected

1. **Project defines supplier context**: `{ provider: 'amadeus', userKey: 'user_one' }`
2. **Fixture reads context at runtime**: Looks up user in `config.users.amadeus.user_one`
3. **Login happens automatically**: Fixture logs in before test starts

```javascript
// tests/fixtures/supplierTest.js
async function loginWithSupplier({ page, testInfo }) {
  const supplier = testInfo.project.use?.supplierContext;
  const { provider, userKey } = supplier;
  const user = config.users[provider][userKey];
  
  await page.goto(config.baseUrl);
  await App.loginAs(page, user);
}
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

2. Fill in the required values in `.env`

3. Verify configuration loads correctly:
   ```bash
   npx playwright test --list
   ```

---

## Running Tests

```bash
# Run all tests
npx playwright test

# Run smoke tests
npx playwright test --project=Smoke
npx playwright test --grep "@smoke"

# Run by supplier
npx playwright test --project="flights:amadeus"
npx playwright test --project="hotels:ratehawk"
npx playwright test --project="cars:sunny"

# Run cross-supplier tests
npx playwright test --project="flights-cross-supplier:*"

# Run by tag
npx playwright test --grep "priority:critical"
npx playwright test --grep "@regression"
npx playwright test --grep-invert "@slow"        # Exclude tag

# Run by file or folder
npx playwright test tests/smoke/smoke.spec.js
npx playwright test tests/regression/flights/

# Debug modes
npm run test:headed       # See browser
npm run test:debug        # Step through with DevTools

# View report
npx playwright show-report
```

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run test` | Run all tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:debug` | Run in debug mode |
| `npm run test:dev` | Run against dev environment |
| `npm run test:staging` | Run against staging environment |

---

## Test Organization

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| **Smoke** | `tests/smoke/` | Critical path validation, run before deployments |
| **Regression** | `tests/regression/` | Comprehensive coverage by product |
| **Cross-Supplier** | `tests/regression/*/cross-supplier/` | Tests that validate across all suppliers |
| **Supplier-Specific** | `tests/regression/*/gds/`, `*/ndc/`, etc. | Tests for specific supplier behavior |

### Tagging Convention

Tests use tags in the test name for filtering:

```javascript
test.describe('[@smoke] Smoke Tests', () => {
  test('[@priority:critical] User can login', async ({ page }) => { });
  test('[@priority:high] User can search flights', async ({ page }) => { });
});

test.describe('[@regression][@supplier:all] Cross-Supplier Tests', () => {
  test('[@priority:critical] Booking completes', async ({ page }) => { });
});
```

### Available Tags

| Tag | Description |
|-----|-------------|
| `@smoke` | Smoke test, fast critical validation |
| `@regression` | Full regression test |
| `@priority:critical` | Must pass for deployment |
| `@priority:high` | Important but not blocking |
| `@priority:medium` | Standard coverage |
| `@supplier:all` | Runs against all suppliers |
| `@supplier:gds` | GDS suppliers only |
| `@supplier:ndc` | NDC suppliers only |

---

## CI/CD Integration

### GitHub Actions

The framework includes workflows for:

- **Test Suite**: Runs smoke and regression tests on push/PR
- **Dashboard**: Generates and publishes test reports

### Artifacts Generated

| Artifact | Format | Location |
|----------|--------|----------|
| Test Results | JUnit XML | `test-results/results.xml` |
| Test Results | JSON | `test-results/results.json` |
| HTML Report | Interactive | `playwright-report/` |
| Screenshots | PNG | `test-results/` (on failure) |
| Traces | ZIP | `test-results/` (on failure) |

---

## Debugging

| Issue | Solution |
|-------|----------|
| Element not found | Check locators in Page Object, verify timing |
| Timeout errors | Use explicit waits, check `src/utils/wait.js` |
| Authentication fails | Verify `.env` credentials, check CI secrets |
| Flaky tests | Replace hard waits with dynamic waits |

```bash
# Run with trace recording for investigation
npx playwright test --trace on path/to/test.spec.js

# View trace file
npx playwright show-trace test-results/trace.zip
```

**Artifacts on failure**: Screenshots and traces are auto-captured in `test-results/`

---

## Contributing

### For QA Engineers

1. **Write tests using DSL only** — never use raw selectors
2. **Follow naming conventions** — `*Page.js`, `*.spec.js`
3. **Add appropriate tags** — `@smoke`, `@regression`, `@priority:*`
4. **Keep tests independent** — no shared state between tests

### For Developers

1. **Locators in Page Objects only** — top of constructor
2. **DSL for business workflows** — combine Page Object methods
3. **Utils for helpers** — no UI logic
4. **Follow existing patterns** — check similar files first

### Code Style

- Methods use verbs: `selectFlight()`, `addPassenger()`
- Classes use nouns: `SearchPage`, `FlightResults`
- Constants use UPPER_SNAKE_CASE: `MAX_RETRY_COUNT`
- Comments explain **why**, not **what**

---

## AI Prompts

This repository uses an **approved prompt library** to ensure AI (GitHub Copilot) is used **safely, consistently, and predictably**, especially by non-developer QA engineers.

> **Free-form prompting is not allowed.** All contributors must use the prompts provided in the `prompts/` folder.

### Source of Truth

| File | Purpose |
|------|---------||
| `.github/copilot-instructions.md` | Global rules and architecture |
| `prompts/` | Approved prompt templates |

All prompts **must follow** the guidelines in `copilot-instructions.md`. If an AI suggestion conflicts with it, **ignore the suggestion**.

### Getting Started with Prompts

1. Read `.github/copilot-instructions.md` to understand the rules
2. Browse `prompts/` for the task you need
3. Copy the prompt and fill in your specific details
4. Never modify the prompt structure

---

## Support

- **Documentation**: See `docs/` folder
- **Copilot Guidelines**: See `.github/copilot-instructions.md`
- **Prompt Library**: See `prompts/` folder