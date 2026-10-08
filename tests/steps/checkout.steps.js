require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Checkout } = require("@dsl");
const { DynamicAndReferenceFields } = require("../../src/dsl");
const logger = require("@utils/logger").child("Checkout");
const BookingErrorHandler = require("@utils/bookingErrorHandler");

setDefaultTimeout(120000);

// Booking finalization is a real GDS round-trip: it clicks Book & Finalize, then
// waits up to 60s for the booking to process and another span for the trip
// overview to render — internal waits that can approach the 120000ms default
// step timeout and trip the opaque "function timed out within 120000ms" error
// before the booking can complete. This step needs headroom above that internal
// budget so slow-but-successful bookings finish and real failures surface clearly.
const CHECKOUT_STEP_TIMEOUT_MS = 180000;


// ===== WHEN STEPS =====

When("I complete the booking", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Completing booking");

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

  const result = await Checkout.bookAndFinalize(this.page, bookingContext);
  this.bookingOutcome = result;

  if (result?.knownBookingError && result.shouldSkip) {
    this.attach('BOOKING_ERROR:' + BookingErrorHandler.describeSkippedBooking('Checkout.bookAndFinalize', 'the booking was never confirmed', result), 'text/plain');
    await Checkout.verifyBookingErrorMessage(this.page, result.bookingErrorText || result.supplier || null);
    await Checkout.clickBackToTripButton(this.page);
    return 'pending';
  }

  if (result?.bookingError && !result.knownBookingError) {
    throw new Error(
      `[Checkout.bookAndFinalize] A booking error modal was shown after Book & Finalize, ` +
      `so the booking was never confirmed. ` +
      `Supplier response: ${BookingErrorHandler.describeSupplierResponse(result)}`,
    );
  }
});

When("I complete the booking without navigating to trip overview", async function () {
  logger.info("Completing booking without navigating to trip overview");
  await Checkout.bookTripWithoutNavigatingToTripOverview(this.page);
});

When("I complete the booking with Fusion credit card verification", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Completing Fusion booking with card verification");
  await Checkout.bookAndFinalizeWithFusionCardVerification(this.page);
});

When("I complete the booking with Fusion credit card verification inside the 3DS iframe", { timeout: CHECKOUT_STEP_TIMEOUT_MS + 60000 }, async function () {
  logger.info("Completing Fusion booking with card verification inside the 3DS iframe");
  this.fusion3dsVerification = await Checkout.bookAndFinalizeWithFusionCardVerificationInIframe(this.page);
  logger.info("Fusion 3DS verification result", this.fusion3dsVerification);
});

Then("the Fusion card verification should return to OBT and close by itself", async function () {
  const result = this.fusion3dsVerification;
  if (!result) {
    throw new Error('No Fusion 3DS result: run "I complete the booking with Fusion credit card verification inside the 3DS iframe" first');
  }
  const { paymentToken, dialogClosedByItself, verificationNeededGone, tripId } = result;
  const appOrigin = new URL(this.page.url()).origin;

  if (!paymentToken) {
    throw new Error(`Trip ${tripId}: the 3DS iframe never navigated back to /payment-token after the supplier's verification`);
  }
  if (paymentToken.status !== 200 || new URL(paymentToken.url).origin !== appOrigin) {
    throw new Error(
      `Trip ${tripId}: /payment-token answered ${paymentToken.status} at ${paymentToken.url}` +
      (paymentToken.location ? ` (redirect to ${paymentToken.location})` : '') +
      ` — expected 200 from ${appOrigin} without login`,
    );
  }
  if (!dialogClosedByItself) {
    throw new Error(`Trip ${tripId}: /payment-token loaded but the Card verification modal did not close by itself`);
  }
  if (!verificationNeededGone) {
    throw new Error(`Trip ${tripId}: the modal closed but "Card verification needed!" is still shown`);
  }
});

When("I complete the booking with Ypsilon credit card verification", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Completing Ypsilon booking with credit card verification");
  await Checkout.bookAndFinalizeWithYpsilon3dsVerification(this.page);
});

When('I click "Don\'t share the contact details with airlines" checkbox in checkout', async function () {
  logger.info('Clicking contact details sharing checkbox in checkout');
  await Checkout.clickContactDetailsCheckbox(this.page);
});

When("I refuse to share the contact details with airlines in checkout", async function () {
  logger.info('Making sure "Don\'t share the contact details with airlines" is checked');
  await Checkout.refuseContactDetailsToAirlines(this.page);
});



When("I send booking for approval", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Sending booking for approval");
  await Checkout.sendForApprovalAndFinalize(this.page);
});

When("I click the submit for approval button", async function () {
  logger.info("Clicking the submit for approval button");
  await Checkout.clickSendForApprovalButton(this.page);
});

Then('the "Sent For Approval" message should be displayed', { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Verifying the pre-booking approval success message is displayed");
  await Checkout.verifyApprovalSuccessMessageDisplayed(this.page);
});

