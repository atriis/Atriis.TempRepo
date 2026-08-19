const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const EvolviResultsPage = require("@pages/EvolviResultsPage");
const Results = require("./Results");
const logger = require("@utils/logger").child("EvolviResults");

/**
 * EvolviResults DSL
 *
 * Business actions performed on Evolvi results.
 */

/**
 * Everything that differs between the two legs of a round trip on the Evolvi results page. The
 * price grid is a single table of 10 columns shared by both directions (uk-rail-results.ts's
 * isOutboundCell: 0-4 outbound, 5-9 inbound), while the journey headers and the summary above
 * them are per-direction blocks — so a leg is addressed by three positions, not one.
 */
const DIRECTIONS = {
  outbound: { label: "Outbound", sectionIndex: 0, firstCellIndex: 0, summaryIndex: 0 },
  inbound: { label: "Inbound", sectionIndex: 1, firstCellIndex: 5, summaryIndex: 1 },
};

/**
 * Both the journey column header and the header summary print a 24-hour "HH:MM" departure time.
 * Matching it explicitly means a selector that silently drifts onto the wrong element fails here
 * with what it actually read, instead of handing the caller an empty string that would then
 * "match" an equally empty expectation.
 */
const DEPARTURE_HOUR_PATTERN = /\b(\d{1,2}:\d{2})\b/;

/**
 * @param {string} methodName - Calling DSL method, for error context
 * @param {string} direction - "outbound" or "inbound"
 * @returns {{label: string, sectionIndex: number, firstCellIndex: number, summaryIndex: number}}
 */
