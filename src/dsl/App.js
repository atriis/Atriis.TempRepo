const { getPageObject } = require("@utils/pageObjectCache");
const { launchBrowser } = require("@utils/browserFactory");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const MenuPage = require("@pages/MenuPage");
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
async function performLogin(page, { email, password }) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (!email || typeof email !== 'string') {
    throw new Error('email must be a non-empty string');
  }
  
  if (!password || typeof password !== 'string') {
    throw new Error('password must be a non-empty string');
  }
  
  const loginPage = getPageObject(page, LoginPage);
  const menuPage = getPageObject(page, MenuPage);

  await loginPage.waitForLoginPage();
  await loginPage.fillEmail(email);
  await loginPage.fillPassword(password);
  await loginPage.clickLoginButton();

  // Keep as-is: app needs time to finish authentication and loading
  await page.waitForLoadState("networkidle", { timeout: 60000 });

  await menuPage.waitForLogoutIcon();
}

async function createSession(userConfig) {
  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: config.viewport,
    screen: config.viewport,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await performLogin(page, userConfig);

  return { browser, context, page };
}

const App = {
  /**
   * Logs in with a supported label-based user key.
   *
   * @param {string} userKey - e.g. 'eli'
   */
  async loginAsUser(userKey) {
    const { userConfig } = config.resolveUser(userKey);
    logger.info(`Resolved user label "${userKey}"`);
    return createSession(userConfig);
  },

  /**
   * Logs in with a supported label-based user key, then starts a new trip.
   *
   * @param {string} userKey - e.g. 'eli'
   */
  async loginAsUserAndBookANewTrip(userKey) {
    const { userConfig } = config.resolveUser(userKey);
    logger.info(`Resolved user label "${userKey}"`);
    const session = await createSession(userConfig);
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
};

module.exports = App;
