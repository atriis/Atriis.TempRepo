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
    "getTripStatus": {
      "description": "Read the current status of a trip",
      "sql": "SELECT Status AS status FROM Trips WHERE TripId = @tripId",
      "params": {
        "tripId": { "type": "Int", "default": "{tripNumber}" }
      }
    },
    "setTripStatus": {
      "description": "Force the status of a trip",
      "sql": "UPDATE Trips SET Status = @status WHERE TripId = @tripId",
      "params": {
        "tripId": { "type": "Int", "default": "{tripNumber}" },
        "status": { "type": "NVarChar", "required": true }
      },
      "snapshot": "SELECT Status AS status FROM Trips WHERE TripId = @tripId",
      "restore": "setTripStatus",
      "maxRows": 1
    }
  }
}
```

Table/column names above are illustrative; real entries are added per test need.

### Query entry fields

| Field | Required | Meaning |
|---|---|---|
| `description` | yes | Human description, shown in logs/errors |
| `sql` | yes | Single statement with `@param` placeholders |
| `params` | yes (may be `{}`) | Map name → `{ type, default?, required? }`; `type` is an `mssql` type name (`Int`, `BigInt`, `NVarChar`, `VarChar`, `Bit`, `DateTime2`, `Decimal`, `UniqueIdentifier`) |
| `snapshot` | writes with restore | SELECT run before the write with the same params; its columns feed the restore |
| `restore` | writes with restore | Name of a catalog query to run on cleanup |
| `noRestore` | writes without restore | Non-empty reason string; mutually exclusive with `snapshot`/`restore` |
| `maxRows` | no | Max rows a write may affect (default `1`) |

### Catalog validation (at load, fail-fast for the whole run)

The catalog is validated on first load; any violation throws `DbQueryError(POLICY)` naming query + rule. Since parameters are always bound, SQL text is fixed, so load-time validation fully covers runtime.

1. Every `forbidden` entry (case-insensitive regex) is tested against each query's `sql` and `snapshot`.
2. Built-in rules, not configurable:
   - One statement only: no `;` except a single trailing one; no `GO`.
   - No `EXEC`/`EXECUTE`/`sp_executesql`.
   - `UPDATE`/`DELETE` must contain `WHERE`.
   - `snapshot` must be a `SELECT`.
3. Every `@param` used in `sql`/`snapshot` is declared in `params`; every declared param is used in `sql`.
4. `type` must be a supported `mssql` type.
5. Write queries (`UPDATE`/`INSERT`/`DELETE`/`MERGE`) must have (`snapshot` AND `restore`) XOR `noRestore`.
6. `restore` must reference an existing catalog query, which must itself be a write. (Snapshot column names are only known at runtime, so matching them to the restore query's params is checked in §6 step 4.)

## 6. Runtime flow — `DbQueries.runQuery(world, name, overrides)`

1. **Resolve** name in catalog → else `POLICY` error listing close names.
2. **Validate overrides**: keys must be declared params → else `POLICY` error (catches Gherkin typos).
3. **Build params**: `default` → override → resolve `{placeholder}` against world (`{tripNumber}` = trip id, other `{key}` = `world[key]` primitive) → coerce to declared type (invalid `Int` etc. → `POLICY` error). A `required` param with an empty result, or any param still containing an unresolved `{…}`, fails.
4. **Snapshot** (writes with `snapshot`): run SELECT with same params. 0 rows, or more rows than `maxRows` → fail before writing. Every snapshot column name must be a declared param of the restore query → else `POLICY` error before writing. All snapshot rows are kept; the restore runs once per snapshot row.
5. **Execute** in a transaction. For writes, if `rowsAffected > maxRows` → rollback + `ROW_LIMIT` error. Else commit.
6. **Register restore** (writes with restore): for each snapshot row push `{ query: restore, params: { ...builtParams, ...snapshotRow } }` onto `world.dbRestores`.
7. **Store result**: `world.dbLastResult = { query: name, rows, rowsAffected }`.

### Restore — `tests/support/dbHooks.js`

- `After` hook calls `DbQueries.runPendingRestores(world)`: pops `world.dbRestores` in **reverse** order (LIFO) and runs each through the normal policy + execute path but **without** snapshot/registration (no recursion).
- A failed restore logs an error, attaches details (`query`, `params`) to the Cucumber report, continues with the rest, and after all restores throws `DbQueryError(RESTORE)` so the scenario is reported failed.
- Runs regardless of scenario status and of `this.page`.

## 7. Steps — `tests/steps/db_queries.steps.js`

```gherkin
When I run the DB query "{name}"
When I run the DB query "{name}" with:
  | param | value |
Then the DB result should have {int} row(s)
Then the DB result column "{col}" should be "{value}"
Then the DB result column "{col}" should contain "{value}"
And I store the DB result column "{col}" as "{worldKey}"
```

- DataTable is a two-column `rowsHash()` (param → value).
- Column steps read row 0 of `world.dbLastResult`; missing result or column → clear error. Expected values also resolve `{placeholders}`.
- `store` writes the string value to `world[worldKey]`, usable later as `{worldKey}` in queries and payload steps.
- All steps wrapped by `runDbStep(world, stepName, meta, action)` honouring `DB_QUERIES_ENABLED`.

## 8. Errors and logging

- Single `DbQueryError extends Error` with `code`: `CONFIG`, `AUTH`, `POLICY`, `TIMEOUT`, `ROW_LIMIT`, `RESTORE`, `QUERY` (driver error, wrapped with query name).
- Logger: `require("@utils/logger").child("DbQueries")`. Logs query name, params, rowsAffected, duration. **Never** logs tokens, client secret or the full connection config.
- Credential errors wrapped as `AUTH` with a hint per mode (e.g. `azure-cli`: run `az login`).

## 9. Testing

- **Unit** (`npm run test:unit` → `node --test tests/unit/`): policy loading and each validation rule, override validation, placeholder resolution, type coercion, restore param merge. Uses in-memory catalogs; no DB.
- **Connectivity** (`npm run db:check`): validates `src/config/dbQueries.json` offline, then connects with the configured auth mode and runs `SELECT 1`; `--query <name> --param k=v` optionally runs a catalog read query. Exit code non-zero on failure.
- **Smoke** (`tests/features/db/db_queries_smoke.feature`, tag `@db`): runs a read-only catalog query and asserts a row count, exercising step → DSL → client → DB.

## 10. Documentation

`docs/DbQueries.md`: setup per auth mode (incl. service principal DB user creation: `CREATE USER [app] FROM EXTERNAL PROVIDER` + least-privilege grants), catalog format and rules, steps, restore semantics, local parallel note, `azure/login` OIDC workflow snippet for `azure-cli`, troubleshooting.
