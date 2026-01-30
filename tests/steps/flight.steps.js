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
 * ========================
 */

require('module-alias/register');

const { When, setDefaultTimeout } = require('@cucumber/cucumber');
const {
  FlightSearch,
  FlightResults,
  FlightPricing,
} = require('../../src/dsl');

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When('I search for a one way flight from {string}', async function (routeKey) {
  console.log(`Searching for one-way flight: ${routeKey}`);
  await FlightSearch.searchFlightOneWay(this.page, routeKey);
});

When('I search for a round trip flight from {string} to {string}', async function (from, to) {
  console.log(`Searching for round trip flight: ${from} → ${to}`);
  await FlightSearch.searchFlightRoundTrip(this.page, { from, to });
});

When('I search for a flight by schedule from {string} to {string}', async function (from, to) {
  console.log(`Searching for flight by schedule: ${from} → ${to}`);
  await FlightSearch.searchFlightBySchedule(this.page, { from, to });
});

When('I add the first flight to cart', async function () {
  console.log('Adding first flight to cart');
  await FlightResults.addFirstFlightToCart(this.page);
});

When('I select flight segments by schedule', async function () {
  console.log('Selecting flight segments by schedule');
  await FlightResults.selectSegmentsBySchedule(this.page);
});

When('I add the selected fare to cart', async function () {
  console.log('Adding selected fare to cart');
  await FlightPricing.addYourSelectionFareToCart(this.page);
});