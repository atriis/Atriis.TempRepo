/**
 * Page Object for trips page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // "Trip Status" title in the filter panel
  TRIP_STATUS_FILTER_ICON:
    "h4.filter-title.is-size-6:has-text(\"Trip Status\")",

  // In-travel trips tab button (el-tab-pane name="intravel-trips")
  IN_TRAVEL_TAB:
    ".el-tabs__item[id*='tab-intravel-trips'], [aria-controls*='pane-intravel-trips']",

  FIRST_TRIP_USER_GROUP_CONTAINER:
    '.trip-preview:first-of-type .booker-consultant-container',
};

class TripsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits until the trips page main content is visible.
   *
   * Uses the `.my-trips` top-level section as the page-ready signal — it
   * is always present on desktop and mobile regardless of filter state.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async waitForTripStatusFilter({ timeout = 30000 } = {}) {
    await this.page
      .locator(".my-trips")
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Clicks the "In-travel" tab to switch the trip list to in-travel trips.
   *
   * The tab is rendered by Element Plus as an .el-tabs__item whose id contains
   * "tab-intravel-trips" (from the el-tab-pane name="intravel-trips" attribute).
   */
  async clickInTravelTab() {
    const tab = this.page.locator(SELECTORS.IN_TRAVEL_TAB).first();
    try {
      await tab.waitFor({ state: "visible", timeout: 10000 });
      await tab.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.clickInTravelTab] Could not click the in-travel trips tab (${SELECTORS.IN_TRAVEL_TAB}). The tab may not be rendered yet or the trips page has not fully loaded. Original: ${err.message}`
      );
    }
  }

  async getFirstTripUserGroupContainer() {
    const container = this.page.locator(SELECTORS.FIRST_TRIP_USER_GROUP_CONTAINER).first();
    try {
      await container.waitFor({ state: 'attached', timeout: 10000 });
      return container;
    } catch (err) {
      throw new Error(
        `[TripsPage.getFirstTripUserGroupContainer] Could not find the user group container (${SELECTORS.FIRST_TRIP_USER_GROUP_CONTAINER}) on the first trip. The trip may have no UserGroupName or the active trips tab was not switched. Original: ${err.message}`
      );
    }
  }
}

module.exports = TripsPage;
