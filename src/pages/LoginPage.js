// Centralized selectors for easy maintenance
const SELECTORS = {
  EMAIL_INPUT: "#email",
  PASSWORD_INPUT: "#psw",
  LOGIN_BUTTON: "#resetText",
  FORGOT_PASSWORD_TEXT: "#forgotPsw",
};

/**
 * LoginPage
 *
 * Low-level UI actions on the login screen.
 * This file should be quiet (no heavy logs).
 */
class LoginPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the email input element.
   * @returns {import('@playwright/test').Locator}
   */
  getEmailInput() {
    return this.page.locator(SELECTORS.EMAIL_INPUT);
  }

  /**
   * Gets the password input element.
   * @returns {import('@playwright/test').Locator}
   */
  getPasswordInput() {
    return this.page.locator(SELECTORS.PASSWORD_INPUT);
  }

  /**
   * Waits for the login page fields to be visible.
   * This confirms the login form is ready to use.
   */
  async waitForLoginPage() {
    await this.page.waitForLoadState("networkidle");
    await this.getEmailInput().waitFor({ state: "visible" });
    await this.getPasswordInput().waitFor({ state: "visible" });
  }

  /**
   * Waits for "Forgot password?" text.
   * Used after logout to confirm we are back on the login page.
   */
  async waitForgotPasswordText() {
    await this.page.waitForSelector(SELECTORS.FORGOT_PASSWORD_TEXT, { state: "visible" });
  }

  /** Types email into the email field */
  async fillEmail(email) {
    await this.getEmailInput().fill(email);
  }

  /** Types password into the password field */
  async fillPassword(password) {
    await this.getPasswordInput().fill(password);
  }

  /**
   * Clicks the login button.
   * Uses noWaitAfter to avoid waiting for navigation here,
   * since App.loginAs handles the navigation wait explicitly.
   */
  async clickLoginButton() {
    await this.page.click(SELECTORS.LOGIN_BUTTON, { noWaitAfter: true });
  }
}

module.exports = LoginPage;
