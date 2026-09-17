require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { Cart, FlightPricing, FlightResults } = require("../../src/dsl");
const FlightResultsPage = require("../../src/pages/FlightResultsPage");
const { ResultsPage } = require("../../src/pages/ResultsPage");
const { CommonPage } = require("../../src/pages/CommonPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { expectNumbersToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");
const { getTravelerCount } = require("../support/scenarioState");
const logger = require("@utils/logger").child("FlightResults");

setDefaultTimeout(120000);

// The render-measurement steps wait past their budget on purpose so a breach reports the real
// duration, so they need more than the default: above FlightResults' 90s wait cap, or Cucumber
// kills the step first and the measurement is lost.
const RENDER_MEASUREMENT_TIMEOUT_MS = 150000;

// EU Rail options is a supplier-dependent async lookup that can take longer than
// the default step timeout to surface the banner in flight results (see test 47148).
const RAIL_BANNER_STEP_TIMEOUT_MS = 180000;

async function applyResultsSearchFilter(world, filterText) {
  if (!filterText || typeof filterText !== 'string') {
    throw new Error(`filterText must be a non-empty string, got: ${typeof filterText}`);
  }

  const flightResultsPage = getPageObject(world.page, FlightResultsPage);
  const resultsPage = getPageObject(world.page, ResultsPage);

  await flightResultsPage.waitForFlightResults();
  await flightResultsPage.typeInSearchFlightFilter(filterText);
  await world.page.waitForTimeout(2000);

  await Promise.any([
    flightResultsPage.waitForFlightResults(),
    resultsPage.waitForNoResultsTitle('No results found'),
  ]);
}

async function ensureFirstFlightResultPriceData(world) {
  if (!world.firstFlightResultPriceData) {
    world.firstFlightResultPriceData = await FlightResults.extractFirstFlightResultDisplayAndOriginalPriceData(world.page);
  }

  return world.firstFlightResultPriceData;
}

async function ensureFirstFlightResultDisplayPriceData(world) {
  if (!world.firstFlightResultDisplayPriceData) {
    world.firstFlightResultDisplayPriceData = await FlightResults.extractFirstFlightResultDisplayPriceData(world.page);
  }

  return world.firstFlightResultDisplayPriceData;
}

async function ensureFirstPricingOptionPriceData(world) {
  if (!world.firstPricingOptionPriceData) {
    world.firstPricingOptionPriceData = await FlightResults.extractFirstPricingOptionDisplayAndOriginalPriceData(world.page);
  }

  return world.firstPricingOptionPriceData;
}

// ========================================
// WHEN STEPS - FLIGHT SELECTION & CART
// ========================================

When("I select one flight segment by schedule", async function () {
  logger.info("Selecting one flight segment by schedule");
  await FlightResults.selectOneSegmentBySchedule(this.page);
});

When("I wait for the change flight button to be visible", async function () {
  logger.info("Waiting for change flight button to appear");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  
  await flightResultsPage.waitForChangeFlightButton();
});

When("I select flight segments by schedule", async function () {
  logger.info("Selecting flight segments by schedule");
  await FlightResults.selectSegmentsBySchedule(this.page);
});

When("I add the first flight to cart", async function () {
  logger.info("Adding first flight to cart");
  await FlightResults.addFirstFlightToCart(this.page);
});

When("I store the first flight result details for later comparison", async function () {
  logger.info("Storing the first flight result details for later comparison");
  this.storedFlightSegmentDetails = await FlightResults.extractFirstFlightResultSegmentDetails(this.page);
  logger.info("Stored first flight result details", { segments: this.storedFlightSegmentDetails });
});

When("I store the first flight result legs for later comparison", async function () {
  logger.info("Storing the first flight result leg times and dates for later comparison");
  this.storedFlightResultLegs = await FlightResults.extractFirstResultLegTimeDates(this.page);
  logger.info("Stored first flight result legs", { legs: this.storedFlightResultLegs });
});

When('I hide the comparison table in flight results', async function () {
  logger.info('Hiding comparison table in flight results');
  await FlightResults.hideComparisonTable(this.page);
});

When('I show the comparison table in flight results', async function () {
  logger.info('Showing comparison table in flight results');
  await FlightResults.showComparisonTable(this.page);
});

// ========================================
// WHEN STEPS - RESULTS FILTERING
// ========================================

When("I filter results by carrier {string}", async function (carrier) {
  logger.info("Filtering results by carrier", { carrier });

  // Store current carrier for pricing options tracking
  this.currentCarrier = carrier;
  
  // Track carriers in order for shared prices extraction
  if (!this.carriers) this.carriers = [];
  if (!this.carriers.includes(carrier)) {
    this.carriers.push(carrier);
  }

  await applyResultsSearchFilter(this, carrier);
});

// Some carriers intermittently fail to sell into an existing PNR ("Couldn't confirm segments"),
// which makes a test pinned to one carrier fail for a reason it does not test. Drawing from a pool
// keeps the assertion honest while giving the run a second viable carrier. The drawn carrier is
// logged and stored so a failure report can name the one that was actually used.
When("I filter results by a random carrier from {string}", async function (carrierList) {
  const carriers = carrierList
    .split(",")
    .map((carrier) => carrier.trim())
    .filter(Boolean);

  if (carriers.length < 2) {
    throw new Error(
      `[I filter results by a random carrier from] Expected a comma-separated list of at least 2 carriers, got: "${carrierList}"`,
    );
  }

  const carrier = carriers[Math.floor(Math.random() * carriers.length)];
  logger.info("Filtering results by a randomly drawn carrier", { pool: carriers, carrier });

  this.currentCarrier = carrier;

  if (!this.carriers) this.carriers = [];
  if (!this.carriers.includes(carrier)) {
    this.carriers.push(carrier);
  }

  await applyResultsSearchFilter(this, carrier);
});

When("I filter results to non-stop flights only", async function () {
  logger.info("Filtering results to non-stop flights only");
  await FlightResults.filterByNoStops(this.page);
});

When("I filter results by the stored flight number", async function () {
  const storedFlightNumbers = Array.isArray(this.storedFlightNumbers)
    ? this.storedFlightNumbers.filter((flightNumber) => typeof flightNumber === 'string' && flightNumber.trim())
    : [];
  const filterValue = storedFlightNumbers.length
    ? storedFlightNumbers.join(', ')
    : this.storedFlightNumber;

  if (!filterValue || typeof filterValue !== 'string') {
    throw new Error(`A stored flight number must be available before filtering, got: ${typeof filterValue}`);
  }

  logger.info("Filtering results by stored flight number", {
    filterValue,
    storedFlightNumbers,
  });
  await applyResultsSearchFilter(this, filterValue);
});

When('I filter airports for route {string} by {string} in {string} and {string} in {string}', async function (routeLabel, firstAirportCode, firstSectionTitle, secondAirportCode, secondSectionTitle) {
  logger.info('Filtering airports for route', {
    routeLabel,
    selections: [
      { sectionTitle: firstSectionTitle, airportCode: firstAirportCode },
      { sectionTitle: secondSectionTitle, airportCode: secondAirportCode },
    ],
  });

  await FlightResults.filterByAirportCodesForRoute(this.page, routeLabel, [
    { sectionTitle: firstSectionTitle, airportCode: firstAirportCode },
    { sectionTitle: secondSectionTitle, airportCode: secondAirportCode },
  ]);
});

Then('the airport filter route label {string} should be visible', async function (routeLabel) {
  logger.info('Verifying airport filter route label is visible', { routeLabel });
  await FlightResults.verifyAirportFilterRouteLabelVisible(this.page, routeLabel);
});

