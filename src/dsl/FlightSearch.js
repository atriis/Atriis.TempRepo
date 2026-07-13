const FlightSearchPage = require("@pages/FlightSearchPage");
const FlightResultsPage = require("@pages/FlightResultsPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { SearchPage } = require("@pages/SearchPage");
const { expect } = require("@playwright/test");
const flightRoutes = require("@data/flights.json");
const {
  selectDatesByInputValues,
  selectDatesByNthAvailable,
  selectNthWeekdayFromNextMonth,
  selectRoundTripDatesOnNthWeekday,
  selectTodayFromVisibleCalendar,
  getNextDateExcludingWeekdays,
  advanceSinglePickerCalendarUntilMonthVisible,
  clickDayInVisibleMonth,
} = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { generateRandomFlightRoute } = require("@utils/data/generateRandomFlightRoute");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("FlightSearch-DSL");

const FlightSearch = {
  /**
   * General flight search with configurable parameters
   *
   * @param {Object} page - Playwright page object
   * @param {string} routeInput - Route identifier (defaults to flightRoutes.defaultRoute)
   * @param {Object} options - Search configuration (required)
   * @param {string} options.searchType - 'completeTrip' or 'bySchedule' (required)
   * @param {string} options.tripType - 'roundTrip' or 'oneWay' (required)
   * @param {number} options.departureIndex - Departure date index (default: from SEARCH_DEFAULTS)
   * @param {number} options.returnIndex - Return date index (default: from SEARCH_DEFAULTS)
   */
  async searchFlight(
    page,
    routeInput = flightRoutes.defaultRoute,
    {
      searchType,
      tripType,
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    },
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    logger.info(`Starting ${tripType} flight search (${searchType})`, { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();

    // Select trip type (oneWay or roundTrip)
    if (tripType === "oneWay") {
      await searchPage.selectOneWayTrip();
    } else {
      await searchPage.selectRoundTrip();
    }

    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Handle calendar interaction based on trip type
    if (tripType === "oneWay") {
      // One-way: user opens the calendar by clicking the departure date field
      await searchPage.clickDepartureDateField();
      await searchPage.clickCalendarNextArrow();

      // Select only the departure date
      await selectDatesByNthAvailable(page, {
        startIndex: departureIndex,
        endIndex: null,
      });
    } else if (await flightSearchPage.isAdvancedSearchExpanded()) {
      // Advanced layout (e.g. users restricted from the Anytime frame have advanced search
      // force-enabled): dates are split into separate outbound/return fields, so the basic
      // single range-calendar path leaves the outbound date empty. Fill each leg on its own.
      await this._selectAdvancedRoundTripDates(page, departureIndex, returnIndex);
    } else {
      // Basic layout: round-trip auto-opens a single range calendar.
      await searchPage.clickCalendarNextArrow();

      // Select departure + return in one call
      await selectDatesByNthAvailable(page, {
        startIndex: departureIndex,
        endIndex: returnIndex,
      });
    }

    // Select search type (completeTrip or bySchedule) - last action before search
    if (searchType === "bySchedule") {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }

    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType, searchType };
  },

  /**
   * Fills the outbound and return dates for an advanced (per-leg) round-trip search,
   * where the calendar is split into separate departure/return date fields. Shared by
   * searchFlight's advanced-layout branch and searchRoundTripAdvanced. Relies on the
   * page objects' built-in panel-visible/hidden waits rather than fixed delays.
   *
   * @param {import('playwright').Page} page
   * @param {number} departureIndex - Nth available day to pick for the outbound leg
   * @param {number} returnIndex - Nth available day to pick for the return leg
   */
  async _selectAdvancedRoundTripDates(page, departureIndex, returnIndex) {
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // Outbound leg — clickDepartureDateField waits for its calendar panel to open.
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, { startIndex: departureIndex, endIndex: null });

    // The single-date picker closes on selection; ensure it is gone before opening the return one.
    await searchPage.waitForDatePickerToClose();

    // Return leg — clickAdvancedReturnDateField waits for its calendar panel to open.
    await flightSearchPage.clickAdvancedReturnDateField();
    await selectDatesByNthAvailable(page, { startIndex: returnIndex, endIndex: null });
  },

  /**
   * Search a one-way flight selecting the Nth occurrence of a specific weekday
   * from the next visible month in the calendar (no arrow click).
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} dayOfWeek - "monday","tuesday",...,"sunday"
   * @param {number} nth - Which occurrence (1=first, 2=second, etc.)
   */
  async searchOneWayOnNthWeekday(page, from, to, dayOfWeek, nth) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string');
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string');
    if (!dayOfWeek || typeof dayOfWeek !== 'string') throw new Error('dayOfWeek must be a non-empty string');
    if (!Number.isInteger(nth) || nth < 1) throw new Error(`nth must be a positive integer, got: ${nth}`);

    logger.info(`Starting oneWay flight search on ${nth}${nth === 1 ? 'st' : nth === 2 ? 'nd' : 'th'} ${dayOfWeek} of next month`, { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Open calendar and navigate to next month, then pick the specific weekday
    await searchPage.clickDepartureDateField();
    await selectNthWeekdayFromNextMonth(page, { dayOfWeek, nth });

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'oneWay', dayOfWeek, nth };
  },

  /**
   * Search a one-way flight on the first upcoming date that does not fall on any of the
   * given weekdays (e.g. avoid Friday/Saturday for El Al, which does not operate over
   * the Israeli Sabbath).
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string[]} [excludeDaysOfWeek=["friday","saturday"]] - Weekday names to avoid
   */
  async searchOneWayAvoidingWeekdays(page, from, to, excludeDaysOfWeek = ["friday", "saturday"]) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string');
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string');
    if (!Array.isArray(excludeDaysOfWeek) || excludeDaysOfWeek.length === 0) {
      throw new Error('excludeDaysOfWeek must be a non-empty array of weekday names');
    }

    logger.info('Starting oneWay flight search avoiding weekdays', { from, to, excludeDaysOfWeek });

    const targetDate = getNextDateExcludingWeekdays({ excludeDaysOfWeek });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    await searchPage.clickDepartureDateField();
    const monthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, targetDate);
    await clickDayInVisibleMonth(page, targetDate, monthTableIndex);

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'oneWay', excludeDaysOfWeek, departureDate: targetDate };
  },

  /**
   * Search a round-trip flight selecting the Nth occurrence of a specific weekday
   * from the next visible month as the outbound date, and the next calendar day
   * as the inbound date.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} dayOfWeek - "monday","tuesday",...,"sunday"
   * @param {number} [nth=1] - Which occurrence of the weekday to pick as outbound (default: 1 = first)
   */
  async searchRoundTripOnNthWeekday(page, from, to, dayOfWeek, nth = 1) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string');
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string');
    if (!dayOfWeek || typeof dayOfWeek !== 'string') throw new Error('dayOfWeek must be a non-empty string');
    if (!Number.isInteger(nth) || nth < 1) throw new Error(`nth must be a positive integer, got: ${nth}`);

    logger.info('Starting roundTrip flight search on Nth weekday of next month with next-day return', { from, to, dayOfWeek, nth });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    await searchPage.clickDepartureDateField();
    await selectRoundTripDatesOnNthWeekday(page, { dayOfWeek, nth });

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', dayOfWeek, nth };
  },

  /**
   * Clicks the main search button on the trip search page to trigger a new search.
   * Used after modifying the search form (e.g. adding travelers) without going
   * through the edit-search modal.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async clickSearchButton(page) {
    if (!page) throw new Error('page is required');

    logger.info('Clicking the trip search button');
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitAndClickSearchButton();

    return { searched: true };
  },

  /**
   * Clicks the flight search button when navigating from the cart to add a second flight.
   * Uses a primary-class-specific selector to avoid strict-mode failures caused by multiple
   * .search-btn elements (hotel cross-sell, overview) rendered alongside the flight search form.
   * @param {import('playwright').Page} page
   */
  async clickSearchButtonFromCart(page) {
    if (!page) throw new Error('page is required');

    logger.info('Clicking the flight search button from cart context');
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitAndClickPrimarySearchButtonFromCart();

    return { searched: true };
  },

  /**
   * Search a random flight (one-way or round-trip) by region
   * @param {Object} page - Playwright page object
   * @param {Object} options - { region, tripType, searchType, departureIndex, returnIndex }
   * @returns {Promise}
   */
  async searchRandomFlight(
    page,
    {
      region = "",
      tripType = "roundTrip",
      searchType = "completeTrip",
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    // Map 'transcontinental' to 'intercontinental' for user convenience
    let regionKey = region === "transcontinental" ? "intercontinental" : region;
    const routeKey = generateRandomFlightRoute(regionKey);
    return await this.searchFlight(page, routeKey, {
      searchType,
      tripType,
      departureIndex,
      returnIndex,
    });
  },

  /**
   * Search a random one-way flight by region
   * @param {Object} page - Playwright page object
   * @param {string} region - 'us', 'europe', 'transcontinental' (optional)
   * @param {Object} options - { departureIndex }
   */
  async searchOneWayRandomFlight(
    page,
    region = "",
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {},
  ) {
    return await this.searchRandomFlight(page, {
      region,
      tripType: "oneWay",
      searchType: "completeTrip",
      departureIndex,
    });
  },

  /**
   * Search a random round-trip flight by region
   * @param {Object} page - Playwright page object
   * @param {string} region - 'us', 'europe', 'transcontinental' (optional)
   * @param {Object} options - { departureIndex, returnIndex }
   */
  async searchRoundTripRandomFlight(
    page,
    region = "europe",
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    return await this.searchRandomFlight(page, {
      region,
      tripType: "roundTrip",
      searchType: "completeTrip",
      departureIndex,
      returnIndex,
    });
  },

  /**
   * One-way flight search: completeTrip + oneWay + routes
   */
  async searchFlightOneWay(
    page,
    routeInput = flightRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {},
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: "completeTrip",
      tripType: "oneWay",
      departureIndex,
    });
  },

  /**
   * One-way flight search with today's departure date.
   *
   * Used for short-notice travel-policy scenarios that must remain within the same day.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   */
  async searchFlightOneWaySameDay(page, routeInput) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeInput) {
      throw new Error('routeInput is required');
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting same-day oneWay flight search', { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickDepartureDateField();
    await selectTodayFromVisibleCalendar(page);
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'oneWay', searchType: 'completeTrip', departureDate: 'today' };
  },

  /**
   * Round-trip flight search with today's date for both the departure and return legs.
   *
   * Used to exercise the same-day-return validation behaviour on the search form.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   */
  async searchFlightRoundTripSameDay(page, routeInput) {
    if (!page) {
      throw new Error('[FlightSearch.searchFlightRoundTripSameDay] "page" is required.');
    }

    if (!routeInput) {
      throw new Error('[FlightSearch.searchFlightRoundTripSameDay] "routeInput" is required.');
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting same-day roundTrip flight search', { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickDepartureDateField();
    // Same-day round trip: pick today as the departure, then today again as the return.
    await selectTodayFromVisibleCalendar(page);
    await selectTodayFromVisibleCalendar(page);
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', departureDate: 'today', returnDate: 'today' };
  },

  /**
   * Round-trip flight search: completeTrip + roundTrip + default route from routes
   */
  async searchFlightRoundTrip(
    page,
    routeInput = flightRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: "completeTrip",
      tripType: "roundTrip",
      departureIndex,
      returnIndex,
    });
  },

  /**
   * Round-trip flight search with explicit near-term dates, given as an offset in days
   * from today, instead of the default "nth available date" index. Routes whose default
   * (month-out) date spread returns no availability for a given carrier can be retried
   * with closer dates using this method.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to} object
   * @param {Object} options
   * @param {number} options.departureDaysFromNow - Days from today for the outbound leg
   * @param {number} options.returnDaysFromNow - Days from today for the return leg
   * @returns {Promise<{searched: boolean, from: string, to: string, tripType: string, searchType: string, departureDate: string, returnDate: string}>}
   */
  async searchFlightRoundTripWithDaysFromNow(page, routeInput, { departureDaysFromNow, returnDaysFromNow } = {}) {
    if (!page) {
      throw new Error('[FlightSearch.searchFlightRoundTripWithDaysFromNow] "page" is required.');
    }
    if (!Number.isInteger(departureDaysFromNow) || departureDaysFromNow < 0) {
      throw new Error('departureDaysFromNow must be a non-negative integer, got: ' + departureDaysFromNow);
    }
    if (!Number.isInteger(returnDaysFromNow) || returnDaysFromNow <= departureDaysFromNow) {
      throw new Error('returnDaysFromNow must be an integer greater than departureDaysFromNow, got: ' + returnDaysFromNow);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');

    const toDateInputValue = (daysFromNow) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    const departureDate = toDateInputValue(departureDaysFromNow);
    const returnDate = toDateInputValue(returnDaysFromNow);

    logger.info('Starting roundTrip flight search with explicit days-from-now dates', { from, to, departureDate, returnDate });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    await searchPage.clickDepartureDateField();
    await selectDatesByInputValues(page, {
      startDateValue: departureDate,
      endDateValue: returnDate,
    });

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', departureDate, returnDate };
  },

  /**
   * Fills in a round-trip flight search (tab, trip type, route, dates, complete-trip mode)
   * WITHOUT clicking the search button, leaving the search form open for further edits
   * (e.g. editing the parallel hotel destination before submitting).
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to} object
   * @param {Object} [options]
   * @param {number} [options.departureIndex] - Departure date index (default: from SEARCH_DEFAULTS)
   * @param {number} [options.returnIndex] - Return date index (default: from SEARCH_DEFAULTS)
   * @returns {Promise<{from: string, to: string, tripType: string, searchType: string, submitted: boolean}>}
   */
  async searchFlightRoundTripWithoutSearch(
    page,
    routeInput = flightRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
      cabinClass = null,
    } = {},
  ) {
    if (!page) {
      throw new Error('[FlightSearch.searchFlightRoundTripWithoutSearch] "page" is required, got: ' + typeof page);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Filling roundTrip flight search without clicking search', { from, to, cabinClass });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    // Optional cabin-class selection (e.g. "Premium Economy") before completing the trip setup.
    if (cabinClass) {
      await flightSearchPage.selectFlightClass(cabinClass);
    }

    await flightSearchPage.selectCompleteTrip();

    return { from, to, tripType: 'roundTrip', searchType: 'completeTrip', cabinClass, submitted: false };
  },

  /**
   * Fills in a round-trip flight search WITH a requested cabin class but WITHOUT clicking the search
   * button (e.g. to then open request assistance and verify the parameters were carried into the
   * travel-request form). Thin wrapper over searchFlightRoundTripWithoutSearch with a mandatory
   * cabin class, so the fill sequence lives in one place.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to} object
   * @param {string} cabinClass - Cabin class to select in the search form (e.g. "Premium Economy")
   * @param {Object} [options]
   * @param {number} [options.departureIndex] - Departure date index (default: from SEARCH_DEFAULTS)
   * @param {number} [options.returnIndex] - Return date index (default: from SEARCH_DEFAULTS)
   * @returns {Promise<{from: string, to: string, tripType: string, searchType: string, cabinClass: string, submitted: boolean}>}
   */
  async searchFlightRoundTripWithCabinClassWithoutSearch(page, routeInput = flightRoutes.defaultRoute, cabinClass, options = {}) {
    if (!page) {
      throw new Error('[FlightSearch.searchFlightRoundTripWithCabinClassWithoutSearch] "page" is required, got: ' + typeof page);
    }
    if (!cabinClass || typeof cabinClass !== 'string') {
      throw new Error('[FlightSearch.searchFlightRoundTripWithCabinClassWithoutSearch] "cabinClass" must be a non-empty string, got: ' + typeof cabinClass);
    }
    return this.searchFlightRoundTripWithoutSearch(page, routeInput, { ...options, cabinClass });
  },

  /**
   * Round-trip flight search with an advanced-search preferred carrier filter.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   * @param {string} carrier - Preferred carrier label, e.g. "Qantas"
   * @param {Object} options - Date-selection options
   */
  async searchFlightRoundTripWithPreferredCarrier(
    page,
    routeInput,
    carrier,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!routeInput) throw new Error('routeInput is required');
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string, got: ' + carrier);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting roundTrip flight search with preferred carrier', { from, to, carrier });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    await this.openAdvancedSearch(page);
    await flightSearchPage.clearPreferredCarriers();
    await flightSearchPage.selectPreferredCarrier(carrier);
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', carrier };
  },

  /**
   * One-way flight search with an advanced-search preferred carrier filter.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   * @param {string} carrier - Preferred carrier label, e.g. "Qantas"
   * @param {Object} options - Date-selection options
   */
  async searchFlightOneWayWithPreferredCarrier(
    page,
    routeInput,
    carrier,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!routeInput) throw new Error('routeInput is required');
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string, got: ' + carrier);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting oneWay flight search with preferred carrier', { from, to, carrier });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await this.openAdvancedSearch(page);
    await flightSearchPage.clearPreferredCarriers();
    await flightSearchPage.selectPreferredCarrier(carrier);
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'oneWay', searchType: 'completeTrip', carrier };
  },

  /**
   * One-way flight search with a specific departure time preference.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   * @param {string} timePreference - Departure time label, e.g. "Early (04:00-08:00)"
   * @param {Object} options - Date-selection options
   */
  async searchFlightOneWayWithDepartureTime(
    page,
    routeInput,
    timePreference,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('[FlightSearch.searchFlightOneWayWithDepartureTime] "page" is required.');
    if (!routeInput) throw new Error('[FlightSearch.searchFlightOneWayWithDepartureTime] "routeInput" is required.');
    if (!timePreference || typeof timePreference !== 'string') {
      throw new Error(`[FlightSearch.searchFlightOneWayWithDepartureTime] "timePreference" must be a non-empty string, got: ${timePreference}`);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting oneWay flight search with departure time preference', { from, to, timePreference });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectOneWayTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await this.openAdvancedSearch(page);
    await flightSearchPage.selectDepartureFlightTime(timePreference);
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'oneWay', searchType: 'completeTrip', timePreference };
  },

  /**
   * Round-trip flight search with a requested cabin class.
   *
   * @param {Object} page - Playwright page object
   * @param {string|Object} routeInput - Route key or {from, to}
   * @param {string} cabinClass - Cabin class to select in the search form
   * @param {Object} options - Date-selection options
   */
  async searchFlightRoundTripWithCabinClass(
    page,
    routeInput,
    cabinClass,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
      searchType = 'completeTrip',
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!routeInput) throw new Error('routeInput is required');
    if (!cabinClass || typeof cabinClass !== 'string') {
      throw new Error('cabinClass must be a non-empty string, got: ' + cabinClass);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting roundTrip flight search with cabin class', { from, to, cabinClass, searchType });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });
    await flightSearchPage.selectFlightClass(cabinClass);

    if (searchType === 'bySchedule') {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }

    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType, cabinClass };
  },

  /**
   * By-schedule round-trip search with a different cabin per leg (e.g. Economy outbound, Business return).
   *
   * @param {import('playwright').Page} page
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport/metro code
   * @param {string} outboundCabin - Cabin for the outbound leg
   * @param {string} returnCabin - Cabin for the return leg
   * @param {Object} [options]
   */
  async searchFlightByScheduleRoundTripWithCabins(
    page,
    from,
    to,
    outboundCabin,
    returnCabin,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);
    if (!outboundCabin || typeof outboundCabin !== 'string') throw new Error('outboundCabin must be a non-empty string, got: ' + outboundCabin);
    if (!returnCabin || typeof returnCabin !== 'string') throw new Error('returnCabin must be a non-empty string, got: ' + returnCabin);

    logger.info('Starting by-schedule round-trip search with per-leg cabins', { from, to, outboundCabin, returnCabin });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });
    // Advanced search (in by-schedule) exposes a cabin field per leg: index 0 = outbound, 1 = return.
    await flightSearchPage.selectBySchedule();
    await this.openAdvancedSearch(page);
    await flightSearchPage.selectFlightClassByIndex(outboundCabin, 0);
    await flightSearchPage.selectFlightClassByIndex(returnCabin, 1);
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'bySchedule', outboundCabin, returnCabin };
  },

  /**
   * Multi-city flight search: completePTrip + multiCity + multiple legs
   *
   * @param {Object} page - Playwright page object
   * @param {Array<{from: string, to: string}>} legs - Array of at least 2 leg objects
   * @param {Object} options
   * @param {number} options.departureIndex - Starting available-day index for first leg (default: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX)
   * @param {string} options.searchType - 'completeTrip' (default) or 'bySchedule'
   */
  async searchFlightMultiCity(
    page,
    legs,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX, searchType = 'completeTrip' } = {},
  ) {
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }
    if (searchType !== 'completeTrip' && searchType !== 'bySchedule') {
      throw new Error(`searchType must be 'completeTrip' or 'bySchedule', got: ${searchType}`);
    }

    logger.info('Starting multi-city flight search', { legs, searchType });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectMultiCityTrip();
    await searchPage.waitForMultiCitySection();

    // Add extra rows if the default number of rows is less than the number of legs
    const currentRows = await page.locator('.multi-city-line').count();
    for (let i = currentRows; i < legs.length; i++) {
      await searchPage.clickAddFlightRowButton();
    }

    // Fill origin, destination, and departure date for each leg
    for (let i = 0; i < legs.length; i++) {
      const { from, to } = legs[i];
      // Fill From + To scoped to this leg's row; Tab from To auto-opens the date picker
      await searchPage.fillMultiCityLeg(from, to, i);
      // Use the already-open picker or open it if not — never toggle-close
      await searchPage.openMultiCityDatePickerAtIndex(i);
      await searchPage.clickCalendarNextArrow();
      await selectDatesByNthAvailable(page, {
        startIndex: departureIndex + i * 3,
        endIndex: null,
      });
    }

    if (searchType === 'bySchedule') {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }
    await searchPage.waitAndClickSearchButton();

    return { searched: true, legs, tripType: 'multiCity', searchType };
  },

  /**
   * Multi-city search that leaves a longer stay in the first destination. Each leg's date picker opens on
   * the previous leg's date, so later legs are placed `stayDayGaps` available-days after the previous one
   * (default [10, 2]: ~2 weeks then ~2 days) rather than advancing whole months (which compounds).
   *
   * @param {import('playwright').Page} page
   * @param {Array<{from: string, to: string}>} legs - At least 2 {from, to} legs
   * @param {Object} [options] - departureIndex, firstLegMonthsAhead, stayDayGaps, searchType
   */
  async searchFlightMultiCityWithLongerFirstStay(
    page,
    legs,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      firstLegMonthsAhead = 3,
      stayDayGaps = [10, 2],
      searchType = 'completeTrip',
    } = {},
  ) {
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }
    if (!Number.isInteger(firstLegMonthsAhead) || firstLegMonthsAhead < 0) {
      throw new Error(`firstLegMonthsAhead must be an integer >= 0, got: ${firstLegMonthsAhead}`);
    }
    if (!Array.isArray(stayDayGaps) || stayDayGaps.length === 0 || !stayDayGaps.every((g) => Number.isInteger(g) && g >= 0)) {
      throw new Error('stayDayGaps must be a non-empty array of non-negative integers, got: ' + JSON.stringify(stayDayGaps));
    }
    if (searchType !== 'completeTrip' && searchType !== 'bySchedule') {
      throw new Error(`searchType must be 'completeTrip' or 'bySchedule', got: ${searchType}`);
    }

    logger.info('Starting multi-city flight search with a longer first-destination stay', {
      legs,
      searchType,
      firstLegMonthsAhead,
      stayDayGaps,
    });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectMultiCityTrip();
    await searchPage.waitForMultiCitySection();

    const currentRows = await page.locator('.multi-city-line').count();
    for (let i = currentRows; i < legs.length; i++) {
      await searchPage.clickAddFlightRowButton();
    }

    for (let i = 0; i < legs.length; i++) {
      const { from, to } = legs[i];
      await searchPage.fillMultiCityLeg(from, to, i);
      await searchPage.openMultiCityDatePickerAtIndex(i);
      if (i === 0) {
        await searchPage.clickCalendarNextArrow(firstLegMonthsAhead);
        await selectDatesByNthAvailable(page, { startIndex: departureIndex, endIndex: null });
      } else {
        // Later legs: don't advance months (picker opens on the previous leg's date); pick a day `gap` later.
        const gap = stayDayGaps[Math.min(i - 1, stayDayGaps.length - 1)];
        await selectDatesByNthAvailable(page, { startIndex: gap, endIndex: null });
      }
    }

    if (searchType === 'bySchedule') {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }
    await searchPage.waitAndClickSearchButton();

    return { searched: true, legs, tripType: 'multiCity', searchType };
  },

  /**
   * Multi-city flight search with legs placed a few days apart (near-term) instead of the default
   * wider month-apart spread. Short-haul multi-city itineraries whose legs are spread months apart
   * can return "No results"; this keeps them bookable by advancing one month for the first leg and
   * then placing each later leg a couple of available days after the previous.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{from: string, to: string}>} legs - At least 2 leg objects
   * @param {Object} options
   * @param {number} options.departureIndex - Starting available-day index for the first leg (default: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX)
   * @param {string} options.searchType - 'completeTrip' (default) or 'bySchedule'
   * @returns {Promise<{searched: boolean, legs: Array, tripType: string, searchType: string}>}
   */
  async searchFlightMultiCityWithCloseDates(
    page,
    legs,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX, searchType = 'completeTrip' } = {},
  ) {
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }
    if (searchType !== 'completeTrip' && searchType !== 'bySchedule') {
      throw new Error(`searchType must be 'completeTrip' or 'bySchedule', got: ${searchType}`);
    }

    logger.info('Starting multi-city flight search with close leg dates', { legs, searchType });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectMultiCityTrip();
    await searchPage.waitForMultiCitySection();

    const currentRows = await page.locator('.multi-city-line').count();
    for (let i = currentRows; i < legs.length; i++) {
      await searchPage.clickAddFlightRowButton();
    }

    for (let i = 0; i < legs.length; i++) {
      const { from, to } = legs[i];
      await searchPage.fillMultiCityLeg(from, to, i);
      await searchPage.openMultiCityDatePickerAtIndex(i);
      // Advance one month for the first leg, then place each later leg a couple of available days
      // after the previous one so the legs stay near-term and only a few days apart.
      if (i === 0) {
        await searchPage.clickCalendarNextArrow();
        await selectDatesByNthAvailable(page, { startIndex: departureIndex, endIndex: null });
      } else {
        await selectDatesByNthAvailable(page, { startIndex: 2, endIndex: null });
      }
    }

    if (searchType === 'bySchedule') {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }
    await searchPage.waitAndClickSearchButton();

    return { searched: true, legs, tripType: 'multiCity', searchType };
  },

  /**
   * Multi-city flight search with parallel car search enabled.
   * Parses legs (array of {from, to}), sets up multi-city search,
   * enables the parallel car checkbox, then submits.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{from: string, to: string}>} legs - At least 2 leg objects
   * @returns {Promise<{searched: boolean, legs: Array, tripType: string, parallelCar: boolean}>}
   */
  async searchFlightMultiCityWithParallelCar(
    page,
    legs,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {},
  ) {
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }

    logger.info('Starting multi-city flight search with parallel car', { legs });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectMultiCityTrip();
    await searchPage.waitForMultiCitySection();

    const currentRows = await page.locator('.multi-city-line').count();
    for (let i = currentRows; i < legs.length; i++) {
      await searchPage.clickAddFlightRowButton();
    }

    for (let i = 0; i < legs.length; i++) {
      const { from, to } = legs[i];
      await searchPage.fillMultiCityLeg(from, to, i);
      await searchPage.openMultiCityDatePickerAtIndex(i);
      await searchPage.clickCalendarNextArrow();
      await selectDatesByNthAvailable(page, {
        startIndex: departureIndex + i * 3,
        endIndex: null,
      });
    }

    await flightSearchPage.selectCompleteTrip();

    // Enable parallel car search so car results appear alongside flight results
    await flightSearchPage.checkParallelCarSearch();

    await searchPage.waitAndClickSearchButton();

    return { searched: true, legs, tripType: 'multiCity', parallelCar: true };
  },

  /**
   * Flight search by schedule: bySchedule + roundTrip + default route
   */
  async searchFlightBySchedule(
    page,
    routeInput = flightRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: "bySchedule",
      tripType: "roundTrip",
      departureIndex,
      returnIndex,
    });
  },

  async searchFlightByScheduleWithCabinClass(page, routeInput, cabinClass, options = {}) {
    return await this.searchFlightRoundTripWithCabinClass(page, routeInput, cabinClass, {
      ...options,
      searchType: 'bySchedule',
    });
  },

  /**
   * Searches a round trip flight with advanced search options.
   * Opens advanced search, fills origin/destination, selects dates, 
   * and optionally changes the return date type and time.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {Object} options
   * @param {string} options.departureDateType - "Departure" or "Arrival" for outbound leg (default: null = don't change)
   * @param {string} options.returnDateType - "Departure" or "Arrival" for return leg (default: null = don't change)
   * @param {string} options.returnFlightTime - "Anytime", "Morning", etc. (default: null = don't change)
   * @param {boolean} options.parallelHotel - Check parallel hotel search (default: false)
   */
  async searchRoundTripAdvanced(
    page,
    from,
    to,
    {
      departureDateType = null,
      returnDateType = null,
      returnFlightTime = null,
      parallelHotel = false,
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);

    logger.info('Starting advanced round trip flight search', { from, to, departureDateType, returnDateType, returnFlightTime, parallelHotel });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();

    // Enable advanced search (splits into departure + return sections)
    await flightSearchPage.clickAdvancedSearchButton();
    // Wait for advanced search panel animation to complete before filling fields
    await page.waitForTimeout(500);

    // Fill origin and destination
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Autocomplete popper must fully close before clicking date fields; no dismiss event available
    await page.waitForTimeout(1000);

    // Select outbound + return dates (per-leg advanced calendar).
    await this._selectAdvancedRoundTripDates(page, departureIndex, returnIndex);

    // Change departure date type if specified
    if (departureDateType) {
      await flightSearchPage.selectDepartureDateType(departureDateType);
    }

    // Change return date type if specified
    if (returnDateType) {
      await flightSearchPage.selectReturnDateType(returnDateType);
    }

    // Change return flight time if specified
    if (returnFlightTime) {
      await flightSearchPage.selectReturnFlightTime(returnFlightTime);
    }

    // Enable parallel hotel search if requested
    if (parallelHotel) {
      await flightSearchPage.checkParallelHotelSearch();
    }

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', advanced: true };
  },

  /**
   * Edits the flight search from/to fields in the edit-search modal.
   *
   * Used when the search modal opens from the cart with pre-filled airport values.
   * Clears the existing airport binding using real keyboard events and types
   * the new values, then submits the search.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - New origin airport code
   * @param {string} to - New destination airport code
   */
  async editFlightSearch(page, from, to, { departureDate = undefined, returnDate = undefined } = {}) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);
    if ((departureDate && !returnDate) || (!departureDate && returnDate)) {
      throw new Error('departureDate and returnDate must either both be provided or both be omitted');
    }
    if (departureDate !== undefined && typeof departureDate !== 'string') {
      throw new Error('departureDate must be a string when provided, got: ' + typeof departureDate);
    }
    if (returnDate !== undefined && typeof returnDate !== 'string') {
      throw new Error('returnDate must be a string when provided, got: ' + typeof returnDate);
    }

    logger.info('Editing flight search in modal', { from, to, departureDate, returnDate });

    const searchPage = getPageObject(page, SearchPage);
    const resultsPage = getPageObject(page, ResultsPage);

    // Ensure the edit-search drawer is open. When called from the cart/add-to-trip flow
    // the drawer is already open; when called from the no-results state we must click
    // the "Edit search" button on the no-results panel first.
    const drawerInput = searchPage.getEditAirportInput(0);
    if (!(await drawerInput.isVisible().catch(() => false))) {
      const noResultsEditBtn = resultsPage.getNoResultsEditSearchButton();
      if (await noResultsEditBtn.isVisible().catch(() => false)) {
        logger.info('Opening edit-search drawer from no-results state');
        await noResultsEditBtn.click();
      } else {
        logger.info('Opening edit-search drawer via results edit button');
        await resultsPage.clickEditButton();
      }
    }

    // Wait for search form to be ready — FROM input must be visible and pre-filled
    await searchPage.waitForFromFieldVisible();

    await searchPage.editFromField(from);
    await searchPage.editToField(to);

    if (departureDate && returnDate) {
      await searchPage.clickDepartureDateField();
      await selectDatesByInputValues(page, {
        startDateValue: departureDate,
        endDateValue: returnDate,
      });
    }

    await searchPage.waitAndClickEditSearchButton();

    return { searched: true, from, to, departureDate, returnDate };
  },

  /**
   * Opens the edit-search form from flight results and waits for the expected search mode option.
   *
   * @param {Object} page - Playwright page object
   * @param {string} searchMode - Visible search mode label, e.g. "Complete trip"
   */
  async clickEditSearchAndWaitForSearchMode(page, searchMode) {
    if (!page) throw new Error('page is required');
    if (!searchMode || typeof searchMode !== 'string') {
      throw new Error('searchMode must be a non-empty string, got: ' + searchMode);
    }

    logger.info('Opening edit search from results', { searchMode });

    const resultsPage = getPageObject(page, ResultsPage);
    const flightSearchPage = getPageObject(page, FlightSearchPage);

    await resultsPage.clickEditButton();
    await flightSearchPage.waitForSearchModeOption(searchMode);

    return { opened: true, searchMode };
  },

  /**
   * Opens the edit-search form from a results page and waits for the form to be ready for input.
   *
   * Product-agnostic: this backs the generic "I click edit search" step, which is used on both
   * flight and car results pages. Flight edit drawers expose an airport autocomplete field; car
   * edit drawers expose a "Pick-up Date" field instead — waitForEditSearchDrawerReady waits for
   * whichever appears so the same step works in both contexts.
   *
   * @param {Object} page - Playwright page object
   */
  async clickEditSearch(page) {
    if (!page) throw new Error('page is required');

    logger.info('Opening edit search from results');

    const resultsPage = getPageObject(page, ResultsPage);
    const searchPage = getPageObject(page, SearchPage);

    await resultsPage.clickEditButton();
    await searchPage.waitForEditSearchDrawerReady();

    return { opened: true };
  },

  /**
   * Closes the edit-search drawer opened from the results page (e.g. after verifying the retained
   * dates). Waits for the drawer to disappear so the next step acts on the results page behind it.
   *
   * @param {Object} page - Playwright page object
   * @returns {Promise<{closed: boolean}>}
   */
  async closeEditSearch(page) {
    if (!page) throw new Error('page is required');

    logger.info('Closing the edit search drawer');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.closeEditSearchDrawer();
    // The drawer animates out; tolerate it being already gone rather than fail the step.
    await searchPage.getEditSearchDrawer().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    return { closed: true };
  },

  /**
   * Changes the search mode in the edit-flight-search form.
   *
   * @param {Object} page - Playwright page object
   * @param {string} searchMode - Supported values: "Complete trip" or "By schedule"
   */
  async changeSearchTypeInEditFlightSearch(page, searchMode) {
    if (!page) throw new Error('page is required');
    if (!searchMode || typeof searchMode !== 'string') {
      throw new Error('searchMode must be a non-empty string, got: ' + searchMode);
    }

    logger.info('Changing flight search mode in edit search', { searchMode });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const normalizedSearchMode = searchMode.trim().toLowerCase();

    if (normalizedSearchMode === 'by schedule') {
      await flightSearchPage.selectBySchedule();
    } else if (normalizedSearchMode === 'complete trip') {
      await flightSearchPage.selectCompleteTrip();
    } else {
      throw new Error(`searchMode must be "Complete trip" or "By schedule", got: ${searchMode}`);
    }

    await flightSearchPage.waitForSearchModeOption(searchMode);

    return { updated: true, searchMode };
  },

  /**
   * Changes the edit-search mode and selects fresh round-trip dates before submitting.
   *
   * @param {Object} page - Playwright page object
   * @param {string} searchMode - Supported values: "Complete trip" or "By schedule"
   * @param {Object} options
   * @param {number} options.monthsAhead - Number of months to advance before selecting dates
   * @param {number} options.departureIndex - Zero-based available-day index for departure
   * @param {number} options.returnIndex - Zero-based available-day index for return
   */
  async changeSearchTypeAndUpdateDatesInEditFlightSearch(
    page,
    searchMode,
    {
      monthsAhead = 1,
      departureIndex = 10,
      returnIndex = 17,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!searchMode || typeof searchMode !== 'string') {
      throw new Error('searchMode must be a non-empty string, got: ' + searchMode);
    }
    if (!Number.isInteger(monthsAhead) || monthsAhead < 0) {
      throw new Error(`monthsAhead must be an integer >= 0, got: ${monthsAhead}`);
    }
    if (!Number.isInteger(departureIndex) || departureIndex < 0) {
      throw new Error(`departureIndex must be an integer >= 0, got: ${departureIndex}`);
    }
    if (!Number.isInteger(returnIndex) || returnIndex < 0) {
      throw new Error(`returnIndex must be an integer >= 0, got: ${returnIndex}`);
    }

    logger.info('Changing flight search mode and updating dates in edit search', {
      searchMode,
      monthsAhead,
      departureIndex,
      returnIndex,
    });

    await this.changeSearchTypeInEditFlightSearch(page, searchMode);

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow(monthsAhead);
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    const departureDate = await searchPage.getDepartureDateFieldValue();
    const returnDate = await searchPage.getReturnDateFieldValue();

    return {
      updated: true,
      searchMode,
      departureDate,
      returnDate,
    };
  },

  /**
   * Changes the departure location in the edit-search form.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - New origin airport code
   */
  async changeDepartureLocationInEditSearch(page, from) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') {
      throw new Error('from must be a non-empty string, got: ' + from);
    }

    logger.info('Changing departure location in edit search', { from });

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForFromFieldVisible();
    await searchPage.editFromField(from);

    return { updated: true, from };
  },

  /**
   * Opens advanced search in the flight search form.
   *
   * @param {Object} page - Playwright page object
   */
  async openAdvancedSearch(page) {
    if (!page) throw new Error('page is required');

    logger.info('Opening advanced flight search');

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const isExpanded = await flightSearchPage.isAdvancedSearchExpanded();
    if (!isExpanded) {
      await flightSearchPage.clickAdvancedSearchButton();
    }
    await flightSearchPage.waitForAdvancedSearchOptions();

    return { opened: true };
  },

  /**
   * Selects a stop option from the advanced-search Stops dropdown.
   *
   * @param {Object} page - Playwright page object
   * @param {string} stopsOption - Stops option label, e.g. "Up to two stops"
   */
  async selectStopsOption(page, stopsOption) {
    if (!page) throw new Error('page is required');
    if (!stopsOption || typeof stopsOption !== 'string') {
      throw new Error('stopsOption must be a non-empty string, got: ' + stopsOption);
    }

    logger.info('Selecting flight stops option', { stopsOption });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    await flightSearchPage.selectStopsOption(stopsOption);

    return { selected: true, stopsOption };
  },

  /**
   * Verifies the Stops dropdown does not accept free text input.
   *
   * @param {import('playwright').Page} page
   * @param {string} freeText
   * @param {string} expectedSelectionText
   */
  async verifyStopsDropdownRejectsFreeText(page, freeText, expectedSelectionText = 'Up to one stop') {
    if (!page) throw new Error('page is required');
    if (!freeText || typeof freeText !== 'string') {
      throw new Error('freeText must be a non-empty string, got: ' + freeText);
    }
    if (!expectedSelectionText || typeof expectedSelectionText !== 'string') {
      throw new Error('expectedSelectionText must be a non-empty string, got: ' + expectedSelectionText);
    }

    logger.info('Verifying flight stops dropdown rejects free text', { freeText, expectedSelectionText });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const { expect } = require('@playwright/test');

    await flightSearchPage.waitForAdvancedSearchOptions();
    const result = await flightSearchPage.typeFreeTextInStopsDropdown(freeText);
    await flightSearchPage.waitForStopsDropdownDisplayText(expectedSelectionText);

    const displayedText = await flightSearchPage.getStopsDropdownDisplayText();

    expect(displayedText, 'Stops dropdown should keep its default selection text').toContain(expectedSelectionText);
    expect(result.inputValue, 'Stops dropdown should not keep the typed free text').not.toBe(freeText);

    return {
      freeText,
      expectedSelectionText,
      displayedText,
      inputValue: result.inputValue,
      isEditable: result.isEditable,
    };
  },

  /**
   * Updates the edit-search form to run a by-schedule search with a preferred carrier.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} carrier - Preferred carrier label, e.g. "United"
   */
  async searchFlightByScheduleWithPreferredCarrierInEditSearch(page, from, to, carrier) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string, got: ' + carrier);
    }

    logger.info('Searching from edit flight search by schedule with preferred carrier', { from, to, carrier });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await searchPage.waitForFromFieldVisible();
    await searchPage.editFromField(from);
    await searchPage.editToField(to);
    await flightSearchPage.selectBySchedule();
    await this.openAdvancedSearch(page);
    await flightSearchPage.clearPreferredCarriers();
    await flightSearchPage.selectPreferredCarrier(carrier);
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'bySchedule', carrier };
  },

  /**
   * Searches for a by-schedule round-trip flight with an advanced-search preferred-carrier filter.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} carrier - Preferred carrier label or code, e.g. "Lufthansa" or "LH"
   * @param {Object} [options] - Date-selection options
   */
  async searchFlightByScheduleWithPreferredCarrier(page, from, to, carrier, options) {
    return this.searchFlightByScheduleWithPreferredCarrierAndStops(page, from, to, carrier, null, options);
  },

  /**
   * Searches for a by-schedule round-trip flight with advanced-search preferred-carrier and (optional) stops filters.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} carrier - Preferred carrier label or code, e.g. "Scandinavian" or "SK"
   * @param {string|null} stopsOption - Stops option label, e.g. "No stops". Pass null/undefined to skip the stops filter.
   * @param {Object} [options] - Date-selection options
   */
  async searchFlightByScheduleWithPreferredCarrierAndStops(
    page,
    from,
    to,
    carrier,
    stopsOption,
    options,
  ) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string, got: ' + carrier);
    }
    if (stopsOption !== null && stopsOption !== undefined && typeof stopsOption !== 'string') {
      throw new Error('stopsOption must be a string, null, or undefined, got: ' + typeof stopsOption);
    }
    if (typeof stopsOption === 'string' && stopsOption.length === 0) {
      throw new Error('stopsOption must be a non-empty string when provided');
    }
    if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) {
      throw new Error('options must be a plain object when provided, got: ' + (options === null ? 'null' : typeof options));
    }
    const {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = options ?? {};

    const logMessage = stopsOption
      ? 'Searching for by-schedule flight with preferred carrier and stops filter'
      : 'Searching for by-schedule flight with preferred carrier';
    logger.info(logMessage, {
      from,
      to,
      carrier,
      stopsOption: stopsOption || null,
    });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    await flightSearchPage.selectBySchedule();
    await this.openAdvancedSearch(page);
    await flightSearchPage.clearPreferredCarriers();
    await flightSearchPage.selectPreferredCarrier(carrier);
    if (stopsOption) {
      await flightSearchPage.selectStopsOption(stopsOption);
    }
    await searchPage.waitAndClickSearchButton();

    return {
      searched: true,
      from,
      to,
      tripType: 'roundTrip',
      searchType: 'bySchedule',
      carrier,
      ...(stopsOption ? { stopsOption } : {}),
    };
  },

  /**
   * Submits the edit-search form.
   *
   * @param {Object} page - Playwright page object
   */
  async searchFromEditFlightSearch(page) {
    if (!page) throw new Error('page is required');

    logger.info('Submitting edit flight search form');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitAndClickEditSearchButton();

    return { searched: true };
  },

  /**
   * Verifies the search loading screen appears after a flight search is submitted.
   *
   * Asserts the loader slideshow message is visible, confirming the system is processing
   * the request. Must be called immediately after submitting the search — the loader is
   * transient and disappears once results render.
   *
   * @param {import('playwright').Page} page - Playwright page object
   */
  async verifySearchLoadingScreenVisible(page) {
    if (!page) throw new Error('[FlightSearch.verifySearchLoadingScreenVisible] "page" is required.');

    logger.info('Verifying the search loading screen is visible');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isSearchSlideshowVisible();

    expect(
      isVisible,
      'Search loading screen (loader slideshow) was not visible after submitting the search — the loader may not have rendered or results returned too quickly to observe it.',
    ).toBe(true);

    return { loadingScreenVisible: isVisible };
  },

  /**
   * Clicks the flight tab to navigate to the flight search form.
   * @param {import('playwright').Page} page
   */
  async clickFlightTab(page) {
    if (!page) throw new Error('page is required');
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    await flightSearchPage.clickFlightTab();
  },

  /**
   * Verifies the car search checkbox is checked by default in the flight search form.
   * @param {import('playwright').Page} page
   */
  async verifyCarSearchCheckboxChecked(page) {
    if (!page) throw new Error('page is required');
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const isChecked = await flightSearchPage.isCarSearchCheckboxChecked();
    const { expect } = require('@playwright/test');
    expect(isChecked, 'Car search checkbox should be checked by default').toBe(true);
  },

  /**
   * Verifies the "Allow nearby airports" checkbox in the advanced flight search is checked.
   *
   * The checkbox state reflects the administration configuration; this asserts it is enabled.
   * Expects the flight search form to already be displayed (open the flight tab first).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{allowNearbyAirportsChecked: boolean}>}
   */
  async verifyAllowNearbyAirportsCheckboxIsChecked(page) {
    if (!page) throw new Error('[FlightSearch.verifyAllowNearbyAirportsCheckboxIsChecked] "page" is required.');

    logger.info('Verifying the "Allow nearby airports" checkbox is checked');

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    // Poll for the checked state: the box is set reactively from the administration
    // configuration shortly after the flight tab loads, so a single read can race it.
    const isChecked = await flightSearchPage.waitForAllowNearbyAirportsChecked();

    expect(
      isChecked,
      '"Allow nearby airports" checkbox in the advanced flight search should be checked per administration configuration, but it was unchecked.',
    ).toBe(true);

    return { allowNearbyAirportsChecked: isChecked };
  },

  /**
   * Verifies a validation message is NOT displayed anywhere on the search page.
   *
   * Used to guard against a spurious validation message (e.g. "This field is required") appearing
   * after a same-day round-trip search. Gives the message a window to surface before asserting absence,
   * so the negative assertion is meaningful rather than passing before any message could render.
   *
   * @param {import('playwright').Page} page - Playwright page object
   * @param {string} message - The validation message text that must not appear
   * @returns {Promise<{message: string, displayed: boolean}>}
   */
  async verifyValidationMessageNotDisplayedOnSearchPage(page, message) {
    if (!page) throw new Error('[FlightSearch.verifyValidationMessageNotDisplayedOnSearchPage] "page" is required.');
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[FlightSearch.verifyValidationMessageNotDisplayedOnSearchPage] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`,
      );
    }

    logger.info('Verifying the validation message is not displayed on the search page', { message });

    const searchPage = getPageObject(page, SearchPage);
    const displayed = await searchPage.isValidationMessageVisible(message);

    expect(
      displayed,
      `"${message}" validation message should NOT be displayed on the search page after a same-day round-trip search, but it was shown.`,
    ).toBe(false);

    return { message, displayed };
  },

  /**
   * Searches for a round trip flight with the parallel car search checkbox enabled.
   * @param {import('playwright').Page} page
   * @param {string|Object} routeInput - Route key or {from, to} object
   */
  async searchFlightRoundTripWithParallelCar(page, routeInput = flightRoutes.defaultRoute) {
    if (!page) throw new Error('page is required');

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting roundTrip flight search with parallel car', { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectRoundTrip();
    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      endIndex: SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    });

    // Enable parallel car search and ensure only car is parallel-searched:
    // the hotel checkbox may be checked by default, so explicitly uncheck it.
    await flightSearchPage.checkParallelCarSearch();
    await flightSearchPage.uncheckParallelHotelSearch();

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', parallelCar: true, parallelHotel: false };
  },

  /**
   * Clicks the flight tab and checks the "Allow nearby airports" checkbox.
   * @param {import('playwright').Page} page
   */
  async clickFlightTabAndCheckNearbyAirports(page) {
    if (!page) throw new Error('page is required');
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.toggleAllowNearbyAirportsCheckbox();
  },

  /**
   * Clicks the flight tab and checks the "Add hotel to this trip" checkbox.
   * @param {import('playwright').Page} page
   */
  async clickFlightTabAndCheckParallelHotel(page) {
    if (!page) throw new Error('page is required');
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.checkParallelHotelSearch();
  },

  /**
   * Edits the parallel hotel destination on the flight search tab so the parallel hotel
   * search targets a city other than the flight destination.
   *
   * Must run AFTER the flight route has been entered: selecting the flight destination
   * overwrites the parallel hotel destination with the flight's (see flight-search-inputs
   * `selectedDestination` → `updateHotelAutocomplete`), so this step overrides it. Ensures
   * only the hotel is parallel-searched (hotel checkbox checked, car checkbox unchecked).
   *
   * @param {import('playwright').Page} page
   * @param {string} destination - Hotel destination city (e.g. "new york")
   * @returns {Promise<{parallelHotel: boolean, parallelCar: boolean, destination: string}>}
   */
  async editParallelHotelDestination(page, destination) {
    if (!page) {
      throw new Error('[FlightSearch.editParallelHotelDestination] "page" is required, got: ' + typeof page);
    }
    if (!destination || typeof destination !== 'string') {
      throw new Error(
        '[FlightSearch.editParallelHotelDestination] "destination" must be a non-empty string, got: ' + typeof destination,
      );
    }

    logger.info('Editing the parallel hotel destination', { destination });

    const flightSearchPage = getPageObject(page, FlightSearchPage);

    try {
      await flightSearchPage.clickFlightTab();

      // Ensure only the hotel is parallel-searched: hotel checked, car unchecked.
      await flightSearchPage.checkParallelHotelSearch();
      await flightSearchPage.uncheckParallelCarSearch();

      logger.debug('Opening the parallel hotel edit inputs before typing the destination');
      await flightSearchPage.openParallelHotelEditInputs();
      await flightSearchPage.typeParallelHotelDestination(destination);
    } catch (err) {
      throw new Error(
        `[FlightSearch.editParallelHotelDestination] Could not edit the parallel hotel destination to "${destination}". ` +
        'The "Add Hotel to this trip" checkbox, its "Edit" toggle, or the destination autocomplete selector may need updating. ' +
        `Original: ${err.message}`,
      );
    }

    return { parallelHotel: true, parallelCar: false, destination };
  },

  /**
   * Verifies the "Add Hotel to this trip" parallel-search checkbox is visible on the flight search tab.
   *
   * The checkbox is a TMC-level joy search default; this asserts it is offered on a new trip search.
   * Opens the flight tab first (it is the default tab, so this is defensive) and reads visibility.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{parallelHotelCheckboxVisible: boolean}>}
   */
  async verifyParallelHotelCheckboxVisible(page) {
    if (!page) {
      throw new Error('[FlightSearch.verifyParallelHotelCheckboxVisible] "page" is required, got: ' + typeof page);
    }
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    logger.debug('Verifying the "Add Hotel to this trip" parallel checkbox is visible on the flight search tab');

    // isHotelParallelCheckboxVisible swallows its own timeout and returns false, so no try/catch is
    // needed here — a not-visible checkbox falls through to a clean expect() failure below.
    await flightSearchPage.clickFlightTab();
    const isVisible = await flightSearchPage.isHotelParallelCheckboxVisible();

    expect(
      isVisible,
      'The "Add Hotel to this trip" parallel search checkbox should be visible on the flight search tab per the TMC-level joy search defaults, but it was not found.',
    ).toBe(true);

    return { parallelHotelCheckboxVisible: isVisible };
  },

  /**
   * Verifies the "Add Hotel to this trip" parallel-search checkbox is checked by default on the flight search tab.
   *
   * A checked-by-default state reflects the TMC-level joy search defaults being applied for the corporate user.
   * Opens the flight tab first (it is the default tab, so this is defensive) and reads the checked state.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{parallelHotelCheckboxChecked: boolean}>}
   */
  async verifyParallelHotelCheckboxCheckedByDefault(page) {
    if (!page) {
      throw new Error('[FlightSearch.verifyParallelHotelCheckboxCheckedByDefault] "page" is required, got: ' + typeof page);
    }
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    logger.debug('Verifying the "Add Hotel to this trip" parallel checkbox is checked by default on the flight search tab');

    let isChecked;
    try {
      await flightSearchPage.clickFlightTab();
      isChecked = await flightSearchPage.isParallelHotelSearchChecked();
    } catch (err) {
      throw new Error(
        '[FlightSearch.verifyParallelHotelCheckboxCheckedByDefault] Could not read the "Add Hotel to this trip" ' +
        'checkbox checked state on the flight search tab. The TMC-level joy search defaults may not be applied for ' +
        `this user, or the checkbox selector needs updating. Original: ${err.message}`
      );
    }

    expect(
      isChecked,
      'The "Add Hotel to this trip" parallel search checkbox should be checked by default on the flight search tab per the TMC-level joy search defaults, but it was unchecked.',
    ).toBe(true);

    return { parallelHotelCheckboxChecked: isChecked };
  },

  /**
   * Clicks the flight tab and disables parallel hotel and car search checkboxes if enabled.
   * @param {import('playwright').Page} page
   */
  async clickFlightTabAndUncheckParallelHotelAndCar(page) {
    if (!page) throw new Error('page is required');
    const flightSearchPage = getPageObject(page, FlightSearchPage);
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.uncheckParallelHotelSearch();
    await flightSearchPage.uncheckParallelCarSearch();
  },

  /**
   * Sets up a multi-city flight search with a specific cabin class for all legs
   * without clicking the search button. Used to assert UI state changes
   * (e.g. search type auto-switching to "By schedule") before the search is submitted.
   *
   * @param {import('playwright').Page} page
   * @param {Array<{from: string, to: string}>} legs - At least 2 {from, to} objects
   * @param {string} cabinClass - Cabin class label applied to every leg, e.g. "Business"
   * @returns {Promise<{setup: boolean, legs: Array, cabinClass: string}>}
   */
  async setupMultiCityFlightWithCabinClassWithoutSearch(page, legs, cabinClass) {
    if (!page) throw new Error('[FlightSearch.setupMultiCityFlightWithCabinClassWithoutSearch] "page" is required.');
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }
    if (!cabinClass || typeof cabinClass !== 'string') {
      throw new Error('cabinClass must be a non-empty string, got: ' + cabinClass);
    }

    logger.info('Setting up multi-city flight with cabin class (no search click)', { legs, cabinClass });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await flightSearchPage.clickFlightTab();
    await searchPage.selectMultiCityTrip();
    await searchPage.waitForMultiCitySection();

    const currentRows = await page.locator('.multi-city-line').count();
    for (let i = currentRows; i < legs.length; i++) {
      await searchPage.clickAddFlightRowButton();
    }

    for (let i = 0; i < legs.length; i++) {
      const { from, to } = legs[i];
      await searchPage.fillMultiCityLeg(from, to, i);
      await searchPage.openMultiCityDatePickerAtIndex(i);
      await searchPage.clickCalendarNextArrow();
      await selectDatesByNthAvailable(page, {
        startIndex: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX + i * 3,
        endIndex: null,
      });
      // Dismiss any open date-picker panel before clicking the cabin-class dropdown.
      // El Plus normally closes on date commit, but the portal may linger during fast
      // sequential leg fills — pressing Escape is the idiomatic close signal.
      await page.keyboard.press('Escape');
      await searchPage.selectFlightClassForLeg(cabinClass, i);
    }

    return { setup: true, legs, cabinClass };
  },

  /**
   * Asserts that a specific search-type radio button is currently selected.
   * Polls for up to 10 seconds to handle Vue's async reactivity when the search
   * type switches automatically (e.g. after setting cabin class in multi-city).
   *
   * @param {import('playwright').Page} page
   * @param {string} searchType - Visible radio label: "Complete trip" or "By schedule"
   * @returns {Promise<{searchType: string, selected: boolean}>}
   */
  async verifySearchTypeSelected(page, searchType) {
    if (!page) throw new Error('[FlightSearch.verifySearchTypeSelected] "page" is required.');
    if (!searchType || typeof searchType !== 'string') {
      throw new Error('[FlightSearch.verifySearchTypeSelected] "searchType" must be a non-empty string, got: ' + typeof searchType);
    }

    logger.info('Verifying search type is selected', { searchType });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const { expect } = require('@playwright/test');

    await expect
      .poll(
        async () => flightSearchPage.isSearchTypeSelected(searchType),
        {
          message: `Search type "${searchType}" should be selected. The search form auto-switches type based on cabin class and leg count.`,
          timeout: 10000,
        },
      )
      .toBe(true);

    return { searchType, selected: true };
  },

  /**
   * Resolves a human-readable time frame name (e.g. "afternoon") to its dropdown label
   * and hour bounds. Single source of truth shared by step definitions and DSL.
   *
   * @param {string} name - Case-insensitive name: "afternoon", "morning", "early", "evening", "night"
   * @returns {{ name: string, label: string, minHour: number, maxHour: number }}
   */
  resolveTimeFrame(name) {
    if (!name || typeof name !== 'string') {
      throw new Error(`[FlightSearch.resolveTimeFrame] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const TIME_FRAME_MAP = {
      afternoon: { label: 'Afternoon (11:00-17:00)', minHour: 11, maxHour: 17 },
      morning:   { label: 'Morning (08:00-12:00)',   minHour: 8,  maxHour: 12 },
      early:     { label: 'Early (04:00-08:00)',      minHour: 4,  maxHour: 8  },
      evening:   { label: 'Evening (17:00-21:00)',    minHour: 17, maxHour: 21 },
      night:     { label: 'Night (21:00-23:59)',      minHour: 21, maxHour: 24 },
    };
    const key = name.toLowerCase();
    const resolved = TIME_FRAME_MAP[key];
    if (!resolved) {
      throw new Error(
        `[FlightSearch.resolveTimeFrame] Unknown time frame "${name}". Supported: ${Object.keys(TIME_FRAME_MAP).join(', ')}`
      );
    }
    return { name: key, ...resolved };
  },

  /**
   * Opens advanced search and selects the given time frame for both the outbound
   * and inbound (return) legs. Intended for round-trip searches where the advanced
   * panel exposes separate departure/return flight-time dropdowns.
   *
   * @param {import('playwright').Page} page
   * @param {string} timeFrame - Exact dropdown label, e.g. "Afternoon (11:00-17:00)"
   * @returns {Promise<{selected: boolean, timeFrame: string}>}
   */
  async selectTimeFrameForBothLegs(page, timeFrame) {
    if (!page) throw new Error('[FlightSearch.selectTimeFrameForBothLegs] "page" is required.');
    if (!timeFrame || typeof timeFrame !== 'string') {
      throw new Error(`[FlightSearch.selectTimeFrameForBothLegs] "timeFrame" must be a non-empty string, got: ${typeof timeFrame}`);
    }

    logger.info('Selecting time frame for both legs in advanced search', { timeFrame });

    const flightSearchPage = getPageObject(page, FlightSearchPage);

    await this.openAdvancedSearch(page);
    await flightSearchPage.selectDepartureFlightTime(timeFrame);
    // Both dropdowns share the same El-select popup DOM node — wait for departure panel to
    // fully close before opening the return dropdown to avoid mid-click detach errors.
    await flightSearchPage.waitForSelectDropdownToClose();
    await flightSearchPage.selectReturnFlightTime(timeFrame);

    return { selected: true, timeFrame };
  },

  /**
   * Selects the given time frame for both legs, then submits the search. Used by
   * Anytime-restricted flows where a specific time frame must be chosen before the
   * search can proceed.
   *
   * @param {import('playwright').Page} page
   * @param {string} timeFrame - Exact dropdown label, e.g. "Afternoon (11:00-17:00)"
   * @returns {Promise<{searched: boolean, timeFrame: string}>}
   */
  async setTimeFrameForBothLegsAndSearch(page, timeFrame) {
    if (!page) throw new Error('[FlightSearch.setTimeFrameForBothLegsAndSearch] "page" is required.');
    if (!timeFrame || typeof timeFrame !== 'string') {
      throw new Error(`[FlightSearch.setTimeFrameForBothLegsAndSearch] "timeFrame" must be a non-empty string, got: ${typeof timeFrame}`);
    }

    logger.info('Setting the time frame for both legs, then submitting the search', { timeFrame });

    await this.selectTimeFrameForBothLegs(page, timeFrame);
    await this.clickSearchButton(page);

    return { searched: true, timeFrame };
  },

  /**
   * Verifies both legs' flight-time fields display the given validation message,
   * confirming the Anytime time frame is restricted (the field is required and empty).
   * Assumes a search was just submitted with empty time frames so the messages render.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedMessage - Expected validation text, e.g. "This field is required"
   * @returns {Promise<{departureMessage: string, returnMessage: string}>}
   */
  async verifyBothLegsFlightTimeRequired(page, expectedMessage) {
    if (!page) throw new Error('[FlightSearch.verifyBothLegsFlightTimeRequired] "page" is required.');
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(`[FlightSearch.verifyBothLegsFlightTimeRequired] "expectedMessage" must be a non-empty string, got: ${typeof expectedMessage}`);
    }

    logger.debug('Verifying both legs display the flight-time required validation', { expectedMessage });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const departureMessage = await flightSearchPage.getDepartureFlightTimeValidationMessage();
    const returnMessage = await flightSearchPage.getReturnFlightTimeValidationMessage();

    expect(
      departureMessage,
      `Departure-leg time-frame field should display "${expectedMessage}" (proving the Anytime frame is restricted), but got "${departureMessage}". The field may not be required, or the search was not submitted with an empty time frame.`,
    ).toBe(expectedMessage);
    expect(
      returnMessage,
      `Return-leg time-frame field should display "${expectedMessage}" (proving the Anytime frame is restricted), but got "${returnMessage}". The field may not be required, or the search was not submitted with an empty time frame.`,
    ).toBe(expectedMessage);

    return { departureMessage, returnMessage };
  },

  /**
   * Verifies the Anytime time-frame restriction is applied to both legs by confirming
   * the "Anytime" option is absent from each leg's flight-time dropdown. This is how the
   * dontAllowAnytime preference manifests once a valid frame is already selected (e.g. after
   * editing the search from the results page, where the chosen frame is restored).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{departureOffersAnytime: boolean, returnOffersAnytime: boolean}>}
   */
  async verifyAnytimeRestrictedForBothLegs(page) {
    if (!page) throw new Error('[FlightSearch.verifyAnytimeRestrictedForBothLegs] "page" is required.');

    logger.debug('Verifying the Anytime option is restricted for both legs');

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const departureOffersAnytime = await flightSearchPage.isAnytimeFlightTimeOffered('departure');
    const returnOffersAnytime = await flightSearchPage.isAnytimeFlightTimeOffered('return');

    expect(
      departureOffersAnytime,
      'Departure-leg time-frame dropdown should NOT offer the "Anytime" option for a user restricted from it, but the option was present.',
    ).toBe(false);
    expect(
      returnOffersAnytime,
      'Return-leg time-frame dropdown should NOT offer the "Anytime" option for a user restricted from it, but the option was present.',
    ).toBe(false);

    return { departureOffersAnytime, returnOffersAnytime };
  },

  /**
   * Removes the last flight leg from the multi-city search form.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{removed: boolean}>}
   */
  async removeLastFlightLeg(page) {
    if (!page) throw new Error('[FlightSearch.removeLastFlightLeg] "page" is required.');

    logger.info('Removing the last flight leg from multi-city search');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickRemoveLastFlightLeg();

    return { removed: true };
  },
};

module.exports = FlightSearch;
