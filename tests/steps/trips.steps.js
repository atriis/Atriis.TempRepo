require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
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
  const title = await this.page.title();
  expect(title).not.toBe("");
});

Then("the user group label should be visible on the first trip", async function () {
  logger.info("Verifying user group label is visible on the first trip");
  await Trips.verifyUserGroupLabelVisibleOnFirstTrip(this.page);
});
