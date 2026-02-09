/**
 * Results Step Definitions
 *
 * Maps Gherkin steps to DSL methods for generic result actions
 * shared across flights, hotels, cars, and rails.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I select and add one way journey to trip"
 *     → Results.clickSelectButtonOneWayAndClickAddToTrip(page)
 *
 *   "I add the first result to trip"
 *     → Results.waitAndClickAddToTripButton(page)
 *
 *   "I select and add round trip journey to trip"
 *     → Results.clickSelectButtonRoundTripAndClickAddToTrip(page)
 *
 *   "I validate flight capacity modal and go back"
 *     → Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page)
 *
 *   "I add to cart and proceed past flight capacity modal"
 *     → Results.validateFlightCapacityModalIsVisibleAfterAddToCart(page)
 *
 *   "I fill in the OOP justification text {string}"
 *     → Cart.fillInOOPJustificationTextAndSave(page, text)
 *
 *   "I select OOP justification option {string}"
 *     → Cart.selectOOPJustificationDropdownOptionAndSave(page, option)
 *
 * Then Steps:
 *   "the out of policy indicator should be visible in results"
 *     → Results.verifyOutOfPolicyIndicatorVisibleInResults(page)
 *
 *   "the out of policy indicator should not be visible in results"
 *     → Results.verifyOutOfPolicyIndicatorNotVisibleInResults(page)
 *
 *   "the out of policy tooltip in results should be {string}"
 *     → Results.hoverOverResultsOOPInfoAndVerifyTooltipTextIs(page, text)
 *
 *   "the out of policy tooltip in results page should be {string}"
 *     → Results.verifyOutOfPolicyTooltipInResultsPage(page, text)
 *
 *   "the out of policy indicator should be visible in cart"
 *     → Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(page)
 *
 *   "the out of policy indicator should not be visible in cart"
 *     → Cart.verifyOutOfPolicyIndicatorIsNotVisibleInCart(page)
 *
 *   "the out of policy tooltip in cart should be {string}"
 *     → Cart.hoverOverCartOOPInfoAndVerifyTooltipTextIs(page, text)
 *
 *   "the flight capacity restriction modal should be visible"
 *     → Results.assertFlightCapacityRestrictionModalIsVisible(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Results, Cart } = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

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

When("I validate flight capacity modal and go back", async function () {
  console.log("Validating flight capacity modal and going back");
  await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(this.page);
});

When("I add to cart and proceed past flight capacity modal", async function () {
  console.log("Adding to cart and proceeding past flight capacity modal");
  await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(this.page);
});

When("I fill in the OOP justification text {string}", async function (text) {
  console.log(`Filling in OOP justification text: ${text}`);
  await Cart.fillInOOPJustificationTextAndSave(this.page, text);
});

When("I select OOP justification option {string}", async function (option) {
  console.log(`Selecting OOP justification option: ${option}`);
  await Cart.selectOOPJustificationDropdownOptionAndSave(this.page, option);
});

// ===== THEN STEPS =====

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

Then("the flight capacity restriction modal should be visible", async function () {
  console.log("Verifying flight capacity restriction modal is visible");
  await Results.assertFlightCapacityRestrictionModalIsVisible(this.page);
});
