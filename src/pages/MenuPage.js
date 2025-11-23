const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  bookNewTripIcon: '.top-container > :nth-child(4) .material-symbols-outlined',
  logoutIcon: '.logout-icon',
  tripsIcon: 'a[href="/trips"]'
};

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Book a New Trip" icon to appear
  // Includes extra timeout for stability before interaction
  async waitForBookANewTripIcon() {
    console.log('Waiting for "Book a New Trip" icon...');
    await this.page.waitForTimeout(3000);
    await this.page.locator(SELECTORS.bookNewTripIcon).waitFor({state: 'visible', timeout: 10000});
    console.log('"Book a New Trip" icon is now visible');
  }

  // Clicks the "Book a New Trip" icon to start a new booking flow
  async clickBookANewTrip() {
    console.log('Click "Book a New Trip"');
    await this.page.click(SELECTORS.bookNewTripIcon);
    console.log('Successfully clicked "Book a New Trip" icon');
  }

  // Waits for the logout icon text to appear
  // Confirms that the logout option is visible and ready for interaction
  async waitForLogoutIcon() { //Needs to me moved to HeaderPage.js
    console.log('Waiting for logout icon...');
    await waitForText(this.page, SELECTORS.logoutIcon, 'logout');
    console.log('Logout icon visible');
  }

    async clickLogout() { //Needs to me moved to HeaderPage.js
    console.log('Click Logout icon');
    await this.page.click(SELECTORS.logoutIcon);
    console.log('Successfully clicked Logout icon');
  }

  // Clicks the "Trips" icon to navigate to the trips page
  async clickTrips() {
    console.log('Click "Trips"');
    await this.page.click(SELECTORS.tripsIcon);
    console.log('Successfully clicked "Trips" icon');
  }
}

module.exports = MenuPage;