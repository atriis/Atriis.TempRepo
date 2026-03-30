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

    const carResultsPage = getPageObject(page, CarResultsPage);
    // Wait for the location elements to appear (works for both city-center and airport results)
    await carResultsPage.waitForLocationVisible(index);
    const text = await carResultsPage.getLocationByIndex(index).innerText();
    expect(text.toLowerCase()).toContain(expectedCity.toLowerCase());
  },
  /**
   * Verifies that a car location at a specific airport index contains the expected airport name.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the airport location element
   * @param {string} expectedAirport - Expected airport name to find in the location text
   * @throws {Error} If page, index, or expectedAirport are invalid
   * @returns {Promise<void>}
   */
  async expectAirportLocationToContain(page, index, expectedAirport) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedAirport || typeof expectedAirport !== 'string') {
      throw new Error(`expectedAirport must be a non-empty string, got: ${expectedAirport}`);
    }

    // Wait for results to load before checking locations
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);

    const text = await carResultsPage.getLocationByIndex(index, 'airport').innerText();
    expect(text.toLowerCase()).toContain(expectedAirport.toLowerCase());
  },

  /**
   * Verifies that a car location label at a specific index contains the expected label text (e.g., "Pick up", "Drop off").
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the location element
   * @param {string} expectedLabel - Expected location label text to find (e.g., "Pick up", "Drop off")
   * @throws {Error} If page, index, or expectedLabel are invalid
   * @returns {Promise<void>}
   */
  async expectLocationLabelToContain(page, index, expectedLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(`expectedLabel must be a non-empty string, got: ${expectedLabel}`);
    }

    // Wait for results to load before checking locations
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);

    const text = await carResultsPage.getLocationLabelByIndex(index).innerText();
    expect(text.toLowerCase()).toContain(expectedLabel.toLowerCase());
  },

  /**
   * Verifies the payment type label displayed on the car results page at the given index.
   * Expected values: "Pre paid" (when Is Prepaid = true) or "Pay On Departure" (when Is Prepaid = false).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedPaymentType - Expected text, e.g. "Pre paid" or "Pay On Departure"
   * @param {number} [index=0] - Zero-based index of the car result card to check
   * @throws {Error} If page, expectedPaymentType, or index are invalid
   * @returns {Promise<void>}
   */
  async expectPaymentTypeOnResults(page, expectedPaymentType, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedPaymentType || typeof expectedPaymentType !== 'string') {
      throw new Error(`expectedPaymentType must be a non-empty string, got: ${expectedPaymentType}`);
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForPaymentTypeVisible(index);
    const text = await carResultsPage.getPaymentTypeLabelAtIndex(index).innerText();
    expect(text.trim()).toBe(expectedPaymentType);
  },

  /**
   * Gets the current visible FOP (payment type) from car results.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async getCurrentFOPOnResults(page, { agencyName } = {}) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAddToTripText();

    const carResultsPage = getPageObject(page, CarResultsPage);
    return await carResultsPage.getCurrentFOPText({ agencyName });
  },

  /**
   * Verifies that the expected FOP (payment type) is shown on car results.
   * @param {import('playwright').Page} page
   * @param {string} expectedFOP
   * @returns {Promise<void>}
   */
  async expectCurrentFOPOnResults(page, expectedFOP, { agencyName } = {}) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedFOP || typeof expectedFOP !== 'string') {
      throw new Error('expectedFOP must be a non-empty string');
    }

    const actualFOP = await CarResults.getCurrentFOPOnResults(page, { agencyName });
    const normalizedActual = actualFOP.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedExpected = expectedFOP.toLowerCase().replace(/\s+/g, ' ').trim();

    expect(normalizedActual).toContain(normalizedExpected);
  },

  /**
   * Selects the first city center pickup location from the pick-up location selection page.
   * Navigates from the vendor list to the actual car results with individual car cards.
   */
  async selectFirstCityCenterPickupLocation(page) {
    if (!page) throw new Error('page is required');
    await Results.waitAndClickSelectButton(page);
  },

  /**
   * Asserts that none of the visible car result titles contain the given word as a standalone word.
   * Uses word-boundary regex. Regression for ADO Bug #75326.
   */
  async assertCarTitlesDoNotContainWord(page, word) {
    if (!page) throw new Error('page is required');
    if (!word || typeof word !== 'string') throw new Error(`word must be a non-empty string, got: ${word}`);

    const carResultsPage = getPageObject(page, CarResultsPage);
    await carResultsPage.waitForCarTitlesVisible();

    const titleLocators = carResultsPage.getCarTitles();
    const count = await titleLocators.count();
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');

    for (let i = 0; i < count; i++) {
      const text = await titleLocators.nth(i).innerText();
      expect(
        wordRegex.test(text),
        `Car title at index ${i} contains unexpected word "${word}": "${text.trim()}"`
      ).toBe(false);
    }
  },
};

module.exports = CarResults;
