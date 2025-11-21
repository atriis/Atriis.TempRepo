const FlightSearchPage = require("../pages/FlightSearchPage");
const SearchPage = require("../pages/SearchPage");
const flightRoutes = require("../data/flights.json");

const FlightSearch = {
  /**
   * Performs a complete one-way flight search using predefined route configuration
   * Handles flight tab selection, route setup, date selection, and search execution
   * Uses route data from flights.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from flights.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and airport codes
   * 
   * Examples:
   *   await FlightSearch.searchFlightsOneWay(page, "lhrToMad");
   *   await FlightSearch.searchFlightsOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in flights.json
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
