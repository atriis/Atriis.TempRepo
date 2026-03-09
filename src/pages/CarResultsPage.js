/**
 * Page Object for car results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Search results
  LOCATION_LABEL: '.location-label',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',
};

class CarResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets a location element by index.
   * @param {number} index - Zero-based index of the location element
   * @param {string} [locationType='cityCenter'] - Type of location: 'cityCenter' or 'airport'
   * @returns {import('playwright').Locator}
   */
  getLocationByIndex(index, locationType = 'cityCenter') {
    const selector = locationType === 'airport' ? SELECTORS.LOCATION_AIRPORT : SELECTORS.LOCATION_CITY_CENTER;
    return this.page.locator(selector).nth(index);
  }

  async waitForLocationVisible(index = 0, locationType = 'cityCenter') {
    const selector = locationType === 'airport' ? SELECTORS.LOCATION_AIRPORT : SELECTORS.LOCATION_CITY_CENTER;
    await this.page.locator(selector).nth(index).waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
    * Gets the location label text (e.g., "Pick up", "Drop off") at the given index.
    * @param {number} index - Zero-based index of the location element (ex. pick-up > index 0 or drop-off > index 1 for the first quote, two indexes per quote)
    * @returns {Promise<string>} The label text
    */
  getLocationLabelByIndex(index) {
    const selector = SELECTORS.LOCATION_LABEL;
    return this.page.locator(selector).nth(index);
  }
}

module.exports = CarResultsPage;