Then("a booking error message should be displayed", async function () {
  logger.info("Verifying booking error message is displayed");
  await Checkout.verifyBookingErrorMessage(this.page);
});

Then("a booking error message containing {string} should be displayed", async function (expectedErrorText) {
  logger.info("Verifying booking error message text", { expectedErrorText });
  await Checkout.verifyBookingErrorMessage(this.page, expectedErrorText);
});

// Arms the network interceptor before Book & Finalize so the POST /booking answer is not missed.
When("I start intercepting the booking response", function () {
  logger.info("Starting booking API response capture");
  this.bookingResponsePromise = Checkout.startCapturingBookingResponse(this.page);
});

Then(
  "the intercepted booking response should be HTTP {int} with the {string} quote booked successfully",
  async function (httpStatus, productType) {
    logger.info("Verifying the intercepted booking response", { httpStatus, productType });
    const result = await Checkout.verifyInterceptedBookingResponse(this.page, this.bookingResponsePromise, { httpStatus, productType });
    logger.info("Intercepted booking response verified", result);
  }
);

Then("the send for approval button should display the text {string}", async function (expectedText) {
  logger.info("Verifying the send for approval button text", { expectedText });
  await Checkout.verifySendForApprovalButtonText(this.page, expectedText);
});

Then("the approval confirmation message {string} should be displayed", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function (message) {
  logger.info("Verifying the approval confirmation message is displayed", { message });
  await Checkout.verifyApprovalConfirmationMessage(this.page, message);
});

// Accepts both spellings: en-GB accounts label the button "Book and Finalise".
Then(/^I should see "Book and Finali[sz]e" button enabled$/, async function () {
  logger.info('Verifying "Book and Finalize" button is visible and enabled');
  await Checkout.verifyBookAndFinalizeButtonEnabledAndVisible(this.page);
});

When("I click back to trip", async function () {
  logger.info("Clicking back to trip button");
  await Checkout.clickBackToTripButton(this.page);
});

When("I navigate to cart from checkout", async function () {
  logger.info("Navigating to cart from checkout page");
  await Checkout.navigateToCartFromCheckout(this.page);
});

When("I uncheck contact sharing and edit the phone to {string}", async function (phone) {
  logger.info("Unchecking contact sharing and editing phone", { phone });
  const parts = phone.split(/\s+/);
  if (parts.length !== 3) throw new Error(`Phone must be "countryCode areaCode number" (3 space-separated parts), got: "${phone}"`);
  await Checkout.uncheckContactSharingAndEditPhone(this.page, parts[0], parts[1], parts[2]);
});

When("I edit the contact email to {string}", async function (email) {
  logger.info("Editing contact email", { email });
  await Checkout.editContactEmail(this.page, email);
});

Then("{string} should be displayed in the checkout page", async function (expectedText) {
  logger.info("Verifying text is displayed in checkout page", { expectedText });
  await this.page.locator(`text=${expectedText}`).first().waitFor({ state: 'visible', timeout: 15000 });
});

Then("the contact email on checkout should contain {string}", async function (expectedText) {
  logger.info("Verifying contact email contains expected text", { expectedText });
  await Checkout.verifyContactEmailContains(this.page, expectedText);
});

Then("the contact telephone on checkout should contain numbers", async function () {
  logger.info("Verifying contact telephone on checkout contains numeric values");
  await Checkout.verifyContactPhoneContainsNumbers(this.page);
});

Then("the contact telephone on checkout should contain {string}", async function (phone) {
  logger.info("Verifying contact telephone on checkout contains expected numbers", { phone });
  await Checkout.verifyContactPhoneContains(this.page, phone);
});

Then("the contact details checkbox should be unchecked", async function () {
  logger.info("Verifying contact details checkbox is unchecked");
  await Checkout.verifyContactDetailsCheckboxUnchecked(this.page);
});

Then("the booker notification phone on checkout should contain numbers", async function () {
  logger.info("Verifying booker notification phone on checkout contains numeric values");
  await Checkout.verifyBookerNotificationPhoneContainsNumbers(this.page);
});

Then("the booker notification phone on checkout should contain {string}", async function (phone) {
  logger.info("Verifying booker notification phone on checkout contains expected numbers", { phone });
  await Checkout.verifyBookerNotificationPhoneContains(this.page, phone);
});

Then('the checkout total price should match the saved flight cart total', async function () {
  if (typeof this.flightCartTotalForCheckout !== 'number') {
    throw new Error("No stored flight cart total found. Run 'I save the current flight cart total for checkout comparison' before this step.");
  }

  logger.info('Verifying checkout total price matches saved flight cart total', {
    flightCartTotalForCheckout: this.flightCartTotalForCheckout,
  });

  const result = await Checkout.verifyCheckoutTotalMatchesExpected(this.page, this.flightCartTotalForCheckout);
  logger.info('Checkout total price matched saved flight cart total', result);
});

When("I wait for booking details in checkout", async function () {
  logger.info("Waiting for booking details heading in checkout page");
  await DynamicAndReferenceFields.waitForCheckoutBookingDetails(this.page);
});

