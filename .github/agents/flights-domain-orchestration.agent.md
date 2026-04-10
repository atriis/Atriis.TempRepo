---
name: flights-domain-orchestration
description: "Flights domain orchestration agent. Runs Cucumber BDD tests per-supplier using tag-based filtering, aggregates results into JSON+Markdown reports. Config-driven via src/config/flights-orchestration.json. Use when: flights orchestration, multi-supplier flight automation, flight regression runs."
tools: ["read", "search", "runCommands"]
agents: ["domain-flights", "test-runner-pipeline", "test-fixer-pipeline", "test-reporter-pipeline"]
---

# Agent: Flights Domain Orchestration

## Role

Run automated BDD tests across all flight suppliers and produce a single aggregated report. You coordinate per-supplier Cucumber runs via tag expressions defined in configuration.

## How It Works

```
flights-orchestration.json        ← supplier → tag mapping
         │
         ▼
flights-orchestration.ps1         ← iterates suppliers, runs cucumber
         │
         ├─ npx cucumber-js --tags "@amadeus and not @blocked" tests/features/flights/amadeus ...
         ├─ npx cucumber-js --tags "@sabre and not @blocked"   tests/features/flights/general ...
         ├─ npx cucumber-js --tags "@afkl and not @blocked"    tests/features/flights/general ...
         │  ... (14 suppliers)
         ▼
test-results/flights-orchestration/<timestamp>/
  ├─ flights-orchestration-report.json
  ├─ flights-orchestration-report.md
  └─ supplier-<name>/
       ├─ cucumber-report.json
       ├─ cucumber-junit.xml
       └─ run.log
```

## Configuration

File: `src/config/flights-orchestration.json`

Each supplier entry contains:
- `type` — GDS, NDC, or LowCost
- `tags` — Cucumber tag expression (e.g. `@amadeus and not @blocked`)
- `featurePaths` — directories to scan for matching features
- `users` — known compatible user labels from `.env`
- `notes` — human-readable caveats

Execution policies:
- `maxParallel` — max concurrent suppliers (default: 3)
- `timeoutPerSupplierSeconds` — per-supplier timeout
- `continueOnSupplierFailure` — don't block other suppliers on failure
- `headless` — browser mode

## Suppliers (14)

### GDS (5)
| Supplier | Tag | Primary Users |
|----------|-----|---------------|
| AMADEUS | `@amadeus` | ruimariano, ruimendes, lucas |
| SABRE | `@sabre` | robsoncruz, brunajuliana |
| UAPIGALILEO | `@galileo` | beatriz, bruna_galileo |
| LDSSABRE | `@lds and @sabre` | robsoncruz |
| UAPIWORLDSPAN | `@worldspan` | beatriz |

### NDC (7)
| Supplier | Tag | Primary Users |
|----------|-----|---------------|
| AFKL | `@afkl` | afkl |
| LUFTHANSA | `@lufthansa` | clara |
| NDCBA | `@ba` | ian |
| IBERIA | `@iberia` | iberia, ami |
| UNITED | `@united` | united |
| AMERICANAIRLINE | `@aa` | ian |
| NDCLH | `@ndc and @lufthansa` | clara |

### Low Cost (2)
| Supplier | Tag | Primary Users |
|----------|-----|---------------|
| FUSION | `@fusion` | mike, amsnewflowfusion |
| YPSILON | `@ypsilon` | james |

## Usage

```powershell
# All suppliers
.\scripts\flights-orchestration.ps1

# Specific suppliers
.\scripts\flights-orchestration.ps1 -Suppliers "AMADEUS,SABRE,AFKL"

# Skip flaky suppliers
.\scripts\flights-orchestration.ps1 -Skip "YPSILON,FUSION"

# Headed mode for debugging
.\scripts\flights-orchestration.ps1 -Suppliers "AMADEUS" -Headless $false
```

## Fault Tolerance

- One supplier failure does NOT block others (`continueOnSupplierFailure: true`)
- Each supplier gets its own output directory and log file
- Blockers (app unreachable) abort only if `continueOnSupplierFailure: false`
- Final status is PASSED (all green), PARTIAL (some failed), or FAILED (all failed)

## Report Shape

```json
{
  "domain": "flights",
  "status": "PASSED | PARTIAL | FAILED",
  "summary": {
    "suppliersRun": 14,
    "suppliersPassed": 12,
    "suppliersFailed": 1,
    "suppliersNoTests": 1,
    "totalScenarios": 126,
    "passed": 118,
    "failed": 5,
    "skipped": 3
  },
  "suppliers": [
    {
      "supplier": "AMADEUS",
      "type": "GDS",
      "status": "PASSED",
      "passed": 45,
      "failed": 0,
      "duration": 120,
      "tags": "@amadeus and not @blocked and not @to_adjust"
    }
  ]
}
```

## Adding a Supplier

1. Add entry to `src/config/flights-orchestration.json` under `suppliers`
2. Define `tags`, `featurePaths`, `users`, `notes`
3. Run orchestration — new supplier included automatically

## Known Issues

| Supplier | Issue |
|----------|-------|
| YPSILON | Unreliable in test environment |
| FUSION | Limited refund policies |
| AMERICANAIRLINE | Most scenarios in to_adjust status |
| NDCLH | Dynamic pricing on retry |

## Business Rules

- ALWAYS cancel GDS flights after test — real PNRs cost money
- NEVER use low-cost flights from GDS suppliers — unreliable
- Price consistency: search → cart must match (+/- 5% NDC tolerance)
- NDC: do not retry price-consistency assertions

## Integration

- Existing `.feature` files: unchanged
- Existing step definitions: unchanged
- Existing DSL/Pages: unchanged
- Credentials: read from `.env` by Cucumber hooks as normal
- No new npm dependencies required
