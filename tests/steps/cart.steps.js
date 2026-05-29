require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const Cart = require("@dsl/Cart");
const Checkout = require("@dsl/Checkout");
const { CartPage } = require("@pages/CartPage");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { getPageObject } = require("@utils/pageObjectCache");
const tripStatus = require("@data/tripStatus.json");
const { getTravelerCount } = require("../support/scenarioState");
const logger = require("@utils/logger").child("Cart");
const {
  expectNumbersToBeEqualWithTolerance,
  expectSumToBeEqualWithTolerance,
} = require("../../src/assertions/numberAssertions");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I click to open fare rules in cart", async function () {
  logger.info("Clicking to open fare rules in cart");
  await Cart.clickToOpenFareRulesInCart(this.page);
});

When("I accept Terms & Conditions", async function () {
  logger.info("Accepting T&Cs");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.acceptTermsAndConditions();
});

When("I accept all Terms & Conditions on the page", async function () {
  logger.info("Accepting all visible T&Cs on the page");
  await Cart.acceptAllTermsAndConditions(this.page);
});

When("I proceed to checkout", async function () {
  logger.info("Proceeding to checkout");
  await Cart.acceptTermsAndConditionsAndProceedToCheckout(this.page);
});

async function clickTermsAndConditionsLinkFromCartStep(contextLabel) {
  logger.info(`Clicking terms and conditions link ${contextLabel}`);
  await Cart.clickPaymentTermsLink(this.page);
  this.termsAndConditionsModalOpenedAtStep = true;
}

When("I click on the terms and conditions link in the trip overview", async function () {
  await clickTermsAndConditionsLinkFromCartStep.call(this, 'in trip overview');
});

When("I click on the terms and conditions link after booking", async function () {
  await clickTermsAndConditionsLinkFromCartStep.call(this, 'after booking');
});

When("I click the proceed to checkout button", async function () {
  logger.info("Clicking proceed to checkout button");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.waitForProceedToCheckout();
  await cartPage.clickProceedToCheckout();
});

When("I hold the trip", async function () {
  logger.info("Holding the trip");
  const result = await Cart.holdTrip(this.page);
  expect(result.status.toLowerCase()).toContain(tripStatus.label.onHold.status.toLowerCase());
});

When("I click hold flight button", async function () {    
  logger.info("Clicking hold flight button");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickHoldButton();
});

When("I attempt to cancel the trip safely", async function () {
  logger.info("Attempting to cancel trip (safe mode)");
  const result = await Cart.cancelTripSafely(this.page);
  this.cancelResult = result;
});

When("I show cancelled items", async function () {
  logger.info("Showing cancelled items in cart");
  await Cart.showCancelledItems(this.page);
});

When("I click check price button in cart", async function () {
  logger.info("Clicking check price button on the first cancelled quote");
  await Cart.clickCheckPriceButtonInCart(this.page);
});

When("I click check price and proceed on the first cancelled quote", async function () {
  logger.info("Checking price and proceeding on first cancelled quote");
  await Cart.clickCheckPriceAndProceedOnFirstCancelledQuote(this.page);
});

Then("I successfully cancel the quote", async function () {
  logger.info("Cancelling the active quote successfully");
  await Cart.cancelFirstActiveQuote(this.page);
});

Then("the fare rules should be displayed in the price check modal", async function () {
  logger.info("Verifying fare rules are displayed in the price check modal");
  await Cart.verifyFareRulesDisplayedInCheckPriceModal(this.page);
});

When("I click proceed on the price check dialog", async function () {
  logger.info("Clicking proceed on the price check dialog");
  await Cart.clickProceedOnCheckPriceDialog(this.page);
});

When("I click to open price breakdown in cart", async function () {
  logger.info("Clicking to open price breakdown in cart");
  await Cart.clickToOpenPriceBreakdown(this.page);
});

When("I close price breakdown modal", async function () {
  logger.info("Closing price breakdown modal");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickXToClosePriceBreakdownModal();
});

When("I click the share quote button", async function () {
  logger.info("Clicking share quote button");
  await Cart.clickShareQuoteAndWaitForSubjectField(this.page);
});

When("I extract the hotel name to compare with share quote email preview", async function () {
  logger.info("Extracting hotel name for share quote preview comparison");
  this.extractedHotelName = await Cart.extractCurrentCartHotelName(this.page);
  logger.info("Stored extracted hotel name for share quote preview comparison", {
    extractedHotelName: this.extractedHotelName,
  });
});

When("I click the share itinerary button", async function () {
  logger.info("Clicking share itinerary button");
  await Cart.clickShareItineraryAndWaitForSubjectField(this.page);
});

