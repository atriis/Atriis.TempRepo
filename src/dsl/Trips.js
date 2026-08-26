const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const { MenuPage } = require("@pages/MenuPage");
const TripsPage = require("@pages/TripsPage");
const LoginPage = require("@pages/LoginPage");
const logger = require("@utils/logger").child("Trips");

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
      throw new Error('[Trips.navigateToTripsPage] page is required');
    }

    const menuPage = getPageObject(page, MenuPage);
    const tripsPage = getPageObject(page, TripsPage);
    const loginPage = getPageObject(page, LoginPage);

    try {
      // Cookie consent banner intercepts pointer events and blocks Vue Router
      // navigation — dismiss it before clicking the Trips link.
      await loginPage.acceptCookiesIfPresent(5000);

      // Start watching for navigation before the click to avoid a race where
      // waitForLoadState resolves on the already-loaded home page before the
      // trips navigation begins.
      await Promise.all([
        page.waitForURL("**/trips", { timeout: 30000 }),
        menuPage.clickTrips(),
      ]);

      // Page is considered loaded when the trips section is visible
      await tripsPage.waitForTripStatusFilter();

      return { navigated: true };
    } catch (err) {
      throw new Error(
        '[Trips.navigateToTripsPage] Failed to navigate to the trips page. The menu link may not be visible or the page timed out loading. Original: ' + err.message
      );
    }
  },

  /**
   * Switches to the in-travel trips tab on the trips page.
   *
   * @param {import('@playwright/test').Page} page
   */
  async switchToInTravelTripsTab(page) {
    if (!page) throw new Error('"page" is required, got: ' + typeof page);

    const trips = getPageObject(page, TripsPage);
    try {
      logger.debug("Switching to in-travel trips tab");
      await trips.clickInTravelTab();
    } catch (err) {
      throw new Error(
        `[Trips.switchToInTravelTripsTab] Failed to switch to the in-travel trips tab. The tab may not be visible or the trips page has not loaded. Original: ${err.message}`
      );
    }
  },

  /**
   * Clicks the first trip in the trip list to open it.
   *
   * A trip opens in a NEW browser tab for bookers and no-corporation users
   * (trip-preview router-link target="_blank"), or in the SAME tab for travelers
   * (target="_self"). This method arms a new-page listener before the click and
   * returns whichever page now shows the trip, so the caller can reassign
   * `this.page` and run subsequent steps against the correct tab.
   *
   * @param {import('@playwright/test').Page} page
   * @returns {Promise<import('@playwright/test').Page>} the page showing the opened trip
   */
  async clickFirstTrip(page) {
    if (!page) throw new Error('[Trips.clickFirstTrip] page is required');
    const context = page.context();
    if (!context) throw new Error('[Trips.clickFirstTrip] page context is null — cannot detect a new tab');

    const tripsPage = getPageObject(page, TripsPage);
    const loginPage = getPageObject(page, LoginPage);

    try {
      // Cookie consent banner can intercept the click.
      await loginPage.acceptCookiesIfPresent(5000);

      // Arm the new-page listener BEFORE the click; fall back to same-tab nav.
      const newTabPromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);
      await tripsPage.clickFirstTripLink();
      const newTab = await newTabPromise;

      if (newTab) {
        await newTab.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
        logger.info('[Trips.clickFirstTrip] Trip opened in a new browser tab');
        return newTab;
      }

      // No new tab observed: either a traveler/same-tab (target="_self") open, or
      // a booker new tab whose 'page' event was missed. Warn so the latter — which
      // would leave us on the trips list and later look like "cart didn't load" —
      // is distinguishable in triage. Then settle the current page and return it.
      logger.warn('[Trips.clickFirstTrip] No new browser tab detected — assuming same-tab open (traveler) or a missed booker tab');
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      return page;
    } catch (err) {
      throw new Error(
        `[Trips.clickFirstTrip] Failed to click the first trip from the trip list. The trip list may be empty or the trip card link was not clickable. Original: ${err.message}`
      );
    }
  },

  /**
   * Opens the trip Overview tab in the trip cart.
   *
   * @param {import('@playwright/test').Page} page
   */
  async openTripOverviewTab(page) {
    if (!page) throw new Error('[Trips.openTripOverviewTab] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Opening the trip Overview tab');
      await tripsPage.clickOverviewTab();
    } catch (err) {
      throw new Error(
        `[Trips.openTripOverviewTab] Could not open the trip Overview tab. The trip cart may not have ` +
        `finished loading. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the trip Overview tab is displayed on the trip cart page.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyOverviewTabDisplayed(page) {
    if (!page) throw new Error('[Trips.verifyOverviewTabDisplayed] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trip Overview tab is displayed');
      const tab = await tripsPage.getOverviewTab({ timeout: 30000 });
      await expect(tab, '[Trips.verifyOverviewTabDisplayed] Expected the trip Overview tab to be displayed with label "Overview". The trip cart may not have loaded or the tab did not render.')
        .toContainText('Overview', { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyOverviewTabDisplayed] Failed to verify the trip Overview tab. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip opened in the SAME browser tab (no popup / new page) and that
   * the trip overview is rendered on it.
   *
   * A traveler-privileged user's trip link is target="_self", so opening it
   * navigates the current tab in place — unlike bookers/no-corp users whose link
   * is target="_blank" and spawns a second page (see clickFirstTrip). The context
   * should therefore still hold exactly one page.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripOpensInSameTab(page) {
    if (!page) throw new Error('[Trips.verifyTripOpensInSameTab] page is required');
    const context = page.context();
    if (!context) throw new Error('[Trips.verifyTripOpensInSameTab] page context is null — cannot verify tab behavior');

    try {
      logger.debug('Verifying the trip opened in the same tab (no new browser tab)');

      // No popup/new tab: a same-tab (traveler) open leaves the context with the
      // single original page (the scenario starts with one page: login + navigate
      // reuse it). A new tab (booker/no-corp) would make this 2.
      const openPages = context.pages().length;
      expect(openPages, `[Trips.verifyTripOpensInSameTab] Expected the trip to open in the SAME browser tab (exactly one page in the context), but found ${openPages}. More than one page indicates a new tab was spawned (booker/no-corp behavior).`)
        .toBe(1);

      // And the trip overview must be rendered on that same tab — reuse the
      // existing overview-tab verification instead of re-implementing it.
      await this.verifyOverviewTabDisplayed(page);
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripOpensInSameTab] Failed to verify the trip opened in the same tab. Original: ${err.message}`
      );
    }
  },

  async verifyUserGroupLabelVisibleOnFirstTrip(page) {
    if (!page) throw new Error('"page" is required, got: ' + typeof page);
    const trips = getPageObject(page, TripsPage);
    try {
      logger.debug('Reading user group container from first trip');
      const container = await trips.getFirstTripUserGroupContainer();
      await expect(container, '[Trips.verifyUserGroupLabelVisibleOnFirstTrip] Expected the "Group" label to be rendered on the first trip card. Ensure the test account has active trips with a UserGroupName set.')
        .toContainText('Group');
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyUserGroupLabelVisibleOnFirstTrip] Failed to verify the user group label on the first trip. Original: ${err.message}`
      );
    }
  },

  async verifyTripsPageLoaded(page) {
    if (!page) throw new Error('[Trips.verifyTripsPageLoaded] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips page is loaded');
      await tripsPage.waitForTripStatusFilter({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        '[Trips.verifyTripsPageLoaded] Trips page did not load — trip status filter was not visible. Original: ' + err.message
      );
    }
  },

  async verifyMyTripsOnlyCheckboxVisible(page) {
    if (!page) throw new Error('[Trips.verifyMyTripsOnlyCheckboxVisible] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying "My trips only" filter checkbox is visible');
      const locator = await tripsPage.getMyTripsOnlyCheckbox({ timeout: 30000 });
      await expect(locator, '[Trips.verifyMyTripsOnlyCheckboxVisible] "My trips only" filter checkbox was not visible in the trips filter panel')
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        '[Trips.verifyMyTripsOnlyCheckboxVisible] Failed to verify "My trips only" checkbox visibility. Original: ' + err.message
      );
    }
  },

  async verifyMyTripsOnlyCheckboxChecked(page) {
    if (!page) throw new Error('[Trips.verifyMyTripsOnlyCheckboxChecked] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying "My trips only" filter checkbox is checked');
      const locator = await tripsPage.getMyTripsOnlyCheckbox({ timeout: 30000 });
      // Element Plus marks a checked el-checkbox by adding the "is-checked" class
      // to the root <label class="el-checkbox">; it renders no aria-checked, so
      // the class is the authoritative checked-state marker.
      await expect(locator, '[Trips.verifyMyTripsOnlyCheckboxChecked] "My trips only" filter was expected to be checked by default, but the el-checkbox is missing the "is-checked" class')
        .toHaveClass(/is-checked/, { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        '[Trips.verifyMyTripsOnlyCheckboxChecked] Failed to verify the "My trips only" checkbox checked state. Original: ' + err.message
      );
    }
  },

  /**
   * Types a term into the trip-monitor free-text search input, opening the
   * suggestions dropdown. Does not submit — callers either expand the search or
   * submit it explicitly.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} term
   */
  async searchTripsPage(page, term) {
    if (!page) throw new Error('[Trips.searchTripsPage] page is required');
    if (typeof term !== 'string' || term.length === 0) {
      throw new Error('[Trips.searchTripsPage] "term" must be a non-empty string, got: ' + typeof term);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Typing into the trips search input', { term });
      await tripsPage.fillTripsSearch(term);
    } catch (err) {
      throw new Error(
        `[Trips.searchTripsPage] Failed to search the trips page for "${term}". Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the search suggestions dropdown opened under the search input.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripsSearchSuggestionsDisplayed(page) {
    if (!page) throw new Error('[Trips.verifyTripsSearchSuggestionsDisplayed] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying the trips search suggestions dropdown is displayed');
      const popper = await tripsPage.getSearchSuggestionsPopper({ timeout: 15000 });
      await expect(popper, '[Trips.verifyTripsSearchSuggestionsDisplayed] Expected the trips search suggestions dropdown to be displayed after typing a search term, but it was not visible. The dropdown only opens while the input holds a term.')
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsSearchSuggestionsDisplayed] Failed to verify the trips search suggestions dropdown. Original: ${err.message}`
      );
    }
  },

  /**
   * Submits the trip-monitor search, opening the "Search results" tab.
   *
   * @param {import('@playwright/test').Page} page
   */
  async submitTripsSearch(page) {
    if (!page) throw new Error('[Trips.submitTripsSearch] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Submitting the trips search');
      await tripsPage.submitTripsSearch();
    } catch (err) {
      throw new Error(
        `[Trips.submitTripsSearch] Failed to submit the trips search. The search input may not be rendered or no term was typed first. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the search suggestions dropdown offers the "expand your search"
   * option.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripsSearchOffersExpand(page) {
    if (!page) throw new Error('[Trips.verifyTripsSearchOffersExpand] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying the trips search offers to expand');
      const item = await tripsPage.getSearchExpandItem({ timeout: 15000 });
      await expect(item, '[Trips.verifyTripsSearchOffersExpand] Expected the "Click here to expand your search" option to be shown in the suggestions dropdown, but it was not visible.')
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsSearchOffersExpand] Failed to verify the expand-search option. Original: ${err.message}`
      );
    }
  },

  /**
   * Clicks the "expand your search" option to open the full search results.
   *
   * @param {import('@playwright/test').Page} page
   */
  async expandTripsSearch(page) {
    if (!page) throw new Error('[Trips.expandTripsSearch] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Expanding the trips search');
      await tripsPage.clickSearchExpandItem();
    } catch (err) {
      throw new Error(
        `[Trips.expandTripsSearch] Failed to expand the trips search. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the search-results header contains the expected text.
   *
   * The header renders as "Found" + a bold count + a status word ("Trip"/"Trips")
   * across separate inline nodes, so whitespace/casing around them is not
   * reliable. Both the actual and expected text are stripped of all whitespace and
   * lower-cased before the contains check.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} expectedText
   */
  async verifyTripsSearchResultsHeaderContains(page, expectedText) {
    if (!page) throw new Error('[Trips.verifyTripsSearchResultsHeaderContains] page is required');
    if (typeof expectedText !== 'string' || expectedText.length === 0) {
      throw new Error('[Trips.verifyTripsSearchResultsHeaderContains] "expectedText" must be a non-empty string, got: ' + typeof expectedText);
    }
    const tripsPage = getPageObject(page, TripsPage);
    const normalize = (s) => (s || '').replace(/\s+/g, '').toLowerCase();
    try {
      logger.debug('Verifying trips search results header', { expectedText });
      const header = await tripsPage.getSearchResultsHeader({ timeout: 30000 });
      await expect
        .poll(async () => normalize(await header.textContent()), {
          message: `[Trips.verifyTripsSearchResultsHeaderContains] Expected the search-results header to contain "${expectedText}".`,
          timeout: 15000,
        })
        .toContain(normalize(expectedText));
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsSearchResultsHeaderContains] Failed to verify the search-results header. Original: ${err.message}`
      );
    }
  },

  /**
   * Clears all trip status filters (unticks every status checkbox), which leaves
   * the search results with no matching status.
   *
   * @param {import('@playwright/test').Page} page
   */
  async clearAllTripsFilters(page) {
    if (!page) throw new Error('[Trips.clearAllTripsFilters] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Clearing all trips filters');
      await tripsPage.clickStatusFilterClearAll();
    } catch (err) {
      throw new Error(
        `[Trips.clearAllTripsFilters] Failed to clear all trips filters. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the search results show the no-results message.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripsSearchNoResults(page) {
    if (!page) throw new Error('[Trips.verifyTripsSearchNoResults] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips search displays no results');
      const noResults = await tripsPage.getSearchNoResults({ timeout: 30000 });
      await expect(noResults, '[Trips.verifyTripsSearchNoResults] Expected the search results to show the "No results found" message after clearing the status filters, but it was not visible.')
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsSearchNoResults] Failed to verify the no-results message. Original: ${err.message}`
      );
    }
  },

  /**
   * Reveals the Trip Status filter (scrolls it into view) so a status option can
   * be ticked.
   *
   * @param {import('@playwright/test').Page} page
   */
  async openTripStatusFilter(page) {
    if (!page) throw new Error('[Trips.openTripStatusFilter] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Opening the trip status filter');
      await tripsPage.revealStatusFilter({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[Trips.openTripStatusFilter] Failed to open the trip status filter. Original: ${err.message}`
      );
    }
  },

  /**
   * Ticks the named trip status in the Trip Status filter.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} status - visible status label, e.g. "Declined"
   */
  async filterTripsByStatus(page, status) {
    if (!page) throw new Error('[Trips.filterTripsByStatus] page is required');
    if (typeof status !== 'string' || status.length === 0) {
      throw new Error('[Trips.filterTripsByStatus] "status" must be a non-empty string, got: ' + typeof status);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Filtering search results by trip status', { status });
      await tripsPage.checkStatusFilterOption(status);
    } catch (err) {
      throw new Error(
        `[Trips.filterTripsByStatus] Failed to filter by trip status "${status}". Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip status label is displayed on a search-results trip.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} status - visible status label, e.g. "Declined"
   */
  async verifyTripStatusLabelDisplayed(page, status) {
    if (!page) throw new Error('[Trips.verifyTripStatusLabelDisplayed] page is required');
    if (typeof status !== 'string' || status.length === 0) {
      throw new Error('[Trips.verifyTripStatusLabelDisplayed] "status" must be a non-empty string, got: ' + typeof status);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trip status label is displayed', { status });
      const label = await tripsPage.getResultStatusLabel(status, { timeout: 30000 });
      await expect(label, `[Trips.verifyTripStatusLabelDisplayed] Expected a search-results trip to display the "${status}" status label, but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripStatusLabelDisplayed] Failed to verify the "${status}" status label. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip with the given id is displayed in the search results.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} tripId
   */
  async verifyTripDisplayedById(page, tripId) {
    if (!page) throw new Error('[Trips.verifyTripDisplayedById] page is required');
    if (typeof tripId !== 'string' || tripId.length === 0) {
      throw new Error('[Trips.verifyTripDisplayedById] "tripId" must be a non-empty string, got: ' + typeof tripId);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trip id is displayed in results', { tripId });
      const id = await tripsPage.getResultTripId(tripId, { timeout: 30000 });
      await expect(id, `[Trips.verifyTripDisplayedById] Expected a search-results trip to show the id "${tripId}", but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripDisplayedById] Failed to verify the trip id "${tripId}" in the results. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trips-page tab with the given label is displayed.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} label - visible tab label, e.g. "Upcoming" / "Search results"
   */
  async verifyTripsTabDisplayed(page, label) {
    if (!page) throw new Error('[Trips.verifyTripsTabDisplayed] page is required');
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[Trips.verifyTripsTabDisplayed] "label" must be a non-empty string, got: ' + typeof label);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips tab is displayed', { label });
      const tab = await tripsPage.getTripsTab(label, { timeout: 30000 });
      await expect(tab, `[Trips.verifyTripsTabDisplayed] Expected the "${label}" trips tab to be displayed, but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsTabDisplayed] Failed to verify the "${label}" trips tab. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies no trips-page tab with the given label is present.
   *
   * my-trips.vue guards the search-results pane with v-if, so a dismissed search
   * REMOVES its tab from the DOM rather than hiding it — absence is asserted by
   * count, which also fails correctly if the tab is merely hidden.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} label - visible tab label, e.g. "Search results"
   */
  async verifyTripsTabNotDisplayed(page, label) {
    if (!page) throw new Error('[Trips.verifyTripsTabNotDisplayed] page is required');
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[Trips.verifyTripsTabNotDisplayed] "label" must be a non-empty string, got: ' + typeof label);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips tab is not displayed', { label });
      // Straight after a reload NO tab has rendered yet, so a bare count-0 check
      // would pass against a still-loading page. Wait for the strip to come up
      // first, so the assertion can only pass because this tab specifically is gone.
      await tripsPage.waitForTripsTabStrip({ timeout: 30000 });
      const tab = tripsPage.getTripsTabLocator(label);
      await expect(tab, `[Trips.verifyTripsTabNotDisplayed] Expected the "${label}" trips tab to be gone from the trips page, but it was still rendered. A page refresh should discard the search and drop its tab.`)
        .toHaveCount(0, { timeout: 15000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsTabNotDisplayed] Failed to verify the "${label}" trips tab was removed. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the search-results pane rendered a non-empty trip list.
   *
   * An empty .trip-list still renders, so the trip cards are asserted too —
   * otherwise a search that matched nothing would pass this check.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifySearchResultsTripListDisplayed(page) {
    if (!page) throw new Error('[Trips.verifySearchResultsTripListDisplayed] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying the search results display a trip list');
      const list = await tripsPage.getSearchResultsTripList({ timeout: 30000 });
      await expect(list, '[Trips.verifySearchResultsTripListDisplayed] Expected the search-results pane to render a trip list, but it was not visible. The search may not have produced a results tab.')
        .toBeVisible({ timeout: 10000 });
      const cards = tripsPage.getSearchResultsTripCardsLocator();
      await expect(cards.first(), '[Trips.verifySearchResultsTripListDisplayed] The search-results trip list rendered but contained no trip cards — the search returned zero trips.')
        .toBeVisible({ timeout: 15000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifySearchResultsTripListDisplayed] Failed to verify the search-results trip list. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a search-results trip lists the given traveller among its passengers.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} traveller - traveller full name, e.g. "Ibire Cvvsky"
   */
  async verifySearchResultsShowTraveller(page, traveller) {
    if (!page) throw new Error('[Trips.verifySearchResultsShowTraveller] page is required');
    if (typeof traveller !== 'string' || traveller.length === 0) {
      throw new Error('[Trips.verifySearchResultsShowTraveller] "traveller" must be a non-empty string, got: ' + typeof traveller);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying search results show a trip for traveller', { traveller });
      const names = await tripsPage.getResultTripForTraveller(traveller, { timeout: 30000 });
      await expect(names, `[Trips.verifySearchResultsShowTraveller] Expected a search-results trip to list the traveller "${traveller}" among its passengers, but no card did.`)
        .toContainText(traveller, { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifySearchResultsShowTraveller] Failed to verify a trip for traveller "${traveller}" in the search results. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies NO search-results trip lists the given traveller.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} traveller - traveller full name, e.g. "Ibire Cvvsky"
   */
  async verifySearchResultsDoNotShowTraveller(page, traveller) {
    if (!page) throw new Error('[Trips.verifySearchResultsDoNotShowTraveller] page is required');
    if (typeof traveller !== 'string' || traveller.length === 0) {
      throw new Error('[Trips.verifySearchResultsDoNotShowTraveller] "traveller" must be a non-empty string, got: ' + typeof traveller);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying search results do NOT show a trip for traveller', { traveller });

      // An absence check is only meaningful against rendered results: while the
      // search is still loading, or if it returned nothing at all, "this traveller
      // is missing" is trivially true. Require a rendered, non-empty result set
      // first so the assertion can only pass because THIS traveller was filtered out.
      const list = await tripsPage.getSearchResultsTripList({ timeout: 30000 });
      await expect(list, `[Trips.verifySearchResultsDoNotShowTraveller] Expected the search-results pane to render a trip list before checking that "${traveller}" is absent, but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
      const cards = tripsPage.getSearchResultsTripCardsLocator();
      await expect(cards.first(), `[Trips.verifySearchResultsDoNotShowTraveller] The search returned NO trips at all, so the absence of "${traveller}" proves nothing about the filter. Expected a non-empty result set.`)
        .toBeVisible({ timeout: 15000 });

      const names = tripsPage.getResultTripsForTravellerLocator(traveller);
      await expect(names, `[Trips.verifySearchResultsDoNotShowTraveller] Expected no search-results trip to list the traveller "${traveller}", but at least one did. The "My trips only" filter should have excluded other travellers' trips.`)
        .toHaveCount(0, { timeout: 15000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifySearchResultsDoNotShowTraveller] Failed to verify the traveller "${traveller}" is absent from the search results. Original: ${err.message}`
      );
    }
  },

  /**
   * Ticks a named checkbox filter in the trip-monitor filter panel.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} filterLabel - visible filter label, e.g. "My trips only"
   */
  async checkTripsFilter(page, filterLabel) {
    if (!page) throw new Error('[Trips.checkTripsFilter] page is required');
    if (typeof filterLabel !== 'string' || filterLabel.length === 0) {
      throw new Error('[Trips.checkTripsFilter] "filterLabel" must be a non-empty string, got: ' + typeof filterLabel);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Checking trips filter', { filterLabel });
      const { alreadyChecked } = await tripsPage.checkFilterCheckbox(filterLabel);
      if (alreadyChecked) {
        // Surfaced rather than swallowed: "My trips only" is ticked by default for
        // some accounts (see verifyMyTripsOnlyCheckboxChecked), so this step can be
        // a no-op and any assertion that follows would pass for the wrong reason.
        logger.warn(
          `[Trips.checkTripsFilter] The "${filterLabel}" filter was ALREADY checked — this step changed nothing. Any assertion that depends on the filter turning on here may pass for the wrong reason.`
        );
      }
    } catch (err) {
      throw new Error(
        `[Trips.checkTripsFilter] Failed to check the "${filterLabel}" filter on the trips page. Original: ${err.message}`
      );
    }
  },
};

module.exports = Trips;
