require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results } = require("@dsl");
const { ResultsPage } = require("@pages/ResultsPage");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger").child("Results");

setDefaultTimeout(120000);

// ===== WHEN STEPS - JOURNEY SELECTION =====

When("I select and add one way journey to trip", async function () {
  logger.info("Selecting one-way journey and adding to trip");
  await Results.clickSelectButtonOneWayAndClickAddToTrip(this.page);
});

When("I wait for select text to be visible", async function () {
  logger.info("Waiting for 'Select' text to be visible in results");
  const resultsPage = new ResultsPage(this.page);
  await resultsPage.waitForSelectText();
});

When("I wait for add to trip text to be visible", async function () {
  logger.info("Waiting for 'Add to trip' button to be visible");
  const resultsPage = new ResultsPage(this.page);
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
  const resultsPage = new ResultsPage(this.page);
  await resultsPage.filterByCheckboxOption(option);
});

When("I filter airline results by {string} checkbox", async function (option) {
  logger.info("Filtering airline results by checkbox", { option });
  await Results.filterAirlineByCheckboxOption(this.page, option);
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
