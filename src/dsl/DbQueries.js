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
