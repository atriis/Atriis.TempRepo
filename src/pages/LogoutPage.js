
// Centralized selectors for easy maintenance
const SELECTORS = {
  LOGOUT_SUCCESS_MESSAGE: 'h1:has-text("You\'ve been logged out successfully!")'
};

class LogoutPage {
  constructor(page) {
    this.page = page;
  }

  // Waits until the "You've been logged out successfully!" message becomes visible
  async waitForLogoutSuccessMessage() {
    console.log('Waiting for logout success message...');
    await this.page.locator(SELECTORS.LOGOUT_SUCCESS_MESSAGE).waitFor({ state: 'visible' });
  }
}

module.exports = LogoutPage;
