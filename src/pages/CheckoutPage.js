const { waitForText } = require("@utils/wait");
const { parseAmountText } = require("@utils/dom");

/**
 * Page Object for checkout page.
 * Contains only UI-level interactions.
 */

// Generic booking-success page title (booking-success.vue `.success-message__title`). The rendered
// text varies by screen — Fusion 3DS "verification needed" vs. pre-booking approval "Sent for
// Approval" (successType 'preBooking') — but it is the same element, so both keys share one source.
const BOOKING_SUCCESS_TITLE_SELECTOR = ".booking-success .success-message__title";

const SELECTORS = {
  BOOKING_DETAILS_HEADING: "h1.mb-5",
  FINALIZE_BUTTON: "button:has-text('Finalize')",
  BOOK_AND_FINALIZE_BUTTON: "button:has-text('Book and Finalize')",
  // Additional button text variants for different suppliers (e.g., Sunny cars uses "Book Now" or similar)
  BOOK_NOW_BUTTON: "button:has-text('Book Now'), button:has-text('Book'), button:has-text('Confirm')",
  FALLBACK_BUTTON: ".btn-container button",
  GO_TO_TRIP_BUTTON: ".btn-container > :nth-child(1)",
  GO_TO_TRIP_BUTTON_NAME: "Go to trip",
  FUSION_VERIFICATION_TITLE: BOOKING_SUCCESS_TITLE_SELECTOR,
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
  // Booking-success screen root (booking-success.vue). The approval confirmation lines render
  // inside it as .success-message__description (subtitle) and .success-message__email (label).
  BOOKING_SUCCESS_CONTAINER: ".booking-success",
  APPROVAL_SUCCESS_TITLE: "text=Trip Submitted for Approval",
  APPROVAL_SUCCESS_MESSAGE: "text=/Your order has been booked and sent to your approver for approval/i",
  // Pre-booking approval success page (booking-success.vue, successType 'preBooking'):
  // title renders common.sentForApproval ("Sent for Approval"). Same element as
  // FUSION_VERIFICATION_TITLE (shared const); distinct from the checkout-page
  // APPROVAL_SUCCESS_TITLE screen above.
  PRE_BOOKING_APPROVAL_SUCCESS_TITLE: BOOKING_SUCCESS_TITLE_SELECTOR,
  BOOKING_ERROR_DIALOG: ".booking-error-dialog, .el-dialog.app-dialog.app-confirm:has(.booking-response-errors), .el-dialog:has-text('Checkout notification'):has-text('Booking error')",
  BACK_TO_TRIP_BUTTON: ".back-to-trip-btn, .app-footer .btn--primary:has-text('Back to trip'), button:has-text('Back to trip')",
  EMAIL_INPUT: ".email-input .el-input__inner",

  // Contact details (reference-form-contact-details.vue)
  CONTACT_DETAILS_SECTION: ".reference-form-contact-details",
  CONTACT_DETAILS_CHECKBOX: ".reference-form-contact-details .share-checkbox-container .el-checkbox__inner",
  CONTACT_DETAILS_CHECKBOX_INPUT: ".reference-form-contact-details .share-checkbox-container .el-checkbox__original",
  // Contact phone — redesigned app-phone-input: country dropdown button + area/number text inputs
  CONTACT_PHONE_COUNTRY_BTN: ".reference-form-contact-details .app-phone-input__country",
  CONTACT_PHONE_DIAL: ".reference-form-contact-details .app-phone-input__dial",
  CONTACT_PHONE_AREA: ".reference-form-contact-details .app-phone-input__area",
  CONTACT_PHONE_NUMBER: ".reference-form-contact-details .app-phone-input__number",
  // Country-code dropdown popover (teleported to <body> by el-popover; :visible scopes to the active one)
  PHONE_INPUT_POPOVER_SEARCH: ".app-phone-input-popover .app-phone-input__search input:visible",
  PHONE_INPUT_POPOVER_OPTION: ".app-phone-input-popover:visible .app-phone-input__option",

  // Booker notification phone (trip-reference-form.vue — notifications-behalf section)
  // Redesigned to use app-phone-input; inputs use __dial/__area/__number classes (not .el-input__inner)
  BOOKER_PHONE_CONTAINER: ".notifications-behalf-collapse",
  BOOKER_PHONE_DIAL: ".notifications-behalf-collapse .app-phone-input__dial",
  BOOKER_PHONE_AREA: ".notifications-behalf-collapse .app-phone-input__area",
  BOOKER_PHONE_NUMBER: ".notifications-behalf-collapse .app-phone-input__number",

  // Required field detection — inputs inside is-danger wrappers across checkout
  REQUIRED_INPUTS: ".is-danger .el-input__inner",
  // "Yay! No additional details are required..." alert (trip-reference-form.vue).
  // Rendered via v-if and removed from the DOM entirely when reference fields ARE required.
  NO_ADDITIONAL_DETAILS_ALERT: ".no-reference-fields-alert",
  CHECKOUT_TOTAL_PRICE: '.price-summary .price-total .amount',
  CHECKOUT_SUMMARY_SECTION: '.trip-summary',
  CHECKOUT_SUMMARY_QUOTE_TITLE: '.trip-summary .summary-title',
  // Per-line prices in the checkout trip-summary sidebar. The flight line mirrors the cart's
  // `.flight-quote-summary .quote-price`; the compensation line (compensation-quote-summary.vue)
  // is rendered last and carries `:class="{ last: isLast }"` on its `.quote-summary` wrapper.
  CHECKOUT_SUMMARY_FLIGHT_PRICE: '.trip-summary .flight-quote-summary .quote-price',
  CHECKOUT_SUMMARY_COMPENSATION_PRICE: '.trip-summary .quote-summary.last .quote-price',

  // Booking-success page — product details line (booking-success.vue .quote-result card)
  BOOKING_SUCCESS_PRODUCT_LINE: '.quote-result .quote-results__wrapper',
  BOOKING_SUCCESS_PRODUCT_STATUS: '.quote-results__status.app-label--quote',

  // Checkout (Booking details) finalize CTA — trip-reference-form.vue renders it via app-btn with a
  // stable data-testid (desktop + mobile variants; only one is visible per viewport). Its label is
  // backend-driven (cart.checkoutBtn.*) so the text toggles between "Finalize"/"Book and Finalize" and
  // "Submit for Approval"/"Send For Approvals" as the approval flow recalculates. The class fallback
  // (.btn--width-100.btn--primary, the is-fit-width primary button) covers staging builds that may lag
  // the source data-testids.
  CHECKOUT_FINALIZE_BTN:
    "[data-testid='trip.reference-form.checkout-btn-desktop'], " +
    "[data-testid='trip.reference-form.checkout-btn-mobile'], " +
    ".btn--width-100.btn--primary",
  // General Reference Questions section (general-reference-field.vue) — reference-field question
  // labels render inside `.general-section`.
  GENERAL_SECTION: '.general-section',
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
    // 30s (not 10s): after a hotel booking finalizes, the Booking details page
    // needs time to render the approval CTA; 10s failed ~2/3 of live runs.
    await this.page.waitForSelector(
      SELECTORS.SEND_FOR_APPROVAL_BUTTON,
      { timeout: 30000 },
    );
  }

  /**
   * Clicks the "Send for approval" button.
   */
  async clickSendForApprovalButton() {
    await this.page.locator(SELECTORS.SEND_FOR_APPROVAL_BUTTON).first().click();
  }

  /**
   * Returns the visible text of the checkout send-for-approval button.
   * The label is backend-driven (cart.checkoutBtn.* i18n) — e.g. "Send For Approvals" — so this
   * reads the rendered text for the caller to assert against.
   * @returns {Promise<string>} normalized button text (whitespace collapsed, trimmed)
   */
  async getSendForApprovalButtonText() {
    // Scope to the visible instance: the booking-details page renders the CTA in a sticky cart
    // panel and can carry hidden responsive duplicates, so an unscoped .first() could lock onto a
    // hidden copy and time out.
    const button = this.page
      .locator(SELECTORS.SEND_FOR_APPROVAL_BUTTON)
      .filter({ visible: true })
      .first();
    await button.waitFor({ state: "visible", timeout: 30000 });
    const text = await button.innerText();
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Waits until the given approval confirmation message is visible on the booking-success screen.
   * Matches case-insensitively as a substring (getByText default), scoped to the booking-success
   * container so the interpolated approver name in the subtitle does not need to be matched.
   * @param {string} message - text (or invariant substring) expected to be displayed
   * @param {number} timeout - max wait in ms (default 120000, covers the booking round-trip)
   */
  async waitForApprovalConfirmationMessageVisible(message, timeout = 120000) {
    const locator = this.page
      .locator(SELECTORS.BOOKING_SUCCESS_CONTAINER)
      .getByText(message)
      .filter({ visible: true })
      .first();
    await locator.waitFor({ state: "visible", timeout });
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
   * Waits for the pre-booking approval success page and returns its title text
   * (booking-success.vue preBooking type — expected to read "Sent for Approval").
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async getPreBookingApprovalSuccessTitleText(timeout = 60000) {
    const titleLocator = this.page.locator(SELECTORS.PRE_BOOKING_APPROVAL_SUCCESS_TITLE).first();
    await titleLocator.waitFor({ state: 'visible', timeout });
    return await titleLocator.innerText();
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
   * Extracts the "supplier:" line from the booking error dialog (name plus any
   * trailing message text on the same line), for concise logging. Unlike
   * getBookingErrorSupplierName(), this does not stop at the first closing
   * asterisk pair, so it captures messages like "**AVIS**THIS AWD NOT AVAILABLE...".
   *
   * @returns {Promise<string|null>}
   */
  async getBookingErrorSupplierMessage() {
    const errorDialog = this.getBookingErrorDialog();
    const errorText = await errorDialog.innerText();

    const match = errorText.match(/supplier:\s*([^\n]+)/i);
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
    // The contact-details section is rendered only after the flight quotes load
    // (v-if="isQuotesContainFlight"), so wait for the section itself before the
    // email input to avoid racing the async render on slow supplier responses.
    const section = this.page.locator(SELECTORS.CONTACT_DETAILS_SECTION).first();
    await section.waitFor({ state: 'visible', timeout });

    const input = this.page.locator(SELECTORS.EMAIL_INPUT).first();
    await input.scrollIntoViewIfNeeded().catch(() => {});
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
   * Opens the country-code popover, searches for the dial code, and selects the matching option.
   * @param {string} value - Dial code digits only (e.g. "1" for +1)
   */
  async fillContactPhoneCountryCode(value) {
    const countryBtn = this.page.locator(SELECTORS.CONTACT_PHONE_COUNTRY_BTN).first();
    await countryBtn.waitFor({ state: 'visible', timeout: 10000 });
    await countryBtn.click();
    const searchInput = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_SEARCH);
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(value);
    const option = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_OPTION)
      .filter({ hasText: `+${value}` })
      .first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Fills the contact phone area code field.
   * @param {string} value
   */
  async fillContactPhoneAreaCode(value) {
    const input = this.page.locator(SELECTORS.CONTACT_PHONE_AREA).first();
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
    const dialEl = this.page.locator(SELECTORS.CONTACT_PHONE_DIAL).first();
    await dialEl.waitFor({ state: 'visible', timeout: 10000 });
    const dialText = await dialEl.textContent();
    const cc = (dialText || '').replace(/^\+/, '').trim();
    const ac = await this.page.locator(SELECTORS.CONTACT_PHONE_AREA).first().inputValue().catch(() => '');
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
    const dialEl = this.page.locator(SELECTORS.BOOKER_PHONE_DIAL).first();
    const dialVisible = await dialEl.isVisible().catch(() => false);
    if (!dialVisible) return null;
    const dialText = await dialEl.textContent().catch(() => '');
    const cc = (dialText || '').replace(/^\+/, '').trim();
    const ac = await this.page.locator(SELECTORS.BOOKER_PHONE_AREA).first().inputValue().catch(() => '');
    const num = await this.page.locator(SELECTORS.BOOKER_PHONE_NUMBER).first().inputValue().catch(() => '');
    return cc + ac + num;
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

  /**
   * Waits for the "Go to trip" button to be visible on the booking-success page.
   * @param {number} timeout
   */
  async waitForGoToTripButton(timeout = 60000) {
    await this.getGoToTripButton().waitFor({ state: 'visible', timeout });
  }

  /**
   * Gets the first product details line on the booking-success page (.quote-results__wrapper).
   * @returns {import('@playwright/test').Locator}
   */
  getBookingSuccessProductLine() {
    return this.page.locator(SELECTORS.BOOKING_SUCCESS_PRODUCT_LINE).first();
  }

  /**
   * Gets the status badge on the booking-success product details line (.quote-results__status.app-label--quote).
   * @returns {import('@playwright/test').Locator}
   */
  getBookingSuccessProductStatus() {
    return this.page.locator(SELECTORS.BOOKING_SUCCESS_PRODUCT_STATUS).first();
  }

  /**
   * Gets the visible checkout finalize CTA button (label toggles with the approval flow).
   * Scopes to the visible instance so the hidden responsive (desktop/mobile) duplicate is skipped.
   * @returns {import('@playwright/test').Locator}
   */
  getCheckoutFinalizeButton() {
    return this.page.locator(SELECTORS.CHECKOUT_FINALIZE_BTN).filter({ visible: true }).first();
  }

  /**
   * Returns the normalized visible text of the checkout finalize CTA button.
   * @param {number} timeout - Max wait for the button to be visible (default 30000)
   * @returns {Promise<string>} button text, whitespace collapsed and trimmed
   */
  async getCheckoutFinalizeButtonText(timeout = 30000) {
    const button = this.getCheckoutFinalizeButton();
    await button.waitFor({ state: 'visible', timeout });
    const text = await button.innerText();
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Gets a reference-field label in the General Reference Questions section whose text exactly matches
   * the given text (scoped to `.general-section`, visible only). Exact match distinguishes the
   * "Recalculate Approval Flow" controlling field from the "linked to Recalculate Approval Flow"
   * dependent field, whose text merely contains the former.
   * @param {string} text - Exact label text
   * @returns {import('@playwright/test').Locator}
   */
  getGeneralSectionLabelByExactText(text) {
    return this.page
      .locator(SELECTORS.GENERAL_SECTION)
      .getByText(text, { exact: true })
      .filter({ visible: true })
      .first();
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

  // ===== Checkout trip-summary lines (trip-summary.vue + per-product *-quote-summary.vue) =====

  /**
   * Gets a checkout summary line title locator filtered to the expected label,
   * e.g. "Carbon offset" (compensation-quote-summary.vue).
   *
   * @param {string} lineLabel - Summary title text to match
   * @returns {import('@playwright/test').Locator}
   */
  getCheckoutSummaryLineTitle(lineLabel) {
    if (!lineLabel || typeof lineLabel !== 'string') {
      throw new Error(
        `[CheckoutPage.getCheckoutSummaryLineTitle] "lineLabel" must be a non-empty string, got: ${typeof lineLabel} (${lineLabel})`
      );
    }
    return this.page
      .locator(SELECTORS.CHECKOUT_SUMMARY_QUOTE_TITLE, { hasText: lineLabel })
      .first();
  }

  /**
   * Reads a price from the checkout trip-summary sidebar.
   *
   * Uses parseAmountText rather than getCheckoutTotalPrice's inline normalizer so
   * thousands separators parse correctly in both US ("1,234.50") and EU ("1.234,50")
   * locales — these values feed a sum assertion, where a mis-parsed thousands
   * separator would silently compare 1.234 against 1234.50.
   *
   * @param {string} selector - One of the CHECKOUT_SUMMARY_* price selectors
   * @param {string} label - Human label used in errors, e.g. "carbon offset amount"
   * @param {number} timeout - Max wait for the price to render
   * @returns {Promise<number>}
   */
  async getCheckoutSummaryAmount(selector, label, timeout = 20000) {
    if (!selector || typeof selector !== 'string') {
      throw new Error(
        `[CheckoutPage.getCheckoutSummaryAmount] "selector" must be a non-empty string, got: ${typeof selector} (${selector})`
      );
    }
    if (!label || typeof label !== 'string') {
      throw new Error(
        `[CheckoutPage.getCheckoutSummaryAmount] "label" must be a non-empty string, got: ${typeof label} (${label})`
      );
    }

    const price = this.page.locator(selector).first();
    let text;
    try {
      await price.waitFor({ state: 'visible', timeout });
      text = await price.innerText();
    } catch (err) {
      throw new Error(
        `[CheckoutPage.getCheckoutSummaryAmount] The ${label} did not appear in the checkout summary within ` +
        `${timeout}ms (selector: ${selector}). The trip-summary sidebar may still be loading, or the trip does ` +
        `not contain that product. Original: ${err.message}`
      );
    }

    try {
      return parseAmountText(text, label);
    } catch (err) {
      throw new Error(
        `[CheckoutPage.getCheckoutSummaryAmount] Found the ${label} element but could not read a number from ` +
        `its text "${text}" (selector: ${selector}). Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the flight line price from the checkout summary.
   * @returns {Promise<number>}
   */
  async getCheckoutSummaryFlightAmount() {
    return this.getCheckoutSummaryAmount(SELECTORS.CHECKOUT_SUMMARY_FLIGHT_PRICE, 'flight amount');
  }

  /**
   * Reads the compensation (carbon offset) line price from the checkout summary.
   * @returns {Promise<number>}
   */
  async getCheckoutSummaryCompensationAmount() {
    return this.getCheckoutSummaryAmount(
      SELECTORS.CHECKOUT_SUMMARY_COMPENSATION_PRICE,
      'carbon offset amount',
    );
  }

  /**
   * Reads the checkout summary grand total.
   * Reuses CHECKOUT_TOTAL_PRICE, the same selector getCheckoutTotalPrice uses.
   * @returns {Promise<number>}
   */
  async getCheckoutSummaryTotalAmount() {
    return this.getCheckoutSummaryAmount(SELECTORS.CHECKOUT_TOTAL_PRICE, 'summary total amount');
  }

}

// Export CheckoutPage and SELECTORS for use in tests and DSL
module.exports = {
  CheckoutPage,
  SELECTORS,
};
