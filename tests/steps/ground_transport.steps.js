/**
 * Ground Transport Step Definitions
 *
 * Maps Gherkin steps to DSL methods for ground transportation flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for ground transport from {string}"
 *     → GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(page, routeKey)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { GroundTransportSearch } = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for ground transport from {string}", async function (routeKey) {
  console.log(`Searching for ground transport: ${routeKey}`);
  await GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(this.page, routeKey);
});
