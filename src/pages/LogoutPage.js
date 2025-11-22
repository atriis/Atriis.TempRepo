
// Centralized selectors for easy maintenance
const SELECTORS = {
  logoutSuccessMessage: 'h1:has-text("You\'ve been logged out successfully!")'
};

class LogoutPage {
  constructor(page) {
    this.page = page;
  }

  // Waits until the "You've been logged out successfully!" message becomes visible
  async waitForLogoutSuccessMessage() {
    console.log('Waiting for logout success message...');
    await this.page.locator(SELECTORS.logoutSuccessMessage).waitFor({ state: 'visible' });
  }
}

module.exports = LogoutPage;
