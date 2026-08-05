const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const amtrakRoutes = require("@data/amtrak.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

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

    // Calendar flow: select the Nth available date for departure. One month ahead,
    // not the shared 3-month default — Amtrak inventory is not published that far out.
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
   * @returns {Promise<object>} Search result metadata
   */
  async searchAmtrakRoundTrip(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX,
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

    // Departure flow: select Nth available date for departure. One month ahead,
    // not the shared 3-month default — Amtrak inventory is not published that far out.
    await searchPage.fillInFromField(from);
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Return flow: select Nth available date for return
    await searchPage.fillInToField(to);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

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

module.exports = AmtrakSearch;
