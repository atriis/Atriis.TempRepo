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
    await this.page.waitForTimeout(4000);
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first()
      .scrollIntoViewIfNeeded();
  }

  /** Waits until the "View rates" button is visible */
  async waitForViewRatesText() {
    // Scroll to the button first to ensure it's in view
    await this.page.waitForTimeout(500);
    await this.scrollToFirstViewRatesButton();

    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });

    // Extra wait kept for UI stability
    await this.page.waitForTimeout(4000);
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