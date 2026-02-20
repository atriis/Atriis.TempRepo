/**
 * Page Object for trips page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // "Found X Trips" summary block
  FOUND_TRIPS_TEXT:
    "div.is-flex.is-align-items-center.is-flex-gap-1",

  // "Trip Status" title in the filter panel
  TRIP_STATUS_FILTER_ICON:
    "h4.filter-title.is-size-6:has-text(\"Trip Status\")",
};

class TripsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits until the page shows a "Found trips" indicator.
   *
   * This confirms that the trips results have finished loading
   * and the results state is visible to the user.
   * The method relies on a real UI signal instead of a fixed delay.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async waitForFoundTripsText({ timeout = 30000 } = {}) {
    const foundText = this.page
      .locator(SELECTORS.FOUND_TRIPS_TEXT)
      .filter({ hasText: /Found/i })
      .first();

    // Wait until the "Found" indicator becomes visible
    await foundText.waitFor({ state: "visible", timeout });
  }

  /**
   * Waits until the "Trip Status" filter section is visible.
   *
   * This confirms that the filters panel has finished loading
   * and the "Trip Status" filter is ready for interaction.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async waitForTripStatusFilter({ timeout = 30000 } = {}) {
    await this.page
      .locator(SELECTORS.TRIP_STATUS_FILTER_ICON)
      .waitFor({ state: "visible", timeout });
  }
}

module.exports = TripsPage;
