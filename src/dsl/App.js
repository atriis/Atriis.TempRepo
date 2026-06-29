const { getPageObject } = require("@utils/pageObjectCache");
const { launchBrowser } = require("@utils/browserFactory");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const MenuPage = require("@pages/MenuPage");
const QuickLinksPage = require("@pages/QuickLinksPage");
const { CommonPage } = require("@pages/CommonPage");
const config = require("@config/config");
const logger = require("@utils/logger").child("App");

/**
 * App (Application Facade)
 *
 * This file contains actions that span multiple pages/screens.
 * It represents "what the user does in the application", like:
 * - log in
 * - open a new trip (new tab)
 * - log out
 *
 * These are not single UI clicks; they are complete workflows.
 */

/**
 * Helper function to perform login on an existing page.
 * - Waits for the login form
 * - Fills email and password
 * - Submits
 * - Waits until the menu shows the logout icon (meaning login worked)
 */
async function performLogin(page, email) {
  if (!page) {
    throw new Error('page is required');
  }

  if (!email || typeof email !== 'string') {
    throw new Error('email must be a non-empty string, got: ' + typeof email);
  }

  const loginPage = getPageObject(page, LoginPage);
  const menuPage = getPageObject(page, MenuPage);

  await loginPage.waitForLoginPage();
  // Cookie consent banner may overlay the login form — dismiss if present.
  await loginPage.acceptCookiesIfPresent();
  await loginPage.fillEmail(email);
  await loginPage.fillPassword(config.password);
  await loginPage.clickLoginButton();

  // Keep as-is: app needs time to finish authentication and loading
  await page.waitForLoadState("networkidle", { timeout: 60000 });

  // Banner may re-appear on the post-login domain — dismiss if present.
  await loginPage.acceptCookiesIfPresent();

  await menuPage.waitForLogoutIcon();
}

async function createSession(email) {
  const { browser, context, page } = await App.createBrowserSession();
  await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await performLogin(page, email);
  return { browser, context, page };
}

