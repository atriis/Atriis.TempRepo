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
   * This confirms the list of trips has been loaded.
   */
  async waitForFoundTripsText() {
    // Small wait kept to match current UI behavior
    await this.page.waitForTimeout(2000);

    // We only care that "Found" is visible, not the exact number
    await this.page
      .locator('text=Found')
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Waits until the "Trip Status" filter section is visible.
   * Confirms filters are loaded and usable.
   */
  async waitForTripStatusFilter() {
    await this.page
      .locator(SELECTORS.TRIP_STATUS_FILTER_ICON)
      .waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = TripsPage;