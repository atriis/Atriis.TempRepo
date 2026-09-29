# DB Queries — Design Spec

- **Date:** 2026-09-29
- **Status:** Approved in brainstorming, pending written-spec review
- **Branch:** `feat/db-queries`

## 1. Goal

Let Cucumber scenarios change live trip behaviour/outputs by running **pre-approved, parameterised SQL queries** against the application database (Azure SQL), and read data back for assertions. Integrated into Atriis.Test.Automation.OBT the same way PayloadValidation is: config getters, a utility client, a DSL module exported from `@dsl`, step definitions, a global on/off switch, a standalone check script and documentation.

### Success criteria

1. A scenario can run a catalog query by name, overriding only some parameters from Gherkin.
2. Only queries listed in the catalog can run; forbidden patterns and built-in safety rules are enforced before anything reaches the DB.
3. Every data change is automatically reverted after the scenario, pass or fail.
4. The same feature files run locally (Entra MFA) and on CI (service principal or Azure CLI/OIDC) with only `.env` differences.
5. Scenarios that do not use DB steps are unaffected when DB config is missing.

### Out of scope (YAGNI)

- Stored procedures, dynamic SQL, multi-statement batches.
- Multiple DB connections / databases per run.
- Large result sets (steps target a few rows).
- Persistent token cache (`@azure/identity-cache-persistence`) — may be added later.
- Changing CI workflow files (an OIDC snippet is documented only).

## 2. Architecture

| File | Status | Responsibility | Depends on |
|---|---|---|---|
| `src/config/config.js` | edit | `db` getter block: `enabled`, `serverName`, `databaseName`, `authentication`, `userName`, `tenantId`, `clientId`, `clientSecret`, `timeoutMs` | `.env` |
| `src/config/dbQueries.json` | new | Catalog: `forbidden` patterns + named `queries` | — |
| `src/utils/dbCredential.js` | new | Map `DB_AUTHENTICATION` to an `@azure/identity` credential; return a token for scope `https://database.windows.net/.default` | config |
| `src/utils/dbClient.js` | new | Lazy `mssql` connection pool (one per worker process); execute SQL with typed bound params; transactions; close | dbCredential, config |
| `src/utils/dbQueryPolicy.js` | new | Load + validate catalog; resolve a query by name; validate overrides; build typed params | dbQueries.json |
| `src/dsl/DbQueries.js` | new | `runQuery`, snapshot + restore registration, result storage, column assertions, `runPendingRestores` | policy, client |
| `src/dsl/index.js` | edit | Export `DbQueries` | — |
| `tests/steps/db_queries.steps.js` | new | Gherkin steps, `runDbStep()` guard, placeholder resolution | DSL |
| `tests/support/dbHooks.js` | new | `After` hook running pending restores; `AfterAll` closing the pool | DSL, client |
| `tests/unit/dbQueryPolicy.test.js` | new | `node:test` unit tests for policy/param logic | policy |
| `scripts/check-db.js` | new | Offline catalog validation + live `SELECT 1` connection check | policy, client |
| `tests/features/db/db_queries_smoke.feature` | new | `@db` smoke scenario using a read-only query | steps |
| `.env.example` | edit | DB section | — |
| `docs/DbQueries.md` | new | Usage documentation | — |
| `package.json` | edit | deps `mssql`, `@azure/identity`; scripts `db:check`, `test:unit` | — |

`tests/support/dbHooks.js` is a **separate** hook because the existing `After` in `tests/support/hooks.js` returns early when `this.page` is absent; restores must run regardless.

## 3. Configuration

```
DB_QUERIES_ENABLED=true
DB_SERVER_NAME=            # e.g. myserver.database.windows.net
DB_DATABASE_NAME=
DB_AUTHENTICATION=         # entra-mfa | service-principal | azure-cli
DB_USER_NAME=              # entra-mfa: login hint (UPN)
DB_TENANT_ID=              # service-principal (optional for entra-mfa)
DB_CLIENT_ID=              # service-principal
DB_CLIENT_SECRET=          # service-principal
DB_TIMEOUT_MS=30000
```

- `DB_QUERIES_ENABLED` uses `getOptionalBooleanEnv` (default `true`). When `false`, every DB step logs a warning and no-ops, and the restore hook does nothing.
- All other values use `getOptionalEnv`; requirement checks happen lazily on the first DB operation, so missing DB config never breaks non-DB scenarios.
- Required per mode:

