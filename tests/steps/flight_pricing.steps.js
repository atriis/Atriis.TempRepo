require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightPricing } = require("@dsl");
const config = require("@config/config");
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

When('I add the cheapest option to trip', async function () {
  logger.info('Adding the cheapest pricing option to trip');
  const { type } = await FlightPricing.addCheapestOptionToCart(this.page);
  this.cheapestOptionType = type;
  logger.info('Cheapest pricing option added to trip', { type });
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

// ========================================
// AMADEUS PRIVATE FARES (ADO 77019)
// ========================================

// Payload steps: they read the trip's pricing replies and take `world`. Above the default timeout
// because the replies are downloaded one by one.
const FARE_PRIVACY_STEP_TIMEOUT_MS = 240000;

When("I capture whether each fare Amadeus priced in {string} is private from Storage", { timeout: FARE_PRIVACY_STEP_TIMEOUT_MS }, async function (requestType) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "captureAmadeusFarePrivacy", requestType });
    return;
  }
  logger.info("Capturing whether each priced Amadeus fare is private", {
    requestType,
    tripId: this.tripId || this.currentTripId || this.createdTripId || null,
  });
  const result = await FlightPricing.captureAmadeusFarePrivacy(this, requestType);
  logger.info("Amadeus fare privacy captured", { private: result.private, published: result.published });
});

Then("Amadeus should have priced at least {int} private fare(s)", function (atLeast) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "expectAmadeusPrivateFaresPriced", atLeast });
    return;
  }
  logger.info("Validating Amadeus priced private fares", { atLeast });
  const result = FlightPricing.expectAmadeusPrivateFaresPriced(this, atLeast);
  logger.info("Amadeus private fares priced", result);
});

Then("every fare in the flight pricing response should be badged \"Agency Private Fare\" only when Amadeus priced it private", async function () {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "verifyPricingResponseBadgesPrivateFares" });
    return;
  }
  logger.info("Comparing the flightPricing badges with the Amadeus pricing replies");
  const result = await FlightPricing.verifyPricingResponseBadgesPrivateFares(
    this, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise,
  );
  logger.info("flightPricing badges match the Amadeus pricing replies", result);
});

Then("the pricing options should show the agreement icon on the private fares only", async function () {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "verifyPricingOptionsShowPrivateFareIcon" });
    return;
  }
  logger.info("Validating the agreement icon marks the private fares in pricing options");
  const result = await FlightPricing.verifyPricingOptionsShowPrivateFareIcon(this.page, this);
  logger.info("Agreement icon marks the private fares", result);
});

// Side effect: stores the winning flightPricing response for the markup/select/cart steps.
When('I open pricing options for the first result with a published fare', async function () {
  const { responsePromise, resultIndex, attempts } = await FlightPricing.openFirstResultWithPublishedFare(this.page);
  this.lastInterceptedResponsePromise = responsePromise;
  this.flightPricingResponsePromise = responsePromise;
  logger.info('Opened pricing options for the first result with a published fare', { resultIndex, attempts });
});

// Side effect: stores the winning flightPricing response; only whole-trip published fares count (see isPublishedFare).
When("I open pricing options for the first result with a published whole-trip fare", async function () {
  const { responsePromise, resultIndex, attempts } = await FlightPricing.openFirstResultWithPublishedFare(this.page, { wholeTripFareOnly: true });
  this.lastInterceptedResponsePromise = responsePromise;
  this.flightPricingResponsePromise = responsePromise;
  logger.info("Opened pricing options for the first result with a published whole-trip fare", { resultIndex, attempts });
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

Then("the flight pricing request should send {string} as {string}", async function (field, expectedJson) {
  logger.info("Validating a field of the flightPricing request body", { field, expectedJson });
  await FlightPricing.verifyPricingRequestField(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, field, expectedJson,
  );
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

// Side effect: stores publishedMuInclusivePrice for the fare-selection and cart steps.
Then("the origin-destination markup should be {string} percent of the base fare on the published whole-trip fare", async function (percent) {
  logger.info("Validating origin-destination MU on the published whole-trip fare", { percent });
  const result = await FlightPricing.validateOriginDestinationMarkup(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, percent, { wholeTripFareOnly: true },
  );
  this.publishedMuInclusivePrice = result.muInclusivePerPax;
  logger.info("Origin-destination MU validated on published whole-trip fare", result);
});

// Same published-fare check as the percent-of-base variant below, but the configured percentage is
// expressed against wholePrice (which carries taxes), so the two yield different amounts. Travelfusion
// configures the MU this way. Stores publishedMuInclusivePrice for the cart.
Then('the management markup on the published fare should be {string} percent of the whole price', async function (percent) {
  logger.info('Validating the management markup is a percentage of the whole price on the published fare', { percent });
  const result = await FlightPricing.validateMarkupApplied(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, { expectedPercentOfWhole: percent }
  );
  this.publishedMuInclusivePrice = result.muInclusivePerPax;
  logger.info('Management markup percentage of whole price validated on published fare', result);
});

// Percent-of-base check on the published fare (Galileo-safe: no wholePrice/markup sum assumption);
// valid only on a single-qualifying-carrier itinerary. Stores publishedMuInclusivePrice for the cart.
Then('the management markup on the published fare should be {string} percent of the base fare', async function (percent) {
  logger.info('Validating the management markup is a percentage of the base fare on the published fare', { percent });
  const result = await FlightPricing.validateMarkupApplied(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise, { expectedPercentOfBase: percent }
  );
  this.publishedMuInclusivePrice = result.muInclusivePerPax;
  logger.info('Management markup percentage validated on published fare', result);
});

// Side effect: stores publishedMuInclusivePrice for the fare-selection and cart steps.
Then('the published fare price should include the management markup', async function () {
  logger.info('Validating the management markup is included on the published fare');
  const result = await FlightPricing.validateMarkupIncludedOnPublishedFare(
    this.page, this.lastInterceptedResponsePromise ?? this.flightPricingResponsePromise
  );
  this.publishedMuInclusivePrice = result.muInclusivePerPax;
  logger.info('Markup inclusion validated on published fare', result);
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