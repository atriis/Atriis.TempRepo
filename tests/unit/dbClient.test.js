require("module-alias/register");
const test = require("node:test");
const assert = require("node:assert/strict");
const { DbQueryError } = require("@utils/dbQueryError");
const dbClient = require("@utils/dbClient");

test("Decimal binds with scale so fractional originals restore exactly", () => {
  const decimal = dbClient.toSqlType("Decimal");
  assert.equal(decimal.precision, 38);
  assert.equal(decimal.scale, 10);
  assert.equal(dbClient.sqlTypeDeclaration("Decimal"), "decimal(38,10)");
});

test("every supported type has a driver type and a SQL declaration", () => {
  for (const type of ["Int", "BigInt", "NVarChar", "VarChar", "Bit", "DateTime2", "Decimal", "UniqueIdentifier"]) {
    assert.ok(dbClient.toSqlType(type), type);
    assert.match(dbClient.sqlTypeDeclaration(type), /^[a-z0-9(),]+$/, type);
  }
  assert.throws(() => dbClient.toSqlType("Money"), (error) => error instanceof DbQueryError && error.code === "POLICY");
});

test("close() without a pool is a no-op", async () => {
  await dbClient.close();
});
