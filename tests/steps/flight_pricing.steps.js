require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightPricing } = require("@dsl");
const FlightPricingPage = require("@pages/FlightPricingPage");
const logger = require("@utils/logger").child("FlightPricing");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FARE SELECTION
// ========================================

When('I add "Your Selection" fare to trip', async function () {
  logger.info('Adding "Your Selection" fare to trip');
  await FlightPricing.addYourSelectionFareToCart(this.page);
});

When('I wait for "Your Selection" text to be visible', async function () {
  logger.info('Waiting for "Your Selection" text to be visible');
  const flightPricingPage = new FlightPricingPage(this.page);
  
  await flightPricingPage.waitForYourSelectionText();
});
