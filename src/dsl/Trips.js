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
};

module.exports = Trips;
