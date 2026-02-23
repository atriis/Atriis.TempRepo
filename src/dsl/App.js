const { getPageObject } = require("@utils/pageObjectCache");
const { launchBrowser } = require("@utils/browserFactory");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const MenuPage = require("@pages/MenuPage");
const config = require("@config/config");

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

const App = {
  /**
   * Logs in with provider/user and returns a ready session.
   *
   * @param {string} provider
   * @param {string} user
   * @returns {Promise<{browser: import('@playwright/test').Browser, context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page}>}
   */
  async login(provider, user) {
    if (!provider || typeof provider !== "string") {
      throw new Error("provider must be a non-empty string");
    }

    if (!user || typeof user !== "string") {
      throw new Error("user must be a non-empty string");
    }

    const userConfig = config.users?.[provider]?.[user];
    if (!userConfig) {
      throw new Error(`User not found in config: ${provider}.${user}`);
    }

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
  },

  /**
   * Logs in with provider/user and starts a new trip in a fresh tab.
   *
   * @param {string} provider
   * @param {string} user
   * @returns {Promise<{browser: import('@playwright/test').Browser, context: import('@playwright/test').BrowserContext, page: import('@playwright/test').Page}>}
   */
  async loginAndBookANewTrip(provider, user) {
    if (!provider || typeof provider !== "string") {
      throw new Error("provider must be a non-empty string");
    }

    if (!user || typeof user !== "string") {
      throw new Error("user must be a non-empty string");
    }

    const userConfig = config.users?.[provider]?.[user];
    if (!userConfig) {
      throw new Error(`User not found in config: ${provider}.${user}`);
    }

    const browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: config.viewport,
      screen: config.viewport,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    await page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
    await performLogin(page, userConfig);

    const newTripPage = await App.bookANewTrip(page);
    return { browser, context, page: newTripPage };
  },

  /**
   * Opens the "Book a New Trip" flow in a separate tab.
   * Returns the newly opened tab (new Playwright page object).
   */
  async bookANewTrip(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const menuPage = getPageObject(page, MenuPage);

    await menuPage.waitForBookANewTripIcon();

    // Validate that context exists
    const context = page.context();
    if (!context) {
      throw new Error('Page context is null or undefined');
    }

    // We wait for a new tab/page to open while clicking the UI button.
    // Use Promise.race with timeout to avoid hanging indefinitely in CI
    try {
      const newPagePromise = context.waitForEvent("page", { timeout: 60000 });
      const clickPromise = menuPage.clickBookANewTrip();
      
      const [newTripPage] = await Promise.all([newPagePromise, clickPromise]);

      // Wait for the new trip page to fully load with network idle and extended timeout
      // CI/CD environments need more time for the booking form to initialize
      await newTripPage.waitForLoadState("networkidle", { timeout: 60000 });
      return newTripPage;
    } catch (error) {
      throw new Error(
        `Failed to open new trip page: ${error.message}\n` +
        `Context state: ${context ? 'valid' : 'null'}\n` +
        `This usually means the "Book a New Trip" button did not open a new tab.`
      );
    }
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
};

module.exports = App;
