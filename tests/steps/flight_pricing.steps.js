/**
 * Flight Pricing Step Definitions
 *
 * Maps Gherkin steps to FlightPricing DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Fare Selection:
 *   "I add the selected fare to cart"
 *   "I wait for \"Your Selection\" text to be visible"
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

When('I add "Your Selection" fare to trip', async function () {
  console.log('Adding "Your Selection" fare to trip');
  await FlightPricing.addYourSelectionFareToCart(this.page);
});

When('I wait for "Your Selection" text to be visible', async function () {
  console.log('Waiting for "Your Selection" text to be visible');
  const FlightPricingPage = require("../../src/pages/FlightPricingPage");
  const flightPricingPage = new FlightPricingPage(this.page);
  
  await flightPricingPage.waitForYourSelectionText();
});
