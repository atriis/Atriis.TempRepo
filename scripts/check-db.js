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
    { queryName: `${label} (describe)` },
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
