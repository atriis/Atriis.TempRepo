/**
 * Flight Pricing Step Definitions
 *
 * Maps Gherkin steps to FlightPricing DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Fare Selection:
 *   "I add the selected fare to cart"
 *
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightPricing } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FARE SELECTION
// ========================================

When("I add the selected fare to cart", async function () {
  console.log("Adding selected fare to cart");
  await FlightPricing.addYourSelectionFareToCart(this.page);
});
