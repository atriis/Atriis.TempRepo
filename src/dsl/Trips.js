const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const MenuPage = require("@pages/MenuPage");
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
};

module.exports = Trips;
