# DB Queries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Cucumber scenarios run pre-approved, parameterised SQL queries from a JSON catalog against the application's Azure SQL database, assert on the results, and have every data change reverted automatically after the scenario.

**Architecture:** Pure, DB-free modules hold all the rules (`dbValues` for coercion/normalisation/comparison, `dbQueryPolicy` for catalog validation and param building) so they are unit-tested with `node:test`. A thin `dbClient` (mssql pool + Entra access token from `dbCredential`) is the only code that talks to SQL. The `DbQueries` DSL orchestrates policy + client (transactions, snapshot, restore registration, assertions) and is tested against a fake client. Steps and hooks are thin wrappers, mirroring how PayloadValidation is wired.

**Tech Stack:** Node.js (CommonJS, `module-alias` `@`-imports), `@cucumber/cucumber` 12, `mssql` (tedious driver), `@azure/identity`, `node:test` + `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-09-29-db-queries-design.md` — read it alongside this plan; section numbers below (§N) refer to it.

## Global Constraints

- New runtime dependencies are exactly `mssql` and `@azure/identity` (added to `dependencies`, like the existing `@azure/*` packages). No other new packages.
- CommonJS modules; import project code through the aliases in `package.json` `_moduleAliases` (`@utils/...`, `@config/...`, `@dsl`). Every entry file (steps, hooks, scripts, unit tests) starts with `require("module-alias/register");`.
- Logger: `require("@utils/logger").child("DbQueries")` for DSL/client. **Never** log tokens, the client secret, or the full connection config.
- Token scope: `https://database.windows.net/.default`.
- `DB_QUERIES_ENABLED` uses `getOptionalBooleanEnv` with default `true`; all other DB settings use `getOptionalEnv` and are only checked on the first DB operation — a run with no DB config must not fail any non-DB scenario.
- `DB_AUTHENTICATION` values: `entra-mfa` | `service-principal` | `azure-cli`. Missing-value message format: `DB_AUTHENTICATION=service-principal requires DB_CLIENT_SECRET`.
- Error class `DbQueryError` with `code` in `CONFIG`, `AUTH`, `POLICY`, `TIMEOUT`, `ROW_LIMIT`, `RESTORE`, `QUERY`.
- Catalog file: `src/config/dbQueries.json`. Supported param types: `Int`, `BigInt`, `NVarChar`, `VarChar`, `Bit`, `DateTime2`, `Decimal`, `UniqueIdentifier`.
- Comparison operators: `be`, `not be`, `contain`, `not contain`, `be greater than`, `be less than`; unary: `be empty`, `not be empty`. Result rows are **1-based** in steps.
- Relative dates: `now`, `now+Nm`, `now-Nm`, `now+Nh`, `now+Nd` (and `-` for every unit).
- Polling interval: 3 s.
- Commits: Conventional Commits, scope `db` (e.g. `feat(db): ...`), ending with the `Co-Authored-By` line from the session's attribution rules.
- Do not edit `.github/workflows/*` (the OIDC snippet is documentation only).

## Review Focus

1. **Gherkin table with a `| param | value |` header row** — the spec's own step example has a header; `rowsHash()` would turn it into an override named `param` and fail with a confusing "unknown param" error. The header must be dropped. Pinned in Task 4 (`overridesFromTable` tests).
2. **Fractional `Decimal` originals (e.g. `123.45`)** — bare `mssql` `sql.Decimal` is `decimal(18,0)`, which silently rounds the value written back by the restore. The client binds `decimal(38,10)`. Pinned in Task 3 (`toSqlType("Decimal")` test).
3. **Date params without a zone (`2026-10-01T10:00`)** — JavaScript parses these as machine-local time, so the same feature would write different instants locally and on CI. Zone-less dates are UTC. Pinned in Task 1 (`parseDateText` / `coerceParam` tests).
4. **`NULL` original values in a snapshot** — a column that was `NULL` before the write must be restored to `NULL`, not rejected as a missing "required" param. Pinned in Task 2 (`buildParams` fromSnapshot test) and Task 4 (restore test).
5. **`{tripNumber}` default before any trip exists** — the query must fail with a message naming the param and telling the author to open a trip or pass `tripId`, never send the literal `{tripNumber}` or an empty id. Pinned in Task 2 (`buildParams` test).

Also covered because they are cheap and nasty: `SELECT … INTO` counted as a write (Task 2), `storeColumn` refusing to overwrite `world.page` even while it is still `null` (Task 4), polling limit above the step timeout refused (Task 4), UTF-8 BOM in the catalog file (Task 2).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/utils/dbQueryError.js` | new | `DbQueryError` + `DB_ERROR_CODES` |
| `src/utils/dbValues.js` | new | Pure value helpers: relative/ISO date parsing, param coercion, result normalisation, `compare`, `containsRows`, `formatRowsTable` |
| `src/utils/dbQueryPolicy.js` | new | Catalog load + validation, `resolveQuery`, `isWriteQuery`, `resolvePlaceholders`, `buildParams`, `checkSnapshotColumns` |
| `src/config/dbQueries.json` | new | Catalog from spec §5 plus `dbPing` |
| `src/config/config.js` | edit | `db` getter block |
| `src/utils/dbCredential.js` | new | Auth mode → `@azure/identity` credential, token fetch with AUTH hints |
| `src/utils/dbClient.js` | new | Lazy pool with token refresh, typed binding, `execute`, `withTransaction`, `close` |
| `src/dsl/DbQueries.js` | new | `runQuery`, restores, assertions, polling, store |
| `src/dsl/index.js` | edit | Export `DbQueries` |
| `tests/steps/db_queries.steps.js` | new | Gherkin steps + `runDbStep` guard |
| `tests/support/dbHooks.js` | new | `After` restores, `AfterAll` pool close |
| `tests/features/db/db_queries_smoke.feature` | new | `@db` smoke |
| `tests/unit/*.test.js` | new | `node:test` suites |
| `tests/unit/fixtures/db_steps.dry-run.feature` | new | Every step shape, for `cucumber-js --dry-run` matching checks |
| `scripts/check-db.js` | new | Offline catalog check, live `SELECT 1`, live compile check of reads/snapshots, optional read query |
| `.env.example`, `package.json`, `docs/DbQueries.md` | edit/new | Config, deps/scripts, docs |

Note: `tests/steps/db.steps.js` and `src/dsl/DbRail.js` already exist and are about **Deutsche Bahn** rail — unrelated. Do not touch or reuse them.

---

### Task 1: Dependencies, error type and value helpers

**Files:**
- Modify: `package.json` (dependencies + scripts)
- Create: `src/utils/dbQueryError.js`
- Create: `src/utils/dbValues.js`
- Test: `tests/unit/dbValues.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `DbQueryError(code: string, message: string, details?: { cause?: Error, [k]: any })` — `.code`, `.name === "DbQueryError"`, message prefixed `[DB <code>] `; extra `details` keys are copied onto the error (e.g. `failures`). `DB_ERROR_CODES: string[]`.
  - `SUPPORTED_TYPES: string[]`, `TEXT_TYPES: string[]` (`["NVarChar","VarChar"]`), `COMPARISON_OPERATORS: string[]`
  - `parseRelativeDate(text, now?: Date): Date | null`
  - `parseDateText(text, now?: Date): Date | null`
  - `coerceParam(name: string, type: string, raw: any, now?: Date): any` — returns `null` for `null`
  - `normalizeValue(value: any): string`
  - `compare(actualRaw: any, op: string, expected: string, now?: Date): boolean`
  - `containsRows(actualRows: object[], expectedRows: Record<string,string>[]): boolean`
  - `formatRowsTable(rows: object[], maxRows = 20): string`

- [ ] **Step 1: Install dependencies and add scripts**

Run: `npm install mssql @azure/identity`
Expected: both appear under `"dependencies"` in `package.json`; `package-lock.json` updated.

Then add to `"scripts"` in `package.json` (after `"payload:check"`):

```json
    "db:check": "node scripts/check-db.js",
    "test:unit": "node --test \"tests/unit/**/*.test.js\"",
    "bdd:db": "npx cucumber-js tests/features/db/",
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/dbValues.test.js`:

```js
require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { DbQueryError } = require("@utils/dbQueryError");
const values = require("@utils/dbValues");

const NOW = new Date("2026-09-29T12:00:00.000Z");

function isPolicyError(fragment) {
  return (error) => error instanceof DbQueryError && error.code === "POLICY" && error.message.includes(fragment);
}

test("DbQueryError carries code, prefix and details", () => {
  const error = new DbQueryError("RESTORE", "boom", { failures: [1] });
  assert.equal(error.code, "RESTORE");
  assert.equal(error.name, "DbQueryError");
  assert.equal(error.message, "[DB RESTORE] boom");
  assert.deepEqual(error.failures, [1]);
  assert.throws(() => new DbQueryError("NOPE", "x"), /Unknown DbQueryError code/);
});

test("normalizeValue renders driver values as comparable strings", () => {
  assert.equal(values.normalizeValue(null), "");
  assert.equal(values.normalizeValue(undefined), "");
  assert.equal(values.normalizeValue(1.0), "1");
  assert.equal(values.normalizeValue(12.5), "12.5");
  assert.equal(values.normalizeValue(true), "true");
  assert.equal(values.normalizeValue(false), "false");
  assert.equal(values.normalizeValue(new Date("2026-10-01T10:00:00Z")), "2026-10-01T10:00:00.000Z");
  assert.equal(values.normalizeValue("  as is "), "  as is ");
});

test("parseRelativeDate understands now and now±N(m|h|d)", () => {
  assert.equal(values.parseRelativeDate("now", NOW).toISOString(), "2026-09-29T12:00:00.000Z");
  assert.equal(values.parseRelativeDate("now+2m", NOW).toISOString(), "2026-09-29T12:02:00.000Z");
  assert.equal(values.parseRelativeDate("now-1h", NOW).toISOString(), "2026-09-29T11:00:00.000Z");
  assert.equal(values.parseRelativeDate("NOW+3d", NOW).toISOString(), "2026-10-02T12:00:00.000Z");
  assert.equal(values.parseRelativeDate("tomorrow", NOW), null);
});

