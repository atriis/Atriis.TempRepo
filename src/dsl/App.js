const { getPageObject } = require("@utils/pageObjectCache");
const LoginPage = require("@pages/LoginPage");
const LogoutPage = require("@pages/LogoutPage");
const MenuPage = require("@pages/MenuPage");

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
const App = {
  /**
   * Logs the user into the application.
   * - Waits for the login form
   * - Fills email and password
   * - Submits
   * - Waits until the menu shows the logout icon (meaning login worked)
   */
  async loginAs(page, { email, password }) {
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

    // We wait for a new tab/page to open while clicking the UI button.
    const [newTripPage] = await Promise.all([
      page.context().waitForEvent("page"),
      menuPage.clickBookANewTrip(),
    ]);

    // Wait for the new trip page to fully load with network idle and extended timeout
    // CI/CD environments need more time for the booking form to initialize
    await newTripPage.waitForLoadState("networkidle", { timeout: 60000 });
    return newTripPage;
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
