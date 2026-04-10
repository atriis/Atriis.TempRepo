# Transportation Domain Orchestration Design

**Version**: 1.0
**Date**: April 9, 2026
**Status**: Implemented
**Location**: `src/config/` + `scripts/transportation-orchestration.js`

## Executive Summary

Modular, config-driven, fault-tolerant orchestration framework for automated
testing across all 11 transportation suppliers. Unlike the Flights domain
(one user per domain), Transportation uses **per-supplier user mapping** —
each supplier resolves its own user from `.env`.

**Key Principles**:

1. **Per-supplier users** — each supplier maps to one or more `.env` user
   labels; the first resolved label is used
2. **Config-driven** — suppliers, users, flows, and rules defined in a single
   config file; no hardcoding
3. **Fault-tolerant** — one supplier failure does not block others
4. **Security-aware** — credentials read at runtime, never logged

## Architecture

```text
┌────────────────────────────────────────────────────────────┐
│  scripts/transportation-orchestration.js (entry point)     │
│  Parses args, coordinates execution, writes reports        │
└──────────────────────┬─────────────────────────────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     ▼                 ▼                 ▼
  CONFIG         CONTEXT BUILDER     EXECUTION

┌────────────────────────────────────────────────────────────┐
│ 1. src/config/transportation-orchestration.config.js       │
│    - 11 suppliers with metadata                            │
│    - Transport test flows (30+)                            │
│    - Per-supplier user mapping (SUPPLIER_USER_MAPPING)     │
│    - Execution policies & shared business rules            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 2. src/config/TransportationDomainContextBuilder.js        │
│    - Resolves per-supplier users from .env                 │
│    - Builds domain context (rules, data, flows)            │
│    - Generates supplier execution contexts                 │
│    - Marks suppliers ENABLED or SKIPPED with reason        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 3. src/config/TransportationSupplierExecution.js           │
│    - Receives one supplier context                         │
│    - Builds Cucumber command with correct tags & env vars  │
│    - Parses results; returns structured JSON               │
└────────────────────────────────────────────────────────────┘
```

## Supported Suppliers (11)

| Supplier | Category | Type | Provider Tag | Feature Path |
|----------|----------|------|-------------|--------------|
| AMADEUS | cars | GDS | `amadeus` | `transportation/cars` |
| UAPIGALILEO | cars | GDS | `galileo` | `transportation/cars` |
| SABRE | cars | GDS | `sabre` | `transportation/cars` |
| SUNNYCARS | cars | Aggregator | `sunnycars` | `transportation/cars` |
| EVOLVI | rails | Rail | `evolvi` | `transportation/rails/evolvi` |
| BENERAILMOOVE | rails | Rail | `benerail` | `transportation/rails/benerail` |
| DEUTSCHEBAHN | rails | Rail | `deutschebahn` | `transportation/rails/deutsche_bahn` |
| AMTRAK | rails | Rail | `amtrak` | `transportation/rails/amtrak` |
| TRANSFERZ | ground_transport | Transfer | `transferz` | `transportation/ground_transport/transferz` |
| GROUNDSCOPE | ground_transport | Transfer | `groundscope` | `transportation/ground_transport/groundscope` |
| HOLIDAYEXTRASPARKING | parking | Parking | `parking` | `transportation/parking` |

## Per-Supplier User Mapping

Each supplier in `SUPPLIER_USER_MAPPING` lists one or more `.env` user
labels. The context builder tries each label in order and uses the first
one found in `.env`:

```javascript
SUPPLIER_USER_MAPPING = {
  AMADEUS:             ['ruimariano', 'ruimendes', ...],
  UAPIGALILEO:         ['gal', 'vinicius', ...],
  SABRE:               ['robsoncruz', ...],
  SUNNYCARS:           ['brunaalice', 'kaylesun'],
  EVOLVI:              ['corp_evolvi', 'corp_evolvi32', ...],
  BENERAILMOOVE:       ['beny', 'pini', 'shani_nl', ...],
  DEUTSCHEBAHN:        ['beny'],
  AMTRAK:              ['bar', 'marcoluis'],
  TRANSFERZ:           ['beto', 'transferz_testim', ...],
  GROUNDSCOPE:         ['elisabete', 'groundscoupe_testim'],
  HOLIDAYEXTRASPARKING:['priscila', 'rafaelrocha', ...],
};
```

**Resolution rules:**

1. For each supplier, iterate the user list
2. Check `USER_<LABEL>` exists in `.env` and is non-empty
3. First match wins → supplier is ENABLED with that user
4. No match → supplier is SKIPPED with reason `USER_NOT_IN_ENV`

## Tag Strategy

| Category | Tag Expression |
|----------|---------------|
| Cars (GDS/Aggregator) | `@transportation and @cars and @provider:<tag> and not @wip` |
| Rails | `@transportation and @rails and @<providerTag> and not @wip` |
| Ground Transport | `@transportation and @ground_transport and @provider:<tag> and not @wip` |
| Parking | `@transportation and @parking and not @wip` |

Rail features use `@benerail`, `@evolvi`, `@amtrak`, `@deutschebahn`
instead of `@provider:*`.

Parking features have no `@provider:` tag — scoped by `@parking` only.

## Usage

```powershell
# Run all transportation suppliers (sequential)
node scripts/transportation-orchestration.js

# Run specific suppliers in parallel
node scripts/transportation-orchestration.js --suppliers AMADEUS,BENERAILMOOVE,SUNNYCARS --mode parallel

# Skip known-wip suppliers
node scripts/transportation-orchestration.js --skip DEUTSCHEBAHN,AMTRAK

# Custom output directory
node scripts/transportation-orchestration.js --output test-results/my-run
```

## Fault Tolerance

- One supplier failure does **not** block others
- `continueOnSupplierFailure: true` in execution policy
- Skipped suppliers logged with reason code:
  - `MANUALLY_SKIPPED` — user passed `--skip`
  - `NOT_IN_FILTER` — not in `--suppliers` filter
  - `NO_USER_MAPPING` — supplier has no entry in `SUPPLIER_USER_MAPPING`
  - `USER_NOT_IN_ENV` — none of the mapped users found in `.env`

## Security

- Credentials read from `process.env` at runtime
- Email addresses never stored in supplier context objects
- `logSensitiveDataMasking: true` in execution policy
- No cross-supplier credential sharing (enforced by per-supplier mapping)
- User labels (not emails) used in logs and reports

## Extensibility

**Add a supplier:**

1. Append to `SUPPLIERS` in the config
2. Add user mapping to `SUPPLIER_USER_MAPPING`
3. Add `USER_<LABEL>=email` to `.env`
4. No orchestration code changes needed

**Remove/deactivate a supplier:**

- Temporary: `--skip SUPPLIER_NAME`
- Permanent: remove from `SUPPLIERS` array

**Add a user for existing supplier:**

1. Add `USER_<LABEL>=email` to `.env`
2. Add label to the supplier's array in `SUPPLIER_USER_MAPPING`

## Failure Categories

| Category | Description |
|----------|-------------|
| `environment` | Infrastructure / env not available |
| `test-data` | Missing or invalid test data |
| `locator` | UI element not found |
| `contract` | API contract / schema mismatch |
| `business-rule` | Business logic violation |
| `timeout` | Execution exceeded timeout |
| `supplier-outage` | Supplier API not responding |
| `application-defect` | Bug in the application |
| `unknown` | Unclassified failure |
