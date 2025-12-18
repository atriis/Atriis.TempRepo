const { waitForText } = require('../utils/wait');

/**
 * Selectors for Checkout page.
 * Button variants exist depending on booking type and supplier.
 */
const SELECTORS = {
  BOOKING_DETAILS_HEADING: 'h1.mb-5',
  FINALIZE_BUTTON: "button:has-text('Finalize')",
  BOOK_AND_FINALIZE_BUTTON: "button:has-text('Book and Finalize')",
  FALLBACK_BUTTON: '.btn-container button',
  GO_TO_TRIP_BUTTON: '.btn-container > :nth-child(1)'
};

/**
 * CheckoutPage
 *
 * Handles low-level UI interactions on the checkout screen.
 * Contains no business logic.
 */
class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Confirms that the checkout page is loaded.
   * Uses visible text instead of DOM presence for reliability.
   */
  async waitForBookingDetailsText() {
    await waitForText(
      this.page,
      SELECTORS.BOOKING_DETAILS_HEADING,
      'Booking details'
    );
  }

  /**
   * Waits until one of the finalize button variants is available.
   * Different suppliers and fares show different labels.
   */
  async waitForBookAndFinalizeButton() {
    await this.page.waitForSelector(
      `${SELECTORS.FINALIZE_BUTTON}, ${SELECTORS.BOOK_AND_FINALIZE_BUTTON}`,
      { timeout: 10000 }
    );
  }

  /**
   * Clicks the appropriate finalize button.
   * Falls back to a generic button if needed.
   */
  async clickBookAndFinalizeButton() {
    const finalizeBtn = this.page
      .locator(SELECTORS.FINALIZE_BUTTON)
      .first();

    const bookFinalizeBtn = this.page
      .locator(SELECTORS.BOOK_AND_FINALIZE_BUTTON)
      .first();

    if (await finalizeBtn.isVisible()) {
      await finalizeBtn.click();
      return;
    }

    if (await bookFinalizeBtn.isVisible()) {
      await bookFinalizeBtn.click();
      return;
    }

    // Fallback for unexpected UI variations
    await this.page.click(SELECTORS.FALLBACK_BUTTON);
  }

  /**
   * Navigates to the Trip Overview after booking completion.
   */
  async clickGoToTrip() {
    await waitForText(
      this.page,
      SELECTORS.GO_TO_TRIP_BUTTON,
      'Go to trip'
    );
    await this.page.click(SELECTORS.GO_TO_TRIP_BUTTON);
  }
}

module.exports = CheckoutPage;