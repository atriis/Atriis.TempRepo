const FlightResultsPage = require("@pages/FlightResultsPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");

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
    const resultsPage = new ResultsPage(page);

    try {
      await resultsPage.waitForAddToTripText();
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
    const cartPage = new CartPage(page);

    await Results.waitAndClickAddToTripButton(page);

    // Some suppliers show a conflict modal; handle it defensively
    await Results.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },

  async selectOneSegmentBySchedule(page) {
    await Results.waitAndClickSelectButton(page);

    return { selected: true };
  },

  async selectSegmentsBySchedule(page) {
    const flightResultsPage = new FlightResultsPage(page);

    // Select first segment
    await this.selectOneSegmentBySchedule(page);
    await flightResultsPage.waitForChangeFlightButton();

    // Select second segment
    await this.selectOneSegmentBySchedule(page);

    return { selected: true };
  },
};

module.exports = FlightResults;
