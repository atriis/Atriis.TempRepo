const { getPageObject } = require("@utils/pageObjectCache");
const FlightPricingPage = require("@pages/FlightPricingPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");

/**
 * FlightPricing DSL
 *
 * High-level actions related to flight pricing and fare selection.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightPricing = {

  async extractYourSelectionPrice(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    await flightPricingPage.waitForYourSelectionText();
    return flightPricingPage.getYourSelectionPrice();
  },

  async addYourSelectionFareToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const cartPage = getPageObject(page, CartPage);
    const resultsPage = getPageObject(page, ResultsPage);

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
