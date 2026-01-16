const Results = require('./Results');

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
};

module.exports = CarResults;