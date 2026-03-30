require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightResults } = require("../../src/dsl");
const FlightResultsPage = require("../../src/pages/FlightResultsPage");
const { ResultsPage } = require("../../src/pages/ResultsPage");
const { CommonPage } = require("../../src/pages/CommonPage");
const { expectNumbersToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");
const logger = require("@utils/logger").child("FlightResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FLIGHT SELECTION & CART
// ========================================

When("I select one flight segment by schedule", async function () {
  logger.info("Selecting one flight segment by schedule");
  await FlightResults.selectOneSegmentBySchedule(this.page);
});

When("I wait for the change flight button to be visible", async function () {
  logger.info("Waiting for change flight button to appear");
  const flightResultsPage = new FlightResultsPage(this.page);
  
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

// ========================================
// WHEN STEPS - RESULTS FILTERING
// ========================================

When("I filter results by carrier {string}", async function (carrier) {
  logger.info("Filtering results by carrier", { carrier });
  const flightResultsPage = new FlightResultsPage(this.page);
  
  // Wait for initial results to load (works in both share and normal mode)
  await flightResultsPage.waitForFlightResults();
  
  // Store current carrier for pricing options tracking
  this.currentCarrier = carrier;
  
  // Track carriers in order for shared prices extraction
  if (!this.carriers) this.carriers = [];
  if (!this.carriers.includes(carrier)) {
    this.carriers.push(carrier);
  }
  
  // Type in filter (this also waits for filter element visibility)
  await flightResultsPage.typeInSearchFlightFilter(carrier);
  
  // Wait for filtered results to stabilize
  await this.page.waitForTimeout(2000);
  
  // Wait for filtered results to load
  await flightResultsPage.waitForFlightResults();
});

// ========================================
// WHEN STEPS - PRICING OPTIONS
// ========================================

When("I click on \"Pricing Options\" for the first result", async function () {
  logger.info("Clicking Pricing Options for first result");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  // Wait for filter to apply and results to stabilize
  await this.page.waitForTimeout(1500);
  
  await flightResultsPage.waitForPricingOptionsButton();
  await flightResultsPage.clickPricingOptionsButton();
});

When("I extract the price from first pricing option", async function () {
  logger.info("Extracting price from first pricing option");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  const price = await flightResultsPage.getAmountPriceValuePricingOptions(0);
  
  // Store pricing options prices by carrier
  if (!this.pricingOptionsPrices) this.pricingOptionsPrices = {};
  if (!this.currentCarrier) {
    throw new Error("Current carrier not set. Filter by carrier before extracting pricing options.");
  }
  
  // Store price for current carrier
  if (!this.pricingOptionsPrices[this.currentCarrier]) {
    this.pricingOptionsPrices[this.currentCarrier] = [];
  }
  this.pricingOptionsPrices[this.currentCarrier].push(price);
  
  // ALSO store in extractedPrices array for common assertions
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  logger.info("Extracted pricing option price", { carrier: this.currentCarrier, price });
});

When("I click to open first pricing options", async function () {
  logger.info("Clicking to open first pricing options");
  await FlightResults.clickToOpenPricingOptions(this.page);
});

When('I select the first option from pricing options', async function () {
  logger.info("Selecting first option from pricing options");
  await FlightResults.selectFirstPricingOptionInModal(this.page);
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
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickAddToTripButtonPricingOptionsModal();
});

When("I close pricing options modal", async function () {
  logger.info("Closing pricing options modal");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickXToClosePricingOptionsModal();
});

When("I close fare rules window", async function () {
  logger.info("Closing fare rules window");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickXToClosePricingOptionsModal(1);
});

When("I close flight details window", async function () {
  logger.info("Closing flight details window");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickXToCloseFlightDetailsModal();
});

// ========================================
// WHEN STEPS - SHARE QUOTE FLOW
// ========================================

When('I click on the "Share" button', async function () {
  logger.info("Clicking Share button");
  await FlightResults.waitForAddToTripButtonAndClickShareButton(this.page);
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
  const resultsPage = new ResultsPage(this.page);
  const commonPage = new CommonPage(this.page);
  
  await resultsPage.clickShareQuoteToGetEmailPopUp();
  await commonPage.waitForSubjectLabelSharePopUp();
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

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("flight results should be available", async function () {
  logger.info("Verifying flight results are available");
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
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

Then("I should see the fare rules note about strictest terms", async function () {
  logger.info("Verifying fare rules note about strictest terms");
  const noteText = await FlightResults.getFareRulesNoteText(this.page);
  expect(noteText).toContain('Fare rules would be applied according to the strictest terms');
});

When("I should click fare rules for the second flight leg", async function () {
  logger.info("Clicking fare rules leg tab for the second flight leg");
  await FlightResults.clickFareRulesLegTab(this.page, 1);
});

When("I should click fare rules for the third flight leg", async function () {
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

Then("the carrier name in more details should be {string}", async function (expectedName) {
  logger.info("Verifying carrier name in more details", { expectedName });
  await FlightResults.verifyCarrierNameInDetails(this.page, expectedName);
});

When("I extract the price from pricing option at index {int}", async function (index) {
  logger.info("Extracting price from pricing option at index", { index });
  const flightResultsPage = new FlightResultsPage(this.page);
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
  } else if (indicatorName === 'Marine Fare') {
    await FlightResults.verifyMarineFareIconVisibleInResults(this.page);
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported: "Separated Tickets", "Marine Fare"`);
  }
});

Then('the {string} indicator should be visible in pricing options', async function (indicatorName) {
  logger.info('Verifying indicator is visible in pricing options', { indicatorName });
  if (indicatorName === 'Marine Fare') {
    await FlightResults.verifyMarineFareIconVisibleInPricingOptions(this.page);
  } else {
    throw new Error(`Unknown indicator: "${indicatorName}". Supported: "Marine Fare"`);
  }
});

