const FlightResultsPage = require('../pages/FlightResultsPage');
const CartPage = require('../pages/CartPage');
const Cart = require('./Cart');

const FlightResults = {
  async addFirstFlightToCart(page) {
    const flightResultsPage = new FlightResultsPage(page);
    const cartPage = new CartPage(page);

    await flightResultsPage.waitForAddToTripText();
    await flightResultsPage.clickAddToTripFirstFlight();
    
    // Handle conflict modal if it appears, otherwise continue
    await Cart.clickProceedConflictQuoteModal(page);
    
    // Wait for pending booking to appear in cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },
};

module.exports = FlightResults;
