/**
 * Evolvi Step Definitions
 *
 * Maps Gherkin steps to DSL methods for UK Rail (Evolvi) flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for a one way Evolvi train from {string}"
 *     → EvolviSearch.searchEvolviOneWay(page, routeKey)
 *
 *   "I search for a round trip Evolvi train from {string}"
 *     → EvolviSearch.searchEvolviRoundTrip(page, routeKey)
 *
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
const { EvolviSearch, EvolviResults } = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Evolvi train from {string}", async function (routeKey) {
  console.log(`Searching for one-way Evolvi train: ${routeKey}`);
  await EvolviSearch.searchEvolviOneWay(this.page, routeKey);
});

When("I search for a round trip Evolvi train from {string}", async function (routeKey) {
  console.log(`Searching for round trip Evolvi train: ${routeKey}`);
  await EvolviSearch.searchEvolviRoundTrip(this.page, routeKey);
});

When("I add an Evolvi one way to the trip", async function () {
  console.log("Adding Evolvi one-way to trip");
  await EvolviResults.addEvolviToTrip(this.page);
});

When("I add an Evolvi round trip to the trip", async function () {
  console.log("Adding Evolvi round trip to trip");
  await EvolviResults.addEvolviRoundtripToTrip(this.page);
});
