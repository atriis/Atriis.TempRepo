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
  BOOKING_ERROR_DIALOG: ".booking-error-dialog",
  BACK_TO_TRIP_BUTTON: ".back-to-trip-btn",
  EMAIL_INPUT: ".email-input .el-input__inner",

  // Contact details (reference-form-contact-details.vue)
  CONTACT_DETAILS_CHECKBOX: ".contact-details-container .el-checkbox__inner",
  CONTACT_PHONE_COUNTRY_CODE: ".reference-form-contact-details .el-input:nth-of-type(1) .el-input__inner",
  CONTACT_PHONE_AREA_CODE: ".reference-form-contact-details .el-input:nth-of-type(2) .el-input__inner",
  CONTACT_PHONE_NUMBER: ".reference-form-contact-details .el-input:nth-of-type(3) .el-input__inner",
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
   * Gets the email input value on the checkout page.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<string>} The email input value
   */
  async getEmailInputValue(timeout = 10000) {
    const input = this.page.locator(SELECTORS.EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    return input.inputValue();
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
}

// Export CheckoutPage and SELECTORS for use in tests and DSL
module.exports = {
  CheckoutPage,
  SELECTORS,
};
