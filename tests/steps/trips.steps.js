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
