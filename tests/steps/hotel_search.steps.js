require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { HotelSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child("HotelSearch");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SEARCH
// ========================================

// Fills search form, clicks Search, and waits for results URL.
// Use when no popup appears after clicking Search.
When("I search for a hotel in {string} for {int} night(s)", async function (location, nights) {
  logger.info("Searching for hotel", { location, nights });
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights: nights });
});

When("I search for a hotel in {string} for {int} night(s) with {int} rooms", async function (location, nights, rooms) {
  logger.info("Searching for hotel with multiple rooms", { location, nights, rooms });
  await HotelSearch.searchHotelMultiRoom(this.page, { where: location, nights, rooms });
});

When("I search for a hotel in {string} for {int} night(s) from the cart drawer", async function (location, nights) {
  logger.info("Searching for hotel from cart drawer", { location, nights });
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights }, { fromDrawer: true });
});

// Fills search form and clicks Search, but does NOT wait for results URL.
// Use when a popup (e.g. trip purpose) appears after clicking Search and must be
// handled before results load. Follow with the popup step, then a wait-for-results step.
When("I initiate a hotel search in {string} for {int} night(s)", async function (location, nights) {
  logger.info("Initiating hotel search (no URL wait)", { location, nights });
  await HotelSearch.initiateHotelSearch(this.page, { where: location, nights });
});

When("I search for a hotel in {string} for {int} night(s) {int} months ahead", async function (location, nights, monthsAhead) {
  logger.info("Searching for hotel with custom months ahead", { location, nights, monthsAhead });
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights }, { monthsAhead });
});

When("I search for a hotel in {string} for {int} night(s) from next visible month", async function (location, nights) {
  logger.info("Searching for hotel from next visible month", { location, nights });
  await HotelSearch.searchHotelByNightsNextVisibleMonth(this.page, { where: location, nights });
});

When("I wait for hotel results to load", async function () {
  logger.info("Waiting for hotel results page to load");
  await HotelSearch.waitForHotelResults(this.page);
});

// ========================================
// THEN STEPS - HOTEL SEARCH
// ========================================

Then("the hotel search location should be pre-populated with {string}", async function (expectedAirport) {
  logger.info("Verifying hotel search location is pre-populated", { expectedAirport });
  await HotelSearch.verifyHotelSearchPrePopulated(this.page, expectedAirport);
});

When("I type {string} in the hotel search location field", async function (text) {
  logger.info("Typing in hotel search location field", { text });
  await HotelSearch.typeInHotelSearchLocationField(this.page, text);
});

Then("{string} should appear as a location suggestion in the dropdown", async function (expectedSuggestion) {
  logger.info("Verifying location suggestion is visible", { expectedSuggestion });
  await HotelSearch.verifyLocationSuggestionVisible(this.page, expectedSuggestion);
});

When("I open the hotel search and verify available properties only is checked", async function () {
  logger.info("Opening hotel search and verifying available properties checkbox");
  await HotelSearch.openHotelSearchAndVerifyAvailableProperties(this.page);
});

When("I edit the hotel search from results and verify available properties only is checked", async function () {
  logger.info("Editing hotel search from results and verifying available properties checkbox");
  await HotelSearch.editHotelSearchAndVerifyAvailableProperties(this.page);
});

When("I edit the hotel search from cart and verify available properties only is checked", async function () {
  logger.info("Editing hotel search from cart and verifying available properties checkbox");
  await HotelSearch.editHotelSearchFromCartAndVerifyAvailableProperties(this.page);
});

When("I search for a hotel by point of interest", async function () {
  logger.info("Searching for a hotel by selecting a Point of Interest");
  await HotelSearch.searchHotelByPointOfInterest(this.page);
});
