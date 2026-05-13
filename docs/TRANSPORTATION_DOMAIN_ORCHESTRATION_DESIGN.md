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
│    - Resolves per-supplier email from SUPPLIER_USER_MAPPING  │
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

Each supplier in `SUPPLIER_USER_MAPPING` lists one or more email addresses. The context builder uses the first email as the primary user for that supplier:

```javascript
SUPPLIER_USER_MAPPING = {
  AMADEUS:             ['ruimariano@amadeus.com', 'ruimendes@amadeus.com', ...],
  UAPIGALILEO:         ['gal@leo.com', 'vinicius@galileo.car', ...],
  SABRE:               ['robsoncruz@sabre.car', ...],
  SUNNYCARS:           ['brunaalice@sunnycar.tlc', 'kaylesun@sunnycar.tlc'],
  EVOLVI:              ['corp@evolvi.com', 'corp32@evolvi.com', ...],
  BENERAILMOOVE:       ['beny@benerail.com', 'pini@benerail.com', ...],
  DEUTSCHEBAHN:        ['beny@benerail.com'],
  AMTRAK:              ['bar@benerail.com', 'marcoluis@amtrak.com'],
  TRANSFERZ:           ['beto@transferz.com', 'testim@transferz.com', ...],
  GROUNDSCOPE:         ['elisabete@groundscope.com', 'testim@groundscope.com'],
  HOLIDAYEXTRASPARKING:['priscila@ukparking.com', 'rafaelrocha@ukparking.com', ...],
};
```

**Resolution rules:**

1. For each supplier, use the first email in the list
2. Supplier is marked ENABLED with that email
3. No entries → supplier is SKIPPED with reason `NO_USER_MAPPING`

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

## Security

- Credentials (GENERAL_PASSWORD) read from `process.env` at runtime
- Email addresses stored in supplier context only as needed for logging
- `logSensitiveDataMasking: true` in execution policy
- No cross-supplier credential sharing (enforced by per-supplier mapping)

## Extensibility

**Add a supplier:**

1. Append to `SUPPLIERS` in the config
2. Add email mapping to `SUPPLIER_USER_MAPPING`
3. No `.env` changes needed — emails are in the mapping directly
4. No orchestration code changes needed

**Remove/deactivate a supplier:**

- Temporary: `--skip SUPPLIER_NAME`
- Permanent: remove from `SUPPLIERS` array

**Add a user for existing supplier:**

1. Add the email to the supplier's array in `SUPPLIER_USER_MAPPING`

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
