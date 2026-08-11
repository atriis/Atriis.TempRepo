const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const { BenerailSearchPage } = require("@pages/BenerailSearchPage");
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
   * Default departure: 5th available date (SEARCH_DEFAULTS.RAIL_BENERAIL) — nearer than the
   * shared RAIL default, since far-out Benerail inventory was intermittently empty (AB#81914).
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @param {boolean} options.clickSearch - Set false to fill the form without submitting it
   *   (e.g. to inspect what the autocomplete committed into the From/To fields).
   * @param {string} [options.numberOfStops] - Optional "Number of Stops" filter to select before
   *   submitting, e.g. "Direct Only" (see BenerailSearchPage.selectNumberOfStops for the full
   *   option set). Left unset, the form keeps its default ("Direct and Indirect").
   * @returns {Promise<object>} Search result metadata
   */
  async searchBenerailOneWay(
    page,
    routeInput = benerailRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL_BENERAIL.DEPARTURE_INDEX,
      clickSearch = true,
      numberOfStops,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail",
    );

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    // Provider + trip type
    await BenerailSearch.selectBenerailSearch(page);
    await searchPage.selectOneWayTrip();

    // Route selection — both fields assert their value committed before returning.
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar flow: explicitly open the departure calendar, then select the Nth available date.
    // One month ahead, not the shared 3-month default — Benerail inventory is not published that far out.
    await benerailSearchPage.clickRailDepartureDateField();
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    if (numberOfStops) {
      await benerailSearchPage.selectNumberOfStops(numberOfStops);
    }

    if (clickSearch) {
      await searchPage.waitAndClickSearchButton();
    }

    return { searched: clickSearch, routeInput, from, to, departureIndex, numberOfStops };
  },

  /**
   * Reads the From/To fields currently displayed in the Benerail search form — e.g. to verify
   * what the station autocomplete actually committed after selecting a suggestion (test 66533,
   * umlaut character handling), independent of the raw route input that was typed.
   * @param {import('playwright').Page} page
   * @returns {Promise<{from: string, to: string}>}
   */
  async getRouteFieldValues(page) {
    if (!page) {
      throw new Error('[BenerailSearch.getRouteFieldValues] "page" is required.');
    }

    const searchPage = getPageObject(page, SearchPage);

    try {
      const from = await searchPage.getFromFieldValue();
      const to = await searchPage.getToFieldValue();
      return { from, to };
    } catch (err) {
      throw new Error(
        `[BenerailSearch.getRouteFieldValues] Failed to read the Benerail search form's From/To ` +
        `field values. Original: ${err.message}`,
      );
    }
  },


  /**
   * Performs a one-way Benerail search from the cart's edit-search drawer (opened by the Rail tile
   * in the trip cart's product carousel — Cart.clickAddEuRailFromCart).
   *
   * Differs from searchBenerailOneWay in two ways: there is no product tab to pick (the drawer is
   * already scoped to EU Rail), and the drawer keeps the trip overview's own .search-btn elements on
   * the page, so it submits through the primary-scoped button. The trip-type radios still need
   * setting — the drawer defaults to Round Trip.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput - Route key from benerail.json, or { from, to }
   * @param {object} options
   * @param {number} options.departureIndex - Nth available departure date (>= 0)
   * @returns {Promise<{searched: boolean, routeInput: string|object, from: string, to: string, departureIndex: number}>}
   */
  async searchBenerailOneWayFromCartDrawer(
    page,
    routeInput = benerailRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL_BENERAIL.DEPARTURE_INDEX } = {},
  ) {
    if (!page) {
      throw new Error('[BenerailSearch.searchBenerailOneWayFromCartDrawer] "page" is required.');
    }
    if (!Number.isFinite(departureIndex) || departureIndex < 0) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayFromCartDrawer] "departureIndex" must be a non-negative ` +
        `number, got: ${typeof departureIndex} (${departureIndex})`,
      );
    }

    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, 'benerail');

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    try {
      await searchPage.waitForEditSearchDrawerVisible();

      await searchPage.selectOneWayTrip();

      await searchPage.fillInFromField(from);
      await searchPage.fillInToField(to);

      // Explicitly open the departure calendar, then take the Nth available date. One month ahead
      // matches the standalone rail search — EU rail inventory is not published far out.
      await benerailSearchPage.clickRailDepartureDateField();
      await searchPage.clickCalendarNextArrow(1);
      await selectDatesByNthAvailable(page, { startIndex: departureIndex, endIndex: null });

      await searchPage.waitAndClickPrimarySearchButtonFromCart();

      return { searched: true, routeInput, from, to, departureIndex };
    } catch (err) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayFromCartDrawer] Failed to run a one-way EU rail search ` +
        `from the cart's edit-search drawer (${from} → ${to}). The Rail tile in the cart product ` +
        `carousel must have opened the drawer first. Original: ${err.message}`,
      );
    }
  },


  /**
   * Performs a round-trip Benerail search.
   * Default dates: departure (5th available), return (7th available) — SEARCH_DEFAULTS.RAIL_BENERAIL,
   * nearer than the shared RAIL default since far-out Benerail inventory was intermittently
   * empty on the return leg (AB#81914).
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchBenerailRoundTrip(
    page,
    routeInput = benerailRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL_BENERAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL_BENERAIL.RETURN_INDEX,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      benerailRoutes.routes,
      "benerail",
    );

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    // Provider + trip type
    await BenerailSearch.selectBenerailSearch(page);
    await searchPage.selectRoundTrip();

    await searchPage.fillInFromField(from);

    // Route is confirmed (fillInFromField already asserted the value committed) — now move to the
    // departure date field. This must be an explicit click: the calendar panel does not open on its
    // own, it previously opened only as a side effect of Tab shifting focus onto this field.
    await benerailSearchPage.clickRailDepartureDateField();
    // One month ahead, not the shared 3-month default — Benerail inventory is not published that far out.
    await searchPage.clickCalendarNextArrow(1);

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
    await benerailSearchPage.clickRailReturnDateField();

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
