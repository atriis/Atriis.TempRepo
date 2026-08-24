const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const amtrakRoutes = require("@data/amtrak.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

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
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchAmtrakOneWay(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {},
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
    await searchPage.selectOneWayTrip();

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

    return { searched: true, routeInput, from, to, departureIndex };
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
   * @returns {Promise<object>} Search result metadata
   */
  async searchAmtrakRoundTrip(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX,
      clickSearch = true,
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
    await searchPage.selectRoundTrip();

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

    if (clickSearch) {
      await searchPage.clickSearchButton();
    }

    return {
      searched: clickSearch,
      routeInput,
      from,
      to,
      departureIndex,
      returnIndex,
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
