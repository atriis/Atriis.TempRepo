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
    const loginPage = new LoginPage(page);
    const menuPage = new MenuPage(page);

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
    const menuPage = new MenuPage(page);

    await menuPage.waitForBookANewTripIcon();

    // We wait for a new tab/page to open while clicking the UI button.
    const [newTripPage] = await Promise.all([
      page.context().waitForEvent("page"),
      menuPage.clickBookANewTrip(),
    ]);

    await newTripPage.waitForLoadState();
    return newTripPage;
  },

  /**
   * Logs out the user and confirms we are back on the login page.
   */
  async logout(page) {
    const menuPage = new MenuPage(page);
    const loginPage = new LoginPage(page);
    const logoutPage = new LogoutPage(page);

    await menuPage.waitForLogoutIcon();
    await menuPage.clickLogout();

    // Confirms logout message is shown
    await logoutPage.waitForLogoutSuccessMessage();

    // Confirms login screen is visible again
    await loginPage.waitForgotPasswordText();
  },
};

module.exports = App;
