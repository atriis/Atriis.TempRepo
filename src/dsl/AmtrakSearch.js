const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const AmtrakResultsPage = require("@pages/AmtrakResultsPage");
const amtrakRoutes = require("@data/amtrak.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("AmtrakSearch");

/**
 * Blocks until the Amtrak search settles, so the assertion steps that follow never race the
 * supplier. Both search actions share this: clickSearchButton() returns on the click, and the
 * downstream element waits are shorter than a slow Amtrak search (CommonPage.waitForOOPVisible
 * caps at 30s), which is what turned a slow search into a misleading "OOP indicator missing".
 *
 * A legitimately empty search is NOT a failure here — it is returned as the outcome. Scenarios
 * asserting on results will still fail, but on their own assertion with the real reason visible
 * in the log, and the "should not be visible" scenarios stay valid.
 *
 * @param {import('playwright').Page} page
 * @param {string} method - calling method name, for the log line
 * @param {number} [timeout]
 * @returns {Promise<'results'|'no-results'>}
 */
async function waitForSearchOutcome(page, method, timeout) {
  const amtrakResultsPage = getPageObject(page, AmtrakResultsPage);
  const outcome = await amtrakResultsPage.waitForResultsOrNoResults(timeout);

  if (outcome === "no-results") {
    logger.warn(
      `[AmtrakSearch.${method}] The search returned the "No results found" empty state — ` +
      "no bookable Amtrak results for these criteria.",
    );
  } else {
    logger.info(`[AmtrakSearch.${method}] Amtrak results rendered.`);
  }

  return outcome;
}

/**
 * Validates the arguments the two time-setting actions share. Both take the hour and minute as the
 * zero-padded option text the picker renders, so a bare number ("1") would never match an option.
 * @param {string} method - calling method name, for the error prefix
 * @param {import('playwright').Page} page
 * @param {string} hour
 * @param {string} minute
 */
function assertTimeArgs(method, page, hour, minute) {
  if (!page) throw new Error(`[AmtrakSearch.${method}] "page" is required.`);
  for (const [name, value] of [["hour", hour], ["minute", minute]]) {
    if (typeof value !== "string" || !/^\d{2}$/.test(value)) {
      throw new Error(
        `[AmtrakSearch.${method}] "${name}" must be a zero-padded two-digit string, ` +
        `got: ${JSON.stringify(value)}`,
      );
    }
  }
}

/**
 * AmtrakSearch DSL
 *
 * High-level business actions for Amtrak rail searches.
 * Describes WHAT the user does, not HOW the UI works.
 */
const AmtrakSearch = {
  /**
   * Selects the Amtrak provider in the search UI.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async selectAmtrakSearch(page) {
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickRailTab();
    await page.getByRole("option", { name: "Amtrak" }).click();
  },

  /**
   * Performs a one-way Amtrak search.
   *
   * - Uses default route from amtrak.json unless overridden
   * - Selects the 10th available departure date by default
   * - Waits for the results page to settle before returning
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @param {number} [options.searchTimeout] - Max ms to wait for results or the no-results state
   *   (defaults to AmtrakResultsPage.waitForResultsOrNoResults' own 120000)
   * @returns {Promise<object>} Search result metadata, including `outcome`:
   *   'results' | 'no-results'
   */
  async searchAmtrakOneWay(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      searchTimeout = undefined,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      amtrakRoutes.routes,
      "amtrak",
    );

    const searchPage = getPageObject(page, SearchPage);

    // Provider + trip type
    await AmtrakSearch.selectAmtrakSearch(page);
    // Amtrak-specific method (see SearchPage.clickAmtrakTripType) — the generic
    // selectOneWayTrip() resolves ambiguously across rail providers for Amtrak.
    await searchPage.selectAmtrakOneWayTrip();

    // Route selection
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar flow: open the departure calendar explicitly — the Amtrak form does not focus its
    // date field when a station commits — then select the Nth available date. One month ahead, not
    // the shared 3-month default — Amtrak inventory is not published that far out.
    await searchPage.clickAmtrakDateField(0);
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

    // Do not hand control back on the click alone — wait for results or the no-results state.
    const outcome = await waitForSearchOutcome(page, "searchAmtrakOneWay", searchTimeout);

    return { searched: true, routeInput, from, to, departureIndex, outcome };
  },

  /**
   * Performs a round-trip Amtrak search.
   *
   * - Departure: 10th available date by default
   * - Return: 13th available date by default
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @param {boolean} [options.clickSearch=true] - set false to leave the filled form on screen so
   *   the scenario can go on validating the search inputs before submitting
   * @param {number} [options.searchTimeout] - Max ms to wait for results or the no-results state
   *   (defaults to AmtrakResultsPage.waitForResultsOrNoResults' own 120000)
   * @returns {Promise<object>} Search result metadata, including `outcome`:
   *   'results' | 'no-results' | null (null when clickSearch is false)
   */
  async searchAmtrakRoundTrip(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX,
      clickSearch = true,
      searchTimeout = undefined,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      amtrakRoutes.routes,
      "amtrak",
    );

    const searchPage = getPageObject(page, SearchPage);

    // Provider + trip type
    await AmtrakSearch.selectAmtrakSearch(page);
    // Amtrak-specific method (see SearchPage.clickAmtrakTripType) — the generic
    // selectRoundTrip() resolves ambiguously across rail providers for Amtrak.
    await searchPage.selectAmtrakRoundTrip();

    // Departure flow: open the departure calendar explicitly (the Amtrak form does not focus its
    // date field when a station commits), then select the Nth available date. One month ahead, not
    // the shared 3-month default — Amtrak inventory is not published that far out.
    await searchPage.fillInFromField(from);
    await searchPage.clickAmtrakDateField(0);
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Return flow: round trip renders a second date field for the return segment, so open that one
    // and select the Nth available date in it.
    await searchPage.fillInToField(to);
    await searchPage.clickAmtrakDateField(1);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null,
    });

    // Only waited for when the form was actually submitted — the clickSearch:false variant
    // deliberately leaves the search form on screen, where no results page exists to wait for.
    let outcome = null;
    if (clickSearch) {
      await searchPage.clickSearchButton();
      outcome = await waitForSearchOutcome(page, "searchAmtrakRoundTrip", searchTimeout);
    }

    return {
      searched: clickSearch,
      routeInput,
      from,
      to,
      departureIndex,
      returnIndex,
      outcome,
    };
  },

  /**
   * Sets the departure (outbound) time in the Amtrak search form.
   * @param {import('playwright').Page} page
   * @param {string} hour - zero-padded 24h hour, e.g. "01"
   * @param {string} minute - zero-padded minute, e.g. "00"
   * @returns {Promise<{time: string}>} The value the input reads after the selection
   */
  async setDepartureTime(page, hour, minute) {
    assertTimeArgs("setDepartureTime", page, hour, minute);
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.setAmtrakTimeFieldTo(0, hour, minute);
    return { time: await searchPage.getAmtrakTimeValue(0) };
  },

  /**
   * Sets the return (inbound) time in the Amtrak search form. Round trip only — the second time
   * field belongs to the return segment, which one-way does not render.
   * @param {import('playwright').Page} page
   * @param {string} hour - zero-padded 24h hour, e.g. "02"
   * @param {string} minute - zero-padded minute, e.g. "00"
   * @returns {Promise<{time: string}>} The value the input reads after the selection
   */
  async setReturnTime(page, hour, minute) {
    assertTimeArgs("setReturnTime", page, hour, minute);
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.setAmtrakTimeFieldTo(1, hour, minute);
    return { time: await searchPage.getAmtrakTimeValue(1) };
  },

  /**
   * Reads what both Amtrak time selectors currently show.
   *
   * There is no selectable "Anytime" entry in the picker — it is the time field's placeholder, so
   * an untouched field means "no time preference" and reads as an empty value with that
   * placeholder showing. Returning both lets a caller tell that apart from a failed selection.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{departure: {value: string, placeholder: string}, return: {value: string, placeholder: string}}>}
   */
  async getTimeSelectorStates(page) {
    if (!page) throw new Error('[AmtrakSearch.getTimeSelectorStates] "page" is required.');
    const searchPage = getPageObject(page, SearchPage);
    return {
      departure: await searchPage.getAmtrakTimeFieldState(0),
      return: await searchPage.getAmtrakTimeFieldState(1),
    };
  },

  /**
   * Raises the traveller count in the Amtrak search form and waits for the extra, still-unfilled
   * traveller slot the trip header renders in response.
   * @param {import('playwright').Page} page
   * @param {number} count - total travellers to select
   * @returns {Promise<{count: number, emptySlotVisible: boolean}>}
   */
  async setTravelersCount(page, count) {
    if (!page) throw new Error('[AmtrakSearch.setTravelersCount] "page" is required.');
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(
        `[AmtrakSearch.setTravelersCount] "count" must be a positive integer, got: ${JSON.stringify(count)}`,
      );
    }
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.selectAmtrakTravelersCount(count);
    const emptySlotVisible = await searchPage.waitForEmptyTravelerSlotVisible();
    return { count, emptySlotVisible };
  },

  /**
   * Enters a promo code in the Amtrak search form.
   * @param {import('playwright').Page} page
   * @param {string} code
   * @returns {Promise<{code: string}>}
   */
  async enterPromoCode(page, code) {
    if (!page) throw new Error('[AmtrakSearch.enterPromoCode] "page" is required.');
    if (typeof code !== "string" || code.length === 0) {
      throw new Error(
        `[AmtrakSearch.enterPromoCode] "code" must be a non-empty string, got: ${JSON.stringify(code)}`,
      );
    }
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.fillAmtrakPromoCode(code);
    return { code };
  },

  /**
   * Reads the promo code validation message shown under the Amtrak promo code field.
   * @param {import('playwright').Page} page
   * @returns {Promise<{message: string}>}
   */
  async getPromoCodeValidationMessage(page) {
    if (!page) throw new Error('[AmtrakSearch.getPromoCodeValidationMessage] "page" is required.');
    const searchPage = getPageObject(page, SearchPage);
    return { message: await searchPage.getAmtrakPromoCodeValidationText() };
  },

  /**
   * Opens the "Travelers details" section's loyalty-card dropdown for the first traveller and
   * selects the first available card, filling the membership id the card may require.
   * @param {import('playwright').Page} page
   * @returns {Promise<{card: string, membershipId: string|null}>}
   */
  async selectTravelerLoyaltyCard(page) {
    if (!page) throw new Error('[AmtrakSearch.selectTravelerLoyaltyCard] "page" is required.');
    const searchPage = getPageObject(page, SearchPage);
    return searchPage.selectFirstAmtrakLoyaltyCard();
  },
};

module.exports = AmtrakSearch;
