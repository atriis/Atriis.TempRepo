const FlightResultsPage = require('../pages/FlightResultsPage');
const CartPage = require('../pages/CartPage');
const Cart = require('./Cart');

/**
 * FlightResults DSL
 *
 * High-level actions related to flight search results.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightResults = {
  /**
   * Checks whether flight results are available.
   *
   * Useful for:
   * - conditional flows
   * - negative test scenarios
   */
  async isResultDisplayed(page) {
    const flightResultsPage = new FlightResultsPage(page);

    try {
      await flightResultsPage.waitForAddToTripText();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Adds the first flight result to the cart.
   *
   * This flow:
   * - waits for results
   * - adds the first flight
   * - handles conflict quote modal if it appears
   * - waits until the cart shows "Pending booking"
   *
   * Returns a simple status object so callers can assert intent,
   * not UI details.
   */
  async addFirstFlightToCart(page) {
    const flightResultsPage = new FlightResultsPage(page);
    const cartPage = new CartPage(page);

    await flightResultsPage.waitForAddToTripText();
    await flightResultsPage.clickAddToTripFirstFlight();

    // Some suppliers show a conflict modal; handle it defensively
    await Cart.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },
};

module.exports = FlightResults;