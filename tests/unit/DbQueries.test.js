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
    sqlText === Q.expire.snapshot ? { rows: [{ id: 1, expires: ORIGINAL_1 }], rowsAffected: 1 } : { rows: [], rowsAffected: 2 },
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
    /did not become "DONE" within 1s; last seen "PENDING"/,
  );
  await assert.rejects(DbQueries.waitForColumn({ tripId: "1" }, { name: "expire", column: "x", expected: "y", seconds: 1 }), errorWith("POLICY", "only read queries can be polled"));
  await assert.rejects(DbQueries.waitForColumn({ tripId: "1" }, { name: "readStatus", column: "status", expected: "y", seconds: 601 }), errorWith("POLICY", "between 1 and 600"));
});
