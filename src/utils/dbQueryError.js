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
