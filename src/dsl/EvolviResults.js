const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const EvolviResultsPage = require("@pages/EvolviResultsPage");
const Results = require("./Results");
// Only for the generic open-drawer read/close (ANY_VISIBLE_DRAWER) — the fare-rules drawer the
// results grid opens is the very same drawer the quote card opens, so there is one implementation.
const Cart = require("./Cart");
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

/**
 * Waits for the Evolvi results and adds the cheapest suggested fare to the trip.
 *
 * Shared by the one-way and round-trip entry points below, which differ only in what was searched:
 * a suggested fare already prices the whole journey, so both end in the same single selection plus
 * "Add to trip". Module-local so it stays out of the step-facing vocabulary.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 */
async function addCheapestSuggestedFareToTrip(page) {
  const resultsPage = getPageObject(page, EvolviResultsPage);
  await resultsPage.waitForOutboundText();
  await EvolviResults.selectCheapestSuggestedFare(page);
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
    await addCheapestSuggestedFareToTrip(page);

    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add an Evolvi round trip.
   *
   * The suggested-fares panel prices the return journey as a whole, so the cheapest suggested fare
   * already carries both legs: one selection plus one "Add to trip" builds the round-trip quote,
   * the same shape as a one way. There is no second leg to pick afterwards and no second "Add to
   * trip" to click — the app leaves the results page for the trip overview as soon as the quote is
   * created, so anything that clicks again waits out its timeout against a button that is gone.
   */
  async addEvolviRoundtripToTrip(page) {
    await addCheapestSuggestedFareToTrip(page);

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
   * Selects one leg from a fare group the scenario names, e.g. "Anytime Return".
   *
   * The two legs of such a fare are picked from different cell shapes — the outbound half of the
   * group carries a real price, while an Anytime Return's inbound half renders "Select Time"
   * because the fare prices no separate return — so the click is routed per direction while
   * everything around it (validation, the section gate, the failure story) stays shared.
   *
   * The direction heading is asserted rather than merely waited on: it is what says that leg's
   * results came back at all, so a search that returned nothing fails naming the missing section
   * instead of letting the grid click time out against a screen that never rendered.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @param {string} groupTitle - The fare group's title as printed in the price grid
   * @returns {Promise<{selected: true, direction: string, groupTitle: string}>}
   */
  async selectFareByGroupTitle(page, direction, groupTitle) {
    if (!page) throw new Error("[EvolviResults.selectFareByGroupTitle] page is required");
    const { label } = resolveDirection("selectFareByGroupTitle", direction);
    if (typeof groupTitle !== "string" || groupTitle.trim() === "") {
      throw new Error(
        `[EvolviResults.selectFareByGroupTitle] "groupTitle" must be a non-empty string, got: ${JSON.stringify(groupTitle)}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await EvolviResults.expectDirectionHeadingDisplayed(page, direction);

    logger.debug("[EvolviResults.selectFareByGroupTitle] Selecting a named fare group's leg", { direction, groupTitle });
    try {
      if (direction === "outbound") {
        await resultsPage.clickFirstOutboundPriceInFareGroup(groupTitle);
      } else {
        await resultsPage.clickInboundSelectTimeInFareGroup(groupTitle);
      }
    } catch (err) {
      throw new Error(
        `[EvolviResults.selectFareByGroupTitle] Could not select the ${label} leg of the "${groupTitle}" fare, so the ` +
        `quote this scenario books would not be the journey it asked for. Original: ${err.message}`,
      );
    }

    return { selected: true, direction, groupTitle };
  },

  /**
   * Adds the fares already selected in the price grid to the trip.
   *
   * Deliberately selects nothing itself — the suggested-fare entry points above pick a fare and add
   * it in one move, which is wrong for a scenario that chose both legs by hand: clicking any fare
   * here would toggle one of those selections off.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{addedToTrip: true}>}
   */
  async addSelectedFaresToTrip(page) {
    if (!page) throw new Error("[EvolviResults.addSelectedFaresToTrip] page is required");

    logger.debug("[EvolviResults.addSelectedFaresToTrip] Adding the selected Evolvi fares to the trip");
    try {
      await Results.waitAndClickAddToTripButton(page);
    } catch (err) {
      throw new Error(
        "[EvolviResults.addSelectedFaresToTrip] Could not add the selected Evolvi fares to the trip. The " +
        `"Add to trip" button only enables once every leg of the search has a fare selected. Original: ${err.message}`,
      );
    }

    return { addedToTrip: true };
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

  /**
   * Verifies the results page shows a direction's heading — the "Outbound" / "Inbound" title over
   * that leg's journey columns, which is the text that says the leg's results actually rendered.
   *
   * Asserts on the heading rather than on the section merely existing: `.data-section` for the
   * inbound leg is v-show'n rather than v-if'd, so a presence-only check would pass on a page whose
   * headings never painted. The expected wording comes from the DIRECTIONS map above, so this and
   * the leg-summary readers cannot disagree about what a direction is called.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{direction: string, heading: string}>} The heading that was read
   */
  async expectDirectionHeadingDisplayed(page, direction) {
    if (!page) throw new Error("[EvolviResults.expectDirectionHeadingDisplayed] page is required");
    const { label, sectionIndex } = resolveDirection("expectDirectionHeadingDisplayed", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const heading = await resultsPage.getResultsSectionHeadingText(sectionIndex);

    logger.info("[EvolviResults.expectDirectionHeadingDisplayed] Read the direction heading", {
      direction,
      heading,
    });

    expect(
      heading,
      `The Evolvi results page should show the "${label}" heading over the ${direction} journeys, ` +
      `but the heading read: "${heading}"`,
    ).toBe(label);

    return { direction, heading };
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
   * Opens the fare rules of the first Evolvi fare in results WITHOUT selecting it, asserts the
   * rules contain the expected wording, then closes the drawer so the results grid stays usable for
   * the selection that follows. See test 59698.
   *
   * The rules open from the fare tooltip's "Full information" button, which lives in the body-level
   * popper rather than in the clickable cell — so reading the rules here leaves the fare unselected.
   * Only that trigger is results-specific: the drawer it opens is the same one the quote card uses,
   * so it is read and closed through the generic open-drawer helpers.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Text expected inside the fare rules (case-insensitive)
   * @returns {Promise<{verified: boolean}>}
   */
  async verifyFareRulesFromFirstResultContainsText(page, expectedText) {
    if (!page) throw new Error('[EvolviResults.verifyFareRulesFromFirstResultContainsText] "page" is required.');
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(
        `[EvolviResults.verifyFareRulesFromFirstResultContainsText] "expectedText" must be a non-empty string, got: ${expectedText}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug(
      "[EvolviResults.verifyFareRulesFromFirstResultContainsText] Opening the fare rules of the first results fare",
      { expectedText },
    );
    await resultsPage.openFareRulesFromFirstFare();
    await Cart.verifyOpenDrawerContainsText(page, expectedText);
    await Cart.closeOpenDrawer(page);

    return { verified: true };
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

  // ===== Greenest (lowest carbon) suggested fare (test 59032) =====

  /**
   * Hovers the greenest suggested fare in the Evolvi results header, opening its tooltip.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{hovered: boolean}>}
   */
  async hoverGreenestSuggestedFare(page) {
    if (!page) throw new Error('[EvolviResults.hoverGreenestSuggestedFare] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.info("[EvolviResults.hoverGreenestSuggestedFare] Hovering the greenest suggested Evolvi fare");
    // The suggested-fare buttons only render once the fares have finished loading, so gate on the
    // "Suggested fares" caption before reaching for the green one.
    await resultsPage.waitForSuggestedFaresText();
    await resultsPage.hoverGreenestSuggestedFare();

    return { hovered: true };
  },

  /**
   * Asserts the greenest suggested fare's tooltip contains the expected carbon-efficiency message
   * ($t('ukRail.greenFareMsg')). Re-hovers when the popper has already dismissed itself, because
   * the hover happens in the preceding Cucumber step.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>} The tooltip text that was read
   */
  async expectGreenestFareTooltipContains(page, expectedText) {
    if (!page) throw new Error('[EvolviResults.expectGreenestFareTooltipContains] "page" is required.');
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(
        `[EvolviResults.expectGreenestFareTooltipContains] "expectedText" must be a non-empty string, got: ${expectedText}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const tooltipText = await resultsPage.getGreenestSuggestedFareTooltipText();
    logger.info(
      "[EvolviResults.expectGreenestFareTooltipContains] Read the greenest suggested-fare tooltip",
      { tooltipText },
    );

    expect(
      tooltipText,
      "The tooltip of the greenest suggested Evolvi fare should describe it as the lowest carbon-efficient " +
        "fare available.",
    ).toContain(expectedText);

    return tooltipText;
  },

  /**
   * Selects the greenest suggested fare in the Evolvi results header.
   *
   * Deliberately stops at the selection: the scenario adds the fare to the trip through its own
   * later "I click Evolvi add to trip" step, so adding here would double-submit.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{selected: boolean}>}
   */
  async selectGreenestFare(page) {
    if (!page) throw new Error('[EvolviResults.selectGreenestFare] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.info("[EvolviResults.selectGreenestFare] Selecting the greenest suggested Evolvi fare");
    await resultsPage.waitForSuggestedFaresText();
    await resultsPage.clickGreenestSuggestedFareOption();

    return { selected: true };
  },

  /**
   * Reads the total price the Evolvi results header shows for the fare currently selected.
   *
   * The results-side twin of Cart.extractCartTotalPrice: it returns the raw number, and the step
   * definition owns where that number is parked on the Cucumber World.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractSelectedFareTotalPrice(page) {
    if (!page) throw new Error('[EvolviResults.extractSelectedFareTotalPrice] "page" is required.');
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug(
      "[EvolviResults.extractSelectedFareTotalPrice] Reading the selected-fare total from the Evolvi results header",
    );
    const totalPrice = await resultsPage.getSelectedFareTotalPriceValue();
    logger.info("[EvolviResults.extractSelectedFareTotalPrice] Read the selected Evolvi fare total", {
      totalPrice,
    });

    return totalPrice;
  },

  // ===== Journey "More Details" (test 66963) =====
  //
  // The stops label and the info glyph the manual test hovers live in the same clickable
  // .route-desc block, and it is a @click — not a hover — that opens the details dialog
  // (uk-rail-results.vue). So the label assertion and the open action are two methods over one
  // element, and the open below clicks rather than hovers.

  /**
   * Asserts one journey column of a direction is labelled with the expected number of changes,
   * e.g. "Direct".
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @param {number} columnIndex - 0-based journey column within that direction
   * @param {string} expectedLabel - e.g. "Direct"
   * @returns {Promise<string>} The label that was read
   */
  async expectJourneyStopsLabel(page, direction, columnIndex, expectedLabel) {
    if (!page) throw new Error('[EvolviResults.expectJourneyStopsLabel] "page" is required.');
    if (!Number.isInteger(columnIndex) || columnIndex < 0) {
      throw new Error(
        `[EvolviResults.expectJourneyStopsLabel] "columnIndex" must be a non-negative integer, got: ${columnIndex}`,
      );
    }
    if (!expectedLabel || typeof expectedLabel !== "string") {
      throw new Error(
        `[EvolviResults.expectJourneyStopsLabel] "expectedLabel" must be a non-empty string, got: ${expectedLabel}`,
      );
    }
    const { label: directionLabel, sectionIndex } = resolveDirection("expectJourneyStopsLabel", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.expectJourneyStopsLabel] Reading a journey column's stops label", {
      direction,
      columnIndex,
      expectedLabel,
    });
    const actualLabel = await resultsPage.getJourneyStopsLabel(sectionIndex, columnIndex);
    logger.info("[EvolviResults.expectJourneyStopsLabel] Read the stops label", { actualLabel });

    if (actualLabel !== expectedLabel) {
      throw new Error(
        `[EvolviResults.expectJourneyStopsLabel] Expected journey ${columnIndex + 1} of the ${directionLabel} ` +
          `results to be labelled "${expectedLabel}", but it reads "${actualLabel}" — this scenario checks the ` +
          "journey details of a journey with that exact number of changes.",
      );
    }

    return actualLabel;
  },

  /**
   * Opens the "More Details" dialog of one journey column of a direction.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @param {number} columnIndex - 0-based journey column within that direction
   * @returns {Promise<{opened: true}>}
   */
  async openJourneyDetails(page, direction, columnIndex) {
    if (!page) throw new Error('[EvolviResults.openJourneyDetails] "page" is required.');
    if (!Number.isInteger(columnIndex) || columnIndex < 0) {
      throw new Error(
        `[EvolviResults.openJourneyDetails] "columnIndex" must be a non-negative integer, got: ${columnIndex}`,
      );
    }
    const { label: directionLabel, sectionIndex } = resolveDirection("openJourneyDetails", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.openJourneyDetails] Opening a journey's More Details dialog", {
      direction,
      columnIndex,
    });
    try {
      await resultsPage.openJourneyDetailsForJourney(sectionIndex, columnIndex);
    } catch (err) {
      throw new Error(
        `[EvolviResults.openJourneyDetails] Could not open the journey details of journey ${columnIndex + 1} ` +
          `of the ${directionLabel} results, so the stations and travel mode this scenario verifies never ` +
          `came on screen. Original: ${err.message}`,
      );
    }

    return { opened: true };
  },

  /**
   * Asserts the open journey details table starts at the expected departure station and ends at the
   * expected arrival station — the table lists every stop in travel order, so the journey's own
   * endpoints are its first and last rows.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedDeparture
   * @param {string} expectedArrival
   * @returns {Promise<string[]>} The station names that were read, in travel order
   */
  async expectJourneyDetailsStations(page, expectedDeparture, expectedArrival) {
    if (!page) throw new Error('[EvolviResults.expectJourneyDetailsStations] "page" is required.');
    if (!expectedDeparture || typeof expectedDeparture !== "string") {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsStations] "expectedDeparture" must be a non-empty string, got: ${expectedDeparture}`,
      );
    }
    if (!expectedArrival || typeof expectedArrival !== "string") {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsStations] "expectedArrival" must be a non-empty string, got: ${expectedArrival}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.expectJourneyDetailsStations] Reading the journey details stations", {
      expectedDeparture,
      expectedArrival,
    });
    const stations = await resultsPage.getJourneyDetailsStationNames();
    logger.info("[EvolviResults.expectJourneyDetailsStations] Read the journey details stations", { stations });

    if (stations.length === 0) {
      throw new Error(
        "[EvolviResults.expectJourneyDetailsStations] The journey details table listed no stations at all, so " +
          `the departure ("${expectedDeparture}") and arrival ("${expectedArrival}") stations cannot be verified.`,
      );
    }

    const departure = stations[0];
    const arrival = stations[stations.length - 1];

    // Contains, not equals: the supplier prints the full station name, which for these routes is
    // the searched city plus its station qualifier (e.g. "Leeds", "Doncaster Rail Station").
    if (!departure.includes(expectedDeparture)) {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsStations] Expected the first row of the journey details to be the ` +
          `departure station "${expectedDeparture}", but it reads "${departure}" (full list: ${stations.join(" -> ")}).`,
      );
    }
    if (!arrival.includes(expectedArrival)) {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsStations] Expected the last row of the journey details to be the ` +
          `arrival station "${expectedArrival}", but it reads "${arrival}" (full list: ${stations.join(" -> ")}).`,
      );
    }

    return stations;
  },

  /**
   * Asserts the travel mode column of the first row of the open journey details table shows the
   * expected mode, e.g. "TRAIN".
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMode
   * @returns {Promise<string>} The travel mode that was read
   */
  async expectJourneyDetailsTravelMode(page, expectedMode) {
    if (!page) throw new Error('[EvolviResults.expectJourneyDetailsTravelMode] "page" is required.');
    if (!expectedMode || typeof expectedMode !== "string") {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsTravelMode] "expectedMode" must be a non-empty string, got: ${expectedMode}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.expectJourneyDetailsTravelMode] Reading the journey details travel mode", {
      expectedMode,
    });
    const actualMode = await resultsPage.getJourneyDetailsTravelMode(0);
    logger.info("[EvolviResults.expectJourneyDetailsTravelMode] Read the journey details travel mode", {
      actualMode,
    });

    if (actualMode.toUpperCase() !== expectedMode.toUpperCase()) {
      throw new Error(
        `[EvolviResults.expectJourneyDetailsTravelMode] Expected the travel mode of the first journey details row ` +
          `to be "${expectedMode}", but it reads "${actualMode}" — the Transport column is the supplier's ` +
          "trainServiceType, so an empty value means this row is not a change station.",
      );
    }

    return actualMode;
  },
};

module.exports = EvolviResults;
