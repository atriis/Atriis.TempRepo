/**
 * Selectors for GeneralElementsPage.
 */
const SELECTORS = {
  PROCEED_BUTTON: "button:has-text('Proceed')",
};

/**
 * GeneralElementsPage
 *
 * Handles common UI elements that appear across multiple pages.
 * Low-level UI interactions only—no business logic.
 */
class GeneralElementsPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the Success notification locator.
   * TODO: duplicated — consolidate with other success notification locators.
   *
   * @returns {Locator} Playwright locator for the Success notification.
   */
  getSuccessNotification() {
    return this.page.getByText("Success", { exact: true });
  }


  /**
   * Waits for the Proceed button to be visible.
   */
  async waitForProceedButton() {
    await this.page.locator(SELECTORS.PROCEED_BUTTON).waitFor({ state: "visible" });
  }

  /**
   * Clicks the Proceed button.
   */
  async clickProceedButton() {
    await this.page.locator(SELECTORS.PROCEED_BUTTON).click();
  }

  /**
   * Waits for the success notification to appear.
   */
  async waitForSuccessNotification() {
    await this.getSuccessNotification().waitFor({ state: "visible" });
  }
}

// Export GeneralElementsPage and SELECTORS for use in tests and DSL
module.exports = {
  GeneralElementsPage,
  SELECTORS,
};
