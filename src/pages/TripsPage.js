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

  MY_TRIPS_ONLY_CHECKBOX:
    '.trip-monitor-filter .el-checkbox:has-text("My trips only")',

  // Clickable link on a trip card (trip-preview.vue → router-link.more-details-link)
  // that opens the trip. Its target is "_blank" for bookers/no-corp users and
  // "_self" for travelers, so opening a trip may spawn a new browser tab.
  // The trips page (my-trips.vue) keeps every el-tab-pane in the DOM and Element
  // Plus hides the inactive panes with display:none, so scope to :visible to hit
  // the first card in the ACTIVE tab rather than a hidden card in another pane.
  FIRST_TRIP_LINK:
    '.trip-preview .more-details-link:visible',

  // Overview tab header in the trip cart (trip-cart.vue → el-tab-pane name="overview").
  // Element Plus renders the tab header as <div id="tab-overview" class="el-tabs__item">.
  OVERVIEW_TAB:
    '#tab-overview',
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

  /**
   * Clicks the first trip card's details link to open the trip.
   *
   * The link is an <a> with a dynamic target ("_blank" for bookers, "_self" for
   * travelers), so the caller is responsible for detecting whether a new tab was
   * spawned. This method only performs the click.
   */
  async clickFirstTripLink() {
    const link = this.page.locator(SELECTORS.FIRST_TRIP_LINK).first();
    try {
      await link.waitFor({ state: "visible", timeout: 15000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.clickFirstTripLink] Could not click the first trip's details link (${SELECTORS.FIRST_TRIP_LINK}). The trip list may be empty or not loaded. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the trip Overview tab header locator once it is visible.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getOverviewTab({ timeout = 30000 } = {}) {
    const tab = this.page.locator(SELECTORS.OVERVIEW_TAB).first();
    try {
      await tab.waitFor({ state: "visible", timeout });
      return tab;
    } catch (err) {
      throw new Error(
        `[TripsPage.getOverviewTab] The trip Overview tab (${SELECTORS.OVERVIEW_TAB}) was not visible within ${timeout}ms. The trip cart may not have finished loading. Original: ${err.message}`
      );
    }
  }

  async getMyTripsOnlyCheckbox({ timeout = 30000 } = {}) {
    const checkbox = this.page.locator(SELECTORS.MY_TRIPS_ONLY_CHECKBOX).first();
    try {
      await checkbox.waitFor({ state: 'visible', timeout });
      return checkbox;
    } catch (err) {
      throw new Error(
        `[TripsPage.getMyTripsOnlyCheckbox] "My trips only" checkbox not found (${SELECTORS.MY_TRIPS_ONLY_CHECKBOX}) within ${timeout}ms. The trips filter panel may not be rendered or the account lacks CanViewAllCorporateTrips permission. Original: ${err.message}`
      );
    }
  }
}

module.exports = TripsPage;
