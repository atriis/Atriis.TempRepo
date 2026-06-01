require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightPricing } = require("@dsl");
const logger = require("@utils/logger").child("FlightPricing");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FARE SELECTION
// ========================================

When('I add {string} fare to trip', async function (fareTitle) {
  logger.info('Adding fare to trip', { fareTitle });
  await FlightPricing.addFareToCart(this.page, fareTitle);
});

When('I add the first Additional pricing options fare to trip', async function () {
  logger.info('Adding the first Additional pricing options fare to trip');
  await FlightPricing.addFirstAdditionalPricingOptionToCart(this.page);
});

When('I wait for {string} text to be visible', async function (fareTitle) {
  logger.info('Waiting for pricing fare text to be visible', { fareTitle });
  await FlightPricing.waitForFareTitle(this.page, fareTitle);
});

When('I extract the price from {string} fare', async function (fareTitle) {
  logger.info('Extracting fare price from by-schedule pricing page', { fareTitle });

  const price = await FlightPricing.extractFarePrice(this.page, fareTitle);

  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);

  logger.info('Extracted fare price from by-schedule pricing page', { fareTitle, price });
});

Then('the {string} indicator should be visible in the pricing page', async function (indicatorName) {
  logger.info('Verifying indicator is visible in pricing page', { indicatorName });
  if (indicatorName === 'Separated Tickets') {
    const result = await FlightPricing.verifySeparatedTicketsIndicatorVisible(this.page);
    logger.info('Separated Tickets indicator verified', result);
  } else if (indicatorName === 'Agreement') {
    await FlightPricing.verifyAgreementIndicatorVisible(this.page);
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported: "Agreement", "Separated Tickets"`);
  }
});

Then('the {string} indicator should not be visible in the pricing page', async function (indicatorName) {
  logger.info('Verifying indicator is NOT visible in pricing page', { indicatorName });
  if (indicatorName === 'Separated Tickets') {
    await FlightPricing.verifySeparatedTicketsIndicatorNotVisible(this.page);
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported (negation): "Separated Tickets"`);
  }
});

Then('flight times on the pricing page should be displayed in 12-hour AM/PM format', async function () {
  logger.info('Verifying flight times are in 12-hour AM/PM format on the pricing page');
  await FlightPricing.verifyTimesAreIn12HourFormat(this.page);
});
Then('flight times on the pricing page should use the same format as the results page', async function () {
  logger.info('Verifying flight time format is consistent between results and pricing pages');
  const result = await FlightPricing.verifyCrossPageTimeFormatConsistency(this.page, this.resultsPageTimes);
  logger.info('Cross-page time format consistency verified', {
    resultsTimesCount: result.resultsTimesCount,
    pricingTimesCount: result.pricingTimesCount,
  });
});

// ========================================
// NETWORK INTERCEPTION - MARKUP VALIDATION
// ========================================

When('I start intercepting the flight pricing response', function () {
  logger.info('Starting flightPricing API response capture');
  this.flightPricingResponsePromise = FlightPricing.startCapturingPricingResponse(this.page);
});

Then('the markup in the flight pricing response should be {string} per pax configured in {string}', async function (expectedMarkup, configuredCurrency) {
  logger.info('Validating markup in flightPricing response against configured currency', { expectedMarkup, configuredCurrency });
  const result = await FlightPricing.validatePricingResponseMarkup(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, expectedMarkup, configuredCurrency
  );
  logger.info('Markup validation complete', result);
});

Then('the markup in the flight pricing response for carrier {string} should be {string} per pax configured in {string}', async function (carrierCode, expectedMarkup, configuredCurrency) {
  logger.info('Validating markup in flightPricing response for specific carrier', { carrierCode, expectedMarkup, configuredCurrency });
  const result = await FlightPricing.validatePricingResponseMarkup(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, expectedMarkup, configuredCurrency, carrierCode
  );
  logger.info('Markup validation complete', result);
});

Then('the markup in the flight pricing response should be {string}', async function (expectedMarkup) {
  logger.info('Validating markup value in flightPricing response (no currency check)', { expectedMarkup });
  const result = await FlightPricing.validatePricingResponseMarkup(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, expectedMarkup, null
  );
  logger.info('Markup validation complete', result);
});

// NOTE: Total price consistency (totalPriceDisplayCurrency == wholePrice + markup) is now validated
// via the generic step in common.steps.js:
//   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "markup"
//   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "flightPricing.DisplayMarkup"