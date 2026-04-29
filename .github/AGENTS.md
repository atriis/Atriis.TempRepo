# Atriis.Test.Automation Agents Registry

Custom agents for the Playwright + Cucumber BDD automation framework. Use these with `@agent-name` or through `runSubagent()` calls.

## Architecture Overview

```
┌─── ORCHESTRATORS (invoke sub-agents, manage state, pause for review) ───┐
│                                                                          │
│  @ado-pipeline                 ADO work item → full test lifecycle       │
│  @feature-pipeline             Manual description → full test lifecycle  │
│  @regression-pipeline          Run suite → fix failures → report         │
│  @ci-monitor                   Check GitHub Actions → fix → daily report │
│  @todo-pipeline                Resolve TODOs → implement → run → pass    │
│  @e2e-test-pipeline            ADO work item → governed end-to-end flow  │
│  @supplier-agent-orchestration Supplier matrix execution across domains   │
│  @flights-domain-orchestration Flight supplier orchestration             │
│                                                                          │
├─── SUB-AGENTS (single responsibility, called by orchestrators) ──────────┤
│                                                                          │
│  @ado-fetcher              Fetch & parse ADO work items                  │
│  @test-generator-pipeline  Generate Gherkin + steps + DSL                │
│  @test-runner-pipeline     Execute tests, capture results                │
│  @test-fixer-pipeline      Analyze failures, apply minimal fixes         │
│  @test-reporter-pipeline   Generate local reports and ADO summaries       │
│  @ci-checker               Parse GitHub Actions results                  │
│  @strict-test-governor     Enforce reuse-first and anti-duplication      │
│  @ado-publish-testcase     Publish generated Gherkin to ADO Test Cases   │
│                                                                          │
├─── DOMAIN AGENTS (specialized knowledge, consulted by sub-agents) ───────┤
│                                                                          │
│  @domain-flights           Flight booking domain knowledge               │
│  @domain-hotels            Hotels orchestration + domain knowledge       │
│  @domain-transportation    Cars/Rail/Ground/Parking knowledge            │
│  @domain-shell             Generic/cross-domain patterns                 │
│                                                                          │
├─── STANDALONE AGENTS (independent, not part of pipelines) ───────────────┤
│                                                                          │
│  @code-reviewer            Review changes for quality                    │
│  @context-bridge           Connect ADO + Atriis.OBT + Automation         │
│  @test-case-converter      Manual test cases → Gherkin                   │
│  @testim-converter         Testim exports → Gherkin                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow (Pipelines)

```
Orchestrator → Sub-Agent → Sub-Agent → ... → Report
     │              │            │
     │         consults     consults
     │              │            │
     │         Domain Agent  Domain Agent
     │
  State object passed forward at each phase
  User checkpoint between every phase (semi-auto)
```

---

## Orchestrator Agents

### ado-pipeline
**Purpose**: End-to-end pipeline from ADO work item to working automated test.

**Trigger**: `@ado-pipeline 74500` or `@ado-pipeline Bug #74500`

**Phases**: Fetch ADO → Generate Test → Run → Fix (×5) → Report

**Sub-agents used**: `@ado-fetcher` → `@test-generator-pipeline` + `@domain-*` → `@test-runner-pipeline` → `@test-fixer-pipeline` → `@test-reporter-pipeline`

**Checkpoints**: After every phase (semi-auto)

---

### feature-pipeline
**Purpose**: End-to-end pipeline from a QA engineer's plain-English description to working automated test.

**Trigger**: `@feature-pipeline I need a test that searches for a round-trip flight...`

**Phases**: Parse & Classify → Generate Test → Run → Fix (×5) → Report

**Sub-agents used**: `@test-generator-pipeline` + `@domain-*` → `@test-runner-pipeline` → `@test-fixer-pipeline` → `@test-reporter-pipeline`

**Checkpoints**: After every phase (semi-auto)

---

### regression-pipeline
**Purpose**: Run a full test suite, collect failures, auto-fix, and generate a comprehensive regression report.

**Trigger**: `@regression-pipeline @regression` or `@regression-pipeline @smoke`

**Phases**: Run Suite → Classify Failures → Fix-Rerun Loop (×5) → Report

**Sub-agents used**: `@test-runner-pipeline` → `@test-fixer-pipeline` + `@domain-*` → `@test-reporter-pipeline`

**Checkpoints**: After every phase (semi-auto)

---

### ci-monitor
**Purpose**: Daily CI health check — fetch GitHub Actions results, fix failures, generate daily report.

**Trigger**: `@ci-monitor` or `@ci-monitor --branch main`

