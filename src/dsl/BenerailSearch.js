const BenerailSearchPage = require("@pages/BenerailSearchPage");
const SearchPage = require("@pages/SearchPage");
const benerailRoutes = require("@data/benerail.json");
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');
const { resolveRoute } = require('@utils/route.helper');
const { SEARCH_DEFAULTS } = require('@utils/search.constants');

/**
 * BenerailSearch DSL
 *
 * High-level business actions for EU Rail searches.
 */
const BenerailSearch = {

  /**
   * Performs a one-way Benerail search.
   * Default departure: 10th available date.
   */
  async searchBenerailOneWay(
    page,
    routeInput = benerailRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail"
    );

    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    await benerailPage.selectBenerailSearch();
    await benerailPage.selectOneWayTrip();

    await searchPage.fillInOrField(from, 1);
    await searchPage.fillInOrField(to, 2);

    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null
    });

    await searchPage.clickSearchButton();

    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a round-trip Benerail search.
   * Default dates: departure (10th), return (13th).
   */
  async searchBenerailRoundTrip(
    page,
    routeInput = benerailRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX
    } = {}
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail"
    );

    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    await benerailPage.selectBenerailSearch();
    await benerailPage.selectRoundTrip();

    await searchPage.fillInOrField(from, 1);
    await searchPage.clickCalendarNextArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null
    });

    await searchPage.fillInOrField(to, 2);

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
  }
};

module.exports = BenerailSearch;