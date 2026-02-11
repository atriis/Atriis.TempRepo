/**
 * Flight Step Definitions
 *
 * Maps Gherkin steps to DSL methods for flight-specific flows.
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
 * Selection & Cart:
 *   "I select one flight segment by schedule"
 *   "I select flight segments by schedule"
 *   "I add the first flight to cart"
 *   "I add the selected fare to cart"
 *
 * Share Quote:
 *   "I click on the 'Share' button"
 *   "I select 2 options from carriers {string} and {string}"
 *   "I click on the 'Share' button to open the share dialog"
 *   "I scroll into offers and get prices"
 *
 * Assertions:
 *   "flight results should be available"
 *   "The shared price for carrier {string} should match the prices from results"
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
const { expectNumbersToBeEqual } = require("../../src/assertions/numberAssertions");

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

// ========================================
// WHEN STEPS - FLIGHT SELECTION & CART
// ========================================

When("I select one flight segment by schedule", async function () {
  console.log("Selecting one flight segment by schedule");
  await FlightResults.selectOneSegmentBySchedule(this.page);
});

When("I select flight segments by schedule", async function () {
  console.log("Selecting flight segments by schedule");
  await FlightResults.selectSegmentsBySchedule(this.page);
});

When("I add the first flight to cart", async function () {
  console.log("Adding first flight to cart");
  await FlightResults.addFirstFlightToCart(this.page);
});

When("I add the selected fare to cart", async function () {
  console.log("Adding selected fare to cart");
  await FlightPricing.addYourSelectionFareToCart(this.page);
});

// ========================================
// WHEN STEPS - SHARE QUOTE FLOW
// ========================================

When("I click on the 'Share' button", async function () {
  console.log("Clicking Share button");
  await FlightResults.waitForAddToTripButtonAndClickShareButton(this.page);
});

When("I select 2 options from carriers {string} and {string}", async function (carrier1, carrier2) {
  console.log(`Selecting 2 options from carriers ${carrier1} and ${carrier2}`);
  
  if (!this.resultsPrices) this.resultsPrices = {};
  if (!this.carriers) this.carriers = [];
  
  this.carriers[0] = carrier1;
  this.carriers[1] = carrier2;
  
  // Filter, get price, and share result at index 1 from carrier 1
  const result1 = await FlightResults.getPriceAndShareQuoteFromCarrier(this.page, carrier1, 1);
  this.resultsPrices[carrier1] = result1.price;
  console.log(`Stored ${carrier1} price: ${this.resultsPrices[carrier1]}`);
  
  // Filter, get price, and share result at index 1 from carrier 2
  const result2 = await FlightResults.getPriceAndShareQuoteFromCarrier(this.page, carrier2, 1);
  this.resultsPrices[carrier2] = result2.price;
  console.log(`Stored ${carrier2} price: ${this.resultsPrices[carrier2]}`);
});

When("I click on the 'Share' button to open the share dialog", async function () {
  console.log("Clicking Share button to open share dialog");
  const { ResultsPage } = require("../../src/pages/ResultsPage");
  const { CommonPage } = require("../../src/pages/CommonPage");
  const resultsPage = new ResultsPage(this.page);
  const commonPage = new CommonPage(this.page);
  
  await resultsPage.clickShareQuoteToGetEmailPopUp();
  await commonPage.waitForSubjectLabelSharePopUp();
});

When("I scroll into offers and get prices", async function () {
  console.log("Scrolling into offers and getting prices");
  const { sharedPrice1, sharedPrice2 } = await FlightResults.scrollIntoOffersAndGetPrices(this.page);
  
  // Store using carrier names as keys (swapped order as share dialog shows them reversed)
  if (!this.sharedPrices) this.sharedPrices = {};
  this.sharedPrices[this.carriers[0]] = sharedPrice2;
  this.sharedPrices[this.carriers[1]] = sharedPrice1;
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("flight results should be available", async function () {
  console.log("Verifying flight results are available");
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
});

Then("The shared price for carrier {string} should match the prices from results", async function (carrier) {
  const resultsPrice = this.resultsPrices[carrier];
  const sharedPrice = this.sharedPrices[carrier];
  
  expectNumbersToBeEqual(sharedPrice, resultsPrice, `${carrier} shared price`);
});