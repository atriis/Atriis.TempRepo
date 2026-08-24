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
  // parking-results.vue's app-product-loader, rendered while isLoading — the only element that
  // distinguishes results being re-fetched from the previous result set still on screen.
  PARKING_RESULTS_LOADER: '.parking-results .app-product-loader',
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
   * Waits out a results re-fetch: the loader appearing, then going away again.
   *
   * Used after re-submitting the search from the edit drawer. The previous result set stays on
   * screen until the new one arrives, so waiting straight for an "Add to trip" button would be
   * satisfied by the OLD results and hand the next step a list that is about to be replaced. The
   * loader's appearance is tolerated as optional rather than required — a cached re-search can
   * come back before it paints, and that is a pass, not a failure.
   *
   * @param {number} [appearTimeout=10000] - How long to watch for the loader to appear
   * @param {number} [finishTimeout=90000] - How long to wait for it to go away again
   */
  async waitForResultsReloaded(appearTimeout = 10000, finishTimeout = 90000) {
    const loader = this.page.locator(SELECTORS.PARKING_RESULTS_LOADER).first();

    const appeared = await loader
      .waitFor({ state: 'visible', timeout: appearTimeout })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      return { reloaded: true, loaderSeen: false };
    }

    try {
      await loader.waitFor({ state: 'hidden', timeout: finishTimeout });
    } catch (err) {
      throw new Error(
        `[UKParkingResultsPage.waitForResultsReloaded] The parking results loader was still on ` +
        `screen ${finishTimeout}ms after the search was re-submitted (selector: ` +
        `"${SELECTORS.PARKING_RESULTS_LOADER}"), so the re-search never returned. ` +
        `Original: ${err.message}`
      );
    }

    return { reloaded: true, loaderSeen: true };
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
