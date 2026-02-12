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
 *     → Results.verifyOutOfPolicyIndicatorVisibleInResults(page)
 *
 *   "the out of policy indicator should not be visible in results"
 *     → Results.verifyOutOfPolicyIndicatorNotVisibleInResults(page)
 *
 *   "the out of policy tooltip in results should be {string}"
 *     → Results.hoverOverResultsOOPInfoAndVerifyTooltipTextIs(page, expectedText)
 *
 *   "the out of policy tooltip in results page should be {string}"
 *     → Results.verifyOutOfPolicyTooltipInResultsPage(page, expectedText)
 *
 * Then Steps - Flight Capacity:
 *   "the flight capacity restriction modal should be visible"
 *     → Results.assertFlightCapacityRestrictionModalIsVisible(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results } = require("@dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS - JOURNEY SELECTION =====

When("I select and add one way journey to trip", async function () {
  console.log("Selecting one-way journey and adding to trip");
  await Results.clickSelectButtonOneWayAndClickAddToTrip(this.page);
});

When("I add the first result to trip", async function () {
  console.log("Adding first result to trip");
  await Results.waitAndClickAddToTripButton(this.page);
});

When("I select and add round trip journey to trip", async function () {
  console.log("Selecting round trip journey and adding to trip");
  await Results.clickSelectButtonRoundTripAndClickAddToTrip(this.page);
});

// ===== WHEN STEPS - FLIGHT CAPACITY MODALS =====

When("I validate flight capacity modal and go back", async function () {
  console.log("Validating flight capacity modal and going back");
  await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(this.page);
});

When("I add to cart and proceed past flight capacity modal", async function () {
  console.log("Adding to cart and proceeding past flight capacity modal");
  await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(this.page);
});

// ===== THEN STEPS - OOP INDICATORS IN RESULTS =====

Then("the out of policy indicator should be visible in results", async function () {
  console.log("Verifying OOP indicator is visible in results");
  await Results.verifyOutOfPolicyIndicatorVisibleInResults(this.page);
});

Then("the out of policy indicator should not be visible in results", async function () {
  console.log("Verifying OOP indicator is not visible in results");
  await Results.verifyOutOfPolicyIndicatorNotVisibleInResults(this.page);
});

Then("the out of policy tooltip in results should be {string}", async function (expectedText) {
  console.log(`Verifying OOP tooltip in results: ${expectedText}`);
  await Results.hoverOverResultsOOPInfoAndVerifyTooltipTextIs(this.page, expectedText);
});

Then("the out of policy tooltip in results page should be {string}", async function (expectedText) {
  console.log(`Verifying OOP tooltip in results page: ${expectedText}`);
  await Results.verifyOutOfPolicyTooltipInResultsPage(this.page, expectedText);
});

// ===== THEN STEPS - FLIGHT CAPACITY =====

Then("the flight capacity restriction modal should be visible", async function () {
  console.log("Verifying flight capacity restriction modal is visible");
  await Results.assertFlightCapacityRestrictionModalIsVisible(this.page);
});