Then('the airport filter sections {string} and {string} should be visible for route {string}', async function (firstSectionTitle, secondSectionTitle, routeLabel) {
  logger.info('Verifying airport filter sections are visible for route', {
    routeLabel,
    sectionTitles: [firstSectionTitle, secondSectionTitle],
  });

  await FlightResults.verifyAirportFilterSectionsVisible(this.page, routeLabel, [firstSectionTitle, secondSectionTitle]);
});

Then('the CO2 Squake tooltip should be visible in flight results', async function () {
  logger.info('Verifying CO2 Squake tooltip is visible in flight results');
  const result = await FlightResults.verifyCO2SquakeTooltipInResults(this.page);
  logger.info('CO2 Squake tooltip verified in flight results', {
    resultTooltipText: result.resultTooltipText,
  });
  expect(result.visible).toBe(true);
});

// ========================================
// WHEN STEPS - PRICING OPTIONS
// ========================================

When("I extract the {int} price in preferred airlines {string} filter", async function (position, leg) {
  logger.info("Extracting a Preferred airlines filter price", { position, leg });

  const option = await FlightResults.extractPreferredAirlinesFilterPrice(this.page, position);

  // Keyed by leg then position so the assertion can compare the same rows across legs. The filter
  // panel itself is not leg-aware -- the app re-feeds it per displayed leg -- so the leg name only
  // labels which capture this is.
  if (!this.preferredAirlinesFilterPrices) this.preferredAirlinesFilterPrices = {};
  if (!this.preferredAirlinesFilterPrices[leg]) this.preferredAirlinesFilterPrices[leg] = {};
  this.preferredAirlinesFilterPrices[leg][position] = option;

  logger.info("Extracted Preferred airlines filter price", { position, leg, ...option });
});

Then("prices in outbound results and return results filters filters are not same", async function () {
  logger.info("Verifying the Preferred airlines filter prices differ between the outbound and inbound legs");

  await FlightResults.verifyPreferredAirlinesFilterPricesDifferBetweenLegs(
    this.preferredAirlinesFilterPrices,
    "outbound",
    "inbound"
  );
});

When("I extract the price from first flight result", async function () {
  logger.info("Extracting price from first flight result card");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  const price = await flightResultsPage.getFirstFlightResultPriceValue();

  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);

  logger.info("Extracted first flight result price", { price });
});

When("I extract the price from first pricing option", async function () {
  logger.info("Extracting price from first pricing option");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);

  const price = await flightResultsPage.isBySchedulePricingPageVisible()
    ? await FlightPricing.extractYourSelectionPrice(this.page)
    : await flightResultsPage.getAmountPriceValuePricingOptions(0);
  
  // Store pricing options prices by carrier when a carrier-scoped flow set one.
  if (this.currentCarrier) {
    if (!this.pricingOptionsPrices) this.pricingOptionsPrices = {};
    if (!this.pricingOptionsPrices[this.currentCarrier]) {
      this.pricingOptionsPrices[this.currentCarrier] = [];
    }
    this.pricingOptionsPrices[this.currentCarrier].push(price);
  }
  
  // ALSO store in extractedPrices array for common assertions
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  logger.info("Extracted pricing option price", { carrier: this.currentCarrier ?? null, price });
});

When("I click to open first pricing options", async function () {
  logger.info("Clicking to open first pricing options");
  await FlightResults.clickToOpenPricingOptions(this.page);
  this.firstPricingOptionPriceData = undefined;
});

When("I click to open second pricing options", async function () {
  logger.info("Clicking to open second pricing options");
  await FlightResults.clickToOpenPricingOptions(this.page, 1);
  this.firstPricingOptionPriceData = undefined;
});

When('I click to open pricing options for the first NDC direct rate result', async function () {
  logger.info('Clicking to open pricing options for the first NDC direct rate result');
  await FlightResults.clickPricingOptionsForFirstNdcResult(this.page);
  this.firstPricingOptionPriceData = undefined;
});

When('I click to open pricing options for the first non-NDC result', async function () {
  logger.info('Clicking to open pricing options for the first non-NDC result');
  await FlightResults.clickPricingOptionsForFirstNonNdcResult(this.page);
  this.firstPricingOptionPriceData = undefined;
});

When('I extract the price for the first flight result and store it', async function () {
  logger.info('Extracting the price for the first flight result and storing it');
  const priceData = await ensureFirstFlightResultDisplayPriceData(this);

  this.firstFlightResultDisplayPrice = {
    amount: priceData.displayPrice,
    currencySymbol: priceData.displayCurrencySymbol,
  };

  logger.info('Stored the first flight result display price', this.firstFlightResultDisplayPrice);
});

When('I extract the price for the first flight original currency result and store it', async function () {
  logger.info('Extracting the price for the first flight original currency result and storing it');
  const priceData = await ensureFirstFlightResultPriceData(this);

  this.firstFlightResultOriginalCurrencyPrice = {
    amount: priceData.originalPrice,
    currencySymbol: priceData.originalCurrencySymbol,
  };

  logger.info('Stored the first flight result original currency price', this.firstFlightResultOriginalCurrencyPrice);
});

Then('I verify that the extracted price in flight results is correctly converted from {string} to {string}', async function (originalCurrencyCode, displayCurrencyCode) {
  logger.info('Verifying that the extracted price in flight results is correctly converted', {
    originalCurrencyCode,
    displayCurrencyCode,
  });

  const result = await FlightResults.verifyStoredPriceMatchesCurrencyConversion(
    this.page,
    this.firstFlightResultDisplayPrice,
    this.firstFlightResultOriginalCurrencyPrice,
    'flight results',
    originalCurrencyCode,
    displayCurrencyCode,
  );

  logger.info('Verified converted price in flight results', result);
});

When('I extract the price for the first flight pricing option result and store it', async function () {
  logger.info('Extracting the price for the first flight pricing option result and storing it');
  const priceData = await ensureFirstPricingOptionPriceData(this);

  this.firstFlightPricingOptionDisplayPrice = {
    amount: priceData.displayPrice,
    currencySymbol: priceData.displayCurrencySymbol,
  };

  logger.info('Stored the first flight pricing option display price', this.firstFlightPricingOptionDisplayPrice);
});

When('I extract the price for the first flight pricing option original currency and store it', async function () {
  logger.info('Extracting the price for the first flight pricing option original currency and storing it');
  const priceData = await ensureFirstPricingOptionPriceData(this);

  this.firstFlightPricingOptionOriginalCurrencyPrice = {
    amount: priceData.originalPrice,
    currencySymbol: priceData.originalCurrencySymbol,
  };

  logger.info('Stored the first flight pricing option original currency price', this.firstFlightPricingOptionOriginalCurrencyPrice);
});

Then('I verify that the extracted price in flight pricing options is correctly converted from {string} to {string}', async function (originalCurrencyCode, displayCurrencyCode) {
  logger.info('Verifying that the extracted price in flight pricing options is correctly converted', {
    originalCurrencyCode,
    displayCurrencyCode,
  });

  const result = await FlightResults.verifyStoredPriceMatchesCurrencyConversion(
    this.page,
    this.firstFlightPricingOptionDisplayPrice,
    this.firstFlightPricingOptionOriginalCurrencyPrice,
    'flight pricing options',
    originalCurrencyCode,
    displayCurrencyCode,
  );

  logger.info('Verified converted price in flight pricing options', result);
});

When('I select the first option from pricing options', async function () {
  logger.info("Selecting first option from pricing options");
  await FlightResults.selectFirstPricingOptionInModal(this.page);
});

