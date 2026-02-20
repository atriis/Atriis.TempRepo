/**
 * Page Object for logout page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  LOGOUT_SUCCESS_MESSAGE: "h1:has-text(\"You've been logged out successfully!\")",
};

class LogoutPage {
  constructor(page) {
    this.page = page;
  }

  /** Waits until the logout success message becomes visible */
  async waitForLogoutSuccessMessage() {
    await this.page.locator(SELECTORS.LOGOUT_SUCCESS_MESSAGE).waitFor({ state: "visible" });
  }
}

module.exports = LogoutPage;
