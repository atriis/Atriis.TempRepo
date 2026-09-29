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
  assert.throws(() => values.coerceParam("id", "Int", "4.2"), isPolicyError("Param \"id\" (Int): expected an integer"));
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
  assert.throws(() => values.coerceParam("x", "Money", "1"), isPolicyError("unsupported type \"Money\""));
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
