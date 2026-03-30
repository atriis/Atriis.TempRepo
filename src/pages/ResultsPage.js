const { SELECTORS: CART_SELECTORS } = require("@pages/CartPage");
const { SELECTORS: COMMON_SELECTORS } = require("@pages/CommonPage");

/**
 * Page Object for results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  RESULTS_BUTTON: ".btn.btn--primary",
  SHARE_MAIN_BUTTON: 'button.share-btn.mr-4',
  SHARE_QUOTE_RESULTS_BUTTON: '.share-btn.py-2',
  SHARE_QUOTE_EMAIL_BUTTON: 'button:has(span:text("email"))',
  FILTER_CHECKBOX_LABEL: 'label.el-checkbox',
  FILTER_CHECKBOX_INNER: '.el-checkbox__input',
  FILTER_VIEW_MORE_AIRLINES_EXPANDER: '.carriers-filter .view-more-btn',
  CONFLICT_MODAL_PROCEED: '.conflicting-quotes-dialog .btn:has-text("Proceed")'
};

class ResultsPage {
  constructor(page) {
    this.page = page;
  }

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

  /**
  * Gets the "Reset Filters" button locator.
  */
  getResetFiltersButton() {
    return this.page.getByRole('button', { name: 'Reset Filters' });
  }

  getEditButton() {
     return this.page.getByRole('button', { name: 'Edit' });
  }

  /** 
   * Waits until the first "Select" button is visible
   * Extended timeout for CI/CD environments where results load slower
   */
  async waitForSelectText() {
    await this.getSelectButton().waitFor({ state: "visible", timeout: 60000 });
  }

  /** 
   * Waits until the first "Add to trip" button is visible
   * Extended timeout for CI/CD environments where results load slower
   */
  async waitForAddToTripText() {
    await this.getAddToTripButton().waitFor({ state: "visible", timeout: 60000 });
  }

  /** Scrolls to the first "Add to trip" button, waiting for it to appear first */
  async scrollToFirstAddToTripButton() {
    const button = this.getAddToTripButton();
    await button.waitFor({ state: "visible", timeout: 60000 });
    await button.scrollIntoViewIfNeeded();
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
    await button.click({ timeout: 60000 }); // Waits automatically for actionable state
  }

  /**
   * Handles the "Conflicting Quotes" modal if it appears.
   * Races between the conflict modal and the cart page loading.
   * If neither appears within timeout, returns false (e.g., parallel search navigated elsewhere).
   *
   * Returns:
   * - true  → modal was shown and handled
   * - false → modal did not appear
   */
  async handleConflictQuoteModalIfVisible() {
    const proceedButton = this.page
      .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
      .first();
    const tripOverviewTitle = this.page
      .locator(CART_SELECTORS.TRIP_OVERVIEW_TITLE);

    // Race: wait for either the conflict modal's Proceed button or the cart page.
    // Each promise has its own .catch so the losing/orphaned promise never
    // becomes an unhandled rejection (e.g. when the page closes mid-wait).
    const modalPromise = proceedButton
      .waitFor({ state: "visible", timeout: 90000 })
      .then(() => "modal")
      .catch(() => null);
    const cartPromise = tripOverviewTitle
      .waitFor({ state: "visible", timeout: 90000 })
      .then(() => "cart")
      .catch(() => null);

    const result = await Promise.race([modalPromise, cartPromise]);

    if (!result || result === "cart") {
      return false;
    }

    await proceedButton.click();

    // Confirm navigation to Trip Overview (not present in parallel hotel flows — that's fine)
    try {
      await tripOverviewTitle.waitFor({ state: "visible", timeout: 60000 });
    } catch {
      // Parallel hotel flow navigates to hotel results instead of cart — not an error
    }

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

  /**
   * Clicks a filter checkbox identified by its label text.
   * @param {string} option - The label text of the checkbox to click (e.g. 'Refundable')
   */
  async filterByCheckboxOption(option) {
    if (typeof option !== 'string' || !option.trim()) {
      throw new Error(`option must be a non-empty string, got: ${typeof option}`);
    }
    const checkbox = this.page
      .locator(SELECTORS.FILTER_CHECKBOX_LABEL, { has: this.page.locator(`p:text-is('${option}')`) })
      .locator(SELECTORS.FILTER_CHECKBOX_INNER)
      .first();
    await checkbox.waitFor({ state: 'visible' });
    await checkbox.click();
  }

  async clickEditButton() {
     await this.getEditButton().waitFor({ state: 'visible' }); 
     await this.getEditButton().click();
 }

 async clickViewMoreAirlinesExpanderIfVisible() {
    const expander = this.page.locator(SELECTORS.FILTER_VIEW_MORE_AIRLINES_EXPANDER);
    const isVisible = await expander.isVisible();
    if (isVisible) {
      await expander.click();
    }
 }

} 
module.exports = {
  ResultsPage,
  SELECTORS,
};
