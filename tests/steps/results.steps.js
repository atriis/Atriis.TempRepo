/**
 * Results Step Definitions
 *
 * Maps Gherkin steps to Results DSL methods for generic result actions.
 * Results DSL handles journey selection, flight capacity modals, and OOP indicators in results.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps - Journey Selection:
 *   "I select and add one way journey to trip"
 *     → Results.clickSelectButtonOneWayAndClickAddToTrip(page)
 *
 *   "I select and add round trip journey to trip"
 *     → Results.clickSelectButtonRoundTripAndClickAddToTrip(page)
 *
 *   "I add the first result to trip"
 *     → Results.waitAndClickAddToTripButton(page)
 *
 * When Steps - Flight Capacity Modals:
 *   "I validate flight capacity modal and go back"
 *     → Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page)
 *
 *   "I add to cart and proceed past flight capacity modal"
 *     → Results.validateFlightCapacityModalIsVisibleAfterAddToCart(page)
 *
 * Then Steps - OOP Indicators in Results:
 *   "the out of policy indicator should be visible in results"
 *     → Results.isOutOfPolicyIndicatorVisibleInResults(page) + expect(isVisible).toBe(true)
 *
 *   "the out of policy indicator should not be visible in results"
 *     → Results.isOutOfPolicyIndicatorHiddenInResults(page) + expect(isHidden).toBe(true)
 *
 *   "the out of policy tooltip in results should be {string}"
 *     → Results.hoverAndGetOOPTooltipTextInResults(page) + expect(actualText).toBe(expectedText)
 *
 *   "the out of policy tooltip in results page should be {string}"
 *     → Results.hoverAndGetOOPTooltipTextInResults(page) + expect(actualText).toBe(expectedText)
 *
 * Then Steps - Flight Capacity:
 *   "the flight capacity restriction modal should be visible"
 *     → Results.isFlightCapacityRestrictionModalVisible(page) + expect(isVisible).toBe(true)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results } = require("@dsl");
const { expect } = require("@fixtures/supplierTest");
const logger = require("@utils/logger").child("Results");

setDefaultTimeout(120000);

// ===== WHEN STEPS - JOURNEY SELECTION =====

When("I select and add one way journey to trip", async function () {
  logger.info("Selecting one-way journey and adding to trip");
  await Results.clickSelectButtonOneWayAndClickAddToTrip(this.page);
});

When("I add the first result to trip", async function () {
  logger.info("Adding first result to trip");
  await Results.waitAndClickAddToTripButton(this.page);
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
  expect(actualText).toBe(expectedText);
});

Then("the out of policy tooltip in results page should be {string}", async function (expectedText) {
  logger.info("Verifying OOP tooltip in results page", { expectedText });
  const actualText = await Results.hoverAndGetOOPTooltipTextInResults(this.page);
  expect(actualText).toBe(expectedText);
});

// ===== THEN STEPS - FLIGHT CAPACITY =====

Then("the flight capacity restriction modal should be visible", async function () {
  logger.info("Verifying flight capacity restriction modal is visible");
  const isVisible = await Results.isFlightCapacityRestrictionModalVisible(this.page);
  expect(isVisible).toBe(true);
});
