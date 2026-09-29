require("module-alias/register");

/**
 * DB query cleanup. Separate from hooks.js on purpose: its After returns early when the scenario
 * never opened a page, and restores must run no matter how (or whether) the browser part went.
 */
const { After, AfterAll } = require("@cucumber/cucumber");
const config = require("@config/config");
const { DbQueries } = require("@dsl");
const dbClient = require("@utils/dbClient");

// Runs on pass and on fail. A failed restore fails the scenario and attaches what was left behind.
After(async function () {
  if (!config.db.enabled) return;
  if (!Array.isArray(this.dbRestores) || !this.dbRestores.length) return;
  try {
    await DbQueries.runPendingRestores(this);
  } catch (error) {
    if (error.failures) {
      this.attach(JSON.stringify(error.failures, null, 2), "application/json");
    }
    throw error;
  }
});

// One pool per worker process; close it so the worker can exit.
AfterAll(async function () {
  await dbClient.close();
});
