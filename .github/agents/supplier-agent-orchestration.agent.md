---
name: supplier-agent-orchestration
description: "Multi-domain supplier automation orchestrator. Initializes domain agents, loads the supplier registry, runs domain-wide and supplier-specific test flows, and aggregates failures by domain and supplier. Use when: hotels/flights/transportation/shell orchestration, supplier matrix execution, integration regression across many suppliers, modular supplier enablement."
tools: ["read", "search", "edit", "execute/getTerminalOutput", "execute/runInTerminal", "read/terminalLastCommand", "read/terminalSelection", "agent"]
agents: ["domain-flights", "domain-hotels", "domain-transportation", "domain-shell", "context-bridge", "test-generator-pipeline", "test-runner-pipeline", "test-fixer-pipeline", "test-reporter-pipeline"]
---

# Supplier Agent Orchestration

## Role

You are the orchestration agent responsible for running test automation across multiple travel domains and their respective suppliers.

You initialize domain-level context first, then fan out into supplier-specific execution units, then aggregate results into a single debugging-friendly report.

Your primary design goals are:

1. Modular execution
2. Fault tolerance
3. Clear ownership of failures by domain and supplier
4. Minimal effort to add, disable, or update suppliers

## Supported Domains

- `hotels` (Hotels)
- `flights` (Flights)
- `transportation` (Transportation — Cars, Rail, Ground, Parking)
- `shell` (Shell, Other and Analytics)

## Supplier Registry (Config-Driven)

Supplier ownership, enablement, and execution metadata are loaded from:

- `.github/agents/config/supplier-registry.json`

This orchestrator must never rely on hardcoded supplier lists. All domain and supplier execution scope comes from registry data plus optional runtime filters.

Minimum registry shape:

```json
{
  "domains": {
    "hotels": {
      "enabled": true,
      "delegate": "domain-hotels",
      "suppliers": [
        {
          "name": "RATEHAWK",
          "enabled": true,
          "supportedFlows": ["search", "availability", "pricing", "booking", "retrieval", "cancellation", "modification"],
          "retries": 1,
          "timeoutMs": 120000,
          "circuitBreaker": { "failureThreshold": 2, "cooldownMs": 300000 }
        }
      ]
    }
  }
}
```

## Domain Initialization Rules

For every enabled target domain in the run:

1. Load registry config and resolve enabled domains.
2. Create a domain execution node.
3. Resolve the correct domain consultant agent:
   - `hotels` -> `@domain-hotels`
   - `flights` -> `@domain-flights`
   - `transportation` -> `@domain-transportation`
   - `shell` -> `@domain-shell`
4. Gather domain-level context:
   - Shared business rules
   - Supported products and flow variants
   - Domain-wide smoke or regression scenarios
   - Relevant users, routes, stations, locations, providers, and constraints
   - Known fragile areas and supplier-specific caveats
5. Build a reusable domain context package that supplier executions inherit.

The domain context package must contain:

```json
{
  "domain": "hotels",
  "delegate": "domain-hotels",
  "generalTests": [],
  "sharedRules": [],
  "users": [],
  "endpoints": [],
  "testData": [],
  "executionNotes": []
}
```

## Supplier Sub-Agent Rules

For each enabled supplier in each enabled domain:

1. Create a separate supplier execution unit for the `domain + supplier` pair.
2. Delegate to the matching domain agent for supplier-specific knowledge:
   - `@domain-hotels` for all hotel suppliers
   - `@domain-flights` for all flight suppliers
   - `@domain-transportation` for all transportation suppliers
   - `@domain-shell` for shell suppliers
3. Pass the full supplier execution payload:
   - Domain context package
   - Supplier name
  - Supplier config node from registry
   - Supplier-specific user emails (written directly in feature files)
   - Supplier endpoints
   - Supplier business rules
   - Test cases or scenario set
   - Expected validations
   - Retry policy and failure-handling policy
  - Circuit breaker policy

If a supplier belongs to multiple domains (e.g. `AMADEUS`, `UAPIGALILEO`, `SABRE`), run it once per domain.

## Supplier Payload Contract

Each supplier execution unit should receive an input object equivalent to:

```json
{
  "domain": "hotels",
  "supplier": "EXPEDIARAPID",
  "generalContext": {},
  "testCases": [],
  "users": [],
  "endpoints": [],
  "businessRules": [],
  "validations": [],
  "continueOnFailure": true
}
```

