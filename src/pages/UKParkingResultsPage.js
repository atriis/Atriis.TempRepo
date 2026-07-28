/**
 * Page Object for UK parking search results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Filter sidebar (parking-filter.vue), rendered inside parking-results.vue
  PARKING_FILTER_CONTAINER: '.parking-filter-container',
  PARKING_FILTER_OPTION: 'label.check-btn',
};

class UKParkingResultsPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the first filter option checkbox row in the parking filter sidebar.
   * @returns {import('@playwright/test').Locator}
   */
  getFirstFilterOption() {
    return this.page
      .locator(SELECTORS.PARKING_FILTER_CONTAINER)
      .locator(SELECTORS.PARKING_FILTER_OPTION)
      .first();
  }

  /**
   * Clicks the first filter option checkbox row in the parking filter sidebar.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   */
  async selectFirstFilterOption(timeout = 15000) {
    try {
      const option = this.getFirstFilterOption();
      await option.waitFor({ state: 'visible', timeout });
      await option.click();
    } catch (err) {
      throw new Error(
        `[UKParkingResultsPage.selectFirstFilterOption] Could not click the first parking filter option ` +
        `(selector: "${SELECTORS.PARKING_FILTER_CONTAINER} ${SELECTORS.PARKING_FILTER_OPTION}"). ` +
        `Likely causes: the filter sidebar has not rendered yet, or no parking results are present to filter. ` +
        `Original: ${err.message}`
      );
    }
  }
}

module.exports = UKParkingResultsPage;
