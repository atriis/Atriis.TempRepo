// dsl/CarResults.js

const CarResultsPage = require('../pages/CarResultsPage');
const Cart = require('./Cart');

const CarResults = {
  async addCarFromResultsPageToCart(page) {
    const carResultsPage = new CarResultsPage(page);

    await carResultsPage.waitForCarAddToTripText();
    await carResultsPage.clickCarAddToTripButton();
    await Cart.clickProceedConflictQuoteModal(page);

    return { added: true };
  },
};

module.exports = CarResults;
