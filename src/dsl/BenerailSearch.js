const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const benerailRoutes = require("@data/benerail.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

/**
 * BenerailSearch DSL
 *
 * High-level business actions for EU Rail searches.
 */

const BenerailSearch = {
  /**
   * Selects the EU Rail provider in the search UI.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async selectBenerailSearch(page) {
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickRailTab();
    await page.getByRole("option", { name: "EU Rail" }).click();
  },


  /**
   * Performs a one-way Benerail search.
   * Default departure: 10th available date.
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchBenerailOneWay(
    page,
    routeInput = benerailRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail",
    );

    const searchPage = getPageObject(page, SearchPage);

    // Provider + trip type
    await BenerailSearch.selectBenerailSearch(page);
    await searchPage.selectOneWayTrip();

    // Route selection — both fields assert their value committed before returning.
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar flow: explicitly open the departure calendar, then select the Nth available date.
    await searchPage.clickRailDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.waitAndClickSearchButton();

    return { searched: true, routeInput, from, to, departureIndex };
  },


  /**
   * Performs a round-trip Benerail search.
   * Default dates: departure (10th), return (13th).
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchBenerailRoundTrip(
    page,
    routeInput = benerailRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail",
    );

    const searchPage = getPageObject(page, SearchPage);

    // Provider + trip type
    await BenerailSearch.selectBenerailSearch(page);
    await searchPage.selectRoundTrip();

    await searchPage.fillInFromField(from);

    // Route is confirmed (fillInFromField already asserted the value committed) — now move to the
    // departure date field. This must be an explicit click: the calendar panel does not open on its
    // own, it previously opened only as a side effect of Tab shifting focus onto this field.
    await searchPage.clickRailDepartureDateField();
    await searchPage.clickCalendarNextArrow();

    // Calendar flow: select Nth available date for departure
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Route selection for return
    await searchPage.fillInToField(to);

    // Same as departure: explicitly open the return calendar rather than relying on focus order.
    // No further month advance here — the return picker already continues from the departure
    // month (it can't show return dates before the chosen departure date), so re-advancing 3 more
    // months here pushed the return date ~3 months past departure and produced no availability.
    await searchPage.clickRailReturnDateField();

    // Calendar flow: select Nth available date for return
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null,
    });

    await searchPage.waitAndClickSearchButton();

    return {
      searched: true,
      routeInput,
      from,
      to,
      departureIndex,
      returnIndex,
    };
  },
};

module.exports = BenerailSearch;
