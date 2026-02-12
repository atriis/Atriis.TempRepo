/**
 * Cart Step Definitions
 *
 * Maps Gherkin steps to Cart DSL methods for cart-related actions.
 * Cart DSL handles fare rules, terms & conditions, trip actions, price breakdowns, sharing, and OOP.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I click to open fare rules in cart"
 *     → Cart.clickToOpenFareRulesInCart(page)
 *   "I accept Terms & Conditions"
 *     → CartPage.acceptTermsAndConditions(page)
 *   "I proceed to checkout"
 *     → Cart.acceptTermsAndConditionsAndProceedToCheckout(page)
 *   "I hold the trip"
 *     → Cart.holdTrip(page)
 *   "I cancel the trip"
 *     → Cart.cancelTripStrict(page)
 *   "I attempt to cancel the trip safely"
 *     → Cart.cancelTripSafely(page)
 *   "I click to open price breakdown in cart"
 *     → Cart.clickToOpenPriceBreakdown(page)
 *   "I close price breakdown modal"
 *     → CartPage.clickXToClosePriceBreakdownModal(page)
 *   "I click the share quote button"
 *     → Cart.clickShareQuoteAndWaitForSubjectField(page)
 *   "I click the share itinerary button"
 *     → Cart.clickShareItineraryAndWaitForSubjectField(page)
 *   "I send the share"
 *     → Cart.sendQuoteAndWaitForSuccess(page)
 *   "I fill in the OOP justification text {string}"
 *     → Cart.fillInOOPJustificationTextAndSave(page, text)
 *   "I select OOP justification option {string}"
 *     → Cart.selectOOPJustificationDropdownOptionAndSave(page, option)
 *   "I click to edit extras"
 *     → CartPage.clickEditExtrasButton(page)
 *
 * Then Steps:
 *   "I successfully cancel the trip"
 *     → Cart.cancelTripStrict(page)
 *   "the booking status should be {string}"
 *     → Cart.expectBookingStatus(status, page)
 *   "the out of policy indicator should be visible in cart"
 *     → Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(page)
 *   "the out of policy indicator should not be visible in cart"
 *     → Cart.verifyOutOfPolicyIndicatorIsNotVisibleInCart(page)
 *   "the out of policy tooltip in cart should be {string}"
 *     → Cart.hoverOverCartOOPInfoAndVerifyTooltipTextIs(page, expectedText)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const Cart = require("@dsl/Cart");
const { CartPage } = require("@pages/CartPage");
const tripStatus = require("@data/tripStatus.json");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I click to open fare rules in cart", async function () {
  console.log("Clicking to open fare rules in cart");
  await Cart.clickToOpenFareRulesInCart(this.page);
});

When("I accept Terms & Conditions", async function () {
  console.log("Accepting T&Cs");
  const cartPage = new CartPage(this.page);
  await cartPage.acceptTermsAndConditions();
});

When("I proceed to checkout", async function () {
  console.log("Proceeding to checkout");
  await Cart.acceptTermsAndConditionsAndProceedToCheckout(this.page);
});

When("I hold the trip", async function () {
  console.log("Holding the trip");
  await Cart.holdTrip(this.page);
});

When("I cancel the trip", async function () {
  console.log("Cancelling trip");
  await Cart.cancelTripStrict(this.page);
});

When("I attempt to cancel the trip safely", async function () {
  console.log("Attempting to cancel trip (safe mode)");
  const result = await Cart.cancelTripSafely(this.page);
  this.cancelResult = result;
});

When("I click to open price breakdown in cart", async function () {
  console.log("Clicking to open price breakdown in cart");
  await Cart.clickToOpenPriceBreakdown(this.page);
});

When("I close price breakdown modal", async function () {
  console.log("Closing price breakdown modal");
  const cartPage = new CartPage(this.page);
  await cartPage.clickXToClosePriceBreakdownModal();
});

When("I click the share quote button", async function () {
  console.log("Clicking share quote button");
  await Cart.clickShareQuoteAndWaitForSubjectField(this.page);
});

When("I click the share itinerary button", async function () {
  console.log("Clicking share itinerary button");
  await Cart.clickShareItineraryAndWaitForSubjectField(this.page);
});

When("I send the share", async function () {
  console.log("Sending share with success notification");
  await Cart.sendQuoteAndWaitForSuccess(this.page);
});

When("I fill in the OOP justification text {string}", async function (text) {
  console.log(`Filling in OOP justification text: ${text}`);
  await Cart.fillInOOPJustificationTextAndSave(this.page, text);
});

When("I select OOP justification option {string}", async function (option) {
  console.log(`Selecting OOP justification option: ${option}`);
  await Cart.selectOOPJustificationDropdownOptionAndSave(this.page, option);
});

When("I click to edit extras", async function () {
  console.log("Clicking to edit extras");
  const cartPage = new CartPage(this.page);
  await cartPage.clickEditExtrasButton();
});

// ===== THEN STEPS =====

Then("I successfully cancel the trip", async function () {
  console.log("Cancelling the trip successfully"); 
  await Cart.cancelTripStrict(this.page); 
});

Then("the booking status should be {string}", async function (status) {
  console.log(`Verifying booking status is: ${status}`);

  if (status === "Pending booking") {
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page: this.page });
  } else if (status === "On Hold") {
    await Cart.expectBookingStatus(tripStatus.label.onHold.status, { page: this.page });
  } else if (status === "Ticketing Complete") {
    await Cart.expectBookingStatus(tripStatus.label.ticketingComplete.status, { page: this.page });
  } else {
    throw new Error(`Unknown booking status: ${status}`);
  }
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

Then("passport details are displayed as {string}", async function (expectedText) {
  console.log(`Asserting passport details are displayed as: ${expectedText}`);
  await Cart.assertPassportDetailsAreDisplayedAs(this.page, 0, expectedText);   
});