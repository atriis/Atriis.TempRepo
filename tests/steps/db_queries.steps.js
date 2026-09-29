require("module-alias/register");
const { When, Then } = require("@cucumber/cucumber");
const { DbQueries } = require("@dsl");
const config = require("@config/config");
const logger = require("@utils/logger").child("DbQueriesSteps");

// The first DB step of a worker may wait on an interactive Entra sign-in (DB_AUTHENTICATION=entra-mfa).
const CONNECTING_STEP_TIMEOUT_MS = 5 * 60 * 1000;
// Polling waits up to DbQueries.MAX_POLL_SECONDS on top of a possible first connection.
const POLLING_STEP_TIMEOUT_MS = (DbQueries.MAX_POLL_SECONDS + 5 * 60) * 1000;

const QUOTED = '"([^"]*)"';
const OPERATOR = "(be|not be|contain|not contain|be greater than|be less than)";

// Same switch PayloadValidation has: DB_QUERIES_ENABLED=false turns every DB step into a logged no-op.
async function runDbStep(world, stepName, metadata, action) {
  if (!config.db.enabled) {
    logger.warn("DB_QUERIES_ENABLED=false: DB step skipped", { step: stepName, ...metadata });
    return;
  }
  await action();
}

When("I run the DB query {string}", { timeout: CONNECTING_STEP_TIMEOUT_MS }, async function (name) {
  await runDbStep(this, "runQuery", { name }, () => DbQueries.runQuery(this, name));
});

When("I run the DB query {string} with:", { timeout: CONNECTING_STEP_TIMEOUT_MS }, async function (name, dataTable) {
  await runDbStep(this, "runQuery", { name }, () => DbQueries.runQuery(this, name, DbQueries.overridesFromTable(dataTable.raw())));
});

Then("the DB result should have {int} row(s)", async function (count) {
  await runDbStep(this, "expectRowCount", { count }, () => DbQueries.expectRowCount(this, count));
});

Then("the DB result should have at least {int} row(s)", async function (count) {
  await runDbStep(this, "expectRowCount", { count, atLeast: true }, () => DbQueries.expectRowCount(this, count, { atLeast: true }));
});

Then(new RegExp(`^the DB result column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectColumn", { column, op, expected }, () => DbQueries.expectColumn(this, { column, op, expected }));
});

Then(new RegExp(`^the DB result row (\\d+) column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (row, column, op, expected) {
  await runDbStep(this, "expectColumn", { row, column, op, expected }, () =>
    DbQueries.expectColumn(this, { row: Number(row), column, op, expected })
  );
});

Then(new RegExp(`^every DB result row column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectEveryRow", { column, op, expected }, () => DbQueries.expectEveryRow(this, { column, op, expected }));
});

Then(new RegExp(`^any DB result row column ${QUOTED} should ${OPERATOR} ${QUOTED}$`), async function (column, op, expected) {
  await runDbStep(this, "expectAnyRow", { column, op, expected }, () => DbQueries.expectAnyRow(this, { column, op, expected }));
});

Then(new RegExp(`^the DB result column ${QUOTED} should (be empty|not be empty)$`), async function (column, state) {
  await runDbStep(this, "expectColumnState", { column, state }, () => DbQueries.expectColumnState(this, { column, state }));
});

Then("the DB result should contain rows:", async function (dataTable) {
  await runDbStep(this, "expectContainsRows", {}, () => DbQueries.expectContainsRows(this, dataTable.hashes()));
});

Then(
  "the DB query {string} column {string} should become {string} within {int} seconds",
  { timeout: POLLING_STEP_TIMEOUT_MS },
  async function (name, column, expected, seconds) {
    await runDbStep(this, "waitForColumn", { name, column, expected, seconds }, () =>
      DbQueries.waitForColumn(this, { name, column, expected, seconds })
    );
  }
);

Then(
  "the DB query {string} column {string} should become {string} within {int} seconds with:",
  { timeout: POLLING_STEP_TIMEOUT_MS },
  async function (name, column, expected, seconds, dataTable) {
    await runDbStep(this, "waitForColumn", { name, column, expected, seconds }, () =>
      DbQueries.waitForColumn(this, { name, column, expected, seconds, overrides: DbQueries.overridesFromTable(dataTable.raw()) })
    );
  }
);

When("I store the DB result column {string} as {string}", async function (column, worldKey) {
  await runDbStep(this, "storeColumn", { column, worldKey }, () => DbQueries.storeColumn(this, { column, worldKey }));
});

When("I store the DB result row {int} column {string} as {string}", async function (row, column, worldKey) {
  await runDbStep(this, "storeColumn", { row, column, worldKey }, () => DbQueries.storeColumn(this, { row, column, worldKey }));
});
