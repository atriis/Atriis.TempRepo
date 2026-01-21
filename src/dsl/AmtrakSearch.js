const AmtrakSearchPage = require("@pages/AmtrakSearchPage");
const SearchPage = require("@pages/SearchPage");
const amtrakRoutes = require("@data/amtrak.json");
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');
const { resolveRoute } = require('@utils/route.helper');
const { SEARCH_DEFAULTS } = require('@utils/search.constants');

/**
 * AmtrakSearch DSL
 *
 * High-level business actions for Amtrak rail searches.
 * Describes WHAT the user does, not HOW the UI works.
 */
const AmtrakSearch = {

  /**
   * Performs a one-way Amtrak search.
   *
   * Default behavior:
   * - Uses default route from amtrak.json
   * - Selects the 10th available departure date
   */
  async searchAmtrakOneWay(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      amtrakRoutes.routes,
      "amtrak"
    );

    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Provider + trip type
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectOneWayTrip();

    // Route selection
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar flow
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null
    });

    await searchPage.clickSearchButton();

    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a round-trip Amtrak search.
   *
   * Default behavior:
   * - Departure: 10th available date
   * - Return: 13th available date
   */
  async searchAmtrakRoundTrip(
    page,
    routeInput = amtrakRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX
    } = {}
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      amtrakRoutes.routes,
      "amtrak"
    );

    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Provider + trip type
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectRoundTrip();

    // Departure flow
    await searchPage.fillInFromField(from);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null
    });

    // Return flow
    await searchPage.fillInToField(to);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null
    });

    await searchPage.clickSearchButton();

    return {
      searched: true,
      routeInput,
      from,
      to,
      departureIndex,
      returnIndex
    };
  },
};

module.exports = AmtrakSearch;