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
 *     → Cart.cancelTripStrict(page) + expect(result.messageVisible).toBe(true)
 *   "the booking status should be {string}"
 *     → Cart.getBookingStatus({page}) + expect(actualStatus).toContain(...)
 *   "the out of policy indicator should be visible in cart"
 *     → Cart.isOutOfPolicyIndicatorVisibleInCart(page) + expect(isVisible).toBe(true)
 *   "the out of policy indicator should not be visible in cart"
 *     → Cart.isOutOfPolicyIndicatorHiddenInCart(page) + expect(isHidden).toBe(true)
 *   "the out of policy tooltip in cart should be {string}"
 *     → Cart.hoverAndGetOOPTooltipTextInCart(page) + expect(actualText).toBe(expectedText)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const Cart = require("@dsl/Cart");
const { CartPage } = require("@pages/CartPage");
const tripStatus = require("@data/tripStatus.json");
const { expect } = require("@fixtures/supplierTest");
const logger = require("@utils/logger").child("Cart");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I click to open fare rules in cart", async function () {
  logger.info("Clicking to open fare rules in cart");
  await Cart.clickToOpenFareRulesInCart(this.page);
});

When("I accept Terms & Conditions", async function () {
  logger.info("Accepting T&Cs");
  const cartPage = new CartPage(this.page);
  await cartPage.acceptTermsAndConditions();
});

When("I proceed to checkout", async function () {
  logger.info("Proceeding to checkout");
  await Cart.acceptTermsAndConditionsAndProceedToCheckout(this.page);
});

When("I hold the trip", async function () {
  logger.info("Holding the trip");
  const result = await Cart.holdTrip(this.page);
  expect(result.status).toContain(tripStatus.label.onHold.status);
});

When("I cancel the trip", async function () {
  logger.info("Cancelling trip");
  const result = await Cart.cancelTripStrict(this.page);
  expect(result.messageVisible, "Cancellation confirmation message should be visible").toBe(true);
});

When("I attempt to cancel the trip safely", async function () {
  logger.info("Attempting to cancel trip (safe mode)");
  const result = await Cart.cancelTripSafely(this.page);
  this.cancelResult = result;
});

When("I click to open price breakdown in cart", async function () {
  logger.info("Clicking to open price breakdown in cart");
  await Cart.clickToOpenPriceBreakdown(this.page);
});

When("I close price breakdown modal", async function () {
  logger.info("Closing price breakdown modal");
  const cartPage = new CartPage(this.page);
  await cartPage.clickXToClosePriceBreakdownModal();
});

When("I click the share quote button", async function () {
  logger.info("Clicking share quote button");
  await Cart.clickShareQuoteAndWaitForSubjectField(this.page);
});

When("I click the share itinerary button", async function () {
  logger.info("Clicking share itinerary button");
  await Cart.clickShareItineraryAndWaitForSubjectField(this.page);
});

When("I send the share", async function () {
  logger.info("Sending share with success notification");
  await Cart.sendQuoteAndWaitForSuccess(this.page);
});

When("I fill in the OOP justification text {string}", async function (text) {
  logger.info("Filling in OOP justification text", { text });
  await Cart.fillInOOPJustificationTextAndSave(this.page, text);
});

When("I select OOP justification option {string}", async function (option) {
  logger.info("Selecting OOP justification option", { option });
  await Cart.selectOOPJustificationDropdownOptionAndSave(this.page, option);
});

When("I click to edit extras", async function () {
  logger.info("Clicking to edit extras");
  const cartPage = new CartPage(this.page);
  await cartPage.clickEditExtrasButton();
});

// ===== THEN STEPS =====

Then("I successfully cancel the trip", async function () {
  logger.info("Cancelling the trip successfully");
  const result = await Cart.cancelTripStrict(this.page);
  expect(result.messageVisible, "Cancellation confirmation message should be visible").toBe(true);
});

Then("the booking status should be {string}", async function (status) {
  logger.info("Verifying booking status", { status });
  const actualStatus = await Cart.getBookingStatus({ page: this.page });
  
  if (status === "Pending booking") {
    expect(actualStatus).toContain(tripStatus.label.pendingBooking.status);
  } else if (status === "On Hold") {
    expect(actualStatus).toContain(tripStatus.label.onHold.status);
  } else if (status === "Ticketing Complete") {
    expect(actualStatus).toContain(tripStatus.label.ticketingComplete.status);
  }
  else if (status === "Confirmed") {
    expect(actualStatus).toContain(tripStatus.label.confirmed.status);
  } else {
    throw new Error(`Unknown booking status: ${status}`);
  }
});

Then("the out of policy indicator should be visible in cart", async function () {
  logger.info("Verifying OOP indicator is visible in cart");
  const isVisible = await Cart.isOutOfPolicyIndicatorVisibleInCart(this.page);
  expect(isVisible).toBe(true);
});

Then("the out of policy indicator should not be visible in cart", async function () {
  logger.info("Verifying OOP indicator is not visible in cart");
  const isHidden = await Cart.isOutOfPolicyIndicatorHiddenInCart(this.page);
  expect(isHidden).toBe(true);
});

Then("the out of policy tooltip in cart should be {string}", async function (expectedText) {
  logger.info("Verifying OOP tooltip in cart", { expectedText });
  const actualText = await Cart.hoverAndGetOOPTooltipTextInCart(this.page);
  expect(actualText).toBe(expectedText);
});

Then("passport details are displayed as {string}", async function (expectedText) {
  logger.info("Asserting passport details are displayed", { expectedText });
  const actualText = await Cart.getPassportDetailsText(this.page, 0);
  expect(actualText).toBe(expectedText);
});