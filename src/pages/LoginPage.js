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

  // ===== Two-factor (2FA) verification screen (/identity/2fa) =====
  // Shown instead of the homepage when a 2FA-enabled user submits valid credentials. Like the
  // login and logout screens it is served by the auth service (ASP.NET MVC), so it is not in
  // Atriis.App and has no data-testid — these were read off the live staging DOM.
  //
  // Capital C, and NOT the "#code"/"#resetText" ids in the legacy Testim test: that test predates
  // the current identity screen, whose submit button has no id at all.
  //
  // The code field only exists on this screen, so it doubles as the "prompt is displayed" anchor.
  // Deliberately not the "we've emailed you the verification code" heading: that wording is
  // localized and interpolates the user's first name.
  VERIFICATION_CODE_INPUT: "#Code",
  VERIFICATION_SUBMIT_BUTTON: "input[type='submit'].loginButtonSubmit",
  // Validation messages on the 2FA screen ("Code you provided is incorrect or expired.",
  // "Final chance to enter the correct code.") render in the MVC validation summary. Scoped to
  // that container on purpose: the page also carries 27 background-slideshow <li> thumbnails, so
  // a bare "li" matches an <img> thumbnail first. Text-agnostic, because the wording is the value
  // under assertion — anchoring the selector on it would be circular (wrong wording = element
  // never found = opaque timeout instead of a text diff).
  VERIFICATION_MESSAGE: ".validation-summary-errors li",
  // Subtitle paragraph under the login screen's "Welcome back" heading, inside the same
  // ".welcome" wrapper the logout confirmation uses. Text-agnostic for the reason above.
  LOGIN_SUBTITLE: ".welcome p",

  // ===== 90-day password expiry screen =====
  // Staging forces a password change every 90 days. The credentials are still accepted, but the
  // session is parked on a "you are required to change your password every 90 days" form instead of
  // the homepage. Served by the legacy auth site (not in Atriis.App), read off a CI trace.
  // Anchored on the form's hidden IsExpiredPassword flag rather than the visible "New Password"
  // field: the same form also serves the welcome-reset flow (IsWelcomeResetPassword), and the
  // heading wording is localized.
  EXPIRED_PASSWORD_FLAG: 'input#IsExpiredPassword[value="true" i]',
};

/**
 * Waits for the first element matching `selector` that contains `expectedText` and returns its
 * normalized text.
 *
 * When the expected wording never appears, the text currently rendered by the first matching
 * element is returned instead, so the caller's assertion reports a readable text diff rather
 * than an opaque timeout. Only a selector that matches nothing at all is a structural failure
 * and throws.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - A SELECTORS entry
 * @param {string} expectedText - The wording the caller expects to be displayed
 * @param {number} timeout - Max wait for the expected wording to render
 * @param {string} methodName - Calling method, for the error prefix
 * @returns {Promise<string>} The normalized text actually displayed
 */
async function readTextWhenDisplayed(page, selector, expectedText, timeout, methodName) {
  const expected = page.locator(selector).filter({ hasText: expectedText }).first();

  try {
    await expected.waitFor({ state: "visible", timeout });
    const text = (await expected.textContent()) || "";
    return text.replace(/\s+/g, " ").trim();
  } catch (error) {
    const anyMatch = page.locator(selector).first();
    const shown = await anyMatch.textContent().catch(() => null);

    if (shown === null) {
      throw new Error(
        `[LoginPage.${methodName}] No element matching "${selector}" was rendered within ` +
        `${timeout}ms while waiting for "${expectedText}". The screen under test is probably not ` +
        `the one expected — the previous action may not have submitted, or the flow moved on. ` +
        `Original: ${error.message}`
      );
    }

    return shown.replace(/\s+/g, " ").trim();
  }
}

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
   * Waits for the two-factor verification code field, which is the anchor for "the verification
   * code prompt is displayed".
   *
   * @param {number} [timeout=60000] - Max wait for the 2FA screen to render
   */
  async waitForVerificationCodeField(timeout = 60000) {
    try {
      await this.page
        .locator(SELECTORS.VERIFICATION_CODE_INPUT)
        .waitFor({ state: "visible", timeout });
    } catch (error) {
      throw new Error(
        `[LoginPage.waitForVerificationCodeField] The verification code field ` +
        `("${SELECTORS.VERIFICATION_CODE_INPUT}") did not become visible within ${timeout}ms. ` +
        `The user may not have two-factor authentication enabled, or the credentials were ` +
        `rejected before the code screen was reached. Original: ${error.message}`
      );
    }
  }

  /**
   * Types a verification code into the 2FA code field, replacing any previous value.
   * @param {string} code - The code to submit
   */
  async fillVerificationCode(code) {
    await this.page.locator(SELECTORS.VERIFICATION_CODE_INPUT).fill(code);
  }

  /**
   * Submits the entered verification code.
   *
   * No noWaitAfter here (unlike clickLoginButton): submitting is a full form POST that reloads
   * the screen, and the reload must finish before the caller reads the validation message —
   * otherwise the message left over from the previous attempt could be read instead.
   */
  async clickVerificationSubmitButton() {
    await this.page.locator(SELECTORS.VERIFICATION_SUBMIT_BUTTON).first().click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Reads the validation message shown on the 2FA screen after a submitted code is rejected
   * (both the "incorrect or expired" error and the final-attempt warning render here).
   * The expected wording is asserted by the caller.
   *
   * @param {string} expectedText - The wording the caller expects
   * @param {number} [timeout=30000] - Max wait for the message to render
   * @returns {Promise<string>} The normalized message actually displayed
   */
  async getVerificationMessage(expectedText, timeout = 30000) {
    return readTextWhenDisplayed(
      this.page,
      SELECTORS.VERIFICATION_MESSAGE,
      expectedText,
      timeout,
      "getVerificationMessage"
    );
  }

  /**
   * Reads the login screen's subtitle. The expected wording is asserted by the caller.
   *
   * @param {string} expectedText - The wording the caller expects
   * @param {number} [timeout=30000] - Max wait for the login screen to render
   * @returns {Promise<string>} The normalized subtitle actually displayed
   */
  async getLoginSubtitle(expectedText, timeout = 30000) {
    return readTextWhenDisplayed(
      this.page,
      SELECTORS.LOGIN_SUBTITLE,
      expectedText,
      timeout,
      "getLoginSubtitle"
    );
  }

  /**
   * Whether the session is parked on the 90-day "change your password" screen.
   * Instant check, never throws — meant for diagnosing a login that did not reach the homepage.
   * @returns {Promise<boolean>}
   */
  async isPasswordExpiredScreenDisplayed() {
    return (await this.page.locator(SELECTORS.EXPIRED_PASSWORD_FLAG).count().catch(() => 0)) > 0;
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
