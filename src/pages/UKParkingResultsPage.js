/**
 * Page Object for UK parking search results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Filter sidebar (parking-filter.vue), rendered inside parking-results.vue
  PARKING_FILTER_CONTAINER: '.parking-filter-container',
  PARKING_FILTER_OPTION: 'label.check-btn',
  // parking-results.vue's app-breadcrumb — its first li is the router-link back to the trip
  // search page (same shape as BenerailResultsPage.RESULTS_BREADCRUMB_SEARCH_LINK). Scoped to
  // .parking-results-container so the trip bar's own breadcrumb cannot match.
  RESULTS_BREADCRUMB_SEARCH_LINK: '.parking-results-container nav.breadcrumb li:first-child a',
  PARKING_RESULTS_CONTAINER: '.parking-results-container',
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

  /**
   * Clicks the "Search" link in the parking results breadcrumb to navigate back to the
   * trip search page. The breadcrumb only renders once loading has finished
   * (v-if="!isLoading" in parking-results.vue), so it doubles as a results-ready gate.
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async clickBreadcrumbSearchLink(timeout = 30000) {
    const link = this.page.locator(SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK).first();

    try {
      await link.waitFor({ state: 'visible', timeout });
      await link.click();
      // Confirm the router actually left the results route rather than trusting the click:
      // the search form and the results list are distinct views, so the results container
      // disappearing is the only reliable signal that the navigation happened.
      await this.page
        .locator(SELECTORS.PARKING_RESULTS_CONTAINER)
        .waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[UKParkingResultsPage.clickBreadcrumbSearchLink] Could not click the "Search" link in the parking ` +
        `results breadcrumb (selector: "${SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK}"). ` +
        `Likely causes: the parking results page is still loading (the breadcrumb is hidden while isLoading), ` +
        `or the run is not on the parking results page at all. Original: ${err.message}`
      );
    }
  }
}

module.exports = UKParkingResultsPage;
