require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Trips } = require("@dsl");
const logger = require("@utils/logger").child("Trips");

setDefaultTimeout(120000);

// Visible label of the tab my-trips.vue renders for a submitted search. The two
// steps below name it in their phrase instead of taking it as a parameter, so it
// is declared once here rather than repeated at each call site.
const SEARCH_RESULTS_TAB = "Search results";

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

Then("the {string} filter switch should be visible on the trips page", async function (switchLabel) {
  logger.debug(`Verifying filter switch "${switchLabel}" is visible on the trips page`);
  await Trips.verifyMyTripsOnlySwitchVisible(this.page);
});

Then("the {string} filter switch should be toggled on", async function (switchLabel) {
  logger.debug(`Verifying filter switch "${switchLabel}" is toggled on`);
  await Trips.verifyMyTripsOnlySwitchOn(this.page);
});

Then("the {string} filter switch should be toggled off", async function (switchLabel) {
  logger.debug(`Verifying filter switch "${switchLabel}" is toggled off`);
  await Trips.verifyMyTripsOnlySwitchOff(this.page);
});

When("I turn the {string} filter switch on", async function (switchLabel) {
  logger.info(`Turning the "${switchLabel}" filter switch on`);
  await Trips.setMyTripsOnlyFilter(this.page, true);
});

When("I select the {string} quick view on the trips page", async function (label) {
  logger.info("Selecting trips quick view", { label });
  await Trips.selectQuickView(this.page, label);
});

Then("the trip with id {string} should be listed on the trips page", async function (tripId) {
  logger.info("Verifying trip is listed on the trips page", { tripId });
  await Trips.verifyTripListed(this.page, tripId);
});

Then("the trip with id {string} should not be listed on the trips page", async function (tripId) {
  logger.info("Verifying trip is not listed on the trips page", { tripId });
  await Trips.verifyTripNotListed(this.page, tripId);
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
  await Trips.submitTripsSearch(this.page);
});

When("I expand the trips search", async function () {
  logger.info("Expanding the trips search");
  await Trips.expandTripsSearch(this.page);
});

When("I check the {string} filter on the trips page", async function (filterLabel) {
  logger.info("Checking trips filter", { filterLabel });
  await Trips.checkTripsFilter(this.page, filterLabel);
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
  await Trips.verifyTripsSearchSuggestionsDisplayed(this.page);
});

Then("the trips search should offer to expand the search", async function () {
  logger.info("Verifying trips search offers to expand the search");
  await Trips.verifyTripsSearchOffersExpand(this.page);
});

Then("a search results tab should be displayed", async function () {
  logger.info("Verifying a search results tab is displayed");
  await Trips.verifyTripsTabDisplayed(this.page, SEARCH_RESULTS_TAB);
});

Then("the search results tab should no longer be displayed", async function () {
  logger.info("Verifying the search results tab is no longer displayed");
  await Trips.verifyTripsTabNotDisplayed(this.page, SEARCH_RESULTS_TAB);
});

Then("the search results should display a trip list", async function () {
  logger.info("Verifying the search results display a trip list");
  await Trips.verifySearchResultsTripListDisplayed(this.page);
});

Then("the search results should show a trip for traveller {string}", async function (traveller) {
  logger.info("Verifying search results show a trip for traveller", { traveller });
  await Trips.verifySearchResultsShowTraveller(this.page, traveller);
});

Then("the search results should not show a trip for traveller {string}", async function (traveller) {
  logger.info("Verifying search results do not show a trip for traveller", { traveller });
  await Trips.verifySearchResultsDoNotShowTraveller(this.page, traveller);
});

Then("the {string} trips tab should be displayed", async function (tabName) {
  logger.info("Verifying trips tab is displayed", { tabName });
  await Trips.verifyTripsTabDisplayed(this.page, tabName);
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