When('I switch the share email preview to detailed view', async function () {
  logger.info('Switching the share email preview to detailed view');
  await Cart.switchSharePreviewToDetailedView(this.page);
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

When("I select OOP justification option {string} from the open dropdown", async function (option) {
  logger.info("Selecting OOP justification option from open dropdown", { option });
  await Cart.selectOpenOOPJustificationDropdownOptionAndSave(this.page, option);
});

When("I open the OOP justification dropdown and verify there are {int} options", async function (count) {
  logger.info("Opening OOP justification dropdown and verifying option count", { count });
  await Cart.openJustificationDropdownAndVerifyCount(this.page, count);
});

Then('the OOP justification dropdown should be displayed and saving should work as expected', async function () {
  logger.info('Verifying OOP justification dropdown is displayed and can be saved');
  await Cart.verifyOOPJustificationDropdownSaveWorksInCart(this.page);
});

Then("the OOP justification dropdown should contain the following options:", async function (dataTable) {
  const options = dataTable.raw().map(row => row[0]);
  logger.info("Verifying OOP justification dropdown options", { options });
  await Cart.verifyJustificationDropdownContainsOptions(this.page, options);
});

When("I click to edit extras at index {int}", async function (index) {
  logger.info("Clicking to edit extras at index", { index });
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickEditExtrasButton(index);
});

When("I click seating in extras", async function () {
  logger.info("Clicking seating section in extras");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickEditSeatingExtrasButton();
});

When("I click to edit the meal extras section", async function () {
  logger.info("Clicking to edit the meal extras section");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickEditMealExtrasButton();
});

When("I click to edit the baggage extras section", async function () {
  logger.info("Clicking to edit the baggage extras section");
  await Cart.openBaggageExtras(this.page);
});

Then("the baggage carrier should display {string}", async function (expectedCarrier) {
  logger.info("Verifying baggage carrier name", { expectedCarrier });
  await Cart.verifyBaggageCarrierName(this.page, expectedCarrier);
});

When("I select a baggage option", async function () {
  logger.info("Selecting first available baggage option");
  await Cart.selectFirstBaggageOption(this.page);
});

When("I select a paid baggage option", async function () {
  logger.info("Selecting first paid baggage option (with price)");
  await Cart.selectFirstPaidBaggageOption(this.page);
});

When("I add baggage for outbound and return segments", async function () {
  logger.info("Adding baggage for outbound and return segments");
  await Cart.addBaggageForAllSegments(this.page);
});

When("I select the {string} baggage option for the {string} flight", async function (optionText, direction) {
  logger.info("Selecting baggage option in cart for flight direction", { optionText, direction });
  await Cart.selectBaggageOptionForFlightDirection(this.page, optionText, direction);
});

When("I wait for the save button", async function () {
  logger.info("Waiting for save button to be visible");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.waitForSaveButton();
});

When("I click the save button", async function () {
  logger.info("Clicking save button");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickSaveButton();
});

When("I click number of baggage", async function () {
  logger.info("Clicking number of baggage dropdown");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickNumberOfBaggage();
});

When("I click dropdown option {string}", async function (option) {
  logger.info("Clicking dropdown option", { option });
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickDropdownOption(option);
});

When("I click the extras arrow button", async function () {
  logger.info("Clicking extras arrow button to expand/collapse");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickArrowButtonExtras();
});

When("I click add seats in extras", async function () {
  logger.info("Clicking 'Add seats' button in extras");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickAddSeatsButton();
});

When("I click add seats in extras for traveler {int}", async function (travelerIndex) {
  logger.info("Clicking seating action button for traveler", { travelerIndex });
  await Cart.clickSeatActionButtonForTraveler(this.page, travelerIndex);
});

When("I click frequent flyer in extras", async function () {
  logger.info("Clicking frequent flyer in extras");
  await Cart.openFrequentFlyerExtras(this.page);
});

When("I click hand luggage in extras", async function () {
  logger.info("Clicking hand luggage in extras");
  await Cart.openHandLuggageExtras(this.page);
});

When("I select the first paid hand luggage option", async function () {
  logger.info("Selecting first paid hand luggage option");
  await Cart.selectFirstPaidHandLuggageOption(this.page);
});

Then("the hand luggage green checkmark should be visible", async function () {
  logger.info("Verifying hand luggage success icon (green checkmark) is visible");
  await Cart.verifyHandLuggageHasSuccessIcon(this.page);
});

When("I attempt to save the FQTV section without entering a value", async function () {
  logger.info("Attempting to save FQTV section without entering a value");
  await Cart.saveFqtvWithoutEntering(this.page);
});

Then("the FQTV section should display {string} error", async function (expectedMessage) {
  logger.info("Verifying FQTV section displays required-field error", { expectedMessage });
  await Cart.verifyFqtvRequiredError(this.page);
});

When("I wait for the seat map to load", async function () {
  logger.info("Waiting for seat map to load");
  const cartPage = getPageObject(this.page, CartPage);
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

When("I extract the baggage price", async function () {
  this.baggagePrice = await Cart.extractSelectedBaggagePrice(this.page);
  logger.info("Extracted baggage price from selected option", { baggagePrice: this.baggagePrice });
});

When("I extract the selected baggage option label", async function () {
  this.baggageOptionText = await Cart.extractSelectedBaggageOptionLabel(this.page);
  logger.info("Extracted selected baggage option label", { baggageOptionText: this.baggageOptionText });
});

When("I extract the price from price breakdown", async function () {
  const cartPage = getPageObject(this.page, CartPage);
  // Sum Subtotal rows from Price Summary > Rate Information — these include
  // baggage/extras (via 'other' and 'optionalServices'), while the drawer
  // footer 'Total price' reflects only the supplier flight price.
  const segments = await cartPage.getFlightPriceBreakdownSegments();
  this.priceBreakdownTotal = segments.reduce((sum, seg) => sum + seg.subtotal, 0);
  logger.info("Extracted Subtotal from price breakdown Price Summary", {
    priceBreakdownTotal: this.priceBreakdownTotal,
    segmentCount: segments.length,
  });
});

When("I select a random preferred seat", async function () {
  logger.info("Selecting a random preferred seat from the seat map");
  await Cart.selectRandomPreferredSeat(this.page);
});

When("I hover over a green preferred extra legroom seat", async function () {
  logger.info("Hovering over a green preferred + extra legroom seat in the seat map");
  await Cart.hoverGreenPreferredExtraLegroomSeat(this.page);
});

Then("the seat tooltip should contain preferred and extra legroom labels", async function () {
  logger.info("Verifying seat tooltip contains preferred and extra legroom labels");
  const result = await Cart.verifyPreferredExtraLegroomTooltipVisible(this.page);
  logger.info("Seat tooltip verified", { tooltipText: result.tooltipText });
});

When("I click next flight button", async function () {
  logger.info("Clicking next flight button to advance to the next segment");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.clickNextFlightButton();
});

When("I save and close seat map drawer", async function () {
  logger.info("Saving and closing seat map drawer");
  const cartPage = getPageObject(this.page, CartPage);
  await cartPage.saveAndCloseSeatMapDrawer();
});

Then("seat selection should be restricted with message {string}", async function (expectedMessage) {
  logger.info("Verifying seat selection is restricted", { expectedMessage });
  await Cart.verifySeatSelectionRestricted(this.page, expectedMessage);
});

When("I add seats and validate selection mandatory for all travelers", async function () {
  logger.info("Adding seats and validating mandatory selection for all travelers");
  await Cart.addSeatsAndValidateMandatoryForAllTravelers(this.page);
});

Then("seats saved to trip should be validated", async function () {
  logger.info("Validating seats saved to trip");
  await Cart.verifySeatsSavedToTrip(this.page);
});

Then("the yellow seat indicator should be visible after saving seats", async function () {
  logger.info("Verifying yellow seat indicator is visible after saving seats");
  await Cart.verifyYellowSeatIndicatorVisible(this.page);
});

When("I open passenger info and acknowledge the warning {string}", async function (expectedMessage) {
  logger.info("Opening passenger info and acknowledging warning", { expectedMessage });
  await Cart.acknowledgePassengerInfoWarning(this.page, expectedMessage);
});

Then("passenger info editing should be blocked after booking by message {string}", async function (expectedMessage) {
  logger.info("Verifying passenger info editing is blocked", { expectedMessage });
  await Cart.verifyPassengerInfoEditingBlockedAfterBooking(this.page, expectedMessage);
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

When('I save the current flight cart total for checkout comparison', async function () {
  logger.info('Saving current flight cart total for checkout comparison');
  this.flightCartTotalForCheckout = await Cart.extractCartTotalPrice(this.page);
  logger.info('Saved flight cart total for checkout comparison', {
    flightCartTotalForCheckout: this.flightCartTotalForCheckout,
  });
});

// ===== THEN STEPS =====

Then("the total price in cart is equal to total price in cart before seats + seats price", async function () {
  const { expect: pwExpect } = require("@playwright/test");
  const cartPage = getPageObject(this.page, CartPage);
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
    12,
    "Cart total = flight price + seat price"
  );
});

Then("the price breakdown price should equal the cart price", async function () {
  const cartPage = getPageObject(this.page, CartPage);
  const cartTotal = await cartPage.getCartTotalPrice();
  logger.info("Comparing price breakdown total to cart total", {
    priceBreakdownTotal: this.priceBreakdownTotal,
    cartTotal,
  });
  expectNumbersToBeEqualWithTolerance(
    this.priceBreakdownTotal,
    cartTotal,
    1,
    "Price breakdown total vs cart total"
  );
});

Then("the price in cart should equal the total price before adding baggage + the baggage price", async function () {
  const { expect: pwExpect } = require("@playwright/test");
  const cartPage = getPageObject(this.page, CartPage);
  const priceBeforeBaggage = this.flightCartTotalForCheckout;
  const baggagePrice = this.baggagePrice;

  let currentTotal;
  await pwExpect(async () => {
    currentTotal = await cartPage.getCartTotalPrice();
    pwExpect(currentTotal).not.toBe(priceBeforeBaggage);
  }).toPass({ timeout: 20000 });

  console.log(`[Price Assertion] Before baggage: ${priceBeforeBaggage}, Baggage price: ${baggagePrice}, Expected total: ${priceBeforeBaggage + baggagePrice}, Actual: ${currentTotal}`);
  expectSumToBeEqualWithTolerance(
    priceBeforeBaggage,
    baggagePrice,
    currentTotal,
    12,
    "Cart total = flight price + baggage price"
  );
});

Then("I successfully cancel the trip", async function () {
  logger.info("Cancelling the trip successfully after a 20-second wait");
  const result = await Cart.cancelTripStrictWithWait(this.page, 20000);
  expect(result.messageVisible, "Cancellation confirmation message should be visible").toBe(true);
});

Then("I successfully cancel the trip with 60 seconds wait", async function () {
  logger.info("Cancelling the trip successfully after a 60-second wait");
  const result = await Cart.cancelTripStrictWithWait(this.page, 60000);
  expect(result.messageVisible, "Cancellation confirmation message should be visible").toBe(true);
});

Then("the booking status should be {string}", async function (status) {
  logger.info("Verifying booking status", { status });

  const scenarioTags = Array.isArray(this.scenarioTags) ? this.scenarioTags : [];
  const bookingContext = {
    product: scenarioTags.includes('@transportation') ? 'transportation' : scenarioTags.includes('@hotels') ? 'hotels' : scenarioTags.includes('@flights') ? 'flights' : null,
    subProduct: scenarioTags.includes('@cars')
      ? 'cars'
      : scenarioTags.includes('@rails')
        ? 'rails'
        : scenarioTags.includes('@parking')
          ? 'parking'
          : scenarioTags.includes('@groundtransport')
            ? 'groundTransport'
            : null,
  };

  const result = await Cart.expectBookingStatusToBe(status, {
    page: this.page,
    bookingContext,
  });

  if (result?.knownBookingError && result.shouldSkip) {
    logger.warn('Known booking error matched configured supplier issue', {
      supplier: result.supplier,
      bookingErrorText: result.bookingErrorText,
      status,
      bookingContext,
    });

    await Checkout.verifyBookingErrorMessage(this.page, result.bookingErrorText || result.supplier || null);

    const checkoutPage = getPageObject(this.page, CheckoutPage);
    await checkoutPage.clickBackToTripButton();
    return 'pending';
  }

  if (result?.bookingErrorDetected && !result.knownBookingError) {
    const errorSummary = result.supplier
      ? `supplier: ${result.supplier}`
      : `message: ${result.bookingErrorText || 'unknown booking error'}`;
    throw new Error(`Unexpected booking error detected (${errorSummary})`);
  }
});

Then("the stored flight details should match the displayed flight details", async function () {
  if (!Array.isArray(this.storedFlightSegmentDetails) || this.storedFlightSegmentDetails.length === 0) {
    throw new Error("No stored flight details found. Run 'I store the first flight result details for later comparison' before this step.");
  }

  logger.info("Comparing stored flight details against the currently displayed flight details");
  await Cart.verifyFlightSegmentDetails(this.page, this.storedFlightSegmentDetails);
});

Then("the trip status should be {string}", async function (status) {
  logger.info("Verifying trip status", { status });
  await Cart.verifyTripStatus(this.page, status);
});

Then('the original currency symbol {string} should be visible in cart', async function (currencySymbol) {
  logger.info('Verifying original currency symbol is visible in cart', { currencySymbol });
  await Cart.verifyOriginalCurrencySymbolVisibleInCart(this.page, currencySymbol);
});

Then('the cart display and original prices should match the stored flight result prices for all travelers', async function () {
  if (!this.firstFlightResultPrices) {
    throw new Error('No stored flight result prices found. Run the flight result price storage step before this assertion.');
  }

  const travelerCount = getTravelerCount(this);
  logger.info('Verifying cart display and original prices against stored flight result prices', {
    travelerCount,
    firstFlightResultPrices: this.firstFlightResultPrices,
  });

  await Cart.verifyCartFlightPricesMatchStoredPerTravelerPrices(
    this.page,
    this.firstFlightResultPrices,
    travelerCount,
  );
});

Then('the cart total price should match the last extracted price', async function () {
  if (!Array.isArray(this.extractedPrices) || this.extractedPrices.length === 0) {
    throw new Error("No extracted price stored. Run a price-extraction step before comparing with cart total price.");
  }

  const expectedPrice = this.extractedPrices[this.extractedPrices.length - 1];
  const cartTotalPrice = await Cart.extractCartTotalPrice(this.page);

  logger.info('Comparing cart total price with last extracted price', {
    expectedPrice,
    cartTotalPrice,
  });

  expectNumbersToBeEqualWithTolerance(
    cartTotalPrice,
    expectedPrice,
    5,
    'Cart total price vs extracted price',
  );
});

Then('the cart total price should be the last extracted price multiplied by the number of travelers {int}', async function (travelerCount) {
  if (!Array.isArray(this.extractedPrices) || this.extractedPrices.length === 0) {
    throw new Error('No extracted price stored. Run a price-extraction step before comparing with cart total price.');
  }

  if (!Number.isInteger(travelerCount) || travelerCount < 1) {
    throw new Error(`travelerCount must be a positive integer, got: ${travelerCount}`);
  }

  const extractedPrice = this.extractedPrices[this.extractedPrices.length - 1];
  const expectedPrice = extractedPrice * travelerCount;
  const cartTotalPrice = await Cart.extractCartTotalPrice(this.page);

  logger.info('Comparing cart total price with extracted price multiplied by traveler count', {
    extractedPrice,
    travelerCount,
    expectedPrice,
    cartTotalPrice,
  });

  expectNumbersToBeEqualWithTolerance(
    cartTotalPrice,
    expectedPrice,
    1,
    `Cart total price vs extracted price x ${travelerCount}`,
  );
});

Then('the cart total price should be the last extracted price multiplied by the number of selected travelers', async function () {
  if (!Array.isArray(this.extractedPrices) || this.extractedPrices.length === 0) {
    throw new Error('No extracted price stored. Run a price-extraction step before comparing with cart total price.');
  }

  const travelerCount = this.selectedTravelerCount;
  if (!Number.isInteger(travelerCount) || travelerCount < 1) {
    throw new Error(
      `selectedTravelerCount must be a positive integer — make sure traveler-adding steps ran first. Got: ${travelerCount}`,
    );
  }

  const extractedPrice = this.extractedPrices[this.extractedPrices.length - 1];
  const expectedPrice = extractedPrice * travelerCount;
  const cartTotalPrice = await Cart.extractCartTotalPrice(this.page);

  logger.info('Comparing cart total price with extracted price multiplied by selected traveler count', {
    extractedPrice,
    travelerCount,
    expectedPrice,
    cartTotalPrice,
  });

  expectNumbersToBeEqualWithTolerance(
    cartTotalPrice,
    expectedPrice,
    1,
    `Cart total price vs extracted price x ${travelerCount} (selected travelers)`,
  );
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

Then("the out of policy free text justification should not be visible in cart", async function () {
  logger.info("Verifying OOP free text justification is not visible in cart");
  await Cart.verifyOOPFreeTextJustificationNotVisibleInCart(this.page);
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

Then('the CO2 Squake tooltip should be visible in cart', async function () {
  logger.info('Verifying CO2 Squake tooltip is visible in cart');
  const result = await Cart.verifyFlightCO2SquakeTooltipInCart(this.page);
  logger.info('CO2 Squake tooltip verified in cart', {
    cartTooltipText: result.cartTooltipText,
    detailsTooltipText: result.detailsTooltipText,
  });
  expect(result.visible).toBe(true);
});

Then('the flight price breakdown should match the totals for {int} travelers', async function (travelerCount) {
  if (typeof this.flightCartTotalForCheckout !== 'number') {
    throw new Error("No stored flight cart total found. Run 'I save the current flight cart total for checkout comparison' before this step.");
  }

  logger.info('Verifying flight price breakdown totals', {
    travelerCount,
    flightCartTotalForCheckout: this.flightCartTotalForCheckout,
  });

  const result = await Cart.verifyFlightPriceBreakdownForTravelerCount(
    this.page,
    travelerCount,
    this.flightCartTotalForCheckout,
  );

  logger.info('Flight price breakdown totals verified', result);
});

Then('the flight price breakdown should match the totals for the selected travelers', async function () {
  const travelerCount = this.selectedTravelerCount;
  if (!Number.isInteger(travelerCount) || travelerCount < 1) {
    throw new Error(
      `selectedTravelerCount must be a positive integer — make sure traveler-adding steps ran first. Got: ${travelerCount}`,
    );
  }

  logger.info('Verifying flight price breakdown totals for selected travelers', {
    travelerCount,
    flightCartTotalForCheckout: this.flightCartTotalForCheckout,
  });

  const result = await Cart.verifyFlightPriceBreakdownForTravelerCount(
    this.page,
    travelerCount,
    this.flightCartTotalForCheckout,
  );

  logger.info('Flight price breakdown totals verified', result);
});

Then("passport details are displayed as {string}", async function (expectedText) {
  logger.info("Asserting passport details are displayed", { expectedText });
  const actualText = await Cart.getPassportDetailsText(this.page, 0);
  expect(actualText).toBe(expectedText);
});

Then("the baggage green icon should be visible", async function () {
  logger.info("Verifying baggage green icon is visible");
  const cartPage = getPageObject(this.page, CartPage);
  const icon = cartPage.getBaggageGreenIcon();
  await expect(icon).toBeVisible({ timeout: 30000 });
});

Then("the paid baggage should be displayed in flight details", async function () {
  if (!this.baggageOptionText) {
    throw new Error("No stored baggage option label found. Run 'I extract the selected baggage option label' before this step.");
  }
  logger.info("Verifying paid baggage is displayed in flight details", { baggageOptionText: this.baggageOptionText });
  await Cart.verifyBaggageInFlightDetails(this.page, this.baggageOptionText);
});

Then("the paid baggage should be displayed in the price breakdown", async function () {
  if (typeof this.baggagePrice !== 'number') {
    throw new Error("No stored baggage price found. Run 'I extract the baggage price' before this step.");
  }
  logger.info("Verifying paid baggage is displayed in the price breakdown Other row", { baggagePrice: this.baggagePrice });
  await Cart.verifyBaggagePriceInPriceBreakdown(this.page, this.baggagePrice);
});

Then("the baggage option {string} should be saved", async function (expectedOption) {
  logger.info("Verifying baggage option was saved", { expectedOption });
  await Cart.verifyBaggageOptionSaved(this.page, expectedOption);
});

Then("the baggage should not be displayed for traveler tab {int}", async function (tabNumber) {
  logger.info("Verifying baggage is not displayed for traveler tab", { tabNumber });
  await Cart.verifyNoBaggageDisplayedForTravelerTab(this.page, tabNumber);
});

Then("the hotel should appear as refundable in cart", async function () {
  logger.info("Verifying hotel is refundable");
  await Cart.expectHotelToBeRefundableInCart(this.page);
});

Then("the cart should show 2 rooms badge", async function () {
  logger.info("Verifying 2 rooms badge is displayed in cart hotel summary");
  await Cart.verify2RoomsBadge(this.page);
});

Then("the timed quote badge should be visible in cart", async function () {
  logger.info("Verifying timed quote badge is visible in cart");
  await Cart.verifyTimedQuoteBadgeVisible(this.page);
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

Then("the car location at city center index {int} should contain {string} on cart", async function (index, expectedLocation) {
  logger.info("Verifying car city center location contains expected location on cart", { index, expectedLocation });
  await Cart.expectCityCenterLocationOnCartToContain(this.page, index, expectedLocation);
});

Then("the car location label at index {int} should contain {string} on cart", async function (index, expectedLabel) {
  logger.info("Verifying car location label at index contains expected label on cart", { index, expectedLabel });
  await Cart.expectLocationLabelOnCartToContain(this.page, index, expectedLabel);
});

Then("the car city center address at index {int} should contain {string} on cart", async function (index, expectedAddress) {
  logger.info("Verifying car city center address at index contains expected address on cart", { index, expectedAddress });
  await Cart.expectCityCenterAddressOnCartToContain(this.page, index, expectedAddress);
});

When("I add Premier Inn Extras Services in cart", async function () {
  logger.info("Adding Premier Inn extras services in cart");
  await Cart.addPremierInnExtras(this.page);
});

When("I save Premier Inn Extras Services in cart", async function () {
  logger.info("Saving Premier Inn extras services in cart");
  await Cart.savePremierInnExtras(this.page);
});

When("I store the first booked flight number", async function () {
  logger.info("Storing the first booked flight number from cart");
  this.storedFlightNumber = await Cart.extractFirstFlightNumber(this.page);
  this.storedFlightNumbers = [this.storedFlightNumber];
  logger.info("Stored booked flight number", { flightNumber: this.storedFlightNumber });
});

When("I store the second booked flight number", async function () {
  logger.info("Storing the second booked flight number from cart");
  const flightNumbers = await Cart.extractVisibleFlightNumbers(this.page);

  if (flightNumbers.length < 2) {
    throw new Error(`Expected at least 2 booked flight numbers in cart, got ${flightNumbers.length}: ${flightNumbers.join(', ')}`);
  }

  this.storedFlightNumbers = flightNumbers;
  this.storedFlightNumber = flightNumbers[0];
  this.storedSecondFlightNumber = flightNumbers[1];
  logger.info("Stored booked flight numbers", {
    flightNumbers: this.storedFlightNumbers,
    secondFlightNumber: this.storedSecondFlightNumber,
  });
});

When("I store the first quote PNR code", async function () {
  logger.info("Storing the first quote PNR code from cart");
  const pnrCodes = await Cart.extractVisibleFlightQuotePnrCodes(this.page);

  this.storedFirstQuotePnrCode = pnrCodes[0];
  logger.info("Stored first quote PNR code", { firstQuotePnrCode: this.storedFirstQuotePnrCode });
});

When("I store the second quote PNR code", async function () {
  logger.info("Storing the second quote PNR code from cart");
  const pnrCodes = await Cart.extractVisibleFlightQuotePnrCodes(this.page);

  this.storedFirstQuotePnrCode ??= pnrCodes[0];

  if (pnrCodes.length === 1) {
    this.storedSecondQuotePnrCode = pnrCodes[0];
  } else {
    this.storedSecondQuotePnrCode = pnrCodes[1];
  }

  logger.info("Stored quote PNR codes", {
    firstQuotePnrCode: this.storedFirstQuotePnrCode,
    secondQuotePnrCode: this.storedSecondQuotePnrCode,
    visiblePnrCodes: pnrCodes,
  });
});

Then("the stored quote PNR codes should match", async function () {
  logger.info("Verifying stored quote PNR codes match", {
    firstQuotePnrCode: this.storedFirstQuotePnrCode,
    secondQuotePnrCode: this.storedSecondQuotePnrCode,
  });
  await Cart.verifyQuotePnrCodesMatch(this.page, this.storedFirstQuotePnrCode, this.storedSecondQuotePnrCode);
});

Then("the trip title should contain {string}", async function (city) {
  logger.info("Verifying trip title contains city", { city });
  await Cart.verifyTripTitle(this.page, city);
});

Then("the quote destination should contain {string}", async function (city) {
  logger.info("Verifying quote destination contains city", { city });
  await Cart.verifyQuoteDestination(this.page, city);
});

Then("the first quote destination should contain {string}", async function (city) {
  logger.info("Verifying first (non-last) quote destination contains city", { city });
  await Cart.verifyFirstQuoteDestination(this.page, city);
});

Then("the last quote destination should contain {string}", async function (city) {
  logger.info("Verifying last quote destination contains city", { city });
  await Cart.verifyLastQuoteDestination(this.page, city);
});

Then('both outbound and return segments should include location code {string}', async function (locationCode) {
  logger.info('Verifying round-trip cart segments include location code on both legs', { locationCode });
  const result = await Cart.verifyRoundTripSegmentsIncludeLocationCode(this.page, locationCode);
  logger.info('Round-trip cart location code verified', result);
});

Then('both outbound and return segments should be present in the trip', async function () {
  logger.info('Verifying both outbound and return segments are present in the trip');
  const result = await Cart.verifyRoundTripSegmentsArePresent(this.page);
  logger.info('Round-trip segments are present in the trip', result);
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

When("I click to add a flight to my trip from cart", async function () {
  logger.info("Clicking to add a flight from cart product carousel");
  await Cart.clickAddFlightFromCart(this.page);
});

When("I navigate to the manual quote search page from the cart", async function () {
  logger.info("Navigating to manual quote search page from cart product carousel");
  await Cart.navigateToManualQuoteFromCart(this.page);
});

Then("the last quote status should be {string}", async function (expectedStatus) {
  logger.info("Verifying last quote status", { expectedStatus });
  await Cart.verifyLastQuoteStatus(this.page, expectedStatus);
});

Then("I should see a quote with status {string}", async function (expectedStatus) {
  logger.info("Verifying that a quote with the expected status is visible in the cart", { expectedStatus });
  await Cart.verifyQuoteWithStatusVisible(this.page, expectedStatus);
});

Then("all quotes should have PNR codes", async function () {
  logger.info("Verifying all quotes have PNR codes");
  await Cart.verifyAllQuotesHavePnrCodes(this.page);
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

Then("the share quote email preview should contain the extracted hotel name", async function () {
  if (typeof this.extractedHotelName !== 'string' || !this.extractedHotelName.trim()) {
    throw new Error("No extracted hotel name found. Run 'I extract the hotel name to compare with share quote email preview' before this step.");
  }

  logger.info("Verifying share email preview contains extracted hotel name", {
    extractedHotelName: this.extractedHotelName,
  });
  await Cart.verifyShareEmailContainsHotelName(this.page, this.extractedHotelName);
});

Then("the share quote email preview should contain a hotel picture", async function () {
  logger.info("Verifying share email preview contains hotel picture");
  await Cart.verifyShareEmailContainsHotelImage(this.page);
});

Then("the share quote preview should show {string}", async function (expectedText) {
  logger.info("Verifying share quote preview contains text", { expectedText });
  await Cart.verifySharePreviewContainsText(this.page, expectedText);
});

Then("the hotel manual quote details should show {string}", async function (expectedText) {
  logger.info("Verifying More Details drawer contains text", { expectedText });
  await Cart.verifyMoreDetailsDrawerContainsText(this.page, expectedText);
});

// ========================================
// TRIP NAVIGATION
// ========================================

When("I navigate to trip {int}", async function (tripId) {
  logger.info("Navigating to trip", { tripId });
  await Cart.navigateToTrip(this.page, tripId);
});

// ========================================
// EXPIRED QUOTE â€” CHECK AVAILABILITY
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

Then("{string} should be displayed for the {word} quote in the share email preview", async function (text, quoteOrdinal) {
  logger.info("Verifying share email preview contains text for quote", { text, quoteOrdinal });
  await Cart.verifySharePreviewQuoteContainsText(this.page, quoteOrdinal, text);
});

Then("the travel plan email should not include the hotel price", async function () {
  logger.info("Verifying travel plan email does not include hotel price");
  await Cart.verifySharePreviewDoesNotContainPrice(this.page);
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

When("I add loyalty number {string} using the first available airline", async function (loyaltyNumber) {
  logger.info("Adding loyalty number with first available airline", { loyaltyNumber });
  this.selectedFqtvAirline = await Cart.addLoyaltyNumberWithFirstAvailableAirline(this.page, loyaltyNumber);
  logger.info("Added loyalty number with airline", { airline: this.selectedFqtvAirline });
});

When("I add loyalty number {string} using airline {string}", async function (loyaltyNumber, airlineText) {
  logger.info("Adding loyalty number with selected airline", { loyaltyNumber, airlineText });
  this.selectedFqtvAirline = await Cart.addLoyaltyNumberWithAirline(this.page, loyaltyNumber, airlineText);
  logger.info("Added loyalty number with airline", { airline: this.selectedFqtvAirline });
});

When("I add loyalty number {string} using the first available airline for traveler tab {int}", async function (loyaltyNumber, tabNumber) {
  logger.info("Adding loyalty number with first available airline for traveler tab", { loyaltyNumber, tabNumber });
  this.selectedFqtvAirline = await Cart.addLoyaltyNumberWithFirstAvailableAirlineForTravelerTab(
    this.page,
    tabNumber,
    loyaltyNumber,
  );
  logger.info("Added loyalty number with airline for traveler tab", { airline: this.selectedFqtvAirline, tabNumber });
});

When("I add the following FQTV entries:", async function (dataTable) {
  const entries = dataTable.hashes().map((row) => ({
    carrier: row.carrier,
    number: row.number,
  }));

  logger.info("Adding FQTV entries", { entries });
  await Cart.addFqtvEntries(this.page, entries);
});

Then("the loyalty number {string} and chain {string} should be saved", async function (expectedNumber, expectedChain) {
  logger.info("Verifying loyalty number is saved", { expectedNumber, expectedChain });
  await Cart.verifyLoyaltyNumberSaved(this.page, expectedChain, expectedNumber);
});

When("I select existing loyalty number {string} from profile", async function (loyaltyText) {
  logger.info("Selecting existing loyalty number from profile", { loyaltyText });
  await Cart.selectExistingLoyaltyFromProfile(this.page, loyaltyText);
});

When("I select the first existing loyalty number from profile", async function () {
  logger.info("Selecting the first existing loyalty number from profile");
  await Cart.selectFirstExistingLoyaltyFromProfile(this.page);
});

Then("the loyalty number should be saved with a green success icon", async function () {
  logger.info("Verifying loyalty number saved with green success icon");
  await Cart.verifyLoyaltySavedWithSuccessIcon(this.page);
});

Then("the loyalty number should be pre-populated with a green success icon", async function () {
  logger.info("Verifying loyalty number is pre-populated with success icon");
  await Cart.verifyLoyaltyPrepopulatedWithSuccess(this.page);
});

Then("the loyalty chain dropdown should show {string}", async function (expectedChainAndNumber) {
  logger.info("Verifying loyalty chain dropdown shows expected value", { expectedChainAndNumber });
  await Cart.verifyLoyaltyChainDropdown(this.page, expectedChainAndNumber);
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
// FLIGHT OPTIONAL SERVICES (EXTRAS)
// ========================================

Then("the optional services extras section should be visible", async function () {
  logger.info("Expanding extras and verifying Optional Services section is visible");
  await Cart.verifyOptionalServicesSectionVisible(this.page);
});

When("I click optional services in extras", async function () {
  logger.info("Clicking optional services section in extras");
  await Cart.clickOptionalServicesInExtras(this.page);
});

Then("the optional services unavailable message should be visible", async function () {
  logger.info("Verifying optional services unavailable message is displayed");
  await Cart.verifyOptionalServicesUnavailableMessage(this.page);
});

Then("the {string} option should be displayed in optional services", async function (optionText) {
  logger.info("Verifying optional service option is displayed", { optionText });
  await Cart.verifyOptionalServiceOptionDisplayed(this.page, optionText);
});

// --- Ancillary Services steps ---

When("I click to edit the ancillary services section", async function () {
  logger.info("Clicking edit button on ancillary services extras section");
  await Cart.clickEditAncillaryServices(this.page);
});

Then("the ancillary services carrier should display {string}", async function (expectedCarrier) {
  logger.info("Verifying ancillary services carrier name", { expectedCarrier });
  await Cart.verifyAncillaryServicesCarrierName(this.page, expectedCarrier);
});

When("I select the first ancillary service option and verify hold bag pattern", async function () {
  logger.info("Opening ancillary services dropdown and selecting first hold bag option");
  await Cart.selectFirstAncillaryServiceAndVerifyHoldBagPattern(this.page);
});

Then("the ancillary services green checkmark should be visible", async function () {
  logger.info("Verifying ancillary services success icon (green checkmark) is visible");
  await Cart.verifyAncillaryServicesSuccessIcon(this.page);
});

When("I click to edit the ancillary options section", async function () {
  logger.info("Clicking to edit the ancillary options section");
  await Cart.clickEditAncillaryOptions(this.page);
});

When("I select the first ancillary option", async function () {
  logger.info("Selecting the first ancillary option");
  await Cart.selectFirstAncillaryOption(this.page);
});

Then("the ancillary options filled indicator should be visible", async function () {
  logger.info("Verifying ancillary options filled indicator is visible");
  await Cart.verifyAncillaryOptionsFilledIndicator(this.page);
});

When("I select the first ancillary service option with price for flight {int} and store its value", async function (flightNumber) {
  const segmentIndex = flightNumber - 1;
  logger.info("Selecting priced ancillary service option for segment", { flightNumber, segmentIndex });
  const result = await Cart.selectAncillaryServiceWithPriceBySegment(this.page, segmentIndex);
  if (!this.ancillarySelections) this.ancillarySelections = [];
  this.ancillarySelections.push(result);
});

Then("the saved ancillary services selections should be retained", async function () {
  logger.info("Verifying ancillary services selections are retained after reopening");
  await Cart.verifyAncillaryServicesSelectionsRetained(this.page, this.ancillarySelections);
});

When("I switch to ancillary services traveler tab {int}", async function (tabNumber) {
  logger.info("Switching to ancillary services traveler tab", { tabNumber });
  await Cart.switchAncillaryServicesToTravelerTab(this.page, tabNumber);
});

When("I select the first ancillary service option with price for flight {int} and store its value for traveler tab {int}", async function (flightNumber, tabNumber) {
  const segmentIndex = flightNumber - 1;
  logger.info("Selecting priced ancillary service option for traveler segment", { flightNumber, segmentIndex, tabNumber });
  const result = await Cart.selectAncillaryServiceWithPriceBySegmentForTraveler(this.page, segmentIndex, tabNumber);
  if (!this.ancillarySelectionsByTraveler) this.ancillarySelectionsByTraveler = {};
  if (!this.ancillarySelectionsByTraveler[tabNumber]) this.ancillarySelectionsByTraveler[tabNumber] = [];
  this.ancillarySelectionsByTraveler[tabNumber].push(result);
});

Then("the saved ancillary services selections for traveler tab {int} should be retained", async function (tabNumber) {
  logger.info("Verifying ancillary services selections are retained for traveler tab", { tabNumber });
  const expected = (this.ancillarySelectionsByTraveler && this.ancillarySelectionsByTraveler[tabNumber]) || [];
  if (expected.length === 0) {
    throw new Error(`No stored ancillary services selections found for traveler tab ${tabNumber}. Did the scenario select options for this traveler?`);
  }
  await Cart.verifyAncillaryServicesSelectionsRetainedForTraveler(this.page, expected, tabNumber);
});

Then("the passenger info section should not be visible in the extras", async function () {
  logger.info("Verifying passenger info (APIS) section is not visible in extras");
  await Cart.verifyPassengerInfoNotVisibleInExtras(this.page);
});

Then("the {string} section should be visible in the extras", async function (sectionName) {
  logger.info("Verifying extras section is visible", { sectionName });
  await Cart.verifyExtrasSectionVisibleByName(this.page, sectionName);
});

Then("there should be {int} extras sections visible", async function (expectedCount) {
  logger.info("Verifying extras sections count", { expectedCount });
  await Cart.verifyExtrasSectionsCount(this.page, expectedCount);
});

Then("the passenger info section should be marked as required with an asterisk", async function () {
  logger.info("Verifying passenger info section shows required asterisk");
  await Cart.verifyPassengerInfoMarkedAsRequired(this.page);
});

When("I click passenger info in extras", async function () {
  logger.info("Clicking passenger info expand button in extras");
  await Cart.clickPassengerInfoInExtras(this.page);
});

Then("the date of birth field should be required in the passenger info section", async function () {
  logger.info("Verifying date of birth field is marked as required");
  await Cart.verifyDateOfBirthFieldRequired(this.page);
});

When("I fill in the passenger info date of birth", async function () {
  logger.info("Filling in passenger info date of birth");
  await Cart.fillPassengerInfoDateOfBirth(this.page);
});

Then("mandatory fields should be highlighted in the passenger info section", async function () {
  logger.info("Verifying mandatory fields are highlighted after save attempt");
  await Cart.verifyMandatoryFieldsHighlightedInPassengerInfo(this.page);
});

Then("{int} mandatory fields should be highlighted in the passenger info section", async function (expectedCount) {
  logger.info("Verifying exact count of mandatory fields highlighted", { expectedCount });
  await Cart.verifyMandatoryFieldsCountInPassengerInfo(this.page, expectedCount);
});

When("I fill in the passport number {string} in passenger info section", async function (passportNumber) {
  logger.info("Filling passport number in passenger info", { passportNumber });
  await Cart.fillPassportNumberInPassengerInfo(this.page, passportNumber);
});

When("I fill in the applicable country in passenger info section with {string}", async function (country) {
  logger.info("Filling applicable country in passenger info", { country });
  await Cart.fillApplicableCountryInPassengerInfo(this.page, country);
});

When("I fill in the nationality in passenger info section with {string}", async function (nationality) {
  logger.info("Filling nationality in passenger info", { nationality });
  await Cart.fillNationalityInPassengerInfo(this.page, nationality);
});

When("I fill in the passport expiry date in passenger info section", async function () {
  logger.info("Filling passport expiry date in passenger info");
  await Cart.fillPassportExpiryDateInPassengerInfo(this.page);
});

Then("the passenger info form should show {int} editable fields", async function (expectedCount) {
  logger.info("Verifying passenger info editable fields count", { expectedCount });
  await Cart.verifyPassengerInfoEditableFieldsCount(this.page, expectedCount);
});

Then("the passenger info section should show a green circle checkmark indicating success", async function () {
  logger.info("Verifying passenger info section shows success checkmark");
  await Cart.verifyPassengerInfoSaveSuccess(this.page);
});
// ========================================
// MORE DETAILS DRAWER â€” PRICE
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

When("I click more details for the {string} quote in cart", async function (quoteIdentifier) {
  logger.info("Opening More Details drawer for specific quote", { quoteIdentifier });
  await Cart.openMoreDetailsForQuote(this.page, quoteIdentifier);
});

Then("the more details should show {string}", async function (expectedText) {
  logger.info("Verifying open drawer contains text", { expectedText });
  await Cart.verifyOpenDrawerContainsText(this.page, expectedText);
});

// Uses Escape key — works universally across all drawer types (flight, hotel, car).
// Differs from "I close more details in cart" which clicks the explicit close button.
When("I close the open drawer", async function () {
  logger.info("Closing the currently open drawer");
  await Cart.closeOpenDrawer(this.page);
});

Then("I should see {string} quote in more details with pickup {string}, dropoff {string}, vendor {string}, phone {string}, vehicle {string}, cancellation {string}, confirmation {string}, subtotoal {int}", async function (
  quoteType, pickup, dropoff, vendor, phone, vehicle, cancellation, confirmation, subtotal
) {
  logger.info("Verifying ground transport quote details in More Details drawer", { quoteType, pickup, dropoff, vendor });
  // Ground transport uses its own drawer with class "parking-details-drawer" (not the global trip-cart drawer)
  const drawerContainer = this.page.locator(".parking-details-drawer").first();
  await drawerContainer.waitFor({ state: "visible", timeout: 15000 });
  const drawerText = await drawerContainer.innerText();
  const normalize = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const normalizedDrawer = normalize(drawerText);
  // Vendor might have typos in the feature file vs what the system stores, so verify first word only
  const vendorFirstWord = vendor.split(" ")[0];
  const textsToVerify = [pickup, dropoff, vendorFirstWord];
  for (const text of textsToVerify) {
    const normalizedText = normalize(text);
    if (!normalizedDrawer.includes(normalizedText)) {
      throw new Error(
        `[Cart.verifyGroundTransportMoreDetails] Expected More Details drawer to contain "${text}" but it was not found. ` +
        `Drawer text (first 500 chars): "${drawerText.substring(0, 500)}"`
      );
    }
  }
  // Verify subtotal amount
  if (!normalizedDrawer.includes(String(subtotal))) {
    throw new Error(
      `[Cart.verifyGroundTransportMoreDetails] Expected subtotal "${subtotal}" in More Details drawer but it was not found. ` +
      `Drawer text (first 500 chars): "${drawerText.substring(0, 500)}"`
    );
  }
});

Then("the fare rules link is not visible in the flight manual quote more details", async function () {
  logger.info("Verifying Fare Rules link is not visible inside the flight manual quote More Details drawer");
  await Cart.verifyFareRulesLinkNotVisibleInMoreDetails(this.page);
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

Then("the time limit hour should be displayed in flight details", async function () {
  logger.info("Verifying time limit hour is displayed in flight details");
  const text = await Cart.verifyTimeLimitHourInFlightDetails(this.page);
  logger.info("Time limit text found", { text });
});

Then("the cancel trip button should be disabled", async function () {
  logger.info("Verifying cancel trip button is disabled");
  await Cart.verifyCancelTripButtonIsDisabled(this.page);
});

Then("the hold flight button should be disabled", async function () {
  logger.info("Verifying hold flight button is disabled");
  await Cart.verifyHoldFlightButtonIsDisabled(this.page);
});

// ===== FQTV (FREQUENT FLYER) =====

Then("the FQTV should show {string}", async function (expectedText) {
  logger.info("Verifying FQTV shows expected text", { expectedText });
  await Cart.verifyFqtvDisplayed(this.page, expectedText);
});

Then("the FQTV should show {string} for {string}", async function (expectedText, travelerName) {
  logger.info("Verifying FQTV shows expected text for traveler", { expectedText, travelerName });
  await Cart.verifyFqtvDisplayedForTraveler(this.page, expectedText, travelerName);
});

Then("the FQTV should show {string} for traveler tab {int}", async function (expectedText, tabNumber) {
  logger.info("Verifying FQTV shows expected text for traveler tab", { expectedText, tabNumber });
  await Cart.verifyFqtvDisplayedForTravelerTab(this.page, expectedText, tabNumber);
});

Then("the frequent flyer should have a green success icon", async function () {
  logger.info("Verifying frequent flyer has green success icon");
  await Cart.verifyFqtvHasSuccessIcon(this.page);
});

Then("the FQTV section should not have frequent flyer details filled in", async function () {
  logger.info("Verifying FQTV section has no frequent flyer details filled in");
  await Cart.verifyFqtvNotFilledIn(this.page);
});

// ===== EHOTEL SUPPLIER DETAILS =====

Then("the hotel booking should display a pin code", async function () {
  logger.info("Verifying eHotel PIN code is visible in cart");
  await Cart.verifyPinCodeVisibleInCart(this.page);
});

Then("the hotel booking should display a confirmation number", async function () {
  logger.info("Verifying eHotel Confirmation Number is visible in cart");
  await Cart.verifyConfirmationNumberVisibleInCart(this.page);
});

Then("the hotel booking should display a contact phone number", async function () {
  logger.info("Verifying eHotel Contact Phone is visible in cart");
  await Cart.verifyContactPhoneVisibleInCart(this.page);
});

// ===== FLIGHT DETAILS / BRANDED FARES IN CART =====

When("I open flight details in cart", async function () {
  logger.info("Opening flight details drawer in cart");
  await Cart.openFlightDetailsInCart(this.page);
});

Then("the flight details drawer total price should match the cart total", async function () {
  logger.info("Verifying flight details drawer total matches cart total");
  const result = await Cart.verifyFlightDetailsDrawerTotalMatchesCart(this.page);
  logger.info("Flight details drawer total verified", result);
});

When("I scroll down in the flight details drawer", async function () {
  logger.info("Scrolling down in the flight details drawer");
  await Cart.scrollFlightDetailsDrawerInCart(this.page);
});

Then("{string} should be displayed for the {string} flight leg in flight details", async function (cabinText, legPosition) {
  logger.info('Verifying cabin text in flight details drawer', { cabinText, legPosition });
  await Cart.verifyCabinInFlightDetailsDrawer(this.page, legPosition, cabinText);
});

Then("the flight details table headers should be visible", async function () {
  logger.info("Verifying post-ticketing flight details table headers");
  const headers = await Cart.verifyFlightDetailsTableHeaders(this.page);
  logger.info("Flight details table headers found", { headers });
});

Then("the flight details ticket numbers should start with {string} for both travelers", async function (prefix) {
  logger.info("Verifying flight details ticket numbers prefix for both travelers", { prefix });
  const ticketNumbers = await Cart.verifyFlightDetailsTicketNumbersStartWith(this.page, prefix, 2);
  logger.info("Flight details ticket numbers verified", { ticketNumbers, prefix });
});

Then("ticket numbers should be visible in flight details", async function () {
  logger.info("Verifying ticket numbers are visible in flight details");
  const { ticketNumbers } = await Cart.verifyTicketNumbersVisibleInFlightDetails(this.page, 2);
  logger.info("Ticket numbers visible in flight details", { ticketNumbers });
});

Then("seat selection should be available from flight details", async function () {
  logger.info("Verifying seat selection is available from post-ticketing flight details");
  await Cart.verifySeatSelectionAvailableFromFlightDetails(this.page);
});

Then("the carrier name in cart details should be {string}", async function (expectedName) {
  logger.info("Verifying carrier name in cart details drawer", { expectedName });
  await Cart.verifyCarrierNameInCartDetails(this.page, expectedName);
});

When("I open branded fares from cart flight details", async function () {
  logger.info("Opening branded fares from cart flight details and verifying ancillaries");
  await Cart.openBrandedFaresAndVerifyAncillariesInCart(this.page);
});

When("I close branded fares drawer in cart", async function () {
  logger.info("Closing branded fares drawer in cart");
  await Cart.closeBrandedFaresDrawerInCart(this.page);
});

When("I add meal {string} to the flight", async function (mealName) {
  logger.info("Selecting meal and saving", { mealName });
  this.selectedMealName = mealName;
  await Cart.addMealToFlight(this.page, mealName);
});

When("I add a meal to the flight for both travelers", async function () {
  logger.info("Adding meal for all travelers");
  await Cart.addMealForAllTravelers(this.page);
});

Then("the selected meal should have status {string}", async function (expectedStatus) {
  if (typeof this.selectedMealName !== 'string' || !this.selectedMealName.trim()) {
    throw new Error('selectedMealName is not set. Add a meal before verifying its status.');
  }

  logger.info("Verifying selected meal status", { selectedMealName: this.selectedMealName, expectedStatus });
  const result = await Cart.verifyMealSelectionAndStatus(this.page, this.selectedMealName, expectedStatus);
  logger.info("Meal verification result", result);
});

Then("the car loyalty should not be prepopulated", async function () {
  logger.info("Verifying car loyalty is not prepopulated");
  await Cart.verifyCarLoyaltyNotPrepopulated(this.page);
});

Then("the car loyalty field should not be populated in the cart", async function () {
  logger.info("Verifying car loyalty field is not populated in cart - clicking Add on Loyalty ID and validating empty");
  await Cart.verifyCarLoyaltyNotPrepopulated(this.page);
});

Then("the selected meal should have status matching {string}", async function (statusPattern) {
  if (typeof this.selectedMealName !== 'string' || !this.selectedMealName.trim()) {
    throw new Error('selectedMealName is not set. Add a meal before verifying its status.');
  }

  logger.info("Verifying selected meal status (regex)", { selectedMealName: this.selectedMealName, statusPattern });
  const result = await Cart.verifyMealSelectionAndStatus(this.page, this.selectedMealName, new RegExp(statusPattern));
  logger.info("Meal verification result", result);
});

Then("the saved meal should display {string}", async function (expectedMeal) {
  logger.info("Verifying saved meal text in dropdown", { expectedMeal });
  const result = await Cart.verifySavedMealTextAndClosePanel(this.page, expectedMeal);
  logger.info("Saved meal verification result", result);
});

// ========================================
// SEATING ICON
// ========================================

Then("the seat icon should be visible in trip overview", async function () {
  logger.info("Verifying seat icon is visible in trip overview");
  await Cart.verifySeatIconVisibleInTripOverview(this.page);
});

// ========================================
// PASSENGER INITIALS
// ========================================

Then("the passenger initials {string} should be visible", async function (initials) {
  logger.info("Verifying passenger initials are visible", { initials });
  await Cart.verifyPassengerInitialsVisible(this.page, initials);
});

// ========================================
// HOTEL AUTOCOMPLETE FROM CART
// ========================================

Then("the hotel destination autocomplete should show {string}", async function (expected) {
  logger.info("Verifying hotel autocomplete destination", { expected });
  await Cart.verifyHotelAutocompleteDestination(this.page, expected);
});

Then("the booked by text with date and time should be visible in price breakdown", async function () {
  logger.info("Verifying 'Booked by' text with date/time in price breakdown");
  const text = await Cart.verifyBookedByTextInPriceBreakdown(this.page);
  logger.info("Booked by text found", { text });
});

Then('the mini rule disclaimer in price breakdown should contain {string}', async function (expectedText) {
  logger.info('Verifying mini rule disclaimer in price breakdown', { expectedText });
  await Cart.verifyMiniRuleDisclaimerInPriceBreakdown(this.page, expectedText);
});

Then('the price breakdown should show subtotal and non-refundable cancellation before and after departure', async function () {
  logger.info('Verifying non-refundable mini rules in price breakdown');
  await Cart.verifyNonRefundableMiniRulesInPriceBreakdown(this.page);
});

Then('{string} should be visible in price breakdown', async function (label) {
  logger.info('Verifying row is visible in price breakdown', { label });
  await Cart.verifyPriceBreakdownRowVisible(this.page, label);
});

Then('{string} amount should match a currency format', async function (label) {
  logger.info('Verifying amount matches currency format', { label });
  const currencyPattern = /^[$€£]\d{1,3}(,\d{3})*\.\d{2}$/;
  const result = await Cart.verifyPriceBreakdownRowAmountFormat(this.page, label, currencyPattern);
  logger.info('Amount format verified', result);
});

Then("the hotel search check-in and check-out dates should be filled", async function () {
  logger.info("Verifying hotel search date fields are filled");
  await Cart.verifyHotelSearchDatesAreFilled(this.page);
});

Then("gender is not selected", async function () {
  logger.info("Verifying gender is not pre-selected in passenger info");
  await Cart.verifyGenderIsNotSelected(this.page);
});

When("I copy the trip", async function () {
  logger.info("Copying the trip via the three-dots menu");
  this.page = await Cart.copyTrip(this.page);
});

Then("the trip is created successfully with the same flight", async function () {
  logger.info("Verifying copied trip contains the same flight number", { flightNumber: this.storedFlightNumber });
  await Cart.verifyTripHasSameFlightNumber(this.page, this.storedFlightNumber);
});

Then("the ticket details should be visible after booking", async function () {
  logger.info("Verifying ticket details section is visible after booking");
  await Cart.verifyTicketDetailsVisibleAfterBooking(this.page);
});

Then("the trip should not be eligible for copy trip", async function () {
  logger.info("Verifying trip is not eligible for copy trip");
  await Cart.verifyTripCannotBeCopied(this.page);
});

// ===== TRIP RELATED FILES =====

When("I upload the file {string} to the trip related files", async function (fileName) {
  const path = require("path");
  const filePath = path.resolve(__dirname, "../../src/data/fixtures", fileName);
  logger.info("Uploading file to trip related files", { fileName, filePath });
  await Cart.uploadRelatedFile(this.page, filePath);
});

Then("the file {string} should be visible in the trip related files section", async function (fileName) {
  logger.info("Verifying uploaded file is visible", { fileName });
  await Cart.verifyUploadedFileVisible(this.page, fileName);
});

// ===== CHECKOUT SUMMARY & QUOTE CARD PRICE VERIFICATION =====

Then("the {string} quote should be visible in the checkout summary", async function (quoteName) {
  logger.info("Verifying quote is visible in checkout summary", { quoteName });
  await Cart.verifyQuoteVisibleInCheckoutSummary(this.page, quoteName);
});

Then("the {string} quote card should show a price of {int} dollars", async function (quoteIdentifier, expectedPrice) {
  logger.info("Verifying quote card price", { quoteIdentifier, expectedPrice });
  await Cart.verifyQuoteCardPrice(this.page, quoteIdentifier, expectedPrice);
});