const App = {
  /**
   * Creates a browser session (browser + context + page) without navigating or logging in.
   * Use this when you need this.page assigned before the login attempt, so that
   * failures during login still produce a screenshot in the After hook.
   */
  async createBrowserSession() {
    const browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: config.viewport,
      screen: config.viewport,
      ignoreHTTPSErrors: true,
    });

    // In CI, record a Playwright trace for the whole session (covers login, the
    // new-trip tab, and every step). The After hook exports it on failure so we
    // can see exactly which step got stuck instead of guessing from a screenshot.
    if (process.env.CI) {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    }

    const page = await context.newPage();
    return { browser, context, page };
  },

  /**
   * Navigates to the app and logs in on an already-open page.
   *
   * @param {import('playwright').Page} page
   * @param {string} email
   */
  async login(page, email) {
    if (!page) throw new Error('page is required');
    await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
    await performLogin(page, email);
  },

  /**
   * Logs in using an email address directly.
   *
   * @param {string} email - e.g. 'ruimariano@amadeus.com'
   */
  async loginAsUser(email) {
    logger.info(`Logging in as "${email}"`);
    return createSession(email);
  },

  /**
   * Logs in using an email address, then starts a new trip.
   *
   * @param {string} email - e.g. 'ruimariano@amadeus.com'
   */
  async loginAsUserAndBookANewTrip(email) {
    logger.info(`Logging in as "${email}"`);
    const session = await createSession(email);
    const newTripPage = await App.bookANewTrip(session.page);
    return { ...session, page: newTripPage };
  },

  /**
   * Opens the "Book a New Trip" flow.
   * Tries to catch a new tab; if no new tab opens within 10s,
   * assumes the trip opened in the current tab and returns it.
   */
  async bookANewTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const menuPage = getPageObject(page, MenuPage);
    const loginPage = getPageObject(page, LoginPage);

    // Cookie consent banner can appear on the post-login domain after a short
    // delay and overlays the "Book a New Trip" icon. Dismiss before clicking.
    await loginPage.acceptCookiesIfPresent(8000);

    await menuPage.waitForBookANewTripIcon();

    const context = page.context();
    if (!context) {
      throw new Error('Page context is null or undefined');
    }

    // Try to detect a new tab opening; fall back to same tab if none opens
    const newPagePromise = context.waitForEvent("page", { timeout: 10000 }).catch(() => null);
    await menuPage.clickBookANewTrip();

    const newTripPage = await newPagePromise;

    if (newTripPage) {
      logger.info("New trip opened in a new tab");
      await newTripPage.waitForLoadState("networkidle", { timeout: 60000 });
      const newTripLoginPage = getPageObject(newTripPage, LoginPage);
      await newTripLoginPage.acceptCookiesIfPresent(5000);
      return newTripPage;
    }

    // No new tab — trip opened in current tab
    logger.info("New trip opened in current tab (no new tab detected)");
    await page.waitForLoadState("networkidle", { timeout: 60000 });
    return page;
  },

  /**
   * Logs out the user and confirms we are back on the login page.
   */
  async logout(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const menuPage = getPageObject(page, MenuPage);
    const loginPage = getPageObject(page, LoginPage);
    const logoutPage = getPageObject(page, LogoutPage);

    await menuPage.waitForLogoutIcon();
    await menuPage.clickLogout();

    // Confirms logout message is shown
    await logoutPage.waitForLogoutSuccessMessage();

    // Confirms login screen is visible again
    await loginPage.waitForgotPasswordText();
  },

  /**
   * Verifies a heading containing the expected text is visible.
   * Useful for localized welcome screens where the heading also includes the user name.
   */
  async isHeadingContainingTextVisible(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const commonPage = getPageObject(page, CommonPage);
    return commonPage.isHeadingContainingTextVisible(expectedText, { timeout: 30000 });
  },

  /**
   * Switches the application display language from the header language menu.
   *
   * This flow:
   * - hovers the language (globe) icon to open the language list
   * - clicks the requested language by name
   *
   * Verification of the resulting localized UI is left to the calling step.
   *
   * @param {import('playwright').Page} page
   * @param {string} languageName - The language as shown in the list (e.g. "Italian", "English")
   */
  async switchLanguage(page, languageName) {
    if (!page) throw new Error('page is required');
    if (!languageName || typeof languageName !== 'string') {
      throw new Error('languageName must be a non-empty string, got: ' + typeof languageName);
    }

    logger.debug('Switching application language', { languageName });

    const menuPage = getPageObject(page, MenuPage);
    await menuPage.hoverLanguageIcon();
    await menuPage.clickLanguageOption(languageName);
  },

  /**
   * Hovers the Quick Links nav item in the sidebar menu to reveal the
   * product card tooltip on the homepage.
   * @param {import('playwright').Page} page
   */
  async hoverQuickLinkProductCard(page) {
    if (!page) throw new Error('[App.hoverQuickLinkProductCard] page is required');
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
        `[App.hoverQuickLinkProductCard] Failed to hover quick link nav item and reveal tooltip. Original: ${err.message}`
      );
    }
  },

  /**
   * Reads the image src from the quick link product card tooltip.
   * @param {import('playwright').Page} page
   * @returns {Promise<string|null>}
   */
  async getQuickLinkCardImageSrc(page) {
    if (!page) throw new Error('[App.getQuickLinkCardImageSrc] page is required');
    logger.debug('Getting quick link card image src from tooltip');
    try {
      const quickLinksPage = getPageObject(page, QuickLinksPage);
      const src = await quickLinksPage.getFirstQuickLinkImageSrc();
      logger.debug('Quick link card image src', { src: src ? src.substring(0, 60) + '...' : src });
      return src;
    } catch (err) {
      throw new Error(
        `[App.getQuickLinkCardImageSrc] Failed to read image src from quick link card tooltip. Original: ${err.message}`
      );
    }
  },

  /**
   * Reloads the current page. Centralized here so retries, post-reload
   * waits, or instrumentation can be added in one place.
   * @param {import('playwright').Page} page
   * @returns {Promise<{refreshed: true}>}
   */
  async refreshPage(page) {
    if (!page) throw new Error('page is required');
    logger.info('Refreshing current page');
    await page.reload({ waitUntil: 'load' });
    return { refreshed: true };
  },
};

module.exports = App;
