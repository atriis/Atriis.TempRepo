/**
 * Flight Search Step Definitions
 *
 * Maps Gherkin steps to FlightSearch DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a one way flight from {string}"
 *   "I search for a one way flight from {string} to {string}"
 *   "I search for a round trip flight from {string} to {string}"
 *   "I search for a flight by schedule from {string} to {string}"
 *   "I search for a random one way flight"
 *   "I search for a random one way flight in {string}"
 *   "I search for a random round trip flight"
 *   "I search for a random round trip flight in {string}"
 *
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightSearch } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FLIGHT SEARCH
// ========================================

When("I search for a one way flight from {string}", async function (routeKey) {
  console.log(`Searching for one-way flight: ${routeKey}`);
  await FlightSearch.searchFlightOneWay(this.page, routeKey);
});

When("I search for a one way flight from {string} to {string}", async function (from, to) {
  console.log(`Searching for one-way flight: ${from} → ${to}`);
  await FlightSearch.searchFlightOneWay(this.page, { from, to });
});

When("I search for a round trip flight from {string} to {string}", async function (from, to) {
  console.log(`Searching for round trip flight: ${from} → ${to}`);
  await FlightSearch.searchFlightRoundTrip(this.page, { from, to });
});

When("I search for a flight by schedule from {string} to {string}", async function (from, to) {
  console.log(`Searching for flight by schedule: ${from} → ${to}`);
  await FlightSearch.searchFlightBySchedule(this.page, { from, to });
});

When("I search for a random one way flight", async function () {
  console.log("Searching for random one-way flight");
  await FlightSearch.searchOneWayRandomFlight(this.page);
});

When("I search for a random one way flight in {string}", async function (region) {
  console.log(`Searching for random one-way flight in: ${region}`);
  await FlightSearch.searchOneWayRandomFlight(this.page, region);
});

When("I search for a random round trip flight", async function () {
  console.log("Searching for random round trip flight");
  await FlightSearch.searchRoundTripRandomFlight(this.page);
});

When("I search for a random round trip flight in {string}", async function (region) {
  console.log(`Searching for random round trip flight in: ${region}`);
  await FlightSearch.searchRoundTripRandomFlight(this.page, region);
});
