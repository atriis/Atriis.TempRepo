const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { toNumber } = require("@utils/numbers");
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

/**
 * Converts a `rgb(r, g, b)` / `rgba(r, g, b, a)` computed-style color string into lowercase hex
 * (e.g. "rgb(239, 68, 56)" -> "#ef4438"), so it can be compared against the fixed hex colors
 * eu-rail-preview.scss's .change-text renders ($red-200 / $green-300).
 * @param {string} rgb
 * @returns {string}
 */
function parseRgbToHex(rgb) {
  const parts = (rgb ?? "").match(/\d+/g)?.map(Number) ?? [];
  if (parts.length < 3) {
    throw new Error(`Could not parse an RGB color from Benerail change-text computed style: "${rgb}"`);
  }
  return "#" + parts.slice(0, 3).map((value) => value.toString(16).padStart(2, "0")).join("");
}

// eu-rail-preview.scss's .change-text: $red-200 for "N changes", $green-300 (via the .green
// modifier class) for "Direct" — see Atriis.OBT's src/assets/style/abstracts/_variables.scss.
const CHANGES_COLOR_HEX = "#ef4438";
const DIRECT_COLOR_HEX = "#4caf4e";

// eu-rail-stepper.ts's getStepperText(): "dd MMM " + the leg's HH:mm/h:mm AM/PM time, e.g.
// "05 Jan 14:30" or "05 Jan 2:30 PM".
const STEPPER_DATE_TIME_PATTERN = /\d{1,2}\s+[A-Za-z]{3}\s+\d{1,2}:\d{2}(\s*[AP]M)?/i;

// The time half of that same text — the date prefix is fixed-width but the time is what the
// search was actually run for, so it is pulled off the end in either notation.
const STEPPER_TIME_PATTERN = /(\d{1,2}:\d{2}(?:\s*[AP]M)?)\s*$/i;

// eu-rail-stepper.ts pushes the outbound leg first and the inbound/return leg second (the latter
// only when the search carries a return date — i.e. only on a round trip).
const STEPPER_LEG_INDEXES = { outbound: 0, inbound: 1 };

/**
 * Parses a price-breakdown passenger-row label (eu-rail-price-breakdown.vue, e.g. "2 Adult")
 * into its traveler count and age-association type.
 * @param {string} labelText
 * @returns {{count: number, type: string}}
 */
function parsePassengerBreakdownLabel(labelText) {
  const match = (labelText ?? "").match(/^(\d+)\s+(.+)$/);
  if (!match) {
    throw new Error(`Could not parse a traveler count from Benerail price breakdown label: "${labelText}"`);
  }
  return { count: Number(match[1]), type: match[2].trim() };
}

/**
 * Checks whether a journey stepper segment snapshot matches one of its three named states.
 * "active" and "completed" are not mutually exclusive in the app itself — eu-rail-stepper.ts's
 * isActive formula (`shownSegment === idx+1 || selectedSegments[idx+1]`) stays true for a leg
 * after it's picked, it's just that the completed segment's CSS rule (:has(.check-icon)) is
 * declared after .isActive in eu-rail-stepper.scss and wins the cascade regardless — so visually,
 * and for this check, "completed" only requires the checkmark, independent of isActive.
 * @param {{isActive: boolean, isCompleted: boolean}} state
 * @param {"active"|"completed"|"default"} expected
 * @returns {boolean}
 */
function stepperSegmentMatchesState(state, expected) {
  if (expected === "active") return state.isActive && !state.isCompleted;
  if (expected === "completed") return state.isCompleted;
  if (expected === "default") return !state.isActive && !state.isCompleted;
  throw new Error(`Unknown expected stepper state: "${expected}"`);
}

