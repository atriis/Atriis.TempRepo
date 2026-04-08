const { waitForText } = require("@utils/wait");

/**
 * Page Object for checkout page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  BOOKING_DETAILS_HEADING: "h1.mb-5",
  FINALIZE_BUTTON: "button:has-text('Finalize')",
  BOOK_AND_FINALIZE_BUTTON: "button:has-text('Book and Finalize')",
  FALLBACK_BUTTON: ".btn-container button",
  GO_TO_TRIP_BUTTON: ".btn-container > :nth-child(1)",
  FUSION_VERIFICATION_TITLE: ".booking-success .success-message__title",
  FUSION_VERIFY_NOW_BUTTON: ".success-message__email span",
  FUSION_3DS_DIALOG_TITLE: ".app-dialog .el-dialog__title",
  FUSION_3DS_DIALOG_CONTAINER: ".app-dialog",
  FUSION_3DS_DIALOG_HEADER: ".el-dialog__header",
  SEND_FOR_APPROVAL_BUTTON: "button:has-text('Send for approval')",
  APPROVAL_SUCCESS_TITLE: ".pre-trip-booking-success .success-message-title",
  APPROVAL_SUCCESS_MESSAGE: ".pre-trip-booking-success .success-message-description",
  APPROVAL_SUCCESS_CONTAINER: ".pre-trip-booking-success",
  BOOKING_ERROR_DIALOG: ".booking-error-dialog",
  BACK_TO_TRIP_BUTTON: ".back-to-trip-btn",
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
    return this.page.locator(SELECTORS.GO_TO_TRIP_BUTTON);
  }

  /**
   * Confirms that the checkout page is loaded.
   * Uses visible text instead of DOM presence for reliability.
   */
  async waitForBookingDetailsText() {
    await waitForText(
      this.page,
      SELECTORS.BOOKING_DETAILS_HEADING,
      "Booking details",
      60000,
    );
  }

  /**
   * Waits until one of the finalize button variants is available.
   * Different suppliers and fares show different labels.
   */
  async waitForBookAndFinalizeButton() {
    await this.page.waitForSelector(
      `${SELECTORS.FINALIZE_BUTTON}, ${SELECTORS.BOOK_AND_FINALIZE_BUTTON}`,
      { timeout: 10000 },
    );
  }

  /**
   * Clicks the appropriate finalize button.
   * Falls back to a generic button if needed.
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
    return await this.page.locator(SELECTORS.APPROVAL_SUCCESS_MESSAGE).innerText();
  }

  /**
   * Clicks the "Go to trip" button on the approval success page.
   * Uses getByRole scoped to the container for reliable click.
   */
  async clickApprovalSuccessGoToTrip() {
    await this.page
      .locator(SELECTORS.APPROVAL_SUCCESS_CONTAINER)
      .getByRole('button', { name: 'Go to trip' })
      .click();
  }

  /**
   * Waits until the booking error dialog is visible.
   */
  async waitForBookingErrorDialog() {
    await this.page.locator(SELECTORS.BOOKING_ERROR_DIALOG).waitFor({ state: "visible", timeout: 60000 });
  }

  /**
   * Clicks the "Back to trip" button inside the booking error dialog.
   */
  async clickBackToTripButton() {
    await this.page.locator(SELECTORS.BACK_TO_TRIP_BUTTON).click();
  }

  /**
   * Navigates to the Trip Overview after booking completion.
   */
  async clickGoToTrip() {
    await waitForText(
      this.page,
      SELECTORS.GO_TO_TRIP_BUTTON,
      "Go to trip",
      60000,
    );

    await this.getGoToTripButton().click();
  }

  /**
   * Completes the Fusion 3DS verification screen shown after booking low-cost flights.
   * Mirrors the legacy Testim flow for this provider-specific confirmation path:
   * wait for the verification screen, click Verify now, wait for the provider flow,
   * click the dialog header, then wait for Go to trip.
   *
   * @param {number} timeout
   */
  async completeFusionCardVerification(timeout = 90000) {
    await waitForText(
      this.page,
      SELECTORS.FUSION_VERIFICATION_TITLE,
      'Card verification needed!',
      timeout,
    );

    const verifyNowButton = this.page.locator(SELECTORS.FUSION_VERIFY_NOW_BUTTON).first();
    await verifyNowButton.waitFor({ state: 'visible', timeout: 30000 });
    await verifyNowButton.click();

    await this.page.waitForTimeout(18000);

    const dialogHeader = this.page.locator(SELECTORS.FUSION_3DS_DIALOG_HEADER).first();
    if (await dialogHeader.isVisible().catch(() => false)) {
      await dialogHeader.click().catch(() => {});
    }

    await this.getGoToTripButton().waitFor({ state: 'visible', timeout });
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
}

// Export CheckoutPage and SELECTORS for use in tests and DSL
module.exports = {
  CheckoutPage,
  SELECTORS,
};
