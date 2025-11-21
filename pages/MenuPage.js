const { waitForText } = require('../utils/wait');

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for "Book a New Trip" icon
  async waitForBookANewTripIcon() {
    console.log('Waiting for "Book a New Trip" icon...');
    await this.page.waitForTimeout(2000);
    await this.page.waitForTimeout(1000);
  }

  // Click "Book a New Trip"
  async clickBookANewTrip() {
    console.log('Click "Book a New Trip"');
    await this.page.click('.top-container > :nth-child(4) .material-symbols-outlined');
  }

  // Wait for logout icon text
  async waitForLogoutIcon() {
    console.log('Waiting for logout icon...');
    await waitForText(this.page, '.logout-icon', 'logout');
    console.log('Logout icon visible');
  }
}

module.exports = MenuPage;
