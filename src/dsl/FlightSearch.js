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
    console.log(`Starting one-way flight search for route: ${routeName}`);
    // Look up route by name in flights.json
    const route = flightRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in flights.json`);
    }

    const { from, to } = route;
    console.log(`Flight route: ${from} → ${to}`);

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

    console.log('Flight search completed successfully');
    return { searched: true, routeName, from, to };
  },

  /**
   * Performs a round-trip flight search using predefined route configuration
   * Handles flight tab selection, round-trip setup, route configuration, date selection, and search execution
   * Uses route data from flights.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from flights.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and airport codes
   * 
   * Examples:
   *   await FlightSearch.searchFlightsRoundTrip(page, "lhrToMad");
   *   await FlightSearch.searchFlightsRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in flights.json
   */
  async searchFlightsRoundTrip(page, routeName = flightRoutes.defaultRoute) {
    console.log(`Starting round-trip flight search for route: ${routeName}`);
    // Look up route by name in flights.json
    const route = flightRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in flights.json`);
    }

    const { from, to } = route;
    console.log(`Flight route: ${from} → ${to} (round-trip)`);

    const flightSearchPage = new FlightSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions for round-trip
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.selectRoundTrip();
    await flightSearchPage.fillFromDeparture(from);
    await flightSearchPage.fillToDestination(to);
    await flightSearchPage.clickDepartDateField();
    await flightSearchPage.goToNextMonthInCalendar();
    await flightSearchPage.selectDepartureDate();
    await flightSearchPage.clickReturnDateField();
    await flightSearchPage.selectDepartureDate();
    await searchPage.clickSearchButton();

    console.log('Round-trip flight search completed successfully');
    return { searched: true, routeName, from, to, tripType: 'roundTrip' };
  },
};

module.exports = FlightSearch;
