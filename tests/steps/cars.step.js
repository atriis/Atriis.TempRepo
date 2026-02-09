/**
 * Car Step Definitions
 *
 * Maps Gherkin steps to DSL methods for car-specific flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for a car in {string}"
 *     → CarSearch.searchCarByPlace(page, { place: location })
 *
 *   "I add the first car to cart"
 *     → CarResults.addCarAirportFromResultsPageToCart(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  CarSearch,
  CarResults,
} = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a car in {string}", async function (place) {
  console.log(`Searching for car in ${place}`);
  await CarSearch.searchCarByPlace(this.page, { place });
});

When("I add the first car to cart", async function () {
  console.log("Adding first car to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});
