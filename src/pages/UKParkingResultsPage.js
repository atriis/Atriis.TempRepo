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
  // One app-checkbox-group.vue filter section inside the parking sidebar ("Terminal",
  // "Service type"), and the visible label text of the checkboxes it renders.
  FILTER_SECTION: '.filter-container',
  FILTER_SECTION_TITLE: 'h4.filter-title',
  FILTER_SECTION_OPTION_LABEL: '.el-checkbox__label p.filter-title',
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
   * Reads the visible checkbox labels of one parking filter section, in rendered order.
   *
   * app-checkbox-group.vue drops every option whose result count is zero (filterRelevantOptions,
   * driven by the `hideIfNoresults` prop parking-filter.vue passes) and removes the whole section
   * when nothing is left. So this returns exactly the options that are actually clickable for the
   * current result set — never the full terminal enum.
   *
   * @param {string} filterTitle - The section's h4 title, e.g. "Terminal" or "Service type"
   * @param {number} timeout - Max wait for the section to render (default: 15000)
   * @returns {Promise<string[]>} Visible option labels, e.g. ["Terminal 2", "Terminal 3"]
   */
  async getFilterSectionOptionLabels(filterTitle, timeout = 15000) {
    if (typeof filterTitle !== 'string' || !filterTitle.trim()) {
      throw new Error(
        `[UKParkingResultsPage.getFilterSectionOptionLabels] filterTitle must be a non-empty string, ` +
        `got: ${typeof filterTitle}`
      );
    }

    const section = this.page
      .locator(SELECTORS.PARKING_FILTER_CONTAINER)
      .locator(SELECTORS.FILTER_SECTION)
      .filter({ has: this.page.locator(SELECTORS.FILTER_SECTION_TITLE, { hasText: filterTitle }) })
      .first();

    try {
      await section.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[UKParkingResultsPage.getFilterSectionOptionLabels] The "${filterTitle}" parking filter section ` +
        `never became visible within ${timeout}ms. app-checkbox-group.vue removes a section entirely when ` +
        `every one of its options has a zero result count, so this also means no "${filterTitle}" option ` +
        `applies to the current result set. Original: ${err.message}`
      );
    }

    const labels = await section.locator(SELECTORS.FILTER_SECTION_OPTION_LABEL).allTextContents();
    return labels.map((label) => label.trim()).filter(Boolean);
  }

  /**
   * Reads the terminal and service type of every parking result from the Vuex store.
   *
   * The rendered filter panel cannot answer "which terminal has no Park and Ride parking": the two
   * sections carry independent per-option counts (parking.service.ts builds them with separate
   * countFunctions, so they never intersect), and the result cards print the terminal but never the
   * service type. The store holds the only copy of both fields on the same record.
   *
   * @returns {Promise<{segments: Array<{terminal: string, meetAndGreet: boolean, parkAndRide: boolean}>} | {error: string}>}
   */
  async getParkingSegmentsFromStore() {
    try {
      return await this.page.evaluate(() => {
        const store = document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$store;
        if (!store) return { error: 'Vuex store not reachable from #app.__vue_app__' };

        const parkings = store.getters['parkingStore/parkings'];
        if (!Array.isArray(parkings)) {
          return { error: `parkingStore/parkings is not an array (got ${typeof parkings})` };
        }

        return {
          segments: parkings.map((parking) => ({
            terminal: `${parking?.segment?.terminal ?? ''}`,
            meetAndGreet: !!parking?.segment?.meetAndGreet,
            parkAndRide: !!parking?.segment?.parkAndRide,
          })),
        };
      });
    } catch (err) {
      return { error: err.message };
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
