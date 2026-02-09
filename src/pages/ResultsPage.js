const { SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { SELECTORS: GENERAL_SELECTORS } = require("@pages/GeneralElementsPage");

// Centralized selectors for ResultsPage only
const SELECTORS = {
  RESULTS_BUTTON: ".btn.btn--primary",
};

/**
 * ResultsPage
 *
 * Low-level UI interactions on results.
 * No logging, no business decisions.
 */
class ResultsPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the "Add to trip" button locator.
   * @returns {Locator} Playwright locator for the first "Add to trip" button
   */
  getAddToTripButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Add to trip")`)
      .first();
  }

  /**
   * Gets the "Select" button locator.
   * @returns {Locator} Playwright locator for the first "Select" button
   */
  getSelectButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Select")`)
      .first();
  }

  // ===== UI INTERACTIONS =====

  /** Waits until the first "Select" button is visible */
  async waitForSelectText() {
    await this.getSelectButton().waitFor({ state: "visible" });
  }

  /** Waits until the first "Add to trip" button is visible */
  async waitForAddToTripText() {
    await this.getAddToTripButton().waitFor({ state: "visible" });
  }

  /** Scrolls to the first "Add to trip" button */
  async scrollToFirstAddToTripButton() {
    await this.getAddToTripButton().scrollIntoViewIfNeeded();
  }

  /** Clicks the first available "Add to trip" button */
  async clickFirstAddToTripButton() {
    await this.getAddToTripButton().click();
  }

  /** Clicks the first available "Select" button */
  async clickFirstSelectButton() {
    await this.getSelectButton().click();
  }

  /**
   * Handles the "Conflicting Quotes" modal if it appears.
   *
   * Returns:
   * - true  → modal was shown and handled
   * - false → modal did not appear
   */
  async handleConflictQuoteModalIfVisible() {
    const proceedButton = this.page
      .locator(GENERAL_SELECTORS.PROCEED_BUTTON)
      .first();

    try {
      await proceedButton.waitFor({ state: "visible" });
    } catch {
      return false;
    }

    await proceedButton.click();

    // Confirm navigation to Trip Overview
    await this.page
      .locator(CART_SELECTORS.TRIP_OVERVIEW_TITLE)
      .waitFor({ state: "visible" });

    return true;
  }
}

module.exports = {
  ResultsPage,
  SELECTORS,
};
