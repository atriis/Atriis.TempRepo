const { SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { SELECTORS: GENERAL_SELECTORS } = require("@pages/GeneralElementsPage");

// Centralized selectors for ResultsPage only
const SELECTORS = {
  RESULTS_BUTTON: ".btn.btn--primary",
  SHARE_MAIN_BUTTON: 'button.share-btn.mr-4',
  SHARE_QUOTE_RESULTS_BUTTON: '.share-btn.py-2',
  SHARE_QUOTE_EMAIL_BUTTON: 'button:has(span:text("email"))',
  AMOUNT_VALUE: ".amount"
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

  /**
   * Gets the "Share" button locator.
   * @returns {Locator} Playwright locator for the first "Share" button
   */
  getShareButton() {
    return this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Share")`)
      .first();
  }

  // ===== UI INTERACTIONS =====

  /** Waits until the first "Select" button is visible */
  async waitForSelectText() {
    await this.getSelectButton().waitFor({ state: "visible" });
  }

  /** Waits until the first "Add to trip" button is visible */
  async waitForAddToTripText() {
    await this.getAddToTripButton().waitFor({ state: "visible", timeout: 45000 });
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
 * Clicks a "Share" button by position.
 * Defaults to the first available Share button.
 *
 * @param {number} index - Zero-based index of the Share button (default: 0)
 * @example
 *   clickShareButton()    // first Share button
 *   clickShareButton(1)   // second Share button
 *   clickShareButton(2)   // third Share button
 */
  async clickShareQuoteButton(index = 0) {
    const button = this.page
      .locator(SELECTORS.SHARE_QUOTE_RESULTS_BUTTON)
      .nth(index);
    await button.click({ timeout: 30000 }); // Waits automatically for actionable state
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

  // Share Quote button interactions in results page
  async waitForShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).waitFor({ state: "visible" });
  }

  async clickShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).click();
  }

  async clickShareQuoteToGetEmailPopUp() {
    await this.page.locator(SELECTORS.SHARE_QUOTE_EMAIL_BUTTON).click();
  }

  /**
 * Extracts the displayed amount from the UI and returns it as a number.
 * Defaults to the first amount found.
 *
 * @param {number} index - Zero-based index of the amount element (default: 0)
 * @example
 *   getAmountPriceValue()      → first price
 *   getAmountPriceValue(1)     → second price
 *   getAmountPriceValue(9)     → tenth price
 */
 async getAmountPriceValue(index = 0) {
  const rawText = await this.page
    .locator(SELECTORS.AMOUNT_VALUE)
    .nth(index)
    .textContent();

  if (!rawText) return null;

  return Number(rawText.replace(/[^0-9.]/g, ''));
}

} 
module.exports = {
  ResultsPage,
  SELECTORS,
};
