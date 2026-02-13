/**
 * Car Search Step Definitions
 *
 * Maps Gherkin steps to CarSearch DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a car at {string}"
 *   "I search for a car at {string} with rental agency {string}"
 *   "I select rental agency {string}"
 *
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarSearch } = require("../../src/dsl");
const logger = require("../../src/utils/logger").child("CarSearch");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SEARCH
// ========================================

When("I search for a car at {string}", async function (place) {
  logger.info("Searching for car", { place });
  await CarSearch.searchCarByPlace(this.page, place);
});

When("I search for a car at {string} with rental agency {string}", async function (place, agencyName) {
  logger.info("Searching for car with agency", { place, agencyName });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName);
});

When("I select rental agency {string}", async function (agencyName) {
  logger.info("Selecting rental agency", { agencyName });
  await CarSearch.selectRentalAgencyByName(this.page, agencyName);
});
