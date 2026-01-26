// Centralized selectors for easy maintenance
const SELECTORS = {
  // "Found X Trips" summary block
  FOUND_TRIPS_TEXT:
    'div.is-flex.is-align-items-center.is-flex-gap-1',

  // "Trip Status" title in the filter panel
  TRIP_STATUS_FILTER_ICON:
    'h4.filter-title.is-size-6:has-text("Trip Status")'
};

/**
 * TripsPage
 *
 * Low-level UI interactions on the Trips page.
 * This class is intentionally quiet:
 * - no logging
 * - no business decisions
 * - only waits and checks
 */


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
   */
  async waitForFoundTripsText() {
    const foundText = this.page
      .locator('text=Found')
      .first();

    // Wait until the "Found" indicator becomes visible
    await foundText.waitFor({ state: 'visible' });
  }

  /**
   * Waits until the "Trip Status" filter section is visible.
   *
   * This confirms that the filters panel has finished loading
   * and the "Trip Status" filter is ready for interaction.
   * Relies on a real UI signal instead of a fixed or custom timeout.
   */
  async waitForTripStatusFilter() {
    await this.page
      .locator(SELECTORS.TRIP_STATUS_FILTER_ICON)
      .waitFor({ state: 'visible' });
  }
}

module.exports = TripsPage;