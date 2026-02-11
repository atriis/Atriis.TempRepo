/**
 * Benerail Step Definitions
 *
 * Maps Gherkin steps to DSL methods for EU Rail (Benerail) flows.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a one way Benerail train from {string}"
 *   "I search for a round trip Benerail train from {string}"
 *
 * Selection:
 *   "I select the first Benerail option"
 *   "I add a Benerail one way to the trip"
 *   "I add a Benerail round trip to the trip"
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { BenerailSearch, BenerailResults } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - BENERAIL SEARCH
// ========================================

When("I search for a one way Benerail train from {string}", async function (routeKey) {
  console.log(`Searching for one-way Benerail train: ${routeKey}`);
  await BenerailSearch.searchBenerailOneWay(this.page, routeKey);
});

When("I search for a round trip Benerail train from {string}", async function (routeKey) {
  console.log(`Searching for round trip Benerail train: ${routeKey}`);
  await BenerailSearch.searchBenerailRoundTrip(this.page, routeKey);
});

// ========================================
// WHEN STEPS - BENERAIL SELECTION
// ========================================

When("I add a Benerail one way to the trip", async function () {
  console.log("Adding Benerail one-way to trip");
  await BenerailResults.addBenerailOneWayToTrip(this.page);
});

When("I add a Benerail round trip to the trip", async function () {
  console.log("Adding Benerail round trip to trip");
  await BenerailResults.addBenerailRoundtripToTrip(this.page);
});

When("I select the first Benerail option", async function () {
  console.log("Selecting first Benerail option");
  await BenerailResults.waitAndSelectFirstBenerailOption(this.page);
});
