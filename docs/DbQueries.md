# DB Queries

Run **pre-approved, parameterised** SQL against the application database (Azure SQL) from
Cucumber scenarios: change live trip data (expire quotes, force prices, move dates) and read data
back for assertions. Every change is reverted automatically after the scenario, pass or fail.

- Catalog: `src/config/dbQueries.json` — the only SQL that can run.
- Steps: `tests/steps/db_queries.steps.js` · DSL: `src/dsl/DbQueries.js` (`const { DbQueries } = require("@dsl")`).
- Global switch: `DB_QUERIES_ENABLED=false` turns every DB step into a logged no-op, and the restore hook does nothing. `npm run db:check` ignores this switch.
- Node: the DB dependencies are pinned (see `overrides` in `package.json`) to releases that run on Node 20, which CI uses; do not upgrade them past that without moving CI.
- Restores are queued in memory: if the process is killed mid-scenario (cancelled run, crash) the queued restores are lost. The After hook attaches the queue (`db-restores-queued.json`) before running it, so the rows can be fixed by hand.
- Unrelated: `tests/steps/db.steps.js` / `DbRail` are about Deutsche Bahn rail.

## 1. Setup

Add to `.env` (see `.env.example`):

| Variable | Used by | Notes |
|---|---|---|
| `DB_QUERIES_ENABLED` | all | default `true` |
| `DB_SERVER_NAME`, `DB_DATABASE_NAME` | all | e.g. `myserver.database.windows.net` |
| `DB_AUTHENTICATION` | all | `entra-mfa` \| `service-principal` \| `azure-cli` |
| `DB_USER_NAME` | `entra-mfa` | your UPN, used as the sign-in hint |
| `DB_TENANT_ID` | `service-principal` (optional for `entra-mfa`) | |
| `DB_CLIENT_ID`, `DB_CLIENT_SECRET` | `service-principal` | |
| `DB_TIMEOUT_MS` | all | default `30000` |

Settings are only checked on the first DB step, so scenarios without DB steps never need them.

### Local: `entra-mfa`

A browser window opens on the first DB step of each worker; sign in with `DB_USER_NAME`. Run DB
scenarios with a single worker so you sign in once: `npm run bdd:db` or `npx cucumber-js <path> --parallel 1`.

### CI: `service-principal`

Add the `DB_*` values to the existing `secrets.ENV` dotenv secret (exported by
`.github/actions/load-env-from-secret`), like PayloadValidation. No workflow change is needed.
The app registration needs a database user with the least privilege the catalog needs:

```sql
CREATE USER [qa-automation-app] FROM EXTERNAL PROVIDER;
GRANT SELECT, UPDATE ON dbo.Quotes TO [qa-automation-app];
GRANT SELECT, UPDATE ON dbo.EvolviPricings TO [qa-automation-app];
GRANT SELECT, UPDATE ON dbo.GroundServicePricings TO [qa-automation-app];
GRANT SELECT, UPDATE ON dbo.CarSegments TO [qa-automation-app];
GRANT SELECT, UPDATE ON dbo.HotelPricings TO [qa-automation-app];
-- keep this list in sync with the tables in src/config/dbQueries.json
```

### CI alternative: `azure-cli` with OIDC

`DB_AUTHENTICATION=azure-cli` uses the Azure CLI login of the runner. Snippet for a workflow
(documentation only — not added to any workflow):

```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: azure/login@v2
    with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      allow-no-subscriptions: true
```

Locally, `az login` first.

### Check the setup

```bash
npm run db:check -- --offline                               # catalog only, no DB
npm run db:check                                            # + connect, SELECT 1, compile reads and snapshots
npm run db:check -- --query getTripQuotes --param tripId=3768378   # + run one read query
npm run test:unit                                           # policy / value / DSL unit tests
```

## 2. Steps

```gherkin
When I run the DB query "expireTripQuotes"
When I run the DB query "expireTripQuotes" with:
  | param   | value |
  | minutes | 5     |

Then the DB result should have 2 rows
Then the DB result should have at least 1 row
Then the DB result column "status" should be "3"
Then the DB result row 2 column "expires" should be less than "now"
Then every DB result row column "product" should not be "car"
Then any DB result row column "product" should contain "hotel"
Then the DB result column "expires" should not be empty
Then the DB result should contain rows:
  | product | status |
  | car     | 3      |

Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds
Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds with:
  | param  | value |
  | tripId | {storedTripId} |

And I store the DB result column "id" as "storedQuoteId"
And I store the DB result row 2 column "id" as "storedSecondQuoteId"
```

