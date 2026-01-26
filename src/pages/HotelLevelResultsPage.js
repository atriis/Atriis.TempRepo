const { SELECTORS: RESULTS_SELECTORS } = require('@pages/ResultsPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  RESULTS_BUTTON: RESULTS_SELECTORS.RESULTS_BUTTON,
};

/**
 * HotelLevelResultsPage
 *
 * Low-level UI interactions on hotel-level results.
 * No logging, no business decisions.
 */

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  /** Scrolls to the first "View rates" button */
  async scrollToFirstViewRatesButton() {
    const viewRatesButton = this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first();

    // Ensure the button exists before trying to scroll to it
    await viewRatesButton.waitFor({ state: 'attached' });

    await viewRatesButton.scrollIntoViewIfNeeded();
  }

  /** Waits until the first "View rates" button is visible */
  async waitForViewRatesText() {
    const viewRatesButton = this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first();

    // Ensure the button exists, then scroll it into view
    await viewRatesButton.waitFor({ state: 'attached' });
    await viewRatesButton.scrollIntoViewIfNeeded();

    // Confirm it is visible and ready for interaction
    await viewRatesButton.waitFor({ state: 'visible' });
  }

  /** Clicks the first available "View rates" button */
  async clickFirstViewRatesButton() {
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first()
      .click();
  }
}

module.exports = HotelLevelResultsPage;