// Requires publishedMuInclusivePrice (set by the "origin-destination markup" step).
When('I select the published fare from pricing options', async function () {
  if (typeof this.publishedMuInclusivePrice !== 'number') {
    throw new Error('publishedMuInclusivePrice is not set — run "the origin-destination markup should be ... on the published fare" step before selecting the published fare.');
  }
  logger.info('Selecting the published fare from pricing options', { price: this.publishedMuInclusivePrice });
  await FlightResults.selectPricingOptionByPrice(this.page, this.publishedMuInclusivePrice);
});

// Requires publishedMuInclusivePrice. Prefer this over the single-leg step above whenever the
// itinerary may price as a round trip: "Add to trip" only enables once every leg tab has a fare,
// and Travelfusion returns one-leg and round-trip products for the same search.
When('I select the published fare for every direction from pricing options', async function () {
  if (typeof this.publishedMuInclusivePrice !== 'number') {
    throw new Error('publishedMuInclusivePrice is not set — run a markup validation step on the published fare before selecting it.');
  }
  logger.info('Selecting the published fare on every direction from pricing options', { price: this.publishedMuInclusivePrice });
  const result = await FlightResults.selectPublishedFareOnEveryLeg(this.page, this.publishedMuInclusivePrice);
  logger.info('Published fare selected on every direction', result);
});

When("I click to open the second fare rules from pricing options modal", async function () {
  logger.info("Clicking to open the second fare rules from pricing options modal");
  await FlightResults.clickToOpenSecondFareRulesFromPricingOptions(this.page);
});

Then('the cabin class displayed in pricing options should be {string}', async function (expectedClass) {
  logger.info('Verifying cabin class in pricing options', { expectedClass });
  await FlightResults.verifyCabinClassInPricingOptions(this.page, expectedClass);
});

When('I select the second fare from pricing options', async function () {
  logger.info("Selecting second fare from pricing options");
  await FlightResults.selectPricingOptionInModalByIndex(this.page, 1);
});

When('I select {string} fare from pricing options top section', async function (cabinName) {
  logger.info('Selecting cabin class from pricing options top section', { cabinName });
  await FlightResults.selectCabinClassFromPricingOptionsTop(this.page, cabinName);
});

When('I select the pricing option containing {string}', async function (cardText) {
  logger.info('Selecting pricing option containing text', { cardText });
  await FlightResults.selectPricingOptionByText(this.page, cardText);
});

Then('the pricing options row containing {string} should show the out of policy indicator', async function (cardText) {
  logger.info('Verifying OOP indicator on pricing option row', { cardText });
  await FlightResults.verifyPricingOptionOOPByText(this.page, cardText);
});

Then('the pricing options row containing {string} should not contain {string}', async function (cardText, excludedText) {
  logger.info('Verifying pricing option row does not contain text', { cardText, excludedText });
  await FlightResults.verifyPricingOptionCardDoesNotContainText(this.page, cardText, excludedText);
});

When('I "Select to share" first option from pricing options', async function () {
  logger.info("Selecting first option from pricing options");
  await FlightResults.selectToShareFirstPricingOption(this.page);
});

When("I click share from pricing options", async function () {
  logger.info("Clicking share from pricing options and closing modal");
  await FlightResults.shareFromPricingOptions(this.page);
});

When("I add to trip from pricing options", async function () {
  logger.info("Clicking add to trip from pricing options");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);

  await flightResultsPage.clickAddToTripButtonPricingOptionsModal();
});

When("I close pricing options modal", async function () {
  logger.info("Closing pricing options modal");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  
  await flightResultsPage.clickXToClosePricingOptionsModal();
});

When("I close fare rules window", async function () {
  logger.info("Closing fare rules window");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  
  await flightResultsPage.clickXToClosePricingOptionsModal(1);
});

When("I navigate back to flight search via breadcrumb", async function () {
  logger.info("Navigating back to flight search via breadcrumb");
  await FlightResults.navigateBackToSearchViaBreadcrumb(this.page);
});

When("I close flight details window", async function () {
  logger.info("Closing flight details window");
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  
  await flightResultsPage.clickXToCloseFlightDetailsModal();
});

// ========================================
// WHEN STEPS - SHARE QUOTE FLOW
// ========================================

When('I click on the "Share" button', async function () {
  logger.info("Clicking Share button");
  await FlightResults.waitForAddToTripButtonAndClickShareButton(this.page);
});

When('I click on the {int} share button in results page', async function (buttonNumber) {
  logger.info('Clicking share button in results page', { buttonNumber });
  await FlightResults.clickShareQuoteButtonInResults(this.page, buttonNumber);
});

When('I click on the {int} flight in by schedule stepper', async function (segmentNumber) {
  logger.info('Clicking flight in by schedule stepper', { segmentNumber });
  await FlightResults.clickByScheduleFlightSegment(this.page, segmentNumber);
});

Then('{string} leg should have results available', async function (leg) {
  logger.info('Verifying by-schedule leg has results available', { leg });
  await FlightResults.verifyByScheduleLegHasResults(this.page, leg);
});

When("I select 2 options from carriers {string} and {string}", async function (carrier1, carrier2) {
  logger.info("Selecting 2 options from carriers", { carrier1, carrier2 });
  
  if (!this.resultsPrices) this.resultsPrices = {};
  if (!this.carriers) this.carriers = [];
  
  this.carriers[0] = carrier1;
  this.carriers[1] = carrier2;
  
  // Filter, get FIRST price (index 0), and share first result from carrier 1
  const result1 = await FlightResults.getPriceAndShareQuoteFromCarrier(this.page, carrier1, 0);
  this.resultsPrices[carrier1] = result1.price;
  logger.info("Stored price for carrier", { carrier: carrier1, price: this.resultsPrices[carrier1] });
  
  // Filter, get FIRST price (index 0), and share first result from carrier 2
  const result2 = await FlightResults.getPriceAndShareQuoteFromCarrier(this.page, carrier2, 0);
  this.resultsPrices[carrier2] = result2.price;
  logger.info("Stored price for carrier", { carrier: carrier2, price: this.resultsPrices[carrier2] });
});

When('I click on the "Share" button to open the share dialog', async function () {
  logger.info("Clicking Share button to open share dialog");
  const resultsPage = getPageObject(this.page, ResultsPage);
  const commonPage = getPageObject(this.page, CommonPage);
  
  await resultsPage.clickShareQuoteToGetEmailPopUp();
  await commonPage.waitForSubjectLabelSharePopUp();
});

Then('I wait to see {string} field in share dialog', async function (fieldLabel) {
  logger.info('Waiting for field in share dialog', { fieldLabel });
  await FlightResults.waitForFieldInShareDialog(this.page, fieldLabel);
});

When('I click to share two quotes from results page and verify safety text is NOT displayed', async function () {
  const hiddenSafetyText = 'Safety information and travel restriction are available for this trip, please Click here for details';

  logger.info('Sharing two quotes from results and verifying safety text is absent in the price offer preview');
  await FlightResults.shareFirstTwoQuotesByEmailFromResults(this.page);
  await Cart.switchSharePreviewToDetailedView(this.page);
  await Cart.verifySharePreviewDoesNotContainText(this.page, hiddenSafetyText);
});

When('I hover over time limit icon and verify booking restricted message', async function () {
  logger.info('Hovering over time limit icon and verifying booking restricted message');
  this.bookingRestrictedMessage = await FlightResults.hoverTimeLimitIconAndGetBookingRestrictedMessage(this.page);
  logger.info('Booking restricted message found', { message: this.bookingRestrictedMessage });
});

