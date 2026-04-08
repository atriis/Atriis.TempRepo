require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightPricing } = require("@dsl");
const FlightPricingPage = require("@pages/FlightPricingPage");
const logger = require("@utils/logger").child("FlightPricing");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FARE SELECTION
// ========================================

When('I add {string} fare to trip', async function (fareTitle) {
  logger.info('Adding fare to trip', { fareTitle });
  await FlightPricing.addFareToCart(this.page, fareTitle);
});

When('I wait for {string} text to be visible', async function (fareTitle) {
  logger.info('Waiting for pricing fare text to be visible', { fareTitle });
  const flightPricingPage = new FlightPricingPage(this.page);

  await flightPricingPage.waitForFareTitleText(fareTitle);
});

When('I extract the price from {string} fare', async function (fareTitle) {
  logger.info('Extracting fare price from by-schedule pricing page', { fareTitle });

  const price = await FlightPricing.extractFarePrice(this.page, fareTitle);

  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);

  logger.info('Extracted fare price from by-schedule pricing page', { fareTitle, price });
});

Then('the agreement indicator should be visible in the pricing page', async function () {
  logger.info('Verifying agreement indicator is visible in by-schedule pricing page');
  await FlightPricing.verifyAgreementIndicatorVisible(this.page);
});
