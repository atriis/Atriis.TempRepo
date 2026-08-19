const { expect } = require("@playwright/test");
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

/**
 * Clicks Search and confirms the form actually submitted, clicking again when it did not.
 *
 * Picking the return date leaves Element Plus's date popper closing while vuelidate re-runs over the
 * returnDate/returnTime rules a "return" search adds. A Search click that lands inside that window is
 * swallowed: the button reports itself enabled, the click does nothing, and the run sits on a
 * filled-in but never-submitted form until some later step times out against a page that never
 * changed — which reads as that step's bug, not as a search that never ran. The form leaving the
 * screen is the only reliable proof the click took.
 *
 * @param {object} searchPage - SearchPage page object
 * @param {object} evolviSearchPage - EvolviSearchPage page object
 * @param {object} [options]
 * @param {number} [options.attempts=3] - How many Search clicks to try before giving up
 * @returns {Promise<{attempts: number}>} How many clicks it took
 */
async function clickSearchUntilSubmitted(searchPage, evolviSearchPage, { attempts = 3 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    await searchPage.waitAndClickSearchButton();

    if (await evolviSearchPage.isSearchFormGone()) {
      if (attempt > 1) logger.info("The UK Rail search submitted on a repeat click", { attempts: attempt });
      return { attempts: attempt };
    }

    logger.warn("The UK Rail search form is still on screen after clicking Search, clicking again", { attempt });
  }

  throw new Error(
    `[EvolviSearch.clickSearchUntilSubmitted] The UK Rail search was never submitted: the search form was still ` +
    `on screen after ${attempts} Search clicks. The form is filled in, so the click is being swallowed rather ` +
    `than rejected — the date popper or the form's revalidation is most likely still holding the button.`,
  );
}

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
   * Ensures the "Request Split Ticket" checkbox is checked — the mirror of
   * ensureSplitTicketIsUnchecked, for the scenarios that must search WITH split ticketing on.
   * Safe to call even if it is already checked.
   * @param {import('playwright').Page} page
   */
  async ensureSplitTicketIsChecked(page) {
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);
    const checkbox = page.locator(EVOLVI_SELECTORS.SPLIT_TICKET_CHECKBOX);

    if (!(await checkbox.isChecked())) {
      await evolviSearchPage.toggleSplitTicketCheckbox();
    }
  },

  /**
   * Verifies the split-ticket option is offered as expected in the UK Rail search form: the
   * SplitTix glyph is displayed beside the option, and its checkbox arrives already ticked
   * (evolvi-search-inputs.ts defaults railInfo.isSplitTicket to true, so an unticked box here
   * means the default regressed and every later SplitTix assertion would be vacuous).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{iconVisible: boolean, checked: boolean}>}
   */
  async expectSplitTicketCheckboxIsChecked(page) {
    if (!page) throw new Error('[EvolviSearch.expectSplitTicketCheckboxIsChecked] "page" is required.');
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    const iconVisible = await evolviSearchPage.isSplitTicketIconVisible();
    const checked = await evolviSearchPage.isSplitTicketCheckboxChecked();

    logger.info(
      "[EvolviSearch.expectSplitTicketCheckboxIsChecked] Read the UK Rail split-ticket option",
      { iconVisible, checked },
    );

    expect(
      iconVisible,
      'The SplitTix icon should be displayed next to the "Request Split Ticket" option in the UK Rail search form.',
    ).toBe(true);
    expect(
      checked,
      'The "Request Split Ticket" checkbox should be checked in the UK Rail search form.',
    ).toBe(true);

    return { iconVisible, checked };
  },

  /**
   * Hovers the info icon next to the "Request Split Ticket" checkbox and asserts its tooltip shows
   * the expected message.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage
   * @returns {Promise<string>} The tooltip description that was read
   */
  async expectSplitTicketInfoTooltipMessage(page, expectedMessage) {
    if (!page) throw new Error('[EvolviSearch.expectSplitTicketInfoTooltipMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== "string") {
      throw new Error(
        `[EvolviSearch.expectSplitTicketInfoTooltipMessage] "expectedMessage" must be a non-empty string, got: ${expectedMessage}`,
      );
    }
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    const description = await evolviSearchPage.hoverSplitTicketInfoAndGetDescription();
    logger.info("[EvolviSearch.expectSplitTicketInfoTooltipMessage] Read the split-ticket tooltip", {
      description,
    });

    expect(
      description,
      "The split-ticket info tooltip in the UK Rail search form should show the SplitTix explanation.",
    ).toContain(expectedMessage);

    return description;
  },

  /**
   * Selects one of the split-type radio buttons inside Advanced search by its rendered label.
   *
   * @param {import('playwright').Page} page
   * @param {string} label - e.g. "Split at calling stations"
   */
  async selectSplitTicketType(page, label) {
    if (!page) throw new Error('[EvolviSearch.selectSplitTicketType] "page" is required.');
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    logger.info("[EvolviSearch.selectSplitTicketType] Selecting the split type", { label });
    await evolviSearchPage.selectSplitTicketTypeRadio(label);

    return { selected: label };
  },

  /**
   * Hovers the info icon inside the split-type radio group and asserts its tooltip shows the
   * expected message.
   *
   * The single tooltip documents BOTH split types at once (splitAtBoard + splitAtBoardInfo, then
   * splitAtCallingStations + splitAtCallingStationsInfo), so the whole tooltip text is read and
   * only the message the caller asked about is asserted — which is why the same method serves both
   * of 44341's split-type message checks.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage
   * @returns {Promise<string>} The tooltip text that was read
   */
  async expectSplitTicketTypeTooltipMessage(page, expectedMessage) {
    if (!page) throw new Error('[EvolviSearch.expectSplitTicketTypeTooltipMessage] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== "string") {
      throw new Error(
        `[EvolviSearch.expectSplitTicketTypeTooltipMessage] "expectedMessage" must be a non-empty string, got: ${expectedMessage}`,
      );
    }
    const evolviSearchPage = getPageObject(page, EvolviSearchPage);

    const tooltipText = await evolviSearchPage.hoverSplitTicketTypeInfoAndGetTooltipText();
    logger.info("[EvolviSearch.expectSplitTicketTypeTooltipMessage] Read the split-type tooltip", {
      tooltipText,
    });

    expect(
      tooltipText,
      "The split-type info tooltip inside Advanced search should explain both split types.",
    ).toContain(expectedMessage);

    return tooltipText;
  },

  /**
   * Performs a one-way UK Rail search leaving the "Request Split Ticket" checkbox ON, so the
   * results come back carrying SplitTix fares.
   *
   * Unlike searchEvolviOneWay this does NOT re-select the UK Rail product: the split-ticket
   * scenarios have already selected it and configured Advanced search by the time they search, and
   * re-opening the product select would throw that configuration away.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput
   * @param {object} options
   * @returns {Promise<object>} Search result metadata
   */
  async searchEvolviOneWayWithSplitTicket(
    page,
    routeInput = evolviRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {},
  ) {
    if (!page) throw new Error('[EvolviSearch.searchEvolviOneWayWithSplitTicket] "page" is required.');

    const { from, to } = resolveRoute(routeInput, evolviRoutes.routes, "evolvi");
    const searchPage = getPageObject(page, SearchPage);

    await searchPage.selectOneWayTrip();
    await EvolviSearch.ensureSplitTicketIsChecked(page);

    await searchPage.fillInOrField(from, 1);
    await searchPage.fillInOrField(to, 2);

    // One month ahead, not the shared 3-month default — Evolvi inventory is not published that far
    // out. Same reasoning as searchEvolviOneWay.
    await searchPage.clickCalendarNextArrow(1);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.waitAndClickSearchButton();

    return { searched: true, splitTicket: true, routeInput, from, to, departureIndex };
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

    // A "return" search adds returnDate/returnTime to evolvi-search-inputs.ts's vuelidate rules, and
    // the button stays .is-disabled until that revalidation settles. Waiting for it to be enabled is
    // necessary but not sufficient — see clickSearchUntilSubmitted.
    await clickSearchUntilSubmitted(searchPage, evolviSearchPage);

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
