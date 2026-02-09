const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

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

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the "View rates" button locator.
   * @returns {Locator} Playwright locator for the first "View rates" button
   */
  getViewRatesButton() {
    return this.page
      .locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first();
  }

  // ===== UI INTERACTIONS =====

  /** Scrolls to the first "View rates" button */
  async scrollToFirstViewRatesButton() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists before trying to scroll to it
    await viewRatesButton.waitFor({ state: "attached" });

    await viewRatesButton.scrollIntoViewIfNeeded();
  }

  /** Waits until the first "View rates" button is visible */
  async waitForViewRatesText() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists, then scroll it into view
    await viewRatesButton.waitFor({ state: "attached" });
    await viewRatesButton.scrollIntoViewIfNeeded();

    // Confirm it is visible and ready for interaction
    await viewRatesButton.waitFor({ state: "visible" });
  }

  /** Clicks the first available "View rates" button */
  async clickFirstViewRatesButton() {
    await this.getViewRatesButton().click();
  }
}

module.exports = HotelLevelResultsPage;
