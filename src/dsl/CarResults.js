const CarResultsPage = require('../pages/CarResultsPage');
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
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();

    // Handle optional conflict modal
    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },

  /**
   * Adds a car to the cart when searching by city center.
   * This flow includes an extra "Select" step.
   */
  async addCarCityCenterFromResultsPageToCart(page) {
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForSelectText();
    await carResultsPage.clickSelectButton();

    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();

    await Results.clickProceedConflictQuoteModal(page);

    return { added: true };
  },
};

module.exports = CarResults;