const { waitForText } = require('@utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  BOOK_NEW_TRIP_ICON: '.top-container > :nth-child(4) .material-symbols-outlined',
  LOGOUT_ICON: '.logout-icon',
  TRIPS_ICON: 'a[href="/trips"]'
};

/**
 * MenuPage
 *
 * Represents the top menu / header actions like:
 * - Book a new trip
 * - Logout
 * - Go to Trips
 *
 * Note: You mentioned moving logout methods to HeaderPage later.
 * That is fine as a future refactor when header grows.
 */
class MenuPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the "Book a New Trip" icon to appear.
   * Extra timeout is kept as-is for stability.
   */
  async waitForBookANewTripIcon() {
    await this.page.waitForTimeout(3000);
    await this.page.locator(SELECTORS.BOOK_NEW_TRIP_ICON).waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Clicks "Book a New Trip" (this opens a new tab) */
  async clickBookANewTrip() {
    await this.page.click(SELECTORS.BOOK_NEW_TRIP_ICON);
  }

  /**
   * Waits for the logout icon to be visible.
   * Used as confirmation that the user is logged in.
   */
  async waitForLogoutIcon() {
    await waitForText(this.page, SELECTORS.LOGOUT_ICON, 'logout');
  }

  /** Clicks logout icon */
  async clickLogout() {
    await this.page.click(SELECTORS.LOGOUT_ICON);
  }

  /** Opens the Trips page */
  async clickTrips() {
    await this.page.click(SELECTORS.TRIPS_ICON);
  }
}

module.exports = MenuPage;