require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results } = require("@dsl");
const { ResultsPage } = require("@pages/ResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const { getStoredFlightNumbers, getTravelerCount } = require("../support/scenarioState");
const logger = require("@utils/logger").child("Results");

setDefaultTimeout(120000);

// ===== WHEN STEPS - JOURNEY SELECTION =====

When("I select and add one way journey to trip", async function () {
  logger.info("Selecting one-way journey and adding to trip");
  await Results.clickSelectButtonOneWayAndClickAddToTrip(this.page);
});

When("I wait for select text to be visible", async function () {
  logger.info("Waiting for 'Select' text to be visible in results");
  const resultsPage = getPageObject(this.page, ResultsPage);
  await resultsPage.waitForSelectText();
});

When("I wait to see change button", async function () {
  logger.info("Waiting for share button to change to its Added state");
  await Results.waitForShareButtonChangeInResults(this.page);
});

When("I wait for add to trip text to be visible", async function () {
  logger.info("Waiting for 'Add to trip' button to be visible");
  const resultsPage = getPageObject(this.page, ResultsPage);
  await resultsPage.waitForAddToTripText();
});

When("I add the first result to trip", async function () {
  logger.info("Adding first result to trip");
  await Results.waitAndClickAddToTripButton(this.page);
});

When("I handle conflicting quotes if visible", async function () {
  logger.info("Checking for conflicting quotes modal");
  await Results.clickProceedConflictQuoteModal(this.page);
});

Then("the conflicting quote modal should be visible", async function () {
  logger.info("Verifying conflicting quote modal is visible");
  await Results.verifyConflictQuoteModalVisible(this.page);
});

When("I extract and store the trip number from the conflicting quote modal", async function () {
  logger.info("Extracting trip number from conflicting quote modal");
  this.storedConflictingTripId = await Results.extractTripNumberFromConflictingQuoteModal(this.page);
  logger.info("Stored conflicting trip ID", { tripId: this.storedConflictingTripId });
});

When("I click the trip number in the conflicting quote modal", async function () {
  logger.info("Clicking trip number link in conflicting quote modal");
  this.newTabPage = await Results.clickTripNumberInConflictingQuoteModal(this.page);
  logger.info("New tab opened for conflicting trip cart");
});

Then("a new tab should have been opened", async function () {
  logger.info("Verifying a new tab was opened");
  expect(
    this.newTabPage,
    "Expected a new tab to have been opened after clicking the trip number in the conflicting quote modal",
  ).toBeTruthy();
});

Then("the trip number in the new tab cart should match the stored conflicting quote trip number", async function () {
  if (!this.newTabPage) {
    throw new Error("[Results] Cannot verify trip number in cart: no new tab page stored. Ensure the click step ran first.");
  }
  if (!this.storedConflictingTripId) {
    throw new Error("[Results] Cannot verify trip number in cart: no trip ID stored. Ensure the extract step ran first.");
  }
  logger.info("Verifying trip number in new tab cart matches stored ID", { storedTripId: this.storedConflictingTripId });
  await Results.verifyTripNumberInNewTabMatchesStored(this.newTabPage, this.storedConflictingTripId);
});

When("I select and add round trip journey to trip", async function () {
  logger.info("Selecting round trip journey and adding to trip");
  await Results.clickSelectButtonRoundTripAndClickAddToTrip(this.page);
});

// ===== WHEN STEPS - FLIGHT CAPACITY MODALS =====

When("I validate flight capacity modal and go back", async function () {
  logger.info("Validating flight capacity modal and going back");
  const result = await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(this.page);
  expect(result.modalVisible).toBe(true);
});

When("I validate the flight capacity restriction modal details", async function () {
  const storedFlightNumbers = getStoredFlightNumbers(this);
  const passengerCount = getTravelerCount(this);
  logger.info("Validating flight capacity restriction modal details", {
    flightNumbers: storedFlightNumbers,
    passengerCount,
  });

  const result = await Results.verifyFlightCapacityRestrictionModalContent(
    this.page,
    storedFlightNumbers,
    passengerCount,
  );

  expect(result.modalVisible).toBe(true);
});

When("I validate flight capacity modal and click proceed anyway", async function () {
  const storedFlightNumbers = getStoredFlightNumbers(this);
  const passengerCount = getTravelerCount(this);
  logger.info("Validating flight capacity modal and proceeding anyway", {
    flightNumbers: storedFlightNumbers,
    passengerCount,
  });

  const result = await Results.verifyFlightCapacityModalContentAndProceed(
    this.page,
    storedFlightNumbers,
    passengerCount,
  );

  expect(result.modalVisible).toBe(true);
});

When("I add to cart and proceed past flight capacity modal", async function () {
  logger.info("Adding to cart and proceeding past flight capacity modal");
  const result = await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(this.page);
  expect(result.modalVisible).toBe(true);
});

// ===== THEN STEPS - OOP INDICATORS IN RESULTS =====

Then("the out of policy indicator should be visible in results", async function () {
  logger.info("Verifying OOP indicator is visible in results");
  const isVisible = await Results.isOutOfPolicyIndicatorVisibleInResults(this.page);
  expect(isVisible).toBe(true);
});

Then("the out of policy indicator should not be visible in results", async function () {
  logger.info("Verifying OOP indicator is not visible in results");
  const isHidden = await Results.isOutOfPolicyIndicatorHiddenInResults(this.page);
  expect(isHidden).toBe(true);
});

Then("the out of policy tooltip in results should be {string}", async function (expectedText) {
  logger.info("Verifying OOP tooltip in results", { expectedText });
  const actualText = await Results.hoverAndGetOOPTooltipTextInResults(this.page);
  const normalizedActual = actualText.replace(/\s+/g, ' ').trim();
  const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();
  expect(normalizedActual).toBe(normalizedExpected);
});

Then("the {string} text should be visible in results", async function (expectedText) {
  logger.info("Verifying text is visible in results", { expectedText });
  const isVisible = await Results.isResultButtonTextVisible(this.page, expectedText);
  expect(isVisible).toBe(true);
});

// ===== THEN STEPS - FLIGHT CAPACITY =====

Then("the flight capacity restriction modal should be visible", async function () {
  logger.info("Verifying flight capacity restriction modal is visible");
  const isVisible = await Results.isFlightCapacityRestrictionModalVisible(this.page);
  expect(isVisible).toBe(true);
});

// ===== WHEN STEPS - FILTERS =====

When("I filter results by {string} checkbox", async function (option) {
  logger.info("Filtering results by checkbox", { option });
  const resultsPage = getPageObject(this.page, ResultsPage);
  await resultsPage.filterByCheckboxOption(option);
});

When("I filter airline results by {string} checkbox", async function (option) {
  logger.info("Filtering airline results by checkbox", { option });
  await Results.filterAirlineByCheckboxOption(this.page, option);
});

When("I filter results by {string}", async function (optionLabel) {
  const filterTitle = "Car Class";
  logger.info("Filtering results by filter section option", { optionLabel, filterTitle });
  await Results.selectFilterSectionOption(this.page, optionLabel, filterTitle);
});

When("I remove the filter {string}", async function (optionLabel) {
  const filterTitle = "Car Class";
  logger.info("Removing filter section option", { optionLabel, filterTitle });
  await Results.removeFilterSectionOption(this.page, optionLabel, filterTitle);
});

// ===== THEN STEPS - FILTERS =====

Then("the reset filters button should be visible and disabled", async function () {
  logger.info("Verifying reset filters button is visible and disabled");
  await Results.validateResetFiltersButtonIsVisibleAndDisabled(this.page);
});

Then('the no results found message should be displayed', async function () {
  logger.info('Verifying no-results message is displayed');
  await Results.validateNoResultsTitle(this.page);
});

Then('the reset filters and edit search buttons should be visible in no results state', async function () {
  logger.info('Verifying no-results action buttons are visible');
  await Results.validateNoResultsActionButtonsVisible(this.page);
});

When('I click reset filters in no results state', async function () {
  logger.info('Clicking reset filters in no-results state');
  await Results.clickNoResultsResetFilters(this.page);
});

When("I log the trip number from the URL", async function () {
  const url = this.page.url();
  const match = url.match(/\/trips\/(\d+)/);
  const tripId = match ? match[1] : 'unknown';
  logger.info(`[TRIP ID] ${tripId}`, { tripId, url });
  console.log(`\n>>> TRIP ID: ${tripId} <<<\n`);
});
