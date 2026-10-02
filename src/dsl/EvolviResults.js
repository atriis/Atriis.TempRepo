const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const EvolviResultsPage = require("@pages/EvolviResultsPage");
const Results = require("./Results");
// Only for the generic open-drawer read/close (ANY_VISIBLE_DRAWER) — the fare-rules drawer the
// results grid opens is the very same drawer the quote card opens, so there is one implementation.
const Cart = require("./Cart");
const { parseAmountText } = require("@utils/dom");
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
 * The two time-navigation controls each direction's results header carries, in DOM order — the
 * "Earlier"/"Later" buttons that page the search window backwards and forwards
 * (uk-rail-results.ts's earlierSearch / laterSearch). Asserted by label rather than by count so a
 * results block that rendered some other pair of buttons fails with what it actually showed.
 */
const TIME_NAVIGATION_LABELS = ["Earlier", "Later"];

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
 * How far after the searched time the first returned journey may sit before the results are treated
 * as belonging to a different search window.
 *
 * Evolvi answers an OTA_RailAvail with the first services from the requested DepartureDateTime
 * onwards, so the earliest journey on screen is the next train after the time searched — minutes
 * away on a frequent route, never hours. A gap larger than this means the grid is showing a window
 * the scenario did not ask for (a re-search that dropped the time, or one that defaulted it), which
 * is exactly the mismatch this assertion exists to catch. Kept generous enough to absorb a genuine
 * service gap on a quiet route.
 */
const JOURNEY_START_TOLERANCE_MINUTES = 90;

/**
 * Turns a displayed or expected "HH:MM" into minutes past midnight, so two times can be compared
 * without depending on how either was formatted.
 *
 * @param {string} methodName - Calling DSL method, for error context
 * @param {string} argumentName - What was being read, for error context
 * @param {string} value - The raw time text
 * @returns {number} Minutes past midnight
 */
function toMinutesOfDay(methodName, argumentName, value) {
  const match = DEPARTURE_HOUR_PATTERN.exec(String(value ?? ""));
  if (!match) {
    throw new Error(
      `[EvolviResults.${methodName}] "${argumentName}" must carry a 24-hour HH:MM time, got: ${JSON.stringify(value)}`,
    );
  }
  const [hours, minutes] = match[1].split(":").map(Number);
  if (hours > 23 || minutes > 59) {
    throw new Error(
      `[EvolviResults.${methodName}] "${argumentName}" is not a valid 24-hour time, got: ${JSON.stringify(value)}`,
    );
  }
  return hours * 60 + minutes;
}

/**
 * Reads every journey column's departure time of one direction, as displayed and as minutes past
 * midnight. Shared by the assertions that check where the window starts and that it stays in order.
 *
 * @param {EvolviResultsPage} resultsPage
 * @param {string} methodName - Calling DSL method, for error context
 * @param {{label: string, sectionIndex: number, columnCount: number}} direction
 * @returns {Promise<{times: string[], minutes: number[]}>}
 */
async function readJourneyDepartureTimes(resultsPage, methodName, { label, sectionIndex, columnCount }) {
  const times = [];
  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    times.push(await resultsPage.getJourneyDepartureTimeText(sectionIndex, columnIndex));
  }
  const minutes = times.map((time, columnIndex) =>
    toMinutesOfDay(methodName, `${label} journey ${columnIndex + 1} departure time`, time),
  );
  return { times, minutes };
}

/**
 * The grid always renders 10 cells per price row, shared by both legs (isOutboundCell: 0-4
 * outbound, 5-9 inbound).
 */
const GRID_CELLS_PER_ROW = 10;
const OUTBOUND_CELLS_PER_ROW = 5;