function resolveDirection(methodName, direction) {
  const resolved = DIRECTIONS[direction];
  if (!resolved) {
    throw new Error(
      `[EvolviResults.${methodName}] "direction" must be one of ${Object.keys(DIRECTIONS).join(", ")}, got: ${direction}`,
    );
  }
  return resolved;
}

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

  /**
   * Finds the first journey of one direction that can actually be booked and reads its departure
   * hour. "First available" is resolved against the price grid rather than the journey headers
   * alone: a journey column can be rendered but have no selectable fare (cancelled service,
   * company-disabled fares, or — for inbound — no fare compatible with the outbound already
   * chosen), and picking such a column would leave the following selection step with nothing to
   * click. Returning the column index alongside the hour is what keeps the later assertion
   * honest, since the fare must be selected from the very column the hour was read from.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{columnIndex: number, departureHour: string}>}
   */
  async extractFirstAvailableDepartureHour(page, direction) {
    if (!page) throw new Error("[EvolviResults.extractFirstAvailableDepartureHour] page is required");
    const { label, sectionIndex, firstCellIndex } = resolveDirection("extractFirstAvailableDepartureHour", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.waitForOutboundText();
    await resultsPage.waitForSuggestedFaresText();

    const columnCount = await resultsPage.getJourneyColumnCount(sectionIndex);
    if (columnCount === 0) {
      throw new Error(
        `[EvolviResults.extractFirstAvailableDepartureHour] No ${label} journey columns are displayed in the Evolvi results`,
      );
    }

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const selectableFares = await resultsPage.countSelectableFaresInColumn(firstCellIndex + columnIndex);
      if (selectableFares === 0) continue;

      const departureHour = await resultsPage.getJourneyDepartureTimeText(sectionIndex, columnIndex);
      if (!DEPARTURE_HOUR_PATTERN.test(departureHour)) {
        throw new Error(
          `[EvolviResults.extractFirstAvailableDepartureHour] Expected the ${label} journey at column ${columnIndex} ` +
          `to display a departure hour, but read: "${departureHour}"`,
        );
      }

      return { columnIndex, departureHour };
    }

    throw new Error(
      `[EvolviResults.extractFirstAvailableDepartureHour] None of the ${columnCount} displayed ${label} journeys ` +
      "offers a selectable fare",
    );
  },

  /**
   * Selects the first selectable fare of one direction's journey column — the column
   * extractFirstAvailableDepartureHour resolved, so the selected fare belongs to the journey whose
   * departure hour was recorded.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @param {number} columnIndex - Journey column within that direction, as returned by extractFirstAvailableDepartureHour
   */
  async selectFirstAvailablePrice(page, direction, columnIndex) {
    if (!page) throw new Error("[EvolviResults.selectFirstAvailablePrice] page is required");
    const { firstCellIndex } = resolveDirection("selectFirstAvailablePrice", direction);
    if (!Number.isInteger(columnIndex) || columnIndex < 0) {
      throw new Error(
        `[EvolviResults.selectFirstAvailablePrice] "columnIndex" must be a non-negative integer, got: ${columnIndex}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.clickFirstSelectableFareInColumn(firstCellIndex + columnIndex);

    return { selected: true };
  },

  /**
   * Reads one leg's summary from the top of the results page, once that leg has been picked.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{raw: string, label: string, departureHour: string}>}
   */
  async readSelectedJourneySummary(page, direction) {
    if (!page) throw new Error("[EvolviResults.readSelectedJourneySummary] page is required");
    const { label, summaryIndex } = resolveDirection("readSelectedJourneySummary", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.waitForSelectedSummaryPicked(summaryIndex);
    const raw = await resultsPage.getSelectedSummaryText(summaryIndex);

    const match = raw.match(DEPARTURE_HOUR_PATTERN);
    if (!match) {
      throw new Error(
        `[EvolviResults.readSelectedJourneySummary] Expected the ${label} summary at the top of the Evolvi results ` +
        `to display a departure hour, but read: "${raw}"`,
      );
    }

    return { raw, label, departureHour: match[1] };
  },

  // ===== SplitTix (split ticket) — test 44341 =====

  /**
   * Opens the "Save with SplitTix" dialog from the info icon next to a SplitTix fare group's title
   * (e.g. "SplitTix Available").
   *
   * @param {import('playwright').Page} page
   * @param {string} title - The group title the icon sits next to
   */
  async openSplitTicketInfoDialog(page, title) {
    if (!page) throw new Error('[EvolviResults.openSplitTicketInfoDialog] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.info("[EvolviResults.openSplitTicketInfoDialog] Opening the SplitTix info dialog", { title });
    await resultsPage.clickSplitTicketTitleInfoIcon(title);

    return { opened: true, title };
  },

  /**
   * Asserts the open "Save with SplitTix" dialog contains the expected message, then closes it.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage
   * @returns {Promise<string>} The dialog text that was read
   */
  async expectSplitTicketInfoDialogMessageAndClose(page, expectedMessage) {
    if (!page) throw new Error('[EvolviResults.expectSplitTicketInfoDialogMessageAndClose] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== "string") {
      throw new Error(
        `[EvolviResults.expectSplitTicketInfoDialogMessageAndClose] "expectedMessage" must be a non-empty string, got: ${expectedMessage}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const dialogText = await resultsPage.getSplitTicketDialogText();
    logger.info(
      "[EvolviResults.expectSplitTicketInfoDialogMessageAndClose] Read the SplitTix dialog",
      { dialogText },
    );

    expect(
      dialogText,
      'The "Save with SplitTix" dialog should explain what split ticketing is.',
    ).toContain(expectedMessage);

    await resultsPage.closeSplitTicketDialog();

    return dialogText;
  },

  /**
   * Hovers the first split-ticket fare highlighted in blue, opening its fare tooltip.
   *
   * @param {import('playwright').Page} page
   */
  async hoverFirstBlueSplitTicketFare(page) {
    if (!page) throw new Error('[EvolviResults.hoverFirstBlueSplitTicketFare] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.info("[EvolviResults.hoverFirstBlueSplitTicketFare] Hovering the first blue SplitTix fare");
    await resultsPage.hoverFirstBlueSplitTicketFare();

    return { hovered: true };
  },

  /**
   * Asserts the first blue split-ticket fare's tooltip contains the expected text.
   *
   * The tooltip's info block carries both the "SplitTix fare selected …" confirmation and the
   * "Saving of <amount>" sub-title (uk-rail-cell-tooltip-content.vue), so one method serves both of
   * 44341's tooltip assertions; the reader re-hovers when the popper has already dismissed itself.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>} The tooltip info text that was read
   */
  async expectBlueSplitTicketFareTooltipContains(page, expectedText) {
    if (!page) throw new Error('[EvolviResults.expectBlueSplitTicketFareTooltipContains] "page" is required.');
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(
        `[EvolviResults.expectBlueSplitTicketFareTooltipContains] "expectedText" must be a non-empty string, got: ${expectedText}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const tooltipText = await resultsPage.getBlueSplitTicketFareTooltipInfoText();
    logger.info(
      "[EvolviResults.expectBlueSplitTicketFareTooltipContains] Read the SplitTix fare tooltip",
      { tooltipText },
    );

    expect(
      tooltipText,
      "The tooltip of the split-ticket fare highlighted in blue should confirm the SplitTix selection " +
        "and the saving it makes.",
    ).toContain(expectedText);

    return tooltipText;
  },

  /**
   * Selects the first split-ticket fare highlighted in blue and adds it to the trip.
   *
   * @param {import('playwright').Page} page
   */
  async selectAndAddFirstBlueSplitTicketFareToTrip(page) {
    if (!page) throw new Error('[EvolviResults.selectAndAddFirstBlueSplitTicketFareToTrip] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.info(
      "[EvolviResults.selectAndAddFirstBlueSplitTicketFareToTrip] Selecting the first blue SplitTix fare",
    );
    await resultsPage.clickFirstBlueSplitTicketFare();
    await Results.waitAndClickAddToTripButton(page);

    return { selected: true, addedToTrip: true };
  },
};

module.exports = EvolviResults;
