const CarResultsPage = require('../pages/CarResultsPage');
const Cart = require('./Cart');

const CarResults = {
  // Adds the first car rental option from search results to the shopping cart
  // Handles conflict quote modal if it appears
  async addCarFromResultsPageToCart(page) {
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();
    await Cart.clickProceedConflictQuoteModal(page);

    return { added: true };
  },
};

module.exports = CarResults;
