// Centralized selectors for easy maintenance
const SELECTORS = {
  // Add CSS selectors here if needed
};

/**
 * GeneralElementsPage
 *
 * Handles common UI elements that appear across multiple pages.
 */
class GeneralElementsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the success notification to appear.
   */
  async waitForSuccessNotification() {
    const successTitle = this.page.getByText('Success', { exact: true });

    await successTitle.waitFor({ state: 'visible' });
  }
}

module.exports = GeneralElementsPage;
