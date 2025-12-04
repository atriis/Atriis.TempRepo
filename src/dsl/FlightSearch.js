const FlightSearchPage = require("../pages/FlightSearchPage");
const SearchPage = require("../pages/SearchPage");
const flightRoutes = require("../data/flights.json");
const { SELECTORS } = require('../pages/SearchPage');

const FlightSearch = {
  // Selects the 5th available date in the departure calendar
  // Assumes the date picker is already open from clicking the departure field
  async selectDefaultDepartureDate(page) {
    console.log(`Searching for default departure date...`);
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    await days.nth(4).waitFor({ state: 'visible' });
    await days.nth(4).click();
    console.log('Selected default departure date (fifth available)');
  },

  // Selects the 12th available date as the return date
  // Ensures one week stay duration for the flight booking
  async selectDefaultReturnDate(page) {
    console.log(`Searching for default return date...`);
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    const count = await days.count();
    if (count < 12) {
      throw new Error(`Not enough available dates. Found only ${count} available day(s) in visible calendar.`);
    }
    await days.nth(11).waitFor({ state: 'visible' });
    await days.nth(11).click();
    console.log('Selected default return date (twelfth available)');
  },
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
   *   await FlightSearch.searchFlightOneWay(page, "lhrToMad");
   *   await FlightSearch.searchFlightOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in flights.json
   */
  async searchFlightOneWay(page, routeName = flightRoutes.defaultRoute) {
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

    await flightSearchPage.clickFlightTab();
    await flightSearchPage.selectOneWayTrip();
    await flightSearchPage.fillFromDeparture(from);
    await flightSearchPage.fillToDestination(to);
    await flightSearchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await FlightSearch.selectDefaultDepartureDate(page);
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
   *   await FlightSearch.searchFlightRoundTrip(page, "lhrToMad");
   *   await FlightSearch.searchFlightRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in flights.json
   */
  async searchFlightRoundTrip(page, routeName = flightRoutes.defaultRoute) {
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
    
    await flightSearchPage.clickFlightTab();
    await flightSearchPage.selectRoundTrip();
    await flightSearchPage.fillFromDeparture(from);
    await flightSearchPage.fillToDestination(to);
    await flightSearchPage.clickDepartureDateField();
    await searchPage.clickCalendarNextArrow();
    await FlightSearch.selectDefaultDepartureDate(page);
    await FlightSearch.selectDefaultReturnDate(page);
    await searchPage.clickSearchButton();

    console.log('Round-trip flight search completed successfully');
    return { searched: true, routeName, from, to, tripType: 'roundTrip' };
  },
};

module.exports = FlightSearch;
