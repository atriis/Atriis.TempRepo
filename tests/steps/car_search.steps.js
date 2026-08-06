require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarSearch } = require("../../src/dsl");
const { ResultsPage } = require("@pages/ResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("CarSearch");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SEARCH
// ========================================

When("I search for a car at {string} with {int} months ahead", async function (place, monthsAhead) {
  logger.info("Searching for car", { place, monthsAhead });
  await CarSearch.searchCarByPlace(this.page, place, monthsAhead);
});
When("I search for a car at {string}", async function (place) {
  logger.info("Searching for car", { place });
  this.carSearch = await CarSearch.searchCarByPlace(this.page, place);
});

// Explicit day-gap + drop-off time variant, used to control the billed rental duration:
// when the drop-off HOUR is later than the pick-up hour (left at the form's own default), the
// supplier bills an extra day on top of the calendar day gap.
When("I search for a car at {string} for {int} days with drop-off time {string}", async function (place, dayGap, dropoffTime) {
  logger.info("Searching for car with an explicit day gap and drop-off time", { place, dayGap, dropoffTime });
  this.carSearch = await CarSearch.searchCarByPlace(this.page, place, 3, {
    pickupIndex: 0,
    dropoffIndex: dayGap,
    dropoffTime,
  });
});

// Car search run from the cart's edit-search drawer (opened by the Car tile in the product
// carousel). No location parameter on purpose: the car drawer has no location field — it inherits
// the pick-up location from the trip. Use "I search for a car at {string} ..." when the location
// itself matters; that needs the standalone search page.
When("I search for a car with {int} months ahead from the cart drawer", async function (monthsAhead) {
  logger.info("Searching for car from cart drawer", { monthsAhead });
  this.carSearch = await CarSearch.searchCarFromCartDrawer(this.page, monthsAhead);
});

// Explicit day-gap + drop-off time variant of the cart-drawer search (see the standalone
// twin above for why an explicit drop-off time controls the billed rental duration).
// monthsAhead=0 (unlike the standalone variant's 3): the cart drawer's pickup calendar is
// pre-filled from the car already in the trip, so advancing further months would stack on top
// of that existing date instead of measuring from today. dropoffMonthAdvance=0 keeps the
// drop-off calendar on that SAME pre-filled month too, so dropoffIndex=dayGap lands exactly
// dayGap days after pick-up instead of a month+ away.
When("I search for a car for {int} days with drop-off time {string} from the cart drawer", async function (dayGap, dropoffTime) {
  logger.info("Searching for car from cart drawer with an explicit day gap and drop-off time", { dayGap, dropoffTime });
  this.carSearch = await CarSearch.searchCarFromCartDrawer(this.page, 0, {
    pickupIndex: 0,
    dropoffIndex: dayGap,
    dropoffTime,
    dropoffMonthAdvance: 0,
  });
});

// Fills the car search form and clicks Search, but does NOT wait for results.
// Use when the search is gated — a reference-fields popup must be handled first, or the search is
// intentionally blocked (e.g. an empty traveler slot). Mirrors "I initiate a hotel search ...".
When("I initiate a car search at {string}", async function (place) {
  logger.info("Initiating car search (no results wait)", { place });
  this.carSearch = await CarSearch.initiateCarSearch(this.page, place);
});

// City-center station-status twin: pins both pick-up/drop-off to a specific time of day (10 PM
// here is 22:00 in the "HH:mm" format initiateCarSearch/setTimeFieldTo expect). The literal
// "10:00 PM" wording is fixed, not parameterized, since it belongs to one specific scenario.
When("I initiate a car search at {string} with 10:00 PM pickup time and 10:00 PM drop off time", async function (place) {
  logger.info("Initiating car search with 10:00 PM pick-up/drop-off time (no results wait)", { place });
  this.carSearch = await CarSearch.initiateCarSearch(this.page, place, 3, {
    pickupTime: '22:00',
    dropoffTime: '22:00',
  });
});

// Agency-filtered twin of "I initiate a car search at {string}". Same non-blocking contract: the
// search is submitted but results are not awaited, so a gating popup (e.g. trip purpose) can be
// handled by the next step.
When("I initiate a car search at {string} with rental agency {string}", async function (place, agencyName) {
  logger.info("Initiating car search with agency (no results wait)", { place, agencyName });
  this.carSearch = await CarSearch.initiateCarSearchWithRentalAgency(this.page, place, agencyName);
});

When("I search for a car at {string} with rental agency {string} and {int} months ahead", async function (place, agencyName, monthsAhead) {
  logger.info("Searching for car with agency", { place, agencyName, monthsAhead });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName, monthsAhead);
});

