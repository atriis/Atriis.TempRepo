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
}

// Export CheckoutPage and SELECTORS for use in tests and DSL
module.exports = {
  CheckoutPage,
  SELECTORS,
};
