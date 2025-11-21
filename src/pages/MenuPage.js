const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  bookNewTripIcon: '.top-container > :nth-child(4) .material-symbols-outlined',
  logoutIcon: '.logout-icon'
};

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Book a New Trip" icon to appear
  // Includes extra timeout for stability before interaction
  async waitForBookANewTripIcon() {
    console.log('Waiting for "Book a New Trip" icon...');
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(1000);
  }

  // Clicks the "Book a New Trip" icon to start a new booking flow
  async clickBookANewTrip() {
    console.log('Click "Book a New Trip"');
    await this.page.click(SELECTORS.bookNewTripIcon);
  }

  // Waits for the logout icon text to appear
  // Confirms that the logout option is visible and ready for interaction
  async waitForLogoutIcon() {
    console.log('Waiting for logout icon...');
    await waitForText(this.page, SELECTORS.logoutIcon, 'logout');
    console.log('Logout icon visible');
  }
}

module.exports = MenuPage;