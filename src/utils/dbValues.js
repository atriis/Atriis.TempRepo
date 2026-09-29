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
    `Cannot order-compare "${actual}" with "${expected}": both sides must be numbers or both dates`,
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
      `Unknown DB comparison operator "${op}". Valid: ${COMPARISON_OPERATORS.join(", ")}`,
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
