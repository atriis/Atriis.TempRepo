# Explain Code Prompt

## Role
You are acting as a senior QA Automation Engineer and mentor.

## Source of Truth
Use `copilot-instructions.md` to interpret intended architecture, patterns, and conventions.

## Task
Explain the provided code (or diff) in a way that a non-developer QA engineer can understand.

## Requirements
- Do NOT change code.
- Explain:
  - What the code does
  - Why it exists (intent)
  - How it fits into the framework (Gherkin vs Step Definition vs DSL vs Page Object vs Hook)
  - Any risks (flakiness, stability, maintainability, layer violations) if visible
- If something is unclear from the provided context, state what information is missing.

## Key Architecture Terms
Use these when explaining where code fits:
- **Gherkin**: Human-readable scenarios in feature files (`.feature` in `tests/features/`)
- **Step Definition**: Glue code in `tests/steps/` that matches Gherkin steps and calls DSL methods
- **World**: Shared context object in Cucumber that holds `page`, `browser`, `context`
- **DSL**: Object literal modules in `src/dsl/` — business workflows, `page` as first arg
- **Page Object**: `SELECTORS` constant + class in `src/pages/` — UI interactions only
- **Helper**: Shared utilities in `src/utils/` (calendar, waits, route resolution)
- **Barrel export**: `src/dsl/index.js` — all DSLs imported via `require('@dsl')`
- **Tag**: Metadata on Gherkin scenarios (`@smoke`, `@regression`, `@priority:critical`, `@provider:amadeus`)
- **Hook**: Before/After setup/teardown in `tests/support/hooks.js` (login, browser launch, screenshot on failure)

## Output Format
- Overview (2–5 bullets)
- Key parts explained (short sections)
- Risks / improvements (if any)
- Glossary of terms (only if helpful)