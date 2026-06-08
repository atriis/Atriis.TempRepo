const { waitForText } = require("@utils/wait");

/**
 * Page Object for checkout page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  BOOKING_DETAILS_HEADING: "h1.mb-5",
  FINALIZE_BUTTON: "button:has-text('Finalize')",
  BOOK_AND_FINALIZE_BUTTON: "button:has-text('Book and Finalize')",
  // Additional button text variants for different suppliers (e.g., Sunny cars uses "Book Now" or similar)
  BOOK_NOW_BUTTON: "button:has-text('Book Now'), button:has-text('Book'), button:has-text('Confirm')",
  FALLBACK_BUTTON: ".btn-container button",
  GO_TO_TRIP_BUTTON: ".btn-container > :nth-child(1)",
  GO_TO_TRIP_BUTTON_NAME: "Go to trip",
  FUSION_VERIFICATION_TITLE: ".booking-success .success-message__title",
  FUSION_VERIFY_NOW_BUTTON: ".success-message__email span",
  FUSION_3DS_DIALOG_CONTAINER: ".app-dialog",
  FUSION_3DS_DIALOG_CLOSE_BUTTON: ".app-dialog .el-dialog__headerbtn",
  // Ypsilon 3DS verification (ypsilon-3ds.vue — iframe-based SCA challenge)
  YPSILON_3DS_CONTAINER: "#yps_sca_frame",
  // Element-plus dialog title with the exact 'Card verification' text — the most
  // reliable indicator that the Ypsilon SCA dialog is actually shown to the user.
  YPSILON_3DS_DIALOG_TITLE: ".el-dialog__title:has-text('Card verification')",
  // Some Ypsilon 3DS dialogs are a simple accept screen with no challenge form;
  // clicking the in-dialog accept button completes verification without iframe interaction.
  YPSILON_3DS_ACCEPT_BUTTON: "#submit_accept",
  // "Send for approval" = standard approval flow; "Submit for Approval" = OOP/justification flow
  SEND_FOR_APPROVAL_BUTTON: "button:has-text('Send for approval'), button:has-text('Submit for Approval')",
  APPROVAL_SUCCESS_TITLE: "text=Trip Submitted for Approval",
  APPROVAL_SUCCESS_MESSAGE: "text=/Your order has been booked and sent to your approver for approval/i",
  BOOKING_ERROR_DIALOG: ".booking-error-dialog, .el-dialog.app-dialog.app-confirm:has(.booking-response-errors), .el-dialog:has-text('Checkout notification'):has-text('Booking error')",
  BACK_TO_TRIP_BUTTON: ".back-to-trip-btn, .app-footer .btn--primary:has-text('Back to trip'), button:has-text('Back to trip')",
  EMAIL_INPUT: ".email-input .el-input__inner",

  // Contact details (reference-form-contact-details.vue)
  CONTACT_DETAILS_CHECKBOX: ".reference-form-contact-details .share-checkbox-container .el-checkbox__inner",
  CONTACT_DETAILS_CHECKBOX_INPUT: ".reference-form-contact-details .share-checkbox-container .el-checkbox__original",
  CONTACT_PHONE_COUNTRY_CODE: ".reference-form-contact-details .el-input:nth-of-type(1) .el-input__inner",
  CONTACT_PHONE_AREA_CODE: ".reference-form-contact-details .el-input:nth-of-type(2) .el-input__inner",
  CONTACT_PHONE_NUMBER: ".reference-form-contact-details .el-input:nth-of-type(3) .el-input__inner",

  // Booker notification phone (trip-reference-form.vue — notifications-behalf section)
  BOOKER_PHONE_CONTAINER: ".notifications-behalf-collapse",
  BOOKER_PHONE_INPUTS: ".notifications-behalf-collapse .el-input__inner",

  // Required field detection — inputs inside is-danger wrappers across checkout
  REQUIRED_INPUTS: ".is-danger .el-input__inner",
  // "Yay! No additional details are required..." alert (trip-reference-form.vue).
  // Rendered via v-if and removed from the DOM entirely when reference fields ARE required.
  NO_ADDITIONAL_DETAILS_ALERT: ".no-reference-fields-alert",
  CHECKOUT_TOTAL_PRICE: '.price-summary .price-total .amount',
  CHECKOUT_SUMMARY_SECTION: '.trip-summary',
  CHECKOUT_SUMMARY_QUOTE_TITLE: '.trip-summary .summary-title',
};

class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Finalize" button locator.
   * @returns {Locator} Playwright locator for the Finalize button
   */
  getFinalizeButton() {
    return this.page.locator(SELECTORS.FINALIZE_BUTTON).first();
  }

  /**
   * Gets the "Book and Finalize" button locator.
   * @returns {Locator} Playwright locator for the Book and Finalize button
   */
  getBookAndFinalizeButton() {
    return this.page.locator(SELECTORS.BOOK_AND_FINALIZE_BUTTON).first();
  }

  /**
   * Gets the Go to Trip button element.
   * @returns {import('@playwright/test').Locator}
   */
  getGoToTripButton() {
    return this.page.getByRole('button', { name: SELECTORS.GO_TO_TRIP_BUTTON_NAME }).first();
  }

  /**
   * Gets the booking error dialog locator.
   * @returns {import('@playwright/test').Locator}
   */
  getBookingErrorDialog() {
    return this.page.locator(SELECTORS.BOOKING_ERROR_DIALOG).first();
  }

  /**
   * Confirms that the checkout page is loaded.
   * Some suppliers (e.g., Sunny cars) don't display a "Booking details" heading,
   * so this wait is non-fatal. The button wait that follows is more reliable.
   */
  async waitForBookingDetailsText() {
    try {
      await waitForText(
        this.page,
        SELECTORS.BOOKING_DETAILS_HEADING,
        "Booking details",
        5000, // Short timeout since this is optional
      );
    } catch (error) {
      // Heading not found - this is acceptable for some suppliers like Sunny cars
      // The subsequent button wait will ensure the page is ready
    }
  }

  /**
   * Waits until one of the finalize button variants is available.
   * Different suppliers and fares show different labels:
   * - Flights/Hotels: "Finalize" or "Book and Finalize"
   * - Cars (Sunny, etc.): "Book Now", "Book", or "Confirm"
   */
  async waitForBookAndFinalizeButton() {
    await this.page.waitForSelector(
      `${SELECTORS.FINALIZE_BUTTON}, ${SELECTORS.BOOK_AND_FINALIZE_BUTTON}, ${SELECTORS.BOOK_NOW_BUTTON}`,
      // 30s: the checkout page renders this button after a supplier round-trip,
      // which routinely exceeds 10s headless in CI (failed even on serial runs).
      { timeout: 30000 },
    );
  }

  /**
   * Clicks the appropriate finalize button.
   * Tries multiple button text variants (for different suppliers).
   * Falls back to a generic button if none of the expected labels are found.
   */
  async clickBookAndFinalizeButton() {
    if (await this.getFinalizeButton().isVisible()) {
      await this.getFinalizeButton().click();
      return;
    }

    if (await this.getBookAndFinalizeButton().isVisible()) {
      await this.getBookAndFinalizeButton().click();
      return;
    }

    // Try car rental suppliers (Sunny cars, etc.)
    const bookNowVariant = this.page.locator(SELECTORS.BOOK_NOW_BUTTON).first();
    if (await bookNowVariant.isVisible()) {
      await bookNowVariant.click();
      return;
    }

    // Fallback for unexpected UI variations
    await this.page.click(SELECTORS.FALLBACK_BUTTON);
  }

  /**
   * Waits until the "Send for approval" button is visible.
   */
  async waitForSendForApprovalButton() {
    await this.page.waitForSelector(
      SELECTORS.SEND_FOR_APPROVAL_BUTTON,
      { timeout: 10000 },
    );
  }

  /**
   * Clicks the "Send for approval" button.
   */
  async clickSendForApprovalButton() {
    await this.page.locator(SELECTORS.SEND_FOR_APPROVAL_BUTTON).first().click();
  }

  /**
   * Waits for the approval success page to load and validates the title text.
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForApprovalSuccessPage(timeout = 60000) {
    const titleLocator = this.page.locator(SELECTORS.APPROVAL_SUCCESS_TITLE);
    await titleLocator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the text of the approval success description message.
   */
  async getApprovalSuccessMessageText() {
    const messageLocator = this.page.locator(SELECTORS.APPROVAL_SUCCESS_MESSAGE).first();
    await messageLocator.waitFor({ state: 'visible', timeout: 60000 });
    return await messageLocator.innerText();
  }

  /**
   * Clicks the "Go to trip" button on the approval success page.
   * Uses getByRole scoped to the container for reliable click.
   */
  async clickApprovalSuccessGoToTrip() {
    await this.page
      .getByRole('button', { name: SELECTORS.GO_TO_TRIP_BUTTON_NAME })
      .first()
      .click();
  }

  /**
   * Waits until the booking error dialog is visible.
   */
  async waitForBookingErrorDialog() {
    await this.getBookingErrorDialog().waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Clicks the "Back to trip" button inside the booking error dialog.
   */
  async clickBackToTripButton() {
    const dialog = this.getBookingErrorDialog();
    await dialog.waitFor({ state: 'visible', timeout: 60000 });
    const backToTripButton = dialog.locator(SELECTORS.BACK_TO_TRIP_BUTTON).first();
    await backToTripButton.waitFor({ state: 'visible', timeout: 10000 });
    await backToTripButton.click();
  }

  /**
   * Extracts the supplier name from the booking error dialog.
   * Supports values rendered as plain text or wrapped in asterisks.
   *
   * @returns {Promise<string|null>}
   */
  async getBookingErrorSupplierName() {
    const errorDialog = this.getBookingErrorDialog();
    const errorText = await errorDialog.innerText();

    let match = errorText.match(/supplier:\s*\*{1,2}([^*\n]+?)\*{1,2}/i);

    if (!match) {
      match = errorText.match(/supplier:\s*([^\n]+)/i);
    }

    return match ? match[1].trim() : null;
  }

  /**
   * Gets the full booking error dialog text for resilient known-error matching.
   *
   * @returns {Promise<string>}
   */
  async getBookingErrorDialogText() {
    const errorDialog = this.getBookingErrorDialog();
    const errorText = await errorDialog.innerText();
    return typeof errorText === 'string' ? errorText.trim() : '';
  }

  /**
   * Navigates to the Trip Overview after booking completion.
   */
  async clickGoToTrip() {
    const goToTripButton = this.getGoToTripButton();
    await goToTripButton.waitFor({ state: 'visible', timeout: 60000 });
    await goToTripButton.click();
  }

  /**
   * Completes the Fusion 3DS verification screen shown after booking low-cost flights.
   *
   * Flow:
   *  - waits for the "Card verification needed!" success message
   *  - extracts the trip ID from the current URL
   *  - waits 18 seconds for the verification modal to auto-appear
   *  - if the modal did not open, clicks "Verify now" to open it
   *  - closes the modal
   *
   * The simulated 3DS iframe (gtp-staging.com) is unreliable in staging, so we
   * skip interacting with it entirely and rely on direct trip URL navigation
   * afterwards (handled by the DSL layer).
   *
   * @param {number} timeout - Max wait for the verification title.
   * @returns {Promise<string>} The trip ID extracted from the URL.
   */
  async completeFusionCardVerification(timeout = 90000) {
    await waitForText(
      this.page,
      SELECTORS.FUSION_VERIFICATION_TITLE,
      'Card verification needed!',
      timeout,
    );

    const tripIdMatch = new URL(this.page.url()).pathname.match(/\/trips\/(\d+)/);
    if (!tripIdMatch) {
      throw new Error('completeFusionCardVerification: could not extract trip ID from URL: ' + this.page.url());
    }
    const tripId = tripIdMatch[1];

    // Fusion auto-opens the 3DS modal up to ~18s after booking succeeds.
    // Probe up to that bound; if it doesn't auto-open we trigger it via "Verify now".
    const dialogContainer = this.page.locator(SELECTORS.FUSION_3DS_DIALOG_CONTAINER).first();
    const dialogVisible = await dialogContainer
      .waitFor({ state: 'visible', timeout: 18000 })
      .then(() => true)
      .catch(() => false);

    if (!dialogVisible) {
      const verifyNowButton = this.page.locator(SELECTORS.FUSION_VERIFY_NOW_BUTTON).first();
      await verifyNowButton.waitFor({ state: 'visible', timeout: 30000 });
      await verifyNowButton.click();
      await dialogContainer.waitFor({ state: 'visible', timeout: 30000 });
    }

    const closeButton = this.page.locator(SELECTORS.FUSION_3DS_DIALOG_CLOSE_BUTTON).first();
    await closeButton.waitFor({ state: 'visible', timeout: 30000 });
    await closeButton.click();

    return tripId;
  }

  /**
   * Waits until the email input has a non-empty value, then returns it.
   * Uses polling because the Contact Details section is auto-populated asynchronously.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<string>} The email input value
   */
  async getEmailInputValue(timeout = 15000) {
    const input = this.page.locator(SELECTORS.EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    // Poll until value is non-empty (auto-populated asynchronously from guest profile)
    const deadline = Date.now() + timeout;
    let value = '';
    while (Date.now() < deadline) {
      value = await input.inputValue();
      if (value.trim()) return value;
      await this.page.waitForTimeout(500);
    }
    return value;
  }

  /**
   * Fills the traveler contact email field.
   * @param {string} value
   */
  async fillContactEmail(value) {
    const input = this.page.locator(SELECTORS.EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }

  /**
   * Clicks the "Don't share contact details with airlines" checkbox.
   */
  async clickContactDetailsCheckbox() {
    const cb = this.page.locator(SELECTORS.CONTACT_DETAILS_CHECKBOX).first();
    await cb.waitFor({ state: 'visible', timeout: 10000 });
    await cb.click();
  }

  /**
   * Checks whether the contact details sharing checkbox is checked.
   * @returns {Promise<boolean>}
   */
  async isContactDetailsCheckboxChecked() {
    const checkboxInput = this.page.locator(SELECTORS.CONTACT_DETAILS_CHECKBOX_INPUT).first();
    await checkboxInput.waitFor({ state: 'attached', timeout: 10000 });
    return checkboxInput.isChecked();
  }

  /**
   * Fills the contact phone country code field.
   * @param {string} value
   */
  async fillContactPhoneCountryCode(value) {
    const input = this.page.locator(SELECTORS.CONTACT_PHONE_COUNTRY_CODE).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }

  /**
   * Fills the contact phone area code field.
   * @param {string} value
   */
  async fillContactPhoneAreaCode(value) {
    const input = this.page.locator(SELECTORS.CONTACT_PHONE_AREA_CODE).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }

  /**
   * Fills the contact phone number field.
   * @param {string} value
   */
  async fillContactPhoneNumber(value) {
    const input = this.page.locator(SELECTORS.CONTACT_PHONE_NUMBER).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }

  /**
   * Returns the concatenated value of all three traveler contact phone fields.
   * Used to verify the phone is pre-populated with numeric data.
   * @returns {Promise<string>}
   */
  async getContactPhoneValues() {
    const cc = await this.page.locator(SELECTORS.CONTACT_PHONE_COUNTRY_CODE).first().inputValue().catch(() => '');
    const ac = await this.page.locator(SELECTORS.CONTACT_PHONE_AREA_CODE).first().inputValue().catch(() => '');
    const num = await this.page.locator(SELECTORS.CONTACT_PHONE_NUMBER).first().inputValue().catch(() => '');
    return cc + ac + num;
  }

  /**
   * Returns the concatenated value of all three booker notification phone fields,
   * or null if the booker notification section is not visible on the page.
   * @returns {Promise<string|null>}
   */
  async getBookerNotificationPhoneValues() {
    const container = this.page.locator(SELECTORS.BOOKER_PHONE_CONTAINER);
    const isVisible = await container.isVisible().catch(() => false);
    if (!isVisible) return null;
    const inputs = this.page.locator(SELECTORS.BOOKER_PHONE_INPUTS);
    const count = await inputs.count();
    if (count < 3) return null;
    const values = await Promise.all([
      inputs.nth(0).inputValue().catch(() => ''),
      inputs.nth(1).inputValue().catch(() => ''),
      inputs.nth(2).inputValue().catch(() => ''),
    ]);
    return values.join('');
  }

  /**
   * Gets the total price displayed in the checkout trip summary.
   * @returns {Promise<number|null>}
   */
  async getCheckoutTotalPrice() {
    const total = this.page.locator(SELECTORS.CHECKOUT_TOTAL_PRICE).first();
    await total.waitFor({ state: 'visible', timeout: 15000 });
    const text = await total.innerText();
    const normalized = text.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
    const value = Number.parseFloat(normalized);
    return Number.isNaN(value) ? null : value;
  }

  /**
   * Completes the Ypsilon 3DS SCA challenge. The Atriis page auto-opens the
   * Card verification dialog on checkout mount and an external SCA script
   * injects an iframe (Poseidon Bank / Verified by Visa) into #yps_sca_frame.
   * Waits for the dialog and iframe, fills the test code, and submits.
   *
   * @param {string} verificationCode - The 3DS test code (e.g. '555')
   * @param {number} timeout - Max wait time for the dialog title to appear
   * @param {number} variantTimeout - Max wait time for the variant (accept button / iframe / auto-close) to resolve
   */
  async completeYpsilon3dsVerification(verificationCode = '555', timeout = 90000, variantTimeout = 60000) {
    if (!verificationCode || typeof verificationCode !== 'string') {
      throw new Error(`verificationCode must be a non-empty string, got: ${typeof verificationCode}`);
    }
    if (typeof variantTimeout !== 'number' || variantTimeout < 0) {
      throw new Error(`variantTimeout must be a non-negative number, got: ${variantTimeout}`);
    }

    // Wait for the 3DS verification dialog title to appear.
    // We key off `.el-dialog__title` with the exact 'Card verification' text —
    // generic `.app-dialog` selectors can match unrelated hidden popups.
    const dialogTitle = this.page.locator(SELECTORS.YPSILON_3DS_DIALOG_TITLE);
    await dialogTitle.waitFor({ state: 'visible', timeout });

    // The Ypsilon dialog renders in one of three possible flows and we don't know which
    // upfront. Race all three — whichever resolves first determines the outcome:
    //   - Variant A (e.g. test 58320): a simple in-dialog accept button to click.
    //   - Variant B (e.g. test 29424): an iframe SCA challenge inside #yps_sca_frame.
    //   - Variant C: the dialog auto-closes on its own (silent SCA verification by the supplier).
    const acceptButton = this.page.locator(SELECTORS.YPSILON_3DS_ACCEPT_BUTTON);
    const iframeElement = this.page.locator(`${SELECTORS.YPSILON_3DS_CONTAINER} iframe`);

    const variant = await Promise.race([
      acceptButton.waitFor({ state: 'visible', timeout: variantTimeout }).then(() => 'accept').catch(() => null),
      iframeElement.waitFor({ state: 'attached', timeout: variantTimeout }).then(() => 'iframe').catch(() => null),
      dialogTitle.waitFor({ state: 'hidden', timeout: variantTimeout }).then(() => 'auto-closed').catch(() => null),
    ]);

    if (variant === 'accept') {
      await acceptButton.click();
      return variant;
    }

    if (variant === 'auto-closed') {
      // Supplier completed SCA silently — nothing further to do.
      return variant;
    }

    if (variant !== 'iframe') {
      throw new Error('Ypsilon 3DS dialog appeared but neither the accept button, the SCA iframe, nor a silent auto-close was observed within the timeout.');
    }

    // Variant B — iframe SCA challenge.
    const frame = this.page.frameLocator(`${SELECTORS.YPSILON_3DS_CONTAINER} iframe`);
    const challengeInput = frame.getByPlaceholder('Enter Code here');
    await challengeInput.waitFor({ state: 'visible', timeout: 30000 });
    await challengeInput.fill(verificationCode);

    const submitButton = frame.getByRole('button', { name: 'Submit', exact: true });
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    return variant;
  }

  /**
   * Waits for the Ypsilon 3DS dialog to close after successful verification.
   * @param {number} timeout - Max wait time
   */
  async waitForYpsilon3dsDialogToClose(timeout = 60000) {
    const dialogTitle = this.page.locator(SELECTORS.YPSILON_3DS_DIALOG_TITLE);
    await dialogTitle.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Probes whether the Ypsilon 3DS Card verification dialog is currently shown.
   * Used to decide between two booking flows: dialogs that auto-open on
   * checkout mount (SCA before Book and Finalize) vs. dialogs that only open
   * after Book and Finalize is clicked.
   *
   * @param {number} timeout - Max wait time (default: 5000)
   * @returns {Promise<boolean>}
   */
  async isYpsilon3dsDialogVisible(timeout = 5000) {
    try {
      await this.page.locator(SELECTORS.YPSILON_3DS_DIALOG_TITLE).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fills any empty required inputs (`.is-danger .el-input__inner`) with fallback
   * phone values before the booking attempt.
   * Only fills inputs that are currently empty to avoid overwriting valid data.
   */
  async fillRequiredPhoneInputs() {
    const fallbackValues = ['1', '555', '1234567'];
    const inputs = this.page.locator(SELECTORS.REQUIRED_INPUTS);
    const count = await inputs.count();
    const limit = Math.min(count, fallbackValues.length);
    for (let i = 0; i < limit; i++) {
      const input = inputs.nth(i);
      const val = await input.inputValue().catch(() => '');
      if (!val) {
        await input.fill(fallbackValues[i]);
      }
    }
  }

  /**
   * Gets the "Yay! No additional details are required..." alert locator.
   * The alert is only present in the DOM when no reference fields are required,
   * so callers asserting its absence should expect a count of 0.
   * @returns {import('@playwright/test').Locator}
   */
  getNoAdditionalDetailsAlert() {
    return this.page.locator(SELECTORS.NO_ADDITIONAL_DETAILS_ALERT);
  }

  async verifyQuoteVisibleInCheckoutSummary(quoteName, { timeout = 15000 } = {}) {
    try {
      const summarySection = this.page.locator(SELECTORS.CHECKOUT_SUMMARY_SECTION).first();
      await summarySection.waitFor({ state: 'visible', timeout });
      const summaryText = await summarySection.innerText();
      return summaryText;
    } catch (err) {
      throw new Error(
        `[CheckoutPage.verifyQuoteVisibleInCheckoutSummary] Could not find the checkout summary section ` +
        `(selector: ${SELECTORS.CHECKOUT_SUMMARY_SECTION}) within ${timeout}ms while looking for quote "${quoteName}". ` +
        `The checkout page may not have loaded, or the trip-summary sidebar is not rendered. ` +
        `Original: ${err.message}`
      );
    }
  }

}

// Export CheckoutPage and SELECTORS for use in tests and DSL
module.exports = {
  CheckoutPage,
  SELECTORS,
};
