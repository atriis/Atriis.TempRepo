/**
 * Evolvi Search Step Definitions
 *
 * Maps Gherkin steps to EvolviSearch DSL methods for UK Rail search orchestration.
 * EvolviSearch DSL handles route selection, date picking, and search submission.
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
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviSearch } = require("@dsl");

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