| `DB_AUTHENTICATION` | Required | Credential |
|---|---|---|
| `entra-mfa` | `DB_SERVER_NAME`, `DB_DATABASE_NAME`, `DB_USER_NAME` | `InteractiveBrowserCredential` (`loginHint` = user name, `tenantId` if set) |
| `service-principal` | server, database, `DB_TENANT_ID`, `DB_CLIENT_ID`, `DB_CLIENT_SECRET` | `ClientSecretCredential` |
| `azure-cli` | server, database | `AzureCliCredential` (requires prior `az login` / `azure/login`) |

Missing values fail with `DbQueryError(CONFIG)` naming the mode and variable, e.g. `DB_AUTHENTICATION=service-principal requires DB_CLIENT_SECRET`. An unknown mode fails the same way listing the valid values.

CI: variables are added to the existing `secrets.ENV` dotenv secret (exported by `.github/actions/load-env-from-secret`), same as PayloadValidation; no workflow change needed for `service-principal`.

## 4. Connection

- `mssql` (tedious driver) with `authentication: { type: "azure-active-directory-access-token", options: { token } }`, `encrypt: true`, server/database from config, `requestTimeout` = `DB_TIMEOUT_MS`.
- Pool is created on first use per worker process and reused. Before creating the pool the token is fetched via `credential.getToken(scope)`; if the token expires within 5 minutes before a new pool is needed, a fresh one is fetched. Pools are closed in `AfterAll`.
- Parallel note: CI runs `--parallel 4` → one pool + token per worker. With `entra-mfa` locally each worker prompts once; docs recommend `--parallel 1` for local DB scenarios.

## 5. Catalog — `src/config/dbQueries.json`