**Phases**: Check CI → Classify → Fix-Rerun Loop (×5) → Daily Report

**Sub-agents used**: `@ci-checker` → `@test-fixer-pipeline` + `@domain-*` → `@test-runner-pipeline` → `@test-reporter-pipeline`

**Requires**: GitHub CLI (`gh`) — see agent for setup guide

**Checkpoints**: After every phase (semi-auto)

---

### todo-pipeline
**Purpose**: Resolve TODO comments in existing tests — scan for TODOs, implement missing step definitions, DSL methods, and page object updates, run tests until passing.

**Trigger**: `@todo-pipeline {featurePath}` or `@todo-pipeline --scan` or `@todo-pipeline --scan --domain hotels`

**Phases**: Scan TODOs → Implement (bottom-up: locators → pages → DSL → steps) → Run → Fix (×5) → Report

**Sub-agents used**: `@test-generator-pipeline` + `@domain-*` → `@test-runner-pipeline` → `@test-fixer-pipeline` → `@test-reporter-pipeline`

**Features**:
- Deduplicates shared TODOs across files (one implementation resolves many)
- Bottom-up implementation order (locators first, steps last)
- Batches files by domain for efficiency
- Removes resolved TODO comments, keeps future-note TODOs

**Checkpoints**: After every phase (semi-auto)

---

### e2e-test-pipeline
**Purpose**: Governed end-to-end pipeline from ADO work item to generated feature, validated implementation, execution, reporting, ADO publishing, and deployment.

**Trigger**: `@e2e-test-pipeline 75155` or `@e2e-test-pipeline Bug #75155`

**Phases**: Git Prep → Generate Test → Governance Review → Env Setup → Step Validation → Governance Review → Run & Fix → Report → Child Bugs → Publish ADO Test Case → Deploy

**Sub-agents used**: `@ado-fetcher` → `@test-generator-pipeline` → `@strict-test-governor` → `@todo-pipeline` → `@test-runner-pipeline` → `@test-fixer-pipeline` → `@test-reporter-pipeline` → `@ado-publish-testcase`

**Checkpoints**: After every phase (semi-auto)

---

### supplier-agent-orchestration
**Purpose**: Run supplier-matrix automation flows across domains and aggregate failures by domain and supplier.

**Trigger**: `@supplier-agent-orchestration ...`

**Phases**: Load registry → Initialize domain agents → Execute supplier flows → Aggregate failures → Report

**Consults**: `@domain-flights`, `@domain-hotels`, `@domain-transportation`, `@domain-shell`

---

### flights-domain-orchestration
**Purpose**: Execute flight-specific supplier orchestration using configuration-driven runs and aggregate results into JSON/Markdown reports.

**Trigger**: `@flights-domain-orchestration ...`

**Config source**: `src/config/flights-orchestration.json`

---

## Sub-Agents

### ado-fetcher
**Purpose**: Fetch and parse an ADO work item (Bug, Test Case, or User Story) into structured context.

**Input**: Work item ID
**Output**: Structured source context + resolved domain
**Uses**: Azure CLI (`az boards work-item show`)

---

### test-generator-pipeline
**Purpose**: Generate Gherkin feature files, step definitions, and DSL methods from structured context.

**Input**: Source context (from ADO or manual) + domain
**Output**: Feature file path, new/reused steps, DSL methods created
**Consults**: Domain agents for specialized patterns

---

### test-runner-pipeline
**Purpose**: Execute Cucumber tests and capture structured results.

**Input**: Feature file path(s)
**Output**: Pass/fail status, errors, screenshots, duration
**Read-only**: Never modifies test code

---

### test-fixer-pipeline
**Purpose**: Analyze test failures and apply the smallest safe fixes.

**Input**: Failure details + generation context + domain
**Output**: Fixes applied per file
**Iterates**: Up to 5 times (controlled by orchestrator)
**Scans**: Atriis.Test.Automation, Atriis.App

---

### test-reporter-pipeline
**Purpose**: Generate and distribute test execution reports.

**Input**: Complete pipeline state
**Output**: JSON and Markdown reports in `test-results/`, optional ADO comment
**Destinations**: Atriis.Test.Automation `test-results/`, ADO work item comments

---

### ci-checker
**Purpose**: Parse GitHub Actions CI results into structured failure data.

**Input**: Branch name or run ID
**Output**: Failures with domain, category, and persistence tracking
**Uses**: GitHub CLI (`gh run list`, `gh run view`, `gh run download`)

---

### strict-test-governor
**Purpose**: Review generated or fixed automation code and reject duplication, guessed implementations, or layering violations before execution proceeds.

