---
applyTo: src/, tests/
description: Layer responsibilities, one-way data flow, dependency rules, and project structure.
---

# Architecture Guidelines

Cucumber BDD layered architecture. **Data flows down only** — never skip a layer or call backwards.

## Layers & Data Flow

| Layer | Location | Responsibility | May call |
|-------|----------|----------------|----------|
| **Gherkin Features** | `tests/features/` | Human-readable scenarios + tags | Step definitions |
| **Step Definitions** | `tests/steps/` | Extract parameters, invoke DSL | DSL methods |
| **DSL** | `src/dsl/` | Business workflows, critical state checks | Page Objects, utils |
| **Page Objects** | `src/pages/` | UI selectors, atomic Playwright actions | Playwright APIs, utils |
| **Helpers** | `src/utils/` | Waits, DOM, data generation | Playwright, external libs |

```
Feature → Step Definition → DSL → Page Object → Playwright
```

### Forbidden

- ❌ Feature / Step → Page Object or Playwright (must go through DSL)
- ❌ DSL → Playwright APIs (must go through Page Objects)
- ❌ Page Object → DSL (backwards / circular)
- ❌ Business logic in Steps or Page Objects (belongs in DSL)

## Key Structural Rules

- **DSLs** are object-literal modules; `page` is the first argument — see [dsl.md](dsl.md)
- **Page Objects** are a `SELECTORS` const + class — see [page-objects.md](page-objects.md)
- **Step definitions** use `function` handlers; the active page is `this.page` (not `global.page`) — see [cucumber.md](cucumber.md)
- Instantiate Page Objects via `getPageObject(page, PageClass)` from `@utils/pageObjectCache` — never `new PageClass(page)`
- All DSLs are exported through the `src/dsl/index.js` barrel: `const { FlightSearch } = require('@dsl')`

## Path Aliases (`jsconfig.json`)

| Alias | Resolves to |
|-------|-------------|
| `@src/*` | `src/*` |
| `@pages/*` | `src/pages/*` |
| `@dsl/*` | `src/dsl/*` (bare `@dsl` → barrel `index.js`) |
| `@data/*` | `src/data/*` |
| `@utils/*` | `src/utils/*` |
| `@config/*` | `src/config/*` |
| `@fixtures/*` | `tests/fixtures/*` |

## Project Structure

```
src/
├── pages/        Page Objects (SELECTORS const + class)
├── dsl/          Business workflows (object literals) + index.js barrel
├── utils/        Helpers — waits, dom, logger, route/calendar helpers, data generators
├── data/         Static test data (JSON: flights, hotels, cars, rails…)
├── config/       Centralized config + transportation orchestration
└── assertions/   Reusable assertion helpers

tests/
├── features/     Gherkin .feature by domain:
│                   flights/ (amadeus, galileo, sabre, travelfusion, ypsilon, *_ndc, general),
│                   hotels/, cars/, rails/ (amtrak, benerail), ground_transport/,
│                   parking/, shell/, transportation/, smoke/
├── steps/        Step definitions (Cucumber glue)
└── support/      hooks.js (Before/After lifecycle), world.js (custom World)
```

## When to Create New Files

| Type | Create when | Naming → [naming-conventions.md](naming-conventions.md) |
|------|-------------|--------|
| Feature File | New business scenario area | kebab-case `*.feature` |
| Step Definition | New step patterns | `*_steps.js` |
| Page Object | New page/section, or file > 200 lines | `*Page.js` |
| DSL | New business domain, or file > 300 lines | descriptive noun (`FlightSearch.js`) |
| Helper | Pure utility needed across layers | `*.helper.js` |

## Checklist

- [ ] Dependencies flow downward only (Feature → Steps → DSL → Pages → Playwright)
- [ ] No layer bypassing (no Step → Page, no DSL → Playwright) and no backwards/circular imports
- [ ] DSLs are object literals with `page` first; Page Objects hold selectors + atomic actions only
- [ ] Assertions live in steps/DSL, never in Page Objects (DSL holds critical state checks only)
- [ ] Page Objects obtained via `getPageObject`; new DSLs exported via `src/dsl/index.js`
- [ ] No God Objects — split search / results / pricing into separate files