When("I click book and finalize button", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Clicking Book and Finalize button");
  await Checkout.clickBookAndFinalizeButton(this.page);
});

Then("go to trip text is visible", { timeout: CHECKOUT_STEP_TIMEOUT_MS }, async function () {
  logger.info("Verifying Go to trip button is visible on booking success page");
  await Checkout.waitForGoToTripButtonVisible(this.page);
});

Then("line with product details is displayed after checkout with status {string}", async function (status) {
  logger.info("Verifying product details line is displayed after checkout", { status });
  await Checkout.verifyProductDetailsLineDisplayedWithStatus(this.page, status);
});

Then("line with product details is displayed after checkout with status {string} or {string} or {string}", async function (statusA, statusB, statusC) {
  logger.info("Verifying product details line status is one of the expected values", { statusA, statusB, statusC });
  await Checkout.verifyProductDetailsLineDisplayedWithStatusOneOf(this.page, [statusA, statusB, statusC]);
});

Then("I should see {string} or {string} status on the booking page", async function (statusA, statusB) {
  logger.info("Verifying booking page status is one of the expected values", { statusA, statusB });
  await Checkout.verifyBookingSuccessTitleIsOneOf(this.page, [statusA, statusB]);
});

When("I click go to trip button", async function () {
  logger.info("Clicking Go to trip button to navigate to trip overview");
  await Checkout.clickGoToTripButton(this.page);
});

Then('"Yay! No additional details are required..." should not be displayed anywhere on checkout page', async function () {
  logger.info('Verifying "Yay! No additional details are required..." message is not displayed on checkout');
  await Checkout.verifyYayMessageNotVisible(this.page);
});

// ===== RECALCULATE APPROVAL FLOW BY REFERENCE FIELDS (test 54558) =====

Then("the checkout should display the Recalculate Approval Flow section", async function () {
  logger.info("Verifying the Recalculate Approval Flow reference field is displayed at checkout");
  await Checkout.verifyRecalculateApprovalFlowSectionDisplayed(this.page);
});

Then("the finalize button should read {string}", async function (expectedText) {
  logger.info("Verifying the checkout finalize button text", { expectedText });
  await Checkout.verifyFinalizeButtonText(this.page, expectedText);
});

Then("the reference field should be linked to Recalculate Approval Flow", async function () {
  logger.info("Verifying a reference field linked to Recalculate Approval Flow is displayed at checkout");
  await Checkout.verifyReferenceFieldLinkedToRecalculateApprovalFlow(this.page);
});
// ===== Checkout trip-summary carbon offset (test 44362) =====

Then("the checkout summary should show the {string} line", async function (lineLabel) {
  logger.info("Verifying a line is shown in the checkout summary", { lineLabel });
  await Checkout.verifySummaryLineVisible(this.page, lineLabel);
});

When("I extract the flight amount from the checkout summary", async function () {
  this.checkoutSummaryFlightAmount = await Checkout.extractSummaryFlightAmount(this.page);
  logger.info("Stored checkout summary flight amount", { amount: this.checkoutSummaryFlightAmount });
});

When("I extract the carbon offset amount from the checkout summary", async function () {
  this.checkoutSummaryCarbonAmount = await Checkout.extractSummaryCarbonOffsetAmount(this.page);
  logger.info("Stored checkout summary carbon offset amount", { amount: this.checkoutSummaryCarbonAmount });
});

When("I extract the total amount from the checkout summary", async function () {
  this.checkoutSummaryTotalAmount = await Checkout.extractSummaryTotalAmount(this.page);
  logger.info("Stored checkout summary total amount", { amount: this.checkoutSummaryTotalAmount });
});

Then("the checkout summary total should equal the flight amount plus the carbon offset amount", async function () {
  const { checkoutSummaryFlightAmount, checkoutSummaryCarbonAmount, checkoutSummaryTotalAmount } = this;

  if (
    typeof checkoutSummaryFlightAmount !== "number" ||
    typeof checkoutSummaryCarbonAmount !== "number" ||
    typeof checkoutSummaryTotalAmount !== "number"
  ) {
    throw new Error(
      "No stored checkout summary amounts found. Run the three checkout-summary extraction steps " +
      "(flight amount, carbon offset amount, total amount) before this assertion. Got: " +
      `flight=${checkoutSummaryFlightAmount}, carbon=${checkoutSummaryCarbonAmount}, total=${checkoutSummaryTotalAmount}`
    );
  }

  logger.info("Verifying the checkout summary total equals flight + carbon offset", {
    checkoutSummaryFlightAmount,
    checkoutSummaryCarbonAmount,
    checkoutSummaryTotalAmount,
  });

  await Checkout.verifySummaryTotalEqualsFlightPlusCarbon(
    this.page,
    checkoutSummaryFlightAmount,
    checkoutSummaryCarbonAmount,
    checkoutSummaryTotalAmount,
  );
});
