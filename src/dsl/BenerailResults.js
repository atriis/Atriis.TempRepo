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
   * Expands "More Options" on the first visible result without selecting a fare.
   */
  async expandMoreOptionsForFirstResult(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.expandFirstResultMoreOptions();
    return { expanded: true };
  },

  /**
   * Verifies that the "Contract fares available in options" handshake badge is visible for at
   * least one Benerail result.
   * @throws {Error} If no handshake badge is visible
   */
  async verifyHandshakeBadgeVisibleInMoreOptionsResults(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const isVisible = await benerailResultsPage.isHandshakeBadgeVisibleInMoreOptionsResults();
    if (!isVisible) {
      throw new Error("No handshake badge (contract fares available in options) is visible in any Benerail result");
    }
  },

  /**
   * Hovers the agreement (handshake) logo on the first agreement-bearing alternative in "more
   * options" results and verifies its tooltip opens with both an agreement code/description and a
   * rendered icon (a real agreement logo, or the generic handshake glyph when no logo URL is
   * configured). The exact contract identifier is real corporate data (not a fixed UI label), so
   * this asserts non-empty tooltip text rather than a specific string — mirrors
   * CarResults.verifyAgreementTextDisplayedInCarResultsTooltip / verifyAgreementLogoDisplayedInTooltip
   * for the same shared ticket-agreements.vue component.
   * @throws {Error} If no agreement-bearing alternative is found, its tooltip shows no text, or
   *   neither a logo image nor the handshake placeholder renders
   */
  async hoverAndVerifyAgreementTooltipInMoreOptionsResults(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.hoverFirstAgreementLogoInMoreOptionsResults();

    const tooltipText = await benerailResultsPage.getAgreementTooltipText();
    if (!tooltipText) {
      throw new Error("Agreement tooltip showed no agreement code/text after hovering the handshake logo in more options results");
    }

    const logo = await benerailResultsPage.getAgreementTooltipLogoDetails();
    if (!logo.visible && !logo.placeholderOnly) {
      throw new Error(
        `Agreement tooltip showed the agreement code ("${tooltipText}") but no logo image or handshake placeholder rendered`
      );
    }

    return { tooltipText, logoSrc: logo.src, placeholderOnly: logo.placeholderOnly };
  },

  /**
   * Selects the first agreement-bearing alternative fare revealed by "More Options" and adds it
   * to the trip.
   */
  async selectAndAddAgreementFareFromMoreOptionsToTrip(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.selectFirstAgreementFareFromMoreOptions();
    await BenerailResults.clickAddToTripBenerail(page);
    return { addedToTrip: true };
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
