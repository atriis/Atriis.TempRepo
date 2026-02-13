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
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
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
