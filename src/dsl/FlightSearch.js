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
   * This function does a full one-way search:
   * 1) opens flight tab
   * 2) selects one-way
   * 3) fills From/To
   * 4) selects a departure date
   * 5) clicks Search
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

    // One-way: user opens the calendar by clicking the departure date field
    await searchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();

    // Select only the departure date
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

    return { searched: true, from, to, tripType: "oneWay" };
  },

  /**
   * Round-trip flight search
   *
   * NOTE: In your UI flow, selecting "Round trip" opens the calendar automatically.
   * If that UI behavior changes in the future, this is the first place to revisit.
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

    // Round-trip selection opens the calendar (based on your current UI)
    await flightSearchPage.selectRoundTrip();

    await searchPage.fillInFromField(from);
    await searchPage.fillInToField(to);

    // Calendar is already open, so we can move to the next month if needed
    await searchPage.clickCalendarNextArrow();

    // Select departure + return in one call
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: returnIndex,
    });

    await searchPage.clickSearchButton();

    return { searched: true, from, to, tripType: "roundTrip" };
  },
};

module.exports = FlightSearch;