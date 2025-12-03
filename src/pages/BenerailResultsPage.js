const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  selectOrAddToTripButton: '.btn.btn--primary'
};

class BenerailResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Select" button to appear and become ready for interaction
  // Includes additional timeout to ensure stable element state
  async waitForSelectText() {
    console.log('Waiting for Select button text to appear...');
    await waitForText(this.page, SELECTORS.selectOrAddToTripButton, 'Select');
    await this.page.waitForTimeout(4000); // Extra wait for stability
    console.log('Select button text appeared successfully');
  }

  // Clicks the "Select" button for the first Benerail option in the search results
  // Selects the first available Benerail option and adds it to the current trip
  async clickSelectFirstBenerailOption() {
    console.log('Clicking Select button for first Benerail option...');
    await this.page.locator(SELECTORS.selectOrAddToTripButton).first().click();
    console.log('First Benerail option selected successfully');
  }

  // Waits for the "Add to trip" button to appear and become ready for interaction
  // Includes additional timeout to ensure stable element state
  async waitForAddToTripText() {
    console.log('Waiting for Add to trip button text to appear...');
    await waitForText(this.page, SELECTORS.selectOrAddToTripButton, 'Add to trip');
    await this.page.waitForTimeout(4000); // Extra wait for stability
    console.log('Add to trip button text appeared successfully');
  }

  // Clicks the "Add to trip" button for the first Benerail option in the search results
  // Selects the first available Benerail option and adds it to the current trip
  async clickAddToTripButton() {
    console.log('Clicking Benerail Add to trip button...');
    await this.page.locator(SELECTORS.selectOrAddToTripButton).first().click();
    console.log('First Benerail option added to trip successfully');
  }
}

module.exports = BenerailResultsPage;