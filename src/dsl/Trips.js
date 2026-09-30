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

  async verifyMyTripsOnlySwitchVisible(page) {
    if (!page) throw new Error('[Trips.verifyMyTripsOnlySwitchVisible] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying "my trips only" filter switch is visible');
      const locator = await tripsPage.getMyTripsOnlySwitch({ timeout: 30000 });
      await expect(locator, '[Trips.verifyMyTripsOnlySwitchVisible] "my trips only" filter switch was not visible in the trips filter panel')
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        '[Trips.verifyMyTripsOnlySwitchVisible] Failed to verify "my trips only" switch visibility. Original: ' + err.message
      );
    }
  },

  async verifyMyTripsOnlySwitchOff(page) {
    if (!page) throw new Error('[Trips.verifyMyTripsOnlySwitchOff] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying "my trips only" filter switch is off');
      const locator = await tripsPage.getMyTripsOnlySwitch({ timeout: 30000 });
      // my-trips.ts turns this filter OFF as the page settles, even when the URL
      // asked for it (see loadData) — the Home page's "All trips" link does exactly
      // that. Off is therefore the documented default, not an accident.
      await expect(locator, '[Trips.verifyMyTripsOnlySwitchOff] "my trips only" filter was expected to be OFF by default, but the el-switch carries the "is-checked" class')
        .not.toHaveClass(/is-checked/, { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        '[Trips.verifyMyTripsOnlySwitchOff] Failed to verify the "my trips only" switch state. Original: ' + err.message
      );
    }
  },

  /**
   * Turns the "my trips only" switch on or off.
   *
   * @param {import('@playwright/test').Page} page
   * @param {boolean} on - desired state
   * @returns {Promise<{ on: boolean, alreadyInState: boolean }>} the requested state
   *   and whether the switch was already in it (i.e. this call changed nothing).
   */
  async setMyTripsOnlyFilter(page, on) {
    if (!page) throw new Error('[Trips.setMyTripsOnlyFilter] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Setting the "my trips only" filter', { on });
      const { alreadyInState } = await tripsPage.setMyTripsOnlySwitch(on);
      if (alreadyInState) {
        // Surfaced rather than swallowed: this step changed nothing, so an assertion
        // that depends on the filter flipping here would pass for the wrong reason.
        logger.warn(
          `[Trips.setMyTripsOnlyFilter] The "my trips only" filter was ALREADY ${on ? 'on' : 'off'} — this step changed nothing. Any assertion that depends on it flipping here may pass for the wrong reason.`
        );
      }
      // Returned, not just logged: a caller that needs the toggle to have actually
      // flipped can only check that if the no-op case reaches it.
      return { on, alreadyInState };
    } catch (err) {
      throw new Error(
        `[Trips.setMyTripsOnlyFilter] Failed to turn the "my trips only" filter ${on ? 'on' : 'off'}. Original: ${err.message}`
      );
    }
  },

  /**
   * Selects a quick view in the trips filter rail.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} label - visible quick-view label, e.g. "Past trips"
   */
  async selectQuickView(page, label) {
    if (!page) throw new Error('[Trips.selectQuickView] page is required');
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[Trips.selectQuickView] "label" must be a non-empty string, got: ' + typeof label);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Selecting trips quick view', { label });
      await tripsPage.selectQuickView(label);
    } catch (err) {
      throw new Error(
        `[Trips.selectQuickView] Failed to select the "${label}" quick view on the trips page. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip with the given id IS listed on the trips page.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} tripId
   */
  async verifyTripListed(page, tripId) {
    if (!page) throw new Error('[Trips.verifyTripListed] page is required');
    if (typeof tripId !== 'string' || tripId.length === 0) {
      throw new Error('[Trips.verifyTripListed] "tripId" must be a non-empty string, got: ' + typeof tripId);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trip is listed on the trips page', { tripId });
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
      await expect(tripsPage.getTripCardId(tripId), `[Trips.verifyTripListed] Expected trip "${tripId}" to be listed on the trips page, but no card showed that id.`)
        .toHaveCount(1, { timeout: 30000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripListed] Failed to verify trip "${tripId}" is listed. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip with the given id is NOT listed on the trips page.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} tripId
   */
  async verifyTripNotListed(page, tripId) {
    if (!page) throw new Error('[Trips.verifyTripNotListed] page is required');
    if (typeof tripId !== 'string' || tripId.length === 0) {
      throw new Error('[Trips.verifyTripNotListed] "tripId" must be a non-empty string, got: ' + typeof tripId);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trip is not listed on the trips page', { tripId });
      // An empty list is the expected end state here, and it is also what the list
      // looks like MID-refresh — so the count is only trustworthy when read from a
      // SETTLED list. Settling is re-checked on every poll rather than once up front:
      // the list starts re-querying only after the filter flips, so a gate placed
      // before the assertion passes on the stale list and the assertion then reads
      // the empty mid-refresh one, which is true of every trip id and proves nothing.
      // The inner timeout is short so the poll takes several samples instead of one.
      await expect(async () => {
        await tripsPage.waitForTripListSettled({ timeout: 5000 });
        expect(
          await tripsPage.getTripCardId(tripId).count(),
          `[Trips.verifyTripNotListed] Expected trip "${tripId}" to be filtered out of the trips page, but a card still showed that id.`
        ).toBe(0);
      }).toPass({ timeout: 30000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripNotListed] Failed to verify trip "${tripId}" is not listed. Original: ${err.message}`
      );
    }
  },

  async verifyMyTripsOnlySwitchOn(page) {
    if (!page) throw new Error('[Trips.verifyMyTripsOnlySwitchOn] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying "my trips only" filter switch is on');
      const locator = await tripsPage.getMyTripsOnlySwitch({ timeout: 30000 });
      // Element Plus marks an el-switch that is on by adding "is-checked" to the
      // root <div class="el-switch">. The nested input[role=switch] also carries
      // aria-checked, but its DOM .checked property is only synced on mount — so
      // neither toBeChecked() nor the input is reliable after a programmatic
      // change (the homepage lands here with myTripsOnly=true in the URL). The
      // root class is bound to the reactive state and is the authoritative marker.
      await expect(locator, '[Trips.verifyMyTripsOnlySwitchOn] "my trips only" filter was expected to be ON by default, but the el-switch is missing the "is-checked" class')
        .toHaveClass(/is-checked/, { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        '[Trips.verifyMyTripsOnlySwitchOn] Failed to verify the "my trips only" switch state. Original: ' + err.message
      );
    }
  },

  /**
   * Types a term into the trips free-text search input. Does not submit — typing
   * only narrows the trips already loaded into the active quick view; submitting
   * is what re-queries the server (see submitTripsSearch).
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
   * Submits the trips search and waits for the refreshed list.
   *
   * Submitting re-asks the SERVER for trips matching the term, so the step is not
   * done when the click lands — every assertion that follows reads the list, and a
   * list read mid-refresh is empty for every search alike. The wait is part of the
   * action rather than each caller's problem.
   *
   * The wait is a best-effort gate, NOT a guarantee: it settles once the loading
   * skeleton has been up and gone, and a check that runs before the skeleton mounts
   * returns against the PREVIOUS results. So it narrows the window but does not
   * close it, and no assertion may lean on it alone — each one re-waits for the
   * state it needs (see verifyTripNotListed for the stronger toPass re-check the
   * absence assertions use).
   *
   * @param {import('@playwright/test').Page} page
   */
  async submitTripsSearch(page) {
    if (!page) throw new Error('[Trips.submitTripsSearch] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Submitting the trips search');
      await tripsPage.submitTripsSearch();
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[Trips.submitTripsSearch] Failed to submit the trips search. The Search button may not be rendered, or the results never settled. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the free-text search input holds no term.
   *
   * Used after a reload: the rebuilt page keeps no search state across a refresh,
   * where the old tabbed page kept a "Search results" tab until it was dismissed.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripsSearchInputEmpty(page) {
    if (!page) throw new Error('[Trips.verifyTripsSearchInputEmpty] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying the trips search input is empty');
      const input = tripsPage.getSearchInput();
      // Visible first: straight after a reload the search row has not rendered, and
      // an unrendered input reads as empty for any prior search at all.
      await expect(input, '[Trips.verifyTripsSearchInputEmpty] The trips search input never rendered, so "it is empty" proves nothing. The page may still be loading.')
        .toBeVisible({ timeout: 30000 });
      await expect(input, '[Trips.verifyTripsSearchInputEmpty] Expected the trips search input to be cleared, but it still held a term. A page refresh should discard the search.')
        .toHaveValue('', { timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyTripsSearchInputEmpty] Failed to verify the trips search input is empty. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the filter rail offers the quick view with the given label.
   *
   * Checks only that the view is on offer — selecting it would re-query the list.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} label - visible quick-view label, e.g. "Upcoming trips"
   */
  async verifyQuickViewDisplayed(page, label) {
    if (!page) throw new Error('[Trips.verifyQuickViewDisplayed] page is required');
    if (typeof label !== 'string' || label.length === 0) {
      throw new Error('[Trips.verifyQuickViewDisplayed] "label" must be a non-empty string, got: ' + typeof label);
    }
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips quick view is displayed', { label });
      const view = await tripsPage.getQuickViewByLabel(label, { timeout: 30000 });
      await expect(view, `[Trips.verifyQuickViewDisplayed] Expected the "${label}" quick view to be offered in the trips filter rail, but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifyQuickViewDisplayed] Failed to verify the "${label}" quick view. Original: ${err.message}`
      );
    }
  },

  /**
   * REMOVED FROM THE PRODUCT — always throws.
   *
   * AB#82671 rebuilt the trips page: the search input left the filter rail for the
   * main column and lost the el-dropdown that wrapped it, so there is no longer a
   * suggestions popper to open and no "expand your search" row inside one. Failing
   * at once, and saying why, beats a 15-second timeout on a selector that can
   * never match again.
   *
   * A scenario still calling either of these needs rewriting against the rebuilt
   * UI — type a term and submit it — not a new selector.
   */
  async verifyTripsSearchSuggestionsDisplayed(page) {
    throw new Error(
      '[Trips.verifyTripsSearchSuggestionsDisplayed] The trips search suggestions dropdown no longer exists: AB#82671 replaced the el-dropdown search with a plain input plus a Search button (my-trips.vue). Rewrite the scenario to type a term and submit it.'
    );
  },

  /** @see verifyTripsSearchSuggestionsDisplayed — same removal, same rewrite. */
  async verifyTripsSearchOffersExpand(page) {
    throw new Error(
      '[Trips.verifyTripsSearchOffersExpand] The "Click here to expand your search" option no longer exists: AB#82671 removed the search suggestions dropdown that held it (my-trips.vue). Submitting the search is now the only way to run it.'
    );
  },

  /** @see verifyTripsSearchSuggestionsDisplayed — same removal, same rewrite. */
  async expandTripsSearch(page) {
    throw new Error(
      '[Trips.expandTripsSearch] There is no "expand your search" option to click: AB#82671 removed the search suggestions dropdown (my-trips.vue). Use the "I submit the trips search" step instead.'
    );
  },

  /**
   * Verifies the trip list header contains the expected text.
   *
   * AB#82671 replaced the old "Found N trip(s)" line with the list panel's
   * "Showing N trips" count — scenarios written against the old wording need their
   * expected text updated.
   *
   * The header renders as a word + a bold count + "trip"/"trips" across separate
   * inline nodes, so whitespace and casing around them are not reliable. Both the
   * actual and expected text are stripped of all whitespace and lower-cased before
   * the contains check.
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
   * the search results with no matching status — the list keeps only trips whose
   * status is in the selection, so an empty selection keeps none (trip.service.ts
   * -> selectedFilterStatus?.includes(trip.StateName)).
   *
   * Not the same as the rail's "Reset Filters": that restores the defaults, which
   * are every status except Cancelled, and so shows trips rather than none.
   *
   * @param {import('@playwright/test').Page} page
   */
  async clearAllTripsFilters(page) {
    if (!page) throw new Error('[Trips.clearAllTripsFilters] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Clearing all trips filters');
      await tripsPage.uncheckAllStatusFilterOptions();
    } catch (err) {
      throw new Error(
        `[Trips.clearAllTripsFilters] Failed to clear all trips filters. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies the trip list shows the no-results message.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifyTripsSearchNoResults(page) {
    if (!page) throw new Error('[Trips.verifyTripsSearchNoResults] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying trips search displays no results');
      // Settle first: mid-refresh the list is empty for every search alike, so the
      // no-results block read too early proves nothing about THIS one.
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
      const noResults = await tripsPage.getSearchNoResults({ timeout: 30000 });
      await expect(noResults, '[Trips.verifyTripsSearchNoResults] Expected the trip list to show the "No results found" message, but it was not visible — the search returned trips.')
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
   * Waits for a trip to show a status label in the trips search results, re-submitting the search
   * between checks. The trips list lags behind approval decisions: straight after a decline the
   * trip is still listed as "In Approvals" for a few minutes, while the cart already reads it as
   * declined. The current search term is re-submitted as-is, so search for the trip first.
   *
   * @param {import('@playwright/test').Page} page
   * @param {string} tripId - the trip id the search was made for
   * @param {string} status - visible status label, e.g. "Declined"
   * @param {{ pollIntervalMs?: number, timeoutMs?: number }} [options]
   * @returns {Promise<{ tripId: string, status: string, attempts: number }>}
   */
  async waitForTripStatusInSearchResults(page, tripId, status, { pollIntervalMs = 15000, timeoutMs = 300000 } = {}) {
    if (!page) throw new Error('[Trips.waitForTripStatusInSearchResults] page is required');
    if (typeof tripId !== 'string' || tripId.length === 0) {
      throw new Error('[Trips.waitForTripStatusInSearchResults] "tripId" must be a non-empty string, got: ' + typeof tripId);
    }
    if (typeof status !== 'string' || status.length === 0) {
      throw new Error('[Trips.waitForTripStatusInSearchResults] "status" must be a non-empty string, got: ' + typeof status);
    }
    for (const [name, value] of Object.entries({ pollIntervalMs, timeoutMs })) {
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`[Trips.waitForTripStatusInSearchResults] "${name}" must be a positive integer, got: ${value}`);
      }
    }

    const tripsPage = getPageObject(page, TripsPage);
    logger.info('Waiting for the trip to show the status in the trips search results', { tripId, status, timeoutMs });
    const startedAt = Date.now();
    let attempts = 0;

    try {
      await expect
        .poll(
          async () => {
            attempts++;
            // expect.poll propagates a thrown callback instead of retrying it, so a missing label
            // (list not updated yet) or a refresh caught mid-render is reported as "not yet".
            try {
              if (attempts > 1) {
                logger.debug('Status not shown yet — re-submitting the trips search', { tripId, status, attempts });
                await tripsPage.submitTripsSearch();
                await tripsPage.waitForTripListSettled({ timeout: 30000 });
              }
              // Scoped to the trip's own card: the user keeps declined trips from earlier runs,
              // so a "Declined" label anywhere in the list proves nothing about this trip.
              await tripsPage.getResultTripStatusLabel(tripId, status, { timeout: 5000 });
              return true;
            } catch {
              return false;
            }
          },
          {
            message: `Trip ${tripId} should show the "${status}" status in the trips search results`,
            intervals: [pollIntervalMs],
            timeout: timeoutMs,
          }
        )
        .toBe(true);
    } catch (err) {
      throw new Error(
        `[Trips.waitForTripStatusInSearchResults] Trip ${tripId} did not show the "${status}" status in the trips search ` +
        `results after ${attempts} attempt(s) over ${Date.now() - startedAt}ms. Original: ${err.message}`
      );
    }

    logger.info('Trip shows the status in the trips search results', { tripId, status, attempts });
    return { tripId, status, attempts };
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
   * Verifies the search left a non-empty trip list behind.
   *
   * The list element renders whether or not it holds cards, so the cards are
   * asserted too — otherwise a search that matched nothing would pass this check.
   *
   * @param {import('@playwright/test').Page} page
   */
  async verifySearchResultsTripListDisplayed(page) {
    if (!page) throw new Error('[Trips.verifySearchResultsTripListDisplayed] page is required');
    const tripsPage = getPageObject(page, TripsPage);
    try {
      logger.debug('Verifying the search results display a trip list');
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
      const list = await tripsPage.getSearchResultsTripList({ timeout: 30000 });
      await expect(list, '[Trips.verifySearchResultsTripListDisplayed] Expected the search to render a trip list, but it was not visible — the search returned no trips at all.')
        .toBeVisible({ timeout: 10000 });
      const cards = tripsPage.getSearchResultsTripCardsLocator();
      await expect(cards.first(), '[Trips.verifySearchResultsTripListDisplayed] The trip list rendered but contained no trip cards — the search returned zero trips.')
        .toBeVisible({ timeout: 15000 });
    } catch (err) {
      if (err.matcherResult !== undefined) throw err;
      throw new Error(
        `[Trips.verifySearchResultsTripListDisplayed] Failed to verify the search-results trip list. Original: ${err.message}`
      );
    }
  },

  /**
   * Verifies a trip in the search results lists the given traveller among its
   * passengers.
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
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
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
      // is missing" is trivially true. Require a settled, non-empty result set
      // first so the assertion can only pass because THIS traveller was filtered out.
      await tripsPage.waitForTripListSettled({ timeout: 30000 });
      const list = await tripsPage.getSearchResultsTripList({ timeout: 30000 });
      await expect(list, `[Trips.verifySearchResultsDoNotShowTraveller] Expected the search to render a trip list before checking that "${traveller}" is absent, but it was not visible.`)
        .toBeVisible({ timeout: 10000 });
      const cards = tripsPage.getSearchResultsTripCardsLocator();
      await expect(cards.first(), `[Trips.verifySearchResultsDoNotShowTraveller] The search returned NO trips at all, so the absence of "${traveller}" proves nothing about the filter. Expected a non-empty result set.`)
        .toBeVisible({ timeout: 15000 });

      const names = tripsPage.getResultTripsForTravellerLocator(traveller);
      await expect(names, `[Trips.verifySearchResultsDoNotShowTraveller] Expected no trip in the search results to list the traveller "${traveller}", but at least one did. The "My trips only" filter should have excluded other travellers' trips.`)
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
   * @returns {Promise<{ filterLabel: string, alreadyChecked: boolean }>} the filter
   *   acted on and whether it was already ticked (i.e. this call changed nothing).
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
      const result = { filterLabel, alreadyChecked };
      if (alreadyChecked) {
        // Surfaced rather than swallowed: "My trips only" is on by default for
        // some accounts (see verifyMyTripsOnlySwitchOn), so this step can be
        // a no-op and any assertion that follows would pass for the wrong reason.
        logger.warn(
          `[Trips.checkTripsFilter] The "${filterLabel}" filter was ALREADY checked — this step changed nothing. Any assertion that depends on the filter turning on here may pass for the wrong reason.`
        );
      }
      return result;
    } catch (err) {
      throw new Error(
        `[Trips.checkTripsFilter] Failed to check the "${filterLabel}" filter on the trips page. Original: ${err.message}`
      );
    }
  },
};

module.exports = Trips;