```json
{
  "forbidden": ["\\bDROP\\b", "\\bTRUNCATE\\b", "\\bALTER\\b", "\\bGRANT\\b", "\\bREVOKE\\b"],
  "queries": {
    "getTripQuotes": {
      "description": "Read the quotes of a trip (id, product, status, expires)",
      "sql": "SELECT Id AS id, Product AS product, Status AS status, Expires AS expires FROM Quotes WHERE TripId = @tripId",
      "params": {
        "tripId": { "type": "Int", "default": "{tripNumber}" }
      }
    },

    "expireTripQuotes": {
      "description": "Set the expiry of every quote of a trip to now + N minutes",
      "sql": "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE TripId = @tripId",
      "params": {
        "tripId":  { "type": "Int", "default": "{tripNumber}" },
        "minutes": { "type": "Int", "default": "2" }
      },
      "snapshot": "SELECT Id AS id, Expires AS expires FROM Quotes WHERE TripId = @tripId",
      "restore": "restoreQuoteExpires",
      "maxRows": 20
    },
    "restoreQuoteExpires": {
      "description": "Restore one quote's expiry by id",
      "restoreOnly": true,
      "sql": "UPDATE Quotes SET Expires = @expires WHERE Id = @id",
      "params": {
        "id":      { "type": "Int", "required": true },
        "expires": { "type": "DateTime2", "required": true }
      },
      "maxRows": 1
    },

    "expireTripEvolviPricings": {
      "description": "Set the expiry of every Evolvi pricing of a trip to now + N minutes",
      "sql": "UPDATE EvolviPricings SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId)",
      "params": {
        "tripId":  { "type": "Int", "default": "{tripNumber}" },
        "minutes": { "type": "Int", "default": "0" }
      },
      "snapshot": "SELECT Id AS id, Expires AS expires FROM EvolviPricings WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId)",
      "restore": "restoreEvolviPricingExpires",
      "maxRows": 20
    },
    "restoreEvolviPricingExpires": {
      "description": "Restore one Evolvi pricing's expiry by id",
      "restoreOnly": true,
      "sql": "UPDATE EvolviPricings SET Expires = @expires WHERE Id = @id",
      "params": {
        "id":      { "type": "Int", "required": true },
        "expires": { "type": "DateTime2", "required": true }
      },
      "maxRows": 1
    },

    "expireTripGroundServicePricings": {
      "description": "Set the expiry of the active ground-service pricings of a trip to now + N minutes (quote status 14 excluded)",
      "sql": "UPDATE [dbo].[GroundServicePricings] SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId AND Product = 'groundService' AND Status <> 14)",
      "params": {
        "tripId":  { "type": "Int", "default": "{tripNumber}" },
        "minutes": { "type": "Int", "default": "2" }
      },
      "snapshot": "SELECT Id AS id, Expires AS expires FROM [dbo].[GroundServicePricings] WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId AND Product = 'groundService' AND Status <> 14)",
      "restore": "restoreGroundServicePricingExpires",
      "maxRows": 20
    },
    "restoreGroundServicePricingExpires": {
      "description": "Restore one ground-service pricing's expiry by id",
      "restoreOnly": true,
      "sql": "UPDATE [dbo].[GroundServicePricings] SET Expires = @expires WHERE Id = @id",
      "params": {
        "id":      { "type": "Int", "required": true },
        "expires": { "type": "DateTime2", "required": true }
      },
      "maxRows": 1
    },

    "setTripCarPickupDate": {
      "description": "Set the pickup date of the car segments of a trip",
      "sql": "UPDATE CarSegments SET PickupDate = @pickupDate WHERE QuoteId IN (SELECT Id FROM Quotes WHERE Product = 'car' AND TripId = @tripId)",
      "params": {
        "tripId":     { "type": "Int", "default": "{tripNumber}" },
        "pickupDate": { "type": "DateTime2", "required": true }
      },
      "snapshot": "SELECT Id AS id, PickupDate AS pickupDate FROM CarSegments WHERE QuoteId IN (SELECT Id FROM Quotes WHERE Product = 'car' AND TripId = @tripId)",
      "restore": "restoreCarSegmentPickupDate",
      "maxRows": 10
    },
    "restoreCarSegmentPickupDate": {
      "description": "Restore one car segment's pickup date by id",
      "restoreOnly": true,
      "sql": "UPDATE CarSegments SET PickupDate = @pickupDate WHERE Id = @id",
      "params": {
        "id":         { "type": "Int", "required": true },
        "pickupDate": { "type": "DateTime2", "required": true }
      },
      "maxRows": 1
    },

    "setTripHotelPrice": {
      "description": "Force price, tax and total price of the hotel pricings of a trip",
      "sql": "UPDATE HotelPricings SET Price = @price, Tax = @tax, TotalPrice = @totalPrice WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId)",
      "params": {
        "tripId":     { "type": "Int", "default": "{tripNumber}" },
        "price":      { "type": "Decimal", "default": "1" },
        "tax":        { "type": "Decimal", "default": "1" },
        "totalPrice": { "type": "Decimal", "default": "2" }
      },
      "snapshot": "SELECT Id AS id, Price AS price, Tax AS tax, TotalPrice AS totalPrice FROM HotelPricings WHERE QuoteId IN (SELECT Id FROM Quotes WHERE TripId = @tripId)",
      "restore": "restoreHotelPricingPrice",
      "maxRows": 10
    },
    "restoreHotelPricingPrice": {
      "description": "Restore one hotel pricing's price, tax and total price by id",
      "restoreOnly": true,
      "sql": "UPDATE HotelPricings SET Price = @price, Tax = @tax, TotalPrice = @totalPrice WHERE Id = @id",
      "params": {
        "id":         { "type": "Int", "required": true },
        "price":      { "type": "Decimal", "required": true },
        "tax":        { "type": "Decimal", "required": true },
        "totalPrice": { "type": "Decimal", "required": true }
      },
      "maxRows": 1
    }
  }
}
```

These entries translate the team's current manual queries (hard-coded trip ids become `@tripId` defaulting to `{tripNumber}`; the hard-coded minute offsets become `@minutes` defaults). `UPDATE Quotes … WHERE Id IN (SELECT Id FROM Quotes WHERE TripId = …)` is simplified to the equivalent `WHERE TripId = @tripId`. Column types (`Int` ids, `DateTime2` dates, `Decimal` prices) and the exact table casing are to be confirmed against the DB schema during implementation; `db:check` validates each catalog read against the live DB.

### Restore pattern

A write that changes several rows restores them **row by row by primary key**: its `snapshot` returns `id` plus the original values of every column the write changes, aliased to the param names of a paired `restoreOnly` query (`UPDATE … SET col = @col WHERE Id = @id`, `maxRows: 1`). The restore therefore writes back the exact original values, not a recomputed one (e.g. the original absolute `Expires`, not `DATEADD` relative to cleanup time).

### Query entry fields

