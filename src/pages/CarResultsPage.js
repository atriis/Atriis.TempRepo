const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ADD_TO_TRIP_BUTTON: 'button.btn.btn--primary.add-btn',
  SELECT_BUTTON: '.btn--primary'
};

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for "Add to trip" button to be visible and contain correct text
  async waitForCarAddToTripText() {
    await this.page.waitForSelector(SELECTORS.ADD_TO_TRIP_BUTTON, {
      state: 'visible',
      timeout: 30000
    });
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, 'Add to trip');
    await this.page.waitForTimeout(4000); // Extra wait for stability
  }

  // Click the first "Add to trip" button for car selection
  async clickCarAddToTripButton() {
    const button = this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).first();
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  // Wait for "Select" button text to appear
  async waitForSelectText() {
    await waitForText(this.page, SELECTORS.SELECT_BUTTON, 'Select');
  }

  // Click the "Select" button to confirm car selection
  async clickSelectButton() {
    await this.page.click(SELECTORS.SELECT_BUTTON);
  }
}

module.exports = CarResultsPage;