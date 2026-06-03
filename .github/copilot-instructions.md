---
applyTo: src/, tests/
description: Cucumber BDD test automation framework with Playwright. Rules for layer separation, code generation, Gherkin scenarios, DSL methods, and Page Objects.
---

# Copilot Instructions – Playwright + Cucumber BDD Framework

- **Committing**: Always delegate to `@commit` agent (`.github/agents/commit.agent.md`). Do not commit directly.

## Project Overview

Playwright + Cucumber BDD framework for a corporate travel booking platform (Atriis OBT).  
**Stack**: Playwright ^1.40.0, Cucumber ^12.6.0, JavaScript ES6+, Node.js >=18.0.0  
**Domains**: Flights, Hotels, Cars, Rail, Ground Transport, Parking, Manual Quotes

## AI Agent Ecosystem

24 custom agents organized into pipelines. See [AGENTS.md](AGENTS.md) for full registry.

| Category | Agents | Purpose |
|----------|--------|---------|
| **Orchestrators** (8) | `@ado-pipeline`, `@feature-pipeline`, `@regression-pipeline`, `@ci-monitor`, `@todo-pipeline`, `@e2e-test-pipeline`, `@supplier-agent-orchestration`, `@flights-domain-orchestration` | End-to-end or domain workflows with user checkpoints |
| **Sub-Agents** (8) | `@ado-fetcher`, `@test-generator-pipeline`, `@test-runner-pipeline`, `@test-fixer-pipeline`, `@test-reporter-pipeline`, `@ci-checker`, `@strict-test-governor`, `@ado-publish-testcase` | Single-responsibility agents called by orchestrators |
| **Domain Agents** (4) | `@domain-flights`, `@domain-hotels`, `@domain-transportation`, `@domain-shell` | Domain knowledge consulted during generation/fixing |
| **Standalone** (4) | `@code-reviewer`, `@context-bridge`, `@test-case-converter`, `@testim-converter` | Independent tools not part of pipelines |

**Cross-project**: `../Atriis.App/src/app/Atriis.OBT/` — Vue source for UI selectors (`data-testid` preferred)

## Architecture Layers

| Layer | Location | Responsibility | Uses Only |
|-------|----------|----------------|-----------|
| **Gherkin Features** | `tests/features/` | Human-readable scenarios + tags | Step definitions |
| **Step Definitions** | `tests/steps/` | Parameter extraction, context setup | DSL methods |
| **DSL** | `src/dsl/` | Business workflows, assertions | Page objects, utils |
| **Page Objects** | `src/pages/` | UI selectors, atomic actions | Playwright APIs, utils |
| **Helpers** | `src/utils/` | Data generation, DOM helpers, waits | Playwright, external libs |

**Data flows DOWN only. Never skip layers or go backwards.**
- ❌ Tests must never call Page Objects directly
- ❌ DSL must never call Playwright APIs directly
- ❌ Page Objects must never contain business logic

## Core Principles

- **Clarity over cleverness** — Gherkin reads like user stories
- **Stability over speed** — Explicit waits; no hard sleeps
- **Existing patterns over new abstractions** — Extend before creating
- **Simple and explicit** — Clear method names, minimal nesting
- **Separation of concerns** — Each layer has one job

## Domain-Specific Rules

### Flights
- **ALWAYS cancel GDS flights** after test — real PNRs cost money
- **NEVER use low-cost flights from GDS suppliers** — causes false failures
- **Suppliers**: Amadeus GDS, Galileo GDS, Sabre GDS, Fusion, Ypsilon, Amadeus Light Ticketing, Galileo ACH, + NDC (AA, United, Lufthansa, Iberia, AFKL, British Airways)

### Hotels
- **NEVER book non-refundable hotels** — always filter by refundable at room level first
- Each supplier has specific test users in `.env`
- **Suppliers**: Amadeus GDS, Galileo GDS, Sabre GDS, Expedia, Booking.com, Ratehawk, eHotel, Travelodge, Premier Inn, Go Global

### Transportation
- **Cars**: Amadeus GDS, Galileo GDS, Sabre GDS, SunnyCars
- **Rails**: Benerail, Evolvi, Amtrak (each has its own step/DSL files)
- **Ground Transport / Parking**: Not fully implemented yet

