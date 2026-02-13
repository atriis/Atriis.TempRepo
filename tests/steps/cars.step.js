/**
 * Car Step Definitions
 *
 * Maps Gherkin steps to DSL methods for car-specific flows.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a car in {string}"
 *   "I search for a car in {string} with rental agency {string}"
 *
 * Selection:
 *   "I add the first car to cart"
 *   "I add the first city center car to cart"
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  CarSearch,
  CarResults,
} = require("../../src/dsl");
const logger = require("@utils/logger").child("Cars");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SEARCH
// ========================================

When("I search for a car in {string}", async function (place) {
  logger.info("Searching for car", { place });
  await CarSearch.searchCarByPlace(this.page, { place });
});

When("I search for a car in {string} with rental agency {string}", async function (place, agencyName) {
  logger.info("Searching for car with rental agency", { place, agencyName });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName);
});

// ========================================
// WHEN STEPS - CAR SELECTION
// ========================================

When("I add the first car to cart", async function () {
  logger.info("Adding first car to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});

When("I add the first city center car to cart", async function () {
  logger.info("Adding first city center car to cart");
  await CarResults.addCarCityCenterFromResultsPageToCart(this.page);
});
