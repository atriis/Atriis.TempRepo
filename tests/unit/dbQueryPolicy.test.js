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
  for (const name of ["dbPing", "getTripQuotes", "expireTripQuotes", "changeQuoteStatus", "setTripHotelPrice"]) {
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

test("a query placed outside \"queries\" is reported, not ignored", () => {
  assert.throws(
    () => policy.validateCatalog({ ...catalogWith(), changeQuoteStatus: READ }),
    policyError("unknown top-level key \"changeQuoteStatus\": queries go inside \"queries\""),
  );
});

test("built-in rules cannot be switched off", () => {
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId; SELECT 2" } }, "built-in rule \"single statement\"");
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId\nGO" } }, "built-in rule \"single statement\"");
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE 1 = @tripId -- hidden" } }, "built-in rule \"no SQL comments\"");
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a /* x */ WHERE 1 = @tripId" } }, "built-in rule \"no SQL comments\"");
  expectInvalid({ bad: { ...READ, sql: "EXEC sp_who @tripId" } }, "built-in rule \"no EXEC\"");
  expectInvalid({ bad: { ...WRITE, sql: "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, @tripId)" } }, "built-in rule \"UPDATE/DELETE need WHERE\"");
  expectInvalid({ bad: { ...READ, sql: "sp_who2 @tripId" } }, "built-in rule \"starts with SELECT, WITH, UPDATE, INSERT, DELETE or MERGE\"");
  expectInvalid(
    { bad: { ...WRITE, sql: "UPDATE Quotes SET Expires = (SELECT MAX(Expires) FROM Quotes q WHERE q.TripId = @tripId AND q.Id > @minutes)" } },
    "built-in rule \"UPDATE/DELETE need WHERE\"",
  );
  assert.doesNotThrow(() => policy.validateCatalog(catalogWith({ ok: { ...READ, sql: `${READ.sql};` } })));
  assert.doesNotThrow(() =>
    policy.validateCatalog(catalogWith({ ok: { ...WRITE, sql: "UPDATE Quotes SET Expires = DATEADD(MINUTE, @minutes, GETDATE()) WHERE Id IN (SELECT Id FROM Quotes WHERE TripId = @tripId)" } })),
  );
});

test("params must be declared, used and of a supported type", () => {
  expectInvalid({ bad: { ...READ, sql: "SELECT 1 AS a WHERE TripId = @tripId AND Id = @quoteId" } }, "uses @quoteId, which is not declared");
  expectInvalid({ bad: { ...READ, params: { ...READ.params, unused: { type: "Int", default: "1" } } } }, "param \"unused\" is declared but not used");
  expectInvalid({ bad: { ...READ, params: { tripId: { type: "Money" } } } }, "unsupported type \"Money\"");
  expectInvalid({ bad: { ...READ, params: { tripId: { type: "Int", default: 5 } } } }, "default must be a string");
});

test("writes need maxRows and exactly one restore strategy", () => {
  const { maxRows, ...noMax } = WRITE;
  expectInvalid({ bad: noMax }, "\"maxRows\" as a positive integer");
  const { snapshot, restore, ...bare } = WRITE;
  expectInvalid({ bad: bare }, "both \"snapshot\" and \"restore\", or a \"noRestore\" reason");
  expectInvalid({ bad: { ...WRITE, noRestore: "disposable" } }, "mutually exclusive");
  expectInvalid({ bad: { ...bare, noRestore: "  " } }, "\"noRestore\" must be a non-empty reason");
  assert.doesNotThrow(() => policy.validateCatalog(catalogWith({ ok: { ...bare, noRestore: "log rows are disposable" } })));
});

test("restore must point at an existing restoreOnly query", () => {
  expectInvalid({ bad: { ...WRITE, restore: "missing" } }, "references unknown query \"missing\"");
  expectInvalid({ bad: { ...WRITE, restore: "write" } }, "must be marked \"restoreOnly\": true");
});

test("snapshot must be a read-only SELECT", () => {
  expectInvalid({ bad: { ...WRITE, snapshot: "UPDATE Quotes SET Id = Id WHERE TripId = @tripId" } }, "\"snapshot\" must be a read-only SELECT");
});

test("reads cannot carry restore fields, SELECT INTO counts as a write", () => {
  expectInvalid({ bad: { ...READ, restore: "restoreExpires" } }, "read queries must not declare");
  expectInvalid({ bad: { ...READ, sql: "SELECT Id INTO Backup FROM Quotes WHERE TripId = @tripId" } }, "\"maxRows\" as a positive integer");
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
  assert.throws(() => policy.buildParams("read", READ, { tripID: "1" }, {}), policyError("no param(s) tripID. Declared: tripId"));
});

test("buildParams names the param when {tripNumber} has no trip yet", () => {
  assert.throws(
    () => policy.buildParams("read", READ, {}, {}),
    policyError("param \"tripId\" references {tripNumber}, which has no value in this scenario (no trip id recorded yet"),
  );
  assert.throws(() => policy.buildParams("read", READ, { tripId: "{nothing}" }, { nothing: { an: "object" } }), policyError("{nothing}"));
});

test("buildParams rejects empty required and non-text values", () => {
  const query = { ...READ, params: { tripId: { type: "Int" } } };
  assert.throws(() => policy.buildParams("q", query, {}, {}), policyError("param \"tripId\" has no value: give it in the step table"));
  assert.throws(() => policy.buildParams("read", READ, { tripId: "" }, {}), policyError("param \"tripId\" is empty"));
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
    policyError("the snapshot row does not carry it"),
  );
});

test("checkSnapshotColumns requires exactly the restore params", () => {
  assert.doesNotThrow(() => policy.checkSnapshotColumns("write", [{ id: 1, expires: null }], "restoreExpires", RESTORE));
  assert.throws(
    () => policy.checkSnapshotColumns("write", [{ Id: 1, expires: null }], "restoreExpires", RESTORE),
    policyError("alias the snapshot columns to the restore params"),
  );
});

test("loadCatalog tolerates a UTF-8 BOM and reports unreadable files", () => {
  const file = path.join(os.tmpdir(), `dbQueries-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(file, String.fromCharCode(0xFEFF) + JSON.stringify(catalogWith()), "utf8");
  try {
    assert.ok(policy.loadCatalog(file).queries.read);
  } finally {
    fs.unlinkSync(file);
  }
  assert.throws(() => policy.loadCatalog(path.join(os.tmpdir(), "does-not-exist.json")), policyError("Could not read DB query catalog"));
});
