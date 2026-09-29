require("module-alias/register");
const { InteractiveBrowserCredential, ClientSecretCredential, AzureCliCredential } = require("@azure/identity");
const config = require("@config/config");
const { DbQueryError } = require("@utils/dbQueryError");

const DB_TOKEN_SCOPE = "https://database.windows.net/.default";
const AUTH_MODES = ["entra-mfa", "service-principal", "azure-cli"];

const CONNECTION_SETTINGS = [
  ["DB_SERVER_NAME", "serverName"],
  ["DB_DATABASE_NAME", "databaseName"],
];
const MODE_SETTINGS = {
  "entra-mfa": [["DB_USER_NAME", "userName"]],
  "service-principal": [
    ["DB_TENANT_ID", "tenantId"],
    ["DB_CLIENT_ID", "clientId"],
    ["DB_CLIENT_SECRET", "clientSecret"],
  ],
  "azure-cli": [],
};
const AUTH_HINTS = {
  "entra-mfa": "Complete the browser sign-in for DB_USER_NAME, and check the account has access to the database.",
  "service-principal": "Check DB_TENANT_ID / DB_CLIENT_ID / DB_CLIENT_SECRET and that the secret has not expired.",
  "azure-cli": "run `az login` (or the azure/login action on CI) before the tests.",
};

function requireDbSettings(db = config.db) {
  const mode = db.authentication;
  if (!AUTH_MODES.includes(mode)) {
    throw new DbQueryError("CONFIG", `DB_AUTHENTICATION must be one of ${AUTH_MODES.join(", ")}, got "${mode ?? ""}"`);
  }
  const missing = [...CONNECTION_SETTINGS, ...MODE_SETTINGS[mode]].filter(([, key]) => !db[key]).map(([envName]) => envName);
  if (missing.length) {
    throw new DbQueryError("CONFIG", `DB_AUTHENTICATION=${mode} requires ${missing.join(", ")}`);
  }
  return mode;
}

function createCredential(db = config.db) {
  const mode = requireDbSettings(db);
  switch (mode) {
    case "entra-mfa":
      return new InteractiveBrowserCredential({ loginHint: db.userName, ...(db.tenantId && { tenantId: db.tenantId }) });
    case "service-principal":
      return new ClientSecretCredential(db.tenantId, db.clientId, db.clientSecret);
    case "azure-cli":
      return new AzureCliCredential();
    default:
      throw new DbQueryError("CONFIG", `Unhandled DB_AUTHENTICATION "${mode}"`);
  }
}

async function getDbAccessToken(credential, mode) {
  let token;
  try {
    token = await credential.getToken(DB_TOKEN_SCOPE);
  } catch (error) {
    throw new DbQueryError("AUTH", `Could not get a DB access token with DB_AUTHENTICATION=${mode}: ${error.message}. ${AUTH_HINTS[mode]}`, {
      cause: error,
    });
  }
  if (!token || !token.token) {
    throw new DbQueryError("AUTH", `DB_AUTHENTICATION=${mode} credential returned no token. ${AUTH_HINTS[mode]}`);
  }
  return token;
}

module.exports = { DB_TOKEN_SCOPE, AUTH_MODES, requireDbSettings, createCredential, getDbAccessToken };