| Field | Required | Meaning |
|---|---|---|
| `description` | yes | Human description, shown in logs/errors |
| `sql` | yes | Single statement with `@param` placeholders |
| `params` | yes (may be `{}`) | Map name → `{ type, default?, required? }`; `type` is an `mssql` type name (`Int`, `BigInt`, `NVarChar`, `VarChar`, `Bit`, `DateTime2`, `Decimal`, `UniqueIdentifier`) |
| `snapshot` | writes with restore | SELECT run inside the write's transaction with the same params; returns `id` + original values, aliased to the restore query's param names |
| `restore` | writes with restore | Name of a `restoreOnly` catalog query, run once per snapshot row on cleanup |
| `restoreOnly` | no | `true` marks a restore query: it needs no `snapshot`/`restore`/`noRestore` and cannot be run from a step |
| `noRestore` | writes without restore | Non-empty reason string; mutually exclusive with `snapshot`/`restore` |
| `maxRows` | every write | Max rows the write may affect; no default, so each entry states its expected blast radius |

### Catalog validation (at load, fail-fast for the whole run)

The catalog is validated on first load; any violation throws `DbQueryError(POLICY)` naming query + rule. Since parameters are always bound, SQL text is fixed, so load-time validation fully covers runtime.

1. Every `forbidden` entry (case-insensitive regex) is tested against each query's `sql` and `snapshot`.
2. Built-in rules, not configurable:
   - One statement only: no `;` except a single trailing one; no `GO`.
   - No SQL comments (`--`, `/* */`), so no pattern can be hidden from the forbidden check.
   - No `EXEC`/`EXECUTE`/`sp_executesql`.
   - `UPDATE`/`DELETE` must contain `WHERE`.
   - `snapshot` must be a `SELECT`.
