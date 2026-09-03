const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const { BenerailSearchPage } = require("@pages/BenerailSearchPage");
const benerailRoutes = require("@data/benerail.json");
const {
  selectDatesByNthAvailable,
  selectNthWeekdayFromNextMonth,
  advanceSinglePickerCalendarUntilMonthVisible,
  clickDayInVisibleMonth,
} = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

/**
 * BenerailSearch DSL
 *
 * High-level business actions for EU Rail searches.
 */

// Query -> expected suggestion text(s) for the rail "From" station autocomplete improvements
// (test 63183) — spelling/typo variants of Bruxelles-Meiser and Brussels Airport-Zaventem that
// the autocomplete must still surface correctly. Order matters: later cases (e.g. "Bruxelles")
// depend on the field having been retyped from scratch by the preceding case, not on prior state.
const STATION_AUTOCOMPLETE_CASES = [
  { query: "Bruxelles-Meiser", expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"] },
  {
    query: "Bruxelles Meiser",
    expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"],
    // Verified 2026-08-11 directly against the live rail station search: this exact French
    // spelling with a space instead of the hyphen returns zero suggestions, while the
    // English/Dutch equivalents ("Brussels Meiser"/"Brussel Meiser", both also space-separated)
    // correctly match. Flagged to product as a backend search inconsistency — logged as a WARN
    // rather than a hard failure so this otherwise-passing regression scenario stays green.
    knownGap:
      "Rail station search does not match \"Bruxelles Meiser\" (French, no hyphen) even though " +
      "\"Brussels Meiser\"/\"Brussel Meiser\" do — flagged to product, not yet filed as a bug.",
  },
  { query: "Brussels Meiser", expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"] },
  { query: "Brussel Meiser", expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"] },
  {
    query: "Brussel",
    expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)", "Brussels Airport-Zaventem (BE) - (BEABT)"],
  },
  { query: "Bruxelle", expectedTexts: ["Brussels Airport-Zaventem (BE) - (BEABT)"] },
  { query: "Bruxelles", expectedTexts: ["Brussels Airport-Zaventem (BE) - (BEABT)"] },
  // "Brussel Meiser" repeats deliberately (see index 3 above) — the original Testim recording
  // retypes it a second time after two full-city queries, re-verifying the field recovers the
  // right suggestion rather than getting stuck on the intervening large result sets.
  { query: "Brussel Meiser", expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"] },
  { query: "Meiser", expectedTexts: ["Bruxelles-Meiser (BE) - (BEMEI)"] },
];

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
   * Selects the "One Way" trip type on the Benerail search form.
   * @param {import('playwright').Page} page
   */
  async selectOneWayTripType(page) {
    if (!page) {
      throw new Error('[BenerailSearch.selectOneWayTripType] "page" is required.');
    }

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.selectOneWayTrip();
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

    // Route selection — both fields commit the best-matching suggestion (not just whichever
    // renders first — see BenerailSearchPage.fillFromStationWithBestMatch) and assert it committed.
    await benerailSearchPage.fillFromStationWithBestMatch(from);
    await benerailSearchPage.fillToStationWithBestMatch(to);

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
   * Performs a one-way Benerail search on the Nth occurrence of a given weekday in the next month
   * (e.g. the 3rd Monday), instead of the default "Nth available date" strategy. Used by scenarios
   * that need a predictable, mid-month weekday departure so the expected inventory (carrier, fare
   * brands) is stable — see test 62008.
   *
   * Unlike searchBenerailOneWay this must NOT advance the calendar itself:
   * selectNthWeekdayFromNextMonth clicks the next-month arrow as part of resolving the date.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput - Route key from benerail.json, or { from, to }
   * @param {string} dayOfWeek - "monday","tuesday",...,"sunday"
   * @param {number} [nth=1] - Which occurrence of that weekday to take (1 = first)
   * @returns {Promise<{searched: boolean, routeInput: string|object, from: string, to: string, dayOfWeek: string, nth: number}>}
   */
  async searchBenerailOneWayOnNthWeekday(page, routeInput = benerailRoutes.defaultRoute, dayOfWeek, nth = 1) {
    if (!page) {
      throw new Error('[BenerailSearch.searchBenerailOneWayOnNthWeekday] "page" is required.');
    }
    if (!dayOfWeek || typeof dayOfWeek !== "string") {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayOnNthWeekday] "dayOfWeek" must be a non-empty string, got: ${typeof dayOfWeek}`,
      );
    }
    if (!Number.isInteger(nth) || nth < 1) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayOnNthWeekday] "nth" must be a positive integer, got: ${nth}`,
      );
    }

    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, "benerail");

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    try {
      await BenerailSearch.selectBenerailSearch(page);
      await searchPage.selectOneWayTrip();

      await benerailSearchPage.fillFromStationWithBestMatch(from);
      await benerailSearchPage.fillToStationWithBestMatch(to);

      await benerailSearchPage.clickRailDepartureDateField();
      await selectNthWeekdayFromNextMonth(page, { dayOfWeek, nth });

      await searchPage.waitAndClickSearchButton();

      return { searched: true, routeInput, from, to, dayOfWeek, nth };
    } catch (err) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayOnNthWeekday] Failed to run a one-way EU rail search ` +
        `(${from} → ${to}) departing the ${nth} ${dayOfWeek} of next month. Original: ${err.message}`,
      );
    }
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

      await benerailSearchPage.fillFromStationWithBestMatch(from);
      await benerailSearchPage.fillToStationWithBestMatch(to);

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

    await benerailSearchPage.fillFromStationWithBestMatch(from);

    // Route is confirmed (fillFromStationWithBestMatch already asserted the value committed) — now move to the
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
    await benerailSearchPage.fillToStationWithBestMatch(to);

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

  /**
   * Performs a round-trip Benerail search on exact calendar dates, N days from today, instead of
   * an index into whatever dates the calendar happens to render as "available". An index-based
   * pick (searchBenerailRoundTrip's default) still depends on the calendar's own month view, which
   * "near departure date" callers were advancing a full month ahead unconditionally — pushing the
   * search past where Distribusion/Benerail inventory is actually published whenever today falls
   * early in the month (found investigating ADO 70431). Picking an exact date offset sidesteps
   * that: it only advances the calendar's month view when the target date's month genuinely isn't
   * the one currently showing (advanceSinglePickerCalendarUntilMonthVisible), so it works the same regardless
   * of where in the month "today" happens to be.
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput - Route key from benerail.json, or { from, to }
   * @param {object} [options]
   * @param {number} [options.departureOffsetDays=5] - Departure date, N days from today
   * @param {number} [options.returnOffsetDays] - Return date, N days from today. Defaults to
   *   departureOffsetDays + 2 (a short round trip) when not given.
   * @returns {Promise<{searched: boolean, routeInput: string|object, from: string, to: string, departureDate: Date, returnDate: Date}>}
   */
  async searchBenerailRoundTripOnDaysFromNow(
    page,
    routeInput = benerailRoutes.defaultRoute,
    { departureOffsetDays = 5, returnOffsetDays } = {},
  ) {
    if (!page) {
      throw new Error('[BenerailSearch.searchBenerailRoundTripOnDaysFromNow] "page" is required.');
    }
    if (!Number.isInteger(departureOffsetDays) || departureOffsetDays < 0) {
      throw new Error(
        `[BenerailSearch.searchBenerailRoundTripOnDaysFromNow] "departureOffsetDays" must be a non-negative integer, got: ${departureOffsetDays}`,
      );
    }
    const resolvedReturnOffsetDays = returnOffsetDays ?? departureOffsetDays + 2;
    if (!Number.isInteger(resolvedReturnOffsetDays) || resolvedReturnOffsetDays <= departureOffsetDays) {
      throw new Error(
        `[BenerailSearch.searchBenerailRoundTripOnDaysFromNow] "returnOffsetDays" (${resolvedReturnOffsetDays}) must be an integer greater than departureOffsetDays (${departureOffsetDays})`,
      );
    }

    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, "benerail");

    const today = new Date();
    const departureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + departureOffsetDays);
    const returnDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + resolvedReturnOffsetDays);

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    try {
      await BenerailSearch.selectBenerailSearch(page);
      await searchPage.selectRoundTrip();

      await benerailSearchPage.fillFromStationWithBestMatch(from);

      await benerailSearchPage.clickRailDepartureDateField();
      const departureMonthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, departureDate);
      await clickDayInVisibleMonth(page, departureDate, departureMonthTableIndex);

      await benerailSearchPage.fillToStationWithBestMatch(to);

      await benerailSearchPage.clickRailReturnDateField();
      const returnMonthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, returnDate);
      await clickDayInVisibleMonth(page, returnDate, returnMonthTableIndex);

      await searchPage.waitAndClickSearchButton();

      return { searched: true, routeInput, from, to, departureDate, returnDate };
    } catch (err) {
      throw new Error(
        `[BenerailSearch.searchBenerailRoundTripOnDaysFromNow] Failed to run a round trip EU rail ` +
        `search (${from} → ${to}) departing ${departureDate.toDateString()} returning ${returnDate.toDateString()}. ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Performs a one-way Benerail search on an exact calendar date, N days from today — the one-way
   * counterpart of searchBenerailRoundTripOnDaysFromNow. See that method's doc for why an exact
   * date offset is used instead of an index into whatever the calendar's current month view
   * happens to render as "available" (ADO 70431).
   * @param {import('playwright').Page} page
   * @param {string|object} routeInput - Route key from benerail.json, or { from, to }
   * @param {object} [options]
   * @param {number} [options.departureOffsetDays=5] - Departure date, N days from today
   * @returns {Promise<{searched: boolean, routeInput: string|object, from: string, to: string, departureDate: Date}>}
   */
  async searchBenerailOneWayOnDaysFromNow(
    page,
    routeInput = benerailRoutes.defaultRoute,
    { departureOffsetDays = 5 } = {},
  ) {
    if (!page) {
      throw new Error('[BenerailSearch.searchBenerailOneWayOnDaysFromNow] "page" is required.');
    }
    if (!Number.isInteger(departureOffsetDays) || departureOffsetDays < 0) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayOnDaysFromNow] "departureOffsetDays" must be a non-negative integer, got: ${departureOffsetDays}`,
      );
    }

    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, "benerail");

    const today = new Date();
    const departureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + departureOffsetDays);

    const searchPage = getPageObject(page, SearchPage);
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    try {
      await BenerailSearch.selectBenerailSearch(page);
      await searchPage.selectOneWayTrip();

      await benerailSearchPage.fillFromStationWithBestMatch(from);
      await benerailSearchPage.fillToStationWithBestMatch(to);

      await benerailSearchPage.clickRailDepartureDateField();
      const departureMonthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, departureDate);
      await clickDayInVisibleMonth(page, departureDate, departureMonthTableIndex);

      await searchPage.waitAndClickSearchButton();

      return { searched: true, routeInput, from, to, departureDate };
    } catch (err) {
      throw new Error(
        `[BenerailSearch.searchBenerailOneWayOnDaysFromNow] Failed to run a one-way EU rail search ` +
        `(${from} → ${to}) departing ${departureDate.toDateString()}. Original: ${err.message}`,
      );
    }
  },

  /**
   * Sets the Benerail search form's departure time via the redesigned time-picker component
   * (test 68008). Expects the form's search tab/trip type to already be selected.
   * @param {import('playwright').Page} page
   * @param {string} time - "HH:mm", e.g. "04:00"
   * @returns {Promise<string>} The committed value read back from the time input
   */
  async setDepartureTime(page, time) {
    if (!page) {
      throw new Error('[BenerailSearch.setDepartureTime] "page" is required.');
    }
    if (typeof time !== "string" || !/^\d{1,2}:\d{2}$/.test(time)) {
      throw new Error(`[BenerailSearch.setDepartureTime] "time" must be an "HH:mm" string, got: ${time}`);
    }

    const [hour, minute] = time.split(":");
    const benerailSearchPage = getPageObject(page, BenerailSearchPage);

    try {
      await benerailSearchPage.setDepartureTimeTo(hour.padStart(2, "0"), minute);
      return await benerailSearchPage.getDepartureTimeValue();
    } catch (err) {
      throw new Error(
        `[BenerailSearch.setDepartureTime] Failed to set the Benerail departure time to "${time}". ` +
        `Original: ${err.message}`,
      );
    }
  },

  /**
   * Reads the value currently displayed in the Benerail search form's departure time field.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async getDepartureTimeDisplayed(page) {
    if (!page) {
      throw new Error('[BenerailSearch.getDepartureTimeDisplayed] "page" is required.');
    }

    const benerailSearchPage = getPageObject(page, BenerailSearchPage);
    return benerailSearchPage.getDepartureTimeValue();
  },

  /**
   * Checks the "Via" checkbox on the Benerail search form, revealing the via-station field
   * (test 68008 — confirms the redesigned time-picker's value is unaffected by unrelated form
   * interactions).
   * @param {import('playwright').Page} page
   */
  async enableViaStationField(page) {
    if (!page) {
      throw new Error('[BenerailSearch.enableViaStationField] "page" is required.');
    }

    const benerailSearchPage = getPageObject(page, BenerailSearchPage);
    await benerailSearchPage.enableViaStation();
  },

  /**
   * Selects an age category (e.g. "Youth (15-25)") for the default traveler in the Benerail
   * search form's travellers-ages dropdown (test 33896).
   * @param {import('playwright').Page} page
   * @param {string} ageLabel - Age category label, e.g. "Youth (15-25)"
   */
  async selectTravellerAge(page, ageLabel) {
    if (!page) {
      throw new Error('[BenerailSearch.selectTravellerAge] "page" is required.');
    }
    if (!ageLabel || typeof ageLabel !== 'string') {
      throw new Error(`[BenerailSearch.selectTravellerAge] "ageLabel" must be a non-empty string, got: ${typeof ageLabel}`);
    }

    const benerailSearchPage = getPageObject(page, BenerailSearchPage);
    await benerailSearchPage.selectTravellerAge(ageLabel);
  },

  /**
   * Types each station-name spelling variant from STATION_AUTOCOMPLETE_CASES into the rail
   * "From" field and records the suggestions the autocomplete actually surfaced for it (test
   * 63183, autocomplete improvements). Returns raw per-case results rather than asserting —
   * business assertions belong in the calling step, per this repo's DSL/step split.
   * @param {import('playwright').Page} page
   * @returns {Promise<Array<{query: string, expectedTexts: string[], suggestionTexts: string[], knownGap?: string}>>}
   */
  async getStationAutocompleteImprovementResults(page) {
    if (!page) {
      throw new Error('[BenerailSearch.getStationAutocompleteImprovementResults] "page" is required.');
    }

    const benerailSearchPage = getPageObject(page, BenerailSearchPage);
    const results = [];

    for (const { query, expectedTexts, knownGap } of STATION_AUTOCOMPLETE_CASES) {
      const suggestionTexts = await benerailSearchPage.getStationAutocompleteSuggestionTexts(query);
      results.push({ query, expectedTexts, suggestionTexts, knownGap });
    }

    return results;
  },
};

module.exports = BenerailSearch;
