const CarResultsPage = require('../pages/CarResultsPage');
const Cart = require('./Cart');

const CarResults = {
  // Adds the first car rental option when searching by airport from search results to the shopping cart
  // Handles conflict quote modal if it appears
  async addCarAirportFromResultsPageToCart(page) {
    console.log('Adding car (searching by airport) from results page to cart...');
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();
    await Cart.clickProceedConflictQuoteModal(page);

    console.log('Car (airport search) successfully added to cart');
    return { added: true };
  },

  // Adds the first car rental option when searching by city center from search results to the shopping cart
  // Handles conflict quote modal if it appears
  async addCarCityCenterFromResultsPageToCart(page) {
    console.log('Adding car (searching by city center) from results page to cart...');
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForSelectText();
    await carResultsPage.clickSelectButton();
    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();
    await Cart.clickProceedConflictQuoteModal(page);

    console.log('Car (city center search) successfully added to cart');
    return { added: true };
  },
};

module.exports = CarResults;
