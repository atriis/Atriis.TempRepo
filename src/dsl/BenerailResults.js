const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
const { BenerailResultsPage } = require("@pages/BenerailResultsPage");
const Results = require("./Results");

/**
 * BenerailResults DSL
 *
 * Business actions performed on Benerail results.
 */

/**
 * Converts a displayed Benerail departure/arrival time into minutes past midnight. Handles both
 * notations the results page can render depending on the user's time-format setting: 24-hour
 * ("14:32") and 12-hour AM/PM ("2:32 PM").
 * @param {string} timeText - Time as displayed, e.g. "14:32" or "2:32 PM"
 * @returns {number} Minutes past midnight
 */
function parseTimeOfDayToMinutes(timeText) {
  const match = (timeText ?? "").match(/\b(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) {
    throw new Error(`Could not parse a time of day from Benerail result time text: "${timeText}"`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "AM" && hours === 12) hours = 0;
  if (meridiem === "PM" && hours !== 12) hours += 12;

  return hours * 60 + minutes;
}

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
   * Reads the first Benerail result's departure time without navigating — used as the baseline
   * before clicking "Show Later Departures" (see test 62825).
   * @param {import('playwright').Page} page
   * @returns {Promise<{raw: string, minutes: number}>}
   */
  async extractFirstResultDepartureTime(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const raw = await benerailResultsPage.getFirstResultDepartureTimeText();
    return { raw, minutes: parseTimeOfDayToMinutes(raw) };
  },

  /**
   * Clicks "Show Later Departures" and reads the departure time of the first newly-opened later
   * result. "Show Later Departures" appends new results to the end of the outbound list rather
   * than replacing it (eu-rail.store.ts's loadLaterRails → appendRailSegments), so the first
   * later result is not the page's first result card — it is the card at the index the list had
   * right before this click. Reused for both the first and second "Later" click in test 62825.
   * @param {import('playwright').Page} page
   * @returns {Promise<{raw: string, minutes: number}>}
   */
  async clickLaterAndExtractFirstResultDepartureTime(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const previousCardCount = await benerailResultsPage.getResultCardCount();
    await BenerailResults.clickShowLaterDepartures(page);
    await benerailResultsPage.waitForNewResultCardsAppended(previousCardCount);
    const raw = await benerailResultsPage.getDepartureTimeTextForResultAtIndex(previousCardCount);
    return { raw, minutes: parseTimeOfDayToMinutes(raw) };
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
   * Hovers the OOP shield icon on the first out-of-policy alternative revealed by "More Options"
   * and returns its tooltip text (see BenerailResultsPage.hoverFirstOOPShieldIconInMoreOptionsResults
   * / getOOPTooltipTextInMoreOptionsResults for why this can't reuse CommonPage.getOOPTooltipText).
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The OOP tooltip text
   */
  async hoverAndGetOOPTooltipTextInMoreOptionsResults(page) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.hoverFirstOOPShieldIconInMoreOptionsResults();
    return await benerailResultsPage.getOOPTooltipTextInMoreOptionsResults();
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
