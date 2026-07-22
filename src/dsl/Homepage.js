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
