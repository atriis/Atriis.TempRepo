/**
 * Benerail Results Step Definitions
 *
 * Maps Gherkin steps to BenerailResults DSL methods for EU Rail result selection.
 * BenerailResults DSL handles selecting options and adding trips to cart.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I select the first Benerail option"
 *     → BenerailResults.waitAndSelectFirstBenerailOption(page)
 *
 *   "I add a Benerail one way to the trip"
 *     → BenerailResults.addBenerailOneWayToTrip(page)
 *
 *   "I add a Benerail round trip to the trip"
 *     → BenerailResults.addBenerailRoundtripToTrip(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { BenerailResults } = require("@dsl");
const logger = require("../../src/utils/logger").child("BenerailResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I select the first Benerail option", async function () {
  logger.info("Selecting first Benerail option");
  await BenerailResults.waitAndSelectFirstBenerailOption(this.page);
});

When("I add a Benerail one way to the trip", async function () {
  logger.info("Adding Benerail one-way to trip");
  await BenerailResults.addBenerailOneWayToTrip(this.page);
});

When("I add a Benerail round trip to the trip", async function () {
  logger.info("Adding Benerail round trip to trip");
  await BenerailResults.addBenerailRoundtripToTrip(this.page);
});
