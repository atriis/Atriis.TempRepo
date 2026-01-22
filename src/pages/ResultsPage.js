// Centralized selectors for easy maintenance
const SELECTORS = {
  RESULTS_BUTTON: '.btn.btn--primary',
  PROCEED_BUTTON: "button:has-text('Proceed')",
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

  /** Waits until the "Select" button is visible */
  async waitForSelectText() {
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Select")`)
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });

    // Extra wait kept for UI stability
    await this.page.waitForTimeout(4000);
  }

  /** Waits until the "Add to trip" button is visible */
  async waitForAddToTripText() {
    // Wait for button with "Add to trip" text with extended timeout
    const addToTripButton = this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Add to trip")`)
      .first();

    await addToTripButton.waitFor({ state: 'visible', timeout: 60000 });
  }

  /** Scrolls to the first "Add to trip" button */
  async scrollToFirstAddToTripButton() {
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Add to trip")`)
      .first()
      .scrollIntoViewIfNeeded();
  }

  /** Clicks the first available "Add to trip" button */
  async clickFirstAddToTripButton() {
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Add to trip")`)
      .first()
      .click();
  }

  /** Clicks the first available "Select" button */
  async clickFirstSelectButton() {
    await this.page
      .locator(`${SELECTORS.RESULTS_BUTTON}:has-text("Select")`)
      .first()
      .click();
  }

   /**
   * Handles the "Conflicting Quotes" modal if it appears.
   *
   * Returns:
   * - true  → modal was shown and handled
   * - false → modal did not appear
   */
  async handleConflictQuoteModalIfVisible() {
    const proceedButton = this.page.locator(SELECTORS.PROCEED_BUTTON).first();

    try {
      // Short wait: if not visible, assume modal did not appear
      await proceedButton.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      return false;
    }

    await proceedButton.click();

    // Extra wait kept for UI stability
    await this.page.waitForTimeout(1000);
    return true;
  }
}

module.exports = {
  ResultsPage,
  SELECTORS
};