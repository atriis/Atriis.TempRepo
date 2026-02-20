const { waitForText } = require("@utils/wait");

/**
 * Page Object for menu page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  BOOK_NEW_TRIP_ICON: ".top-container > :nth-child(4) .material-symbols-outlined",
  LOGOUT_ICON: ".logout-icon",
  TRIPS_ICON: "a[href=\"/trips\"]",
};

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Book a New Trip" icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getBookANewTripIcon() {
    return this.page.locator(SELECTORS.BOOK_NEW_TRIP_ICON);
  }

  /**
   * Gets the logout icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getLogoutIcon() {
    return this.page.locator(SELECTORS.LOGOUT_ICON);
  }

  /**
   * Gets the Trips navigation link element.
   * @returns {import('@playwright/test').Locator}
   */
  getTripsLink() {
    return this.page.locator(SELECTORS.TRIPS_ICON);
  }

  /**
   * Waits for the "Book a New Trip" icon to appear.
   * Extra timeout is kept as-is for stability.
   */
  async waitForBookANewTripIcon() {
    await this.getBookANewTripIcon().waitFor({ state: "visible" });
  }

  /** Clicks "Book a New Trip" (this opens a new tab) */
  async clickBookANewTrip() {
    await this.getBookANewTripIcon().click();
  }

  /**
   * Waits for the logout icon to be visible.
   * Used as confirmation that the user is logged in.
   */
  async waitForLogoutIcon() {
    await waitForText(this.page, SELECTORS.LOGOUT_ICON, "logout");
  }

  /** Clicks logout icon */
  async clickLogout() {
    await this.getLogoutIcon().click();
  }

  /** Opens the Trips page */
  async clickTrips() {
    const tripsLink = this.getTripsLink();
    await tripsLink.waitFor({ state: "visible", timeout: 10000 });
    // Use force click to bypass any overlay issues
    await tripsLink.click({ force: true });
  }
}

module.exports = MenuPage;
