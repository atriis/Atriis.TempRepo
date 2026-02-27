/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Search results
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
};

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets a location element by index.
   * @param {number} index - Zero-based index of the location element
   * @returns {import('playwright').Locator}
   */
  getLocationByIndex(index) {
    return this.page.locator(SELECTORS.LOCATION_CITY_CENTER).nth(index);
  }

  async waitForLocationVisible(index = 0) {
    await this.page.locator(SELECTORS.LOCATION_CITY_CENTER).nth(index).waitFor({ state: 'visible', timeout: 60000 });
  }
}

module.exports = CarResultsPage;