const { waitForText } = require('../utils/wait');

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for "Add to trip" button to be visible and contain correct text
  async waitForCarAddToTripText() {
    const selector = 'button.btn.btn--primary.add-btn';

    // Ensure the button exists and is visible
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout: 30000,
    });

    // Then wait for the text "Add to trip"
    await waitForText(this.page, selector, 'Add to trip');

    // Extra wait to ensure stability
    await this.page.waitForTimeout(4000);
  }

  // Click the first "Add to trip" button for car selection
  async clickCarAddToTripButton() {
    const button = this.page.locator('button.btn.btn--primary.add-btn').first();
    await button.waitFor({ state: 'visible' });
    await button.click();
  }

  // Wait for "Select" button text to appear
  async waitForSelectText() {
    await waitForText(this.page, ".btn--primary", "Select");
  }

  // Click the "Select" button to confirm car selection
  async clickSelectButton() {
    await this.page.click(".btn--primary");
  }
}

module.exports = CarResultsPage;
