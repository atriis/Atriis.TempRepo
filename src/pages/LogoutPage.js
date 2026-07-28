/**
 * Page Object for logout page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  LOGOUT_SUCCESS_MESSAGE: "h1:has-text(\"You've been logged out successfully!\")",
  // Text-agnostic wrapper of the logout confirmation. Used when the message itself is the
  // value under assertion — anchoring on LOGOUT_SUCCESS_MESSAGE would make that circular
  // (wrong wording = element never found = opaque timeout instead of a text diff).
  // This page is server-rendered by the auth service, so it is not in Atriis.App and has
  // no data-testid; ".welcome" is the class the legacy Testim test asserted on.
  // :visible guards against a hidden placeholder node winning .first().
  LOGOUT_MESSAGE_CONTAINER: ".welcome:visible",
};

class LogoutPage {
  constructor(page) {
    this.page = page;
  }

  /** Waits until the logout success message becomes visible */
  async waitForLogoutSuccessMessage() {
    await this.page.locator(SELECTORS.LOGOUT_SUCCESS_MESSAGE).waitFor({ state: "visible" });
  }

  /**
   * Reads the logout confirmation message.
   * Whitespace is normalized so the caller can compare against a single-line expectation
   * (the rendered markup separates the two sentences with a long run of spaces).
   *
   * Must be called before the page auto-redirects back to the login screen.
   *
   * @param {number} [timeout=15000] - Max wait for the message to render
   * @returns {Promise<string>} The normalized confirmation text
   */
  async getLogoutSuccessMessage(timeout = 15000) {
    const message = this.page.locator(SELECTORS.LOGOUT_MESSAGE_CONTAINER).first();

    try {
      await message.waitFor({ state: "visible", timeout });
    } catch (error) {
      throw new Error(
        `[LogoutPage.getLogoutSuccessMessage] No logout confirmation ("${SELECTORS.LOGOUT_MESSAGE_CONTAINER}") ` +
        `became visible within ${timeout}ms. The logout icon may not have been clicked, or this page had ` +
        `already auto-redirected to the login screen before the message was read. Original: ${error.message}`
      );
    }

    const text = (await message.textContent()) || "";
    return text.replace(/\s+/g, " ").trim();
  }
}

module.exports = LogoutPage;
