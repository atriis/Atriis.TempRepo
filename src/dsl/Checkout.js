const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { CheckoutPage } = require("@pages/CheckoutPage");
const { CartPage } = require("@pages/CartPage");
const { CommonPage } = require("@pages/CommonPage");
const BookingErrorHandler = require("@utils/bookingErrorHandler");
const logger = require("@utils/logger").child("Checkout-DSL");


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

    // Two known Ypsilon flows trigger the Card verification dialog at different times:
    //   - Auto-open on checkout mount (e.g. test 29424) → complete SCA first, then Book and Finalize.
    //   - Open after Book and Finalize click (e.g. test 58320) → click Book and Finalize first, then SCA.
    // 30s probe: the auto-open variant can take up to ~25s to render the SCA dialog after
    // checkout mount; the post-click variant pays this as fixed latency. Trade-off is accepted
    // because reliability of the 29424 flow outweighs ~30s saved on 58320.
    // The dialog itself has three render outcomes (iframe SCA challenge, simple accept button,
    // or silent auto-close) — all handled inside completeYpsilon3dsVerification.
    const dialogAlreadyOpen = await checkoutPage.isYpsilon3dsDialogVisible(30000);

    if (dialogAlreadyOpen) {
      logger.info('Ypsilon 3DS dialog auto-opened on checkout mount — completing SCA before Book and Finalize');
      await checkoutPage.completeYpsilon3dsVerification(verificationCode);
      await checkoutPage.waitForYpsilon3dsDialogToClose();
      await Checkout.bookTripWithoutNavigatingToTripOverview(page);
    } else {
      logger.info('Ypsilon 3DS dialog not auto-opened — clicking Book and Finalize first, then completing SCA');
      await Checkout.bookTripWithoutNavigatingToTripOverview(page);
      await checkoutPage.completeYpsilon3dsVerification(verificationCode);
      await checkoutPage.waitForYpsilon3dsDialogToClose();
    }

    await checkoutPage.clickGoToTrip();
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true, flowVariant: dialogAlreadyOpen ? 'auto-open' : 'post-click' };
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

    // The "Don't share contact details" checkbox controls whether the phone
    // fields are enabled (fields are disabled while it is checked). Its initial
    // state is user-dependent (driven by the profile's isRefusedToSharePersonalData),
    // so toggle only when needed to reach the unchecked/enabled state — clicking
    // unconditionally would disable the fields for users who already share.
    if (await checkoutPage.isContactDetailsCheckboxChecked()) {
      await checkoutPage.clickContactDetailsCheckbox();
    }

    // Fill phone fields
    await checkoutPage.fillContactPhoneCountryCode(countryCode);
    await checkoutPage.fillContactPhoneAreaCode(areaCode);
    await checkoutPage.fillContactPhoneNumber(phoneNumber);
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
   * Clicks the "Go to trip" button on the booking-success page and waits for the trip overview to load.
   * Button visibility was already confirmed by waitForGoToTripButtonVisible, so clicks directly without re-waiting.
   */
  async clickGoToTripButton(page) {
    if (!page) throw new Error('page is required');
    const checkoutPage = getPageObject(page, CheckoutPage);
    const cartPage = getPageObject(page, CartPage);
    try {
      await checkoutPage.getGoToTripButton().click();
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

};

module.exports = Checkout;