### General
- **Login**: Username/password only (no SSO/MFA)
- **Payment**: Test credit card and invoice only
- **No hardcoded sleeps** — use `waitForSelector` > timeout increase > `waitForLoadState('networkidle')`

## Detailed Guidelines

- **[Cucumber Implementation](instructions/cucumber.md)** — BDD execution, hooks, world setup, tags
- **[Tests (Gherkin)](instructions/tests.md)** — Feature files, scenario syntax, tags, step placeholders
- **[DSL](instructions/dsl.md)** — Business workflows, method composition, assertions
- **[Page Objects](instructions/page-objects.md)** — Locator rules, atomic actions, initialization
- **[Error Handling](instructions/error-handling.md)** — Input validation, error messages
- **[Architecture](instructions/architecture.md)** — Layer separation, data flow patterns
- **[Logging](instructions/logging.md)** — Structured logging, debug context
- **[Playwright Best Practices](instructions/playwright-best-practices.md)** — Locator strategies, waits
- **[Naming Conventions](instructions/naming-conventions.md)** — Files, classes, methods
- **[Commit Guidelines](instructions/commit-guidelines.md)** — Commit messages, scopes
- **[Quick Reference](instructions/quick-reference.md)** — Code templates, snippets

## AI Assistance Rules

### Code Generation
- Extend existing code; don't rewrite unrelated files
- Follow existing patterns in the same file (check similar methods first)
- **Validate ALL inputs** in DSL methods per [error handling guidelines](instructions/error-handling.md):
  - `page` is always required and comes first
  - Type-check all parameters with descriptive messages: `if (!Array.isArray(items)) throw new Error('items must be an array, got: ' + typeof items);`
- Leave `TODO` comments when uncertain; prefer partial over incorrect
- Never change public method signatures without explicit request

### Gherkin
- Read like user stories — avoid technical jargon
- Tags: `@smoke`, `@regression`, `@priority:critical`, `@provider:amadeus`
- Given-When-Then; one action per step; use step parameters (`{string}` not hardcoded values)
- Scenarios must be idempotent (runnable in any order)

### DSL Methods
- One responsibility; method names start with verbs: `selectFlight()`, `addPassenger()`, `verifyPrice()`
- Compose from Page methods only — never write Playwright code in DSL
- Assertions live in DSL, not tests; handle errors with context-rich re-throws
- Example signature: `async selectFlight(page, flightIndex) { ... }`

### Page Objects
- Locators only — no business logic, no assertions, no workflows
- Atomic actions — one Playwright action per method
- Declare locators in constructor; use `SELECTORS` constant (UPPER_SNAKE_CASE)
- Use `getPageObject(page, PageClass)` from `@utils/pageObjectCache` — never `new PageClass(page)` directly
- Always include timeout on `waitFor` calls; validate index ranges
- Prefer `data-testid` — check `../Atriis.App/src/app/Atriis.OBT/` for real selectors

## Environment & Configuration

### User Login
- Emails written directly in feature files: `Given I am logged in as "ruimariano@amadeus.com"`
- Only `GENERAL_PASSWORD` is read from `.env` (shared password for all test accounts)
- Only single-email login steps supported: `Given I am logged in as {string}`

### CI/CD
- **Workflow**: `.github/workflows/test-suite.yml` — 7 matrix jobs (flights-amadeus, flights-general, flights-galileo, flights-sabre, cars, hotels, rails) + report job
- **Schedule**: Daily at 18:30 UTC + `workflow_dispatch`
- **Retry**: Native Cucumber retry, CI only (`CI=true`), `--retry 2`. Job fails only if a scenario fails every attempt.
- **Artifacts**: Screenshots + Playwright traces on failure → `test-results/screenshots/`; JSON + JUnit XML in `test-results/`

## Common Patterns

**New scenario**: feature file in `tests/features/` → tags + Gherkin → step definitions in `tests/steps/` → call existing DSL (create new DSL only if needed)

**New DSL method**: find existing file in `src/dsl/` → add method with full input validation → compose Page methods → include assertions

**Update Page Object**: find file in `src/pages/` → add locator to constructor → add atomic action method → include timeout + parameter validation

---

> If a non-developer QA engineer reads this code, they should understand **what** happens, **where**, and **why** — without asking.
