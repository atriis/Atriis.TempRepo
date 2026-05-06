const FlightSearchPage = require("@pages/FlightSearchPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { SearchPage } = require("@pages/SearchPage");
const flightRoutes = require("@data/flights.json");
const {
  selectDatesByInputValues,
  selectDatesByNthAvailable,
  selectNthWeekdayFromNextMonth,
  selectTodayFromVisibleCalendar,
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
    } else {
      // Round-trip: calendar may open automatically with round-trip selection
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
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!routeInput) throw new Error('routeInput is required');
    if (!cabinClass || typeof cabinClass !== 'string') {
      throw new Error('cabinClass must be a non-empty string, got: ' + cabinClass);
    }

    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, 'flight');
    logger.info('Starting roundTrip flight search with cabin class', { from, to, cabinClass });

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
    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', cabinClass };
  },

  /**
   * Multi-city flight search: completePTrip + multiCity + multiple legs
   *
   * @param {Object} page - Playwright page object
   * @param {Array<{from: string, to: string}>} legs - Array of at least 2 leg objects
   * @param {Object} options
   * @param {number} options.departureIndex - Starting available-day index for first leg (default: SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX)
   */
  async searchFlightMultiCity(
    page,
    legs,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {},
  ) {
    if (!Array.isArray(legs) || legs.length < 2) {
      throw new Error('legs must be an array of at least 2 {from, to} objects, got: ' + JSON.stringify(legs));
    }

    logger.info('Starting multi-city flight search', { legs });

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

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, legs, tripType: 'multiCity' };
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

    // Select departure date
    await searchPage.clickDepartureDateField();
    // Wait for calendar panel open animation to settle
    await page.waitForTimeout(500);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    // Wait for departure calendar close animation before opening return calendar
    await page.waitForTimeout(500);

    // Select return date (use advanced-specific return date field)
    await flightSearchPage.clickAdvancedReturnDateField();
    // Wait for return calendar panel open animation to settle
    await page.waitForTimeout(500);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null,
    });

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
   * Searches for a by-schedule round-trip flight with advanced-search preferred-carrier and stops filters.
   *
   * @param {Object} page - Playwright page object
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {string} carrier - Preferred carrier label, e.g. "Scandinavian"
   * @param {string} stopsOption - Stops option label, e.g. "No stops"
   * @param {Object} options - Date-selection options
   */
  async searchFlightByScheduleWithPreferredCarrierAndStops(
    page,
    from,
    to,
    carrier,
    stopsOption,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {},
  ) {
    if (!page) throw new Error('page is required');
    if (!from || typeof from !== 'string') throw new Error('from must be a non-empty string, got: ' + from);
    if (!to || typeof to !== 'string') throw new Error('to must be a non-empty string, got: ' + to);
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string, got: ' + carrier);
    }
    if (!stopsOption || typeof stopsOption !== 'string') {
      throw new Error('stopsOption must be a non-empty string, got: ' + stopsOption);
    }

    logger.info('Searching for by-schedule flight with preferred carrier and stops filter', {
      from,
      to,
      carrier,
      stopsOption,
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
    await flightSearchPage.selectStopsOption(stopsOption);
    await searchPage.waitAndClickSearchButton();

    return {
      searched: true,
      from,
      to,
      tripType: 'roundTrip',
      searchType: 'bySchedule',
      carrier,
      stopsOption,
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

    // Enable parallel car search
    await flightSearchPage.checkParallelCarSearch();

    await flightSearchPage.selectCompleteTrip();
    await searchPage.waitAndClickSearchButton();

    return { searched: true, from, to, tripType: 'roundTrip', searchType: 'completeTrip', parallelCar: true };
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
};

module.exports = FlightSearch;
