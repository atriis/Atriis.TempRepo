const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { CartPage } = require("@pages/CartPage");
const { CommonPage } = require("@pages/CommonPage");
const BookingErrorHandler = require("@utils/bookingErrorHandler");
const { expectSumToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const logger = require("@utils/logger").child("Checkout-DSL");

// reference-form-contact-details assigns isDoNotShareContactInfo from the profile inside
// populateData(), which awaits getLoggedInUser - so the checkbox can still read unchecked while the
// phone inputs are already (or about to be) disabled. Retry the whole uncheck-and-fill sequence this
// many times, giving the widget this long to become interactive and bounding each fill so a disabled
// input fails fast instead of burning the default 30s locator timeout.
const CONTACT_PHONE_EDIT_ATTEMPTS = 3;
const CONTACT_SHARING_SETTLE_TIMEOUT = 5000;
const CONTACT_PHONE_FILL_TIMEOUT = 10000;

// The compensation ("Carbon offset") line in the checkout trip-summary is gated on the quote having
// a price, and that price comes from a POST /compensationPricing to Squake that trip-cart.ts fires
// fire-and-forget in handleCheckout() before routing to checkout. The step that precedes this
// assertion only waits for the booking-details heading, which renders independently of that call, so
// the clock can start before Squake has answered. 30s left no headroom for a slow third-party
// round trip; 90s does, and a genuine Squake failure still fails - just with the diagnostic below.
const SUMMARY_LINE_TIMEOUT = 90000;


/**
 * Checkout DSL
 *
 * High-level booking finalization flow.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Checkout = {
  /**
   * Completes the booking without navigating to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   */
  async bookTripWithoutNavigatingToTripOverview(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();

    // Finalize the booking (button text may vary)
    await checkoutPage.clickBookAndFinalizeButton();
  },

  /**
   * Finalizes the booking and optionally navigates to Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   * - attempts to navigate to trip overview (for flights/hotels)
   * - gracefully skips if not available (for cars)
   * 
   * Note: If a booking error modal appears, the status assertion step will detect and handle it.
   */
  async bookAndFinalize(page, bookingContext = {}) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    await Checkout.bookTripWithoutNavigatingToTripOverview(page);

    const goToTripButton = checkoutPage.getGoToTripButton();
    const bookingErrorDialog = page.locator('.booking-error-dialog').first();

    const bookingOutcome = await Promise.race([
      goToTripButton.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'success').catch(() => null),
      bookingErrorDialog.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'booking-error').catch(() => null),
    ]);

    // If booking error appeared, classify it here so later steps do not fail first.
    if (bookingOutcome === 'booking-error') {
      const supplier = await checkoutPage.getBookingErrorSupplierName();
      const bookingErrorText = await checkoutPage.getBookingErrorDialogText();
      const supplierMessage = await checkoutPage.getBookingErrorSupplierMessage();
      const knownBySupplier = supplier
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, supplier)
        : false;
      const knownByMessage = bookingErrorText
        ? BookingErrorHandler.isKnownBookingError(bookingContext.product, bookingContext.subProduct, bookingErrorText)
        : false;
      const knownBookingError = knownBySupplier || knownByMessage;
      const shouldSkip = knownBookingError
        ? BookingErrorHandler.getSkipOnErrorConfig(bookingContext.product, bookingContext.subProduct)
        : false;

      // Always prefer the concise "supplier:" line over the full dialog text so
      // the log stays readable, and over the bare supplier token (which is
      // extracted with an asterisk-bounded regex that isn't reliably present).
      // This applies whether or not the error turned out to be known.
      const errorLogValue = supplierMessage || bookingErrorText || supplier || 'UNKNOWN';
      BookingErrorHandler.handleBookingError(
        bookingContext.product,
        errorLogValue,
        bookingContext.subProduct,
        { known: knownBookingError },
      );

      return {
        finalized: false,
        bookingError: true,
        knownBookingError,
        shouldSkip,
        supplier: supplier || null,
        bookingErrorText: bookingErrorText || null,
      };
    }

    if (bookingOutcome !== 'success') {
      throw new Error('Neither Go to trip nor booking error dialog appeared after finalizing booking');
    }

    // Try to navigate to trip overview, but gracefully continue if not available
    // (cars suppliers like Sunny don't have this navigation)
    try {
      await checkoutPage.clickGoToTrip();
      await cartPage.waitForTripOverviewTitle();
    } catch (err) {
      // Trip overview not available (expected for cars suppliers)
      // Booking is still complete, so just log and continue
      const logger = require("@utils/logger").child("Checkout");
      logger.debug("Trip overview not available after booking (expected for cars)", { error: err.message });
    }

    return { finalized: true };
  },

  /**
   * Finalizes the booking for cars (no trip overview navigation).
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   * - DOES NOT navigate to trip overview (cars suppliers don't have this page)
   */
  async bookAndFinalizeForCars(page) {
    if (!page) throw new Error('page is required');

    await Checkout.bookTripWithoutNavigatingToTripOverview(page);

    return { finalized: true, bookingError: false };
  },

  /**
   * Finalizes Fusion low-cost flight booking with card verification,
   * then navigates directly to the trip overview page by trip ID extracted
   * from the booking-success URL.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{finalized: boolean, tripId: string}>}
   */
  async bookAndFinalizeWithFusionCardVerification(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    await Checkout.bookTripWithoutNavigatingToTripOverview(page);
    const tripId = await checkoutPage.completeFusionCardVerification();

    const tripUrl = new URL(page.url());
    tripUrl.pathname = `/trips/${tripId}/cart`;
    await page.goto(tripUrl.href, { waitUntil: 'domcontentloaded' });
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true, tripId };
  },

  /**
   * Finalizes Ypsilon flight booking with 3DS SCA verification,
   * then navigates to the trip overview page.
   * The 3DS challenge is rendered in an iframe where the test code is entered.
   *
   * @param {import('playwright').Page} page
   * @param {string} verificationCode - 3DS test code (default: '555')
   * @returns {Promise<{finalized: boolean}>}
   */
  async bookAndFinalizeWithYpsilon3dsVerification(page, verificationCode = '555') {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    // The Card verification dialog is opened by trip-reference-form.vue when a Ypsilon flight
    // quote is in Selected status. Every test measured so far (29424, 57930, 58320) sees it
    // auto-open on checkout mount, so SCA is completed before Book and Finalize. The
    // post-click branch below is kept as a safety net for flows where it has not rendered yet.
    // 30s probe: the dialog can take up to ~25s to render after checkout mount; a flow that
    // never auto-opens pays this as fixed latency.
    // The dialog has three render outcomes — iframe SCA challenge (29424), a simple accept
    // button, or a silent auto-close — all handled inside completeYpsilon3dsVerification.
    // Auto-close is the designed path when the card needs no challenge: ypsilon-3ds.ts emits
    // ypsilon3dsCompleted immediately when /verificationInfo returns authenticationLink
    // 'virtual' (e.g. the VCC in 57930), which closes the dialog with nothing to enter.
    const dialogAlreadyOpen = await checkoutPage.isYpsilon3dsDialogVisible(30000);

    let scaResult;
    if (dialogAlreadyOpen) {
      logger.info('Ypsilon 3DS dialog auto-opened on checkout mount — completing SCA before Book and Finalize');
      scaResult = await checkoutPage.completeYpsilon3dsVerification(verificationCode);
      logger.info('Ypsilon 3DS SCA completed', scaResult);
      await checkoutPage.waitForYpsilon3dsDialogToClose();
      await Checkout.bookTripWithoutNavigatingToTripOverview(page);
    } else {
      logger.info('Ypsilon 3DS dialog not auto-opened — clicking Book and Finalize first, then completing SCA');
      await Checkout.bookTripWithoutNavigatingToTripOverview(page);
      scaResult = await checkoutPage.completeYpsilon3dsVerification(verificationCode);
      logger.info('Ypsilon 3DS SCA completed', scaResult);
      await checkoutPage.waitForYpsilon3dsDialogToClose();
    }

    await checkoutPage.clickGoToTrip();
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true, flowVariant: dialogAlreadyOpen ? 'auto-open' : 'post-click', sca: scaResult };
  },

  /**
   * Verifies that a booking error dialog is displayed after a failed booking attempt.
   *
   * This flow:
   * - waits for the booking error dialog to appear
   */
  async verifyBookingErrorMessage(page, expectedErrorText = null) {
    if (!page) throw new Error('page is required');

    if (expectedErrorText !== null && typeof expectedErrorText !== 'string') {
      throw new Error(`expectedErrorText must be a string when provided, got: ${typeof expectedErrorText}`);
    }

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingErrorDialog();

    const dialogText = await checkoutPage.getBookingErrorDialogText();
    const normalizedDialogText = String(dialogText || '').replace(/\s+/g, ' ').trim();

    expect(normalizedDialogText).toMatch(/Booking error/i);
    expect(normalizedDialogText).toMatch(/Something went wrong/i);
    expect(normalizedDialogText).toMatch(/Error details as received from the supplier/i);

    if (expectedErrorText && expectedErrorText.trim().length > 0) {
      const normalizedExpectedErrorText = expectedErrorText.replace(/\s+/g, ' ').trim();
      expect(normalizedDialogText.toUpperCase()).toContain(normalizedExpectedErrorText.toUpperCase());
    }
  },

  /**
   * Clicks the "Back to trip" button inside the booking error dialog.
   *
   * This flow:
   * - clicks the back to trip button
   */
  async clickBackToTripButton(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.clickBackToTripButton();
  },

  /**
   * Navigates to cart from the checkout page.
   *
   * This flow:
   * - waits for checkout details
   * - clicks the trip cart icon
   * - confirms cart page is displayed
   */
  async navigateToCartFromCheckout(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const commonPage = getPageObject(page, CommonPage);
    const cartPage = getPageObject(page, CartPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();
    await commonPage.clickTripCart();

    // Confirm trip overview is displayed
    await cartPage.waitForTripOverviewTitle();

    return { navigatedToCart: true };
  },

  /**
   * Verifies the contact email on the checkout page contains the expected text.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Substring expected in the email value
   */
  async verifyContactEmailContains(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string') throw new Error('expectedText must be a string, got: ' + typeof expectedText);

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure the checkout page (and its contact-details section) is fully loaded
    // before reading the email field. The section is rendered only once the flight
    // quotes finish loading, so reading immediately after proceeding to checkout
    // races the async render and times out on slow Amadeus responses.
    await checkoutPage.waitForBookingDetailsText();

    const emailValue = await checkoutPage.getEmailInputValue();
    expect(emailValue).toContain(expectedText);
  },

  async verifyContactPhoneContainsNumbers(page) {
    if (!page) throw new Error('page is required');
    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);
    const values = await checkoutPage.getContactPhoneValues();
    expect(values).toMatch(/\d/);
  },

  /**
   * Verifies the traveler contact phone on checkout contains the expected digits.
   * The configured profile phone is pre-populated into the contact phone fields
   * (dial code + area code + number); the concatenated value must contain the
   * expected number (spaces ignored).
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedPhone - Expected phone digits, may be space-separated (e.g. "888 666 76876")
   */
  async verifyContactPhoneContains(page, expectedPhone) {
    if (!page) throw new Error('page is required');
    if (typeof expectedPhone !== 'string' || !expectedPhone.trim()) {
      throw new Error('expectedPhone must be a non-empty string, got: ' + typeof expectedPhone);
    }

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure the checkout page (and its contact-details section) is fully loaded
    // before reading the phone fields, to avoid a false read on a not-yet-rendered page.
    await checkoutPage.waitForBookingDetailsText();

    const expected = expectedPhone.replace(/\s+/g, '');

    // The contact phone is hydrated from the (GDS) profile asynchronously, so it
    // can still hold the empty "+00" default for a moment after the booking-details
    // heading appears. Poll the concatenated phone value until it contains the
    // expected digits, rather than reading once.
    await expect
      .poll(async () => checkoutPage.getContactPhoneValues(), {
        message: `[Checkout.verifyContactPhoneContains] Expected the checkout contact telephone to contain "${expectedPhone}", but the contact phone fields never showed it. The configured profile phone may not be surfaced on checkout.`,
        timeout: 15000,
      })
      .toContain(expected);
  },

  /**
   * Verifies the contact details sharing checkbox is unchecked on first load.
   *
   * @param {import('playwright').Page} page
   */
  async verifyContactDetailsCheckboxUnchecked(page) {
    if (!page) throw new Error('page is required');

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingDetailsText();

    const isChecked = await checkoutPage.isContactDetailsCheckboxChecked();
    expect(isChecked, 'Expected contact details checkbox to be unchecked by default').toBe(false);
  },

  /**
   * Clicks the contact-details sharing checkbox on checkout.
   *
   * @param {import('playwright').Page} page
   */
  async clickContactDetailsCheckbox(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();
    await checkoutPage.clickContactDetailsCheckbox();
  },

  /**
   * Verifies the checkout trip summary total matches the expected cart total.
   *
   * @param {import('playwright').Page} page
   * @param {number} expectedTotal
   * @returns {Promise<{checkoutTotal: number, expectedTotal: number}>}
   */
  async verifyCheckoutTotalMatchesExpected(page, expectedTotal) {
    if (!page) throw new Error('page is required');
    if (typeof expectedTotal !== 'number' || Number.isNaN(expectedTotal)) {
      throw new Error(`expectedTotal must be a valid number, got: ${expectedTotal}`);
    }

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();

    const checkoutTotal = await checkoutPage.getCheckoutTotalPrice();
    if (checkoutTotal === null) {
      throw new Error('Checkout total price is not visible');
    }

    expect(Math.abs(checkoutTotal - expectedTotal)).toBeLessThanOrEqual(1);

    return { checkoutTotal, expectedTotal };
  },

  async verifyBookerNotificationPhoneContainsNumbers(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    const values = await checkoutPage.getBookerNotificationPhoneValues();
    if (values === null) {
      throw new Error('Booker notification phone section is not visible or app-phone-input fields not found on checkout');
    }
    const { expect } = require("@playwright/test");
    expect(values).toMatch(/\d/);
  },

  /**
   * Verifies the booker notification phone on checkout contains the expected digits.
   * The "send notifications on behalf of" section pre-populates the booker phone
   * (dial code + area code + number); the concatenated value must contain the
   * expected number (spaces ignored).
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedPhone - Expected phone digits, may be space-separated (e.g. "975 251 4545")
   */
  async verifyBookerNotificationPhoneContains(page, expectedPhone) {
    if (!page) throw new Error('page is required');
    if (typeof expectedPhone !== 'string' || !expectedPhone.trim()) {
      throw new Error('expectedPhone must be a non-empty string, got: ' + typeof expectedPhone);
    }

    const { expect } = require("@playwright/test");
    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure the checkout page (and its booking-details section) is fully loaded before
    // reading the phone fields, to avoid a false read on a not-yet-rendered page.
    await checkoutPage.waitForBookingDetailsText();

    const expected = expectedPhone.replace(/\s+/g, '');

    // getBookerNotificationPhoneValues() returns null while the notifications-on-behalf
    // section has not rendered — coerce it to '' so the poll keeps retrying instead of
    // throwing on the first pass.
    await expect
      .poll(async () => (await checkoutPage.getBookerNotificationPhoneValues()) ?? '', {
        message: `[Checkout.verifyBookerNotificationPhoneContains] Expected the booker notification phone on checkout to contain "${expectedPhone}", but the booker phone fields never showed it. The "send notifications on behalf of" section may not render for this user, or the booker profile phone is not surfaced on checkout.`,
        timeout: 15000,
      })
      .toContain(expected);
  },

  /**
   * Unchecks the "Don't share contact details with airlines" checkbox
   * and fills in the traveler phone number on the checkout page.
   *
   * @param {import('playwright').Page} page
   * @param {string} countryCode - Phone country code (e.g. "1")
   * @param {string} areaCode - Phone area code (e.g. "505")
   * @param {string} phoneNumber - Phone number (e.g. "1001000")
   */
  async uncheckContactSharingAndEditPhone(page, countryCode, areaCode, phoneNumber) {
    if (!page) throw new Error('page is required');
    if (typeof countryCode !== 'string') throw new Error('countryCode must be a string, got: ' + typeof countryCode);
    if (typeof areaCode !== 'string') throw new Error('areaCode must be a string, got: ' + typeof areaCode);
    if (typeof phoneNumber !== 'string') throw new Error('phoneNumber must be a string, got: ' + typeof phoneNumber);

    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure checkout page is loaded
    await checkoutPage.waitForBookingDetailsText();

    // The "Don't share contact details" checkbox controls whether the phone fields are
    // enabled (they are disabled while it is checked). Its state is user-dependent, driven
    // by the profile's isRefusedToSharePersonalData.
    //
    // populateData() assigns that default only after awaiting getLoggedInUser, so a single read
    // can catch the pre-populate value and skip the click while the inputs end up disabled. Rather
    // than guess at the timing, drive to the goal state: uncheck, wait for the widget to actually
    // become interactive, fill, and only accept the result once the values read back correctly.
    const expectedPhone = countryCode + areaCode + phoneNumber;
    let lastError = null;

    for (let attempt = 1; attempt <= CONTACT_PHONE_EDIT_ATTEMPTS; attempt++) {
      try {
        if (await checkoutPage.isContactDetailsCheckboxChecked()) {
          logger.debug('Contact sharing checkbox is checked - unchecking to enable the phone fields', { attempt });
          await checkoutPage.clickContactDetailsCheckbox();
        }

        if (!(await checkoutPage.isContactPhoneEnabledWithin(CONTACT_SHARING_SETTLE_TIMEOUT))) {
          lastError = new Error('Contact phone fields did not become enabled after unchecking the sharing checkbox');
          logger.debug('Contact phone still disabled after unchecking - retrying', { attempt });
          continue;
        }

        await checkoutPage.fillContactPhoneCountryCode(countryCode, { timeout: CONTACT_PHONE_FILL_TIMEOUT });
        await checkoutPage.fillContactPhoneAreaCode(areaCode, { timeout: CONTACT_PHONE_FILL_TIMEOUT });
        await checkoutPage.fillContactPhoneNumber(phoneNumber, { timeout: CONTACT_PHONE_FILL_TIMEOUT });

        const actualPhone = await checkoutPage.getContactPhoneValues();
        if (actualPhone === expectedPhone) return;

        lastError = new Error(`Contact phone read back as "${actualPhone}" instead of "${expectedPhone}"`);
        logger.debug('Contact phone did not stick - the section most likely remounted; retrying', {
          attempt,
          expectedPhone,
          actualPhone,
        });
      } catch (err) {
        lastError = err;
        logger.debug('Contact phone edit attempt failed - retrying', { attempt, error: err.message });
      }
    }

    throw new Error(
      `[Checkout.uncheckContactSharingAndEditPhone] Could not set the traveller contact phone to "${expectedPhone}" ` +
      `after ${CONTACT_PHONE_EDIT_ATTEMPTS} attempts. Either "Don't share the contact details with airlines" kept the ` +
      `phone inputs disabled (it is re-applied from the profile's isRefusedToSharePersonalData), or the dial code did ` +
      `not take. Last failure: ${lastError ? lastError.message : 'unknown'}`
    );
  },

  /**
   * Edits the traveler contact email on the checkout page.
   *
   * @param {import('playwright').Page} page
   * @param {string} email
   */
  async editContactEmail(page, email) {
    if (!page) throw new Error('page is required');
    if (typeof email !== 'string') throw new Error('email must be a string, got: ' + typeof email);
    if (!email.trim()) throw new Error('email must be a non-empty string');

    const checkoutPage = getPageObject(page, CheckoutPage);

    await checkoutPage.waitForBookingDetailsText();
    await checkoutPage.fillContactEmail(email);
  },

  /**
   * Sends the booking for approval and navigates to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - clicks "Send for approval"
   * - validates the approval success message
   * - navigates to the trip overview page
   */
  async sendForApprovalAndFinalize(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting
    await page.waitForTimeout(4000);

    // Wait for and click "Send for approval"
    await checkoutPage.waitForSendForApprovalButton();
    await checkoutPage.clickSendForApprovalButton();

    // Wait for the approval success page to load
    await checkoutPage.waitForApprovalSuccessPage();

    // Validate the approval success message
    const approvalMessage = await checkoutPage.getApprovalSuccessMessageText();
    if (!approvalMessage.includes('booked and sent')) {
      throw new Error(`Unexpected approval message: "${approvalMessage}"`);
    }

    // Intentional wait required for UI stability before interacting
    await page.waitForTimeout(2000);

    // Navigate to trip overview from the approval success page
    await checkoutPage.clickApprovalSuccessGoToTrip();

    // Confirm trip overview content is displayed
    await cartPage.waitForTripOverviewTitle();
    await cartPage.waitForTripOverviewQuoteContent();

    return { sentForApproval: true };
  },

  /**
   * Clicks the "Submit for Approval" / "Send for approval" button WITHOUT waiting for the
   * approval success page. Use when the click is expected to be blocked by a field-level
   * validation error (e.g. an invalid reference value), so the page stays on Booking details.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async clickSendForApprovalButton(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    try {
      await checkoutPage.waitForSendForApprovalButton();
      await checkoutPage.clickSendForApprovalButton();
    } catch (err) {
      throw new Error(
        `[Checkout.clickSendForApprovalButton] Failed to click the "Submit for Approval" button on the ` +
        `Booking details page. The button may be missing or disabled (checkout not reached). ` +
        `Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the pre-booking approval success page is displayed after sending a trip for approval
   * from the cart (test 22986). A pre-booking-approval user's cart CTA reads "Send For Approvals";
   * clicking it routes to the booking-success page with successType 'preBooking', whose title
   * renders common.sentForApproval ("Sent for Approval"). Wraps
   * CheckoutPage.getPreBookingApprovalSuccessTitleText (PRE_BOOKING_APPROVAL_SUCCESS_TITLE).
   *
   * Note: this is a different screen from the checkout-page "Trip Submitted for Approval" flow
   * used by sendForApprovalAndFinalize.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyApprovalSuccessMessageDisplayed(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    const titleText = await checkoutPage.getPreBookingApprovalSuccessTitleText();
    // App copy is "Sent for Approval"; match case-insensitively so a casing tweak doesn't break it.
    if (!titleText.trim().toLowerCase().includes('sent for approval')) {
      throw new Error(
        `[Checkout.verifyApprovalSuccessMessageDisplayed] Pre-booking approval success page loaded but ` +
        `the title did not match. Expected it to contain "Sent for Approval", got: "${titleText}"`
      );
    }
    return { displayed: true, titleText };
  },

  /**
   * Verifies the checkout send-for-approval button displays the expected text (test 46043).
   * The button label is backend-driven via the cart.checkoutBtn.* i18n namespace — for a checkout
   * approval flow it reads "Send For Approvals". Asserts an exact match (case-insensitive, with
   * whitespace normalized on both sides) so the test genuinely pins the button's correct label.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - text the button is expected to display
   * @returns {Promise<{ text: string }>}
   */
  async verifySendForApprovalButtonText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string' || !expectedText.trim())
      throw new Error(`"expectedText" must be a non-empty string, got: ${typeof expectedText}`);

    const checkoutPage = getPageObject(page, CheckoutPage);
    const actual = await checkoutPage.getSendForApprovalButtonText();
    const expectedNormalized = expectedText.replace(/\s+/g, ' ').trim();
    if (actual.toLowerCase() !== expectedNormalized.toLowerCase()) {
      throw new Error(
        `[Checkout.verifySendForApprovalButtonText] Expected the send-for-approval button to display ` +
        `"${expectedNormalized}", but it read "${actual}".`
      );
    }
    logger.info('Send-for-approval button text verified', { expected: expectedNormalized, actual });
    return { text: actual };
  },

  /**
   * Verifies an approval confirmation message is displayed on the booking-success screen after
   * submitting for approval (test 46043). Delegates to the page object, which matches the text as a
   * case-insensitive substring scoped to the booking-success container — so the caller can pass the
   * invariant leading text of a subtitle that interpolates the approver's name.
   *
   * @param {import('playwright').Page} page
   * @param {string} message - text (or invariant substring) expected to be displayed
   * @returns {Promise<void>}
   */
  async verifyApprovalConfirmationMessage(page, message) {
    if (!page) throw new Error('page is required');
    if (typeof message !== 'string' || !message.trim())
      throw new Error(`"message" must be a non-empty string, got: ${typeof message}`);

    const checkoutPage = getPageObject(page, CheckoutPage);
    try {
      await checkoutPage.waitForApprovalConfirmationMessageVisible(message);
    } catch (err) {
      throw new Error(
        `[Checkout.verifyApprovalConfirmationMessage] Approval confirmation message "${message}" was not ` +
        `displayed on the booking-success screen. Original: ${err.message}`
      );
    }
    logger.info('Approval confirmation message displayed', { message });
  },

  // ========================================
  // BOOKING SUCCESS — STEP-BY-STEP FLOW
  // ========================================

  /**
   * Clicks the "Book and Finalize" button on the checkout page.
   * Assumes booking details are already visible (preceded by "I wait for booking details in checkout").
   * Includes a brief stability wait before interacting, matching the pattern in bookTripWithoutNavigatingToTripOverview.
   */
  async clickBookAndFinalizeButton(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);
    await checkoutPage.waitForBookAndFinalizeButton();
    logger.debug('Clicking Book and Finalize button');
    await checkoutPage.clickBookAndFinalizeButton();
  },

  /**
   * Waits for the "Go to trip" button to be visible on the booking-success page.
   * Races the success button against the booking-error dialog so a supplier error is
   * detected immediately rather than silently timing out.
   */
  async waitForGoToTripButtonVisible(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    const bookingErrorDialog = page.locator('.booking-error-dialog').first();

    const outcome = await Promise.race([
      checkoutPage.getGoToTripButton().waitFor({ state: 'visible', timeout: 60000 }).then(() => 'success').catch(() => null),
      bookingErrorDialog.waitFor({ state: 'visible', timeout: 60000 }).then(() => 'booking-error').catch(() => null),
    ]);

    if (outcome === 'booking-error') {
      const errorText = await checkoutPage.getBookingErrorDialogText().catch(() => '');
      throw new Error(
        `[Checkout.waitForGoToTripButtonVisible] Booking error dialog appeared after clicking Book and Finalize. ` +
        `Error details: ${errorText || 'unknown'}`
      );
    }

    if (outcome !== 'success') {
      throw new Error(
        `[Checkout.waitForGoToTripButtonVisible] "Go to trip" button did not appear after booking. ` +
        `The booking may not have completed successfully.`
      );
    }

    logger.info('"Go to trip" button is visible on booking success page');
  },

  /**
   * Verifies the product details line on the booking-success page is visible and shows the expected status.
   * @param {import('playwright').Page} page
   * @param {string} expectedStatus - Expected status text (e.g. "Confirmed")
   */
  async verifyProductDetailsLineDisplayedWithStatus(page, expectedStatus) {
    if (!page) throw new Error('page is required');
    if (typeof expectedStatus !== 'string' || !expectedStatus)
      throw new Error(`"expectedStatus" must be a non-empty string, got: ${typeof expectedStatus}`);
    const checkoutPage = getPageObject(page, CheckoutPage);
    try {
      const statusBadge = checkoutPage.getBookingSuccessProductStatus();
      await expect(
        statusBadge,
        `Product details line status should be "${expectedStatus}" on the booking success page`,
      ).toContainText(expectedStatus, { ignoreCase: true });
      logger.info('Product details line is visible with expected status', { expectedStatus });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Checkout.verifyProductDetailsLineDisplayedWithStatus] Product details line not visible or status ` +
        `"${expectedStatus}" not found on the booking success page. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the product details line on the booking-success page is visible and shows one of the
   * given expected statuses (OR match), e.g. "Ticketing Complete" / "Confirmed" / "Finalizing".
   * @param {import('playwright').Page} page
   * @param {string[]} expectedStatuses - Acceptable status texts (at least one)
   */
  async verifyProductDetailsLineDisplayedWithStatusOneOf(page, expectedStatuses) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedStatuses) || expectedStatuses.length === 0)
      throw new Error(`"expectedStatuses" must be a non-empty array, got: ${typeof expectedStatuses}`);
    const checkoutPage = getPageObject(page, CheckoutPage);
    const statusBadge = checkoutPage.getBookingSuccessProductStatus();
    let actualText;
    try {
      actualText = await statusBadge.innerText();
    } catch (err) {
      throw new Error(
        `[Checkout.verifyProductDetailsLineDisplayedWithStatusOneOf] Product details line status badge never ` +
        `became visible while waiting for one of: ${JSON.stringify(expectedStatuses)}. Original: ${err.message}`
      );
    }

    const normalizedActual = actualText.trim().toLowerCase();
    const matched = expectedStatuses.some((expected) => normalizedActual.includes(expected.trim().toLowerCase()));

    if (!matched) {
      throw new Error(
        `[Checkout.verifyProductDetailsLineDisplayedWithStatusOneOf] Expected the product details line status to ` +
        `be one of ${JSON.stringify(expectedStatuses)}, but it read: "${actualText}"`
      );
    }

    logger.info('Product details line status matched one of the expected values', { expectedStatuses, actualText });
  },

  /**
   * Verifies the booking-success page title matches one of the given expected values (e.g.
   * "Confirmation in Progress" for the in-progress state or "Trip Submitted for Approval" for the
   * in-approval state — booking-success.vue's `dataByType` computed).
   *
   * @param {import('playwright').Page} page
   * @param {string[]} expectedTitles - Acceptable title texts (at least one)
   * @throws {Error} If inputs are invalid or the rendered title matches none of them
   * @returns {Promise<{ titleText: string }>}
   */
  async verifyBookingSuccessTitleIsOneOf(page, expectedTitles) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(expectedTitles) || expectedTitles.length === 0)
      throw new Error(`expectedTitles must be a non-empty array, got: ${typeof expectedTitles}`);

    const checkoutPage = getPageObject(page, CheckoutPage);
    let titleText;
    try {
      titleText = await checkoutPage.getBookingSuccessTitleText();
    } catch (err) {
      throw new Error(
        `[Checkout.verifyBookingSuccessTitleIsOneOf] The booking-success title never became visible while ` +
        `waiting for one of: ${JSON.stringify(expectedTitles)}. Original: ${err.message}`
      );
    }

    const normalizedActual = titleText.trim().toLowerCase();
    const matched = expectedTitles.some((expected) => normalizedActual === expected.trim().toLowerCase());

    if (!matched) {
      throw new Error(
        `[Checkout.verifyBookingSuccessTitleIsOneOf] Expected the booking-success title to be one of ` +
        `${JSON.stringify(expectedTitles)}, but it read: "${titleText}"`
      );
    }

    logger.info('Booking success title matched one of the expected values', { expectedTitles, titleText });
    return { titleText };
  },

  /**
   * Clicks the "Go to trip" button on the booking-success page and waits for the trip overview to load.
   * Button visibility was already confirmed by waitForGoToTripButtonVisible, so clicks directly without re-waiting.
   */
  async clickGoToTripButton(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);
    try {
      await checkoutPage.getGoToTripButton().click({ timeout: 60000 });
      await cartPage.waitForTripOverviewTitle();
    } catch (err) {
      throw new Error(
        `[Checkout.clickGoToTripButton] Failed to navigate to trip overview after clicking "Go to trip". Original: ${err.message}`
      );
    }
  },

  // ========================================
  // BOOKING STATUS
  // ========================================

  /**
   * Verifies that the "Book and Finalize" button is both visible and enabled
   * on the checkout page. Used to confirm that checkout loaded without a
   * blocking error (e.g. supplier rejecting the request).
   */
  async verifyBookAndFinalizeButtonEnabledAndVisible(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookAndFinalizeButton();

    const button = checkoutPage.getBookAndFinalizeButton();
    await expect(button, '"Book and Finalize" button should be visible').toBeVisible();
    await expect(button, '"Book and Finalize" button should be enabled').toBeEnabled();

    logger.info('"Book and Finalize" button is visible and enabled');
    return { visible: true, enabled: true };
  },

  /**
   * Verifies the "Yay! No additional details are required..." alert is NOT
   * displayed anywhere on the checkout page. This message must be suppressed
   * when the user has additional (reference) details configured.
   *
   * Waits for the checkout page to load first so the absence assertion cannot
   * pass simply because the reference form has not rendered yet.
   *
   * @param {import('playwright').Page} page
   */
  async verifyYayMessageNotVisible(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);

    // Ensure the checkout page (and its reference-fields section) is fully loaded
    // before asserting absence, to avoid a false pass on a not-yet-rendered page.
    // The "Book and Finalize" button only appears once checkout has finished
    // rendering, so it is a more reliable readiness signal than the optional 5s heading wait.
    await checkoutPage.waitForBookingDetailsText();
    await checkoutPage.waitForBookAndFinalizeButton();

    logger.debug('Asserting "Yay! No additional details are required..." alert is not displayed on checkout');

    const yayAlert = checkoutPage.getNoAdditionalDetailsAlert();
    await expect(
      yayAlert,
      'The "Yay! No additional details are required..." alert was displayed on checkout, but the user has additional details configured — it must be suppressed.',
    ).toHaveCount(0);
  },

  // ========================================
  // RECALCULATE APPROVAL FLOW BY REFERENCE FIELDS (test 54558)
  // ========================================

  /**
   * Verifies the checkout shows the "Recalculate Approval Flow" reference field in the General
   * Reference Questions section (general-reference-field.vue `.general-section`). This is the
   * controlling dropdown whose value recalculates the approval flow — selecting an approval-triggering
   * option flips the finalize button to "Submit for Approval".
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyRecalculateApprovalFlowSectionDisplayed(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();

    const label = checkoutPage.getGeneralSectionLabelByExactText('Recalculate Approval Flow');
    await expect(
      label,
      '[Checkout.verifyRecalculateApprovalFlowSectionDisplayed] Expected the "Recalculate Approval Flow" ' +
      'reference field to be displayed in the General Reference Questions section at checkout, but its label ' +
      'was not visible. The reference-fields section may not have rendered, or the field is not configured ' +
      'for this user.',
    ).toBeVisible({ timeout: 30000 });

    logger.info('"Recalculate Approval Flow" reference field is displayed at checkout');
  },

  /**
   * Verifies the checkout finalize CTA button reads the expected label (test 54558). The label is
   * backend-driven (cart.checkoutBtn.*) and recalculates asynchronously after a reference-field change,
   * so this polls the button text against the accepted variant set:
   *   - "Book and Finalize"  -> matches "Book and Finalize" OR "Finalize" (either UK/US spelling)
   *   - "Submit for Approval" -> matches "Submit for Approval" OR "Send For Approvals"
   * The expected string names the logical intent; both wording variants are treated as a pass.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - "Book and Finalize" or "Submit for Approval"
   * @returns {Promise<void>}
   */
  async verifyFinalizeButtonText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (typeof expectedText !== 'string' || !expectedText.trim())
      throw new Error(`"expectedText" must be a non-empty string, got: ${typeof expectedText}`);

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();

    // Approval-required intent vs. direct-booking intent -> the set of button labels that satisfy it.
    const wantsApproval = /submit for approval|send for approval/i.test(expectedText);
    const acceptedRegex = wantsApproval
      ? /(submit for approval)|(send for approvals)/i
      : /(book and finali[sz]e)|(finali[sz]e)/i;

    try {
      await expect
        .poll(async () => checkoutPage.getCheckoutFinalizeButtonText(), {
          timeout: 30000,
          message:
            `[Checkout.verifyFinalizeButtonText] Expected the checkout finalize button to read "${expectedText}" ` +
            `(accepted: ${acceptedRegex}), but its text never matched after the approval flow recalculated.`,
        })
        .toMatch(acceptedRegex);
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Checkout.verifyFinalizeButtonText] Failed to verify the finalize button text "${expectedText}". ` +
        `Original: ${err.message}`
      );
    }

    logger.info('Checkout finalize button text verified', { expectedText });
  },

  /**
   * Verifies that a reference field described as "linked to Recalculate Approval Flow" is displayed at
   * checkout (test 54558). Once an approval-flow value is selected, the dependent/linked field surfaces
   * with this label. Matched by exact text so it is not confused with the controlling
   * "Recalculate Approval Flow" field.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyReferenceFieldLinkedToRecalculateApprovalFlow(page) {
    if (!page) throw new Error('page is required');

    const checkoutPage = getPageObject(page, CheckoutPage);
    await checkoutPage.waitForBookingDetailsText();

    const label = checkoutPage.getGeneralSectionLabelByExactText('linked to Recalculate Approval Flow');
    await expect(
      label,
      '[Checkout.verifyReferenceFieldLinkedToRecalculateApprovalFlow] Expected a reference field labelled ' +
      '"linked to Recalculate Approval Flow" to be displayed at checkout, but it was not visible. The linked ' +
      'field may not have surfaced after selecting an approval-flow value.',
    ).toBeVisible({ timeout: 30000 });

    logger.info('"linked to Recalculate Approval Flow" reference field is displayed at checkout');
  },

  // ===========================================================================
  // Checkout trip-summary lines (test 44362)
  //
  // The summary sidebar lists one line per quote plus a grand total. For a trip
  // carrying a Squake compensation the compensation renders last as "Carbon
  // offset", and the total must equal the flight line plus that offset.
  // ===========================================================================

  /**
   * Verifies a named line is visible in the checkout trip summary.
   *
   * @param {import('playwright').Page} page
   * @param {string} lineLabel - Summary title text, e.g. "Carbon offset"
   */
  async verifySummaryLineVisible(page, lineLabel) {
    if (!page) {
      throw new Error('[Checkout.verifySummaryLineVisible] "page" is required.');
    }
    if (!lineLabel || typeof lineLabel !== 'string') {
      throw new Error(
        `[Checkout.verifySummaryLineVisible] "lineLabel" must be a non-empty string, got: ${typeof lineLabel} (${lineLabel})`
      );
    }

    const checkoutPage = getPageObject(page, CheckoutPage);

    try {
      await expect(checkoutPage.getCheckoutSummaryLineTitle(lineLabel)).toBeVisible({
        timeout: SUMMARY_LINE_TIMEOUT,
      });
    } catch (err) {
      // Playwright drops expect()'s custom message, so build the diagnostic here: which lines DID
      // render, and (for the compensation line) whether the app ever received a price for it.
      const renderedTitles = await checkoutPage.getCheckoutSummaryLineTitles();
      const rendered = renderedTitles.length
        ? renderedTitles.map((t) => `"${t}"`).join(', ')
        : '(none — the trip-summary sidebar rendered no quote lines at all)';

      let pricingNote = '';
      if (/carbon offset/i.test(lineLabel)) {
        const pricing = await checkoutPage.getCompensationPricingDebug();
        if (pricing.error) {
          pricingNote = ` Could not read tripStore/compensationPricing: ${pricing.error}.`;
        } else if (!pricing.priced) {
          pricingNote =
            ` tripStore/compensationPricing holds no priced entry (${pricing.entries} entr` +
            `${pricing.entries === 1 ? 'y' : 'ies'}), so this is the APP side, not the selector: the ` +
            `POST /compensationPricing that trip-cart.ts fires without awaiting before routing to ` +
            `checkout either never returned or failed (trip.store.ts swallows its errors), and ` +
            `general-quote-summary.vue hides the Compensation line until it has a price.`;
        } else {
          pricingNote =
            ` tripStore/compensationPricing DOES hold a priced entry, so the price arrived but the ` +
            `line still did not render under this label — check the label text (it is translated via ` +
            `compensation.carbonOffset, so a non-English profile language would break this match).`;
        }
      }

      throw new Error(
        `[Checkout.verifySummaryLineVisible] Expected a "${lineLabel}" line in the checkout trip ` +
        `summary, but it was not visible within ${SUMMARY_LINE_TIMEOUT}ms. Lines present: ${rendered}.` +
        `${pricingNote} Original: ${err.message}`
      );
    }
  },

  /**
   * Reads the flight line amount from the checkout summary.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractSummaryFlightAmount(page) {
    if (!page) {
      throw new Error('[Checkout.extractSummaryFlightAmount] "page" is required.');
    }

    logger.debug('[Checkout.extractSummaryFlightAmount] Reading the flight amount from the checkout summary');
    const checkoutPage = getPageObject(page, CheckoutPage);

    try {
      const amount = await checkoutPage.getCheckoutSummaryFlightAmount();
      logger.info('Extracted checkout summary flight amount', { amount });
      return amount;
    } catch (err) {
      throw new Error(`[Checkout.extractSummaryFlightAmount] Could not read the flight amount: ${err.message}`);
    }
  },

  /**
   * Reads the carbon offset (compensation) line amount from the checkout summary.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractSummaryCarbonOffsetAmount(page) {
    if (!page) {
      throw new Error('[Checkout.extractSummaryCarbonOffsetAmount] "page" is required.');
    }

    logger.debug('[Checkout.extractSummaryCarbonOffsetAmount] Reading the carbon offset amount');
    const checkoutPage = getPageObject(page, CheckoutPage);

    try {
      const amount = await checkoutPage.getCheckoutSummaryCompensationAmount();
      logger.info('Extracted checkout summary carbon offset amount', { amount });
      return amount;
    } catch (err) {
      throw new Error(
        `[Checkout.extractSummaryCarbonOffsetAmount] Could not read the carbon offset amount: ${err.message}`
      );
    }
  },

  /**
   * Reads the grand total from the checkout summary.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractSummaryTotalAmount(page) {
    if (!page) {
      throw new Error('[Checkout.extractSummaryTotalAmount] "page" is required.');
    }

    logger.debug('[Checkout.extractSummaryTotalAmount] Reading the checkout summary total');
    const checkoutPage = getPageObject(page, CheckoutPage);

    try {
      const amount = await checkoutPage.getCheckoutSummaryTotalAmount();
      logger.info('Extracted checkout summary total amount', { amount });
      return amount;
    } catch (err) {
      throw new Error(`[Checkout.extractSummaryTotalAmount] Could not read the summary total: ${err.message}`);
    }
  },

  /**
   * Verifies the checkout summary total equals the flight amount plus the carbon offset.
   *
   * @param {import('playwright').Page} page
   * @param {number} flightAmount
   * @param {number} carbonAmount
   * @param {number} totalAmount
   * @param {number} [tolerance=1] - Absolute currency tolerance
   */
  async verifySummaryTotalEqualsFlightPlusCarbon(page, flightAmount, carbonAmount, totalAmount, tolerance = 1) {
    if (!page) {
      throw new Error('[Checkout.verifySummaryTotalEqualsFlightPlusCarbon] "page" is required.');
    }

    const named = { flightAmount, carbonAmount, totalAmount, tolerance };
    for (const [name, value] of Object.entries(named)) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(
          `[Checkout.verifySummaryTotalEqualsFlightPlusCarbon] "${name}" must be a number, got: ${typeof value} (${value}). ` +
          `Make sure the three checkout-summary extraction steps ran before this assertion.`
        );
      }
    }

    logger.info('Verifying checkout summary total equals flight + carbon offset', named);

    expectSumToBeEqualWithTolerance(
      flightAmount,
      carbonAmount,
      totalAmount,
      tolerance,
      `[Checkout.verifySummaryTotalEqualsFlightPlusCarbon] Checkout summary total should equal the flight amount ` +
      `(${flightAmount}) plus the carbon offset (${carbonAmount}) = ${flightAmount + carbonAmount}, but the summary ` +
      `total reads ${totalAmount}`,
    );
  },

};

module.exports = Checkout;
