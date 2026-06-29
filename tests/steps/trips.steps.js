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
