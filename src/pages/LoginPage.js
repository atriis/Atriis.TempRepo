/**
 * Page Object for login page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  EMAIL_INPUT: "#email",
  PASSWORD_INPUT: "#psw",
  LOGIN_BUTTON: "#resetText",
  FORGOT_PASSWORD_TEXT: "#forgotPsw",
  // Login failure banner. The login screen is the standalone (non-Vue) app, so this is
  // Bootstrap's .text-danger — NOT Bulma's .has-text-danger used inside Atriis.OBT.
  // :visible guards against an empty/hidden placeholder node winning .first().
  LOGIN_ERROR_MESSAGE: ".text-danger:visible",
  // CookieHub consent banner — "Allow all cookies" button.
  // Covers both the default id (#ch2-allow-all-btn) and the role-based fallback.
  COOKIE_ALLOW_ALL_BUTTON:
    '#ch2-allow-all-btn, button:has-text("Allow all cookies"), button:has-text("Allow all"), button:has-text("Accept all")',
};

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

  /**
   * Reads the login failure message shown after a rejected sign-in attempt.
   * Whitespace is normalized so the caller can compare against a single-line expectation.
   *
   * @param {number} [timeout=30000] - Max wait for the message to render
   * @returns {Promise<string>} The normalized error text
   */
  async getLoginErrorMessage(timeout = 30000) {
    const errorMessage = this.page.locator(SELECTORS.LOGIN_ERROR_MESSAGE).first();

    try {
      await errorMessage.waitFor({ state: "visible", timeout });
    } catch (error) {
      throw new Error(
        `[LoginPage.getLoginErrorMessage] No login error message ("${SELECTORS.LOGIN_ERROR_MESSAGE}") ` +
        `became visible within ${timeout}ms. The login attempt may have succeeded instead of failing, ` +
        `or the login page did not submit the form. Original: ${error.message}`
      );
    }

    const text = (await errorMessage.textContent()) || "";
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Best-effort dismissal of the CookieHub consent banner if it appears.
   * Returns true when a banner was found and accepted, false otherwise.
   * Never throws — the banner is environment-dependent and may not appear.
   * @param {number} [timeout=3000] - Max wait for the banner to appear
   * @returns {Promise<boolean>}
   */
  async acceptCookiesIfPresent(timeout = 3000) {
    try {
      const button = this.page.locator(SELECTORS.COOKIE_ALLOW_ALL_BUTTON).first();
      await button.waitFor({ state: "visible", timeout });
      await button.click();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = LoginPage;
