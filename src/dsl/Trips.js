const MenuPage = require("@pages/MenuPage");
const TripsPage = require("@pages/TripsPage");

/**
 * Trips DSL
 *
 * High-level actions related to the Trips section.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Trips = {
  /**
   * Navigates to the Trips page from anywhere in the app.
   *
   * Confirmation strategy:
   * - Click trips link
   * - Wait for trips page content to load
   */
  async navigateToTripsPage(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const menuPage = new MenuPage(page);
    const tripsPage = new TripsPage(page);

    // Click the trips link
    await menuPage.clickTrips();

    // Wait for page content to settle
    await page.waitForLoadState("domcontentloaded");

    // Page is considered loaded when the filter section is visible
    await tripsPage.waitForTripStatusFilter();

    return { navigated: true };
  },
};

module.exports = Trips;
