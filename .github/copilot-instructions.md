# GitHub Copilot Instructions – Playwright Automation Framework

## Project Overview
Playwright + Cucumber BDD framework for corporate travel booking automation (Atriis). Designed for **non-developer QA engineers** with layered architecture.

**Application**: Flights, Hotels, Cars, Rail, Ground Transport, Parking, Manual Quotes  
**Tech Stack**: Playwright, Cucumber, JavaScript (ES6+), Node.js

## Core Principles
- **Clarity over cleverness** – Simple, explicit code beats clever abstractions
- **Stability over speed** – Reliable tests over fast, flaky ones
- **Existing patterns over new abstractions** – Extend before creating
- **Simple and explicit over over-engineered** – Don't add unnecessary complexity

## Architecture Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Page Objects** | `src/pages/` | UI elements & low-level actions |
| **DSL** | `src/dsl/` | Business actions in domain language |
| **Tests** | `tests/` | Scenario orchestration & assertions |
| **Helpers** | `src/utils/` | Utilities (data, formatting, waits) |

**❌ Never mix responsibilities across layers.**

**Data Flow**: Test → DSL → Page Object → Browser

## Detailed Instructions
For comprehensive guidelines, see:
- **[Page Objects](instructions/page-objects.md)** – Locator rules, behavior patterns, examples
- **[DSL](instructions/dsl.md)** – Business logic layer guidelines
- **[Tests](instructions/tests.md)** – Writing readable, maintainable tests
- **[Architecture](instructions/architecture.md)** – Layer separation, data flow, patterns
- **[Playwright Best Practices](instructions/playwright-best-practices.md)** – Locators, waits, assertions
- **[Naming Conventions](instructions/naming-conventions.md)** – Files, classes, methods
- **[Commit Guidelines](instructions/commit-guidelines.md)** – Commit message format, scopes, examples
- **[Quick Reference](instructions/quick-reference.md)** – Code templates, cheat sheets

## AI Assistant Rules
- Extend existing code, don't rewrite unrelated files
- Follow existing patterns and naming conventions
- Leave `// TODO` comments when unsure
- Prefer partial implementation over incorrect behavior
- Never change public method signatures without request
- When generating commit messages, follow [commit guidelines](instructions/commit-guidelines.md)

## Guiding Principle
> If a non-developer QA engineer reads this code, they should understand **what happens**, **where it happens**, and **why it exists**—without needing to ask.
