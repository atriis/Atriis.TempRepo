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
 *   "I click to edit extras at index {int}"
 *     → CartPage.clickEditExtrasButton(page, index)
 *   "I wait for the save button"
 *     → CartPage.waitForSaveButton(page)
 *   "I click the save button"
 *     → CartPage.clickSaveButton(page)
 *   "I click number of baggage"
 *     → CartPage.clickNumberOfBaggage(page)
 *   "I click dropdown option {string}"
 *     → CartPage.clickDropdownOption(page, option)
 *   "I click the extras arrow button"
 *     → CartPage.clickArrowButtonExtras(page)
 *   "I click add seats in extras"
 *     → CartPage.clickAddSeatsButton()
 *   "I wait for the seat map to load"
 *     → CartPage.waitForSeatMapToLoad()
 *   "I select the first available flight seat"
 *     → Cart.selectFirstAvailableFlightSeat(page)
 *   "I extract seat price in seat map drawer"
 *     → Cart.extractSeatPriceFromDrawer(page) → this.seatPrice
 *   "I save and close seat map drawer"
 *     → CartPage.saveAndCloseSeatMapDrawer()
 *
 * Then Steps:
 *   "I successfully cancel the trip"
 *     → Cart.cancelTripStrict(page) + expect(result.messageVisible).toBe(true)
 *   "the booking status should be {string}"
 *     → Cart.getBookingStatus({page}) + expect(actualStatus).toContain(...)
 *   "the payment type should be {string}"
 *     → Cart.verifyPaymentType(page, expectedType)
 *   "the out of policy indicator should be visible in cart"
 *     → Cart.isOutOfPolicyIndicatorVisibleInCart(page) + expect(isVisible).toBe(true)
 *   "the out of policy indicator should not be visible in cart"
 *     → Cart.isOutOfPolicyIndicatorHiddenInCart(page) + expect(isHidden).toBe(true)
 *   "the out of policy tooltip in cart should be {string}"
 *     → Cart.hoverAndGetOOPTooltipTextInCart(page) + expect(actualText).toBe(expectedText)
 *   "the baggage green icon should be visible"
 *     → CartPage.getBaggageGreenIcon() + expect(icon).toBeVisible({ timeout: 30000 })
 *   "the total price in cart is equal to total price in cart before seats + seats price"
 *     → extractPriceFromLocation(index 4, cart) vs this.extractedPrices[0] + this.seatPrice
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const Cart = require("@dsl/Cart");
const { CartPage } = require("@pages/CartPage");
const tripStatus = require("@data/tripStatus.json");
const logger = require("@utils/logger").child("Cart");
const { expectSumToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");

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
  expect(result.status.toLowerCase()).toContain(tripStatus.label.onHold.status.toLowerCase());
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

When("I click to edit extras at index {int}", async function (index) {
  logger.info("Clicking to edit extras at index", { index });
  const cartPage = new CartPage(this.page);
  await cartPage.clickEditExtrasButton(index);
});

When("I wait for the save button", async function () {
  logger.info("Waiting for save button to be visible");
  const cartPage = new CartPage(this.page);
  await cartPage.waitForSaveButton();
});

When("I click the save button", async function () {
  logger.info("Clicking save button");
  const cartPage = new CartPage(this.page);
  await cartPage.clickSaveButton();
});

When("I click number of baggage", async function () {
  logger.info("Clicking number of baggage dropdown");
  const cartPage = new CartPage(this.page);
  await cartPage.clickNumberOfBaggage();
});

When("I click dropdown option {string}", async function (option) {
  logger.info("Clicking dropdown option", { option });
  const cartPage = new CartPage(this.page);
  await cartPage.clickDropdownOption(option);
});

When("I click the extras arrow button", async function () {
  logger.info("Clicking extras arrow button to expand/collapse");
  const cartPage = new CartPage(this.page);
  await cartPage.clickArrowButtonExtras();
});

When("I click add seats in extras", async function () {
  logger.info("Clicking 'Add seats' button in extras");
  const cartPage = new CartPage(this.page);
  await cartPage.clickAddSeatsButton();
});

When("I wait for the seat map to load", async function () {
  logger.info("Waiting for seat map to load");
  const cartPage = new CartPage(this.page);
  await cartPage.waitForSeatMapToLoad();
});

When("I select the first available flight seat", async function () {
  logger.info("Selecting first available flight seat with a price");
  await Cart.selectFirstAvailableFlightSeat(this.page);
});

When("I extract seat price in seat map drawer", async function () {
  this.seatPrice = await Cart.extractSeatPriceFromDrawer(this.page);
  logger.info("Extracted seat price from seat map drawer", { seatPrice: this.seatPrice });
  console.log(`[Seat Price] ${this.seatPrice}`);
});

When("I save and close seat map drawer", async function () {
  logger.info("Saving and closing seat map drawer");
  const cartPage = new CartPage(this.page);
  await cartPage.saveAndCloseSeatMapDrawer();
});

When("I select default delivery method and save", async function () {
  logger.info("Selecting default delivery method (atriis - on site travel management printer)");
  await Cart.selectDefaultDeliveryMethod(this.page);
});

When("I extract cancellation policy from cart", async function () {
  logger.info("Extracting cancellation policy from cart");
  this.cartCancellationPolicy = await Cart.getCancellationPolicyFromCart(this.page);
  logger.info("Extracted cancellation policy from cart", { cartCancellationPolicy: this.cartCancellationPolicy });
});

// ===== THEN STEPS =====

Then("the total price in cart is equal to total price in cart before seats + seats price", async function () {
  const { expect: pwExpect } = require("@playwright/test");
  const cartPage = new CartPage(this.page);
  const priceBeforeSeats = this.extractedPrices[0];
  const seatPrice = this.seatPrice;

  // Poll until the cart total updates to a value different from pre-seat price
  let currentTotal;
  await pwExpect(async () => {
    currentTotal = await cartPage.getCartTotalPrice();
    pwExpect(currentTotal).not.toBe(priceBeforeSeats);
  }).toPass({ timeout: 20000 });

  console.log(`[Price Assertion] Before seats: ${priceBeforeSeats}, Seat price: ${seatPrice}, Expected total: ${priceBeforeSeats + seatPrice}, Actual: ${currentTotal}`);
  expectSumToBeEqualWithTolerance(
    priceBeforeSeats,
    seatPrice,
    currentTotal,
    0.02,
    "Cart total = flight price + seat price"
  );
});

Then("I successfully cancel the trip", async function () {
  logger.info("Cancelling the trip successfully");
  const result = await Cart.cancelTripStrict(this.page);
  expect(result.messageVisible, "Cancellation confirmation message should be visible").toBe(true);
});

Then("the booking status should be {string}", async function (status) {
  logger.info("Verifying booking status", { status });
  await Cart.expectBookingStatusToBe(status, { page: this.page });
});

Then("the payment type should be {string}", async function (expectedType) {
  logger.info("Verifying payment type", { expectedType });
  await Cart.verifyPaymentType(this.page, expectedType);
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

Then("the CO2 emissions should be displayed in the trip overview", async function () {
  logger.info("Verifying CO2 emissions are displayed in trip overview");
  const result = await Cart.verifyCO2InTripOverview(this.page);
  logger.info("CO2 verification result in trip overview", { visible: result.visible, value: result.value });
  expect(result.visible).toBe(true);
});

Then("passport details are displayed as {string}", async function (expectedText) {
  logger.info("Asserting passport details are displayed", { expectedText });
  const actualText = await Cart.getPassportDetailsText(this.page, 0);
  expect(actualText).toBe(expectedText);
});

Then("the baggage green icon should be visible", async function () {
  logger.info("Verifying baggage green icon is visible");
  const cartPage = new CartPage(this.page);
  const icon = cartPage.getBaggageGreenIcon();
  await expect(icon).toBeVisible({ timeout: 30000 });
});

Then("the hotel should appear as refundable in cart", async function () {
  logger.info("Verifying hotel is refundable");
  await Cart.expectHotelToBeRefundableInCart(this.page);
});

Then("the cart should show 2 rooms badge", async function () {
  logger.info("Verifying 2 rooms badge is displayed in cart hotel summary");
  await Cart.verify2RoomsBadge(this.page);
});

When("I add a special request with text {string}", async function (text) {
  logger.info(`Adding special request: "${text}"`);
  this.specialRequestText = text;
  await Cart.addSpecialRequest(this.page, text);
});