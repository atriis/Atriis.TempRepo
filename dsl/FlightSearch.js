// dsl/FlightSearch.js

const FlightSearchPage = require("../pages/FlightSearchPage");
const SearchPage = require("../pages/SearchPage");
const flightRoutes = require("../test-data/flights.json");

const FlightSearch = {
  /**
   * High-level DSL:
   * Search a one-way flight using a named route from flights.json
   *
   * Example:
   *   await FlightSearch.searchFlightsOneWay(page, "lhrToMad");
   *   await FlightSearch.searchFlightsOneWay(page); // uses defaultRoute
   */
  async searchFlightsOneWay(page, routeName = flightRoutes.defaultRoute) {
    // Look up route by name in flights.json
    const route = flightRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in flights.json`);
    }

    const { from, to } = route;

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.selectOneWayTrip();
    await flightSearchPage.fillFromDeparture(from);
    await flightSearchPage.fillToDestination(to);
    await flightSearchPage.clickDepartureDateField();
    await flightSearchPage.goToNextMonthInCalendar();
    await flightSearchPage.selectDepartureDate();
    await searchPage.clickSearchButton();

    return { searched: true, routeName, from, to };
  },
};

module.exports = FlightSearch;
