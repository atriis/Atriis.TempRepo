/**
 * UK Parking Step Definitions
 *
 * Maps Gherkin steps to DSL methods for UK airport parking flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for UK parking at {string}"
 *     → UKParkingSearch.searchUKParking(page, airport)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { UKParkingSearch } = require("../../src/dsl");
const logger = require("../../src/utils/logger").child("Parking");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for UK parking at {string}", async function (airport) {
  logger.info("Searching for UK parking", { airport });
  await UKParkingSearch.searchUKParking(this.page, airport);
});
