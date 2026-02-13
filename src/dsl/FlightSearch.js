const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const flightRoutes = require("@data/flights.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");

const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { generateRandomFlightRoute } = require("@utils/data/generateRandomFlightRoute");
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

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

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

    await searchPage.clickSearchButton();

    return { searched: true, from, to, tripType, searchType };
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
};

module.exports = FlightSearch;