/**
 * Polls a journey stepper segment (see BenerailResultsPage.getJourneyStepperSegmentState) until it
 * reaches the given named state, then validates it shows a date + time. Polling — rather than one
 * read — absorbs the client-side re-render after a leg is selected (a purely local Vue state
 * change with no request to await; the same kind of race BenerailResultsPage's
 * clickFirstSelectButtonAndConfirmTransition already works around on the click side, AB#81914).
 * @param {import('@pages/BenerailResultsPage').BenerailResultsPage} benerailResultsPage
 * @param {number} index - 0 for outbound, 1 for inbound/return
 * @param {string} legLabel - "outbound" or "inbound", for error messages
 * @param {"active"|"completed"|"default"} expected
 * @param {number} [timeout=30000]
 * @returns {Promise<{isActive: boolean, isCompleted: boolean, stepText: string}>}
 */
async function waitForStepperSegmentState(benerailResultsPage, index, legLabel, expected, timeout = 30000) {
  let lastState;
  let lastError;
  await expect.poll(
    async () => {
      // Selecting a leg tears the whole results view down while the next leg is fetched ("Calculating
      // the best offers"), taking the stepper out of the DOM with it — a read landing in that window
      // throws, and expect.poll propagates a thrown callback rather than retrying it, so swallow it
      // here and let the poll keep going until the stepper comes back with the results.
      try {
        lastState = await benerailResultsPage.getJourneyStepperSegmentState(index, 3000);
        lastError = undefined;
      } catch (error) {
        lastError = error;
        return false;
      }
      return stepperSegmentMatchesState(lastState, expected);
    },
    {
      timeout,
      message: () => lastError
        ? `Timed out reading the ${legLabel} stepper step while waiting for its "${expected}" state, last error: ${lastError.message}`
        : `Timed out waiting for the ${legLabel} stepper step to reach its "${expected}" state, last read: ${JSON.stringify(lastState)}`,
    },
  ).toBe(true);

  if (!STEPPER_DATE_TIME_PATTERN.test(lastState.stepText)) {
    throw new Error(`Expected the ${legLabel} stepper step to show a date and time, got: "${lastState.stepText}"`);
  }
  return lastState;
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
   * Counts the Benerail result cards currently rendered — the baseline to read before clicking
   * "Show Later Departures", so verifyLaterDeparturesDisplayed has something to compare against.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async getResultCount(page) {
    if (!page) throw new Error("[BenerailResults.getResultCount] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    return benerailResultsPage.getResultCardCount();
  },

  /**
   * Verifies "Show Later Departures" actually opened further departures. The outbound list grows
   * in place (eu-rail.store.ts's loadLaterRails -> appendRailSegments), so the "Select" text the
   * click itself waits on is present before and after and proves nothing — only a grown card
   * count proves the later results arrived (test 51524).
   * @param {import('playwright').Page} page
   * @param {number} previousCardCount - Result-card count read before the click
   */
  async verifyLaterDeparturesDisplayed(page, previousCardCount) {
    if (!page) throw new Error("[BenerailResults.verifyLaterDeparturesDisplayed] page is required");
    if (!Number.isInteger(previousCardCount) || previousCardCount < 0) {
      throw new Error(
        `[BenerailResults.verifyLaterDeparturesDisplayed] "previousCardCount" must be a non-negative ` +
        `integer, got: ${typeof previousCardCount} (${previousCardCount})`,
      );
    }

    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.waitForNewResultCardsAppended(previousCardCount);
    const currentCardCount = await benerailResultsPage.getResultCardCount();
    return { previousCardCount, currentCardCount };
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
   * Reads the first Benerail result's arrival time without navigating — used as the results-page
   * baseline before comparing against the Journey Details panel (see test 44941).
   * @param {import('playwright').Page} page
   * @returns {Promise<{raw: string, minutes: number}>}
   */
  async extractFirstResultArrivalTime(page) {
    if (!page) throw new Error("[BenerailResults.extractFirstResultArrivalTime] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const raw = await benerailResultsPage.getFirstResultArrivalTimeText();
    return { raw, minutes: parseTimeOfDayToMinutes(raw) };
  },

  /**
   * Opens the Journey Details panel for the first Benerail result.
   * @param {import('playwright').Page} page
   */
  async openJourneyDetailsForFirstResult(page) {
    if (!page) throw new Error("[BenerailResults.openJourneyDetailsForFirstResult] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.openJourneyDetailsForResultAtIndex(0);
    return { opened: true };
  },

  /**
   * Verifies the given text (e.g. a station name) is visible in the open Journey Details panel —
   * checked against both the departure and arrival station text (see test 44941).
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{matchedLeg: string, actualText: string}>}
   * @throws {Error} If neither the departure nor arrival station text contains expectedText
   */
  async verifyStationVisibleInJourneyDetails(page, expectedText) {
    if (!page) throw new Error("[BenerailResults.verifyStationVisibleInJourneyDetails] page is required");
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(`[BenerailResults.verifyStationVisibleInJourneyDetails] "expectedText" must be a non-empty string, got: ${typeof expectedText}`);
    }
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const departureText = await benerailResultsPage.getJourneyDetailsStationText({ leg: "departure" });
    const arrivalText = await benerailResultsPage.getJourneyDetailsStationText({ leg: "arrival" });
    const needle = expectedText.toLowerCase();

    if (departureText.toLowerCase().includes(needle)) {
      return { matchedLeg: "departure", actualText: departureText };
    }
    if (arrivalText.toLowerCase().includes(needle)) {
      return { matchedLeg: "arrival", actualText: arrivalText };
    }

    throw new Error(
      `[BenerailResults.verifyStationVisibleInJourneyDetails] Expected to see "${expectedText}" in the ` +
      `Benerail Journey Details panel, but departure shows "${departureText}" and arrival shows "${arrivalText}"`
    );
  },

  /**
   * Verifies the "Travel Time" heading is visible in the open Journey Details panel (see test
   * 62215).
   * @param {import('playwright').Page} page
   * @returns {Promise<{actualText: string}>}
   * @throws {Error} If the heading is missing or does not mention "Travel Time"
   */
  async verifyTravelTimeVisibleInJourneyDetails(page) {
    if (!page) throw new Error("[BenerailResults.verifyTravelTimeVisibleInJourneyDetails] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const travelTimeText = await benerailResultsPage.getJourneyDetailsTravelTimeText();

    if (!travelTimeText.toLowerCase().includes("travel time")) {
      throw new Error(
        `[BenerailResults.verifyTravelTimeVisibleInJourneyDetails] Expected the Benerail Journey ` +
        `Details panel to show a "Travel Time" heading, but it showed "${travelTimeText}"`
      );
    }
    return { actualText: travelTimeText };
  },

  /**
   * Verifies the given text is shown in the Benerail results page breadcrumb's first item (the
   * "Search" link) — confirms the search tab/link is still reachable after searching (see test
   * hybrid_44798).
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @throws {Error} If the breadcrumb's first item does not show expectedText
   */
  async verifyTextVisibleInBreadcrumb(page, expectedText) {
    if (!page) throw new Error("[BenerailResults.verifyTextVisibleInBreadcrumb] page is required");
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(`[BenerailResults.verifyTextVisibleInBreadcrumb] "expectedText" must be a non-empty string, got: ${typeof expectedText}`);
    }
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const actualText = await benerailResultsPage.getBreadcrumbSearchLinkText();

    if (actualText !== expectedText) {
      throw new Error(
        `[BenerailResults.verifyTextVisibleInBreadcrumb] Expected to see "${expectedText}" in the ` +
        `Benerail results breadcrumb, but it shows "${actualText}"`
      );
    }
  },

  /**
   * Reads the departure and arrival times from the open Journey Details panel.
   * @param {import('playwright').Page} page
   * @returns {Promise<{departure: {raw: string, minutes: number}, arrival: {raw: string, minutes: number}}>}
   */
  async extractJourneyDetailsTimes(page) {
    if (!page) throw new Error("[BenerailResults.extractJourneyDetailsTimes] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const { departureRaw, arrivalRaw } = await benerailResultsPage.getJourneyDetailsTimes();
    return {
      departure: { raw: departureRaw, minutes: parseTimeOfDayToMinutes(departureRaw) },
      arrival: { raw: arrivalRaw, minutes: parseTimeOfDayToMinutes(arrivalRaw) },
    };
  },

  /**
   * Closes the open Journey Details panel.
   * @param {import('playwright').Page} page
   */
  async closeJourneyDetailsPanel(page) {
    if (!page) throw new Error("[BenerailResults.closeJourneyDetailsPanel] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.closeJourneyDetailsDialog();
    return { closed: true };
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

  /** Clicks "Show Earlier Departures" on the outbound results and waits for the refresh */
  async clickShowEarlierDepartures(page) {
    if (!page) throw new Error("[BenerailResults.clickShowEarlierDepartures] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.clickShowEarlierDeparturesButton();
    return { clicked: true };
  },

  /**
   * Clicks "Show Earlier Departures" and reads the departure time of the first newly-loaded
   * earlier result. Unlike "Show Later Departures" (which appends to the end of the list — see
   * clickLaterAndExtractFirstResultDepartureTime), "Show Earlier Departures" prepends new results
   * to the start of the outbound list (eu-rail.store.ts's loadEarlierRails → prependRailSegments),
   * so the first newly-loaded earlier result is always the page's new first result card,
   * regardless of how many cards were already loaded (see test 62220).
   * @param {import('playwright').Page} page
   * @returns {Promise<{raw: string, minutes: number}>}
   */
  async clickEarlierAndExtractFirstResultDepartureTime(page) {
    if (!page) throw new Error("[BenerailResults.clickEarlierAndExtractFirstResultDepartureTime] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const previousCardCount = await benerailResultsPage.getResultCardCount();
    await BenerailResults.clickShowEarlierDepartures(page);
    await benerailResultsPage.waitForNewResultCardsAppended(previousCardCount);
    const raw = await benerailResultsPage.getDepartureTimeTextForResultAtIndex(0);
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
   * Reads the first train company of the route shown on the Benerail result card at the given
   * index — the assertion itself belongs to the step (see dsl.md).
   * @param {import('playwright').Page} page
   * @param {number} [index=0] - 0-based result card index
   * @returns {Promise<string>} Carrier name, e.g. "InterCity Express"
   */
  async getFirstTrainCompanyForResult(page, index = 0) {
    if (!page) throw new Error("[BenerailResults.getFirstTrainCompanyForResult] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    return await benerailResultsPage.getFirstRouteCarrierNameForResult(index);
  },

  /**
   * Selects the named fare (e.g. "full flex") from the already-expanded "More Options" alternatives
   * and adds it to the trip. Expects expandMoreOptionsForFirstResult to have run first — matching
   * the feature's own "expand more options / add fare" step split.
   * @param {import('playwright').Page} page
   * @param {string} fareName - Fare/brand name as shown on the alternative, e.g. "full flex"
   */
  async addBenerailFareOneWayToTrip(page, fareName) {
    if (!page) throw new Error("[BenerailResults.addBenerailFareOneWayToTrip] page is required");
    if (!fareName || typeof fareName !== "string") {
      throw new Error(
        `[BenerailResults.addBenerailFareOneWayToTrip] "fareName" must be a non-empty string, got: ${typeof fareName}`,
      );
    }

    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.selectMoreOptionsFareByName(fareName);
    await BenerailResults.clickAddToTripBenerail(page);

    return { addedToTrip: true, fareName };
  },

  /**
   * Waits for the committed leg's "Change" button on a round trip — the gate that proves the
   * outbound selection was accepted and the results list below now belongs to the inbound leg.
   *
   * Deliberately NOT the shared "I wait to see change button" step (Results.
   * waitForShareButtonChangeInResults): despite its wording, that one waits for a *share quote*
   * button to flip to its "Added" state, which never happens outside share mode.
   * @param {import('playwright').Page} page
   */
  async waitForSelectedLegChangeButton(page) {
    if (!page) throw new Error('[BenerailResults.waitForSelectedLegChangeButton] page is required');
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    try {
      await benerailResultsPage.waitForSelectedLegChangeButton();
    } catch (error) {
      throw new Error(
        `[BenerailResults.waitForSelectedLegChangeButton] The Benerail outbound leg was not ` +
        `committed, so the inbound results are not showing yet. Original: ${error.message}`,
      );
    }
    return { outboundCommitted: true };
  },

  /**
   * Selects an alternative revealed by "More Options" WITHOUT adding it to the trip — the
   * select-only half of addBenerailFareOneWayToTrip, for scenarios that add both legs of a round
   * trip with a single "Add to trip" afterwards (test 52934).
   *
   * `fareDescriptor` matches either descriptor the alternative row prints — its travel class
   * ("1st Class") or its fare brand ("Full flex") — because eu-rail-preview.vue gives both the
   * same class (see BenerailResultsPage.ALTERNATIVE_BRAND_NAME).
   * @param {import('playwright').Page} page
   * @param {string} fareDescriptor - Travel class or fare brand shown on the alternative
   */
  async selectBenerailFareFromMoreOptions(page, fareDescriptor) {
    if (!page) throw new Error('[BenerailResults.selectBenerailFareFromMoreOptions] page is required');
    if (!fareDescriptor || typeof fareDescriptor !== "string") {
      throw new Error(
        `[BenerailResults.selectBenerailFareFromMoreOptions] "fareDescriptor" must be a non-empty string, got: ${typeof fareDescriptor}`,
      );
    }

    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    try {
      await benerailResultsPage.selectMoreOptionsFareByName(fareDescriptor);
    } catch (error) {
      throw new Error(
        `[BenerailResults.selectBenerailFareFromMoreOptions] Could not select the "${fareDescriptor}" ` +
        `alternative from the expanded "More Options" list. Original: ${error.message}`,
      );
    }

    return { selected: true, fareDescriptor };
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
   * Verifies the Benerail result at the given index shows a consistent journey-summary
   * indicator: "Direct" in green with zero change dots, or "N changes" in red with exactly N
   * rendered change dots (eu-rail-preview.vue renders one .journey-change-dot per
   * rail.railChanges entry, colored via $red-200/$green-300 — see test 67510). The color check
   * guards against the exact bug class this ticket targets: a route that actually has a change
   * but gets mislabeled/rendered as "Direct" (or vice versa) would still be internally consistent
   * on dot count alone.
   * @param {import('playwright').Page} page
   * @param {number} [index=0]
   * @returns {Promise<{changeText: string, dotCount: number, expectedChanges: number}>}
   * @throws {Error} If the change count parsed from the text doesn't match the rendered dot
   *   count, or the text color doesn't match its Direct/changes state
   */
  async verifyJourneySummaryChangesMatchDots(page, index = 0) {
    if (!page) throw new Error("page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const { changeText, changeTextColor, dotCount } = await benerailResultsPage.getJourneySummaryForResultAtIndex(index);
    const hexColor = parseRgbToHex(changeTextColor);

    const changeMatch = changeText.match(/(\d+)\s*change/i);
    if (!changeMatch) {
      if (dotCount !== 0) {
        throw new Error(`Expected no change dots for a direct Benerail journey ("${changeText}"), but found ${dotCount}`);
      }
      if (hexColor !== DIRECT_COLOR_HEX) {
        throw new Error(`Expected "${changeText}" to render in green (${DIRECT_COLOR_HEX}) for a direct journey, got ${hexColor}`);
      }
      return { changeText, dotCount, expectedChanges: 0 };
    }

    const expectedChanges = Number(changeMatch[1]);
    if (dotCount !== expectedChanges) {
      throw new Error(`Benerail journey summary shows "${changeText}" but rendered ${dotCount} change dot(s) — expected ${expectedChanges}`);
    }
    if (hexColor !== CHANGES_COLOR_HEX) {
      throw new Error(`Expected "${changeText}" to render in red (${CHANGES_COLOR_HEX}) for a non-direct journey, got ${hexColor}`);
    }
    return { changeText, dotCount, expectedChanges };
  },

  /**
   * Verifies the "no trains found" empty state is displayed with the expected title text — the
   * edge case where a traveler's profile has no pre-configured rail content and the search
   * returns no results (see test 62867). Cannot reuse
   * Results.validateNoResultsTitle/ResultsPage.waitForNoResultsTitle ('.app-no-results h3'):
   * that selector expects app-no-results-search.vue's default <h3>-wrapped fallback, but
   * eu-rail-results.vue overrides the '#no-result-title' slot with plain interpolated text and no
   * <h3> wrapper, so the shared h3 selector never matches here. Falls back to the shared container
   * getter (ResultsPage.getNoResultsContainer) and a text-contains check on the whole container.
   * @param {import('playwright').Page} page
   * @param {string} expectedTitleText - Expected no-trains-found title substring
   * @throws {Error} If the no-results panel never appears or its title text doesn't match
   */
  async verifyNoTrainsFoundMessage(page, expectedTitleText) {
    if (!page) throw new Error("[BenerailResults.verifyNoTrainsFoundMessage] page is required");
    if (!expectedTitleText || typeof expectedTitleText !== "string") {
      throw new Error(`[BenerailResults.verifyNoTrainsFoundMessage] "expectedTitleText" must be a non-empty string, got: ${typeof expectedTitleText}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const container = resultsPage.getNoResultsContainer();
    try {
      await container.waitFor({ state: "visible", timeout: 60000 });
      await expect(container, `[BenerailResults.verifyNoTrainsFoundMessage] Expected the Benerail no-results panel to contain "${expectedTitleText}"`).toContainText(expectedTitleText, { timeout: 60000 });
    } catch (err) {
      throw new Error(`[BenerailResults.verifyNoTrainsFoundMessage] The Benerail no-trains-found message ("${expectedTitleText}") never appeared. Original: ${err.message}`);
    }
    return { visible: true, expectedTitleText };
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

  /**
   * Verifies the journey stepper (eu-rail-stepper.vue) before any leg has been selected: the
   * outbound step is highlighted/active and the inbound step is in its default (grey) state, both
   * showing their date and time.
   */
  async verifyJourneyStepperBeforeSelection(page) {
    if (!page) throw new Error("[BenerailResults.verifyJourneyStepperBeforeSelection] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const [outbound, inbound] = await Promise.all([
      waitForStepperSegmentState(benerailResultsPage, 0, "outbound", "active"),
      waitForStepperSegmentState(benerailResultsPage, 1, "inbound", "default"),
    ]);
    return { outbound, inbound };
  },

  /**
   * Verifies the journey stepper (eu-rail-stepper.vue) right after the outbound leg has been
   * selected: the outbound step shows its completed checkmark and the inbound step becomes
   * highlighted/active, both showing their date and time.
   */
  async verifyJourneyStepperAfterOutboundSelection(page) {
    if (!page) throw new Error("[BenerailResults.verifyJourneyStepperAfterOutboundSelection] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const [outbound, inbound] = await Promise.all([
      waitForStepperSegmentState(benerailResultsPage, 0, "outbound", "completed"),
      waitForStepperSegmentState(benerailResultsPage, 1, "inbound", "active"),
    ]);
    return { outbound, inbound };
  },

  /**
   * Reads the time shown on one leg of the journey stepper (eu-rail-stepper.vue). The stepper
   * echoes the search's own DepartTime/ReturnTime rather than any result's departure — so this is
   * the time band the results were requested for, which is what test 51524 pins down.
   * @param {import('playwright').Page} page
   * @param {"outbound"|"inbound"} leg
   * @returns {Promise<{stepText: string, time: string}>} The full step text and just its time
   */
  async getJourneyStepperStepTime(page, leg) {
    if (!page) throw new Error("[BenerailResults.getJourneyStepperStepTime] page is required");

    const index = STEPPER_LEG_INDEXES[leg];
    if (index === undefined) {
      throw new Error(
        `[BenerailResults.getJourneyStepperStepTime] "leg" must be one of ` +
        `${Object.keys(STEPPER_LEG_INDEXES).join(", ")}, got: ${leg}`,
      );
    }

    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    const { stepText } = await benerailResultsPage.getJourneyStepperSegmentState(index);
    const match = stepText.match(STEPPER_TIME_PATTERN);
    if (!match) {
      throw new Error(
        `[BenerailResults.getJourneyStepperStepTime] Could not read a time from the ${leg} journey ` +
        `stepper step, which shows: "${stepText}"`,
      );
    }

    return { stepText, time: match[1].replace(/\s+/g, " ").trim() };
  },

  /**
   * Hovers the price info icon on the Benerail result card at the given index and verifies its
   * price breakdown tooltip (eu-rail-price-breakdown.vue): the displayed total must equal
   * price-per-ticket x traveler count, summed across every passenger-type row — and, when
   * expectedTravelerCount is given, those rows' counts must add up to it (catches a group
   * mislabeled with the wrong traveler count) (see test 34821).
   * @param {import('playwright').Page} page
   * @param {number} [index=0]
   * @param {number} [expectedTravelerCount] - Total travelers expected across all rows; omit to
   *   skip that check and only verify the price math.
   * @returns {Promise<{rows: Array<{type: string, count: number, pricePerTicket: number}>, total: number}>}
   * @throws {Error} If the summed per-row subtotals don't match the displayed total, or (when
   *   expectedTravelerCount is given) the row counts don't add up to it
   */
  async verifyTotalPriceReflectsAllTravelers(page, index = 0, expectedTravelerCount) {
    if (!page) throw new Error("[BenerailResults.verifyTotalPriceReflectsAllTravelers] page is required");
    const benerailResultsPage = getPageObject(page, BenerailResultsPage);
    await benerailResultsPage.hoverPriceInfoIconForResultAtIndex(index);

    const rawRows = await benerailResultsPage.getPriceBreakdownPassengerRows();
    if (!rawRows.length) {
      throw new Error("[BenerailResults.verifyTotalPriceReflectsAllTravelers] Price breakdown tooltip showed no passenger rows");
    }
    const rows = rawRows.map(({ labelText, priceText }) => {
      const { count, type } = parsePassengerBreakdownLabel(labelText);
      return { type, count, pricePerTicket: toNumber(priceText, `price per ticket for "${labelText}"`) };
    });

    const totalText = await benerailResultsPage.getPriceBreakdownTotalText();
    const total = toNumber(totalText, "price breakdown total");

    const expectedTotal = rows.reduce((sum, row) => sum + row.count * row.pricePerTicket, 0);
    if (Math.abs(expectedTotal - total) > 0.01) {
      throw new Error(
        `[BenerailResults.verifyTotalPriceReflectsAllTravelers] Expected the price breakdown total ` +
        `(${total.toFixed(2)}) to equal price-per-ticket x traveler count summed across all rows ` +
        `(${expectedTotal.toFixed(2)}), rows: ${JSON.stringify(rows)}`
      );
    }

    const actualTravelerCount = rows.reduce((sum, row) => sum + row.count, 0);
    if (Number.isInteger(expectedTravelerCount) && actualTravelerCount !== expectedTravelerCount) {
      throw new Error(
        `[BenerailResults.verifyTotalPriceReflectsAllTravelers] Expected the price breakdown to cover ` +
        `${expectedTravelerCount} traveler(s), but its rows add up to ${actualTravelerCount}: ${JSON.stringify(rows)}`
      );
    }

    return { rows, total };
  },
};

module.exports = BenerailResults;
