// Centralized selectors for easy maintenance
const SELECTORS = {
  LOGOUT_SUCCESS_MESSAGE: "h1:has-text(\"You've been logged out successfully!\")",
};

/**
 * LogoutPage
 *
 * Small helper page that only confirms the logout success message.
 */
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
