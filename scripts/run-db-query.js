#!/usr/bin/env node
/**
 * Runs ONE query from the catalog (src/config/dbQueries.json) against the configured DB, outside
 * Cucumber, with the same policy, params and auth a scenario uses. Only catalog queries can run.
 *
 * Unlike a scenario, a write made here is NOT restored automatically: that is the point of the
 * script (e.g. expire a trip's quotes and then look at the app by hand). The original values the
 * snapshot captured are saved to test-results/db-restores/, and --restore puts them back.
 *
 * Usage:
 *   npm run db:query -- --list
 *   npm run db:query -- getTripQuotes --param tripId=3903524
 *   npm run db:query -- expireTripQuotes --param tripId=3903524 --param minutes=2 --yes
 *   npm run db:query -- --restore test-results/db-restores/<file>.json
 *
 * Flags:
 *   <name>               catalog query to run (restore-only queries are refused)
 *   --param name=value   override a param; repeat for several. {tripNumber} has no trip here,
 *                        so pass tripId explicitly.
 *   --yes                required to run a write query (reads never need it)
 *   --list               print the runnable catalog queries and their params
 *   --restore <file>     write back the originals saved by an earlier write
 */
require("module-alias/register");
const fs = require("fs");
const path = require("path");
const { loadCatalog, isWriteQuery } = require("@utils/dbQueryPolicy");
const { formatRowsTable } = require("@utils/dbValues");
const dbClient = require("@utils/dbClient");
const DbQueries = require("@dsl/DbQueries");

const RESTORE_DIR = path.join(__dirname, "..", "test-results", "db-restores");

function parseArgs(argv) {
  const args = { name: null, params: {}, yes: false, list: false, restore: null };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--param") {
      const pair = argv[++index] ?? "";
      const separator = pair.indexOf("=");
      if (separator < 1) throw new Error(`--param expects name=value, got "${pair}"`);
      args.params[pair.slice(0, separator)] = pair.slice(separator + 1);
    } else if (arg === "--yes") {
      args.yes = true;
    } else if (arg === "--list") {
      args.list = true;
    } else if (arg === "--restore") {
      args.restore = argv[++index];
      if (!args.restore) throw new Error("--restore expects a file path");
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown argument "${arg}". Use <name>, --param name=value, --yes, --list, --restore <file>`);
    } else if (args.name) {
      throw new Error(`Only one query per run; got "${args.name}" and "${arg}"`);
    } else {
      args.name = arg;
    }
  }
  if (!args.list && !args.restore && !args.name) {
    throw new Error("Give a query name, --list or --restore <file>. See the header of scripts/run-db-query.js");
  }
  return args;
}

function describeParams(query) {
  const params = Object.entries(query.params).map(([name, definition]) => {
    const extra = definition.default !== undefined ? ` = ${definition.default}` : definition.required ? ", required" : "";
    return `${name} (${definition.type}${extra})`;
  });
  return params.length ? params.join(", ") : "(none)";
}

function listQueries(catalog) {
  for (const [name, query] of Object.entries(catalog.queries)) {
    if (query.restoreOnly === true) continue;
    const kind = isWriteQuery(query) ? `write, maxRows ${query.maxRows}` : "read";
    console.log(`${name} [${kind}]\n    ${query.description}\n    params: ${describeParams(query)}`);
  }
}

function saveRestores(name, params, restores) {
  fs.mkdirSync(RESTORE_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(RESTORE_DIR, `${stamp}_${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ query: name, params, createdAt: new Date().toISOString(), restores }, null, 2));
  return path.relative(process.cwd(), file);
}

async function runOne(catalog, args) {
  const query = Object.hasOwn(catalog.queries, args.name) ? catalog.queries[args.name] : null;
  // Unknown and restore-only names fall through to runQuery, which explains them.
  if (query && query.restoreOnly !== true && isWriteQuery(query) && !args.yes) {
    throw new Error(
      `"${args.name}" changes data (up to ${query.maxRows} rows) and is NOT restored automatically when run from ` +
        "this script. Re-run with --yes to execute it.",
    );
  }

  const world = {};
  const result = await DbQueries.runQuery(world, args.name, args.params);
  if (query && isWriteQuery(query)) {
    console.log(`OK   ${args.name}: ${result.rowsAffected} row(s) changed`);
  } else {
    console.log(`OK   ${args.name}: ${result.rows.length} row(s)`);
    console.log(formatRowsTable(result.rows));
  }

  if (Array.isArray(world.dbRestores) && world.dbRestores.length) {
    const file = saveRestores(args.name, args.params, world.dbRestores);
    console.log(`     Original values saved to ${file}`);
    console.log(`     Undo with: npm run db:query -- --restore "${file}"`);
  }
}

async function restoreFrom(file) {
  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(saved.restores) || !saved.restores.length) {
    throw new Error(`${file} has no restores to apply`);
  }
  const world = { dbRestores: saved.restores };
  const { restored } = await DbQueries.runPendingRestores(world);
  // Renamed so the same originals are not written back twice by accident.
  const done = file.replace(/\.json$/i, "") + ".restored.json";
  fs.renameSync(file, done);
  console.log(`OK   Restored ${restored} row(s) from ${saved.query}; file renamed to ${done}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = loadCatalog();
  if (args.list) return listQueries(catalog);
  if (args.restore) return restoreFrom(args.restore);
  return runOne(catalog, args);
}

main()
  .catch((error) => {
    console.error(`FAIL ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => dbClient.close());
