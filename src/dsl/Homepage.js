const { getPageObject } = require("@utils/pageObjectCache");
const LoginPage = require("@pages/LoginPage");
const { HomePage } = require("@pages/HomePage");
const QuickLinksPage = require("@pages/QuickLinksPage");
const logger = require("@utils/logger").child("Homepage");

/**
 * Homepage DSL
 *
 * High-level actions the user performs on the application homepage
 * (upcoming-trips monitor panel, quick-link product cards, etc.).
 * Describes WHAT the user does on the homepage, not HOW the UI works.
 */
const Homepage = {
  /**
   * Opens the full Trips page by clicking the "All trips" button on the
   * homepage upcoming-trips panel.
   *
   * Confirmation strategy:
   * - Dismiss cookie banner (can overlay homepage controls)
   * - Start waiting for the /trips navigation BEFORE the click to avoid a race
   *   where waitForURL resolves against the already-loaded homepage
   *
   * @param {import('playwright').Page} page
   */
  async clickAllTripsFromHomepage(page) {
    if (!page) throw new Error('[Homepage.clickAllTripsFromHomepage] page is required');
    logger.info('Clicking the "All trips" button on the homepage to open the trips page');

    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);

    try {
      // Cookie consent banner can re-appear on the post-login homepage and
      // intercept pointer events — dismiss before clicking.
      await loginPage.acceptCookiesIfPresent(5000);

      await Promise.all([
        // The homepage button lands on /trips?myTripsOnly=true, so allow a
        // trailing query string (a bare "**/trips" glob would not match it).
        page.waitForURL("**/trips**", { timeout: 30000 }),
        homePage.clickAllTripsButton(),
      ]);
    } catch (err) {
      throw new Error(
        `[Homepage.clickAllTripsFromHomepage] Failed to open the trips page from the homepage "All trips" button. The button may not be visible or the trips navigation timed out. Original: ${err.message}`
      );
    }
  },

  /**
   * Hovers the Quick Links nav item in the sidebar menu to reveal the
   * product card tooltip on the homepage.
   * @param {import('playwright').Page} page
   */
  async hoverQuickLinkProductCard(page) {
    if (!page) throw new Error('[Homepage.hoverQuickLinkProductCard] page is required');
    logger.info('Hovering over quick link nav item to reveal product card tooltip');
    try {
      const loginPage = getPageObject(page, LoginPage);
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      // Cookie banner can re-appear on the post-login page and block pointer events
      await loginPage.acceptCookiesIfPresent(5000);
      await quickLinksPage.hoverQuickLinkNavItem();
      await quickLinksPage.waitForQuickLinkTooltipVisible();
    } catch (err) {
      throw new Error(
        `[Homepage.hoverQuickLinkProductCard] Failed to hover quick link nav item and reveal tooltip. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the "Start New Trip" button is visible on the homepage. Shown for low-product
   * users (2 products or fewer) as the primary booking entry point instead of the product carousel.
   * The business assertion (expect visible) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async isStartNewTripButtonVisible(page) {
    if (!page) throw new Error('[Homepage.isStartNewTripButtonVisible] page is required');
    logger.info('Checking the "Start New Trip" button is visible on the homepage');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    // Cookie banner can re-appear on the post-login homepage and intercept pointer events — dismiss
    // it so it does not overlay the button and skew the visibility check.
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isStartNewTripButtonVisible();
  },

  /**
   * Checks whether a named product's tile is visible on the homepage product carousel.
   * The business assertion (expect visible) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} productName - e.g. "Flight", "Rail", "Transport"
   * @returns {Promise<boolean>}
   */
  async isProductVisibleOnHomepage(page, productName) {
    if (!page) throw new Error('[Homepage.isProductVisibleOnHomepage] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.isProductVisibleOnHomepage] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Checking product tile is visible on the homepage', { productName });
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    // Cookie banner can re-appear on the post-login homepage and overlay the carousel — dismiss it.
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isProductTileVisible(productName);
  },

  /**
   * Opens a product's search page from the homepage carousel.
   *
   * Routing per product:
   * - Rail: the tile is a sub-type dropdown → open it and pick the first sub-type.
   * - Directly-visible tile (first five products): click it.
   * - Otherwise: open the "more products" menu and click the entry (e.g. Parking, Manual Quote).
   *
   * Confirmation: waits for the trip URL (all products open under /trips/<id>/...).
   *
   * New-tab behaviour: booker / no-corporation users open each product in a NEW browser tab
   * (app: trip.service.createNewTrip → utilService.openNewWindow → window.open), leaving this
   * homepage tab in place; other users navigate in the same tab. Both cases are handled and the
   * page the product opened on is returned so callers can assert / act on it.
   *
   * @param {import('playwright').Page} page - the homepage tab
   * @param {string} productName
   * @returns {Promise<import('playwright').Page>} the tab the product's search page opened on
   */
  async openProductFromHomepage(page, productName) {
    if (!page) throw new Error('[Homepage.openProductFromHomepage] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.openProductFromHomepage] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Opening product from the homepage', { productName });
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    const config = homePage.getProductConfig(productName);
    const context = page.context();

    try {
      // Keep the homepage focused: successive products are all opened from this same tab.
      await page.bringToFront();
      await loginPage.acceptCookiesIfPresent(5000);

      // Arm new-tab detection BEFORE the click so the booker (new tab) case is never missed.
      const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

      if (config.isRail) {
        await homePage.openRailProduct();
      } else if (await homePage.isProductTileVisible(productName, 2000)) {
        await homePage.clickProductTile(productName);
      } else {
        await homePage.openMoreProductsMenu();
        await homePage.clickMoreMenuProduct(productName);
      }

      // Every product opens a trip page under /trips/<id>/<product> (Manual Quote too). Detect
      // whichever settles first: a new tab (booker) OR same-tab navigation (non-booker), so the
      // same-tab path does not pay the full new-tab event timeout.
      const newTab = await Promise.race([
        newPagePromise,
        page.waitForURL(/\/trips\/\d+/, { timeout: 30000 }).then(() => null).catch(() => null),
      ]);
      if (newTab) {
        logger.info('Product opened in a new tab', { productName });
        await newTab.waitForURL(/\/trips\/\d+/, { timeout: 30000 });
        await newTab.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
        await getPageObject(newTab, LoginPage).acceptCookiesIfPresent(5000);
        return newTab;
      }

      // No new tab — the product opened in the current tab.
      logger.info('Product opened in the current tab', { productName });
      await page.waitForURL(/\/trips\/\d+/, { timeout: 30000 });
      return page;
    } catch (err) {
      throw new Error(
        `[Homepage.openProductFromHomepage] Failed to open the "${productName}" product from the homepage and reach its ` +
        `search page. The tile/menu may not have opened, or navigation to the trip page timed out. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the named product's search page is displayed after opening it.
   * Manual Quote opens a separate route (asserted by URL); every other product opens a trip tab
   * (asserted by the active el-tabs item). The business assertion is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} productName
   * @returns {Promise<boolean>}
   */
  async isSearchPageDisplayed(page, productName) {
    if (!page) throw new Error('[Homepage.isSearchPageDisplayed] page is required');
    if (!productName || typeof productName !== 'string') {
      throw new Error(`[Homepage.isSearchPageDisplayed] "productName" must be a non-empty string, got: ${typeof productName}`);
    }
    logger.info('Verifying product search page is displayed', { productName });
    const homePage = getPageObject(page, HomePage);
    const config = homePage.getProductConfig(productName);

    if (config.urlContains) {
      return page.url().includes(config.urlContains);
    }
    return homePage.isProductTabActive(config.tabId);
  },

  /**
   * Returns to the homepage and waits for the product carousel to render.
   *
   * When a product opened in a separate tab (booker flow), the homepage tab never left the
   * homepage — close the product tab and bring the homepage back to the front. Otherwise
   * (same-tab flow) click the side-nav "Home Page" link.
   *
   * @param {import('playwright').Page} page - the homepage tab
   * @param {import('playwright').Page} [productTab] - the tab a product opened on, if separate
   */
  async navigateBackToHomepage(page, productTab) {
    if (!page) throw new Error('[Homepage.navigateBackToHomepage] page is required');
    logger.info('Navigating back to the homepage');
    const homePage = getPageObject(page, HomePage);
    try {
      if (productTab && productTab !== page) {
        await productTab.close().catch(() => {});
        await page.bringToFront();
        await homePage.waitForHomepageReady();
        return;
      }
      await homePage.clickHomeNavIcon();
      await homePage.waitForHomepageReady();
    } catch (err) {
      throw new Error(
        `[Homepage.navigateBackToHomepage] Failed to return to the homepage from the current page. ` +
        `The "Home Page" side-nav link may not have been clickable or the homepage did not render. Original: ${err.message}`
      );
    }
  },

  /**
   * Checks whether the "more products" (more_horiz) button is visible on the homepage carousel.
   * Shown for users with more than five products. The business assertion is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async isMoreProductsButtonVisible(page) {
    if (!page) throw new Error('[Homepage.isMoreProductsButtonVisible] page is required');
    logger.info('Checking the "more products" button is visible on the homepage');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    await loginPage.acceptCookiesIfPresent(5000);
    return homePage.isMoreProductsButtonVisible();
  },

  /**
   * Counts the trips listed under the homepage "My upcoming trips" tab.
   *
   * Selects the upcoming-trips tab first (the trip monitor may default to another tab, e.g. when
   * the account has approvals awaiting), then counts the visible trip cards. The business assertion
   * (expect at least one trip) is made by the calling step.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async getUpcomingTripsCount(page) {
    if (!page) throw new Error('[Homepage.getUpcomingTripsCount] page is required');
    logger.info('Counting trips under the homepage "My upcoming trips" list');
    const loginPage = getPageObject(page, LoginPage);
    const homePage = getPageObject(page, HomePage);
    try {
      // Cookie banner can re-appear on the post-login homepage and intercept the tab click.
      await loginPage.acceptCookiesIfPresent(5000);
      // No upcoming-trips tab means the account has no upcoming trips — an empty list (count 0),
      // which the calling step asserts against, not a page failure.
      const tabPresent = await homePage.selectUpcomingTripsTab();
      if (!tabPresent) return 0;
      return await homePage.getVisibleTripCardCount();
    } catch (err) {
      throw new Error(
        `[Homepage.getUpcomingTripsCount] Failed to read the upcoming-trips list on the homepage. ` +
        `The trip-monitor tabs may not have rendered for this user. Original: ${err.message}`
      );
    }
  },

  /**
   * Reads the image src from the quick link product card tooltip.
   * @param {import('playwright').Page} page
   * @returns {Promise<string|null>}
   */
  async getQuickLinkCardImageSrc(page) {
    if (!page) throw new Error('[Homepage.getQuickLinkCardImageSrc] page is required');
    logger.debug('Getting quick link card image src from tooltip');
    try {
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      const src = await quickLinksPage.getFirstQuickLinkImageSrc();
      logger.debug('Quick link card image src', { src: src ? src.substring(0, 60) + '...' : src });
      return src;
    } catch (err) {
      throw new Error(
        `[Homepage.getQuickLinkCardImageSrc] Failed to read image src from quick link card tooltip. Original: ${err.message}`
      );
    }
  },
};

module.exports = Homepage;