When("I search for a car at {string} with rental agency {string}", async function (place, agencyName) {
  logger.info("Searching for car with agency", { place, agencyName });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName);
});

When("I search for a car from {string} to {string} with {int} months ahead", async function (pickupLocation, dropoffLocation, monthsAhead) {
  logger.info("Searching for car with different pickup and dropoff locations", { pickupLocation, dropoffLocation, monthsAhead });
  await CarSearch.searchCarWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation, monthsAhead);
});

When("I search for a car from {string} to {string}", async function (pickupLocation, dropoffLocation) {
  logger.info("Searching for car with different pickup and dropoff locations", { pickupLocation, dropoffLocation });
  await CarSearch.searchCarWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation);
});

// Agency-filtered twin of "I search for a car from {string} to {string}". Picks the agency before
// the location/date flow, so the results are restricted to that vendor on an airport-to-city (or
// any different drop-off) search.
When("I search for a car from {string} to {string} with rental agency {string} and {int} months ahead", async function (pickupLocation, dropoffLocation, agencyName, monthsAhead) {
  logger.info("Searching for car with agency and different pickup and dropoff locations", { pickupLocation, dropoffLocation, agencyName, monthsAhead });
  this.carSearch = await CarSearch.searchCarWithDifferentDropoffLocationAndRentalAgency(this.page, pickupLocation, dropoffLocation, agencyName, monthsAhead);
});

When("I search for a car from {string} to {string} with rental agency {string}", async function (pickupLocation, dropoffLocation, agencyName) {
  logger.info("Searching for car with agency and different pickup and dropoff locations", { pickupLocation, dropoffLocation, agencyName });
  this.carSearch = await CarSearch.searchCarWithDifferentDropoffLocationAndRentalAgency(this.page, pickupLocation, dropoffLocation, agencyName);
});

When("I select rental agency {string}", async function (agencyName) {
  logger.info("Selecting rental agency", { agencyName });
  await CarSearch.selectRentalAgencyByName(this.page, agencyName);
});

// ========================================
// WHEN STEPS - CAR SEARCH EDIT
// ========================================

When("I edit the car search from {string} to {string} with {int} months ahead", async function (pickupLocation, dropoffLocation, monthsAhead) {
  logger.info("Editing car search with different pickup and dropoff locations", { pickupLocation, dropoffLocation, monthsAhead });
  await CarSearch.editCarSearchWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation, monthsAhead);
});

When("I edit the car search from {string} to {string}", async function (pickupLocation, dropoffLocation) {
  logger.info("Editing car search with different pickup and dropoff locations", { pickupLocation, dropoffLocation });
  await CarSearch.editCarSearchWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation);
});

// Edits an already-searched car to a new location without touching the rental dates — used when a
// second car search must reuse the exact dates of the first (see editCarSearchWithDifferentDropoffLocation's
// twin, which always drives both date pickers).
When("I edit the car search at {string} without changing dates", async function (newLocation) {
  logger.info("Editing car search location without changing dates", { newLocation });
  await CarSearch.editCarSearchLocation(this.page, newLocation);
});

// ========================================
// WHEN STEPS - CAR SEARCH EXPECTING NO RESULTS
// ========================================

When("I search for a car at {string} with rental agency {string} no results should be returned", async function (location, agency) {
  logger.info("Searching for car at location with rental agency, expecting no results", { location, agency });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, location, agency, 3, { maxRetries: 0 });
  const resultsPage = getPageObject(this.page, ResultsPage);
  await resultsPage.waitForNoResults();
});

// ========================================
// SUGGESTED CAR SEARCH (cross-sell from trip overview)
// ========================================

Then("the suggested car rental cross-sell should be displayed", async function () {
  logger.info("Verifying the suggested car rental cross-sell is displayed on the trip overview");
  await CarSearch.verifySuggestedCarCrossSellDisplayed(this.page);
});

When("I open the suggested car search form", async function () {
  logger.info("Opening the suggested car search form from the cross-sell");
  await CarSearch.openSuggestedCarSearchForm(this.page);
});

Then("the car search form should be displayed", async function () {
  logger.info("Verifying the car search form is displayed");
  await CarSearch.verifyCarSearchFormDisplayed(this.page);
});

Then("the car search form destination should be {string}", async function (expectedDestination) {
  logger.info("Verifying the car search form destination", { expectedDestination });
  this.carSearchFormDestination = await CarSearch.verifyCarSearchFormDestination(this.page, expectedDestination);
});
