const { getPageObject } = require("@utils/pageObjectCache");
const LoginPage = require("@pages/LoginPage");
const HomePage = require("@pages/HomePage");
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
   * @param {import('playwright').Page} page
   * @param {string} productName
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

    try {
      await loginPage.acceptCookiesIfPresent(5000);

      if (config.isRail) {
        await homePage.openRailProduct();
      } else if (await homePage.isProductTileVisible(productName, 2000)) {
        await homePage.clickProductTile(productName);
      } else {
        await homePage.openMoreProductsMenu();
        await homePage.clickMoreMenuProduct(productName);
      }

      // Every product opens a trip page under /trips/<id>/<product> (Manual Quote too).
      await page.waitForURL(/\/trips\/\d+/, { timeout: 30000 });
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
   * Returns to the homepage by clicking the side-nav "Home Page" link and waiting for the
   * product carousel to render.
   *
   * @param {import('playwright').Page} page
   */
  async navigateBackToHomepage(page) {
    if (!page) throw new Error('[Homepage.navigateBackToHomepage] page is required');
    logger.info('Navigating back to the homepage');
    const homePage = getPageObject(page, HomePage);
    try {
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
