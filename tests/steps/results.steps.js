/**
 * Results Step Definitions
 *
 * Maps Gherkin steps to DSL methods for generic result actions
 * shared across flights, hotels, cars, and rails.
 *
 * ===== STEP CATALOG =====
 *
 * Journey Selection:
 *   "I select and add one way journey to trip"
 *   "I select and add round trip journey to trip"
 *   "I add the first result to trip"
 *
 * Flight Capacity Modals:
 *   "I validate flight capacity modal and go back"
 *   "I add to cart and proceed past flight capacity modal"
 *
 * Out of Policy (OOP):
 *   "I fill in the OOP justification text {string}"
 *   "I select OOP justification option {string}"
 *
 * Assertions - OOP Indicators:
 *   "the out of policy indicator should be visible in results"
 *   "the out of policy indicator should not be visible in results"
 *   "the out of policy tooltip in results should be {string}"
 *   "the out of policy tooltip in results page should be {string}"
 *   "the out of policy indicator should be visible in cart"
 *   "the out of policy indicator should not be visible in cart"
 *   "the out of policy tooltip in cart should be {string}"
 *
 * Assertions - Flight Capacity:
 *   "the flight capacity restriction modal should be visible"
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results, Cart } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - JOURNEY SELECTION
// ========================================

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

// ========================================
// WHEN STEPS - FLIGHT CAPACITY MODALS
// ========================================

When("I validate flight capacity modal and go back", async function () {
  console.log("Validating flight capacity modal and going back");
  await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(this.page);
});

When("I add to cart and proceed past flight capacity modal", async function () {
  console.log("Adding to cart and proceeding past flight capacity modal");
  await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(this.page);
});

// ========================================
// WHEN STEPS - OUT OF POLICY (OOP)
// ========================================

When("I fill in the OOP justification text {string}", async function (text) {
  console.log(`Filling in OOP justification text: ${text}`);
  await Cart.fillInOOPJustificationTextAndSave(this.page, text);
});

When("I select OOP justification option {string}", async function (option) {
  console.log(`Selecting OOP justification option: ${option}`);
  await Cart.selectOOPJustificationDropdownOptionAndSave(this.page, option);
});

// ========================================
// THEN STEPS - OOP INDICATORS IN RESULTS
// ========================================

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

// ========================================
// THEN STEPS - OOP INDICATORS IN CART
// ========================================

Then("the out of policy indicator should be visible in cart", async function () {
  console.log("Verifying OOP indicator is visible in cart");
  await Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(this.page);
});

Then("the out of policy indicator should not be visible in cart", async function () {
  console.log("Verifying OOP indicator is not visible in cart");
  await Cart.verifyOutOfPolicyIndicatorIsNotVisibleInCart(this.page);
});

Then("the out of policy tooltip in cart should be {string}", async function (expectedText) {
  console.log(`Verifying OOP tooltip in cart: ${expectedText}`);
  await Cart.hoverOverCartOOPInfoAndVerifyTooltipTextIs(this.page, expectedText);
});

// ========================================
// THEN STEPS - FLIGHT CAPACITY
// ========================================

Then("the flight capacity restriction modal should be visible", async function () {
  console.log("Verifying flight capacity restriction modal is visible");
  await Results.assertFlightCapacityRestrictionModalIsVisible(this.page);
});
