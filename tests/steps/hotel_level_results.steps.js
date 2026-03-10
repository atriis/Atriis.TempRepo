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

Then("the corporate rates badge should be visible on hotel level results", async function () {
  logger.info("Verifying corporate preferred badge is visible on hotel level results");
  await HotelLevelResults.verifyCorporatePreferredBadge(this.page);
  await this.page.pause();
});

Then("the CO2 emissions should be displayed in hotel level results", async function () {
  logger.info("Verifying CO2 emissions are displayed in hotel level results");
  const result = await HotelLevelResults.verifyCO2InHotelLevel(this.page);
  logger.info("CO2 verification result in hotel level", { visible: result.visible, value: result.value });
  expect(result.visible).toBe(true);
});
Then("the {string} supplier logo should be visible in hotel results", async function (supplierName) {
  logger.info("Verifying supplier logo is visible", { supplierName });
  const isVisible = await HotelLevelResults.verifySupplierLogo(this.page, supplierName);
  if (!isVisible) throw new Error(`Supplier logo for "${supplierName}" not visible in hotel results`);
});

Then("the sustainability filter checkbox should be enabled and clickable", async function () {
  logger.info("Verifying sustainability filter checkbox is enabled and clickable");
  await HotelLevelResults.verifySustainabilityFilterEnabled(this.page);
});

When("I sort hotel results by {string}", async function (label) {
  logger.info("Sorting hotel results by", { label });
  await HotelLevelResults.sortBy(this.page, label);
});

When("I select hotel result at index {int}", async function (index) {
  logger.info("Selecting hotel result by index", { index });
  await HotelLevelResults.clickHotelByIndex(this.page, index);
});

Then("hotel {int} should display the {string} amenity", async function (index, amenityName) {
  logger.info("Verifying amenity is displayed on hotel", { index, amenityName });
  await HotelLevelResults.verifyAmenityDisplayed(this.page, index, amenityName);
});

Then("hotel {int} should not display the {string} amenity", async function (index, amenityName) {
  logger.info("Verifying amenity is NOT displayed on hotel", { index, amenityName });
  await HotelLevelResults.verifyAmenityNotDisplayed(this.page, index, amenityName);
});

When("I edit the hotel search location to {string}", async function (newLocation) {
  logger.info("Editing hotel search location", { newLocation });
  await HotelLevelResults.editHotelSearchLocation(this.page, newLocation);
});

Then("the hotel results should be for the new location {string}", async function (expectedLocation) {
  logger.info("Verifying hotel results are for new location", { expectedLocation });
  await HotelLevelResults.verifyResultsLocation(this.page, expectedLocation);
});

When("I scroll through hotel filters", async function () {
  logger.info("Scrolling through hotel filters");
  await HotelLevelResults.scrollHotelFilters(this.page);
});

Then("I see hotel level filter sections", async function () {
  logger.info("Verifying hotel level filter sections are visible");
  await HotelLevelResults.verifyHotelFilters(this.page);
});

When("I apply hotel level filter {string} with option {string}", async function (filterName, optionText) {
  logger.info("Applying hotel level filter", { filterName, optionText });
  await HotelLevelResults.applyHotelFilter(this.page, filterName, optionText);
});

Then("the {string} filter tag should be visible in hotel results", async function (tagText) {
  logger.info("Verifying hotel filter tag is visible", { tagText });
  await HotelLevelResults.verifyHotelFilterTag(this.page, tagText);
});