test("parseDateText treats zone-less dates as UTC, never machine-local", () => {
  assert.equal(values.parseDateText("2026-10-01T10:00", NOW).toISOString(), "2026-10-01T10:00:00.000Z");
  assert.equal(values.parseDateText("2026-10-01 10:00:30", NOW).toISOString(), "2026-10-01T10:00:30.000Z");
  assert.equal(values.parseDateText("2026-10-01", NOW).toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(values.parseDateText("2026-10-01T10:00:00+01:00", NOW).toISOString(), "2026-10-01T09:00:00.000Z");
  assert.equal(values.parseDateText("now+1d", NOW).toISOString(), "2026-09-30T12:00:00.000Z");
  assert.equal(values.parseDateText("not a date", NOW), null);
  assert.equal(values.parseDateText("2026-13-45", NOW), null);
});

test("compare: equality and substring operators", () => {
  assert.equal(values.compare("OK", "be", "OK"), true);
  assert.equal(values.compare(null, "be", ""), true);
  assert.equal(values.compare(1.0, "be", "1"), true);
  assert.equal(values.compare("OK", "not be", "KO"), true);
  assert.equal(values.compare("Booked", "contain", "ook"), true);
  assert.equal(values.compare("Booked", "contain", "OOK"), false);
  assert.equal(values.compare("Booked", "not contain", "Cancel"), true);
});

test("compare: ordering is numeric for numbers, not string order", () => {
  assert.equal(values.compare(10, "be greater than", "9"), true);
  assert.equal(values.compare("10", "be less than", "9"), false);
});

test("compare: ordering is date-based for dates and relative dates", () => {
  assert.equal(values.compare(new Date("2026-09-29T11:00:00Z"), "be less than", "now", NOW), true);
  assert.equal(values.compare(new Date("2026-09-29T13:00:00Z"), "be greater than", "now+30m", NOW), true);
  assert.equal(values.compare("2026-09-29T13:00:00Z", "be greater than", "2026-09-29T12:59", NOW), true);
});

test("compare: ordering never falls back to string comparison", () => {
  assert.throws(() => values.compare("abc", "be greater than", "1"), isPolicyError("both sides must be numbers or both dates"));
  assert.throws(() => values.compare("abc", "be roughly", "1"), isPolicyError("Unknown DB comparison operator"));
});

test("coerceParam converts Gherkin strings and snapshot values to typed values", () => {
  assert.equal(values.coerceParam("id", "Int", "42"), 42);
  assert.equal(values.coerceParam("id", "Int", 42), 42);
  assert.throws(() => values.coerceParam("id", "Int", "4.2"), isPolicyError('Param "id" (Int): expected an integer'));
  assert.throws(() => values.coerceParam("id", "Int", "3000000000"), isPolicyError("out of Int range"));
  assert.equal(values.coerceParam("id", "BigInt", "9007199254740993"), "9007199254740993");
  assert.equal(values.coerceParam("price", "Decimal", "12.34"), 12.34);
  assert.equal(values.coerceParam("price", "Decimal", 12.34), 12.34);
  assert.throws(() => values.coerceParam("price", "Decimal", "12,34"), isPolicyError("expected a decimal number"));
  assert.equal(values.coerceParam("flag", "Bit", "1"), true);
  assert.equal(values.coerceParam("flag", "Bit", "false"), false);
  assert.equal(values.coerceParam("when", "DateTime2", "2026-10-01T10:00", NOW).toISOString(), "2026-10-01T10:00:00.000Z");
  assert.equal(values.coerceParam("when", "DateTime2", "now+1d", NOW).toISOString(), "2026-09-30T12:00:00.000Z");
  const original = new Date("2026-01-01T00:00:00Z");
  assert.equal(values.coerceParam("when", "DateTime2", original), original);
  assert.throws(() => values.coerceParam("when", "DateTime2", "someday"), isPolicyError("expected an ISO-8601 date"));
  assert.equal(values.coerceParam("guid", "UniqueIdentifier", "0f8fad5b-d9cb-469f-a165-70867728950e"), "0f8fad5b-d9cb-469f-a165-70867728950e");
  assert.throws(() => values.coerceParam("guid", "UniqueIdentifier", "nope"), isPolicyError("expected a GUID"));
  assert.equal(values.coerceParam("name", "NVarChar", 5), "5");
  assert.equal(values.coerceParam("expires", "DateTime2", null), null);
  assert.throws(() => values.coerceParam("x", "Money", "1"), isPolicyError('unsupported type "Money"'));
});

test("containsRows matches each expected row to a distinct actual row", () => {
  const actual = [
    { a: 1, b: "x" },
    { a: 1, b: "y" },
  ];
  assert.equal(values.containsRows(actual, [{ a: "1" }, { a: "1" }]), true);
  assert.equal(values.containsRows(actual, [{ a: "1" }, { a: "1" }, { a: "1" }]), false);
  // Greedy matching would give row 0 to the first expected row and then fail; backtracking must not.
  assert.equal(values.containsRows(actual, [{ a: "1" }, { a: "1", b: "x" }]), true);
  assert.equal(values.containsRows(actual, [{ b: "z" }]), false);
});

test("formatRowsTable renders a compact, truncated table", () => {
  assert.equal(values.formatRowsTable([]), "(no rows)");
  const table = values.formatRowsTable([{ id: 1, status: null }, { id: 22, status: "OK" }]);
  assert.equal(table, ["| id | status |", "| 1  |        |", "| 22 | OK     |"].join("\n"));
  const many = Array.from({ length: 25 }, (_, index) => ({ id: index }));
  assert.match(values.formatRowsTable(many), /\.\.\. 5 more row\(s\)$/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL with `Cannot find module '@utils/dbQueryError'`.

- [ ] **Step 4: Write `src/utils/dbQueryError.js`**

```js
/**
 * Single error type for the DB queries feature. `code` tells a reader which layer failed:
 * CONFIG (missing/invalid .env), AUTH (token), POLICY (catalog, params, step usage),
 * TIMEOUT (driver timeout), ROW_LIMIT (blast-radius guard), RESTORE (cleanup), QUERY (driver).
 */
const DB_ERROR_CODES = ["CONFIG", "AUTH", "POLICY", "TIMEOUT", "ROW_LIMIT", "RESTORE", "QUERY"];

class DbQueryError extends Error {
  constructor(code, message, details = {}) {
    if (!DB_ERROR_CODES.includes(code)) {
      throw new Error(`Unknown DbQueryError code "${code}". Valid: ${DB_ERROR_CODES.join(", ")}`);
    }
    const { cause, ...rest } = details;
    super(`[DB ${code}] ${message}`, cause ? { cause } : undefined);
    this.name = "DbQueryError";
    this.code = code;
    Object.assign(this, rest);
  }
}

module.exports = { DbQueryError, DB_ERROR_CODES };
```

- [ ] **Step 5: Write `src/utils/dbValues.js`**

```js
/**
 * Pure value helpers for DB queries: no driver, no config, no I/O, so every rule here is
 * unit-tested without a database. Two directions:
 *  - into SQL: coerceParam() turns Gherkin strings / snapshot values into typed values;
 *  - out of SQL: normalizeValue() turns driver values into strings that steps compare.
 */
const { DbQueryError } = require("./dbQueryError");

const SUPPORTED_TYPES = ["Int", "BigInt", "NVarChar", "VarChar", "Bit", "DateTime2", "Decimal", "UniqueIdentifier"];
const TEXT_TYPES = ["NVarChar", "VarChar"];
const COMPARISON_OPERATORS = ["be", "not be", "contain", "not contain", "be greater than", "be less than"];

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const INTEGER_TEXT = /^-?\d+$/;
const DECIMAL_TEXT = /^-?\d+(\.\d+)?$/;
const GUID_TEXT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RELATIVE_DATE = /^now(?:([+-])(\d+)([mhd]))?$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;
const UNIT_MS = { m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

function parseRelativeDate(text, now = new Date()) {
  const match = RELATIVE_DATE.exec(String(text).trim());
  if (!match) return null;
  if (!match[1]) return new Date(now.getTime());
  const sign = match[1] === "-" ? -1 : 1;
  return new Date(now.getTime() + sign * Number(match[2]) * UNIT_MS[match[3].toLowerCase()]);
}

// Zone-less dates are UTC on purpose: JavaScript would read them as machine-local time, so the
// same feature file would write a different instant on a dev laptop and on the CI runner.
function parseDateText(text, now = new Date()) {
  const relative = parseRelativeDate(text, now);
  if (relative) return relative;
  const trimmed = String(text).trim();
  const match = ISO_DATE.exec(trimmed);
  if (!match) return null;
  let iso = trimmed.replace(" ", "T");
  if (!iso.includes("T")) iso += "T00:00:00";
  if (!match[1]) iso += "Z";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function coerceParam(name, type, raw, now = new Date()) {
  const fail = (why) => new DbQueryError("POLICY", `Param "${name}" (${type}): ${why}, got ${JSON.stringify(raw)}`);
  // NULL is a legitimate original value in a snapshot row; the restore must write it back as NULL.
  if (raw === null) return null;

  switch (type) {
    case "Int":
    case "BigInt": {
      const text = String(raw).trim();
      if (!INTEGER_TEXT.test(text)) throw fail("expected an integer");
      if (type === "BigInt") return text; // beyond Number.MAX_SAFE_INTEGER; mssql accepts the string
      const number = Number(text);
      if (number < INT_MIN || number > INT_MAX) throw fail("out of Int range");
      return number;
    }
    case "Decimal": {
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
      const text = String(raw).trim();
      if (!DECIMAL_TEXT.test(text)) throw fail("expected a decimal number");
      return Number(text);
    }
    case "Bit": {
      if (typeof raw === "boolean") return raw;
      const text = String(raw).trim().toLowerCase();
      if (text === "1" || text === "true") return true;
      if (text === "0" || text === "false") return false;
      throw fail("expected true/false/1/0");
    }
    case "DateTime2": {
      if (raw instanceof Date) return raw;
      const date = parseDateText(raw, now);
      if (!date) throw fail("expected an ISO-8601 date or now±N(m|h|d)");
      return date;
    }
    case "UniqueIdentifier": {
      const text = String(raw).trim();
      if (!GUID_TEXT.test(text)) throw fail("expected a GUID");
      return text;
    }
    case "NVarChar":
    case "VarChar":
      return String(raw);
    default:
      throw new DbQueryError("POLICY", `Param "${name}": unsupported type "${type}". Supported: ${SUPPORTED_TYPES.join(", ")}`);
  }
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Buffer.isBuffer(value)) return value.toString("hex");
  // String(1.0) === "1": a Decimal 1.00 read back by the driver compares equal to "1".
  return String(value);
}

function toNumber(text) {
  return DECIMAL_TEXT.test(text) ? Number(text) : null;
}

function orderOf(actualRaw, actual, expected, now) {
  const actualNumber = toNumber(actual);
  const expectedNumber = toNumber(expected);
  if (actualNumber !== null && expectedNumber !== null) return actualNumber - expectedNumber;

  const actualDate = actualRaw instanceof Date ? actualRaw : parseDateText(actual, now);
  const expectedDate = parseDateText(expected, now);
  if (actualDate && expectedDate) return actualDate.getTime() - expectedDate.getTime();

  throw new DbQueryError(
    "POLICY",
    `Cannot order-compare "${actual}" with "${expected}": both sides must be numbers or both dates`
  );
}

function compare(actualRaw, op, expected, now = new Date()) {
  const actual = normalizeValue(actualRaw);
  const expectedText = String(expected);
  switch (op) {
    case "be":
      return actual === expectedText;
    case "not be":
      return actual !== expectedText;
    case "contain":
      return actual.includes(expectedText);
    case "not contain":
      return !actual.includes(expectedText);
    case "be greater than":
      return orderOf(actualRaw, actual, expectedText, now) > 0;
    case "be less than":
      return orderOf(actualRaw, actual, expectedText, now) < 0;
    default:
      throw new DbQueryError(
        "POLICY",
        `Unknown DB comparison operator "${op}". Valid: ${COMPARISON_OPERATORS.join(", ")}`
      );
  }
}

function rowMatches(actualRow, expectedRow) {
  return Object.entries(expectedRow).every(([column, value]) => normalizeValue(actualRow[column]) === value);
}

// Backtracking assignment: result sets are a few rows, and greedy matching can reject a table
// that does match (an unspecific expected row grabbing the only row a specific one could use).
function containsRows(actualRows, expectedRows) {
  const used = new Set();
  const assign = (index) => {
    if (index === expectedRows.length) return true;
    for (let rowIndex = 0; rowIndex < actualRows.length; rowIndex++) {
      if (used.has(rowIndex) || !rowMatches(actualRows[rowIndex], expectedRows[index])) continue;
      used.add(rowIndex);
      if (assign(index + 1)) return true;
      used.delete(rowIndex);
    }
    return false;
  };
  return assign(0);
}

function formatRowsTable(rows, maxRows = 20) {
  if (!rows || rows.length === 0) return "(no rows)";
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const shown = rows.slice(0, maxRows).map((row) => columns.map((column) => normalizeValue(row[column])));
  const widths = columns.map((column, index) => Math.max(column.length, ...shown.map((cells) => cells[index].length)));
  const line = (cells) => `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(" | ")} |`;
  const lines = [line(columns), ...shown.map(line)];
  if (rows.length > maxRows) lines.push(`... ${rows.length - maxRows} more row(s)`);
  return lines.join("\n");
}

module.exports = {
  SUPPORTED_TYPES,
  TEXT_TYPES,
  COMPARISON_OPERATORS,
  parseRelativeDate,
  parseDateText,
  coerceParam,
  normalizeValue,
  compare,
  containsRows,
  formatRowsTable,
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS, all `dbValues` tests green.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/utils/dbQueryError.js src/utils/dbValues.js tests/unit/dbValues.test.js
git commit -m "feat(db): add DbQueryError and pure DB value helpers"
```

---

### Task 2: Catalog policy and the shipped catalog

**Files:**
- Create: `src/utils/dbQueryPolicy.js`
- Create: `src/config/dbQueries.json`
- Test: `tests/unit/dbQueryPolicy.test.js`

**Interfaces:**
- Consumes (Task 1): `DbQueryError`, `SUPPORTED_TYPES`, `TEXT_TYPES`, `coerceParam`.
- Produces:
  - `DEFAULT_CATALOG_PATH: string`
  - `validateCatalog(catalog: object): object` — throws one `POLICY` error listing every problem (`error.problems: string[]`)
  - `loadCatalog(catalogPath = DEFAULT_CATALOG_PATH): object` — cached per path
  - `isWriteSql(sql: string): boolean`, `isWriteQuery(query: object): boolean`
  - `resolveQuery(catalog, name, { allowRestoreOnly = false } = {}): object`
  - `resolvePlaceholders(text: string, world: object): string`
  - `findUnresolvedPlaceholder(text: any): string | null` — the key of the first `{key}` left, or `null`
  - `buildParams(queryName, query, overrides = {}, world = {}, { fromSnapshot = false, now = new Date() } = {}): Record<string, any>`
  - `checkSnapshotColumns(queryName, snapshotRows: object[], restoreName, restoreQuery): void`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/dbQueryPolicy.test.js`:

```js
require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { DbQueryError } = require("@utils/dbQueryError");
const policy = require("@utils/dbQueryPolicy");

const READ = {
  description: "Read quote statuses",
  sql: "SELECT Id AS id, Status AS status FROM Quotes WHERE TripId = @tripId",
  params: { tripId: { type: "Int", default: "{tripNumber}" } },
};
const WRITE = {
  description: "Expire quotes",
  sql: "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE TripId = @tripId",
  params: { tripId: { type: "Int", default: "{tripNumber}" }, minutes: { type: "Int", default: "2" } },
  snapshot: "SELECT Id AS id, Expires AS expires FROM Quotes WHERE TripId = @tripId",
  restore: "restoreExpires",
  maxRows: 5,
};
const RESTORE = {
  description: "Restore one quote expiry",
  restoreOnly: true,
  sql: "UPDATE Quotes SET Expires = @expires WHERE Id = @id",
  params: { id: { type: "Int", required: true }, expires: { type: "DateTime2", required: true } },
  maxRows: 1,
};

function catalogWith(extraQueries = {}, forbidden = ["\\bDROP\\b", "\\bTRUNCATE\\b"]) {
  return { forbidden, queries: { read: READ, write: WRITE, restoreExpires: RESTORE, ...extraQueries } };
}

function policyError(fragment) {
  return (error) => error instanceof DbQueryError && error.code === "POLICY" && error.message.includes(fragment);
}

function expectInvalid(extraQueries, fragment, forbidden) {
  assert.throws(() => policy.validateCatalog(catalogWith(extraQueries, forbidden)), policyError(fragment));
}

test("the shipped catalog is valid", () => {
  const catalog = policy.loadCatalog();
  for (const name of ["dbPing", "getTripQuotes", "expireTripQuotes", "restoreQuoteExpires", "setTripHotelPrice"]) {
    assert.ok(catalog.queries[name], `missing ${name}`);
  }
});

test("a well-formed catalog validates", () => {
  assert.doesNotThrow(() => policy.validateCatalog(catalogWith()));
});

test("forbidden patterns are checked case-insensitively in sql and snapshot", () => {
  expectInvalid({ bad: { ...READ, sql: "SELECT * FROM Quotes WHERE Name = 'drop' AND TripId = @tripId" } }, "forbidden pattern");
  expectInvalid({ bad: { ...WRITE, snapshot: "SELECT Id AS id FROM Quotes WHERE TripId = @tripId AND 1 = (SELECT 1 FROM x TRUNCATE)" } }, "snapshot matches forbidden pattern");
});

test("an invalid forbidden regex is reported", () => {
  expectInvalid({}, "is not a valid regex", ["(unclosed"]);
});

test("built-in rules cannot be switched off", () => {
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId; SELECT 2" } }, 'built-in rule "single statement"');
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId\nGO" } }, 'built-in rule "single statement"');
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId -- hidden" } }, 'built-in rule "no SQL comments"');
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a /* x */ WHERE 1 = @tripId" } }, 'built-in rule "no SQL comments"');
  expectInvalid({ bad: { ...READ, sql: "EXEC sp_who @tripId" } }, 'built-in rule "no EXEC"');
  expectInvalid({ bad: { ...WRITE, sql: "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, @tripId)" } }, 'built-in rule "UPDATE/DELETE need WHERE"');
  assert.doesNotThrow(() => policy.validateCatalog(catalogWith({ ok: { ...READ, sql: `${READ.sql};` } })));
});

test("params must be declared, used and of a supported type", () => {
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE TripId = @tripId AND Id = @quoteId" } }, "uses @quoteId, which is not declared");
  expectInvalid({ bad: { ...READ, params: { ...READ.params, unused: { type: "Int", default: "1" } } } }, 'param "unused" is declared but not used');
  expectInvalid({ bad: { ...READ, params: { tripId: { type: "Money" } } } }, 'unsupported type "Money"');
  expectInvalid({ bad: { ...READ, params: { tripId: { type: "Int", default: 5 } } } }, "default must be a string");
});

test("writes need maxRows and exactly one restore strategy", () => {
  const { maxRows, ...noMax } = WRITE;
  expectInvalid({ bad: noMax }, '"maxRows" as a positive integer');
  const { snapshot, restore, ...bare } = WRITE;
  expectInvalid({ bad: bare }, 'both "snapshot" and "restore", or a "noRestore" reason');
  expectInvalid({ bad: { ...WRITE, noRestore: "disposable" } }, "mutually exclusive");
  expectInvalid({ bad: { ...bare, noRestore: "  " } }, '"noRestore" must be a non-empty reason');
  assert.doesNotThrow(() => policy.validateCatalog(catalogWith({ ok: { ...bare, noRestore: "log rows are disposable" } })));
});

test("restore must point at an existing restoreOnly query", () => {
  expectInvalid({ bad: { ...WRITE, restore: "missing" } }, 'references unknown query "missing"');
  expectInvalid({ bad: { ...WRITE, restore: "write" } }, 'must be marked "restoreOnly": true');
});

test("snapshot must be a read-only SELECT", () => {
  expectInvalid({ bad: { ...WRITE, snapshot: "UPDATE Quotes SET Id = Id WHERE TripId = @tripId" } }, '"snapshot" must be a read-only SELECT');
});

test("reads cannot carry restore fields, SELECT INTO counts as a write", () => {
  expectInvalid({ bad: { ...READ, restore: "restoreExpires" } }, "read queries must not declare");
  expectInvalid({ bad: { ...READ, sql: "SELECT Id INTO Backup FROM Quotes WHERE TripId = @tripId" } }, '"maxRows" as a positive integer');
  assert.equal(policy.isWriteSql("SELECT Id INTO Backup FROM Quotes"), true);
  assert.equal(policy.isWriteSql("SELECT UpdatedAt FROM Quotes"), false);
});

test("every problem is reported in one error", () => {
  try {
    policy.validateCatalog(catalogWith({ a: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId -- x" }, b: { ...WRITE, restore: "missing" } }));
    assert.fail("expected a POLICY error");
  } catch (error) {
    assert.equal(error.problems.length, 2);
    assert.match(error.message, /query "a"/);
    assert.match(error.message, /query "b"/);
  }
});

test("resolveQuery suggests close names and refuses restore-only queries", () => {
  const catalog = policy.validateCatalog(catalogWith());
  assert.throws(() => policy.resolveQuery(catalog, "wrte"), policyError("Did you mean: write"));
  assert.throws(() => policy.resolveQuery(catalog, "restoreExpires"), policyError("only the restore hook may run it"));
  assert.equal(policy.resolveQuery(catalog, "restoreExpires", { allowRestoreOnly: true }), RESTORE);
});

test("buildParams layers default, override and world placeholders, then coerces", () => {
  const params = policy.buildParams("write", WRITE, { minutes: "10" }, { tripId: "3768378" });
  assert.deepEqual(params, { tripId: 3768378, minutes: 10 });
  assert.deepEqual(policy.buildParams("read", READ, {}, { currentTripId: 77 }), { tripId: 77 });
  assert.deepEqual(policy.buildParams("read", READ, { tripId: "{storedTrip}" }, { storedTrip: "12" }), { tripId: 12 });
});

test("buildParams rejects unknown overrides", () => {
  assert.throws(() => policy.buildParams("read", READ, { tripID: "1" }, {}), policyError('no param(s) tripID. Declared: tripId'));
});

test("buildParams names the param when {tripNumber} has no trip yet", () => {
  assert.throws(
    () => policy.buildParams("read", READ, {}, {}),
    policyError('param "tripId" references {tripNumber}, which has no value in this scenario (no trip id recorded yet')
  );
  assert.throws(() => policy.buildParams("read", READ, { tripId: "{nothing}" }, { nothing: { an: "object" } }), policyError("{nothing}"));
});

test("buildParams rejects empty required and non-text values", () => {
  const query = { ...READ, params: { tripId: { type: "Int" } } };
  assert.throws(() => policy.buildParams("q", query, {}, {}), policyError('param "tripId" has no value: give it in the step table'));
  assert.throws(() => policy.buildParams("read", READ, { tripId: "" }, {}), policyError('param "tripId" is empty'));
  const text = { ...READ, params: { tripId: { type: "NVarChar" } } };
  assert.deepEqual(policy.buildParams("q", text, { tripId: "" }, {}), { tripId: "" });
});

test("buildParams fromSnapshot keeps NULL originals and needs every restore param", () => {
  const params = policy.buildParams("restoreExpires", RESTORE, { id: 5, expires: null }, {}, { fromSnapshot: true });
  assert.deepEqual(params, { id: 5, expires: null });
  const original = new Date("2026-01-01T00:00:00Z");
  assert.equal(policy.buildParams("restoreExpires", RESTORE, { id: 5, expires: original }, {}, { fromSnapshot: true }).expires, original);
  assert.throws(
    () => policy.buildParams("restoreExpires", RESTORE, { id: 5 }, {}, { fromSnapshot: true }),
    policyError("the snapshot row does not carry it")
  );
});

test("checkSnapshotColumns requires exactly the restore params", () => {
  assert.doesNotThrow(() => policy.checkSnapshotColumns("write", [{ id: 1, expires: null }], "restoreExpires", RESTORE));
  assert.throws(
    () => policy.checkSnapshotColumns("write", [{ Id: 1, expires: null }], "restoreExpires", RESTORE),
    policyError("alias the snapshot columns to the restore params")
  );
});

test("loadCatalog tolerates a UTF-8 BOM and reports unreadable files", () => {
  const file = path.join(os.tmpdir(), `dbQueries-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(file, "﻿" + JSON.stringify(catalogWith()), "utf8");
  try {
    assert.ok(policy.loadCatalog(file).queries.read);
  } finally {
    fs.unlinkSync(file);
  }
  assert.throws(() => policy.loadCatalog(path.join(os.tmpdir(), "does-not-exist.json")), policyError("Could not read DB query catalog"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL with `Cannot find module '@utils/dbQueryPolicy'`.

- [ ] **Step 3: Write `src/utils/dbQueryPolicy.js`**

```js
/**
 * Catalog policy for DB queries. Only the SQL written in src/config/dbQueries.json can run, and
 * every parameter is bound, so validating the catalog once at load covers every runtime call.
 * Pure: reads the catalog file, never touches the database.
 */
const fs = require("fs");
const path = require("path");
const { DbQueryError } = require("./dbQueryError");
const { SUPPORTED_TYPES, TEXT_TYPES, coerceParam } = require("./dbValues");

const DEFAULT_CATALOG_PATH = path.join(__dirname, "..", "config", "dbQueries.json");

// INTO catches SELECT ... INTO, which creates a table while looking like a read. Matching the
// keywords anywhere (not only first) also catches CTE-prefixed writes. A false positive fails
// loudly at validation ("needs maxRows"); a false negative would skip the blast-radius guard.
const WRITE_KEYWORDS = /\b(UPDATE|INSERT|DELETE|MERGE|INTO)\b/i;
// (?<!@) skips system functions such as @@ROWCOUNT.
const PARAM_REFERENCE = /(?<!@)@(\w+)/g;
const PLACEHOLDER = /\{(\w+)\}/;

const BUILT_IN_RULES = [
  {
    name: "single statement",
    violates: (text) => text.replace(/;\s*$/, "").includes(";") || /(^|\s)GO(\s|$)/i.test(text),
  },
  { name: "no SQL comments", violates: (text) => /--|\/\*|\*\//.test(text) },
  { name: "no EXEC", violates: (text) => /\b(EXEC|EXECUTE|sp_executesql)\b/i.test(text) },
  {
    name: "UPDATE/DELETE need WHERE",
    violates: (text) => /\b(UPDATE|DELETE)\b/i.test(text) && !/\bWHERE\b/i.test(text),
  },
];

const catalogCache = new Map();

function policyError(message, details) {
  return new DbQueryError("POLICY", message, details);
}

function isWriteSql(sqlText) {
  return WRITE_KEYWORDS.test(sqlText);
}

function isWriteQuery(query) {
  return isWriteSql(query.sql);
}

function paramReferences(text) {
  return new Set([...text.matchAll(PARAM_REFERENCE)].map((match) => match[1]));
}

function validateStatements(query, forbiddenRegexes) {
  const problems = [];
  const statements = [["sql", query.sql]];
  if (query.snapshot !== undefined) {
    if (typeof query.snapshot !== "string" || !query.snapshot.trim()) {
      problems.push('"snapshot" must be a read-only SELECT');
    } else {
      statements.push(["snapshot", query.snapshot]);
      if (!/^\s*SELECT\b/i.test(query.snapshot) || WRITE_KEYWORDS.test(query.snapshot)) {
        problems.push('"snapshot" must be a read-only SELECT');
      }
    }
  }

  for (const [field, text] of statements) {
    for (const regex of forbiddenRegexes) {
      if (regex.test(text)) problems.push(`${field} matches forbidden pattern ${regex}`);
    }
    for (const rule of BUILT_IN_RULES) {
      if (rule.violates(text)) problems.push(`${field} breaks built-in rule "${rule.name}"`);
    }
    for (const reference of paramReferences(text)) {
      if (!Object.hasOwn(query.params, reference)) {
        problems.push(`${field} uses @${reference}, which is not declared in "params"`);
      }
    }
  }
  return problems;
}

function validateParams(query) {
  const problems = [];
  const used = paramReferences(query.sql);
  for (const [param, definition] of Object.entries(query.params)) {
    if (!used.has(param)) problems.push(`param "${param}" is declared but not used in "sql"`);
    if (!definition || !SUPPORTED_TYPES.includes(definition.type)) {
      problems.push(
        `param "${param}" has unsupported type ${JSON.stringify(definition?.type)}; supported: ${SUPPORTED_TYPES.join(", ")}`
      );
    }
    if (definition && definition.default !== undefined && typeof definition.default !== "string") {
      problems.push(`param "${param}" default must be a string`);
    }
  }
  return problems;
}

function validateRestoreStrategy(query, queries) {
  const problems = [];
  const hasSnapshot = query.snapshot !== undefined;
  const hasRestore = query.restore !== undefined;
  const hasNoRestore = query.noRestore !== undefined;

  if (!isWriteQuery(query)) {
    if (query.restoreOnly) problems.push('"restoreOnly" queries must be writes');
    if (hasSnapshot || hasRestore || hasNoRestore) {
      problems.push('read queries must not declare "snapshot", "restore" or "noRestore"');
    }
    return problems;
  }

  if (!Number.isInteger(query.maxRows) || query.maxRows < 1) {
    problems.push('write queries must declare "maxRows" as a positive integer');
  }

  if (query.restoreOnly === true) {
    if (hasSnapshot || hasRestore || hasNoRestore) {
      problems.push('"restoreOnly" queries must not declare "snapshot", "restore" or "noRestore"');
    }
    return problems;
  }

  if (hasNoRestore && !(typeof query.noRestore === "string" && query.noRestore.trim())) {
    problems.push('"noRestore" must be a non-empty reason');
  }
  if (hasNoRestore && (hasSnapshot || hasRestore)) {
    problems.push('"noRestore" is mutually exclusive with "snapshot"/"restore"');
  } else if (!hasNoRestore && !(hasSnapshot && hasRestore)) {
    problems.push('write queries must declare both "snapshot" and "restore", or a "noRestore" reason');
  }

  if (hasRestore) {
    const target = Object.hasOwn(queries, query.restore) ? queries[query.restore] : undefined;
    if (!target) problems.push(`"restore" references unknown query "${query.restore}"`);
    else if (target.restoreOnly !== true) {
      problems.push(`"restore" target "${query.restore}" must be marked "restoreOnly": true`);
    }
  }
  return problems;
}

function validateQuery(query, queries, forbiddenRegexes) {
  if (!query || typeof query !== "object" || Array.isArray(query)) return ["entry must be an object"];
  const problems = [];
  if (typeof query.description !== "string" || !query.description.trim()) problems.push('"description" is required');
  if (typeof query.sql !== "string" || !query.sql.trim()) return [...problems, '"sql" is required'];
  if (!query.params || typeof query.params !== "object" || Array.isArray(query.params)) {
    return [...problems, '"params" must be an object (use {} for none)'];
  }
  return [
    ...problems,
    ...validateStatements(query, forbiddenRegexes),
    ...validateParams(query),
    ...validateRestoreStrategy(query, queries),
  ];
}

function validateCatalog(catalog) {
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    throw policyError("DB query catalog must be a JSON object");
  }
  const problems = [];

  const forbidden = catalog.forbidden ?? [];
  const forbiddenRegexes = [];
  if (!Array.isArray(forbidden)) problems.push('"forbidden" must be an array of regex strings');
  for (const pattern of Array.isArray(forbidden) ? forbidden : []) {
    try {
      forbiddenRegexes.push(new RegExp(pattern, "i"));
    } catch (error) {
      problems.push(`forbidden pattern ${JSON.stringify(pattern)} is not a valid regex: ${error.message}`);
    }
  }

  const queries = catalog.queries;
  if (!queries || typeof queries !== "object" || Array.isArray(queries) || !Object.keys(queries).length) {
    problems.push('"queries" must be a non-empty object');
  } else {
    for (const [name, query] of Object.entries(queries)) {
      for (const problem of validateQuery(query, queries, forbiddenRegexes)) problems.push(`query "${name}": ${problem}`);
    }
  }

  if (problems.length) {
    throw policyError(`Invalid DB query catalog:\n  - ${problems.join("\n  - ")}`, { problems });
  }
  return catalog;
}

function loadCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  if (catalogCache.has(catalogPath)) return catalogCache.get(catalogPath);
  let parsed;
  try {
    // Windows editors save JSON with a BOM, which JSON.parse rejects.
    parsed = JSON.parse(fs.readFileSync(catalogPath, "utf8").replace(/^﻿/, ""));
  } catch (error) {
    throw policyError(`Could not read DB query catalog ${catalogPath}: ${error.message}`, { cause: error });
  }
  const catalog = validateCatalog(parsed);
  catalogCache.set(catalogPath, catalog);
  return catalog;
}

function editDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

function closestNames(name, candidates) {
  const wanted = name.toLowerCase();
  return candidates
    .map((candidate) => ({ candidate, distance: editDistance(wanted, candidate.toLowerCase()) }))
    .filter(({ candidate, distance }) => distance <= Math.max(3, Math.floor(wanted.length / 3)) || candidate.toLowerCase().includes(wanted))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

function resolveQuery(catalog, name, { allowRestoreOnly = false } = {}) {
  const queries = catalog.queries;
  if (!Object.hasOwn(queries, name)) {
    const runnable = Object.keys(queries).filter((candidate) => queries[candidate].restoreOnly !== true);
    const suggestions = closestNames(String(name), runnable);
    throw policyError(
      `Unknown DB query "${name}".${suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : ""} ` +
        "Only queries in src/config/dbQueries.json can run."
    );
  }
  const query = queries[name];
  if (query.restoreOnly === true && !allowRestoreOnly) {
    throw policyError(`DB query "${name}" is a restore query: only the restore hook may run it`);
  }
  return query;
}

// Same rules as the payload steps: {tripNumber} is the scenario's trip id, any other {key} is a
// primitive world value. Anything else stays literal so the caller can report it.
function resolvePlaceholders(text, world = {}) {
  if (typeof text !== "string" || !text.includes("{")) return text;
  const tripId = world.tripId || world.currentTripId || world.createdTripId || null;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (key === "tripNumber") return tripId !== null && tripId !== undefined ? String(tripId) : match;
    const value = world[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : match;
  });
}

function findUnresolvedPlaceholder(text) {
  if (typeof text !== "string") return null;
  const match = PLACEHOLDER.exec(text);
  return match ? match[1] : null;
}

function buildParams(queryName, query, overrides = {}, world = {}, { fromSnapshot = false, now = new Date() } = {}) {
  const declared = Object.keys(query.params);
  const unknown = Object.keys(overrides).filter((key) => !Object.hasOwn(query.params, key));
  if (unknown.length) {
    throw policyError(
      `DB query "${queryName}" has no param(s) ${unknown.join(", ")}. Declared: ${declared.join(", ") || "(none)"}`
    );
  }

  const params = {};
  for (const [param, definition] of Object.entries(query.params)) {
    let raw = Object.hasOwn(overrides, param) ? overrides[param] : fromSnapshot ? undefined : definition.default;
    if (raw === undefined) {
      throw policyError(
        `DB query "${queryName}" param "${param}" has no value: ` +
          (fromSnapshot ? "the snapshot row does not carry it" : "give it in the step table")
      );
    }

    if (!fromSnapshot) {
      raw = resolvePlaceholders(raw, world);
      const unresolved = findUnresolvedPlaceholder(raw);
      if (unresolved) {
        throw policyError(
          `DB query "${queryName}" param "${param}" references {${unresolved}}, which has no value in this scenario` +
            (unresolved === "tripNumber"
              ? " (no trip id recorded yet: open or create a trip first, or pass tripId in the step table)"
              : "")
        );
      }
      if (raw === "" && (definition.required || !TEXT_TYPES.includes(definition.type))) {
        throw policyError(`DB query "${queryName}" param "${param}" is empty`);
      }
    }

    params[param] = coerceParam(param, definition.type, raw, now);
  }
  return params;
}

function checkSnapshotColumns(queryName, snapshotRows, restoreName, restoreQuery) {
  const actual = Object.keys(snapshotRows[0]).sort();
  const expected = Object.keys(restoreQuery.params).sort();
  if (actual.join(",") !== expected.join(",")) {
    throw policyError(
      `DB query "${queryName}" snapshot returns columns [${actual.join(", ")}] but restore query "${restoreName}" ` +
        `expects exactly [${expected.join(", ")}]: alias the snapshot columns to the restore params`
    );
  }
}

module.exports = {
  DEFAULT_CATALOG_PATH,
  validateCatalog,
  loadCatalog,
  isWriteSql,
  isWriteQuery,
  resolveQuery,
  resolvePlaceholders,
  findUnresolvedPlaceholder,
  buildParams,
  checkSnapshotColumns,
};
```

- [ ] **Step 4: Write `src/config/dbQueries.json`**

The spec §5 catalog, plus `dbPing` (the read-only query the smoke scenario and docs use). Save **without** a BOM.

```json
{
  "forbidden": ["\\bDROP\\b", "\\bTRUNCATE\\b", "\\bALTER\\b", "\\bGRANT\\b", "\\bREVOKE\\b"],
  "queries": {
    "dbPing": {
      "description": "Connectivity check: returns a single row with ok = 1",
      "sql": "SELECT 1 AS ok",
      "params": {}
    },

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

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS (dbValues + dbQueryPolicy suites).

- [ ] **Step 6: Commit**

```bash
git add src/utils/dbQueryPolicy.js src/config/dbQueries.json tests/unit/dbQueryPolicy.test.js
git commit -m "feat(db): add query catalog and catalog policy"
```

---

### Task 3: Config, credential and connection client

**Files:**
- Modify: `src/config/config.js` (add `db` block after the `payloadValidation` block)
- Modify: `.env.example` (DB section before the `# Known Booking Errors (Optional)` section)
- Create: `src/utils/dbCredential.js`
- Create: `src/utils/dbClient.js`
- Test: `tests/unit/dbCredential.test.js`, `tests/unit/dbClient.test.js`

**Interfaces:**
- Consumes (Task 1): `DbQueryError`.
- Produces:
  - `config.db` getters: `enabled: boolean`, `serverName`, `databaseName`, `authentication`, `userName`, `tenantId`, `clientId`, `clientSecret: string`, `timeoutMs: number`
  - `dbCredential`: `DB_TOKEN_SCOPE`, `AUTH_MODES`, `requireDbSettings(db = config.db): string` (returns mode), `createCredential(db = config.db): TokenCredential`, `getDbAccessToken(credential, mode): Promise<{ token, expiresOnTimestamp }>`
  - `dbClient`: `toSqlType(type)`, `sqlTypeDeclaration(type): string`, `execute(sqlText, params, paramDefs, { transaction, queryName } = {}): Promise<{ rows: object[], rowsAffected: number }>`, `withTransaction(work: (transaction) => Promise<T>): Promise<T>`, `close(): Promise<void>`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/dbCredential.test.js`:

```js
require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { ClientSecretCredential, AzureCliCredential, InteractiveBrowserCredential } = require("@azure/identity");
const { DbQueryError } = require("@utils/dbQueryError");
const config = require("@config/config");
const credential = require("@utils/dbCredential");

const TENANT = "00000000-0000-0000-0000-000000000000";
const BASE = { serverName: "srv.database.windows.net", databaseName: "app" };

function errorWith(code, fragment) {
  return (error) => error instanceof DbQueryError && error.code === code && error.message.includes(fragment);
}

test("config.db defaults: enabled, 30s timeout, empty strings", () => {
  const saved = { ...process.env };
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith("DB_")) delete process.env[key];
    assert.equal(config.db.enabled, true);
    assert.equal(config.db.timeoutMs, 30000);
    assert.equal(config.db.serverName, "");
    process.env.DB_QUERIES_ENABLED = "false";
    assert.equal(config.db.enabled, false);
  } finally {
    process.env = saved;
  }
});

test("requireDbSettings names the mode and every missing variable", () => {
  assert.throws(
    () => credential.requireDbSettings({ ...BASE, authentication: "service-principal", tenantId: TENANT, clientId: "c", clientSecret: "" }),
    errorWith("CONFIG", "DB_AUTHENTICATION=service-principal requires DB_CLIENT_SECRET")
  );
  assert.throws(
    () => credential.requireDbSettings({ authentication: "azure-cli" }),
    errorWith("CONFIG", "DB_AUTHENTICATION=azure-cli requires DB_SERVER_NAME, DB_DATABASE_NAME")
  );
  assert.throws(() => credential.requireDbSettings({ ...BASE, authentication: "entra-mfa" }), errorWith("CONFIG", "requires DB_USER_NAME"));
  assert.throws(
    () => credential.requireDbSettings({ ...BASE, authentication: "password" }),
    errorWith("CONFIG", "DB_AUTHENTICATION must be one of entra-mfa, service-principal, azure-cli")
  );
  assert.equal(credential.requireDbSettings({ ...BASE, authentication: "azure-cli" }), "azure-cli");
});

test("createCredential maps each mode to its @azure/identity credential", () => {
  assert.ok(credential.createCredential({ ...BASE, authentication: "azure-cli" }) instanceof AzureCliCredential);
  assert.ok(
    credential.createCredential({ ...BASE, authentication: "service-principal", tenantId: TENANT, clientId: "c", clientSecret: "s" }) instanceof
      ClientSecretCredential
  );
  assert.ok(credential.createCredential({ ...BASE, authentication: "entra-mfa", userName: "me@corp.com" }) instanceof InteractiveBrowserCredential);
});

test("getDbAccessToken wraps credential failures as AUTH with a hint", async () => {
  const failing = { getToken: async () => { throw new Error("not logged in"); } };
  await assert.rejects(credential.getDbAccessToken(failing, "azure-cli"), errorWith("AUTH", "run `az login`"));
  const empty = { getToken: async () => null };
  await assert.rejects(credential.getDbAccessToken(empty, "azure-cli"), errorWith("AUTH", "returned no token"));
  const ok = { getToken: async (scope) => ({ token: scope, expiresOnTimestamp: 1 }) };
  assert.equal((await credential.getDbAccessToken(ok, "azure-cli")).token, "https://database.windows.net/.default");
});
```

Create `tests/unit/dbClient.test.js`:

```js
require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { DbQueryError } = require("@utils/dbQueryError");
const dbClient = require("@utils/dbClient");

test("Decimal binds with scale so fractional originals restore exactly", () => {
  const decimal = dbClient.toSqlType("Decimal");
  assert.equal(decimal.precision, 38);
  assert.equal(decimal.scale, 10);
  assert.equal(dbClient.sqlTypeDeclaration("Decimal"), "decimal(38,10)");
});

test("every supported type has a driver type and a SQL declaration", () => {
  for (const type of ["Int", "BigInt", "NVarChar", "VarChar", "Bit", "DateTime2", "Decimal", "UniqueIdentifier"]) {
    assert.ok(dbClient.toSqlType(type), type);
    assert.match(dbClient.sqlTypeDeclaration(type), /^[a-z0-9(),]+$/, type);
  }
  assert.throws(() => dbClient.toSqlType("Money"), (error) => error instanceof DbQueryError && error.code === "POLICY");
});

test("close() without a pool is a no-op", async () => {
  await dbClient.close();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — `config.db` is undefined / `Cannot find module '@utils/dbCredential'`.

- [ ] **Step 3: Add the `db` block to `src/config/config.js`**

Insert after the closing `},` of `payloadValidation` (before the final `};`):

```js
  // Azure SQL access for the DB query steps (tests/steps/db_queries.steps.js). Everything except
  // `enabled` is optional here and only required on the first DB operation, so a run with no DB
  // settings still passes every scenario that does not use DB steps. See docs/DbQueries.md.
  db: {
    get enabled() {
      return getOptionalBooleanEnv("DB_QUERIES_ENABLED", true);
    },
    get serverName() {
      return getOptionalEnv("DB_SERVER_NAME", "");
    },
    get databaseName() {
      return getOptionalEnv("DB_DATABASE_NAME", "");
    },
    // entra-mfa | service-principal | azure-cli
    get authentication() {
      return getOptionalEnv("DB_AUTHENTICATION", "");
    },
    // entra-mfa: login hint (UPN)
    get userName() {
      return getOptionalEnv("DB_USER_NAME", "");
    },
    get tenantId() {
      return getOptionalEnv("DB_TENANT_ID", "");
    },
    get clientId() {
      return getOptionalEnv("DB_CLIENT_ID", "");
    },
    get clientSecret() {
      return getOptionalEnv("DB_CLIENT_SECRET", "");
    },
    get timeoutMs() {
      return Number(getOptionalEnv("DB_TIMEOUT_MS", "30000"));
    },
  },
```

- [ ] **Step 4: Add the DB section to `.env.example`**

Insert immediately before the `########################################` line that precedes `# Known Booking Errors (Optional)`:

```
########################################
# DB Queries (Azure SQL) — see docs/DbQueries.md
########################################
# Enable/disable DB query steps globally.
# Accepted values: true/false, 1/0, yes/no, on/off (default: true)
DB_QUERIES_ENABLED=true

# Azure SQL server host and database, e.g. myserver.database.windows.net
DB_SERVER_NAME=
DB_DATABASE_NAME=

# entra-mfa (local, interactive sign-in) | service-principal (CI) | azure-cli (az login / azure/login OIDC)
DB_AUTHENTICATION=

# entra-mfa: your UPN, used as the sign-in hint
DB_USER_NAME=

# service-principal: app registration credentials (DB_TENANT_ID is optional for entra-mfa)
DB_TENANT_ID=
DB_CLIENT_ID=
DB_CLIENT_SECRET=

# Request and connection timeout in milliseconds (default: 30000)
DB_TIMEOUT_MS=

```

- [ ] **Step 5: Write `src/utils/dbCredential.js`**

```js
require("module-alias/register");
const { InteractiveBrowserCredential, ClientSecretCredential, AzureCliCredential } = require("@azure/identity");
const config = require("@config/config");
const { DbQueryError } = require("@utils/dbQueryError");

const DB_TOKEN_SCOPE = "https://database.windows.net/.default";
const AUTH_MODES = ["entra-mfa", "service-principal", "azure-cli"];

const CONNECTION_SETTINGS = [
  ["DB_SERVER_NAME", "serverName"],
  ["DB_DATABASE_NAME", "databaseName"],
];
const MODE_SETTINGS = {
  "entra-mfa": [["DB_USER_NAME", "userName"]],
  "service-principal": [
    ["DB_TENANT_ID", "tenantId"],
    ["DB_CLIENT_ID", "clientId"],
    ["DB_CLIENT_SECRET", "clientSecret"],
  ],
  "azure-cli": [],
};
const AUTH_HINTS = {
  "entra-mfa": "Complete the browser sign-in for DB_USER_NAME, and check the account has access to the database.",
  "service-principal": "Check DB_TENANT_ID / DB_CLIENT_ID / DB_CLIENT_SECRET and that the secret has not expired.",
  "azure-cli": "run `az login` (or the azure/login action on CI) before the tests.",
};

function requireDbSettings(db = config.db) {
  const mode = db.authentication;
  if (!AUTH_MODES.includes(mode)) {
    throw new DbQueryError("CONFIG", `DB_AUTHENTICATION must be one of ${AUTH_MODES.join(", ")}, got "${mode ?? ""}"`);
  }
  const missing = [...CONNECTION_SETTINGS, ...MODE_SETTINGS[mode]].filter(([, key]) => !db[key]).map(([envName]) => envName);
  if (missing.length) {
    throw new DbQueryError("CONFIG", `DB_AUTHENTICATION=${mode} requires ${missing.join(", ")}`);
  }
  return mode;
}

function createCredential(db = config.db) {
  const mode = requireDbSettings(db);
  switch (mode) {
    case "entra-mfa":
      return new InteractiveBrowserCredential({ loginHint: db.userName, ...(db.tenantId && { tenantId: db.tenantId }) });
    case "service-principal":
      return new ClientSecretCredential(db.tenantId, db.clientId, db.clientSecret);
    case "azure-cli":
      return new AzureCliCredential();
    default:
      throw new DbQueryError("CONFIG", `Unhandled DB_AUTHENTICATION "${mode}"`);
  }
}

async function getDbAccessToken(credential, mode) {
  let token;
  try {
    token = await credential.getToken(DB_TOKEN_SCOPE);
  } catch (error) {
    throw new DbQueryError("AUTH", `Could not get a DB access token with DB_AUTHENTICATION=${mode}: ${error.message}. ${AUTH_HINTS[mode]}`, {
      cause: error,
    });
  }
  if (!token || !token.token) {
    throw new DbQueryError("AUTH", `DB_AUTHENTICATION=${mode} credential returned no token. ${AUTH_HINTS[mode]}`);
  }
  return token;
}

module.exports = { DB_TOKEN_SCOPE, AUTH_MODES, requireDbSettings, createCredential, getDbAccessToken };
```

- [ ] **Step 6: Write `src/utils/dbClient.js`**

```js
require("module-alias/register");
const sql = require("mssql");
const config = require("@config/config");
const { DbQueryError } = require("@utils/dbQueryError");
const { createCredential, getDbAccessToken, requireDbSettings } = require("@utils/dbCredential");
const logger = require("@utils/logger").child("DbQueries");

// A pool authenticates each new connection with the token it was built with, so a pool whose
// token is about to expire is replaced before it is handed out again.
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

let state = null; // { pool, credential, mode, expiresOnTimestamp } — one per worker process
let connecting = null;

function toSqlType(type) {
  switch (type) {
    case "Int":
      return sql.Int;
    case "BigInt":
      return sql.BigInt;
    case "Bit":
      return sql.Bit;
    case "NVarChar":
      return sql.NVarChar(sql.MAX);
    case "VarChar":
      return sql.VarChar(sql.MAX);
    case "DateTime2":
      return sql.DateTime2(7);
    // Bare sql.Decimal is decimal(18,0): it would round a restored 123.45 to 123.
    case "Decimal":
      return sql.Decimal(38, 10);
    case "UniqueIdentifier":
      return sql.UniqueIdentifier;
    default:
      throw new DbQueryError("POLICY", `Unsupported DB param type "${type}"`);
  }
}

const SQL_TYPE_DECLARATIONS = {
  Int: "int",
  BigInt: "bigint",
  Bit: "bit",
  NVarChar: "nvarchar(max)",
  VarChar: "varchar(max)",
  DateTime2: "datetime2(7)",
  Decimal: "decimal(38,10)",
  UniqueIdentifier: "uniqueidentifier",
};

// T-SQL spelling of the same binding, for sp_describe_first_result_set in scripts/check-db.js.
function sqlTypeDeclaration(type) {
  if (!Object.hasOwn(SQL_TYPE_DECLARATIONS, type)) throw new DbQueryError("POLICY", `Unsupported DB param type "${type}"`);
  return SQL_TYPE_DECLARATIONS[type];
}

function wrapDriverError(error, queryName) {
  if (error instanceof DbQueryError) return error;
  const code = error && error.code === "ETIMEOUT" ? "TIMEOUT" : "QUERY";
  return new DbQueryError(code, `DB query "${queryName ?? "(unnamed)"}" failed: ${error.message}`, { cause: error });
}

async function connect() {
  const db = config.db;
  const mode = requireDbSettings(db);
  // Reusing the credential keeps its in-memory token cache: entra-mfa does not prompt again.
  const credential = state?.credential ?? createCredential(db);
  const token = await getDbAccessToken(credential, mode);

  const pool = new sql.ConnectionPool({
    server: db.serverName,
    database: db.databaseName,
    authentication: { type: "azure-active-directory-access-token", options: { token: token.token } },
    options: { encrypt: true, trustServerCertificate: false },
    requestTimeout: db.timeoutMs,
    connectionTimeout: db.timeoutMs,
  });
  try {
    await pool.connect();
  } catch (error) {
    throw new DbQueryError("QUERY", `Could not connect to ${db.serverName}/${db.databaseName}: ${error.message}`, { cause: error });
  }

  const previous = state?.pool;
  state = { pool, credential, mode, expiresOnTimestamp: token.expiresOnTimestamp };
  if (previous) {
    previous.close().catch((error) => logger.warn("Failed to close the DB pool with the expiring token", { error: error.message }));
  }
  logger.info("DB pool connected", { server: db.serverName, database: db.databaseName, authentication: mode });
  return pool;
}

async function getPool() {
  if (state && state.expiresOnTimestamp - Date.now() > TOKEN_REFRESH_MARGIN_MS) return state.pool;
  if (!connecting) {
    connecting = connect().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

function bindInputs(request, params, paramDefs) {
  for (const [name, value] of Object.entries(params)) {
    request.input(name, toSqlType(paramDefs[name].type), value);
  }
}

async function execute(sqlText, params, paramDefs, { transaction, queryName } = {}) {
  const request = transaction ? new sql.Request(transaction) : (await getPool()).request();
  bindInputs(request, params, paramDefs);
  try {
    const result = await request.query(sqlText);
    const counts = result.rowsAffected || [];
    // A trigger reports its own counts before the statement's; the statement's count is last.
    // runQuery cross-checks it against the snapshot row count, so a wrong pick fails, never passes.
    return { rows: result.recordset || [], rowsAffected: counts.length ? counts[counts.length - 1] : 0 };
  } catch (error) {
    throw wrapDriverError(error, queryName);
  }
}

// REPEATABLE READ keeps the rows a snapshot read locked until commit, so no parallel worker can
// change them between the snapshot and the write that the restore will undo.
async function withTransaction(work) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.REPEATABLE_READ);
  } catch (error) {
    throw wrapDriverError(error, "begin transaction");
  }
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      logger.error("DB rollback failed", { error: rollbackError.message });
    }
    throw wrapDriverError(error, "transaction");
  }
}

async function close() {
  const pool = state?.pool;
  state = null;
  if (pool) await pool.close();
}

module.exports = { toSqlType, sqlTypeDeclaration, execute, withTransaction, close };
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS (all four suites).

- [ ] **Step 8: Commit**

```bash
git add src/config/config.js .env.example src/utils/dbCredential.js src/utils/dbClient.js tests/unit/dbCredential.test.js tests/unit/dbClient.test.js
git commit -m "feat(db): add DB config, Entra credential and mssql client"
```

---

### Task 4: `DbQueries` DSL

**Files:**
- Create: `src/dsl/DbQueries.js`
- Modify: `src/dsl/index.js` (add `DbQueries: require("./DbQueries"),` after the `DbRail` line)
- Test: `tests/unit/DbQueries.test.js`

**Interfaces:**
- Consumes: Task 1 (`normalizeValue`, `compare`, `containsRows`, `formatRowsTable`, `DbQueryError`), Task 2 (`loadCatalog`, `validateCatalog`, `resolveQuery`, `isWriteQuery`, `buildParams`, `checkSnapshotColumns`, `resolvePlaceholders`, `findUnresolvedPlaceholder`), Task 3 (`dbClient.execute`, `dbClient.withTransaction`).
- Produces (all on the exported `DbQueries` object; `world` is the Cucumber World):
  - `runQuery(world, name, overrides = {}): Promise<{ query, params, rows, rowsAffected }>` — also sets `world.dbLastResult` and appends to `world.dbRestores`
  - `runPendingRestores(world): Promise<{ restored: number }>` — throws `DbQueryError("RESTORE")` with `.failures: { query, params, error }[]`
  - `overridesFromTable(rawRows: string[][]): Record<string,string>`
  - `expectRowCount(world, expected: number, { atLeast = false } = {})`
  - `expectColumn(world, { row = 1, column, op, expected })`
  - `expectEveryRow(world, { column, op, expected })`, `expectAnyRow(world, { column, op, expected })`
  - `expectColumnState(world, { row = 1, column, state })` — state `be empty` | `not be empty`
  - `expectContainsRows(world, expectedRows: Record<string,string>[])`
  - `waitForColumn(world, { name, column, expected, seconds, overrides = {}, intervalMs = 3000 }): Promise<result>`
  - `storeColumn(world, { row = 1, column, worldKey }): string`
  - `MAX_POLL_SECONDS = 600`
  - `_useForTests({ client, catalog }): () => void` — returns a function restoring the real client/catalog

- [ ] **Step 1: Write the failing test**

Create `tests/unit/DbQueries.test.js`:

```js
require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { DbQueryError } = require("@utils/dbQueryError");
const DbQueries = require("@dsl/DbQueries");

const CATALOG = {
  forbidden: [],
  queries: {
    readStatus: {
      description: "read",
      sql: "SELECT Status AS status FROM Quotes WHERE TripId = @tripId",
      params: { tripId: { type: "Int", default: "{tripNumber}" } },
    },
    expire: {
      description: "write with restore",
      sql: "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE TripId = @tripId",
      params: { tripId: { type: "Int", default: "{tripNumber}" }, minutes: { type: "Int", default: "2" } },
      snapshot: "SELECT Id AS id, Expires AS expires FROM Quotes WHERE TripId = @tripId",
      restore: "restoreExpire",
      maxRows: 2,
    },
    restoreExpire: {
      description: "restore",
      restoreOnly: true,
      sql: "UPDATE Quotes SET Expires = @expires WHERE Id = @id",
      params: { id: { type: "Int", required: true }, expires: { type: "DateTime2", required: true } },
      maxRows: 1,
    },
    purge: {
      description: "write without restore",
      sql: "DELETE FROM Logs WHERE TripId = @tripId",
      params: { tripId: { type: "Int", default: "{tripNumber}" } },
      noRestore: "log rows are disposable",
      maxRows: 5,
    },
  },
};
const Q = CATALOG.queries;
const ORIGINAL_1 = new Date("2026-01-01T00:00:00Z");

function fakeClient(respond) {
  const calls = [];
  return {
    calls,
    async execute(sqlText, params, paramDefs, options = {}) {
      calls.push({ type: "execute", sqlText, params, inTransaction: Boolean(options.transaction) });
      return respond(sqlText, params, calls);
    },
    async withTransaction(work) {
      calls.push({ type: "begin" });
      try {
        const result = await work({ fake: "transaction" });
        calls.push({ type: "commit" });
        return result;
      } catch (error) {
        calls.push({ type: "rollback" });
        throw error;
      }
    },
    async close() {},
  };
}

// Each test that talks to the "DB" installs its own fake, replacing the previous test's. The real
// client is never needed in this process, so nothing is reset between tests.
function withFake(respond) {
  const client = fakeClient(respond);
  DbQueries._useForTests({ client, catalog: CATALOG });
  return client;
}

function errorWith(code, fragment) {
  return (error) => error instanceof DbQueryError && error.code === code && error.message.includes(fragment);
}

function worldWithResult(rows) {
  return { dbLastResult: { query: "readStatus", params: { tripId: 1 }, rows, rowsAffected: rows.length } };
}

test("a read runs outside a transaction and registers no restore", async () => {
  const client = withFake(() => ({ rows: [{ status: "OK" }], rowsAffected: 1 }));
  const world = { tripId: "42" };
  const result = await DbQueries.runQuery(world, "readStatus");
  assert.deepEqual(result, { query: "readStatus", params: { tripId: 42 }, rows: [{ status: "OK" }], rowsAffected: 1 });
  assert.equal(world.dbLastResult, result);
  assert.equal(world.dbRestores, undefined);
  assert.deepEqual(client.calls.map((call) => call.type), ["execute"]);
  assert.equal(client.calls[0].inTransaction, false);
});

test("a write snapshots and writes in one transaction, then registers one restore per row", async () => {
  const snapshotRows = [{ id: 1, expires: ORIGINAL_1 }, { id: 2, expires: null }];
  const client = withFake((sqlText) => (sqlText === Q.expire.snapshot ? { rows: snapshotRows, rowsAffected: 2 } : { rows: [], rowsAffected: 2 }));
  const world = { tripId: "42" };
  await DbQueries.runQuery(world, "expire", { minutes: "5" });
  assert.deepEqual(client.calls.map((call) => call.type), ["begin", "execute", "execute", "commit"]);
  assert.ok(client.calls.filter((call) => call.type === "execute").every((call) => call.inTransaction));
  assert.deepEqual(client.calls[2].params, { tripId: 42, minutes: 5 });
  assert.deepEqual(world.dbRestores, [
    { query: "restoreExpire", params: { id: 1, expires: ORIGINAL_1 } },
    { query: "restoreExpire", params: { id: 2, expires: null } },
  ]);
});

test("a snapshot with no rows rolls back before writing", async () => {
  const client = withFake(() => ({ rows: [], rowsAffected: 0 }));
  const world = { tripId: "42" };
  await assert.rejects(DbQueries.runQuery(world, "expire"), errorWith("ROW_LIMIT", "snapshot matched 0 rows"));
  assert.deepEqual(client.calls.map((call) => call.type), ["begin", "execute", "rollback"]);
  assert.equal(world.dbRestores, undefined);
});

test("a snapshot above maxRows rolls back before writing", async () => {
  const rows = [1, 2, 3].map((id) => ({ id, expires: ORIGINAL_1 }));
  const client = withFake(() => ({ rows, rowsAffected: 3 }));
  await assert.rejects(DbQueries.runQuery({ tripId: "42" }, "expire"), errorWith("ROW_LIMIT", "maxRows 2"));
  assert.deepEqual(client.calls.map((call) => call.type), ["begin", "execute", "rollback"]);
});

test("a write whose rowsAffected differs from the snapshot rolls back and registers nothing", async () => {
  const client = withFake((sqlText) =>
    sqlText === Q.expire.snapshot ? { rows: [{ id: 1, expires: ORIGINAL_1 }], rowsAffected: 1 } : { rows: [], rowsAffected: 2 }
  );
  const world = { tripId: "42" };
  await assert.rejects(DbQueries.runQuery(world, "expire"), errorWith("ROW_LIMIT", "snapshot had 1"));
  assert.equal(client.calls.at(-1).type, "rollback");
  assert.equal(world.dbRestores, undefined);
});

test("snapshot columns that do not match the restore params roll back", async () => {
  withFake(() => ({ rows: [{ Id: 1, expires: ORIGINAL_1 }], rowsAffected: 1 }));
  await assert.rejects(DbQueries.runQuery({ tripId: "42" }, "expire"), errorWith("POLICY", "alias the snapshot columns"));
});

test("a noRestore write above maxRows rolls back", async () => {
  const client = withFake(() => ({ rows: [], rowsAffected: 6 }));
  await assert.rejects(DbQueries.runQuery({ tripId: "42" }, "purge"), errorWith("ROW_LIMIT", "affected 6 rows, maxRows 5"));
  assert.equal(client.calls.at(-1).type, "rollback");
});

test("restore-only queries cannot be run from a step", async () => {
  withFake(() => ({ rows: [], rowsAffected: 0 }));
  await assert.rejects(DbQueries.runQuery({}, "restoreExpire", { id: "1", expires: "now" }), errorWith("POLICY", "only the restore hook"));
});

test("runPendingRestores runs LIFO with snapshot values, NULL included", async () => {
  const client = withFake(() => ({ rows: [], rowsAffected: 1 }));
  const world = {
    dbRestores: [
      { query: "restoreExpire", params: { id: 1, expires: ORIGINAL_1 } },
      { query: "restoreExpire", params: { id: 2, expires: null } },
    ],
  };
  assert.deepEqual(await DbQueries.runPendingRestores(world), { restored: 2 });
  const writes = client.calls.filter((call) => call.type === "execute");
  assert.deepEqual(writes.map((call) => call.params), [{ id: 2, expires: null }, { id: 1, expires: ORIGINAL_1 }]);
  assert.deepEqual(world.dbRestores, []);
});

test("a failed restore does not stop the others and fails with every detail", async () => {
  const client = withFake((sqlText, params) => {
    if (params.id === 2) throw new Error("deadlock");
    return { rows: [], rowsAffected: 1 };
  });
  const world = {
    dbRestores: [
      { query: "restoreExpire", params: { id: 1, expires: ORIGINAL_1 } },
      { query: "restoreExpire", params: { id: 2, expires: ORIGINAL_1 } },
    ],
  };
  await assert.rejects(DbQueries.runPendingRestores(world), (error) => {
    assert.equal(error.code, "RESTORE");
    assert.equal(error.failures.length, 1);
    assert.equal(error.failures[0].params.id, 2);
    assert.match(error.failures[0].error, /deadlock/);
    return true;
  });
  assert.equal(client.calls.filter((call) => call.type === "execute").length, 2);
});

test("overridesFromTable drops a param|value header and rejects malformed rows", () => {
  assert.deepEqual(DbQueries.overridesFromTable([["param", "value"], ["minutes", "5"]]), { minutes: "5" });
  assert.deepEqual(DbQueries.overridesFromTable([["minutes", "5"]]), { minutes: "5" });
  assert.throws(() => DbQueries.overridesFromTable([["minutes", "5", "x"]]), errorWith("POLICY", "exactly 2 cells"));
  assert.throws(() => DbQueries.overridesFromTable([["minutes", "5"], ["minutes", "6"]]), errorWith("POLICY", "given twice"));
});

test("row count and column assertions", () => {
  const world = worldWithResult([{ status: "OK", total: 10 }, { status: "KO", total: 3 }]);
  DbQueries.expectRowCount(world, 2);
  DbQueries.expectRowCount(world, 1, { atLeast: true });
  assert.throws(() => DbQueries.expectRowCount(world, 3), /should have 3 row\(s\), but has 2/);
  DbQueries.expectColumn(world, { column: "status", op: "be", expected: "OK" });
  DbQueries.expectColumn(world, { row: 2, column: "total", op: "be less than", expected: "5" });
  assert.throws(() => DbQueries.expectColumn(world, { column: "status", op: "be", expected: "KO" }), /should be "KO", but was "OK"[\s\S]*\| status \| total \|/);
  assert.throws(() => DbQueries.expectColumn(world, { row: 3, column: "status", op: "be", expected: "OK" }), /has no row 3 \(rows are 1-based/);
  assert.throws(() => DbQueries.expectColumn(world, { column: "Status", op: "be", expected: "OK" }), /has no column "Status". Columns: status, total/);
});

test("assertions resolve placeholders and refuse unresolved ones", () => {
  const world = { ...worldWithResult([{ status: "OK" }]), expectedStatus: "OK" };
  DbQueries.expectColumn(world, { column: "status", op: "be", expected: "{expectedStatus}" });
  assert.throws(() => DbQueries.expectColumn(world, { column: "status", op: "be", expected: "{missing}" }), errorWith("POLICY", "{missing}"));
});

test("every fails on an empty result, any needs one matching row", () => {
  assert.throws(() => DbQueries.expectEveryRow(worldWithResult([]), { column: "status", op: "be", expected: "OK" }), /the result is empty/);
  const world = worldWithResult([{ status: "OK" }, { status: "KO" }]);
  assert.throws(() => DbQueries.expectEveryRow(world, { column: "status", op: "be", expected: "OK" }), /row 2 column "status" should be "OK", but was "KO"/);
  DbQueries.expectAnyRow(world, { column: "status", op: "be", expected: "KO" });
  assert.throws(() => DbQueries.expectAnyRow(world, { column: "status", op: "be", expected: "XX" }), /no DB result row has column "status"/);
});

test("empty / not empty and contain rows", () => {
  const world = worldWithResult([{ status: null, id: 1 }, { status: "OK", id: 2 }]);
  DbQueries.expectColumnState(world, { column: "status", state: "be empty" });
  DbQueries.expectColumnState(world, { row: 2, column: "status", state: "not be empty" });
  assert.throws(() => DbQueries.expectColumnState(world, { column: "status", state: "not be empty" }), /should not be empty/);
  DbQueries.expectContainsRows(world, [{ id: "2", status: "OK" }, { id: "1" }]);
  assert.throws(() => DbQueries.expectContainsRows(world, [{ id: "3" }]), /does not contain the expected rows/);
  assert.throws(() => DbQueries.expectContainsRows(world, [{ nope: "1" }]), /has no column "nope"/);
});

test("assertions need a prior query", () => {
  assert.throws(() => DbQueries.expectRowCount({}, 1), errorWith("POLICY", "No DB query has run in this scenario yet"));
});

test("storeColumn stores the normalized value and never clobbers world plumbing", () => {
  const world = { ...worldWithResult([{ id: 7, expires: ORIGINAL_1 }]), page: null, recordTripId() {} };
  assert.equal(DbQueries.storeColumn(world, { column: "expires", worldKey: "storedExpires" }), "2026-01-01T00:00:00.000Z");
  assert.equal(world.storedExpires, "2026-01-01T00:00:00.000Z");
  assert.throws(() => DbQueries.storeColumn(world, { column: "id", worldKey: "page" }), errorWith("POLICY", "world.page"));
  assert.throws(() => DbQueries.storeColumn(world, { column: "id", worldKey: "recordTripId" }), errorWith("POLICY", "world.recordTripId"));
  assert.throws(() => DbQueries.storeColumn(world, { column: "id", worldKey: "bad key" }), errorWith("POLICY", "letters, digits or _"));
});

test("waitForColumn polls a read query until the value appears", async () => {
  let reads = 0;
  withFake(() => ({ rows: [{ status: ++reads >= 3 ? "DONE" : "PENDING" }], rowsAffected: 1 }));
  const result = await DbQueries.waitForColumn({ tripId: "1" }, { name: "readStatus", column: "status", expected: "DONE", seconds: 5, intervalMs: 5 });
  assert.equal(result.rows[0].status, "DONE");
  assert.equal(reads, 3);
});

test("waitForColumn times out showing the last value, and refuses writes and long waits", async () => {
  withFake(() => ({ rows: [{ status: "PENDING" }], rowsAffected: 1 }));
  await assert.rejects(
    DbQueries.waitForColumn({ tripId: "1" }, { name: "readStatus", column: "status", expected: "DONE", seconds: 1, intervalMs: 200 }),
    /did not become "DONE" within 1s; last seen "PENDING"/
  );
  await assert.rejects(DbQueries.waitForColumn({ tripId: "1" }, { name: "expire", column: "x", expected: "y", seconds: 1 }), errorWith("POLICY", "only read queries can be polled"));
  await assert.rejects(DbQueries.waitForColumn({ tripId: "1" }, { name: "readStatus", column: "status", expected: "y", seconds: 601 }), errorWith("POLICY", "between 1 and 600"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL with `Cannot find module '@dsl/DbQueries'`.

- [ ] **Step 3: Write `src/dsl/DbQueries.js`**

```js
require("module-alias/register");
const { DbQueryError } = require("@utils/dbQueryError");
const policy = require("@utils/dbQueryPolicy");
const { normalizeValue, compare, containsRows, formatRowsTable } = require("@utils/dbValues");
const logger = require("@utils/logger").child("DbQueries");

const DEFAULT_POLL_INTERVAL_MS = 3000;
// The polling step's Cucumber timeout (tests/steps/db_queries.steps.js) is set above this.
const MAX_POLL_SECONDS = 600;
const UNARY_STATES = ["be empty", "not be empty"];
// World fields that start out null (so the object guard in storeColumn cannot see them) or that
// this feature owns. A stored DB value must never replace them.
const RESERVED_WORLD_KEYS = ["page", "context", "browser", "dbLastResult", "dbRestores", "tripIds", "scenarioTags"];

let client = require("@utils/dbClient");
let catalogOverride = null;

function getCatalog() {
  return catalogOverride ?? policy.loadCatalog();
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function loggableParams(params) {
  return Object.fromEntries(Object.entries(params || {}).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}

function assertionFailure(result, detail) {
  return new Error(
    [
      detail,
      `Query: ${result.query}`,
      `Params: ${JSON.stringify(loggableParams(result.params))}`,
      `Rows (${result.rows.length}):`,
      formatRowsTable(result.rows),
    ].join("\n")
  );
}

function getLastResult(world) {
  if (!world.dbLastResult) {
    throw new DbQueryError("POLICY", 'No DB query has run in this scenario yet: add a "When I run the DB query ..." step first');
  }
  return world.dbLastResult;
}

function getRow(result, rowNumber) {
  if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > result.rows.length) {
    throw assertionFailure(result, `DB result has no row ${rowNumber} (rows are 1-based; the result has ${result.rows.length})`);
  }
  return result.rows[rowNumber - 1];
}

function assertColumn(result, row, column) {
  if (!Object.hasOwn(row, column)) {
    throw assertionFailure(result, `DB result has no column "${column}". Columns: ${Object.keys(row).join(", ")}`);
  }
}

function resolveExpected(world, expected) {
  const resolved = policy.resolvePlaceholders(String(expected), world);
  const unresolved = policy.findUnresolvedPlaceholder(resolved);
  if (unresolved) {
    throw new DbQueryError("POLICY", `Expected value "${expected}" references {${unresolved}}, which has no value in this scenario`);
  }
  return resolved;
}

async function runWrite(catalog, name, query, params, transaction) {
  let snapshotRows = null;
  if (query.snapshot) {
    const restoreQuery = policy.resolveQuery(catalog, query.restore, { allowRestoreOnly: true });
    ({ rows: snapshotRows } = await client.execute(query.snapshot, params, query.params, { transaction, queryName: `${name} (snapshot)` }));
    if (snapshotRows.length === 0) {
      throw new DbQueryError("ROW_LIMIT", `DB query "${name}" snapshot matched 0 rows: nothing to change. Params: ${JSON.stringify(loggableParams(params))}`);
    }
    if (snapshotRows.length > query.maxRows) {
      throw new DbQueryError("ROW_LIMIT", `DB query "${name}" snapshot matched ${snapshotRows.length} rows, maxRows ${query.maxRows}`);
    }
    policy.checkSnapshotColumns(name, snapshotRows, query.restore, restoreQuery);
  }

  const { rows, rowsAffected } = await client.execute(query.sql, params, query.params, { transaction, queryName: name });
  if (rowsAffected > query.maxRows) {
    throw new DbQueryError("ROW_LIMIT", `DB query "${name}" affected ${rowsAffected} rows, maxRows ${query.maxRows}`);
  }
  if (snapshotRows && rowsAffected !== snapshotRows.length) {
    throw new DbQueryError(
      "ROW_LIMIT",
      `DB query "${name}" affected ${rowsAffected} rows but its snapshot had ${snapshotRows.length}: the restore would not match`
    );
  }
  const restores = snapshotRows ? snapshotRows.map((row) => ({ query: query.restore, params: { ...row } })) : [];
  return { rows, rowsAffected, restores };
}

async function runRestore(catalog, entry) {
  const query = policy.resolveQuery(catalog, entry.query, { allowRestoreOnly: true });
  const params = policy.buildParams(entry.query, query, entry.params, {}, { fromSnapshot: true });
  const { rowsAffected } = await client.withTransaction(async (transaction) => {
    const outcome = await client.execute(query.sql, params, query.params, { transaction, queryName: entry.query });
    if (outcome.rowsAffected > query.maxRows) {
      throw new DbQueryError("ROW_LIMIT", `Restore "${entry.query}" affected ${outcome.rowsAffected} rows, maxRows ${query.maxRows}`);
    }
    return outcome;
  });
  if (rowsAffected === 0) {
    logger.warn("DB restore matched no row: it was deleted after the snapshot", { query: entry.query, params: loggableParams(params) });
  } else {
    logger.info("DB restore applied", { query: entry.query, params: loggableParams(params) });
  }
}

const DbQueries = {
  MAX_POLL_SECONDS,

  async runQuery(world, name, overrides = {}) {
    const catalog = getCatalog();
    const query = policy.resolveQuery(catalog, name);
    const params = policy.buildParams(name, query, overrides, world);
    const started = Date.now();

    const outcome = policy.isWriteQuery(query)
      ? await client.withTransaction((transaction) => runWrite(catalog, name, query, params, transaction))
      : { ...(await client.execute(query.sql, params, query.params, { queryName: name })), restores: [] };

    // Registered only after commit: a rolled-back write changed nothing, so it has nothing to undo.
    if (outcome.restores.length) {
      world.dbRestores = [...(Array.isArray(world.dbRestores) ? world.dbRestores : []), ...outcome.restores];
    }
    world.dbLastResult = { query: name, params, rows: outcome.rows, rowsAffected: outcome.rowsAffected };
    logger.info("DB query executed", {
      query: name,
      params: loggableParams(params),
      rows: outcome.rows.length,
      rowsAffected: outcome.rowsAffected,
      restoresRegistered: outcome.restores.length,
      durationMs: Date.now() - started,
    });
    return world.dbLastResult;
  },

  async runPendingRestores(world) {
    const pending = Array.isArray(world.dbRestores) ? world.dbRestores : [];
    world.dbRestores = [];
    if (!pending.length) return { restored: 0 };

    const catalog = getCatalog();
    const failures = [];
    let restored = 0;
    // LIFO: when two writes touched the same row, undoing the later one first leaves the original.
    for (let index = pending.length - 1; index >= 0; index--) {
      const entry = pending[index];
      try {
        await runRestore(catalog, entry);
        restored++;
      } catch (error) {
        failures.push({ query: entry.query, params: loggableParams(entry.params), error: error.message });
        logger.error("DB restore failed", { query: entry.query, params: loggableParams(entry.params), error: error.message });
      }
    }

    if (failures.length) {
      throw new DbQueryError(
        "RESTORE",
        `${failures.length} of ${pending.length} DB restore(s) failed; the DB may still hold this scenario's changes:\n` +
          failures.map((failure) => `  - ${failure.query} ${JSON.stringify(failure.params)}: ${failure.error}`).join("\n"),
        { failures }
      );
    }
    return { restored };
  },

  // The spec's step example has a "| param | value |" header; rowsHash() would turn it into an
  // override named "param", so a header row is recognised and dropped.
  overridesFromTable(rawRows) {
    if (!Array.isArray(rawRows)) return {};
    let rows = rawRows;
    const [first] = rows;
    if (first && first.length === 2 && first[0].trim().toLowerCase() === "param" && first[1].trim().toLowerCase() === "value") {
      rows = rows.slice(1);
    }
    const overrides = {};
    for (const row of rows) {
      if (row.length !== 2) {
        throw new DbQueryError("POLICY", `DB query step table rows must have exactly 2 cells (param | value), got ${row.length}: | ${row.join(" | ")} |`);
      }
      const key = row[0].trim();
      if (Object.hasOwn(overrides, key)) throw new DbQueryError("POLICY", `DB query step table: param "${key}" given twice`);
      overrides[key] = row[1];
    }
    return overrides;
  },

  expectRowCount(world, expected, { atLeast = false } = {}) {
    const result = getLastResult(world);
    const actual = result.rows.length;
    if (atLeast ? actual < expected : actual !== expected) {
      throw assertionFailure(result, `DB result should have ${atLeast ? "at least " : ""}${expected} row(s), but has ${actual}`);
    }
  },

  expectColumn(world, { row = 1, column, op, expected }) {
    const result = getLastResult(world);
    const value = resolveExpected(world, expected);
    const cells = getRow(result, row);
    assertColumn(result, cells, column);
    if (!compare(cells[column], op, value)) {
      throw assertionFailure(result, `DB result row ${row} column "${column}" should ${op} "${value}", but was "${normalizeValue(cells[column])}"`);
    }
  },

  expectEveryRow(world, { column, op, expected }) {
    const result = getLastResult(world);
    const value = resolveExpected(world, expected);
    if (!result.rows.length) {
      throw assertionFailure(result, `every DB result row column "${column}" should ${op} "${value}", but the result is empty`);
    }
    result.rows.forEach((cells, index) => {
      assertColumn(result, cells, column);
      if (!compare(cells[column], op, value)) {
        throw assertionFailure(result, `DB result row ${index + 1} column "${column}" should ${op} "${value}", but was "${normalizeValue(cells[column])}"`);
      }
    });
  },

  expectAnyRow(world, { column, op, expected }) {
    const result = getLastResult(world);
    const value = resolveExpected(world, expected);
    if (!result.rows.length) {
      throw assertionFailure(result, `any DB result row column "${column}" should ${op} "${value}", but the result is empty`);
    }
    assertColumn(result, result.rows[0], column);
    if (!result.rows.some((cells) => compare(cells[column], op, value))) {
      throw assertionFailure(result, `no DB result row has column "${column}" that should ${op} "${value}"`);
    }
  },

  expectColumnState(world, { row = 1, column, state }) {
    if (!UNARY_STATES.includes(state)) {
      throw new DbQueryError("POLICY", `Unknown DB column state "${state}". Valid: ${UNARY_STATES.join(", ")}`);
    }
    const result = getLastResult(world);
    const cells = getRow(result, row);
    assertColumn(result, cells, column);
    const isEmpty = normalizeValue(cells[column]) === "";
    if (isEmpty !== (state === "be empty")) {
      throw assertionFailure(result, `DB result row ${row} column "${column}" should ${state}, but was "${normalizeValue(cells[column])}"`);
    }
  },

  expectContainsRows(world, expectedRows) {
    const result = getLastResult(world);
    if (!Array.isArray(expectedRows) || !expectedRows.length) {
      throw new DbQueryError("POLICY", "DB result contain-rows step needs at least one expected row");
    }
    const resolved = expectedRows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([column, value]) => [column, resolveExpected(world, value)]))
    );
    if (result.rows.length) {
      for (const column of Object.keys(resolved[0])) assertColumn(result, result.rows[0], column);
    }
    if (!containsRows(result.rows, resolved)) {
      throw assertionFailure(result, `DB result does not contain the expected rows (each must match a distinct row):\n${formatRowsTable(resolved)}`);
    }
  },

  async waitForColumn(world, { name, column, expected, seconds, overrides = {}, intervalMs = DEFAULT_POLL_INTERVAL_MS }) {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > MAX_POLL_SECONDS) {
      throw new DbQueryError("POLICY", `DB polling time must be between 1 and ${MAX_POLL_SECONDS} seconds, got ${seconds}`);
    }
    const query = policy.resolveQuery(getCatalog(), name);
    if (policy.isWriteQuery(query)) {
      throw new DbQueryError("POLICY", `DB query "${name}" is a write query; only read queries can be polled`);
    }
    const value = resolveExpected(world, expected);
    const deadline = Date.now() + seconds * 1000;

    for (;;) {
      const result = await DbQueries.runQuery(world, name, overrides);
      let lastSeen = "(no rows)";
      if (result.rows.length) {
        assertColumn(result, result.rows[0], column);
        lastSeen = normalizeValue(result.rows[0][column]);
        if (lastSeen === value) return result;
      }
      if (Date.now() + intervalMs > deadline) {
        throw assertionFailure(result, `DB query "${name}" column "${column}" did not become "${value}" within ${seconds}s; last seen "${lastSeen}"`);
      }
      await sleep(intervalMs);
    }
  },

  storeColumn(world, { row = 1, column, worldKey }) {
    if (typeof worldKey !== "string" || !/^\w+$/.test(worldKey)) {
      throw new DbQueryError("POLICY", `World key "${worldKey}" must be letters, digits or _ so it can be used as {${worldKey}}`);
    }
    const existing = world[worldKey];
    const holdsObject = existing !== null && (typeof existing === "object" || typeof existing === "function");
    if (RESERVED_WORLD_KEYS.includes(worldKey) || holdsObject) {
      throw new DbQueryError("POLICY", `Refusing to overwrite world.${worldKey}: it belongs to the test framework, pick another name`);
    }
    const result = getLastResult(world);
    const cells = getRow(result, row);
    assertColumn(result, cells, column);
    const value = normalizeValue(cells[column]);
    world[worldKey] = value;
    logger.info("DB result value stored", { query: result.query, row, column, worldKey, value });
    return value;
  },

  _useForTests({ client: testClient, catalog }) {
    const previousClient = client;
    const previousCatalog = catalogOverride;
    client = testClient;
    catalogOverride = catalog ? policy.validateCatalog(catalog) : null;
    return () => {
      client = previousClient;
      catalogOverride = previousCatalog;
    };
  },
};

module.exports = DbQueries;
```

- [ ] **Step 4: Export from `src/dsl/index.js`**

Add after `  DbRail: require("./DbRail"),`:

```js
  DbQueries: require("./DbQueries"),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS (five suites).

- [ ] **Step 6: Commit**

```bash
git add src/dsl/DbQueries.js src/dsl/index.js tests/unit/DbQueries.test.js
git commit -m "feat(db): add DbQueries DSL with restores, assertions and polling"
```

---

### Task 5: Steps, hooks and smoke feature

**Files:**
- Create: `tests/steps/db_queries.steps.js`
- Create: `tests/support/dbHooks.js`
- Create: `tests/features/db/db_queries_smoke.feature`
- Create: `tests/unit/fixtures/db_steps.dry-run.feature`

**Interfaces:**
- Consumes (Task 4): every `DbQueries` method listed there; (Task 3) `config.db.enabled`, `dbClient.close()`.
- Produces: the Gherkin vocabulary of spec §7; `world.dbRestores` drained after every scenario.

- [ ] **Step 1: Write the dry-run fixture (the failing check)**

Create `tests/unit/fixtures/db_steps.dry-run.feature` — one line per step shape, so a `--dry-run` proves every step is defined exactly once (no undefined, no ambiguous):

```gherkin
Feature: DB query step vocabulary (dry-run only)

  Scenario: Every DB step shape
    Given I am logged in as "dry-run@example.com"
    When I run the DB query "getTripQuotes"
    When I run the DB query "expireTripQuotes" with:
      | param   | value |
      | minutes | 5     |
    Then the DB result should have 1 row
    Then the DB result should have 2 rows
    Then the DB result should have at least 1 row
    Then the DB result column "status" should be "3"
    Then the DB result column "status" should not be "3"
    Then the DB result column "product" should contain "car"
    Then the DB result column "product" should not contain "car"
    Then the DB result column "expires" should be greater than "now"
    Then the DB result column "expires" should be less than "now+2m"
    Then the DB result row 2 column "status" should be "3"
    Then every DB result row column "status" should be "3"
    Then any DB result row column "status" should be "3"
    Then the DB result column "expires" should be empty
    Then the DB result column "expires" should not be empty
    Then the DB result should contain rows:
      | product | status |
      | car     | 3      |
    Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds
    Then the DB query "getTripQuotes" column "status" should become "4" within 60 seconds with:
      | param  | value |
      | tripId | 1     |
    And I store the DB result column "id" as "storedQuoteId"
    And I store the DB result row 2 column "id" as "storedSecondQuoteId"
```

- [ ] **Step 2: Run the dry-run to verify it fails**

Run: `npx cucumber-js tests/unit/fixtures/db_steps.dry-run.feature --dry-run`
Expected: FAIL — the summary reports the DB steps as `undefined`.

- [ ] **Step 3: Write `tests/steps/db_queries.steps.js`**

```js
require("module-alias/register");
const { When, Then } = require("@cucumber/cucumber");
const { DbQueries } = require("@dsl");
const config = require("@config/config");
const logger = require("@utils/logger").child("DbQueriesSteps");

// The first DB step of a worker may wait on an interactive Entra sign-in (DB_AUTHENTICATION=entra-mfa).
const CONNECTING_STEP_TIMEOUT_MS = 5 * 60 * 1000;
// Polling waits up to DbQueries.MAX_POLL_SECONDS on top of a possible first connection.
const POLLING_STEP_TIMEOUT_MS = (DbQueries.MAX_POLL_SECONDS + 5 * 60) * 1000;

const QUOTED = '"([^"]*)"';
const OPERATOR = "(be|not be|contain|not contain|be greater than|be less than)";

// Same switch PayloadValidation has: DB_QUERIES_ENABLED=false turns every DB step into a logged no-op.
async function runDbStep(world, stepName, metadata, action) {
  if (!config.db.enabled) {
    logger.warn("DB_QUERIES_ENABLED=false: DB step skipped", { step: stepName, ...metadata });
    return;
  }
  await action();
}

When("I run the DB query {string}", { timeout: CONNECTING_STEP_TIMEOUT_MS }, async function (name) {
  await runDbStep(this, "runQuery", { name }, () => DbQueries.runQuery(this, name));
});

When("I run the DB query {string} with:", { timeout: CONNECTING_STEP_TIMEOUT_MS }, async function (name, dataTable) {
  await runDbStep(this, "runQuery", { name }, () => DbQueries.runQuery(this, name, DbQueries.overridesFromTable(dataTable.raw())));
});

Then("the DB result should have {int} row(s)", async function (count) {
  await runDbStep(this, "expectRowCount", { count }, () => DbQueries.expectRowCount(this, count));
});

Then("the DB result should have at least {int} row(s)", async function (count) {
  await runDbStep(this, "expectRowCount", { count, atLeast: true }, () => DbQueries.expectRowCount(this, count, { atLeast: true }));
});

Then(new RegExp(`^the DB result column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectColumn", { column, op, expected }, () => DbQueries.expectColumn(this, { column, op, expected }));
});

Then(new RegExp(`^the DB result row (\\d+) column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (row, column, op, expected) {
  await runDbStep(this, "expectColumn", { row, column, op, expected }, () =>
    DbQueries.expectColumn(this, { row: Number(row), column, op, expected })
  );
});

Then(new RegExp(`^every DB result row column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectEveryRow", { column, op, expected }, () => DbQueries.expectEveryRow(this, { column, op, expected }));
});

Then(new RegExp(`^any DB result row column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectAnyRow", { column, op, expected }, () => DbQueries.expectAnyRow(this, { column, op, expected }));
});

Then(new RegExp(`^the DB result column ${QUOTED} should (be empty|not be empty)$`), async function (column, state) {
  await runDbStep(this, "expectColumnState", { column, state }, () => DbQueries.expectColumnState(this, { column, state }));
});

Then("the DB result should contain rows:", async function (dataTable) {
  await runDbStep(this, "expectContainsRows", {}, () => DbQueries.expectContainsRows(this, dataTable.hashes()));
});

Then(
  "the DB query {string} column {string} should become {string} within {int} seconds",
  { timeout: POLLING_STEP_TIMEOUT_MS },
  async function (name, column, expected, seconds) {
    await runDbStep(this, "waitForColumn", { name, column, expected, seconds }, () =>
      DbQueries.waitForColumn(this, { name, column, expected, seconds })
    );
  }
);

Then(
  "the DB query {string} column {string} should become {string} within {int} seconds with:",
  { timeout: POLLING_STEP_TIMEOUT_MS },
  async function (name, column, expected, seconds, dataTable) {
    await runDbStep(this, "waitForColumn", { name, column, expected, seconds }, () =>
      DbQueries.waitForColumn(this, { name, column, expected, seconds, overrides: DbQueries.overridesFromTable(dataTable.raw()) })
    );
  }
);

When("I store the DB result column {string} as {string}", async function (column, worldKey) {
  await runDbStep(this, "storeColumn", { column, worldKey }, () => DbQueries.storeColumn(this, { column, worldKey }));
});

When("I store the DB result row {int} column {string} as {string}", async function (row, column, worldKey) {
  await runDbStep(this, "storeColumn", { row, column, worldKey }, () => DbQueries.storeColumn(this, { row, column, worldKey }));
});
```

- [ ] **Step 4: Write `tests/support/dbHooks.js`**

```js
require("module-alias/register");

/**
 * DB query cleanup. Separate from hooks.js on purpose: its After returns early when the scenario
 * never opened a page, and restores must run no matter how (or whether) the browser part went.
 */
const { After, AfterAll } = require("@cucumber/cucumber");
const config = require("@config/config");
const { DbQueries } = require("@dsl");
const dbClient = require("@utils/dbClient");

// Runs on pass and on fail. A failed restore fails the scenario and attaches what was left behind.
After(async function () {
  if (!config.db.enabled) return;
  if (!Array.isArray(this.dbRestores) || !this.dbRestores.length) return;
  try {
    await DbQueries.runPendingRestores(this);
  } catch (error) {
    if (error.failures) {
      this.attach(JSON.stringify(error.failures, null, 2), "application/json");
    }
    throw error;
  }
});

// One pool per worker process; close it so the worker can exit.
AfterAll(async function () {
  await dbClient.close();
});
```

- [ ] **Step 5: Write `tests/features/db/db_queries_smoke.feature`**

The `Before` hook in `tests/support/hooks.js` refuses any scenario without a session-opening step, so the smoke logs in first (same user as `tests/features/smoke/smoke.feature`).

```gherkin
@db
Feature: DB queries smoke
  As a QA engineer
  I want a DB query step to reach the database
  So that I know the DB configuration, credential and catalog work end to end

  @priority:medium
  Scenario: A read-only catalog query returns its row
    Given I am logged in as "ruimariano@amadeus.com"
    When I run the DB query "dbPing"
    Then the DB result should have 1 row
    And the DB result column "ok" should be "1"
```

- [ ] **Step 6: Run the dry-runs to verify every step matches once**

Run: `npx cucumber-js tests/unit/fixtures/db_steps.dry-run.feature --dry-run`
Expected: PASS — every step `skipped`, **0 undefined, 0 ambiguous**.

Run: `npx cucumber-js tests/features/db/ --dry-run`
Expected: PASS — 1 scenario, 0 undefined, 0 ambiguous.

Run: `npx cucumber-js tests/features/smoke/ --dry-run`
Expected: PASS with the same step counts as before this task (the new step file must not create ambiguity with existing steps, e.g. `profile.steps.js` "the DB BahnCard 50 …").

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 7: Run the smoke against a real DB (only if DB settings are available)**

With `DB_*` set in `.env`: `npm run bdd:db`
Expected: 1 scenario passed. If no DB settings are available on this machine, skip and say so in the task report — do not mark it as passed.

- [ ] **Step 8: Commit**

```bash
git add tests/steps/db_queries.steps.js tests/support/dbHooks.js tests/features/db/db_queries_smoke.feature tests/unit/fixtures/db_steps.dry-run.feature
git commit -m "feat(db): add DB query steps, restore hook and smoke scenario"
```

---

### Task 6: `db:check` script and documentation

**Files:**
- Create: `scripts/check-db.js`
- Create: `docs/DbQueries.md`

**Interfaces:**
- Consumes: `loadCatalog`, `isWriteQuery` (Task 2), `formatRowsTable` (Task 1), `dbClient.execute`, `dbClient.sqlTypeDeclaration`, `dbClient.close` (Task 3), `DbQueries.runQuery` (Task 4), `config.db` (Task 3).
- Produces: `npm run db:check [-- --offline] [-- --query <name> --param k=v ...]`, non-zero exit on failure.

- [ ] **Step 1: Write `scripts/check-db.js`**

```js
#!/usr/bin/env node
/**
 * Standalone check for the DB query feature (same config, credential and catalog a Cucumber run
 * uses), so DB problems surface without running a scenario first.
 *
 *  1. Validates src/config/dbQueries.json offline (same rules as a test run).
 *  2. Connects with DB_AUTHENTICATION and runs SELECT 1.
 *  3. Compiles every read query and every snapshot against the live schema with
 *     sp_describe_first_result_set (nothing is executed), and checks each snapshot returns exactly
 *     its restore query's params. Write statements themselves are not compiled.
 *  4. Optionally runs one catalog READ query and prints its rows.
 *
 * Usage:
 *   npm run db:check
 *   npm run db:check -- --offline
 *   npm run db:check -- --query getTripQuotes --param tripId=3768378
 */
require("module-alias/register");
const config = require("@config/config");
const { loadCatalog, isWriteQuery } = require("@utils/dbQueryPolicy");
const { formatRowsTable } = require("@utils/dbValues");
const dbClient = require("@utils/dbClient");

function parseArgs(argv) {
  const args = { offline: false, query: null, params: {} };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--offline") {
      args.offline = true;
    } else if (arg === "--query") {
      args.query = argv[++index];
    } else if (arg === "--param") {
      const pair = argv[++index] ?? "";
      const separator = pair.indexOf("=");
      if (separator < 1) throw new Error(`--param expects name=value, got "${pair}"`);
      args.params[pair.slice(0, separator)] = pair.slice(separator + 1);
    } else {
      throw new Error(`Unknown argument "${arg}". Use --offline, --query <name>, --param name=value`);
    }
  }
  return args;
}

async function describeColumns(label, statement, paramDefs) {
  const declaration = Object.entries(paramDefs)
    .map(([name, definition]) => `@${name} ${dbClient.sqlTypeDeclaration(definition.type)}`)
    .join(", ");
  const { rows } = await dbClient.execute(
    "EXEC sp_describe_first_result_set @tsql = @tsql, @params = @params",
    { tsql: statement, params: declaration || null },
    { tsql: { type: "NVarChar" }, params: { type: "NVarChar" } },
    { queryName: `${label} (describe)` }
  );
  return rows.filter((row) => !row.is_hidden).map((row) => row.name);
}

async function checkSchema(catalog) {
  let problems = 0;
  for (const [name, query] of Object.entries(catalog.queries)) {
    const statements = [];
    if (!isWriteQuery(query)) statements.push(["sql", query.sql]);
    if (query.snapshot) statements.push(["snapshot", query.snapshot]);

    for (const [field, statement] of statements) {
      try {
        const columns = await describeColumns(`${name}.${field}`, statement, query.params);
        if (field === "snapshot") {
          const expected = Object.keys(catalog.queries[query.restore].params).sort();
          if ([...columns].sort().join(",") !== expected.join(",")) {
            problems++;
            console.error(`FAIL ${name}.snapshot returns [${columns.join(", ")}] but ${query.restore} expects [${expected.join(", ")}]`);
            continue;
          }
        }
        console.log(`OK   ${name}.${field} compiles (columns: ${columns.join(", ")})`);
      } catch (error) {
        problems++;
        console.error(`FAIL ${name}.${field}: ${error.message}`);
      }
    }
  }
  if (problems) throw new Error(`${problems} catalog statement(s) failed against the live DB`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = loadCatalog();
  console.log(`OK   Catalog valid: ${Object.keys(catalog.queries).length} queries`);
  if (args.offline) return;

  const db = config.db;
  console.log(`...  Connecting to ${db.serverName}/${db.databaseName} with DB_AUTHENTICATION=${db.authentication}`);
  const { rows } = await dbClient.execute("SELECT 1 AS ok", {}, {}, { queryName: "connection check" });
  if (!rows.length || rows[0].ok !== 1) throw new Error(`SELECT 1 returned ${JSON.stringify(rows)}`);
  console.log("OK   Connected: SELECT 1 returned 1");

  await checkSchema(catalog);

  if (args.query) {
    const query = catalog.queries[args.query];
    if (query && isWriteQuery(query)) throw new Error(`--query only runs read queries; "${args.query}" is a write`);
    const DbQueries = require("@dsl/DbQueries");
    const result = await DbQueries.runQuery({}, args.query, args.params);
    console.log(`OK   ${args.query}: ${result.rows.length} row(s)`);
    console.log(formatRowsTable(result.rows));
  }
}

main()
  .catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => dbClient.close());
```

- [ ] **Step 2: Verify the offline check**

Run: `npm run db:check -- --offline`
Expected: `OK   Catalog valid: 12 queries`, exit code 0.

Run: `npm run db:check -- --bogus`
Expected: `FAIL Unknown argument "--bogus" ...`, exit code 1.

With `DB_*` settings available: `npm run db:check`
Expected: connection OK, one `OK` line per read query and snapshot. Any `FAIL` line means a table/column name or type in the catalog does not match the schema (spec §5 says these are to be confirmed): fix `src/config/dbQueries.json` and re-run. Without DB settings, skip and say so in the task report.

- [ ] **Step 3: Write `docs/DbQueries.md`**

````markdown
# DB Queries

Run **pre-approved, parameterised** SQL against the application database (Azure SQL) from
Cucumber scenarios: change live trip data (expire quotes, force prices, move dates) and read data
back for assertions. Every change is reverted automatically after the scenario, pass or fail.

- Catalog: `src/config/dbQueries.json` — the only SQL that can run.
- Steps: `tests/steps/db_queries.steps.js` · DSL: `src/dsl/DbQueries.js` (`const { DbQueries } = require("@dsl")`).
- Global switch: `DB_QUERIES_ENABLED=false` turns every DB step into a logged no-op, and the restore hook does nothing.
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
GRANT SELECT ON dbo.Quotes TO [qa-automation-app];
GRANT SELECT, UPDATE ON dbo.EvolviPricings TO [qa-automation-app];
-- one GRANT per table the catalog reads or writes
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
no `EXEC`, `UPDATE`/`DELETE` need `WHERE`, `snapshot` is a read-only `SELECT`, every `@param` is
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
| `[DB TIMEOUT]` | raise `DB_TIMEOUT_MS` or check DB load |
| `[DB RESTORE]` | cleanup failed; check the attached rows and fix them by hand |
````

- [ ] **Step 4: Final verification**

Run: `npm run test:unit`
Expected: PASS, all suites.

Run: `npx cucumber-js tests/unit/fixtures/db_steps.dry-run.feature --dry-run`
Expected: 0 undefined, 0 ambiguous.

Run: `npm run db:check -- --offline`
Expected: `OK   Catalog valid: 12 queries`.

Run: `npx eslint src/utils/dbQueryError.js src/utils/dbValues.js src/utils/dbQueryPolicy.js src/utils/dbCredential.js src/utils/dbClient.js src/dsl/DbQueries.js tests/steps/db_queries.steps.js tests/support/dbHooks.js scripts/check-db.js`
Expected: no errors (warnings consistent with the rest of the repo are acceptable; report them).

- [ ] **Step 5: Commit**

```bash
git add scripts/check-db.js docs/DbQueries.md
git commit -m "feat(db): add db:check script and DB queries documentation"
```
