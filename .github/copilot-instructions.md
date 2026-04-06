---
applyTo: src/, tests/
description: Cucumber BDD test automation framework with Playwright. Rules for layer separation, code generation, Gherkin scenarios, DSL methods, and Page Objects.
---

# GitHub Copilot Instructions – Playwright + Cucumber BDD Automation Framework

## Project Overview

Playwright + Cucumber BDD test automation framework for a corporate travel booking platform (Atriis). 

**Test Approach**: Behavior-Driven Development (BDD) using human-readable Gherkin scenarios  
**Application**: Flights, Hotels, Cars, Rail, Ground Transport, Parking, Manual Quotes  
**Tech Stack**: 
- Playwright (^1.40.0) – Browser automation
- Cucumber (^12.6.0) – BDD test runner with Gherkin parsing
- JavaScript (ES6+) – Test & DSL implementation
- Node.js (>=18.0.0) – Runtime

## AI Agent Ecosystem

This project has **20 custom agents** organized into pipelines. See [AGENTS.md](AGENTS.md) for full registry.

| Category | Agents | Purpose |
|----------|--------|---------|
| **Orchestrators** (5) | `@ado-pipeline`, `@feature-pipeline`, `@regression-pipeline`, `@ci-monitor`, `@todo-pipeline` | End-to-end workflows with user checkpoints |
| **Sub-Agents** (6) | `@ado-fetcher`, `@test-generator-pipeline`, `@test-runner-pipeline`, `@test-fixer-pipeline`, `@test-reporter-pipeline`, `@ci-checker` | Single-responsibility tasks called by orchestrators |
| **Domain Agents** (4) | `@domain-flights`, `@domain-hotels`, `@domain-transportation`, `@domain-shell` | Domain-specific knowledge consulted during generation/fixing |
| **Standalone** (5) | `@code-reviewer`, `@context-bridge`, `@generate-dsl-method`, `@test-case-converter`, `@testim-converter` | Independent tools not part of pipelines |

### Cross-Project References
- **Atriis.App** (`../Atriis.App/src/app/Atriis.OBT/`) – Vue source for UI selectors (`data-testid` preferred)
- **Cortex.QA** (`../Cortex.QA/`) – QA knowledge hub for findings, reports, and ADO investigation context

## How Tests Flow

```
┌─────────────────────────────────────┐
│  Gherkin Feature Files              │
│  (Human-readable scenarios)         │
└──────────────┬──────────────────────┘
               │ Step definitions call
               ▼
┌─────────────────────────────────────┐
│  Step Definitions (tests/steps/)    │
│  (Parameter extraction & context)   │
└──────────────┬──────────────────────┘
               │ Invoke
               ▼
┌─────────────────────────────────────┐
│  DSL Methods (src/dsl/)             │
│  (Business workflows & assertions)  │
└──────────────┬──────────────────────┘
               │ Uses
               ▼
┌─────────────────────────────────────┐
│  Page Objects (src/pages/)          │
│  (UI selectors & atomic actions)    │
└──────────────┬──────────────────────┘
               │ Playwright APIs
               ▼
┌─────────────────────────────────────┐
│  Browser Automation                 │
└─────────────────────────────────────┘
```

## Architecture Layers

| Layer | Location | Responsibility | Uses Only |
|-------|----------|----------------|-----------|
| **Gherkin Features** | `tests/features/` | Human-readable scenarios with tags | Step definitions |
| **Step Definitions** | `tests/steps/` | Parameter extraction, context setup | DSL methods |
| **DSL** | `src/dsl/` | Business workflows, assertions | Page objects, utils |
| **Page Objects** | `src/pages/` | UI selectors, atomic actions | Playwright APIs, utils |
| **Helpers** | `src/utils/` | Data generation, DOM helpers, waits | Playwright, external libs |

**Critical Rule**: Data flows DOWN only. Never skip layers or go backwards.
- Tests (Gherkin) → Step Defs → DSL → Pages → Playwright
- ❌ Tests must never call Page Objects directly
- ❌ DSL must never call Playwright APIs directly
- ❌ Page Objects must never contain business logic

## Core Principles

- **Clarity over cleverness** – Gherkin must read like user stories
- **Stability over speed** – Reliable tests with explicit waits; no hard sleeps
- **Existing patterns over new abstractions** – Extend existing DSL/Pages before creating
- **Simple and explicit over over-engineered** – Clear method names, minimal nesting
- **Separation of concerns** – Each layer has one job

## Domain-Specific Critical Rules

### Flights
- **ALWAYS cancel GDS flights** after test – real PNRs cost money
- **NEVER use low-cost flights from GDS suppliers** – unreliable, causes false failures
- **Suppliers**: Amadeus GDS, Galileo GDS, Sabre GDS, Fusion, Ypsilon, Amadeus Light Ticketing, Galileo ACH, + NDC (American Airlines, United, Lufthansa, Iberia, AFKL, British Airways)

### Hotels
- **NEVER book non-refundable hotels** – always filter by refundable at room level first
- **Each supplier has specific test users** in `.env`
- **Suppliers**: Amadeus GDS, Galileo GDS, Sabre GDS, Expedia, Booking.com, Ratehawk, eHotel, Travelodge, Premier Inn, Go Global

### Transportation
- **Cars**: Amadeus GDS, Galileo GDS, Sabre GDS, SunnyCars
- **Rails**: Benerail, Evolvi, Amtrak (each has its own step/DSL files)
- **Ground Transport / Parking**: Not fully implemented yet

### General
- **Login**: Username/password only (no SSO/MFA in tests)
- **Payment**: Test credit card and invoice are the two available methods
- **No hardcoded sleeps** – use `waitForSelector` > timeout increase > `waitForLoadState('networkidle')`

