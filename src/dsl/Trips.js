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
   * - "Found trips" text is visible
   * - "Trip Status" filter section is visible
   */
  async navigateToTripsPage(page) {
    const menuPage = new MenuPage(page);
    const tripsPage = new TripsPage(page);

    // User action: open Trips via the top menu
    await menuPage.clickTrips();

    // Page is considered loaded when these key elements are visible
    await tripsPage.waitForFoundTripsText();
    await tripsPage.waitForTripStatusFilter();

    return { navigated: true };
  },
};

module.exports = Trips;
