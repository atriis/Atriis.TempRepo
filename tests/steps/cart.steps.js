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

When("I click the proceed to checkout button", async function () {
  logger.info("Clicking proceed to checkout button");
    const cartPage = new CartPage(this.page);
  await cartPage.waitForProceedToCheckout();
  await cartPage.clickProceedToCheckout();
});

When("I hold the trip", async function () {
  logger.info("Holding the trip");
  const result = await Cart.holdTrip(this.page);
  expect(result.status.toLowerCase()).toContain(tripStatus.label.onHold.status.toLowerCase());
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
    0.05,
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

When("I add a special request text of {int} characters", async function (charCount) {
  logger.info(`Adding special request text of ${charCount} characters`);
  await Cart.addSpecialRequestTextOfLength(this.page, charCount);
});

Then("the special request should be truncated to {int} characters", async function (maxLength) {
  logger.info(`Verifying special request is truncated to ${maxLength} characters`);
  await Cart.verifySpecialRequestTruncatedTo(this.page, maxLength);
});

When("I send the email", async function () {
  logger.info("Sending email and waiting for success notification");
  await Cart.sendQuoteAndWaitForSuccess(this.page);
});

Then("the download voucher button should be visible in the trip overview", async function () {
  logger.info("Verifying download voucher button is visible in trip overview");
  await Cart.verifyVoucherDownloadVisible(this.page);
});

Then("the download voucher options for english and french should be visible in cart", async function () {
  logger.info("Verifying download voucher options (English and French) are visible in cart");
  await Cart.verifyVoucherDownloadOptionsVisible(this.page);
});

Then("the download voucher options for english and french should not be visible in cart", async function () {
  logger.info("Verifying download voucher options (English and French) are not visible in cart");
  await Cart.verifyVoucherDownloadOptionsNotVisible(this.page);
});

Then("the car location at airport index {int} should contain {string} on cart", async function (index, expectedAirport) {
  logger.info("Verifying car airport location contains expected airport location on cart", { index, expectedAirport });
  await Cart.expectAirportLocationOnCartToContain(this.page, index, expectedAirport);
});

Then("the car location label at index {int} should contain {string} on cart", async function (index, expectedLabel) {
  logger.info("Verifying car location label at index contains expected label on cart", { index, expectedLabel });
  await Cart.expectLocationLabelOnCartToContain(this.page, index, expectedLabel);
});

When("I add Premier Inn Extras Services in cart", async function () {
  logger.info("Adding Premier Inn extras services in cart");
  await Cart.addPremierInnExtras(this.page);
});

When("I save Premier Inn Extras Services in cart", async function () {
  logger.info("Saving Premier Inn extras services in cart");
  await Cart.savePremierInnExtras(this.page);
});

Then("the trip title should contain {string}", async function (city) {
  logger.info("Verifying trip title contains city", { city });
  await Cart.verifyTripTitle(this.page, city);
});

Then("the quote destination should contain {string}", async function (city) {
  logger.info("Verifying quote destination contains city", { city });
  await Cart.verifyQuoteDestination(this.page, city);
});

Then("the trip destination on top of the page should contain {string}", async function (city) {
  logger.info("Verifying trip destination on top of page contains city", { city });
  await Cart.verifyTripDestinationTopPage(this.page, city);
});

Then("the payment method for extras should not be changeable", async function () {
  logger.info("Verifying payment method for extras cannot be changed");
  await Cart.verifyExtrasPaymentNotChangeable(this.page);
});

When("I click to add a hotel to my trip from cart", async function () {
  logger.info("Clicking to add a hotel from cart product carousel");
  await Cart.clickAddHotelFromCart(this.page);
});

Then("a push notification should be displayed", async function () {
  logger.info("Verifying push notification badge is visible in header");
  await Cart.verifyPushNotificationDisplayed(this.page);
});

// ========================================
// PASSENGER TITLE (Travelodge extras)
// ========================================

Then("the passenger title status should show {string}", async function (expectedText) {
  logger.info("Verifying passenger title status text", { expectedText });
  await Cart.verifyPassengerTitleStatus(this.page, expectedText);
});

Then("the passenger title should have a red error border", async function () {
  logger.info("Verifying passenger title has red error border");
  await Cart.verifyPassengerTitleHasErrorBorder(this.page);
});

Then("the passenger title should not have a red error border", async function () {
  logger.info("Verifying passenger title has no red error border");
  await Cart.verifyPassengerTitleNoErrorBorder(this.page);
});

Then("the passenger title should have a green success icon", async function () {
  logger.info("Verifying passenger title has green success icon");
  await Cart.verifyPassengerTitleHasSuccessIcon(this.page);
});

When("I add a passenger title", async function () {
  logger.info("Adding passenger title (opening form, selecting first title, saving)");
  await Cart.addPassengerTitle(this.page);
});

Then("the hotel address in more details should contain {string}", async function (expectedAddress) {
  logger.info("Verifying hotel address in More Details drawer", { expectedAddress });
  await Cart.verifyHotelAddressInMoreDetails(this.page, expectedAddress);
});

Then("the hotel address in the share preview should contain {string}", async function (expectedAddress) {
  logger.info("Verifying hotel address in share preview", { expectedAddress });
  await Cart.verifyHotelAddressInSharePreview(this.page, expectedAddress);
});

When("I close the share dialog", async function () {
  logger.info("Closing share dialog");
  await Cart.closeShareDialog(this.page);
});

// ========================================
// SHARE EMAIL PREVIEW VERIFICATION
// ========================================

Then("the share quote email preview should contain the hotel name {string}", async function (expectedHotelName) {
  logger.info("Verifying share email preview contains hotel name", { expectedHotelName });
  await Cart.verifyShareEmailContainsHotelName(this.page, expectedHotelName);
});

Then("the share quote email preview should contain a hotel picture", async function () {
  logger.info("Verifying share email preview contains hotel picture");
  await Cart.verifyShareEmailContainsHotelImage(this.page);
});

// ========================================
// TRIP NAVIGATION
// ========================================

When("I navigate to trip {int}", async function (tripId) {
  logger.info("Navigating to trip", { tripId });
  await Cart.navigateToTrip(this.page, tripId);
});

// ========================================
// EXPIRED QUOTE — CHECK AVAILABILITY
// ========================================

Then("the check availability button should be visible", async function () {
  logger.info("Verifying check availability button is visible");
  await Cart.verifyCheckAvailabilityButtonVisible(this.page);
});

Then("the remove quote button should be visible", async function () {
  logger.info("Verifying remove quote button is visible");
  await Cart.verifyRemoveQuoteButtonVisible(this.page);
});

When("I click the check availability button", async function () {
  logger.info("Clicking check availability button on expired quote");
  await Cart.clickCheckAvailabilityButton(this.page);
});

Then("the check availability result should be displayed", async function () {
  logger.info("Verifying check availability result dialog");
  await Cart.verifyCheckAvailabilityResult(this.page);
});

When("I change the share language to {string}", async function (language) {
  logger.info("Changing share language", { language });
  await Cart.changeShareLanguage(this.page, language);
});

Then("{string} should be displayed in the share email preview", async function (text) {
  logger.info("Verifying share email preview contains text", { text });
  await Cart.verifySharePreviewContainsText(this.page, text);
});

Then("I should see a provided by label in cart", async function () {
  logger.info("Verifying 'Provided by' label is visible in cart");
  await Cart.verifyProviderLabelInCart(this.page);
});

When("I extract the hotel quote price from cart", async function () {
  logger.info("Extracting hotel quote price from cart");
  this.cartHotelPrice = await Cart.extractHotelQuotePrice(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(this.cartHotelPrice);
  logger.info("Stored cart hotel quote price", { cartHotelPrice: this.cartHotelPrice });
});

Then("the price in cart should match the room level price", async function () {
  if (this.roomLevelPrice === undefined) {
    throw new Error("No room level price stored. Run 'When I extract the price from room level results' before this step.");
  }
  if (this.cartHotelPrice === undefined) {
    throw new Error("No cart hotel price stored. Run 'When I extract the hotel quote price from cart' before this step.");
  }
  logger.info("Comparing cart hotel price with room level price", {
    cartHotelPrice: this.cartHotelPrice,
    roomLevelPrice: this.roomLevelPrice,
  });
  const diff = Math.abs(this.cartHotelPrice - this.roomLevelPrice);
  expect(diff).toBeLessThanOrEqual(1);
});

When("I save the current cart price as the pre-booking price", async function () {
  if (this.cartHotelPrice === undefined) {
    throw new Error("No cart hotel price stored. Run 'When I extract the hotel quote price from cart' before this step.");
  }
  this.preBookingPrice = this.cartHotelPrice;
  logger.info("Saved pre-booking price", { preBookingPrice: this.preBookingPrice });
});

Then("the price in cart should match the pre-booking price", async function () {
  if (this.preBookingPrice === undefined) {
    throw new Error("No pre-booking price stored. Run 'When I save the current cart price as the pre-booking price' before this step.");
  }
  if (this.cartHotelPrice === undefined) {
    throw new Error("No cart hotel price stored. Run 'When I extract the hotel quote price from cart' before this step.");
  }
  logger.info("Comparing cart price with pre-booking price", {
    cartHotelPrice: this.cartHotelPrice,
    preBookingPrice: this.preBookingPrice,
  });
  const diff = Math.abs(this.cartHotelPrice - this.preBookingPrice);
  expect(diff).toBeLessThanOrEqual(1);
});
// ========================================
// LOYALTY NUMBER EXTRAS
// ========================================

When("I expand the loyalty number extras section", async function () {
  logger.info("Expanding loyalty number extras section");
  await Cart.expandLoyaltyExtras(this.page);
});

When("I select the first hotel chain in the loyalty section", async function () {
  logger.info("Selecting first hotel chain in loyalty section");
  this.selectedChainText = await Cart.selectFirstLoyaltyChain(this.page);
  logger.info("Selected hotel chain", { chain: this.selectedChainText });
});

Then("the selected hotel chain should contain a chain code", async function () {
  if (!this.selectedChainText) {
    throw new Error("No hotel chain selected. Run 'When I select the first hotel chain in the loyalty section' before this step.");
  }
  logger.info("Verifying hotel chain contains code", { chain: this.selectedChainText });
  await Cart.verifyHotelChainHasCode(this.page, this.selectedChainText);
});

When("I add a new loyalty number {string} for hotel chain {string}", async function (loyaltyNumber, chainText) {
  logger.info("Adding new loyalty number", { loyaltyNumber, chainText });
  await Cart.addNewLoyaltyNumber(this.page, chainText, loyaltyNumber);
});

Then("the loyalty number {string} and chain {string} should be saved", async function (expectedNumber, expectedChain) {
  logger.info("Verifying loyalty number is saved", { expectedNumber, expectedChain });
  await Cart.verifyLoyaltyNumberSaved(this.page, expectedChain, expectedNumber);
});

// ========================================
// PREMIER INN EXTRAS (BREAKFAST/PAYMENT)
// ========================================

Then("the payment method label should be visible in the extras panel", async function () {
  logger.info("Verifying payment method label is visible in extras");
  await Cart.verifyPremierInnPaymentLabelVisible(this.page);
});

Then("the breakfast type option should not be visible in extras", async function () {
  logger.info("Verifying breakfast type option is NOT visible in extras");
  await Cart.verifyPremierInnBreakfastNotVisible(this.page);
});

// ========================================
// MORE DETAILS DRAWER — PRICE
// ========================================

When("I click more details in cart", async function () {
  logger.info("Opening More Details drawer in cart");
  await Cart.openMoreDetailsInCart(this.page);
});

When("I extract the price from more details", async function () {
  logger.info("Extracting price from More Details drawer");
  this.moreDetailsPrice = await Cart.extractPriceFromMoreDetails(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(this.moreDetailsPrice);
  logger.info("Stored more details price", { moreDetailsPrice: this.moreDetailsPrice });
});

When("I close more details in cart", async function () {
  logger.info("Closing More Details drawer in cart");
  await Cart.closeMoreDetailsInCart(this.page);
});

When("I check terms and conditions in cart", async function () {
  logger.info("Checking terms and conditions are displayed in cart");
  this.cartTermsText = await Cart.checkTermsAndConditionsInCart(this.page);
  logger.info("Cart terms and conditions text", { cartTermsText: this.cartTermsText });
});

When("I add loyalty number {string} using the first available chain", async function (loyaltyNumber) {
  logger.info("Adding loyalty number with first available chain", { loyaltyNumber });
  this.selectedChainText = await Cart.addLoyaltyNumberWithFirstAvailableChain(this.page, loyaltyNumber);
  logger.info("Added loyalty number with chain", { chain: this.selectedChainText });
});

Then("the price in more details should match the price in cart", async function () {
  if (this.moreDetailsPrice === undefined) {
    throw new Error("No more details price stored. Run 'When I extract the price from more details' before this step.");
  }
  if (this.cartHotelPrice === undefined) {
    throw new Error("No cart hotel price stored. Run 'When I extract the hotel quote price from cart' before this step.");
  }
  logger.info("Comparing more details price with cart price", {
    moreDetailsPrice: this.moreDetailsPrice,
    cartHotelPrice: this.cartHotelPrice,
  });
  const diff = Math.abs(this.moreDetailsPrice - this.cartHotelPrice);
  expect(diff).toBeLessThanOrEqual(1);
});