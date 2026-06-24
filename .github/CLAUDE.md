# Claude – Playwright + Cucumber BDD Framework

- **Committing**: Always delegate to the commit agent (`.github/agents/commit.agent.md`). Do not commit directly.
- **Before editing any layer**, read the relevant instruction file from `.github/instructions/` (see [Detailed Guidelines](#detailed-guidelines)).
- **Before creating anything new**, use Grep/Glob to search for existing implementations first.

## Project Overview

Playwright + Cucumber BDD framework for a corporate travel booking platform (Atriis OBT).  
**Stack**: Playwright ^1.40.0, Cucumber ^12.6.0, JavaScript ES6+, Node.js >=18.0.0  
**Domains**: Flights, Hotels, Cars, Rail, Ground Transport, Parking, Manual Quotes  
**Cross-project**: `../Atriis.App/src/app/Atriis.OBT/` — Vue source for UI selectors (`data-testid` preferred)

## Agent Ecosystem

24 custom agents in `.github/agents/`. See [AGENTS.md](.github/AGENTS.md) for full registry.

| Category | Agents | Purpose |
|----------|--------|---------|
| **Orchestrators** (8) | `@ado-pipeline`, `@feature-pipeline`, `@regression-pipeline`, `@ci-monitor`, `@todo-pipeline`, `@e2e-test-pipeline`, `@supplier-agent-orchestration`, `@flights-domain-orchestration` | End-to-end or domain workflows with user checkpoints |
| **Sub-Agents** (8) | `@ado-fetcher`, `@test-generator-pipeline`, `@test-runner-pipeline`, `@test-fixer-pipeline`, `@test-reporter-pipeline`, `@ci-checker`, `@strict-test-governor`, `@ado-publish-testcase` | Single-responsibility agents called by orchestrators |
| **Domain Agents** (4) | `@domain-flights`, `@domain-hotels`, `@domain-transportation`, `@domain-shell` | Domain knowledge consulted during generation/fixing |
| **Standalone** (4) | `@code-reviewer`, `@context-bridge`, `@test-case-converter`, `@testim-converter` | Independent tools not part of pipelines |

When invoking an agent, read its `.github/agents/<name>.agent.md` file first to understand its contract.

## Architecture Layers

Layered Cucumber BDD: **Feature → Step → DSL → Page Object → Playwright**. Data flows down only — never skip a layer or call backwards (no Step → Page, no DSL → Playwright, no business logic in Steps/Pages).

Full layer responsibilities, path aliases, and project structure: [`.github/instructions/architecture.md`](.github/instructions/architecture.md).

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

Read the relevant file before working on that area:

- [`.github/instructions/cucumber.md`](.github/instructions/cucumber.md) — BDD execution, hooks, world setup, tags
- [`.github/instructions/tests.md`](.github/instructions/tests.md) — Feature files, scenario syntax, tags, step placeholders
- [`.github/instructions/dsl.md`](.github/instructions/dsl.md) — Business workflows, method composition, assertions
- [`.github/instructions/page-objects.md`](.github/instructions/page-objects.md) — Locator rules, atomic actions, initialization
- [`.github/instructions/error-handling.md`](.github/instructions/error-handling.md) — Input validation, error messages
- [`.github/instructions/architecture.md`](.github/instructions/architecture.md) — Layer separation, data flow patterns
- [`.github/instructions/logging.md`](.github/instructions/logging.md) — Structured logging, debug context
- [`.github/instructions/playwright-best-practices.md`](.github/instructions/playwright-best-practices.md) — Locator strategies, waits
- [`.github/instructions/naming-conventions.md`](.github/instructions/naming-conventions.md) — Files, classes, methods
- [`.github/instructions/commit-guidelines.md`](.github/instructions/commit-guidelines.md) — Commit messages, scopes
- [`.github/instructions/quick-reference.md`](.github/instructions/quick-reference.md) — Code templates, snippets

## Behavior Rules

### Before Editing
- Use Grep to search `tests/steps/`, `src/dsl/`, `src/pages/`, `src/utils/` for existing implementations
- Read the target file and at least one similar file to understand the pattern in use
- For selector issues, read the relevant component in `../Atriis.App/src/app/Atriis.OBT/` first

### Code Generation
- Extend existing code; don't rewrite unrelated files
- Follow existing patterns in the same file
- **Validate ALL inputs** in DSL methods: `page` is always required and comes first; type-check all parameters with descriptive messages: `if (!Array.isArray(items)) throw new Error('items must be an array, got: ' + typeof items);`
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
- Assertions: business/test assertions belong in the step `Then`; DSL holds **only critical state validation** (e.g., booking status, page-ready checks) — see [`dsl.md`](instructions/dsl.md). Handle errors with context-rich re-throws

### Page Objects
- Locators only — no business logic, no assertions, no workflows
- Atomic actions — one Playwright action per method
- Declare locators in constructor; use `SELECTORS` constant (UPPER_SNAKE_CASE)
- Use `getPageObject(page, PageClass)` from `@utils/pageObjectCache` — never `new PageClass(page)` directly
- Always include timeout on `waitFor` calls; validate index ranges
- Prefer `data-testid` — read `../Atriis.App/src/app/Atriis.OBT/` for real selectors

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
