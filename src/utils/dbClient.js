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
