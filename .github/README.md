# Atriis Automation – AI-Assisted Development Guide

This guide explains how to use GitHub Copilot and the custom AI agents in this Playwright + Cucumber BDD test automation framework.

**For non-developers (QA Engineers)**: This project has ready-to-use agents that do the heavy lifting. You do not need to write complex Copilot prompts. Just invoke the right agent and describe what you need.

---

## Quick Start

Using an agent is always the same three steps:

1. **Open Copilot Chat** in VS Code
2. **Type the agent name** in the chat -- e.g. @feature-pipeline
3. **Describe your task** below the agent name

That's it. The agent reads the codebase, follows project rules, and produces working code.

---

## Available Agents

All agents live in .github/agents/. See [AGENTS.md](AGENTS.md) for the full registry.

### Orchestrators -- end-to-end workflows

| Agent | How to invoke | What it does |
|-------|--------------|-------------|
| @ado-pipeline | @ado-pipeline 74500 | ADO work item -- generates Gherkin test -- runs -- fixes until passing -- reports |
| @feature-pipeline | Describe a scenario | QA description -- generates feature + steps + DSL -- runs -- fixes -- reports |
| @regression-pipeline | @regression-pipeline @smoke | Runs test suite -- collects failures -- auto-fixes -- generates report |
| @ci-monitor | (no args) | Checks latest CI run -- fixes failures -- daily health report |
| @todo-pipeline | @todo-pipeline path/ | Scans TODO steps -- implements missing DSL/steps -- runs until passing |

### Sub-Agents -- also usable standalone

| Agent | Purpose |
|-------|---------|
| @ado-fetcher | Fetch and parse an ADO work item into structured context |
| @test-generator-pipeline | Generate Gherkin + steps + DSL from structured context |
| @test-runner-pipeline | Run tests and capture structured results |
| @test-fixer-pipeline | Analyse failures and apply the smallest safe fixes |
| @test-reporter-pipeline | Generate reports, write to Cortex.QA, post ADO comments |
| @ci-checker | Parse GitHub Actions results and return structured failures |

### Domain Agents -- specialist knowledge

| Agent | Covers |
|-------|--------|
| @domain-flights | GDS (Amadeus, Galileo, Sabre) + NDC (AA, UA, LH, IB, AFKL, BA) flights |
| @domain-hotels | 10 hotel suppliers, refundable-only rules, per-supplier test users |
| @domain-transportation | Cars, Rail (Benerail, Evolvi, Amtrak), Ground Transport, Parking |
| @domain-shell | Login, cart, checkout, approvals, cross-domain patterns |

### Standalone Tools

| Agent | How to invoke | Purpose |
|-------|--------------|---------|
| @code-reviewer | After making changes | Review stability, maintainability, adherence to project patterns |
| @generate-dsl-method | Describe the method | Create or update a single DSL method |
| @test-case-converter | Paste manual test | Convert ADO/spreadsheet test cases to Gherkin feature files |
| @testim-converter | Paste Testim test | Migrate Testim tests to Cucumber BDD format |
| @context-bridge | (no args) | Explore coverage gaps, find selectors, link bugs to tests |

---

## Common Task Recipes

### I have a bug in ADO and want an automated test

```
@ado-pipeline 74500
```

The agent fetches the bug, generates a Gherkin scenario, implements steps and DSL, runs the test, and fixes failures -- with checkpoints for your approval.

---

### I want to automate a scenario not in ADO

```
@feature-pipeline
I want to test that a traveler can search for a hotel in Paris,
filter by refundable rooms, and see prices in EUR.
User is "bruna". Supplier is Ratehawk.
```

---

### I need to add a DSL method

```
@generate-dsl-method
Add a method to HotelSearch.js called selectRoomType(page, roomType)
that filters hotel results by room type using the filter panel.
```

---

### My test is failing and I do not know why

```
@test-fixer-pipeline
<paste the error message and failing feature file path>
```

---

### I want to review code before committing

```
@code-reviewer
Files changed:
- src/dsl/HotelSearch.js
- tests/steps/hotel_search.steps.js
Please review for stability and DSL clarity.
```

---

### I want to run the smoke suite and get a report

```
@regression-pipeline @smoke
```

---

## Important Rules

- **Never ask Copilot to just fix it** -- always describe the behaviour you expect
- **Never invent new patterns** -- always check for existing DSL/pages first
- **Never skip layers** -- steps to DSL to pages (never steps to pages directly)
- **When in doubt, review first** -- use @code-reviewer before committing

---

## Reference

| Resource | Location |
|----------|----------|
| Agent registry | [AGENTS.md](AGENTS.md) |
| Architecture rules | [instructions/architecture.md](instructions/architecture.md) |
| DSL guidelines | [instructions/dsl.md](instructions/dsl.md) |
| Page Object guidelines | [instructions/page-objects.md](instructions/page-objects.md) |
| Gherkin / step guidelines | [instructions/tests.md](instructions/tests.md) |
| Copilot coding rules | [copilot-instructions.md](copilot-instructions.md) |
| Main project README | [../README.md](../README.md) |

