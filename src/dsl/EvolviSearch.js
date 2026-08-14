const { getPageObject } = require("@utils/pageObjectCache");
const { EvolviSearchPage, SELECTORS: EVOLVI_SELECTORS } = require("@pages/EvolviSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const evolviRoutes = require("@data/evolvi.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("EvolviSearch");

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
   * Reads the traveller-count options the UK Rail search form offers for the travellers currently
   * added to the trip.
   *
   * evolvi-search-inputs.ts builds `travelersCountOptions` from `passengers.length` upwards, so with
   * 3 travellers on the trip the select must offer 3/4/5 Traveller and nothing lower — a "1 Traveller"
   * option is the multipax regression this reads for. The dropdown is closed again before returning
   * so the assertion never leaves an open popper over the search form.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{travelerCount: number, optionLabels: string[], offeredCounts: number[]}>}
   *   travelerCount: travellers currently added in the search form;
   *   optionLabels: the option labels as rendered;
   *   offeredCounts: the leading number parsed out of each label
   */
  async readTravelersCountOptions(page) {
    if (!page) {
      throw new Error('[EvolviSearch.readTravelersCountOptions] "page" is required.');
    }

    const searchPage = getPageObject(page, SearchPage);
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    const travelerCount = await searchPage.getSelectedTravelerCount();

    await evolviSearchPage.openTravelersCountDropdown();
    const optionLabels = await evolviSearchPage.getTravelersCountOptionLabels();
    await evolviSearchPage.closeTravelersCountDropdown();

    if (optionLabels.length === 0) {
      throw new Error(
        '[EvolviSearch.readTravelersCountOptions] The UK Rail traveller-count select rendered no ' +
          'options — the dropdown did not open, or its options are not in the visible app-select popper.',
      );
    }

    // Labels read "<n> Traveller" ($t('common.traveller')); anything without a leading number means
    // the popper matched is not the traveller-count one, so fail loudly rather than silently drop it.
    const offeredCounts = optionLabels.map((label) => {
      const match = /^(\d+)\b/.exec(label);
      if (!match) {
        throw new Error(
          `[EvolviSearch.readTravelersCountOptions] Traveller-count option "${label}" does not start ` +
            `with a number. All options read: ${JSON.stringify(optionLabels)}`,
        );
      }
      return Number(match[1]);
    });

    logger.info(
      "[EvolviSearch.readTravelersCountOptions] Read the UK Rail traveller-count options",
      { travelerCount, optionLabels, offeredCounts },
    );

    return { travelerCount, optionLabels, offeredCounts };
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
