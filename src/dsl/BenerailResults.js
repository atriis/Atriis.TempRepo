const BenerailResultsPage = require('../pages/BenerailResultsPage');

/**
 * BenerailResults DSL
 *
 * Business actions performed on Benerail results.
 */
const BenerailResults = {

  /** Waits until Benerail results are ready */
  async waitForBenerailResults(page) {
    const resultsPage = new BenerailResultsPage(page);
    await resultsPage.waitForSelectText();
    return { loaded: true };
  },

  /** Selects the first available Benerail option */
  async selectFirstBenerailOption(page) {
    const resultsPage = new BenerailResultsPage(page);
    await resultsPage.clickSelectFirstBenerailOption();
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
    const resultsPage = new BenerailResultsPage(page);
    await resultsPage.waitForAddToTripText();
    await resultsPage.clickAddToTripButton();
    return { workflowCompleted: true, selected: true };
  },

  /**
   * Adds a Benerail round trip to the current trip.
   * Two selections are required before adding to trip.
   */
  async addBenerailRoundtripToTrip(page) {
    const resultsPage = new BenerailResultsPage(page);

    // First leg
    await resultsPage.waitForSelectText();
    await resultsPage.clickSelectFirstBenerailOption();

    // Allow UI to update
    await page.waitForTimeout(500);

    // Second leg
    await resultsPage.waitForSelectText();
    await resultsPage.clickSelectFirstBenerailOption();

    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true };
  },

  /**
   * Adds a Benerail one-way trip to the current trip.
   */
  async addBenerailOneWayToTrip(page) {
    const resultsPage = new BenerailResultsPage(page);

    await resultsPage.waitForSelectText();
    await resultsPage.clickSelectFirstBenerailOption();

    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true };
  }
};

module.exports = BenerailResults;