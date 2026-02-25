const { getPageObject } = require("@utils/pageObjectCache");
const EvolviResultsPage = require("@pages/EvolviResultsPage");
const Results = require("./Results");

/**
 * EvolviResults DSL
 *
 * Business actions performed on Evolvi results.
 */

const EvolviResults = {
  /** Selects the cheapest suggested fare and adds it to the trip */
  async selectCheapestSuggestedFare(page) {
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.waitForSuggestedFaresText();
    await resultsPage.clickCheapestSuggestedFareOption();
    await Results.waitAndClickAddToTripButton(page);

    return { selected: true };
  },

  /**
   * Complete workflow to add an Evolvi one-way option.
   */
  async addEvolviOneWayToTrip(page) {
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add an Evolvi round trip.
   * Requires two selections before adding to trip.
   */
  async addEvolviRoundtripToTrip(page) {
    const resultsPage = getPageObject(page, EvolviResultsPage);

    // First leg
    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    // Second leg
    await resultsPage.waitForOutboundText();
    await EvolviResults.selectCheapestSuggestedFare(page);

    await Results.waitAndClickAddToTripButton(page);

    return { addedToTrip: true };
  },
};

module.exports = EvolviResults;
