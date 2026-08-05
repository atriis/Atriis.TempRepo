const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
const { BenerailResultsPage } = require("@pages/BenerailResultsPage");
const Results = require("./Results");

/**
 * BenerailResults DSL
 *
 * Business actions performed on Benerail results.
 */

const BenerailResults = {
  /** Waits until Benerail results are ready */
  async waitForBenerailResults(page) {
    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();
    return { loaded: true };
  },

  /** Selects the first available Benerail option */
  async selectFirstBenerailOption(page) {
    const resultsPage = getPageObject(page, ResultsPage);
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
    const resultsPage = getPageObject(page, ResultsPage);

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
    const resultsPage = getPageObject(page, ResultsPage);

    await resultsPage.waitForSelectText();
    await resultsPage.clickFirstSelectButton();

    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true };
  },

  /** Clicks "Show Later Departures" on the outbound results and waits for the refresh */
  async clickShowLaterDepartures(page) {
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.clickShowLaterDeparturesButton();
    return { clicked: true };
  },

  /**
   * Expands "More Options" on the last visible outbound result and selects an alternative fare.
   */
  async selectAlternativeFareForLastOutboundResult(page) {
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.selectLastResultAlternativeFare();
    return { selected: true };
  },

  /**
   * Selects the first result for the current leg and confirms the selection committed before
   * returning. Use this instead of selectFirstBenerailOption when it immediately follows another
   * leg's selection in the same round-trip flow (e.g. the inbound leg right after an outbound
   * alternative fare was chosen) — see BenerailResultsPage.clickFirstSelectButtonAndConfirmTransition.
   */
  async selectFirstBenerailOptionAndConfirmTransition(page) {
    const resultsPage = getPageObject(page, ResultsPage);
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await resultsPage.waitForSelectText();
    await benerailResultsPage.clickFirstSelectButtonAndConfirmTransition();
    return { selected: true };
  },
};

module.exports = BenerailResults;
