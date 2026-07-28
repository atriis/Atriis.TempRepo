require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Trips } = require("@dsl");
const logger = require("@utils/logger").child("Trips");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I navigate to the trips page", async function () {
  logger.info("Navigating to Trips page");
  await Trips.navigateToTripsPage(this.page);
});

When("I click active trips tab", async function () {
  logger.info("Clicking active trips tab");
  await Trips.switchToInTravelTripsTab(this.page);
});

When("I click the first trip from the trip list", async function () {
  logger.info("Clicking the first trip from the trip list");
  // A trip opens in a new tab for bookers/no-corp users and in the same tab for
  // travelers — reassign this.page to whichever tab now shows the trip.
  this.page = await Trips.clickFirstTrip(this.page);
});

When("I open the trip overview tab", async function () {
  logger.info("Opening the trip Overview tab");
  await Trips.openTripOverviewTab(this.page);
});

// ===== THEN STEPS =====

Then("the trips page should be loaded", async function () {
  logger.info("Verifying trips page is loaded");
  await Trips.verifyTripsPageLoaded(this.page);
});

Then("the user group label should be visible on the first trip", async function () {
  logger.info("Verifying user group label is visible on the first trip");
  await Trips.verifyUserGroupLabelVisibleOnFirstTrip(this.page);
});

Then('the {string} filter checkbox should be visible on the trips page', async function (checkboxLabel) {
  logger.debug(`Verifying filter checkbox "${checkboxLabel}" is visible on the trips page`);
  await Trips.verifyMyTripsOnlyCheckboxVisible(this.page);
});

Then('the {string} filter should be checked on the trips page', async function (checkboxLabel) {
  logger.debug(`Verifying filter checkbox "${checkboxLabel}" is checked on the trips page`);
  await Trips.verifyMyTripsOnlyCheckboxChecked(this.page);
});

Then("the trip overview tab should be displayed", async function () {
  logger.info("Verifying the trip Overview tab is displayed");
  await Trips.verifyOverviewTabDisplayed(this.page);
});

Then("the trip should open in the same tab showing the trip overview page", async function () {
  logger.info("Verifying the trip opened in the same tab showing the trip overview");
  await Trips.verifyTripOpensInSameTab(this.page);
});

// ===== TODO STEPS (testim conversion: 54430 / 61638 / 69752) =====
// Bodies are unimplemented placeholders — @todo-pipeline implements the DSL/Page layers.

When("I search the trips page for {string}", async function (term) {
  logger.info("Searching the trips page", { term });
  await Trips.searchTripsPage(this.page, term);
});

When("I search the past trips for {string}", async function (term) {
  logger.info("Searching the past trips", { term });
  throw new Error(`TODO: implement 'I search the past trips for {string}' — type "${term}" into the past-trips search input`);
});

When("I submit the trips search", async function () {
  logger.info("Submitting the trips search");
  throw new Error("TODO: implement 'I submit the trips search' — press Enter on the trips search input to run the search");
});

When("I expand the trips search", async function () {
  logger.info("Expanding the trips search");
  await Trips.expandTripsSearch(this.page);
});

When("I check the {string} filter on the trips page", async function (filterLabel) {
  logger.info("Checking trips filter", { filterLabel });
  throw new Error(`TODO: implement 'I check the {string} filter on the trips page' — tick the "${filterLabel}" filter checkbox`);
});

When("I uncheck the {string} filter on the trips page", async function (filterLabel) {
  logger.info("Unchecking trips filter", { filterLabel });
  throw new Error(`TODO: implement 'I uncheck the {string} filter on the trips page' — untick the "${filterLabel}" filter checkbox`);
});

When("I click the {string} trips tab", async function (tabName) {
  logger.info("Clicking trips tab", { tabName });
  throw new Error(`TODO: implement 'I click the {string} trips tab' — click the "${tabName}" trips tab`);
});

When("I clear all trips filters", async function () {
  logger.info("Clearing all trips filters");
  await Trips.clearAllTripsFilters(this.page);
});

When("I open the trip status filter", async function () {
  logger.info("Opening the trip status filter");
  await Trips.openTripStatusFilter(this.page);
});

When("I filter the search results by trip status {string}", async function (status) {
  logger.info("Filtering search results by trip status", { status });
  await Trips.filterTripsByStatus(this.page, status);
});

Then("the trips search suggestions dropdown should be displayed", async function () {
  logger.info("Verifying trips search suggestions dropdown is displayed");
  throw new Error("TODO: implement 'the trips search suggestions dropdown should be displayed' — assert the search suggestions popper is visible");
});

Then("the trips search should offer to expand the search", async function () {
  logger.info("Verifying trips search offers to expand the search");
  await Trips.verifyTripsSearchOffersExpand(this.page);
});

Then("a search results tab should be displayed", async function () {
  logger.info("Verifying a search results tab is displayed");
  throw new Error("TODO: implement 'a search results tab should be displayed' — assert the 'Search results' tab is present");
});

Then("the search results tab should no longer be displayed", async function () {
  logger.info("Verifying the search results tab is no longer displayed");
  throw new Error("TODO: implement 'the search results tab should no longer be displayed' — assert the 'Search results' tab was removed after refresh");
});

Then("the search results should display a trip list", async function () {
  logger.info("Verifying the search results display a trip list");
  throw new Error("TODO: implement 'the search results should display a trip list' — assert the search-results pane renders trip cards");
});

Then("the search results should show a trip for traveller {string}", async function (traveller) {
  logger.info("Verifying search results show a trip for traveller", { traveller });
  throw new Error(`TODO: implement 'the search results should show a trip for traveller {string}' — assert a search-results trip lists "${traveller}" in its passengers`);
});

Then("the {string} trips tab should be displayed", async function (tabName) {
  logger.info("Verifying trips tab is displayed", { tabName });
  throw new Error(`TODO: implement 'the {string} trips tab should be displayed' — assert the "${tabName}" trips tab is shown`);
});

Then("the trips results count should be {string}", async function (expectedCount) {
  logger.info("Verifying trips results count", { expectedCount });
  throw new Error(`TODO: implement 'the trips results count should be {string}' — assert the active pane results count equals "${expectedCount}"`);
});

Then("the first past trip should display the {string} label", async function (label) {
  logger.info("Verifying first past trip label", { label });
  throw new Error(`TODO: implement 'the first past trip should display the {string} label' — assert the first past trip shows the "${label}" label`);
});

Then("the trips search results header should contain {string}", async function (expectedText) {
  logger.info("Verifying trips search results header", { expectedText });
  await Trips.verifyTripsSearchResultsHeaderContains(this.page, expectedText);
});

Then("the trips search should display no results", async function () {
  logger.info("Verifying trips search displays no results");
  await Trips.verifyTripsSearchNoResults(this.page);
});

Then("the traveller name should be displayed as {string} with tooltip {string}", async function (displayName, tooltip) {
  logger.info("Verifying truncated traveller name and tooltip", { displayName, tooltip });
  throw new Error(`TODO: implement 'the traveller name should be displayed as {string} with tooltip {string}' — assert the name reads "${displayName}" and its title tooltip is "${tooltip}"`);
});

Then("the trip status label {string} should be displayed", async function (status) {
  logger.info("Verifying trip status label is displayed", { status });
  await Trips.verifyTripStatusLabelDisplayed(this.page, status);
});

Then("the trip with id {string} should be displayed in the results", async function (tripId) {
  logger.info("Verifying trip id is displayed in results", { tripId });
  await Trips.verifyTripDisplayedById(this.page, tripId);
});
