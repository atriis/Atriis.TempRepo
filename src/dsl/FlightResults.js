const FlightResultsPage = require('../pages/FlightResultsPage');
const CartPage = require('../pages/CartPage');
const Cart = require('./Cart');

const FlightResults = {
  // Checks if flight search results are displayed on the page
  // Returns true if at least one flight result is visible, false otherwise
  async isResultDisplayed(page) {
    const flightResultsPage = new FlightResultsPage(page);
    
    try {
      // Check if "Add to Trip" text is visible (indicates results are loaded)
      await flightResultsPage.waitForAddToTripText();
      console.log('Flight results loaded successfully');
      return true;
    } catch {
      console.log('No flight results found');
      return false;
    }
  },

  // Adds the first flight option from search results to the shopping cart
  // Handles conflict quote modal if it appears
  // Includes conflict modal handling and waits for 'Pending Booking' text
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
