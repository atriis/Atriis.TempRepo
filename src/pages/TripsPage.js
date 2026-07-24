/**
 * Page Object for trips page.
 * Contains only UI-level interactions.
 */

// Builds a whitespace-tolerant, exact-match regex for a piece of visible text.
// Used so a status/trip-id lookup matches the whole label and never a superset
// (e.g. "Confirmed" must not match "Partially Confirmed"; id "3568" not "35681").
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactText = (value) => new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`);

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

  // Free-text search input in the trip-monitor filter panel
  // (trip-monitor-filter.vue → el-dropdown.search-dropdown > el-input,
  //  placeholder "Location, trip or travellers").
  SEARCH_INPUT:
    '.trip-monitor-filter .search-dropdown input[type="text"]',

  // The "Click here to expand your search" option inside the search suggestions
  // popper (search-dropdown-popper). The popper has two el-dropdown-menu__item
  // rows: the first is disabled (the "we filtered N relevant trips" hint), the
  // second — the expand action — is the only enabled one.
  SEARCH_EXPAND_ITEM:
    '.search-dropdown-popper .el-dropdown-menu__item:not(.is-disabled)',

  // "Found N trip(s)" header line inside the search-results pane. Scoped to the
  // visible node so a hidden responsive duplicate is never matched first.
  SEARCH_RESULTS_HEADER:
    '#pane-search-results .is-flex-gap-1:visible',

  // No-results block (app-no-results-filter.vue → <h3>) inside the search-results
  // pane, shown when no trip matches the active status filter.
  SEARCH_NO_RESULTS:
    '#pane-search-results .app-no-results h3',

  // Clear-all control of the status (Trip Status) checkbox group in the filter
  // panel (app-checkbox-group.vue → .clear-all-btn). Scoped to .filter-options so
  // it never matches the Clear/Search buttons in the travel-dates section, which
  // reuse the same .clear-all-btn class.
  STATUS_FILTER_CLEAR_ALL:
    '.trip-monitor-filter .filter-options .clear-all-btn',

  // A single status checkbox in the Trip Status filter group. :visible avoids a
  // hidden mobile-drawer duplicate; the caller filters it by the status label.
  STATUS_FILTER_CHECKBOX:
    '.trip-monitor-filter .filter-options .el-checkbox:visible',

  // The ticked variant of STATUS_FILTER_CHECKBOX (Element Plus adds "is-checked");
  // .is-checked is placed before :visible so the CSS parses correctly.
  STATUS_FILTER_CHECKBOX_CHECKED:
    '.trip-monitor-filter .filter-options .el-checkbox.is-checked:visible',

  // The status name inside a Trip Status checkbox (app-checkbox-group.vue label).
  STATUS_FILTER_CHECKBOX_LABEL:
    'p.filter-title',

  // Element Plus' visual checkbox box — clicking it reliably toggles the control,
  // unlike the nested content <label> which swallows text clicks.
  STATUS_FILTER_CHECKBOX_BOX:
    '.el-checkbox__inner',

  // A search-results trip's status label and id (trip-preview.vue). Scoped to the
  // search-results pane and to visible nodes so hidden responsive dupes and cards
  // in other (inactive) tab panes are never matched.
  RESULT_STATUS_LABEL:
    '#pane-search-results .trip-preview .app-label:visible',
  RESULT_TRIP_ID:
    '#pane-search-results .trip-preview .trip-id:visible',
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

  /**
   * Types a term into the trip-monitor free-text search input.
   *
   * Typing (not a raw value set) is required so the el-input @input handler fires
   * and opens the suggestions dropdown. The input is cleared first so the method
   * is safe to call more than once in a scenario.
   *
   * @param {string} term
   */
  async fillTripsSearch(term) {
    const input = this.page.locator(SELECTORS.SEARCH_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 10000 });
      await input.fill('', { timeout: 10000 });
      await input.pressSequentially(term, { delay: 20, timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.fillTripsSearch] Could not type "${term}" into the trips search input (${SELECTORS.SEARCH_INPUT}). The filter panel may not be rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the "expand your search" suggestion once it is visible.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 15000ms)
   */
  async getSearchExpandItem({ timeout = 15000 } = {}) {
    const item = this.page.locator(SELECTORS.SEARCH_EXPAND_ITEM).first();
    try {
      await item.waitFor({ state: 'visible', timeout });
      return item;
    } catch (err) {
      throw new Error(
        `[TripsPage.getSearchExpandItem] The "expand your search" option (${SELECTORS.SEARCH_EXPAND_ITEM}) was not visible within ${timeout}ms. The suggestions dropdown may not have opened — ensure the search term was typed. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "expand your search" suggestion to run the full search.
   */
  async clickSearchExpandItem() {
    const item = await this.getSearchExpandItem({ timeout: 15000 });
    try {
      await item.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.clickSearchExpandItem] Could not click the "expand your search" option (${SELECTORS.SEARCH_EXPAND_ITEM}). Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the search-results "Found N trip(s)" header once it is visible.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getSearchResultsHeader({ timeout = 30000 } = {}) {
    const header = this.page.locator(SELECTORS.SEARCH_RESULTS_HEADER).first();
    try {
      await header.waitFor({ state: 'visible', timeout });
      return header;
    } catch (err) {
      throw new Error(
        `[TripsPage.getSearchResultsHeader] The search-results header (${SELECTORS.SEARCH_RESULTS_HEADER}) was not visible within ${timeout}ms. The search may not have produced a results tab. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the search-results no-results heading once it is visible.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getSearchNoResults({ timeout = 30000 } = {}) {
    const noResults = this.page.locator(SELECTORS.SEARCH_NO_RESULTS).first();
    try {
      await noResults.waitFor({ state: 'visible', timeout });
      return noResults;
    } catch (err) {
      throw new Error(
        `[TripsPage.getSearchNoResults] The search-results no-results message (${SELECTORS.SEARCH_NO_RESULTS}) was not visible within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "Clear all" control of the Trip Status filter group, unticking
   * every status checkbox.
   */
  async clickStatusFilterClearAll() {
    const clearAll = this.page.locator(SELECTORS.STATUS_FILTER_CLEAR_ALL).first();
    try {
      await clearAll.waitFor({ state: 'visible', timeout: 15000 });
      await clearAll.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.clickStatusFilterClearAll] Could not click the status filter "Clear all" control (${SELECTORS.STATUS_FILTER_CLEAR_ALL}). Original: ${err.message}`
      );
    }
  }

  /**
   * Scrolls the Trip Status filter title into view and returns it once visible.
   * On desktop every status option is always rendered, so "opening" the filter is
   * simply ensuring its section is in view before ticking an option.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 15000ms)
   */
  async revealStatusFilter({ timeout = 15000 } = {}) {
    const title = this.page.locator(SELECTORS.TRIP_STATUS_FILTER_ICON).first();
    try {
      await title.waitFor({ state: 'visible', timeout });
      await title.scrollIntoViewIfNeeded({ timeout: 10000 });
      return title;
    } catch (err) {
      throw new Error(
        `[TripsPage.revealStatusFilter] The Trip Status filter title (${SELECTORS.TRIP_STATUS_FILTER_ICON}) was not visible within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the Trip Status filter checkbox whose label reads the given status.
   *
   * @param {string} status - visible status label, e.g. "Declined"
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 15000ms)
   */
  async getStatusFilterCheckbox(status, { timeout = 15000 } = {}) {
    const checkbox = this.page
      .locator(SELECTORS.STATUS_FILTER_CHECKBOX)
      .filter({ has: this.page.locator(SELECTORS.STATUS_FILTER_CHECKBOX_LABEL, { hasText: exactText(status) }) })
      .first();
    try {
      await checkbox.waitFor({ state: 'visible', timeout });
      return checkbox;
    } catch (err) {
      throw new Error(
        `[TripsPage.getStatusFilterCheckbox] Could not find the "${status}" status checkbox in the Trip Status filter within ${timeout}ms. The status label may differ from the value passed. Original: ${err.message}`
      );
    }
  }

  /**
   * Ticks the Trip Status filter checkbox for the given status.
   * No-op if the option is already checked.
   *
   * @param {string} status - visible status label, e.g. "Declined"
   */
  async checkStatusFilterOption(status) {
    const checkbox = await this.getStatusFilterCheckbox(status);
    try {
      if (((await checkbox.getAttribute('class')) || '').includes('is-checked')) return;
      // The el-checkbox label wraps a nested <label class="check-btn"> that holds
      // the status text; clicking that inner label does not toggle the control, so
      // click Element Plus' visual box (.el-checkbox__inner) which reliably does.
      const box = checkbox.locator(SELECTORS.STATUS_FILTER_CHECKBOX_BOX).first();
      await box.click({ timeout: 10000 });
      // Confirm the toggle registered before the caller waits on filtered results;
      // Element Plus marks a ticked checkbox with the "is-checked" class.
      await this.page
        .locator(SELECTORS.STATUS_FILTER_CHECKBOX_CHECKED)
        .filter({ has: this.page.locator(SELECTORS.STATUS_FILTER_CHECKBOX_LABEL, { hasText: exactText(status) }) })
        .first()
        .waitFor({ state: 'attached', timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.checkStatusFilterOption] Could not tick the "${status}" status checkbox. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns a search-results trip status label (.app-label) matching the given
   * status, once visible.
   *
   * @param {string} status - visible status label, e.g. "Declined"
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getResultStatusLabel(status, { timeout = 30000 } = {}) {
    const label = this.page
      .locator(SELECTORS.RESULT_STATUS_LABEL, { hasText: exactText(status) })
      .first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      return label;
    } catch (err) {
      throw new Error(
        `[TripsPage.getResultStatusLabel] No search-results trip showed the "${status}" status label within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns a search-results trip id element (.trip-id) matching the given id,
   * once visible.
   *
   * @param {string} tripId
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getResultTripId(tripId, { timeout = 30000 } = {}) {
    const id = this.page
      .locator(SELECTORS.RESULT_TRIP_ID, { hasText: exactText(tripId) })
      .first();
    try {
      await id.waitFor({ state: 'visible', timeout });
      return id;
    } catch (err) {
      throw new Error(
        `[TripsPage.getResultTripId] No search-results trip showed the id "${tripId}" within ${timeout}ms. Original: ${err.message}`
      );
    }
  }
}

module.exports = TripsPage;
