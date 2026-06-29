const { getPageObject } = require('@utils/pageObjectCache');
const QuickLinksPage = require('@pages/QuickLinksPage');
const LoginPage = require('@pages/LoginPage');
const logger = require('@utils/logger').child('Shell-DSL');

const Shell = {
  async hoverQuickLinkProductCard(page) {
    if (!page) throw new Error('[Shell.hoverQuickLinkProductCard] page is required');
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
        `[Shell.hoverQuickLinkProductCard] Failed to hover quick link nav item and reveal tooltip. Original: ${err.message}`
      );
    }
  },

  async getQuickLinkCardImageSrc(page) {
    if (!page) throw new Error('[Shell.getQuickLinkCardImageSrc] page is required');
    logger.debug('Getting quick link card image src from tooltip');
    try {
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      const src = await quickLinksPage.getFirstQuickLinkImageSrc();
      logger.debug('Quick link card image src', { src: src ? src.substring(0, 60) + '...' : src });
      return src;
    } catch (err) {
      throw new Error(
        `[Shell.getQuickLinkCardImageSrc] Failed to read image src from quick link card tooltip. Original: ${err.message}`
      );
    }
  },
};

module.exports = Shell;
