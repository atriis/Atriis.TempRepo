const { SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { SELECTORS: GENERAL_SELECTORS } = require("@pages/GeneralElementsPage");

// Centralized selectors for ResultsPage only
const SELECTORS = {
  RESULTS_BUTTON: ".btn.btn--primary",
  SHARE_MAIN_BUTTON: 'button.share-btn.mr-4',
  SHARE_QUOTE_RESULTS_BUTTON: '.share-btn.py-2',
  SHARE_QUOTE_EMAIL_BUTTON: 'button:has(span:text("email"))'
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
    const button = this.getAddToTripButton();
    // Wait for button to be enabled (flight data loaded)
    await button.waitFor({ state: "attached", timeout: 45000 });
    await button.click({ timeout: 60000 });
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

  /**
   * Waits for the main Share button to be visible.
   * Used before clicking the share button to ensure it's ready.
   */
  async waitForShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).waitFor({ state: "visible" });
  }

  /**
   * Clicks the main Share button in results.
   * Opens the share options interface.
   */
  async clickShareMainButton() {
    await this.page.locator(SELECTORS.SHARE_MAIN_BUTTON).click();
  }

  /**
   * Clicks the email share button to open the share quote email dialog.
   * 
   * Note: Includes a stabilization wait and force click to handle cases
   * where the button may be temporarily disabled after closing pricing options.
   */
  async clickShareQuoteToGetEmailPopUp() {
    // Wait a bit for the button to potentially re-enable after closing pricing options
    await this.page.waitForTimeout(1000);
    
    // Click with force if button is disabled but clickable
    await this.page.locator(SELECTORS.SHARE_QUOTE_EMAIL_BUTTON).click({ force: true });
  }

  /**
   * Extracts the displayed price amount from the results page.
   * 
   * @param {number} index - Zero-based index of the amount element (default: 0)
   * @returns {Promise<number|null>} The price value or null if not found
   * @example
   *   getAmountPriceValueResults(0)  → first price
   *   getAmountPriceValueResults(1)  → second price
   */
  async getAmountPriceValueResults(index = 0) {
    const { CommonPage } = require("@pages/CommonPage");
    const commonPage = new CommonPage(this.page);
    return commonPage.getAmountPriceValue(index);
  }

  getEditButton() {
  return this.page.getByRole('button', { name: 'Edit' });
  }

  async clickEditButton() {
  await this.getEditButton().waitFor({ state: 'visible' }); 
  await this.getEditButton().click();
 }

} 
module.exports = {
  ResultsPage,
  SELECTORS,
};