Then('all results should have "Add to trip" button disabled', async function () {
  logger.info('Verifying every flight result "Add to trip" button is disabled by the time limit');
  const { checked } = await FlightResults.expectAllAddToTripButtonsDisabledInResults(this.page);
  logger.info('Flight result "Add to trip" buttons verified as disabled', { checked });
});

Then('the "Pricing Options" button should be enabled', async function () {
  logger.info('Verifying the "Pricing Options" button is still enabled under the time limit');
  await FlightResults.expectPricingOptionsButtonEnabled(this.page);
});

Then('all pricing options should be disabled', async function () {
  logger.info('Verifying every pricing option "Select" button is disabled by the time limit');
  const { checked } = await FlightResults.expectAllPricingOptionsDisabled(this.page);
  logger.info('Pricing options verified as disabled', { checked });
});

When('I hover over the add to trip button in flight results', async function () {
  logger.info('Hovering over the add to trip button in flight results');
  this.bookingRestrictedMessage = await FlightResults.hoverAddToTripButtonAndGetTooltipText(this.page);
  logger.info('Add to trip tooltip opened in flight results', { message: this.bookingRestrictedMessage });
});

Then('I verify message contains {string}', async function (expectedText) {
  logger.info('Verifying booking restricted message contains expected text', { expectedText });
  const actualText = await FlightResults.verifyBookingRestrictedMessageContains(this.page, expectedText);
  logger.info('Booking restricted message validated', { actualText });
});

Then('the add to trip tooltip should contain {string}', async function (expectedText) {
  logger.info('Verifying add to trip tooltip contains expected text', { expectedText });
  const actualText = await FlightResults.verifyAddToTripTooltipContains(this.page, expectedText);
  logger.info('Add to trip tooltip validated', { actualText });
});

// --- Agreement icon tooltip in pricing options (test 27016) ---

// Side effect: stores the tooltip text. The Element Plus tooltip closes as soon as the pointer
// leaves the icon, so it is read while hovered here and asserted on in the Then step below.
When('I hover over the first fare that has agreement icon in flight pricing options', async function () {
  logger.info('Hovering over the first pricing options fare that carries an agreement icon');
  const { tooltipText } = await FlightResults.hoverAgreementIconInPricingOptions(this.page);
  this.agreementTooltipText = tooltipText;
  logger.info('Agreement tooltip opened in pricing options', { tooltipText });
});

Then('the agreement tooltip in the first fare that has agreement in pricing options should contain the generated value', function () {
  if (!this.generatedAgreementTooltip) {
    throw new Error(
      '[flight_results.steps] No generated agreement tooltip stored — call ' +
      '"I enter a random value into the agreement tooltip in the administration" first.'
    );
  }
  if (!this.agreementTooltipText) {
    throw new Error(
      '[flight_results.steps] No agreement tooltip text stored — call ' +
      '"I hover over the first fare that has agreement icon in flight pricing options" first.'
    );
  }

  logger.info('Verifying the agreement tooltip carries the value saved in administration', {
    expectedSubstring: this.generatedAgreementTooltip,
    actualTooltip: this.agreementTooltipText,
  });

  expect(
    this.agreementTooltipText.toLowerCase(),
    `The agreement tooltip in pricing options ("${this.agreementTooltipText}") should contain the value saved ` +
    `in administration ("${this.generatedAgreementTooltip}"). The tooltip change did not reach the booking flow.`
  ).toContain(this.generatedAgreementTooltip.toLowerCase());
});

When("I scroll into offers and get prices", async function () {
  logger.info("Scrolling into offers and getting prices");
  const { sharedPrice1, sharedPrice2 } = await FlightResults.scrollIntoOffersAndGetPrices(this.page);
  
  // Store prices using carrier names as keys (in selection order)
  if (!this.sharedPrices) this.sharedPrices = {};
  this.sharedPrices[this.carriers[0]] = sharedPrice1;
  this.sharedPrices[this.carriers[1]] = sharedPrice2;
});

When("I click to open fare rules", async function () {
  logger.info("Clicking to open fare rules");
  await FlightResults.clickToOpenFareRules(this.page);
});

When("I click to open flight details", async function () {
  logger.info("Clicking to open flight details");
  await FlightResults.clickToOpenFlightDetails(this.page);
});

Then("the flight details dates should match the results dates", async function () {
  if (!Array.isArray(this.storedFlightResultLegs) || this.storedFlightResultLegs.length === 0) {
    throw new Error(
      "No stored flight result legs found. Run 'I store the first flight result legs for later " +
      "comparison' on the results page, before opening the flight details drawer."
    );
  }

  logger.info("Verifying the flight details dates match the results card dates", {
    resultsLegs: this.storedFlightResultLegs.length,
    timezoneId: this.timezoneId || "(runner default)",
  });

  const result = await FlightResults.verifyFlightDetailsDatesMatchResultsDates(
    this.page,
    this.storedFlightResultLegs
  );

  logger.info("Flight details dates match the results card dates", result);
});

Then("the flight details departure and arrival times should match the results times", async function () {
  // Either capture step will do: the leg shape is a superset of the segment shape for the two
  // fields this compares, so a scenario is free to store whichever it also needs elsewhere.
  const storedLegs = this.storedFlightResultLegs || this.storedFlightSegmentDetails;

  if (!Array.isArray(storedLegs) || storedLegs.length === 0) {
    throw new Error(
      "No stored flight result times found. Run 'I store the first flight result legs for later " +
      "comparison' (or the segment-details equivalent) on the results page, before opening the " +
      "flight details drawer."
    );
  }

  logger.info("Verifying the flight details times match the results card times", {
    resultsLegs: storedLegs.length,
    timezoneId: this.timezoneId || "(runner default)",
  });

  const result = await FlightResults.verifyFlightDetailsTimesMatchResultsTimes(this.page, storedLegs);

  logger.info("Flight details times match the results card times", result);
});

When("I open seat map from results and verify it loads", async function () {
  logger.info("Opening seat map from results");
  const result = await FlightResults.openSeatMapFromResults(this.page);
  logger.info("Seat map from results opened", result);
});

Then("the seat map should be displayed in results", async function () {
  logger.info("Verifying the results seat drawer rendered a seat map");
  await FlightResults.verifySeatMapDisplayedInResults(this.page);
});

When("I close the seat map drawer in results", async function () {
  logger.info("Closing the results seat map drawer");
  await FlightResults.closeSeatMapDrawerInResults(this.page);
});

When("I click to open fare rules from modal", async function () {
  logger.info("Clicking to open fare rules from flight details");
  await FlightResults.clickToOpenFareRulesFromResultsModal(this.page);
});

When('I select the fare with baggage {string}', async function (baggageText) {
  logger.info("Selecting the fare with baggage", { baggageText });
  await FlightResults.selectFareWithBaggage(this.page, baggageText);
});

// Opens pricing options itself. Prefer this over the step above when the first result may
// return no fare cards at all.
When('I select the fare with baggage {string} from the first result offering it', async function (baggageText) {
  logger.info("Scanning results for a fare with the requested baggage", { baggageText });
  const result = await FlightResults.selectFareWithBaggageAcrossResults(this.page, baggageText);
  logger.info("Selected the fare with the requested baggage", result);
});

When("I scroll to the Flight Duration filter", async function () {
  logger.info("Scrolling to Flight Duration filter");
  await FlightResults.scrollToFlightDurationTitle(this.page);
});

When("I scroll to the Flight Duration filter for {string}", async function (location) {
  logger.info("Scrolling to Flight Duration filter for location", { location });
  await FlightResults.scrollToFlightDurationFromLocationTitle(this.page, location);
});

