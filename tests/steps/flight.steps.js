/**
 * Flight Step Definitions
 *
 * Maps Gherkin steps to DSL methods for flight-specific flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for a one-way flight from {string}"
 *     → FlightSearch.searchFlightOneWay(page, routeKey)
 *
 *   "I search for a round trip flight from {string} to {string}"
 *     → FlightSearch.searchFlightRoundTrip(page, { from, to })
 *
 *   "I search for a flight by schedule from {string} to {string}"
 *     → FlightSearch.searchFlightBySchedule(page, { from, to })
 *
 *   "I add the first flight to cart"
 *     → FlightResults.addFirstFlightToCart(page)
 *
 *   "I select flight segments by schedule"
 *     → FlightResults.selectSegmentsBySchedule(page)
 *
 *   "I add the selected fare to cart"
 *     → FlightPricing.addYourSelectionFareToCart(page)
 *
 *   "I search for a random one way flight"
 *     → FlightSearch.searchOneWayRandomFlight(page)
 *
 *   "I search for a random one way flight in {string}"
 *     → FlightSearch.searchOneWayRandomFlight(page, region)
 *
 *   "I search for a random round trip flight"
 *     → FlightSearch.searchRoundTripRandomFlight(page)
 *
 *   "I search for a random round trip flight in {string}"
 *     → FlightSearch.searchRoundTripRandomFlight(page, region)
 *
 *   "I select one flight segment by schedule"
 *     → FlightResults.selectOneSegmentBySchedule(page)
 *
 * Then Steps:
 *   "flight results should be available"
 *     → FlightResults.isResultDisplayed(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const {
  FlightSearch,
  FlightResults,
  FlightPricing,
} = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way flight from {string}", async function (routeKey) {
  console.log(`Searching for one-way flight: ${routeKey}`);
  await FlightSearch.searchFlightOneWay(this.page, routeKey);
});

When("I search for a round trip flight from {string} to {string}", async function (from, to) {
  console.log(`Searching for round trip flight: ${from} → ${to}`);
  await FlightSearch.searchFlightRoundTrip(this.page, { from, to });
});

When("I search for a flight by schedule from {string} to {string}", async function (from, to) {
  console.log(`Searching for flight by schedule: ${from} → ${to}`);
  await FlightSearch.searchFlightBySchedule(this.page, { from, to });
});

When("I add the first flight to cart", async function () {
  console.log("Adding first flight to cart");
  await FlightResults.addFirstFlightToCart(this.page);
});

When("I select flight segments by schedule", async function () {
  console.log("Selecting flight segments by schedule");
  await FlightResults.selectSegmentsBySchedule(this.page);
});

When("I add the selected fare to cart", async function () {
  console.log("Adding selected fare to cart");
  await FlightPricing.addYourSelectionFareToCart(this.page);
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

When("I select one flight segment by schedule", async function () {
  console.log("Selecting one flight segment by schedule");
  await FlightResults.selectOneSegmentBySchedule(this.page);
});

// ===== THEN STEPS =====

Then("flight results should be available", async function () {
  console.log("Verifying flight results are available");
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
});