- The `with:` table is `param | value`; the header row is optional. Unknown param names fail (typo guard).
- Operators: `be`, `not be`, `contain`, `not contain` (case-sensitive), `be greater than`, `be less than`; plus `be empty` / `not be empty`.
- `the DB result column …` means row 1; `row N` is **1-based**.
- `every` fails on an empty result; `any` fails if no row matches; `contain rows` is unordered, each expected row must match a different actual row, unlisted columns are ignored.
- Row-count steps count returned rows. A write returns no rows; its `rowsAffected` is logged.
- Polling re-runs a **read** query every 3 s (max 600 s) and fails showing the last value seen.
- Stored values are strings and can be used as `{key}` in DB steps and payload steps. Framework fields (`page`, `tripIds`, …) cannot be overwritten.

### Values

- Params: `{tripNumber}` is the scenario's trip id; `{key}` is a value stored on the world. A param that still has an unresolved `{…}` fails before any SQL is sent.
- Dates in params and expected values: ISO-8601 (`2026-10-01T10:00`, zone-less means **UTC**) or relative `now`, `now+5m`, `now-2h`, `now+1d`.
- Results are compared as strings: `NULL` → `""`, `1.00` → `1`, `true`/`false`, dates → ISO-8601 UTC (`2026-10-01T10:00:00.000Z`).
- `greater than` / `less than` compare numbers numerically and dates chronologically; anything else is an error, never a string comparison.

## 3. The catalog

```json
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
}
```

| Field | Required | Meaning |
|---|---|---|
| `description` | yes | shown in logs and errors |
| `sql` | yes | one statement with `@param` placeholders |
| `params` | yes (`{}` for none) | name → `{ type, default?, required? }`; types `Int`, `BigInt`, `NVarChar`, `VarChar`, `Bit`, `DateTime2`, `Decimal`, `UniqueIdentifier` |
| `snapshot` | writes with restore | SELECT returning `id` + original values, aliased to the restore query's params |
| `restore` | writes with restore | name of a `restoreOnly` query, run once per snapshot row |
| `restoreOnly` | no | marks a restore query; cannot be run from a step |
| `noRestore` | writes without restore | non-empty reason; excludes `snapshot`/`restore` |
| `maxRows` | every write | most rows the write may change |

Rules checked when the catalog loads (any violation fails the run, listing every problem):
forbidden patterns (`DROP`, `TRUNCATE`, `ALTER`, `GRANT`, `REVOKE`), one statement, no comments,
no `EXEC`, every statement must start with SELECT, WITH, UPDATE, INSERT, DELETE or MERGE,
`UPDATE`/`DELETE` need `WHERE` (checked on the outer statement only), `snapshot` is a read-only `SELECT`, every `@param` is
declared and every declared param is used, supported types, writes declare `maxRows` and exactly
one of `snapshot`+`restore` or `noRestore`, `restore` targets a `restoreOnly` query. Anything
containing `UPDATE`/`INSERT`/`DELETE`/`MERGE`/`INTO` counts as a write (so `SELECT … INTO` does).

### Adding a query

1. Add the entry; for a write, add its `snapshot` and a paired `restoreOnly` query
   (`UPDATE … SET col = @col WHERE Id = @id`, `maxRows: 1`).
2. `npm run test:unit` (validates the shipped catalog) and `npm run db:check` (compiles it against the schema).

## 4. Restore semantics

1. A write runs in a `REPEATABLE READ` transaction: snapshot, then write.
2. 0 snapshot rows, more than `maxRows`, snapshot columns that are not exactly the restore params,
   or `rowsAffected` different from the snapshot count → rollback and fail; nothing changed.
3. After commit, one restore per snapshot row is queued on the scenario.
4. After the scenario (pass or fail, browser or not), `tests/support/dbHooks.js` runs the queue
   last-in first-out, writing back the exact original values (including `NULL`).
5. A failed restore does not stop the others; the scenario then fails with `[DB RESTORE]` and the
   leftover rows attached to the report as JSON.

## 5. Troubleshooting

| Error | Meaning / fix |
|---|---|
| `[DB CONFIG] DB_AUTHENTICATION=… requires …` | add the listed variables to `.env` |
| `[DB AUTH] …` | token failed; follow the hint (`az login`, browser sign-in, secret expiry) |
| `[DB POLICY] Unknown DB query "…". Did you mean …` | name typo, or the query is not in the catalog |
| `[DB POLICY] … references {tripNumber} …` | no trip yet: open/create a trip first or pass `tripId` |
| `[DB POLICY] Invalid DB query catalog` | the catalog broke a rule; the message lists each one |
| `[DB ROW_LIMIT] …` | the write would touch 0 or too many rows; nothing was changed |
| `[DB QUERY] �` | driver or connection failure: check `DB_SERVER_NAME` / `DB_DATABASE_NAME`, the firewall (your IP or the runner), and that the DB user exists |
| `[DB TIMEOUT]` | raise `DB_TIMEOUT_MS` or check DB load |
| `[DB RESTORE]` | cleanup failed; check the attached rows and fix them by hand |
