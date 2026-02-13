/**
 * Evolvi Results Step Definitions
 *
 * Maps Gherkin steps to EvolviResults DSL methods for UK Rail result selection.
 * EvolviResults DSL handles selecting options and adding trips to cart.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I add an Evolvi one way to the trip"
 *     → EvolviResults.addEvolviToTrip(page)
 *
 *   "I add an Evolvi round trip to the trip"
 *     → EvolviResults.addEvolviRoundtripToTrip(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviResults } = require("@dsl");
const logger = require("../../src/utils/logger").child("EvolviResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add an Evolvi one way to the trip", async function () {
  logger.info("Adding Evolvi one-way to trip");
  await EvolviResults.addEvolviToTrip(this.page);
});

When("I add an Evolvi round trip to the trip", async function () {
  logger.info("Adding Evolvi round trip to trip");
  await EvolviResults.addEvolviRoundtripToTrip(this.page);
});