## Detailed Guidelines

For comprehensive guidelines on each layer, see:

- **[Cucumber Implementation](instructions/cucumber.md)** – BDD execution, hooks, world setup, tags, step definitions
- **[Tests (Gherkin)](instructions/tests.md)** – Feature files, scenario syntax, tags, step placeholders
- **[Step Definitions](instructions/tests.md)** – Glue code connecting Gherkin to DSL
- **[DSL](instructions/dsl.md)** – Business workflows, method composition, assertions
- **[Page Objects](instructions/page-objects.md)** – Locator rules, atomic actions, initialization
- **[Error Handling](instructions/error-handling.md)** – Input validation, error messages
- **[Architecture](instructions/architecture.md)** – Layer separation, data flow patterns
- **[Logging](instructions/logging.md)** – Structured logging, debug context
- **[Playwright Best Practices](instructions/playwright-best-practices.md)** – Locator strategies, waits, synchronization
- **[Naming Conventions](instructions/naming-conventions.md)** – Files, classes, methods
- **[Commit Guidelines](instructions/commit-guidelines.md)** – Commit messages, scopes
- **[Quick Reference](instructions/quick-reference.md)** – Code templates, snippets

## AI Assistance Rules

When working with Copilot, follow these rules strictly:

### Code Generation

- **Extend existing code**, don't rewrite unrelated files
- **Follow existing patterns** in the same file (check similar methods first)
- **Validate ALL inputs** in DSL methods following [error handling guidelines](instructions/error-handling.md):
  - `page` parameter is always required and comes first
  - Type check all parameters (string, number, array, etc.)
  - Include descriptive error messages: `${paramName} must be ${expected}, got: ${actual}`
  - Example: `if (!Array.isArray(items)) throw new Error('items must be an array, got: ' + typeof items);`
- **Leave TODO comments** when uncertain about implementation details
- **Prefer partial implementation** over incorrect behavior
- **Never change public method signatures** without explicit request

### Gherkin Scenario Writing

- **Read like user stories** – Avoid technical jargon
- **Use proper tags** – `@smoke`, `@regression`, `@priority:critical`, `@provider:amadeus`
- **Follow Given-When-Then** – One action per step when possible
- **Use step parameters** – `Given I am logged in as {string}` not hardcoded values
- **Be idempotent** – Scenarios should run in any order

### DSL Method Guidelines

- **One responsibility** – Method names start with verbs: `selectFlight()`, `addPassenger()`, `verifyPrice()`
- **Compose from Page methods** – Never write Playwright code in DSL
- **Assert outcomes** – Assertions live in DSL, not tests
- **Handle errors gracefully** – Catch and re-throw with context
- **Example signature**: `async selectFlight(page, flightIndex) { ... }`

### Page Object Guidelines

- **Locators only** – No business logic, no assertions, no workflows
- **Atomic actions** – One Playwright action per method: `click()`, `fill()`, `waitFor()`
- **Meaningful names** – `clickBookButton()` not `clickButton()`
- **Declare locators in constructor** – Never inline selectors
- **SELECTORS constant** – Use UPPER_SNAKE_CASE outside the class
- **Use `getPageObject(page, PageClass)`** from `@utils/pageObjectCache` – never `new PageClass(page)` directly
- **Validate parameters** – Index ranges, selector existence
- **Use explicit waits** – Always include timeout on waitFor calls
- **Prefer `data-testid`** – Check `../Atriis.App/src/app/Atriis.OBT/` for real selectors

## Environment & Configuration

### User Discovery

Users are auto-discovered from environment variables. No code changes needed:
- Preferred env var: `USER_RUIMARIANO=user@example.com`
- Preferred Gherkin usage: `Given I am logged in as "ruimariano"`
- Only single-label login steps are supported: `Given I am logged in as {string}`

### CI/CD Features

- **CI Workflow**: `.github/workflows/test-suite.yml` with 6 test jobs (smoke, daily-cars, daily-flights, daily-shell, daily-hotels, daily-rails) + summary
- **Schedule**: Daily at 21:00 UTC, also on push and PR
- **Retry Logic**: Enabled only in CI (`CI=true`), configured via `RETRY_COUNT` and `RETRY_DELAY`
- **Screenshot Capture**: Automatic on failure, saved to `test-results/screenshots/`
- **Playwright Traces**: Captured on failure alongside screenshots
- **Cucumber Reports**: JSON + JUnit XML formats in `test-results/`

## Common Scenarios

### Adding a New Gherkin Scenario

1. Create feature file: `tests/features/flights/general/my_scenario.feature`
2. Write readable Gherkin with proper tags
3. Run: `npx cucumber-js` (steps auto-discovered)
4. Implement step definitions in `tests/steps/`
5. Call existing DSL methods; create new DSL if needed

### Adding a DSL Method

1. Find existing DSL in `src/dsl/` (FlightSearch.js, Cart.js, etc.)
2. Add method with full input validation
3. Compose Page methods to achieve business action
4. Include assertions to verify success
5. Document parameters and behavior in comments

### Updating a Page Object

1. Find page in `src/pages/` (FlightSearchPage.js, CartPage.js, etc.)
2. Add locator to constructor
3. Add atomic action method (`click()`, `fill()`, etc.)
4. Include timeout on any wait calls
5. Validate parameters (selector existence, index range)

## Guiding Principle

> If a non-developer QA engineer reads this code, they should understand:
> - **What happens** – Clear method names and Gherkin
> - **Where it happens** – Which page/layer is involved
> - **Why it exists** – Comments explain intent, not implementation
>
> Without needing to ask.
