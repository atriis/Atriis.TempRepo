require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { ClientSecretCredential, AzureCliCredential, InteractiveBrowserCredential } = require("@azure/identity");
const { DbQueryError } = require("@utils/dbQueryError");
const config = require("@config/config");
const credential = require("@utils/dbCredential");

const TENANT = "00000000-0000-0000-0000-000000000000";
const BASE = { serverName: "srv.database.windows.net", databaseName: "app" };

function errorWith(code, fragment) {
  return (error) => error instanceof DbQueryError && error.code === code && error.message.includes(fragment);
}

test("config.db defaults: enabled, 30s timeout, empty strings", () => {
  const saved = { ...process.env };
  try {
    for (const key of Object.keys(process.env)) if (key.startsWith("DB_")) delete process.env[key];
    assert.equal(config.db.enabled, true);
    assert.equal(config.db.timeoutMs, 30000);
    assert.equal(config.db.serverName, "");
    process.env.DB_QUERIES_ENABLED = "false";
    assert.equal(config.db.enabled, false);
  } finally {
    process.env = saved;
  }
});

test("requireDbSettings names the mode and every missing variable", () => {
  assert.throws(
    () => credential.requireDbSettings({ ...BASE, authentication: "service-principal", tenantId: TENANT, clientId: "c", clientSecret: "" }),
    errorWith("CONFIG", "DB_AUTHENTICATION=service-principal requires DB_CLIENT_SECRET"),
  );
  assert.throws(
    () => credential.requireDbSettings({ authentication: "azure-cli" }),
    errorWith("CONFIG", "DB_AUTHENTICATION=azure-cli requires DB_SERVER_NAME, DB_DATABASE_NAME"),
  );
  assert.throws(() => credential.requireDbSettings({ ...BASE, authentication: "entra-mfa" }), errorWith("CONFIG", "requires DB_USER_NAME"));
  assert.throws(
    () => credential.requireDbSettings({ ...BASE, authentication: "password" }),
    errorWith("CONFIG", "DB_AUTHENTICATION must be one of entra-mfa, service-principal, azure-cli"),
  );
  assert.equal(credential.requireDbSettings({ ...BASE, authentication: "azure-cli" }), "azure-cli");
});

test("createCredential maps each mode to its @azure/identity credential", () => {
  assert.ok(credential.createCredential({ ...BASE, authentication: "azure-cli" }) instanceof AzureCliCredential);
  assert.ok(
    credential.createCredential({ ...BASE, authentication: "service-principal", tenantId: TENANT, clientId: "c", clientSecret: "s" }) instanceof
      ClientSecretCredential,
  );
  assert.ok(credential.createCredential({ ...BASE, authentication: "entra-mfa", userName: "me@corp.com" }) instanceof InteractiveBrowserCredential);
});

test("getDbAccessToken wraps credential failures as AUTH with a hint", async () => {
  const failing = { getToken: async () => { throw new Error("not logged in"); } };
  await assert.rejects(credential.getDbAccessToken(failing, "azure-cli"), errorWith("AUTH", "run `az login`"));
  const empty = { getToken: async () => null };
  await assert.rejects(credential.getDbAccessToken(empty, "azure-cli"), errorWith("AUTH", "returned no token"));
  const ok = { getToken: async (scope) => ({ token: scope, expiresOnTimestamp: 1 }) };
  assert.equal((await credential.getDbAccessToken(ok, "azure-cli")).token, "https://database.windows.net/.default");
});