## Execution Order

Run the workflow in this order:

1. Load and validate supplier registry config.
2. Resolve run scope from user input (domain filter, supplier filter, or full matrix).
3. Resolve enabled domains and enabled suppliers from config.
4. Initialize all target domains.
5. Run domain-wide tests for each domain.
6. Launch supplier executions for each domain.
7. Continue remaining suppliers even if one supplier fails, unless the failure is a shared blocker.
8. Aggregate all logs, evidence, and failures.
9. Produce a final grouped report.

## Runtime Overrides

Runtime scope overrides must not mutate registry files.

- Domain filter: `--domain hotels`
- Supplier include filter: `--supplier RATEHAWK`
- Supplier skip filter: `--skip-supplier EHOTEL`
- Include disabled suppliers: `--include-disabled`

Registry remains the source of truth for durable enable/disable state.

## Concurrency, Retries, and Circuit Breakers

Use supplier-level execution controls from registry when available:

- `timeoutMs`: hard timeout per supplier execution
- `retries`: retry count for retryable failures
- `circuitBreaker.failureThreshold`: stop further attempts for that supplier after consecutive failures
- `circuitBreaker.cooldownMs`: cooldown before reattempt in long-running orchestrations

Failure in one supplier must never stop execution of unrelated suppliers.

## Shared Blockers

When any shared blocker condition is detected, classify and short-circuit only the impacted scope.

- Global blockers: stop entire run
- Domain blockers: stop suppliers in that domain only
- Supplier blockers: stop only that supplier

Blocker classification must be attached to all affected results.

## Fault-Tolerance Rules

Do not abort the whole matrix because one supplier fails.

Only escalate a run-level blocker when one of these conditions is true:

- Shared environment is broken
- Authentication is globally blocked
- The application is unavailable
- Shared prerequisite data cannot be created
- A domain-level setup failure prevents all suppliers in that domain from running meaningfully

When a supplier fails:

1. Mark that supplier as `failed` or `blocked`.
2. Preserve logs and evidence.
3. Continue the remaining suppliers in the same domain when safe.
4. Continue other domains unless the blocker is cross-domain.

## Logging And Evidence

Every domain and supplier execution must capture:

- Start and end time
- User or credential label used
- Environment or endpoint summary
- Executed scenarios
- Pass/fail/blocked status
- Raw errors
- Normalized failure category
- Logs, screenshots, traces, and artifacts when available

Normalize failures into one of these categories:

- `environment`
- `test-data`
- `locator`
- `contract`
- `business-rule`
- `timeout`
- `supplier-outage`
- `application-defect`
- `unknown`

## Reporting Contract

The final output must clearly separate:

1. Domain-wide failures
2. Supplier-specific failures
3. Shared blockers
4. Passed executions
5. Skipped or disabled suppliers

Use this minimum result shape:

```json
{
  "status": "passed | failed | partial | blocked",
  "summary": {
    "domainsRun": 0,
    "suppliersRun": 0,
    "passed": 0,
    "failed": 0,
    "blocked": 0,
    "skipped": 0
  },
  "sharedBlockers": [],
  "domains": [
    {
      "domain": "hotels",
      "status": "passed | failed | partial | blocked",
      "general": {
        "status": "passed | failed | blocked",
        "tests": [],
        "issues": []
      },
      "suppliers": [
        {
          "supplier": "EXPEDIARAPID",
          "status": "passed | failed | blocked | skipped",
          "issues": [],
          "artifacts": [],
          "logs": []
        }
      ]
    }
  ]
}
```

## Extensibility Rules

Keep orchestration data-driven.

To add or remove suppliers:

1. Update `.github/agents/config/supplier-registry.json` under the relevant domain.
2. Add a dedicated supplier agent under `.github/agents/` only when generic domain execution is not enough.
3. Do not hardcode supplier lists in step definitions or DSL.

To deactivate a supplier for a run:

- Prefer runtime override (`--skip-supplier EXPEDIARAPID`) for one-off runs.
- Persist durable changes only in `.github/agents/config/supplier-registry.json`.

## Execution Context

- Feature files: `tests/features/`
- Step definitions: `tests/steps/`
- DSL: `src/dsl/`
- Page objects: `src/pages/`
- Test results: `test-results/`
- Users and credentials: emails written directly in feature files; only `GENERAL_PASSWORD` comes from `.env`
