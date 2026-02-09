const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");

/**
 * BenerailResults DSL
 *
 * Business actions performed on Benerail results.
 */

const BenerailResults = {
  /** Waits until Benerail results are ready */
  async waitForBenerailResults(page) {
    const resultsPage = new ResultsPage(page);
    await resultsPage.waitForSelectText();
    return { loaded: true };
  },

  /** Selects the first available Benerail option */
  async selectFirstBenerailOption(page) {
    const resultsPage = new ResultsPage(page);
    await resultsPage.clickFirstSelectButton();
    return { selected: true };
  },

  /**
   * Waits for results and selects the first option.
   * Convenience wrapper for common flows.
   */
  async waitAndSelectFirstBenerailOption(page) {
    await BenerailResults.waitForBenerailResults(page);
    await BenerailResults.selectFirstBenerailOption(page);
    return { workflowCompleted: true, selected: true };
  },

  /** Waits for results and adds the option to the trip */
  async clickAddToTripBenerail(page) {
    await Results.waitAndClickAddToTripButton(page);
    return { workflowCompleted: true, selected: true };
  },

  /**
   * Adds a Benerail round trip to the current trip.
   * Two selections are required before adding to trip.
   */
  async addBenerailRoundtripToTrip(page) {
    const resultsPage = new ResultsPage(page);

    // First leg
    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();

    // Second leg
    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();

    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true };
  },

  /**
   * Adds a Benerail one-way trip to the current trip.
   */
  async addBenerailOneWayToTrip(page) {
    const resultsPage = new ResultsPage(page);

    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();

    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true };
  },
};

module.exports = BenerailResults;
