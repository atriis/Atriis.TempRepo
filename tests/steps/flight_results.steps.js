/**
 * Flight Results Step Definitions
 *
 * Maps Gherkin steps to FlightResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection & Cart:
 *   "I select one flight segment by schedule"
 *   "I wait for the change flight button to be visible"
 *   "I select flight segments by schedule"
 *   "I add the first flight to cart"
 *
 * Results Filtering:
 *   "I filter results by carrier {string}"
 *
 * Pricing Options:
 *   "I click on 'Pricing Options' for the first result"
 *   "I extract the price from first pricing option"
 *   "I click to open first pricing options"
 *   "I select the first option from pricing options"
 *   "I 'Select to share' first option from pricing options"
 *   "I click share from pricing options"
 *   "I add to trip from pricing options"
 *   "I close pricing options modal"
 * 
 *
 * Fare Rules:
 *   "I click to open fare rules"
 *   "I close fare rules window"
 *   "I click to open flight details"
 *   "I click to open fare rules from modal"
 *   "I close flight details window"
 *
 * Share Quote:
 *   "I click on the 'Share' button"
 *   "I select 2 options from carriers {string} and {string}"
 *   "I click on the 'Share' button to open the share dialog"
 *   "I scroll into offers and get prices"
 *
 * Assertions:
 *   "flight results should be available"
 *   "The shared price for carrier {string} should match the prices from results"
 *   "The shared price for carrier {string} should match the price from pricing options"
 *   "I should see the fare rules note about strictest terms"
 *     → FlightResults.getFareRulesNoteText(page) + expect(noteText).toContain(...)
 *   "the green circle icon at index {int} {string} should be displayed in pricing options"
 *     → FlightResults.isGreenCircleIconVisibleInPricingOptions(page, index) + expect(isVisible).toBe(true)
 *
 * ========================
 */

require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightResults } = require("../../src/dsl");
const { expectNumbersToBeEqual } = require("../../src/assertions/numberAssertions");
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
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
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
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  // Store current carrier for pricing options tracking
  this.currentCarrier = carrier;
  
  // Track carriers in order for shared prices extraction
  if (!this.carriers) this.carriers = [];
  if (!this.carriers.includes(carrier)) {
    this.carriers.push(carrier);
  }
  
  await flightResultsPage.typeInSearchFlightFilter(carrier);
  
  // Wait for filtered results to load
  await this.page.waitForTimeout(1000);
});

// ========================================
// WHEN STEPS - PRICING OPTIONS
// ========================================

When("I click on \"Pricing Options\" for the first result", async function () {
  logger.info("Clicking Pricing Options for first result");
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  // Wait for filter to apply and results to stabilize
  await this.page.waitForTimeout(1500);
  
  await flightResultsPage.waitForPricingOptionsButton();
  await flightResultsPage.clickPricingOptionsButton();
});

When("I extract the price from first pricing option", async function () {
  logger.info("Extracting price from first pricing option");
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
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
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickAddToTripButtonPricingOptionsModal();
});

When("I close pricing options modal", async function () {
  logger.info("Closing pricing options modal");
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickXToClosePricingOptionsModal();
});

When("I close fare rules window", async function () {
  logger.info("Closing fare rules window");
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
  const flightResultsPage = new FlightResultsPage(this.page);
  
  await flightResultsPage.clickXToClosePricingOptionsModal(1);
});

When("I close flight details window", async function () {
  logger.info("Closing flight details window");
  const FlightResultsPage = require("../../src/pages/FlightResultsPage");
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
  const { ResultsPage } = require("../../src/pages/ResultsPage");
  const { CommonPage } = require("../../src/pages/CommonPage");
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
  
  expectNumbersToBeEqual(sharedPrice, resultsPrice, `${carrier} shared price`);
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
  
  expectNumbersToBeEqual(sharedPrice, pricingOptionsPrice, `${carrier} shared price from pricing options`);
});

Then("I should see the fare rules note about strictest terms", async function () {
  logger.info("Verifying fare rules note about strictest terms");
  const noteText = await FlightResults.getFareRulesNoteText(this.page);
  expect(noteText).toContain('Fare rules would be applied according to the strictest terms');
});

Then("the green circle icon at index {int} {string} should be displayed in pricing options", async function (index, description) {
  logger.info("Verifying green circle icon is displayed in pricing options", { index, description });
  const isVisible = await FlightResults.isGreenCircleIconVisibleInPricingOptions(this.page, index);
  expect(isVisible).toBe(true);
});


