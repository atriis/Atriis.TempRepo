/**
 * Evolvi Step Definitions
 *
 * Maps Gherkin steps to DSL methods for UK Rail (Evolvi) flows.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a one way Evolvi train from {string}"
 *   "I search for a round trip Evolvi train from {string}"
 *
 * Selection:
 *   "I add an Evolvi one way to the trip"
 *   "I add an Evolvi round trip to the trip"
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviSearch, EvolviResults } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - EVOLVI SEARCH
// ========================================

When("I search for a one way Evolvi train from {string}", async function (routeKey) {
  console.log(`Searching for one-way Evolvi train: ${routeKey}`);
  await EvolviSearch.searchEvolviOneWay(this.page, routeKey);
});

When("I search for a round trip Evolvi train from {string}", async function (routeKey) {
  console.log(`Searching for round trip Evolvi train: ${routeKey}`);
  await EvolviSearch.searchEvolviRoundTrip(this.page, routeKey);
});

// ========================================
// WHEN STEPS - EVOLVI SELECTION
// ========================================

When("I add an Evolvi one way to the trip", async function () {
  console.log("Adding Evolvi one-way to trip");
  await EvolviResults.addEvolviToTrip(this.page);
});

When("I add an Evolvi round trip to the trip", async function () {
  console.log("Adding Evolvi round trip to trip");
  await EvolviResults.addEvolviRoundtripToTrip(this.page);
});
