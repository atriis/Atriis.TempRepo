// Centralized selectors for easy maintenance
const SELECTORS = {
  EMAIL_INPUT: '#email',
  PASSWORD_INPUT: '#psw',
  LOGIN_BUTTON: '#resetText',
  FORGOT_PASSWORD_TEXT: '#forgotPsw'
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
   * Waits for the login page fields to be visible.
   * This confirms the login form is ready to use.
   */
  async waitForLoginPage() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(SELECTORS.EMAIL_INPUT, { state: 'visible' });
    await this.page.waitForSelector(SELECTORS.PASSWORD_INPUT, { state: 'visible' });
  }

  /**
   * Waits for "Forgot password?" text.
   * Used after logout to confirm we are back on the login page.
   */
  async waitForgotPasswordText() {
    await this.page.waitForSelector(SELECTORS.FORGOT_PASSWORD_TEXT, { state: 'visible' });
  }

  /** Types email into the email field */
  async fillEmail(email) {
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  /** Types password into the password field */
  async fillPassword(password) {
    await this.page.fill(SELECTORS.PASSWORD_INPUT, password);
  }

  /** Clicks the login button */
  async clickLoginButton() {
    await this.page.click(SELECTORS.LOGIN_BUTTON);
  }
}

module.exports = LoginPage;