const FlightSearchPage = require("../pages/FlightSearchPage");
const SearchPage = require("../pages/SearchPage");
const flightRoutes = require("../data/flights.json");
const { selectDatesByNthAvailable } = require("../utils/calendar.helper");
const { resolveRoute } = require("../utils/route.helper");
const { SEARCH_DEFAULTS } = require("../utils/search.constants");

const FlightSearch = {
  /**
   * One-way flight search
   *
   * @param {Object} page
   * @param {string|Object} routeInput - route key OR { from, to }
   * @param {Object} [options]
   * @param {number} [options.departureIndex] - nth available departure date
   */
  async searchFlightOneWay(
    page,
    routeInput = flightRoutes.defaultRoute,
    { departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX } = {}
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    console.log(`Starting one-way flight search: ${from} → ${to}`);

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

    await flightSearchPage.clickFlightTab();
    await flightSearchPage.selectOneWayTrip();

    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // One-way flow: departure field opens calendar
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();

    // Select only departure date
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

    console.log("One-way flight search completed");
    return { searched: true, from, to, tripType: "oneWay" };
  },

  /**
   * Round-trip flight search
   *
   * IMPORTANT:
   * selectRoundTrip() already opens the calendar
   *
   * @param {Object} page
   * @param {string|Object} routeInput - route key OR { from, to }
   * @param {Object} [options]
   * @param {number} [options.departureIndex] - nth available departure date
   * @param {number} [options.returnIndex] - nth available return date
   */
  async searchFlightRoundTrip(
    page,
    routeInput = flightRoutes.defaultRoute,
    {
      departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
      returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
    } = {}
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    console.log(`Starting round-trip flight search: ${from} → ${to}`);

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

    await flightSearchPage.clickFlightTab();

    // Opens calendar
    await flightSearchPage.selectRoundTrip();

    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar already open
    await searchPage.clickCalendarNextArrow();

    // Select departure + return in one call
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    await searchPage.clickSearchButton();

    console.log("Round-trip flight search completed");
    return { searched: true, from, to, tripType: "roundTrip" };
  },
};

module.exports = FlightSearch;
