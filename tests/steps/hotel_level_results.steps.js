/**
 * Hotel Level Results Step Definitions
 *
 * Maps Gherkin steps to HotelLevelResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection:
 *   "I select the first hotel result"
 *   "I select a hotel with member rates"
 *
 * Assertions:
 *   "I should see member rates displayed in hotel level results"
 *     → HotelLevelResults.verifyMemberRatesDisplayed(page)
 *
 * ========================
 */

require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { HotelLevelResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("HotelResults");
const HotelLevelResultsPage = require("../../src/pages/HotelLevelResultsPage");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SELECTION
// ========================================
When("I filter hotel results by hotel name {string}", async function (hotelName) {
  logger.info(`Filtering hotel results by hotel name: ${hotelName}`);
  const hotelLevelResultsPage = new HotelLevelResultsPage(this.page);
  await hotelLevelResultsPage.filterByHotelName(hotelName);
});

When("I select the first hotel result", async function () {
  logger.info("Selecting first hotel option");
  await HotelLevelResults.clickFirstHotelOption(this.page);
});

When("I select a hotel with member rates", async function () {
  logger.info("Selecting first hotel with member rates");
  await HotelLevelResults.clickFirstHotelWithMemberRate(this.page);
});

When("I wait to see view rates text in results page", async function () {
  logger.info("Waiting to see view rates text in results page");
  const hotelLevelResultsPage = new HotelLevelResultsPage(this.page);
  await hotelLevelResultsPage.waitForViewRatesText();
});
// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("I should see member rates displayed in hotel level results", async function () {
  logger.info("Verifying member rates are displayed in hotel level results");
  const isVisible = await HotelLevelResults.verifyMemberRatesDisplayed(this.page);
  logger.info("Member rates verification result", { isVisible });
  expect(isVisible).toBe(true);
});