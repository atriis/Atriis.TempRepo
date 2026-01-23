const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require('@pages/SearchPage');
const flightRoutes = require("@data/flights.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

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
    }
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    console.log(`Starting ${tripType} flight search (${searchType}): ${from} → ${to}`);

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

    await flightSearchPage.clickFlightTab();

    // Select trip type (oneWay or roundTrip)
    if (tripType === 'oneWay') {
      await searchPage.selectOneWayTrip();
    } else {
      await searchPage.selectRoundTrip();
    }

    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Handle calendar interaction based on trip type
    if (tripType === 'oneWay') {
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
    if (searchType === 'bySchedule') {
      await flightSearchPage.selectBySchedule();
    } else {
      await flightSearchPage.selectCompleteTrip();
    }

    await searchPage.clickSearchButton();

    return { searched: true, from, to, tripType, searchType };
  },

  /**
   * One-way flight search: completeTrip + oneWay + routes
   */
  async searchFlightOneWay(
    page,
    routeInput = flightRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {}
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: 'completeTrip',
      tripType: 'oneWay',
      departureIndex
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
    } = {}
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: 'completeTrip',
      tripType: 'roundTrip',
      departureIndex,
      returnIndex
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
    } = {}
  ) {
    return await this.searchFlight(page, routeInput, {
      searchType: 'bySchedule',
      tripType: 'roundTrip',
      departureIndex,
      returnIndex
    });
  },
};

module.exports = FlightSearch;