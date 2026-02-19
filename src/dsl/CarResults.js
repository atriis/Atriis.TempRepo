const { expect } = require("@playwright/test");
const Results = require("./Results");
const CarResultsPage = require("@pages/CarResultsPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");

/**
 * CarResults DSL
 *
 * Business actions performed on car search results.
 */
const CarResults = {
  /**
   * Adds a car to the cart when searching by airport.
   */
  async addCarAirportFromResultsPageToCart(page) {

    await Results.waitAndClickAddToTripButton(page);

    // Handle optional conflict modal
    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },

  /**
   * Adds a car to the cart when searching by city center.
   * This flow includes an extra "Select" step.
   */
  async addCarCityCenterFromResultsPageToCart(page) {

    await Results.waitAndClickSelectButton(page);
    await Results.waitAndClickAddToTripButton(page);

    // Handle optional conflict modal
    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },

  /**
   * Verifies that a car location at a specific index contains the expected city name.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the location element
   * @param {string} expectedCity - Expected city name to find in the location text
   * @throws {Error} If page, index, or expectedCity are invalid
   * @returns {Promise<void>}
   */
  async expectLocationToContain(page, index, expectedCity) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedCity || typeof expectedCity !== 'string') {
      throw new Error('expectedCity must be a non-empty string');
    }

    // Wait for results to load before checking locations
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    const text = await carResultsPage.getLocationByIndex(index).innerText();
    expect(text.toLowerCase()).toContain(expectedCity.toLowerCase());
  }

};

module.exports = CarResults;
