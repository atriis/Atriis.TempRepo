require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
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

When('I wait for the cheapest option to be visible', async function () {
  logger.info('Waiting for cheapest pricing option to be visible');
  await FlightPricing.waitForCheapestOption(this.page);
});

When('I extract the price from the cheapest option', async function () {
  logger.info('Extracting price from cheapest pricing option');
  const { price, type } = await FlightPricing.extractCheapestOptionPrice(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  this.cheapestOptionType = type;
  logger.info('Extracted cheapest option price', { price, type });
});

Then('the cheapest option price should not exceed the selected price', function () {
  const [cheapestPrice, yourSelectionPrice] = this.extractedPrices;

  if (this.cheapestOptionType === 'ribbon') {
    // The CHEAPEST ribbon means the user's selection IS the cheapest combination —
    // no separate cheaper card exists, so there is nothing to compare against.
    logger.info('Cheapest option is a ribbon on "Your selection" — selection is already the cheapest, price comparison skipped', { price: cheapestPrice });
    return;
  }

  logger.info('Comparing cheapest package price to your selection price', { cheapestPrice, yourSelectionPrice });
  expect(
    cheapestPrice,
    `Cheapest package price (${cheapestPrice}) should be ≤ Your selection price (${yourSelectionPrice})`
  ).toBeLessThanOrEqual(yourSelectionPrice);
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

// Side effect: stores the winning flightPricing response for the markup/select/cart steps.
When('I open pricing options for the first result with a published fare', async function () {
  const { responsePromise, resultIndex, attempts } = await FlightPricing.openFirstResultWithPublishedFare(this.page);
  this.lastInterceptedResponsePromise = responsePromise;
  this.flightPricingResponsePromise = responsePromise;
  logger.info('Opened pricing options for the first result with a published fare', { resultIndex, attempts });
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

// Side effect: stores publishedMuInclusivePrice for the fare-selection and cart steps.
Then('the origin-destination markup should be {string} percent of the base fare on the published fare', async function (percent) {
  logger.info('Validating origin-destination MU on the published fare', { percent });
  const result = await FlightPricing.validateOriginDestinationMarkup(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, percent
  );
  this.publishedMuInclusivePrice = result.muInclusivePerPax;
  logger.info('Origin-destination MU validated on published fare', result);
});

// NOTE: Total price consistency (totalPriceDisplayCurrency == wholePrice + markup) is now validated
// via the generic step in common.steps.js:
//   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "markup"
//   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "flightPricing.DisplayMarkup"

Then("the fare basis codes on the first and second tabs should differ", async function () {
  logger.info("Verifying fare basis codes differ between the first and second fare rules tabs");
  const result = await FlightPricing.verifyFareBasisCodesAreDifferentAcrossTabs(this.page);
  logger.info("Fare basis codes confirmed different across tabs", result);
});