**Input**: Generated test artifacts or fix diff + surrounding project context
**Output**: PASS/FAIL review with issues and required fixes

---

### ado-publish-testcase
**Purpose**: Create or update an ADO Test Case from a generated `.feature` file and add it to a user-selected regression suite.

**Input**: `featurePath`, `workItemId`, `areaPath`, `domain`
**Output**: ADO Test Case ID, URL, linked suite, and Tested By link to parent work item

---

## Domain Agents

### domain-flights
**Purpose**: Flight-specific knowledge — locators, DSL methods, test data, routes, validation rules, and common failure patterns.

**Scope**: Flight search, results, selection, cabin class, carriers, NDC, pricing, PNR

**Consulted by**: `@test-generator-pipeline`, `@test-fixer-pipeline` when domain = `flights`

---

### domain-hotels
**Purpose**: Hotels domain orchestration and domain knowledge — initializes shared Hotels context, prepares supplier execution payloads, and defines hotel-specific locators, DSL methods, test data, validation rules, and supplier-specific flows.

**Scope**: Hotel search, availability, pricing, booking, retrieval, cancellation/modification, schema and contract checks, supplier-specific caveats

**Supplier source of truth**: `.github/agents/config/supplier-registry.json`

**Consulted by**: `@supplier-agent-orchestration`, `@test-generator-pipeline`, `@test-fixer-pipeline` when domain = `hotels`

---

### domain-transportation
**Purpose**: Transportation-specific knowledge covering Cars, Rail, Ground Transport, and Parking.

**Scope**: Car rental, train booking, airport transfers, parking facilities

**Consulted by**: `@test-generator-pipeline`, `@test-fixer-pipeline` when domain = `transportation`

---

### domain-shell
**Purpose**: Base/generic agent for cross-domain and non-product-specific scenarios.

**Scope**: Login, trip management, travelers, cart, checkout, approval, manual quotes, per-diem

**Consulted by**: `@test-generator-pipeline`, `@test-fixer-pipeline` when domain = `shell` or cross-domain

---

## Standalone Agents

### code-reviewer
**Purpose**: Review pending code changes for stability, maintainability, and pattern adherence.

**Scope**: Gherkin, Step Definitions, DSL, Page Objects, Utils

---

### context-bridge
**Purpose**: Connect Azure DevOps work items and Atriis.OBT source code to the automation framework.

**Use When**:
- Generating tests from ADO bugs
- Checking coverage gaps
- Exploring what to test

---

### test-case-converter
**Purpose**: Convert manual test cases (ADO, sheets, docs) into Gherkin .feature files.

---

### testim-converter
**Purpose**: Migrate Testim-exported Playwright tests into Gherkin BDD format.

---

## Pipeline State Contract

All pipeline agents share this state structure. Each sub-agent adds its section:

```json
{
  "pipelineId": "ado-74500-2026-03-14",
  "trigger": "ado | manual | regression | ci",
  "phase": "init | fetched | generated | executed | fixed | reported",
  "source": {
    "type": "bug | test_case | user_story | feature_request",
    "id": 74500,
    "title": "...",
    "description": "...",
    "domain": "flights"
  },
  "domain": "flights | hotels | transportation | shell",
  "generation": {
    "featurePath": "tests/features/...",
    "stepDefPaths": [],
    "dslMethodsCreated": [],
    "newStepsCreated": [],
    "reusedSteps": []
  },
  "execution": {
    "passed": false,
    "totalScenarios": 3,
    "passedScenarios": 2,
    "failedScenarios": 1,
    "errors": []
  },
  "fixes": {
    "iteration": 0,
    "maxIterations": 5,
    "fixesApplied": [],
    "history": []
  },
  "report": {
    "testResultsPath": "",
    "adoCommentPosted": false,
    "summary": ""
  }
}
```

## Adding New Agents

1. Create `.agent.md` file in `.github/agents/`
2. Include YAML frontmatter with `description` and `tools`
3. Define: Role, Input, Process, Output (state contract), Checkpoint, Rules
4. If pipeline sub-agent: define its state contribution
5. If domain agent: define scope, patterns, validation rules, common failures
6. Update this AGENTS.md registry
7. Commit: `chore(agents): add {agent-name}`

## Agent Invocation

### From VS Code Chat
```
@ado-pipeline 74500
@feature-pipeline I need a test for hotel search...
@regression-pipeline @smoke
@ci-monitor
```

### Programmatic
```javascript
runSubagent({
  agentName: 'ado-pipeline',
  description: 'Run ADO-to-automation pipeline',
  prompt: 'Process ADO bug #74500 through the full pipeline'
})
```
