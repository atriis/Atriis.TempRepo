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

  // A standalone checkbox in the trip-monitor filter panel, its label node, and its
  // ticked variant (Element Plus adds "is-checked"). :visible mirrors
  // STATUS_FILTER_CHECKBOX below — it keeps .first() off a hidden mobile-drawer
  // duplicate.
  //
  // NOT usable for the Trip Status group: app-checkbox-group.vue renders a
  // results-count <p> inside the same .el-checkbox__label as the status name, so
  // the label's text is "Confirmed 12", not "Confirmed", and an exact-text match
  // would miss. Status options have their own selectors + checkStatusFilterOption,
  // which match the inner p.filter-title instead.
  FILTER_CHECKBOX:
    '.trip-monitor-filter .el-checkbox:visible',
  FILTER_CHECKBOX_LABEL:
    '.el-checkbox__label',
  FILTER_CHECKBOX_CHECKED:
    '.trip-monitor-filter .el-checkbox.is-checked:visible',

  // The "my trips only" toggle in the trip-monitor filter panel
  // (trip-monitor-filter.vue -> el-switch.my-trips-toggle). It replaced the former
  // el-checkbox, so none of the FILTER_CHECKBOX selectors above match it.
  //
  // Matched by the app's own .my-trips-toggle class, NOT by label text and NOT by
  // data-testid:
  //   - the label is the switch's active-text and is translated per locale
  //     ("Show my trips only" in en/en-US, "Nur meine Reisen" in de);
  //   - trip-monitor-filter.vue does carry data-testid="trip.monitor-filter.my-trips-only",
  //     but vite.config.ts strips every data-testid from non-dev builds (ADR-002),
  //     so no testid exists on stg/prod — verified: the trips page serves zero.
  // :visible mirrors the selectors above — it keeps .first() off a hidden
  // mobile-drawer duplicate.
  MY_TRIPS_ONLY_SWITCH:
    '.trip-monitor-filter .el-switch.my-trips-toggle:visible',
  // On/off variants — Element Plus adds "is-checked" to the el-switch root when on.
  MY_TRIPS_ONLY_SWITCH_ON:
    '.trip-monitor-filter .el-switch.my-trips-toggle.is-checked:visible',
  MY_TRIPS_ONLY_SWITCH_OFF:
    '.trip-monitor-filter .el-switch.my-trips-toggle:not(.is-checked):visible',

  // A quick-view button in the filter rail and its label span
  // (trip-monitor-filter.vue -> .quick-views > button.quick-view). The rail replaced
  // the page's old el-tabs. Each entry selects a SOURCE ("To do", "Upcoming trips",
  // "In travel trips", "Past trips"), not just a filter, so picking one re-queries
  // the trip list.
  QUICK_VIEW:
    '.trip-monitor-filter .quick-view:visible',
  QUICK_VIEW_LABEL:
    '.quick-view__label',
  // The selected variant of QUICK_VIEW — trip-monitor-filter.vue adds "is-active".
  QUICK_VIEW_ACTIVE:
    '.trip-monitor-filter .quick-view.is-active:visible',

  // The trip id shown on a trip card (trip-preview.vue -> span.trip-id).
  // :visible keeps a hidden responsive duplicate out.
  //
  // RESULT_TRIP_ID below is the same element reached through .trip-list-container.
  // The two were genuinely different while the page had tab panes — one matched any
  // pane, the other only the search-results pane. Since the rebuild there is a
  // single list, so RESULT_TRIP_ID is just the container-scoped spelling; kept
  // separate only because getResultTripId and getTripCardId are called from
  // different assertions. Collapse them if a third caller ever needs one.
  TRIP_CARD_TRIP_ID:
    '.trip-preview .trip-id:visible',

  // What the trip list shows while it re-queries (trip-list-panel.vue renders
  // filter-skeleton.vue instead of the cards whenever isTripsLoading is true) and
  // the two states it can settle into: at least one card, or the empty block
  // (app-no-results-filter.vue). Needed because a filter change empties the list
  // BEFORE the new results arrive, so "trip X is absent" read mid-refresh is true
  // of every trip and proves nothing.
  TRIP_LIST_SKELETON:
    '.trip-list-container .filters-skeleton',
  TRIP_LIST_SETTLED:
    '.trip-list-container .trip-preview, .trip-list-container .app-no-results',

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

  // Free-text search input on the trips page (my-trips.vue -> .trips-search >
  // el-input.trips-search__input, placeholder "Search by Trip Id, Origin, ...").
  //
  // AB#82671 rebuilt this screen: the input moved OUT of the filter rail into the
  // main column, and the el-dropdown that wrapped it — with its suggestions popper
  // and "expand your search" row — was dropped entirely. The old
  // '.trip-monitor-filter .search-dropdown' scope therefore matches nothing;
  // '.search-dropdown' survives only as a dead rule in trip-monitor-filter.scss.
  //
  // Matched by class, NOT by data-testid: my-trips.vue does carry
  // data-testid="trip.list.search-input", but vite.config.ts strips every
  // data-testid from non-dev builds (ADR-002) — see MY_TRIPS_ONLY_SWITCH above.
  // el-input renders the real <input> as .el-input__inner, so the class pair
  // reaches it without depending on the type attribute.
  SEARCH_INPUT:
    '.trips-search input.el-input__inner',

  // The Search button beside the input (my-trips.vue -> app-btn.trips-search__btn).
  // Submitting is what re-asks the SERVER for matching trips — typing alone only
  // narrows the trips already loaded into the active quick view.
  //
  // Deliberately scoped to .trips-search: app-no-results-filter.vue renders a
  // second "Search" CTA inside an empty trip list, which an unscoped match would
  // sometimes hit instead.
  SEARCH_SUBMIT_BTN:
    '.trips-search .trips-search__btn',

  // The list header's "Showing N trips" count (trip-list-panel.vue ->
  // .panel-head__count). Replaced the old "Found N trip(s)" line, which lived in
  // the search-results pane the rebuild removed.
  SEARCH_RESULTS_HEADER:
    '.panel-head__count',

  // No-results block (app-no-results-filter.vue -> <h3>), shown when the active
  // view plus the applied search/filters match no trip.
  SEARCH_NO_RESULTS:
    '.trip-list-container .app-no-results h3',

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

  // A result trip's status label and id (trip-preview.vue), scoped to the one trip
  // list the page now has. The rebuild removed the el-tabs and their panes, so
  // '#pane-search-results' matches nothing — .trip-list-container is the single
  // mounted list, holding whichever quick view plus search is active.
  // :visible keeps hidden responsive duplicates out.
  RESULT_STATUS_LABEL:
    '.trip-list-container .trip-preview .app-label:visible',
  RESULT_TRIP_ID:
    '.trip-list-container .trip-preview .trip-id:visible',

  // The trip list and its cards. trip-list-panel.vue renders the list element even
  // when it holds no cards, so the list's presence alone never proves a search
  // returned anything — callers assert on the cards too.
  SEARCH_RESULTS_TRIP_LIST:
    '.trip-list-container .trip-list',
  SEARCH_RESULTS_TRIP_CARD:
    '.trip-list-container .trip-preview:visible',

  // Comma-joined traveller names on a trip card (trip-preview.vue -> .passenger-names).
  RESULT_PASSENGER_NAMES:
    '.trip-list-container .trip-preview .passenger-names:visible',
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

  /**
   * Clicks the trip Overview tab header to switch the trip cart to the Overview pane.
   */
  async clickOverviewTab() {
    const tab = await this.getOverviewTab({ timeout: 30000 });
    try {
      await tab.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.clickOverviewTab] Could not click the trip Overview tab (${SELECTORS.OVERVIEW_TAB}). Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the trip-monitor filter checkbox whose visible label reads the given
   * text, once it is visible.
   *
   * @param {string} label - visible checkbox label, e.g. "My trips only"
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getFilterCheckboxByLabel(label, { timeout = 30000 } = {}) {
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[TripsPage.getFilterCheckboxByLabel] "label" must be a non-empty string, got: ' + typeof label);
    }
    const checkbox = this.page
      .locator(SELECTORS.FILTER_CHECKBOX)
      .filter({ has: this.page.locator(SELECTORS.FILTER_CHECKBOX_LABEL, { hasText: exactText(label) }) })
      .first();
    try {
      await checkbox.waitFor({ state: 'visible', timeout });
      return checkbox;
    } catch (err) {
      throw new Error(
        `[TripsPage.getFilterCheckboxByLabel] The "${label}" filter checkbox (${SELECTORS.FILTER_CHECKBOX}) was not visible within ${timeout}ms. The trips filter panel may not be rendered or the label differs from the value passed. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the "my trips only" filter switch once it is visible.
   *
   * Deliberately NOT routed through getFilterCheckboxByLabel: this control is an
   * el-switch, not an el-checkbox, and it is found by testid rather than by label.
   * Its own method also keeps the "missing" hint specific to it — trip-monitor-filter.vue
   * renders the switch only when isOnlyMyTripsFilterEnable is true, so an account
   * without the permission simply has no such control.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   * @returns {import('@playwright/test').Locator} the el-switch root — Element Plus
   *   puts the on/off state on it as the "is-checked" class.
   */
  async getMyTripsOnlySwitch({ timeout = 30000 } = {}) {
    const toggle = this.page.locator(SELECTORS.MY_TRIPS_ONLY_SWITCH).first();
    try {
      await toggle.waitFor({ state: 'visible', timeout });
      return toggle;
    } catch (err) {
      throw new Error(
        `[TripsPage.getMyTripsOnlySwitch] The "my trips only" filter switch (${SELECTORS.MY_TRIPS_ONLY_SWITCH}) was not visible within ${timeout}ms. The trips filter panel may not be rendered or the account lacks CanViewAllCorporateTrips permission. Original: ${err.message}`
      );
    }
  }

  /**
   * Turns the "my trips only" switch on or off, and waits for the new state to
   * register before returning.
   *
   * @param {boolean} on - desired state
   * @returns {Promise<{ alreadyInState: boolean }>} whether the switch was already
   *   in the requested state, so the caller can report a step that changed nothing.
   */
  async setMyTripsOnlySwitch(on) {
    if (typeof on !== 'boolean') {
      throw new Error('[TripsPage.setMyTripsOnlySwitch] "on" must be a boolean, got: ' + typeof on);
    }
    const toggle = await this.getMyTripsOnlySwitch();
    try {
      const isOn = ((await toggle.getAttribute('class')) || '').includes('is-checked');
      if (isOn === on) return { alreadyInState: true };
      // el-switch binds its click handler to the root <div>, so clicking the root
      // toggles it — no need to aim at the __core pill.
      await toggle.click({ timeout: 10000 });
      // Confirm the new state registered before the caller waits on a refreshed list.
      await this.page
        .locator(on ? SELECTORS.MY_TRIPS_ONLY_SWITCH_ON : SELECTORS.MY_TRIPS_ONLY_SWITCH_OFF)
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
      return { alreadyInState: false };
    } catch (err) {
      throw new Error(
        `[TripsPage.setMyTripsOnlySwitch] Could not turn the "my trips only" switch ${on ? 'on' : 'off'}. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects a quick view in the filter rail by its visible label and waits for it
   * to become the active view.
   *
   * @param {string} label - visible quick-view label, e.g. "Past trips"
   */
  async selectQuickView(label) {
    const view = await this.getQuickViewByLabel(label, { timeout: 30000 });
    try {
      await view.click({ timeout: 30000 });
      // trip-monitor-filter.vue marks the selected view with "is-active"; waiting on
      // it proves the click landed on the rail rather than on a still-rendering card.
      await this.page
        .locator(SELECTORS.QUICK_VIEW_ACTIVE)
        .filter({ has: this.page.locator(SELECTORS.QUICK_VIEW_LABEL, { hasText: exactText(label) }) })
        .first()
        .waitFor({ state: 'visible', timeout: 10000 });
      return view;
    } catch (err) {
      throw new Error(
        `[TripsPage.selectQuickView] Could not select the "${label}" quick view (${SELECTORS.QUICK_VIEW}). Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the trip list to finish re-querying: the loading skeleton gone and
   * the list settled into either cards or the empty block.
   *
   * Every presence/absence assertion on the list goes through this — an absence
   * checked while the skeleton is up would pass for any trip id at all.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async waitForTripListSettled({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.TRIP_LIST_SKELETON).first().waitFor({ state: 'hidden', timeout });
      await this.page.locator(SELECTORS.TRIP_LIST_SETTLED).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[TripsPage.waitForTripListSettled] The trip list did not settle within ${timeout}ms — it showed neither a trip card nor the empty-results block. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the trip-card id element for the given trip, WITHOUT waiting — the
   * caller asserts on presence or absence, so waiting here would defeat one of them.
   *
   * @param {string} tripId
   */
  getTripCardId(tripId) {
    if (typeof tripId !== 'string' || tripId.length === 0) {
      throw new Error('[TripsPage.getTripCardId] "tripId" must be a non-empty string, got: ' + typeof tripId);
    }
    return this.page.locator(SELECTORS.TRIP_CARD_TRIP_ID, { hasText: exactText(tripId) });
  }

  /**
   * Ticks the trip-monitor filter checkbox with the given label.
   *
   * @param {string} label - visible checkbox label, e.g. "My trips only"
   * @returns {Promise<{ alreadyChecked: boolean }>} whether the control was already
   *   ticked, so the caller can report a step that changed nothing.
   */
  async checkFilterCheckbox(label) {
    const checkbox = await this.getFilterCheckboxByLabel(label);
    try {
      if (((await checkbox.getAttribute('class')) || '').includes('is-checked')) {
        return { alreadyChecked: true };
      }
      // The el-checkbox label can wrap nested markup that swallows text clicks
      // (see checkStatusFilterOption), so click Element Plus' visual box, which
      // reliably toggles the control.
      const box = checkbox.locator(SELECTORS.STATUS_FILTER_CHECKBOX_BOX).first();
      await box.click({ timeout: 10000 });
      // Confirm the toggle registered before the caller waits on filtered results.
      await this.page
        .locator(SELECTORS.FILTER_CHECKBOX_CHECKED)
        .filter({ has: this.page.locator(SELECTORS.FILTER_CHECKBOX_LABEL, { hasText: exactText(label) }) })
        .first()
        .waitFor({ state: 'attached', timeout: 5000 });
      return { alreadyChecked: false };
    } catch (err) {
      throw new Error(
        `[TripsPage.checkFilterCheckbox] Could not tick the "${label}" filter checkbox. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the free-text search input locator, WITHOUT waiting — a caller
   * asserting the field is EMPTY needs the bare locator.
   */
  getSearchInput() {
    return this.page.locator(SELECTORS.SEARCH_INPUT).first();
  }

  /**
   * Types a term into the trips free-text search input.
   *
   * Typing (not a raw value set) is required so my-trips.vue's @input handler
   * fires: it narrows the trips already loaded into the active quick view, which
   * is the state a scenario sees before it submits. The input is cleared first so
   * the method is safe to call more than once in a scenario.
   *
   * @param {string} term
   */
  async fillTripsSearch(term) {
    const input = this.getSearchInput();
    try {
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click({ timeout: 10000 });
      await input.fill('', { timeout: 10000 });
      await input.pressSequentially(term, { delay: 20, timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.fillTripsSearch] Could not type "${term}" into the trips search input (${SELECTORS.SEARCH_INPUT}). The trips page may not have finished loading — my-trips.vue renders the search row only once isLoading is false. Original: ${err.message}`
      );
    }
  }

  /**
   * Submits the trips search by clicking the Search button.
   *
   * The button is what a user presses, and it is the control that carries the
   * in-flight state (app-btn :isLoading="isTripsLoading"). Enter on the input runs
   * the same my-trips.vue searchTrips() handler, but clicking also proves the
   * control is enabled and hittable.
   *
   * Submitting re-queries the SERVER, so the list this leaves behind is NOT yet
   * settled — callers wait for it (see Trips.submitTripsSearch).
   */
  async submitTripsSearch() {
    const button = this.page.locator(SELECTORS.SEARCH_SUBMIT_BTN).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[TripsPage.submitTripsSearch] Could not click the trips Search button (${SELECTORS.SEARCH_SUBMIT_BTN}). The trips page may not have finished loading, or a previous search was still in flight and left the button in its loading state. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the quick-view button carrying the given visible label, once visible.
   *
   * Separate from selectQuickView: a scenario that only checks the rail OFFERS a
   * view must not select it, which would re-query the trip list.
   *
   * @param {string} label - visible quick-view label, e.g. "Past trips"
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getQuickViewByLabel(label, { timeout = 30000 } = {}) {
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[TripsPage.getQuickViewByLabel] "label" must be a non-empty string, got: ' + typeof label);
    }
    const view = this.page
      .locator(SELECTORS.QUICK_VIEW)
      .filter({ has: this.page.locator(SELECTORS.QUICK_VIEW_LABEL, { hasText: exactText(label) }) })
      .first();
    try {
      await view.waitFor({ state: 'visible', timeout });
      return view;
    } catch (err) {
      throw new Error(
        `[TripsPage.getQuickViewByLabel] The "${label}" quick view (${SELECTORS.QUICK_VIEW}) was not visible within ${timeout}ms. The filter rail may not be rendered or the label differs from the value passed. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the list header's "Showing N trips" count once it is visible.
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
        `[TripsPage.getSearchResultsHeader] The trip list header (${SELECTORS.SEARCH_RESULTS_HEADER}) was not visible within ${timeout}ms. The trips page may not have finished loading. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the trip list's no-results heading once it is visible.
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

  /**
   * Returns the page's trip list once it is visible.
   *
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getSearchResultsTripList({ timeout = 30000 } = {}) {
    const list = this.page.locator(SELECTORS.SEARCH_RESULTS_TRIP_LIST).first();
    try {
      await list.waitFor({ state: 'visible', timeout });
      return list;
    } catch (err) {
      throw new Error(
        `[TripsPage.getSearchResultsTripList] The trip list (${SELECTORS.SEARCH_RESULTS_TRIP_LIST}) was not visible within ${timeout}ms. trip-list-panel.vue renders it only once the active view returned at least one trip, so a search that matched nothing shows the no-results block instead. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the trip-card locator, WITHOUT waiting, so a caller can assert on how
   * many cards rendered. The card count is what separates "results" from "a list
   * that rendered without them".
   */
  getSearchResultsTripCardsLocator() {
    return this.page.locator(SELECTORS.SEARCH_RESULTS_TRIP_CARD);
  }

  /**
   * Returns the traveller-names locator for every trip card that lists the given
   * traveller, WITHOUT waiting.
   *
   * A caller asserting a traveller is ABSENT from the results needs the bare
   * locator — a waiting variant would throw before the assertion could run.
   *
   * @param {string} traveller - traveller full name, e.g. "Ibire Cvvsky"
   */
  getResultTripsForTravellerLocator(traveller) {
    if (typeof traveller !== 'string' || traveller.length === 0) {
      throw new Error('[TripsPage.getResultTripsForTravellerLocator] "traveller" must be a non-empty string, got: ' + typeof traveller);
    }
    return this.page.locator(SELECTORS.RESULT_PASSENGER_NAMES, { hasText: traveller });
  }

  /**
   * Returns the traveller-names node of a trip card listing the given traveller,
   * once visible.
   *
   * Substring match on purpose: .passenger-names holds every traveller on the trip
   * as one comma-joined string, so an exact-text match would only ever hit
   * single-traveller trips.
   *
   * @param {string} traveller - traveller full name, e.g. "Ibire Cvvsky"
   * @param {object} options
   * @param {number} options.timeout - Maximum time to wait (default: 30000ms)
   */
  async getResultTripForTraveller(traveller, { timeout = 30000 } = {}) {
    const names = this.getResultTripsForTravellerLocator(traveller).first();
    try {
      await names.waitFor({ state: 'visible', timeout });
      return names;
    } catch (err) {
      throw new Error(
        `[TripsPage.getResultTripForTraveller] No trip in the list named the traveller "${traveller}" within ${timeout}ms. The search may have returned other travellers' trips only. Original: ${err.message}`
      );
    }
  }
}

module.exports = TripsPage;
