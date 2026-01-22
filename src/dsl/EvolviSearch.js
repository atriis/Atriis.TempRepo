const { EvolviSearchPage, SELECTORS: EVOLVI_SELECTORS } = require("@pages/EvolviSearchPage");
const SearchPage = require("@pages/SearchPage");
const evolviRoutes = require("@data/evolvi.json");
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');
const { resolveRoute } = require('@utils/route.helper');
const { SEARCH_DEFAULTS } = require('@utils/search.constants');

/**
 * EvolviSearch DSL
 *
 * High-level business actions for UK Rail searches.
 */
const EvolviSearch = {

  /**
   * Ensures the "Request Split Ticket" checkbox is unchecked.
   * Safe to call even if it is already unchecked.
   */
  async ensureSplitTicketIsUnchecked(page) {
    const evolviSearchPage = new EvolviSearchPage(page);
    const checkbox = page.locator(EVOLVI_SELECTORS.SPLIT_TICKET_CHECKBOX);

    if (await checkbox.isChecked()) {
      await evolviSearchPage.toggleSplitTicketCheckbox();
    }
  },

  /**
   * Performs a complete one-way Evolvi search.
   */
  async searchEvolviOneWay(
    page,
    routeInput = evolviRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      evolviRoutes.routes,
      "evolvi"
    );

    const evolviSearchPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    await evolviSearchPage.selectEvolviSearch();
    await evolviSearchPage.selectOneWayTrip();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);

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
   * Performs a complete round-trip Evolvi search.
   */
  async searchEvolviRoundTrip(
    page,
    routeInput = evolviRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX
    } = {}
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      evolviRoutes.routes,
      "evolvi"
    );

    const evolviSearchPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    await evolviSearchPage.selectEvolviSearch();
    await evolviSearchPage.selectRoundTrip();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);

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
  },
};

module.exports = EvolviSearch;