When('I adjust the Limit Layover Duration filter from the half timepoint of the longest point', async function () {
  logger.info('Adjusting Limit Layover Duration filter from midpoint of longest range');
  await FlightResults.adjustLimitLayoverDurationFilterFromMidpoint(this.page);
});

Then('all pricing option segments {string} and {string} and {string} should be visible and selectable', async function (firstRoute, secondRoute, thirdRoute) {
  const segmentRoutes = [firstRoute, secondRoute, thirdRoute];
  logger.info('Verifying pricing option segments are visible and selectable', { segmentRoutes });
  await FlightResults.verifyMultiCitySegmentsVisibleInPricingOptions(this.page, segmentRoutes);
});

// Strict one-tab-per-leg check (ADO 71514): fails when the drawer repeats a journey leg, which the
// "visible and selectable" step above cannot catch because it asserts the tab count with >=.
Then('the pricing options should show {int} leg tabs with no duplicated journey leg', async function (expectedLegCount) {
  logger.info('Verifying pricing options leg tabs are not duplicated', { expectedLegCount });
  const result = await FlightResults.verifyPricingOptionsLegTabsNotDuplicated(this.page, expectedLegCount);
  logger.info('Pricing options leg tabs verified', result);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then('flight times on the results page should be displayed in 12-hour AM\\/PM format', async function () {
  logger.info('Verifying flight times are in 12-hour AM/PM format on the results page');
  const times = await FlightResults.verifyResultsTimesAreIn12HourFormat(this.page);
  this.resultsPageTimes = times;
  logger.info('Results page times verified', { count: times.length, times });
});

// Longer than verifyFlightResultsAvailable's own 120s budget on purpose. When the two were equal, Cucumber
// killed this step first, so the DSL never reached its no-results branch and every cause - zero
// availability, the empty state rendering, or a search that never left the form - printed the same
// "timed out after 120000ms". The headroom lets the DSL fail with its own reason instead.
const RESULTS_STEP_TIMEOUT_MS = 180000;

Then("flight results should be available", { timeout: RESULTS_STEP_TIMEOUT_MS }, async function () {
  logger.info("Verifying flight results are available");
  // No expect() here: the DSL throws the empty-state reason itself. A boolean assertion would
  // collapse "supplier returned nothing" back into a bare expect(received).toBe(expected).
  await FlightResults.verifyFlightResultsAvailable(this.page);
});

Then("the displayed results departure times match the selected time frame", async function () {
  // this.selectedTimeFrame is set by the "I select time frame ... for both legs" step and carries
  // the window bounds (minHour/maxHour) that go with the label picked in advanced search.
  expect(
    this.selectedTimeFrame,
    'No time frame was selected earlier in the scenario — this step must follow a time-frame selection step'
  ).toBeTruthy();

  logger.info("Verifying results departure times match the selected time frame", this.selectedTimeFrame);
  const result = await FlightResults.verifyResultsDepartureTimesMatchTimeFrame(this.page, this.selectedTimeFrame);
  logger.info("Results departure times verified", { checked: result.checked });
});

Then("the flight origin should show {string}", async function (expectedOrigin) {
  logger.info("Verifying the flight origin on the results header", { expectedOrigin });
  await FlightResults.verifyFlightResultsOrigin(this.page, expectedOrigin);
});

Then("the flight destination should show {string}", async function (expectedDestination) {
  logger.info("Verifying the flight destination on the results header", { expectedDestination });
  await FlightResults.verifyFlightResultsDestination(this.page, expectedDestination);
});

Then('the alert {string} should be displayed', async function (expectedText) {
  logger.info('Verifying alert is displayed', { expectedText });
  await FlightResults.verifyAlertTextDisplayed(this.page, expectedText);
});

Then('the flight comparison row for {string} should have no prices', async function (stopLabel) {
  logger.info('Verifying comparison row has no prices', { stopLabel });
  await FlightResults.verifyComparisonRowHasNoPrices(this.page, stopLabel);
});

Then('the flight comparison row for {string} should have prices', async function (stopLabel) {
  logger.info('Verifying comparison row has prices', { stopLabel });
  await FlightResults.verifyComparisonRowHasPrices(this.page, stopLabel);
});

Then('every price in the flight comparison table should fit inside its cell box', async function () {
  logger.info('Verifying every comparison-table price fits inside its cell box');
  await FlightResults.verifyComparisonPricesFitTheirCells(this.page);
});

Then('the flight comparison toggle should display {string}', async function (expectedText) {
  logger.info('Verifying flight comparison toggle text', { expectedText });
  await FlightResults.verifyComparisonToggleText(this.page, expectedText);
});

Then('the comparison table should be visible in flight results and the toggle should display {string}', async function (expectedText) {
  logger.info('Verifying comparison table visibility and toggle text', { expectedText });
  await FlightResults.verifyComparisonTableVisibleWithToggleText(this.page, expectedText);
});

Then('the stops filter should be visible in flight results', async function () {
  logger.info('Verifying stops filter is visible in flight results');
  const result = await FlightResults.verifyStopsFilterVisible(this.page);
  logger.info('Stops filter verified', result);
});

Then('the edited flight search results should reflect the updated dates', async function () {
  logger.info('Verifying edited flight results reflect updated dates', { editedFlightSearch: this.editedFlightSearch });

  if (!this.editedFlightSearch?.departureDate || !this.editedFlightSearch?.returnDate) {
    throw new Error('editedFlightSearch departureDate and returnDate must be set before validating edited results');
  }

  await FlightResults.verifyResultsReflectEditedDates(
    this.page,
    this.editedFlightSearch.departureDate,
    this.editedFlightSearch.returnDate,
  );
});

Then('flight search results should reflect the updated departure location {string}', async function (expectedDepartureLocation) {
  logger.info('Verifying edited flight results reflect updated departure location', { expectedDepartureLocation });
  await FlightResults.verifyResultsReflectUpdatedDepartureLocation(this.page, expectedDepartureLocation);
});

Then("The shared price for carrier {string} should match the prices from results", async function (carrier) {
  const resultsPrice = this.resultsPrices[carrier];
  const sharedPrice = this.sharedPrices[carrier];
  
  expectNumbersToBeEqualWithTolerance(sharedPrice, resultsPrice, 0.02, `${carrier} shared price`);
});

Then("The shared price for carrier {string} should match the price from pricing options", async function (carrier) {
  const pricingOptionsPrice = this.pricingOptionsPrices?.[carrier]?.[0];
  const sharedPrice = this.sharedPrices?.[carrier];
  
  if (!pricingOptionsPrice) {
    throw new Error(`No pricing options price found for carrier: ${carrier}`);
  }
  
  if (!sharedPrice) {
    throw new Error(`No shared price found for carrier: ${carrier}`);
  }
  // Use tolerance for floating point comparison
  expectNumbersToBeEqualWithTolerance(sharedPrice, pricingOptionsPrice, 0.02, `${carrier} shared price from pricing options`);
});

Then("the price in pricing options should be per traveler", async function () {
  logger.info("Verifying pricing options price is per traveler");
  const result = await FlightResults.verifyPricingOptionsPriceIsPerTraveler(this.page);
  this.perTravelerPrice = result.pricingOptionsPrice;
  logger.info("Pricing options per-traveler price verified", result);
});

When("I extract the total price from flight details", async function () {
  logger.info("Extracting total price from flight details");
  this.flightDetailsTotalPrice = await FlightResults.extractTotalPriceFromFlightDetails(this.page);
  logger.info("Extracted flight details total price", { flightDetailsTotalPrice: this.flightDetailsTotalPrice });
});

Then("the price in flight details should be total for all pax", async function () {
  const perTravelerPrice = this.perTravelerPrice ?? this.extractedPrices?.[this.extractedPrices.length - 1];

  if (perTravelerPrice == null) {
    throw new Error("No per-traveler price stored. Run the pricing options extraction step before validating flight details total.");
  }

  const travelerCount = getTravelerCount(this);
  logger.info("Verifying flight details total price for all travelers", {
    perTravelerPrice,
    travelerCount,
    flightDetailsTotalPrice: this.flightDetailsTotalPrice ?? null,
  });

  const result = await FlightResults.verifyFlightDetailsPriceIsTotalForAllPax(
    this.page,
    perTravelerPrice,
    travelerCount,
    this.flightDetailsTotalPrice,
  );

  logger.info("Flight details total price verified for all travelers", result);
});

Then("I should see the fare rules note about strictest terms", async function () {
  logger.info("Verifying fare rules note about strictest terms");
  const noteText = await FlightResults.getFareRulesNoteText(this.page);
  expect(noteText).toContain('Fare rules would be applied according to the strictest terms');
});


Then("the seat preview only message should be visible", async function () {
  logger.info("Verifying results seat preview only message");
  const actualMessage = await FlightResults.verifySeatPreviewOnlyMessage(this.page);
  logger.info("Seat preview only message found", { actualMessage });
});

When("I click fare rules for the second flight leg", async function () {
  logger.info("Clicking fare rules leg tab for the second flight leg");
  await FlightResults.clickFareRulesLegTab(this.page, 1);
});

When("I click fare rules for the third flight leg", async function () {
  logger.info("Clicking fare rules leg tab for the third flight leg");
  await FlightResults.clickFareRulesLegTab(this.page, 2);
});

// Text the drawer renders in place of the rules when the supplier returned none.
const NO_FARE_RULES_TEXT = 'No rules were found';

// Captures the fare basis and rules text of the leg whose fare rules drawer is currently open,
// in call order: the first call is leg 1, the second is leg 2, and so on.
When("I extract the fare rules text for the current leg", async function () {
  const content = await FlightResults.getFareRulesContent(this.page);

  if (!this.extractedFareRules) this.extractedFareRules = [];
  this.extractedFareRules.push(content);

  logger.info("Extracted fare rules text for the current leg", {
    leg: this.extractedFareRules.length,
    fareBasis: content.fareBasis,
    bodyLength: content.body.length,
  });
});

Then("the fare rules displayed should match leg {int} extracted from results", async function (legNumber) {
  const expected = this.extractedFareRules?.[legNumber - 1];

  if (!expected) {
    throw new Error(
      `No fare rules stored for leg ${legNumber}. Run "I extract the fare rules text for the current leg" ` +
      `on that leg's results page before this assertion.`
    );
  }

  const actual = await FlightResults.getFareRulesContent(this.page);

  logger.info("Comparing displayed fare rules against the ones extracted from results", {
    legNumber,
    expectedFareBasis: expected.fareBasis,
    actualFareBasis: actual.fareBasis,
    expectedBodyLength: expected.body.length,
    actualBodyLength: actual.body.length,
  });

  expect(
    actual.fareBasis,
    `Fare basis for leg ${legNumber} should match the one shown in flight results`
  ).toBe(expected.fareBasis);

  // Empty rules on both sides would make the text comparison below vacuously true, so the
  // rules text has to be real content before it is compared.
  for (const [source, content] of [['flight results', expected], ['the page under test', actual]]) {
    if (!content.body || content.body.includes(NO_FARE_RULES_TEXT)) {
      throw new Error(
        `Fare rules for leg ${legNumber} carry no rule text in ${source}: fare basis ` +
        `"${content.fareBasis}" is shown but the rules body is "${content.body || '<empty>'}".`
      );
    }
  }

  expect(
    actual.body,
    `Fare rules text for leg ${legNumber} should match the text shown in flight results`
  ).toBe(expected.body);
});


Then("the green circle icon at index {int} {string} should be displayed in pricing options", async function (index, description) {
  logger.info("Verifying green circle icon is displayed in pricing options", { index, description });
  const isVisible = await FlightResults.isGreenCircleIconVisibleInPricingOptions(this.page, index);
  expect(isVisible).toBe(true);
});

Then('the fare component text color should be {string} in pricing options', async function (expectedColor) {
  logger.info('Verifying fare component text color in pricing options', { expectedColor });
  await FlightResults.verifyFareComponentTextColorInPricingOptions(this.page, expectedColor);
});

Then('the {string} brand should be displayed in pricing options', async function (expectedBrandName) {
  logger.info('Verifying brand is displayed in pricing options', { expectedBrandName });
  await FlightResults.verifyPricingOptionsBrandDisplayed(this.page, expectedBrandName);
});

Then('the {string} text should be displayed in pricing options', async function (expectedText) {
  logger.info('Verifying text is displayed in pricing options', { expectedText });
  await FlightResults.verifyPricingOptionsHeaderContains(this.page, expectedText);
});

Then("the Flight Duration filter should be visible", async function () {
  logger.info("Verifying Flight Duration filter is visible");
  await FlightResults.assertFlightDurationTitleVisible(this.page);
});

Then("the Flight Duration filter for {string} should be visible", async function (location) {
  logger.info("Verifying Flight Duration filter for location is visible", { location });
  await FlightResults.assertFlightDurationFromLocationVisible(this.page, location);
});

When("I extract the arrival date of the outbound first flight option", async function () {
  logger.info("Extracting arrival date of the outbound first flight option");
  this.outboundFirstFlightArrivalDate = await FlightResults.extractFlightArrivalDate(this.page, 0);
  logger.info("Outbound first flight arrival date extracted", { date: this.outboundFirstFlightArrivalDate });
});

When("I extract the departure date of the inbound first flight option", async function () {
  logger.info("Extracting departure date of the inbound first flight option");
  this.inboundFirstFlightDepartureDate = await FlightResults.extractInboundFlightDepartureDate(this.page, 0);
  logger.info("Inbound first flight departure date extracted", { date: this.inboundFirstFlightDepartureDate });
});

// ========================================
// CODESHARE / OPERATED BY
// ========================================

Then('the "Operated by" text should be visible in the flight results', async function () {
  logger.info("Verifying 'Operated by' text is visible in flight results");
  await FlightResults.verifyOperatedByInResults(this.page);
});

Then('the "Operated by" text should be visible in flight details', async function () {
  logger.info("Verifying 'Operated by' text is visible in flight details drawer");
  await FlightResults.verifyOperatedByInFlightDetails(this.page);
});

// ========================================
// BY SCHEDULE - ROLE-BASED BUTTON VISIBILITY
// ========================================

Then("the Select Flight button should be visible in results", async function () {
  logger.info("Verifying Select Flight button is visible in results");
  await FlightResults.verifySelectFlightButtonVisible(this.page);
});

Then("the Add to trip and Pricing Options buttons should not be visible in results", async function () {
  logger.info("Verifying Add to trip and Pricing Options buttons are not visible");
  await FlightResults.verifyAddToTripAndPricingOptionsNotVisible(this.page);
});

When("I confirm the pricing option for the current segment", async function () {
  logger.info("Confirming pricing option selection for the current segment");
  await FlightResults.confirmPricingOptionForCurrentSegment(this.page);
});

// ========================================
// BRANDED FARES
// ========================================

When("I open branded fares from flight details", async function () {
  logger.info("Opening branded fares from flight details");
  await FlightResults.openBrandedFaresAndVerifyAncillaries(this.page);
});

When("I open branded fares from pricing options", async function () {
  logger.info("Opening branded fares from pricing options");
  await FlightResults.openBrandedFaresFromPricingOptions(this.page);
});

When("I close branded fares drawer", async function () {
  logger.info("Closing branded fares drawer");
  await FlightResults.closeBrandedFaresDrawer(this.page);
});

Then("the branded fare ancillaries text should be visible", async function () {
  logger.info("Verifying branded fare ancillaries text is visible");
  await FlightResults.verifyAncillariesTextVisible(this.page);
});

Then("the brand information unavailable message should be displayed", async function () {
  logger.info("Verifying brand information unavailable message is displayed");
  await FlightResults.verifyBrandInformationUnavailable(this.page);
});

Then("the carrier name in more details should be {string}", async function (expectedName) {
  logger.info("Verifying carrier name in more details", { expectedName });
  await FlightResults.verifyCarrierNameInDetails(this.page, expectedName);
});

When("I extract the price from pricing option at index {int}", async function (index) {
  logger.info("Extracting price from pricing option at index", { index });
  const flightResultsPage = getPageObject(this.page, FlightResultsPage);
  const price = await flightResultsPage.getAmountPriceValuePricingOptions(index);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  logger.info("Extracted pricing option price", { index, price });
});

// ========================================
// THEN STEPS - RAIL BANNER
// ========================================

Then("the rail banner should be visible in results", { timeout: RAIL_BANNER_STEP_TIMEOUT_MS }, async function () {
  logger.info("Verifying rail banner is visible in flight results");
  await FlightResults.verifyRailBannerVisible(this.page);
});

Then("the first flight result should display the Instant Purchase label", async function () {
  logger.info("Verifying Instant Purchase label is visible in the first flight result");
  await FlightResults.verifyInstantPurchaseLabelVisibleInFirstResult(this.page);
});

Then('the {string} indicator should be visible in results', async function (indicatorName) {
  logger.info('Verifying indicator is visible in results', { indicatorName });
  if (indicatorName === 'Separated Tickets') {
    await FlightResults.verifySeparatedTicketsIndicatorVisible(this.page);
  } else if (indicatorName === 'Agreement') {
    await FlightResults.verifyAgreementIndicatorVisibleInResults(this.page);
  } else if (indicatorName === 'Marine Fare') {
    await FlightResults.verifyMarineFareIconVisibleInResults(this.page);
  } else if (indicatorName === 'NDC Direct Rate') {
    await FlightResults.verifyFlightResultInfoLabel(this.page, 'NDC direct rate');
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported: "Agreement", "Separated Tickets", "Marine Fare", "NDC Direct Rate"`);
  }
});

Then('the {string} indicator should be visible in pricing options', async function (indicatorName) {
  logger.info('Verifying indicator is visible in pricing options', { indicatorName });
  if (indicatorName === 'Agreement') {
    await FlightResults.verifyAgreementIndicatorVisibleInPricingOptions(this.page);
  } else if (indicatorName === 'Marine Fare') {
    await FlightResults.verifyMarineFareIconVisibleInPricingOptions(this.page);
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported: "Agreement", "Marine Fare"`);
  }
});

// Run right after the step that opens the fare options: that step returns on the click, so the
// wait measured here is the render itself.
Then('the fare options should render within {string} seconds', { timeout: RENDER_MEASUREMENT_TIMEOUT_MS }, async function (maxSeconds) {
  logger.info('Verifying the pricing options fare cards render within budget', { maxSeconds });
  const result = await FlightResults.verifyPricingOptionsRenderWithin(this.page, Number(maxSeconds));
  logger.info('Pricing options render time verified', result);
});

// New-flight-flow counterpart: the fare options are brand cards on the flight-selection screen.
Then('the outbound leg brand cards should render within {string} seconds', { timeout: RENDER_MEASUREMENT_TIMEOUT_MS }, async function (maxSeconds) {
  logger.info('Verifying the outbound leg brand cards render within budget', { maxSeconds });
  const result = await FlightResults.verifyOutboundBrandCardsRenderWithin(this.page, Number(maxSeconds));
  logger.info('Outbound brand cards render time verified', result);
});

Then('both edifact and NDC results are displayed', async function () {
  logger.info('Verifying both EDIFACT and NDC content is displayed in pricing options');
  const counts = await FlightResults.verifyBothEdifactAndNdcPricingOptionsDisplayed(this.page);
  logger.info('Verified mixed EDIFACT/NDC pricing options', counts);
});

Then('first flight has carrier {string} for {word}', async function (carrier, leg) {
  logger.info('Verifying the carrier of one leg of the first flight result', { carrier, leg });
  await FlightResults.verifyFirstFlightCarrierForLeg(this.page, carrier, leg);
});

Then('all flight results should be from airline {string}', async function (airlineName) {
  logger.info('Verifying all flight results are from airline', { airlineName });
  await FlightResults.verifyAllResultsFromAirline(this.page, airlineName);
});

Then('all outbound flight results are from {string} to {string}', async function (originCode, destinationCode) {
  logger.info('Verifying all flight results fly the requested outbound route', { originCode, destinationCode });
  await FlightResults.verifyAllResultsLegRoute(this.page, 0, originCode, destinationCode);
});


Then('all flight results should show the unused tickets eligibility tag', async function () {
  logger.info('Verifying all flight results show the unused tickets eligibility tag');
  await FlightResults.verifyAllResultsShowUnusedTicketTag(this.page);
});

Then('airport codes {string} and {string} should be marked in the first flight result', async function (firstAirportCode, secondAirportCode) {
  logger.info('Verifying airport codes are marked in the first flight result', {
    airportCodes: [firstAirportCode, secondAirportCode],
  });
  await FlightResults.verifyMarkedAirportCodesInFirstResult(this.page, [firstAirportCode, secondAirportCode]);
});

Then('the original currency symbol {string} should be visible in flight results', async function (currencySymbol) {
  logger.info('Verifying original currency symbol is visible in flight results', { currencySymbol });
  await FlightResults.verifyOriginalCurrencySymbolVisibleInResults(this.page, currencySymbol);
});

Then('the original currency symbol {string} should be visible in pricing options', async function (currencySymbol) {
  logger.info('Verifying original currency symbol is visible in pricing options', { currencySymbol });
  await FlightResults.verifyOriginalCurrencySymbolVisibleInPricingOptions(this.page, currencySymbol);
});

When('I store the first flight result display and original prices', async function () {
  logger.info('Storing the first flight result display and original prices');
  this.firstFlightResultPrices = await FlightResults.extractFirstFlightResultDisplayAndOriginalPrices(this.page);
  logger.info('Stored the first flight result display and original prices', this.firstFlightResultPrices);
});

Then('the first pricing option display and original prices should match the stored flight result prices', async function () {
  if (!this.firstFlightResultPrices) {
    throw new Error('No stored flight result prices found. Run the flight result price storage step before this assertion.');
  }

  logger.info(
    'Verifying first pricing option display and original prices against stored flight result prices',
    this.firstFlightResultPrices,
  );
  await FlightResults.verifyFirstPricingOptionMatchesStoredFlightResultPrices(this.page, this.firstFlightResultPrices);
});

Then('the first pricing option price should match the stored first flight result price', async function () {
  if (!this.firstFlightResultDisplayPrice || typeof this.firstFlightResultDisplayPrice.amount !== 'number') {
    throw new Error('No stored first flight result display price found. Run "I extract the price for the first flight result and store it" before this assertion.');
  }

  logger.info(
    'Verifying first pricing option display price against stored first flight result price',
    this.firstFlightResultDisplayPrice,
  );
  await FlightResults.verifyFirstPricingOptionDisplayPriceMatchesStored(
    this.page,
    this.firstFlightResultDisplayPrice.amount,
  );
});

Then('pricing options are displayed', async function () {
  logger.info('Verifying the pricing options drawer displays at least one fare');
  const result = await FlightResults.verifyPricingOptionsFaresDisplayed(this.page);
  logger.info('Pricing options fares verified', result);
});

Then('pricing options should be displayed in increasing price order', async function () {
  logger.info('Verifying pricing options are displayed in increasing price order');
  await FlightResults.verifyPricingOptionsInAscendingOrder(this.page);
});

Then('the original currency symbol {string} should be visible in the share quote from results', async function (currencySymbol) {
  logger.info('Verifying original currency symbol is visible in share quote from results', { currencySymbol });
  await FlightResults.verifyOriginalCurrencyInShareQuoteFromResults(this.page, currencySymbol);
});

When('I exit share mode', async function () {
  logger.info('Exiting share mode');
  await FlightResults.exitShareMode(this.page);
});

// ========================================
// STOPOVER INDICATOR
// ========================================

Then('the filtered flight result should display a stopover indicator for flight {string}', async function (flightNumber) {
  logger.info('Verifying stopover indicator is visible for flight in results', { flightNumber });
  const result = await FlightResults.verifyStopoverIndicatorInResultsForFlight(this.page, flightNumber);
  logger.info('Stopover indicator verified in results', result);
});

Then('the stopover indicator should be displayed in flight details', async function () {
  logger.info('Verifying stopover indicator is displayed in flight details');
  const result = await FlightResults.verifyStopoverIndicatorInFlightDetails(this.page);
  logger.info('Stopover indicator verified in flight details', result);
});

Then('the stopover location should be displayed in flight details', async function () {
  logger.info('Verifying stopover location is displayed in flight details');
  const result = await FlightResults.verifyStopoverLocationInFlightDetails(this.page);
  logger.info('Stopover location verified in flight details', result);
});

// ========================================
// ADVISORY VERIFICATION
// ========================================

Then('I hover over the advisory icon and verify tooltip text {string}', async function (expectedText) {
  logger.info('Hovering over advisory icon and verifying tooltip text', { expectedText });
  await FlightResults.verifyAdvisoryTooltipText(this.page, expectedText);
});

Then('the flight details should show connection advisory with transport change', async function () {
  logger.info('Verifying flight details contain connection advisory with transport change');
  await FlightResults.verifyFlightDetailsConnectionAdvisory(this.page);
});

Then('the share email preview should contain equipment for flight segments', async function () {
  logger.info('Verifying share email preview contains equipment information for flight segments');
  await FlightResults.verifyShareEmailContainsEquipment(this.page);
});

Then("the conflicting quotes dialog should be displayed after clicking add to cart", async function () {
  logger.info("Adding first flight to cart and verifying conflicting quotes dialog appears");
  await FlightResults.addFirstFlightToCartAndVerifyConflictingQuotesDialog(this.page);
});

Then('the first flight result price should not be zero', async function () {
  logger.info('Verifying the first flight result price is not zero');
  await FlightResults.verifyFirstFlightResultPriceIsNotZero(this.page);
});

When('I sort flight results by {string}', async function (label) {
  logger.info('Sorting flight results by', { label });
  await FlightResults.sortBy(this.page, label);
});

Then('the {string} sort option should be selected by default', async function (label) {
  logger.info('Verifying the default quick-sort option on the flight results page', { label });
  await FlightResults.verifyActiveQuickSortOption(this.page, label);
});

// ========================================
// AIRPORT FILTER
// ========================================

When('I filter by {string} airport in the airports filter', async function (airportCode) {
  logger.info('Filtering by airport code in the airports filter', { airportCode });
  await FlightResults.filterByAirportCode(this.page, airportCode);
});

Then('the first flight destination airport should be {string}', async function (airportCode) {
  logger.info('Verifying first flight destination airport', { airportCode });
  await FlightResults.verifyFirstFlightDestinationAirport(this.page, airportCode);
});

// ========================================
// FILTER / SORT / COMPARISON TABLE
// ========================================

When('I clear all flight result filters', async function () {
  logger.info('Clearing all flight result filters');
  await FlightResults.clearAllFilters(this.page);
});

When('I extract the {string} sort price', async function (sortLabel) {
  logger.info('Extracting the quick-sort option price', { sortLabel });
  const price = await FlightResults.extractQuickSortOptionPrice(this.page, sortLabel);

  if (!this.quickSortPrices) this.quickSortPrices = {};
  this.quickSortPrices[sortLabel] = price;

  logger.info('Extracted quick-sort option price', { sortLabel, price });
});

When('I select the {string} carrier logo from the comparison table', async function (carrierName) {
  logger.info('Selecting carrier logo from comparison table', { carrierName });
  await FlightResults.selectCarrierLogoFromComparison(this.page, carrierName);
});

Then('the airline checkbox {string} should be checked', async function (airlineName) {
  logger.info('Verifying airline filter checkbox is checked', { airlineName });
  await FlightResults.verifyAirlineCheckboxChecked(this.page, airlineName);
});

Then('the airline checkbox {string} should not be checked', async function (airlineName) {
  logger.info('Verifying airline filter checkbox is not checked', { airlineName });
  await FlightResults.verifyAirlineCheckboxNotChecked(this.page, airlineName);
});

Then('the first flight result price should match the {string} sort price', async function (sortLabel) {
  const expectedPrice = this.quickSortPrices?.[sortLabel];
  if (typeof expectedPrice !== 'number') {
    throw new Error(`No stored "${sortLabel}" sort price. Run 'When I extract the "${sortLabel}" sort price' before this assertion.`);
  }

  const actualPrice = await FlightResults.extractFirstFlightResultPrice(this.page);

  logger.info('Verifying first flight result price matches the sort option price', {
    sortLabel,
    expectedPrice,
    actualPrice,
  });

  expectNumbersToBeEqualWithTolerance(
    actualPrice,
    expectedPrice,
    0.02,
    `first flight result price vs "${sortLabel}" sort price`,
  );
});

Then('the {string} sort option should display an average trip time', async function (sortLabel) {
  logger.info('Verifying the quick-sort option shows an average trip time', { sortLabel });
  const average = await FlightResults.verifyQuickSortOptionShowsAverageDuration(this.page, sortLabel);
  logger.info('Quick-sort option average trip time', { sortLabel, ...average });
});

When('I extract the average time of each flight in flight results', async function () {
  logger.info('Extracting the average leg duration of each rendered flight result');
  this.flightResultAverageDurations = await FlightResults.extractFlightResultAverageDurations(this.page);
  logger.info('Extracted flight result average durations', {
    results: this.flightResultAverageDurations.length,
    first: this.flightResultAverageDurations[0],
  });
});

Then('the best average time is the average time of all legs', async function () {
  const resultAverages = this.flightResultAverageDurations;
  if (!Array.isArray(resultAverages) || !resultAverages.length) {
    throw new Error(
      "No stored flight result averages. Run 'When I extract the average time of each flight in flight results' before this assertion."
    );
  }

  logger.info('Verifying the "Best" quick-sort average equals the average of the first result\'s leg durations');
  const outcome = await FlightResults.verifyQuickSortAverageMatchesFirstResult(this.page, 'Best', resultAverages);
  logger.info('"Best" quick-sort average matches the first result', outcome);
});

Then('the flight search response should have no {string} result from source system {string}', async function (carrier, source) {
  logger.info(`Verifying no "${carrier}" result comes from the "${source}" source system in the flightSearch response`);
  await FlightResults.verifyNoResultForCarrierFromSource(this.page, this.lastInterceptedResponsePromise, carrier, source);
});
