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

// Text of the outermost statement: string literals blanked (their parens could unbalance the
// scan), then parenthesised groups removed innermost-first, so a WHERE inside a sub-select or
// function call does not count as the statement's own WHERE.
function outerStatementText(text) {
  let outer = text.replace(/'(?:[^']|'')*'/g, "''");
  let previous;
  do {
    previous = outer;
    outer = outer.replace(/\([^()]*\)/g, " ");
  } while (outer !== previous);
  return outer;
}

const BUILT_IN_RULES = [
  {
    name: "single statement",
    violates: (text) => text.replace(/;\s*$/, "").includes(";") || /(^|\s)GO(\s|$)/i.test(text),
  },
  { name: "no SQL comments", violates: (text) => /--|\/\*|\*\//.test(text) },
  { name: "no EXEC", violates: (text) => /\b(EXEC|EXECUTE|sp_executesql)\b/i.test(text) },
  {
    name: "UPDATE/DELETE need WHERE",
    violates: (text) => /\b(UPDATE|DELETE)\b/i.test(text) && !/\bWHERE\b/i.test(outerStatementText(text)),
  },
  {
    name: "starts with SELECT, WITH, UPDATE, INSERT, DELETE or MERGE",
    violates: (text) => !/^\s*(SELECT|WITH|UPDATE|INSERT|DELETE|MERGE)\b/i.test(text),
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
      problems.push("\"snapshot\" must be a read-only SELECT");
    } else {
      statements.push(["snapshot", query.snapshot]);
      if (!/^\s*SELECT\b/i.test(query.snapshot) || WRITE_KEYWORDS.test(query.snapshot)) {
        problems.push("\"snapshot\" must be a read-only SELECT");
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
        `param "${param}" has unsupported type ${JSON.stringify(definition?.type)}; supported: ${SUPPORTED_TYPES.join(", ")}`,
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
    if (query.restoreOnly) problems.push("\"restoreOnly\" queries must be writes");
    if (hasSnapshot || hasRestore || hasNoRestore) {
      problems.push("read queries must not declare \"snapshot\", \"restore\" or \"noRestore\"");
    }
    return problems;
  }

  if (!Number.isInteger(query.maxRows) || query.maxRows < 1) {
    problems.push("write queries must declare \"maxRows\" as a positive integer");
  }

  if (query.restoreOnly === true) {
    if (hasSnapshot || hasRestore || hasNoRestore) {
      problems.push("\"restoreOnly\" queries must not declare \"snapshot\", \"restore\" or \"noRestore\"");
    }
    return problems;
  }

  if (hasNoRestore && !(typeof query.noRestore === "string" && query.noRestore.trim())) {
    problems.push("\"noRestore\" must be a non-empty reason");
  }
  if (hasNoRestore && (hasSnapshot || hasRestore)) {
    problems.push("\"noRestore\" is mutually exclusive with \"snapshot\"/\"restore\"");
  } else if (!hasNoRestore && !(hasSnapshot && hasRestore)) {
    problems.push("write queries must declare both \"snapshot\" and \"restore\", or a \"noRestore\" reason");
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
  if (typeof query.description !== "string" || !query.description.trim()) problems.push("\"description\" is required");
  if (typeof query.sql !== "string" || !query.sql.trim()) return [...problems, "\"sql\" is required"];
  if (!query.params || typeof query.params !== "object" || Array.isArray(query.params)) {
    return [...problems, "\"params\" must be an object (use {} for none)"];
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

  // A query placed outside "queries" (e.g. after its closing brace) would otherwise be ignored silently.
  for (const key of Object.keys(catalog)) {
    if (key !== "forbidden" && key !== "queries") {
      problems.push(`unknown top-level key "${key}": queries go inside "queries"`);
    }
  }

  const forbidden = catalog.forbidden ?? [];
  const forbiddenRegexes = [];
  if (!Array.isArray(forbidden)) problems.push("\"forbidden\" must be an array of regex strings");
  for (const pattern of Array.isArray(forbidden) ? forbidden : []) {
    try {
      forbiddenRegexes.push(new RegExp(pattern, "i"));
    } catch (error) {
      problems.push(`forbidden pattern ${JSON.stringify(pattern)} is not a valid regex: ${error.message}`);
    }
  }

  const queries = catalog.queries;
  if (!queries || typeof queries !== "object" || Array.isArray(queries) || !Object.keys(queries).length) {
    problems.push("\"queries\" must be a non-empty object");
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
    parsed = JSON.parse(fs.readFileSync(catalogPath, "utf8").replace(new RegExp("^" + String.fromCharCode(0xFEFF)), ""));
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
        "Only queries in src/config/dbQueries.json can run.",
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
      `DB query "${queryName}" has no param(s) ${unknown.join(", ")}. Declared: ${declared.join(", ") || "(none)"}`,
    );
  }

  const params = {};
  for (const [param, definition] of Object.entries(query.params)) {
    let raw = Object.hasOwn(overrides, param) ? overrides[param] : fromSnapshot ? undefined : definition.default;
    if (raw === undefined) {
      throw policyError(
        `DB query "${queryName}" param "${param}" has no value: ` +
          (fromSnapshot ? "the snapshot row does not carry it" : "give it in the step table"),
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
              : ""),
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
        `expects exactly [${expected.join(", ")}]: alias the snapshot columns to the restore params`,
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
