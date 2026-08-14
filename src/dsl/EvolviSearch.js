const { getPageObject } = require("@utils/pageObjectCache");
const { EvolviSearchPage, SELECTORS: EVOLVI_SELECTORS } = require("@pages/EvolviSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const evolviRoutes = require("@data/evolvi.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

/**
 * EvolviSearch DSL
 *
 * High-level business actions for UK Rail searches.
 */

const EvolviSearch = {
  /**
   * Selects the UK Rail provider in the search UI.
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async selectEvolviSearch(page) {
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickRailTab();
    await page.getByRole("option", { name: "UK Rail" }).click();
  },

  /**
   * Ensures the "Request Split Ticket" checkbox is unchecked.
   * Safe to call even if it is already unchecked.
   * @param {import('playwright').Page} page
   */
  async ensureSplitTicketIsUnchecked(page) {
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);
    const checkbox = page.locator(EVOLVI_SELECTORS.SPLIT_TICKET_CHECKBOX);

    // Only uncheck if currently checked
    if (await checkbox.isChecked()) {
      await evolviSearchPage.toggleSplitTicketCheckbox();
    }
  },

  /**
   * Performs a complete one-way Evolvi search.
   * - Ensures split ticket is not selected
   * - Selects the Nth available date for departure
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchEvolviOneWay(
    page,
    routeInput = evolviRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      evolviRoutes.routes,
      "evolvi",
    );

    const searchPage = getPageObject(page, SearchPage);

    // Provider + trip type
    await EvolviSearch.selectEvolviSearch(page);
    await searchPage.selectOneWayTrip();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);

    // Route selection
    await searchPage.fillInOrField(from, 1);
    await searchPage.fillInOrField(to, 2);

    // Calendar flow: select the Nth available date for departure. One month ahead,
    // not the shared 3-month default — Evolvi inventory is not published that far out.
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.waitAndClickSearchButton();

    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a complete round-trip Evolvi search.
   * - Ensures split ticket is not selected
   * - Selects Nth available dates for departure and return
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchEvolviRoundTrip(
    page,
    routeInput = evolviRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX,
    } = {},
  ) {
    // Resolve route (key or inline object)
    const { from, to } = resolveRoute(
      routeInput,
      evolviRoutes.routes,
      "evolvi",
    );

    const searchPage = getPageObject(page, SearchPage);
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    // Provider + trip type. UK Rail calls a round trip "Return" (Return / One Way / Open Return),
    // so this cannot go through SearchPage.selectRoundTrip like the other products do.
    await EvolviSearch.selectEvolviSearch(page);
    await evolviSearchPage.selectReturnTripType();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);

    // Departure flow: select Nth available date for departure. One month ahead,
    // not the shared 3-month default — Evolvi inventory is not published that far out.
    await searchPage.fillInOrField(from, 1);
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Return flow: select Nth available date for return
    await searchPage.fillInOrField(to, 2);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null,
    });

    // Wait for the button to leave its disabled state before clicking, as the one-way flow does.
    // A "return" search adds returnDate/returnTime to evolvi-search-inputs.ts's vuelidate rules,
    // and the button stays .is-disabled until that revalidation settles — clicking it before then
    // is silently swallowed, leaving the run sitting on a filled-in but never-submitted form.
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

module.exports = EvolviSearch;
