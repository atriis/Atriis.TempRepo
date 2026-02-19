/**
 * Car Results Step Definitions
 *
 * Maps Gherkin steps to CarResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection & Cart:
 *   "I add a car from airport results to cart"
 *   "I add a car from city center results to cart"
 *
 * Assertions:
 *   "the car location at index {int} should contain {string}"
 *     → CarResults.expectLocationToContain(page, index, expectedCity)
 *
 * ========================
 */

require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("CarResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SELECTION & CART
// ========================================

When("I add a car from airport results to cart", async function () {
  logger.info("Adding car from airport results to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});

When("I add a car from city center results to cart", async function () {
  logger.info("Adding car from city center results to cart");
  await CarResults.addCarCityCenterFromResultsPageToCart(this.page);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the car location at city center index {int} should contain {string}", async function (index, expectedCity) {
  logger.info("Verifying car location contains expected city", { index, expectedCity });
  await CarResults.expectLocationToContain(this.page, index, expectedCity);
});
