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

    // Route selection
    await searchPage.fillInOrField(from, 1);
    await searchPage.fillInOrField(to, 2);

    // Calendar flow: select the Nth available date for departure
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

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
    await searchPage.fillInOrField(from, 1);
    await searchPage.clickCalendarNextArrow();

    // Calendar flow: select Nth available date for departure
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Route selection for return
    await searchPage.fillInOrField(to, 2);

    // Calendar flow: select Nth available date for return
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

module.exports = BenerailSearch;
