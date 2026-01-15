const FlightPricingPage = require('../pages/FlightPricingPage');
const CartPage = require('../pages/CartPage');
const Results = require('./Results');

/**
 * FlightResults DSL
 *
 * High-level actions related to flight search results.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightPricing = {

  async addYourSelectionFareToCart(page) {
    const flightPricingPage = new FlightPricingPage(page);
    const cartPage = new CartPage(page);

    await flightPricingPage.waitForYourSelectionText();
    await flightPricingPage.clickAddToTripYourSelection();

    // Some suppliers show a conflict modal; handle it defensively
    await Results.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },
};

module.exports = FlightPricing;