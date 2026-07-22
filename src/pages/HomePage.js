/**
 * Page Object for the application homepage.
 * Contains only UI-level interactions with homepage widgets
 * (e.g. the upcoming-trips monitor panel).
 */

const SELECTORS = {
  // "All trips" button on the homepage upcoming-trips panel.
  // Mobile layout carries a stable data-testid; desktop renders the same
  // app-btn with no testid, so we fall back to the visible button text.
  // :visible on each branch avoids the hidden responsive-layout duplicate.
  ALL_TRIPS_BUTTON:
    '[data-testid="trip.home.all-trips-btn"]:visible, button.btn:has-text("All trips"):visible',
};

class HomePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "All trips" button on the homepage upcoming-trips panel,
   * which navigates the booker to the full Trips page.
   */
  async clickAllTripsButton() {
    const button = this.page.locator(SELECTORS.ALL_TRIPS_BUTTON).first();
    try {
      await button.waitFor({ state: "visible", timeout: 15000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[HomePage.clickAllTripsButton] Could not click the "All trips" button on the homepage upcoming-trips panel (${SELECTORS.ALL_TRIPS_BUTTON}). The panel may not have rendered or the account lacks an upcoming-trips widget. Original: ${err.message}`
      );
    }
  }
}

module.exports = HomePage;
