const FlightPricingPage = require("@pages/FlightPricingPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("@dsl/Results");

/**
 * FlightPricing DSL
 *
 * High-level actions related to flight pricing and fare selection.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightPricing = {

  async addYourSelectionFareToCart(page) {
    const flightPricingPage = new FlightPricingPage(page);
    const cartPage = new CartPage(page);
    const resultsPage = new ResultsPage(page);

    await flightPricingPage.waitForYourSelectionText();
    await resultsPage.waitForAddToTripText();
    await resultsPage.clickFirstAddToTripButton();

    // Some suppliers show a conflict modal; handle it defensively
    await Results.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },
};

module.exports = FlightPricing;
