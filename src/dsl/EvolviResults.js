const EvolviResultsPage = require('../pages/EvolviResultsPage');

/**
 * EvolviResults DSL
 *
 * Business actions performed on Evolvi results.
 */
const EvolviResults = {

  /** Selects the cheapest suggested fare and adds it to the trip */
  async selectCheapestSuggestedFare(page) {
    const resultsPage = new EvolviResultsPage(page);

    await resultsPage.waitForSuggestedFaresText();
    await resultsPage.clickCheapestSuggestedFareOption();
    await resultsPage.waitForAddToTripButton();
    await resultsPage.clickAddToTripButton();

    return { selected: true };
  },

  /** Adds the currently selected Evolvi option to the trip */
  async clickAddToTripEvolvi(page) {
    const resultsPage = new EvolviResultsPage(page);

    await resultsPage.waitForAddToTripButton();
    await resultsPage.clickAddToTripButton();

    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add an Evolvi one-way option.
   */
  async addEvolviToTrip(page) {
    const resultsPage = new EvolviResultsPage(page);

    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add an Evolvi round trip.
   * Requires two selections before adding to trip.
   */
  async addEvolviRoundtripToTrip(page) {
    const resultsPage = new EvolviResultsPage(page);

    // First leg
    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    // Allow UI to refresh before second leg
    await page.waitForTimeout(500);

    // Second leg
    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    return { addedToTrip: true };
  },
};

module.exports = EvolviResults;