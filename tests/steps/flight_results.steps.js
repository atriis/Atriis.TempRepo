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

When('I extract the price for the first flight result and store it', async function () {
  logger.info('Extracting the price for the first flight result and storing it');
  const priceData = await ensureFirstFlightResultPriceData(this);

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

When("I open seat map from results and verify it loads", async function () {
  logger.info("Opening seat map from results");
  const result = await FlightResults.openSeatMapFromResults(this.page);
  logger.info("Seat map from results opened", result);
});

When("I click to open fare rules from modal", async function () {
  logger.info("Clicking to open fare rules from flight details");
  await FlightResults.clickToOpenFareRulesFromResultsModal(this.page);
});

When('I select the fare with baggage {string}', async function (baggageText) {
  logger.info("Selecting the fare with baggage", { baggageText });
  await FlightResults.selectFareWithBaggage(this.page, baggageText);
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

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then('flight times on the results page should be displayed in 12-hour AM\\/PM format', async function () {
  logger.info('Verifying flight times are in 12-hour AM/PM format on the results page');
  const times = await FlightResults.verifyResultsTimesAreIn12HourFormat(this.page);
  this.resultsPageTimes = times;
  logger.info('Results page times verified', { count: times.length, times });
});

Then("flight results should be available", async function () {
  logger.info("Verifying flight results are available");
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
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

Then("the rail banner should be visible in results", async function () {
  logger.info("Verifying rail banner is visible in flight results");
  await FlightResults.verifyRailBannerVisible(this.page);
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

Then('all flight results should be from airline {string}', async function (airlineName) {
  logger.info('Verifying all flight results are from airline', { airlineName });
  await FlightResults.verifyAllResultsFromAirline(this.page, airlineName);
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