3. Every `@param` used in `sql`/`snapshot` is declared in `params`; every declared param is used in `sql`.
4. `type` must be a supported `mssql` type.
5. Write queries (`UPDATE`/`INSERT`/`DELETE`/`MERGE`) must declare `maxRows`, and — unless `restoreOnly` — (`snapshot` AND `restore`) XOR `noRestore`.
6. `restore` must reference an existing catalog query marked `restoreOnly`. (Snapshot column names are only known at runtime, so matching them to the restore query's params is checked in §6 step 4.)

## 6. Runtime flow — `DbQueries.runQuery(world, name, overrides)`

1. **Resolve** name in catalog → else `POLICY` error listing close names. A `restoreOnly` query is refused here (only the restore hook runs it).
2. **Validate overrides**: keys must be declared params → else `POLICY` error (catches Gherkin typos).
3. **Build params**: `default` → override → resolve `{placeholder}` against world (`{tripNumber}` = trip id, other `{key}` = `world[key]` primitive) → coerce to declared type (invalid `Int` etc. → `POLICY` error). A `required` param with an empty result, or any param still containing an unresolved `{…}`, fails.
4. **Begin transaction** (writes). Snapshot and write share it, so no parallel worker can change the rows in between.
5. **Snapshot** (writes with `snapshot`): run the SELECT with the same params. 0 rows, or more rows than `maxRows` → rollback + fail before writing. Snapshot columns must be exactly the restore query's declared params → else rollback + `POLICY` error.
6. **Execute** the write. If `rowsAffected > maxRows`, or (with a snapshot) `rowsAffected ≠ snapshot row count` → rollback + `ROW_LIMIT` error. Else commit.
7. **Register restore** (after commit): for each snapshot row push `{ query: restore, params: snapshotRow }` onto `world.dbRestores`; the restore query's params come only from the snapshot row.
8. **Store result**: `world.dbLastResult = { query: name, rows, rowsAffected }`.

### Restore — `tests/support/dbHooks.js`

- `After` hook calls `DbQueries.runPendingRestores(world)`: pops `world.dbRestores` in **reverse** order (LIFO) and runs each through the normal policy + execute path but **without** snapshot/registration (no recursion).
- A failed restore logs an error, attaches details (`query`, `params`) to the Cucumber report, continues with the rest, and after all restores throws `DbQueryError(RESTORE)` so the scenario is reported failed.
- Runs regardless of scenario status and of `this.page`.

## 7. Steps — `tests/steps/db_queries.steps.js`

### 7.1 Run

```gherkin
When I run the DB query "{name}"
When I run the DB query "{name}" with:
  | param | value |
```

- Same step for reads and writes; reads never snapshot or register a restore.
- DataTable is a two-column `rowsHash()` (param → value).

### 7.2 Validate the last result (`world.dbLastResult`)

```gherkin
Then the DB result should have {int} row(s)
Then the DB result should have at least {int} row(s)

Then the DB result column "{col}" should {op} "{value}"
Then the DB result row {int} column "{col}" should {op} "{value}"
Then every DB result row column "{col}" should {op} "{value}"
Then any DB result row column "{col}" should {op} "{value}"
Then the DB result column "{col}" should {unaryOp}

Then the DB result should contain rows:
  | colA | colB |
  | v1   | v2   |
```

- `{op}`: `be`, `not be`, `contain`, `not contain`, `be greater than`, `be less than`. `{unaryOp}`: `be empty`, `not be empty`. Implemented as one step per shape with the operator captured by a regex alternation, dispatched to a single `compare(actual, op, expected)` function in the DSL.
- `the DB result column …` = row 1. `row {int}` is **1-based**. Out-of-range row, missing column, or no prior query → clear error.
- `every` fails on an empty result (no vacuous pass); `any` fails if no row matches.
- `should contain rows`: unordered; each expected row must match a distinct actual row on the listed columns only; unlisted columns are ignored.

### 7.3 Wait for async backend updates

```gherkin
Then the DB query "{name}" column "{col}" should become "{value}" within {int} seconds
Then the DB query "{name}" column "{col}" should become "{value}" within {int} seconds with:
  | param | value |
```

- Re-runs the query every 3 s until row 1's column equals the value or the timeout passes; the last result is kept in `world.dbLastResult`. On timeout the error shows the last seen value.
- **Read queries only**: a write query name → `POLICY` error.

### 7.4 Store

```gherkin
And I store the DB result column "{col}" as "{worldKey}"
And I store the DB result row {int} column "{col}" as "{worldKey}"
```

- Writes the normalized string value to `world[worldKey]`, usable later as `{worldKey}` in queries, DB assertions and payload steps.

### 7.5 Value normalization and comparison

- Actual values are normalized to strings: `null`/`undefined` → `""`; numbers without trailing `.0` (`Decimal` `1.00` → `1`); booleans → `true`/`false`; `Date` → ISO-8601 UTC.
- Expected values resolve `{placeholders}` first (same rules as §6 step 3).
- `be`/`not be`: exact string match after normalization. `contain`/`not contain`: case-sensitive substring.
- `greater than`/`less than`: if both sides are numeric → numeric compare; else if both parse as dates → date compare; else `POLICY` error (no silent string compare).
- Relative dates in expected values: `now`, `now+Nm`, `now-Nm`, `now+Nh`, `now+Nd` (e.g. `expires should be less than "now"`).
- Failure message: query name, params, operator, expected vs actual, and the result rows rendered as a compact table (max 20 rows).

### 7.6 Common

- All steps wrapped by `runDbStep(world, stepName, meta, action)` honouring `DB_QUERIES_ENABLED`.

## 8. Errors and logging

- Single `DbQueryError extends Error` with `code`: `CONFIG`, `AUTH`, `POLICY`, `TIMEOUT`, `ROW_LIMIT`, `RESTORE`, `QUERY` (driver error, wrapped with query name).
- Logger: `require("@utils/logger").child("DbQueries")`. Logs query name, params, rowsAffected, duration. **Never** logs tokens, client secret or the full connection config.
- Credential errors wrapped as `AUTH` with a hint per mode (e.g. `azure-cli`: run `az login`).

## 9. Testing

- **Unit** (`npm run test:unit` → `node --test tests/unit/`): policy loading and each validation rule, override validation, placeholder resolution, type coercion, restore param merge; value normalization, every `compare` operator (incl. numeric vs date vs error), relative dates, `every`/`any`/`contain rows` matching. Uses in-memory catalogs; no DB.
- **Connectivity** (`npm run db:check`): validates `src/config/dbQueries.json` offline, then connects with the configured auth mode and runs `SELECT 1`; `--query <name> --param k=v` optionally runs a catalog read query. Exit code non-zero on failure.
- **Smoke** (`tests/features/db/db_queries_smoke.feature`, tag `@db`): runs a read-only catalog query and asserts a row count, exercising step → DSL → client → DB.

## 10. Documentation

`docs/DbQueries.md`: setup per auth mode (incl. service principal DB user creation: `CREATE USER [app] FROM EXTERNAL PROVIDER` + least-privilege grants), catalog format and rules, steps, restore semantics, local parallel note, `azure/login` OIDC workflow snippet for `azure-cli`, troubleshooting.