/**
 * Turns one fare-type group's raw grid text into its AB#84258 sort key: the lowest non-blank
 * OUTBOUND price across every price row of the group, plus the journey column that price sits in
 * (columns run in departure order, so the lower column is the earlier departure — the tie-break).
 * Blank cells arrive as null and are skipped, never read as 0. An Anytime Return group needs no
 * special case: its outbound cells carry the stated combined price, and only its inbound cells
 * render "Select Time" (null here).
 *
 * @param {{title: string, rows: Array<Array<string|null>>}} group - One group from readFareGroupPriceTexts
 * @returns {{title: string, lowestPrice: number|null, column: number|null, blankOutboundCells: number}}
 */
function toFareGroupSortKey(group) {
  let lowestPrice = null;
  let column = null;
  let blankOutboundCells = 0;
  group.rows.forEach((row) => {
    row.slice(0, OUTBOUND_CELLS_PER_ROW).forEach((text, columnIndex) => {
      if (text === null) {
        blankOutboundCells += 1;
        return;
      }
      const price = parseAmountText(text, `"${group.title}" outbound price (column ${columnIndex + 1})`);
      if (lowestPrice === null || price < lowestPrice || (price === lowestPrice && columnIndex < column)) {
        lowestPrice = price;
        column = columnIndex;
      }
    });
  });
  return { title: group.title, lowestPrice, column, blankOutboundCells };
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
    // US 52510: on a MULTI-TRAVELLER search the cheapest suggested fare is often a group /
    // GroupSave one, and for those "Add to trip" only opens a confirmation dialog — the quote is
    // created by its "Continue" button, not by the click above. A single-traveller run never
    // raises the dialog (the app gates it on numberOfPassengers > 1), so this is a no-op there.
    const confirmedGroupFare = await resultsPage.confirmGroupFareDialogIfPresent();

    return { selected: true, confirmedGroupFare };
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
   * Verifies a direction's results heading reads exactly the given text.
   *
   * The language-independent form of expectDirectionHeadingDisplayed, for the scenarios that switch
   * the application language and then assert the translated heading ("Hinreise" for the German
   * outbound). It is also what those scenarios wait on: getResultsSectionHeadingText allows the 90s
   * an Evolvi round-trip search actually needs, where the generic "I should see the heading" step
   * gives up after 30s while the results grid is still on its "Removing duplicates" skeleton.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @param {string} expectedHeading - The heading text as it should be rendered in the current language
   * @returns {Promise<{direction: string, heading: string}>} The heading that was read
   */
  async expectDirectionHeadingText(page, direction, expectedHeading) {
    if (!page) throw new Error("[EvolviResults.expectDirectionHeadingText] page is required");
    const { sectionIndex } = resolveDirection("expectDirectionHeadingText", direction);
    if (typeof expectedHeading !== "string" || expectedHeading.trim() === "") {
      throw new Error(
        `[EvolviResults.expectDirectionHeadingText] "expectedHeading" must be a non-empty string, got: ${JSON.stringify(expectedHeading)}`,
      );
    }
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.expectDirectionHeadingText] Reading a direction heading", {
      direction,
      expectedHeading,
    });
    const heading = await resultsPage.getResultsSectionHeadingText(sectionIndex);

    logger.info("[EvolviResults.expectDirectionHeadingText] Read the direction heading", {
      direction,
      heading,
    });

    expect(
      heading,
      `The Evolvi results page should show the "${expectedHeading}" heading over the ${direction} journeys, ` +
      `but the heading read: "${heading}"`,
    ).toBe(expectedHeading);

    return { direction, heading };
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
    const { label } = resolveDirection("expectDirectionHeadingDisplayed", direction);

    return EvolviResults.expectDirectionHeadingText(page, direction, label);
  },


  /**
   * Verifies a direction returned journeys, reading it off the "Earlier"/"Later" navigation
   * controls in that direction's results header.
   *
   * Those controls are the honest signal that results came back: uk-rail-results.vue renders them
   * inside the same .data-section block as the direction's journey columns, so an empty answer
   * leaves the header with a heading and no way to page through anything. Asserting the pair also
   * rules out the half-rendered grid a bare presence check would accept.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{direction: string, controls: string[]}>} The control labels that were read
   */
  async expectDirectionResultsNavigationDisplayed(page, direction) {
    if (!page) throw new Error("[EvolviResults.expectDirectionResultsNavigationDisplayed] page is required");
    const { sectionIndex } = resolveDirection("expectDirectionResultsNavigationDisplayed", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug(
      "[EvolviResults.expectDirectionResultsNavigationDisplayed] Reading a direction's time-navigation controls",
      { direction },
    );
    const controls = await resultsPage.getDirectionTimeNavigationLabels(sectionIndex);

    logger.info(
      "[EvolviResults.expectDirectionResultsNavigationDisplayed] Read the time-navigation controls",
      { direction, controls },
    );

    expect(
      controls,
      `The Evolvi results header should offer the ${TIME_NAVIGATION_LABELS.join(" and ")} controls over the ` +
      `${direction} journeys — which is what says the search returned train results — but it showed: ` +
      `${JSON.stringify(controls)}`,
    ).toEqual(TIME_NAVIGATION_LABELS);

    return { direction, controls };
  },

  /**
   * Verifies a round-trip search returned train results for BOTH legs, by way of each direction's
   * "Earlier"/"Later" navigation controls.
   *
   * Checks the outbound first so a search that came back with nothing at all fails naming the leg
   * that is missing, rather than on whichever direction Playwright happened to read first.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{outbound: string[], inbound: string[]}>} The control labels read per leg
   */
  async expectRoundTripResultsReturned(page) {
    if (!page) throw new Error("[EvolviResults.expectRoundTripResultsReturned] page is required");

    const outbound = await EvolviResults.expectDirectionResultsNavigationDisplayed(page, "outbound");
    const inbound = await EvolviResults.expectDirectionResultsNavigationDisplayed(page, "inbound");

    return { outbound: outbound.controls, inbound: inbound.controls };
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
    if (!page) throw new Error("[EvolviResults.openSplitTicketInfoDialog] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.expectSplitTicketInfoDialogMessageAndClose] \"page\" is required.");
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
      "The \"Save with SplitTix\" dialog should explain what split ticketing is.",
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
    if (!page) throw new Error("[EvolviResults.hoverFirstBlueSplitTicketFare] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.expectBlueSplitTicketFareTooltipContains] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.verifyFareRulesFromFirstResultContainsText] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.selectAndAddFirstBlueSplitTicketFareToTrip] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.hoverGreenestSuggestedFare] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.expectGreenestFareTooltipContains] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.selectGreenestFare] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.extractSelectedFareTotalPrice] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.expectJourneyStopsLabel] \"page\" is required.");
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
   * Asserts one direction's journey grid starts at the time that direction was searched for.
   *
   * This is the results-side half of a search-criteria check: the payload assertions prove the app
   * ASKED for 07:00 outbound / 16:00 inbound, this proves the grid on screen is the answer to that
   * question. Both bounds matter and neither alone is enough — a journey earlier than the searched
   * time is a straight criteria violation, while a first journey hours later means the results
   * belong to some other time window (a re-search that silently defaulted or dropped the time).
   *
   * Deliberately reads nothing translated: it waits on the journey columns rather than the English
   * "Outbound"/"Suggested fares" texts, and the desktop grid prints the raw 24-hour departureDateTime
   * slice (uk-rail-results.vue), so this holds with the application in any language.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} direction - "outbound" or "inbound"
   * @param {string} expectedTime - The time that direction was searched for, 24-hour "HH:MM"
   * @param {object} [options]
   * @param {number} [options.toleranceMinutes=JOURNEY_START_TOLERANCE_MINUTES] - How long after
   *   expectedTime the earliest journey may depart
   * @returns {Promise<{direction: string, expectedTime: string, firstDepartureTime: string, times: string[]}>}
   */
  async expectJourneyTimesStartAt(
    page,
    direction,
    expectedTime,
    { toleranceMinutes = JOURNEY_START_TOLERANCE_MINUTES } = {},
  ) {
    if (!page) throw new Error("[EvolviResults.expectJourneyTimesStartAt] \"page\" is required.");
    const { label, sectionIndex } = resolveDirection("expectJourneyTimesStartAt", direction);
    const expectedMinutes = toMinutesOfDay("expectJourneyTimesStartAt", "expectedTime", expectedTime);
    if (!Number.isInteger(toleranceMinutes) || toleranceMinutes <= 0) {
      throw new Error(
        `[EvolviResults.expectJourneyTimesStartAt] "toleranceMinutes" must be a positive integer, got: ${toleranceMinutes}`,
      );
    }

    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug("[EvolviResults.expectJourneyTimesStartAt] Reading a direction's journey departure times", {
      direction,
      expectedTime,
      toleranceMinutes,
    });
    await resultsPage.waitForFirstJourneyColumn(sectionIndex);

    const columnCount = await resultsPage.getJourneyColumnCount(sectionIndex);
    if (columnCount === 0) {
      throw new Error(
        `[EvolviResults.expectJourneyTimesStartAt] No ${label} journey columns are displayed in the Evolvi ` +
          `results, so there is nothing to compare against the ${expectedTime} searched for that leg.`,
      );
    }

    const { times, minutes } = await readJourneyDepartureTimes(resultsPage, "expectJourneyTimesStartAt", {
      label,
      sectionIndex,
      columnCount,
    });

    const earliestMinutes = Math.min(...minutes);
    const firstDepartureTime = times[minutes.indexOf(earliestMinutes)];
    logger.info("[EvolviResults.expectJourneyTimesStartAt] Read the journey departure times", {
      direction,
      expectedTime,
      firstDepartureTime,
      times,
    });

    if (earliestMinutes < expectedMinutes) {
      throw new Error(
        `[EvolviResults.expectJourneyTimesStartAt] The ${label} results should start no earlier than the ` +
          `${expectedTime} searched, but the earliest journey on screen departs at ${firstDepartureTime} — the ` +
          `results do not match the search criteria. Journey times read: ${times.join(", ")}.`,
      );
    }

    if (earliestMinutes - expectedMinutes > toleranceMinutes) {
      throw new Error(
        `[EvolviResults.expectJourneyTimesStartAt] The ${label} results should start at the ${expectedTime} ` +
          `searched, but the earliest journey on screen departs at ${firstDepartureTime}, ` +
          `${earliestMinutes - expectedMinutes} minutes later (tolerance: ${toleranceMinutes} minutes) — the grid ` +
          `is showing a different time window than the one searched. Journey times read: ${times.join(", ")}.`,
      );
    }

    return { direction, expectedTime, firstDepartureTime, times };
  },

  /**
   * AB#84258: asserts the fare-type groups of the price grid are ordered from the lowest to the
   * highest outbound price.
   *
   * Each group's sort value is its lowest non-blank outbound price (blank cells are skipped, never
   * treated as zero; an Anytime Return group's outbound cells already carry its combined price).
   * Groups sharing the same sort value must be ordered by the earlier departure column. Groups with
   * no outbound price at all (an inbound-only fare type on a round trip) have no sort value under
   * the story's rules, so they are left out of the comparison and logged.
   *
   * Which of those cases actually occur depends on the supplier's live inventory, so the method
   * reports what it saw (ties, blank cells, Anytime Return groups) instead of requiring them.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{order: Array<object>, ties: number, groupsWithBlanks: number, unpricedGroups: string[]}>}
   */
  async expectFareGroupsSortedByLowestOutboundPrice(page) {
    if (!page) throw new Error("[EvolviResults.expectFareGroupsSortedByLowestOutboundPrice] \"page\" is required.");
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const groups = await resultsPage.readFareGroupPriceTexts();
    if (groups.length === 0) {
      throw new Error(
        "[EvolviResults.expectFareGroupsSortedByLowestOutboundPrice] The Evolvi price grid rendered no fare-type " +
          "groups, so there is no row order to check.",
      );
    }

    const keys = groups.map(toFareGroupSortKey);
    const order = keys.filter((key) => key.lowestPrice !== null);
    const unpricedGroups = keys.filter((key) => key.lowestPrice === null).map((key) => key.title);
    const describe = (key) => `"${key.title}" ${key.lowestPrice} (column ${key.column + 1})`;

    const violations = [];
    let ties = 0;
    for (let index = 1; index < order.length; index += 1) {
      const previous = order[index - 1];
      const current = order[index];
      if (current.lowestPrice === previous.lowestPrice) {
        ties += 1;
        if (current.column < previous.column) {
          violations.push(`${describe(previous)} is tied with but listed before the earlier departure ${describe(current)}`);
        }
      } else if (current.lowestPrice < previous.lowestPrice) {
        violations.push(`${describe(previous)} is listed before the cheaper ${describe(current)}`);
      }
    }

    const summary = {
      order: order.map(({ title, lowestPrice, column }) => ({ title, lowestPrice, column: column + 1 })),
      ties,
      groupsWithBlanks: order.filter((key) => key.blankOutboundCells > 0).length,
      anytimeReturnGroups: order.filter((key) => /anytime return/i.test(key.title)).map((key) => key.title),
      unpricedGroups,
    };
    logger.info("[EvolviResults.expectFareGroupsSortedByLowestOutboundPrice] Read the fare-type row order", summary);

    if (order.length < 2) {
      logger.warn(
        "[EvolviResults.expectFareGroupsSortedByLowestOutboundPrice] Fewer than two priced fare-type groups were " +
          "returned, so the row order is trivially sorted.",
        { groups: keys.map((key) => key.title) },
      );
    }

    if (violations.length > 0) {
      throw new Error(
        "[EvolviResults.expectFareGroupsSortedByLowestOutboundPrice] The Evolvi fare-type rows are not ordered by " +
          `their lowest outbound price: ${violations.join("; ")}. Grid order read: ${order.map(describe).join(", ")}.`,
      );
    }

    return summary;
  },

  /**
   * Navigates from the Evolvi results back to the trip search page through the results
   * breadcrumb, so a new search can be run in the same trip.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{navigated: true}>}
   */
  async navigateBackToSearchViaBreadcrumb(page) {
    if (!page) throw new Error("[EvolviResults.navigateBackToSearchViaBreadcrumb] \"page\" is required.");
    const resultsPage = getPageObject(page, EvolviResultsPage);
    await resultsPage.clickBreadcrumbSearchLink();
    return { navigated: true };
  },

  /**
   * Asserts one direction's journey columns run in chronological departure order. AB#84258 sorts
   * the fare-type ROWS by price; the departure-time COLUMNS must stay untouched.
   *
   * @param {import('playwright').Page} page
   * @param {string} direction - "outbound" or "inbound"
   * @returns {Promise<{direction: string, times: string[]}>}
   */
  async expectJourneyDepartureTimesChronological(page, direction) {
    if (!page) throw new Error("[EvolviResults.expectJourneyDepartureTimesChronological] \"page\" is required.");
    const { label, sectionIndex } = resolveDirection("expectJourneyDepartureTimesChronological", direction);
    const resultsPage = getPageObject(page, EvolviResultsPage);

    await resultsPage.waitForFirstJourneyColumn(sectionIndex);
    const columnCount = await resultsPage.getJourneyColumnCount(sectionIndex);

    const { times, minutes } = await readJourneyDepartureTimes(
      resultsPage,
      "expectJourneyDepartureTimesChronological",
      { label, sectionIndex, columnCount },
    );
    logger.info("[EvolviResults.expectJourneyDepartureTimesChronological] Read the journey departure times", {
      direction,
      times,
    });

    const outOfOrder = minutes.findIndex((value, index) => index > 0 && value < minutes[index - 1]);
    if (outOfOrder !== -1) {
      throw new Error(
        `[EvolviResults.expectJourneyDepartureTimesChronological] The ${label} journey columns should stay in ` +
          `chronological order, but ${times[outOfOrder]} (column ${outOfOrder + 1}) follows ` +
          `${times[outOfOrder - 1]}. Departure times read: ${times.join(", ")}.`,
      );
    }

    return { direction, times };
  },

  /**
   * AB#84258: asserts the round-trip grid keeps both legs in one table — every price row of every
   * fare-type group spans the full outbound + inbound width, so sorting rows by outbound price
   * carries the inbound prices with them (there is no separately ordered inbound table). Also
   * requires at least one priced inbound cell, so a one-way grid cannot pass as a round trip.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{groups: number, pricedInboundCells: number}>}
   */
  async expectFareGroupsCarryBothDirections(page) {
    if (!page) throw new Error("[EvolviResults.expectFareGroupsCarryBothDirections] \"page\" is required.");
    const resultsPage = getPageObject(page, EvolviResultsPage);

    const groups = await resultsPage.readFareGroupPriceTexts();
    const narrowRows = groups.flatMap((group) =>
      group.rows
        .map((row, rowIndex) => ({ title: group.title, rowIndex, cells: row.length }))
        .filter((row) => row.cells !== GRID_CELLS_PER_ROW),
    );
    const pricedInboundCells = groups
      .flatMap((group) => group.rows.flatMap((row) => row.slice(OUTBOUND_CELLS_PER_ROW)))
      .filter((text) => text !== null).length;
    logger.info("[EvolviResults.expectFareGroupsCarryBothDirections] Read the round-trip grid shape", {
      groups: groups.length,
      pricedInboundCells,
    });

    if (groups.length === 0 || narrowRows.length > 0) {
      throw new Error(
        "[EvolviResults.expectFareGroupsCarryBothDirections] Every fare-type row should show its outbound and " +
          `inbound prices side by side (${GRID_CELLS_PER_ROW} cells), but the grid rendered ` +
          `${groups.length === 0 ? "no fare-type groups" : `rows of a different width: ${JSON.stringify(narrowRows)}`}.`,
      );
    }
    if (pricedInboundCells === 0) {
      throw new Error(
        "[EvolviResults.expectFareGroupsCarryBothDirections] No fare-type row shows an inbound price, so the grid " +
          "is not showing both legs of the round trip side by side.",
      );
    }

    return { groups: groups.length, pricedInboundCells };
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
    if (!page) throw new Error("[EvolviResults.openJourneyDetails] \"page\" is required.");
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
    if (!page) throw new Error("[EvolviResults.expectJourneyDetailsStations] \"page\" is required.");
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
        "[EvolviResults.expectJourneyDetailsStations] Expected the first row of the journey details to be the " +
          `departure station "${expectedDeparture}", but it reads "${departure}" (full list: ${stations.join(" -> ")}).`,
      );
    }
    if (!arrival.includes(expectedArrival)) {
      throw new Error(
        "[EvolviResults.expectJourneyDetailsStations] Expected the last row of the journey details to be the " +
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
    if (!page) throw new Error("[EvolviResults.expectJourneyDetailsTravelMode] \"page\" is required.");
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
        "[EvolviResults.expectJourneyDetailsTravelMode] Expected the travel mode of the first journey details row " +
          `to be "${expectedMode}", but it reads "${actualMode}" — the Transport column is the supplier's ` +
          "trainServiceType, so an empty value means this row is not a change station.",
      );
    }

    return actualMode;
  },

  /**
   * Verifies at least one fare in the Evolvi price grid is priced as a travel-together (GroupSave)
   * fare — the "Discount" label uk-rail-results.vue prints inside a price cell whenever that cell's
   * priceDetails.isTravelTogether is set (US 52510).
   *
   * This is the whole point of test 46785: a search carrying several travellers must come back with
   * group-discounted fares. Asserting on the label rather than on prices is what makes that check
   * meaningful — a cheaper amount could come from any number of causes, whereas the label is the app
   * stating outright that Evolvi priced the fare for the group.
   *
   * "At least one" is deliberate and matches the manual step: which fare types qualify for GroupSave
   * is the supplier's call and varies by route and date, so pinning the assertion to a named fare
   * would fail on live inventory that is behaving correctly.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{labels: string[], fareGroups: string[]}>} The labels found and the fare groups carrying them
   */
  async expectTravelTogetherDiscountDisplayed(page) {
    if (!page) throw new Error("[EvolviResults.expectTravelTogetherDiscountDisplayed] page is required");
    const resultsPage = getPageObject(page, EvolviResultsPage);

    logger.debug(
      "[EvolviResults.expectTravelTogetherDiscountDisplayed] Looking for a travel-together discount label in the price grid",
    );
    const labels = await resultsPage.getTravelTogetherDiscountLabels();

    if (labels.length === 0) {
      throw new Error(
        "[EvolviResults.expectTravelTogetherDiscountDisplayed] No fare in the Evolvi price grid shows a " +
          "travel-together discount label. uk-rail-results.vue only renders a .discount-label span in a " +
          "price cell when that fare's isTravelTogether is set, so Evolvi priced none of the returned fares as a " +
          "group fare for the travellers on this search.",
      );
    }

    const fareGroups = await resultsPage.getFareGroupTitlesWithTravelTogetherDiscount();
    logger.info("[EvolviResults.expectTravelTogetherDiscountDisplayed] Travel-together discount displayed", {
      discountedCells: labels.length,
      label: labels[0],
      fareGroups,
    });

    return { labels, fareGroups };
  },

  /**
   * Assigns a rail card to one traveller row in the "Railcard Assignment" Cart Extra.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} travelerIndex - 0-based row, in trip.passengers order
   * @param {string} railcardOption - Exact option label as rendered, e.g. "YNG - 16-25 Railcard"
   * @returns {Promise<{assigned: true, travelerIndex: number, railcardOption: string}>}
   */
  async assignRailcardInExtra(page, travelerIndex, railcardOption) {
    if (!page) throw new Error("[EvolviResults.assignRailcardInExtra] page is required");
    if (!Number.isInteger(travelerIndex) || travelerIndex < 0) {
      throw new Error(
        `[EvolviResults.assignRailcardInExtra] "travelerIndex" must be a non-negative integer, got: ${travelerIndex}`,
      );
    }
    if (!railcardOption || typeof railcardOption !== "string") {
      throw new Error(
        `[EvolviResults.assignRailcardInExtra] "railcardOption" must be a non-empty string, got: ${typeof railcardOption}`,
      );
    }

    const resultsPage = getPageObject(page, EvolviResultsPage);
    await resultsPage.openRailcardAssignmentDropdown(travelerIndex);
    await resultsPage.selectRailcardAssignmentOption(railcardOption);

    return { assigned: true, travelerIndex, railcardOption };
  },

  /**
   * Saves the "Railcard Assignment" Cart Extra with whatever assignments are currently set.
   * Rows left untouched (no railcard assigned) simply stay empty — the select is clearable and
   * has no default value, so "leaving a traveller without a railcard" needs no explicit action.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{saved: true}>}
   */
  async saveRailcardAssignmentExtra(page) {
    if (!page) throw new Error("[EvolviResults.saveRailcardAssignmentExtra] page is required");
    const resultsPage = getPageObject(page, EvolviResultsPage);
    await resultsPage.clickRailcardAssignmentSave();
    return { saved: true };
  },
};

module.exports = EvolviResults;
