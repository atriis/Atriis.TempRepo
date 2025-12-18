const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  SELECT_OR_ADD_TO_TRIP_BUTTON: '.btn.btn--primary'
};

/**
 * BenerailResultsPage
 *
 * Low-level UI interactions on Benerail results.
 * No logging, no business decisions.
 */
class BenerailResultsPage {
  constructor(page) {
    this.page = page;
  }

  /** Waits until the "Select" button is visible */
  async waitForSelectText() {
    await waitForText(
      this.page,
      SELECTORS.SELECT_OR_ADD_TO_TRIP_BUTTON,
      'Select'
    );

    // Extra wait kept for UI stability
    await this.page.waitForTimeout(4000);
  }

  /** Clicks the first available "Select" button */
  async clickSelectFirstBenerailOption() {
    await this.page
      .locator(SELECTORS.SELECT_OR_ADD_TO_TRIP_BUTTON)
      .first()
      .click();
  }

  /** Waits until the "Add to trip" button is visible */
  async waitForAddToTripText() {
    await waitForText(
      this.page,
      SELECTORS.SELECT_OR_ADD_TO_TRIP_BUTTON,
      'Add to trip'
    );

    // Extra wait kept for UI stability
    await this.page.waitForTimeout(4000);
  }

  /** Clicks the first available "Add to trip" button */
  async clickAddToTripButton() {
    await this.page
      .locator(SELECTORS.SELECT_OR_ADD_TO_TRIP_BUTTON)
      .first()
      .click();
  }
}

module.exports = BenerailResultsPage;