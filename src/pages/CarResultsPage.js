const { waitForText } = require('../utils/wait');

/**
 * Page Object for car search results.
 * Handles only UI interactions on the results screen.
 */
const SELECTORS = {
  ADD_TO_TRIP_BUTTON: 'button.btn.btn--primary.add-btn',
  SELECT_BUTTON: '.btn--primary'
};

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits until car results are ready.
   * "Add to trip" indicates results are fully loaded.
   */
  async waitForCarAddToTripText() {
    await this.page.waitForSelector(SELECTORS.ADD_TO_TRIP_BUTTON, {
      state: 'visible',
      timeout: 30000
    });

    await waitForText(
      this.page,
      SELECTORS.ADD_TO_TRIP_BUTTON,
      'Add to trip'
    );

    // Intentional extra wait for UI stability
    await this.page.waitForTimeout(4000);
  }

  /** Adds the first available car to the trip */
  async clickCarAddToTripButton() {
    const button = this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).first();
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  /** Waits for "Select" button (city-center flow) */
  async waitForSelectText() {
    await waitForText(this.page, SELECTORS.SELECT_BUTTON, 'Select');
  }

  /** Confirms selection in city-center flow */
  async clickSelectButton() {
    await this.page.click(SELECTORS.SELECT_BUTTON);
  }
}

module.exports = CarResultsPage;