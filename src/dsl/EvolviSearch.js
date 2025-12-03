// ------------------------------------------------------------------------ CONTINUE FROM HERE ------------------------------------------------------------------------

const EvolviSearchPage = require("../pages/EvolviSearchPage");
const SearchPage = require("../pages/SearchPage");
const evolviRoutes = require("../data/evolvi.json");
const { SELECTORS } = require('../pages/SearchPage');

const EvolviSearch = {

  /**
   * Selects the 10th available date in the departure calendar
   * Assumes the date picker is already open from clicking the departure field
   * 
   * @param {Object} page - Playwright page instance
   */
  async selectDefaultDepartureDate(page) {
    console.log('Searching for default departure date...');
    const picker = page.locator(SELECTORS.datePickerPanel).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.datePickerMonthTable).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.datePickerAvailableDayCell);
    await days.nth(9).waitFor({ state: 'visible' });
    await days.nth(9).click();
    console.log('Selected default departure date (tenth available)');
  },

  /**
   * Selects the 13th available date in the return calendar
   * Assumes the date picker is already open from clicking the return field
   * 
   * @param {Object} page - Playwright page instance
   */
  async selectDefaultReturnDate(page) {
    console.log('Searching for default return date...');
    const picker = page.locator(SELECTORS.datePickerPanel).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.datePickerMonthTable).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.datePickerAvailableDayCell);
    await days.nth(12).waitFor({ state: 'visible' });
    await days.nth(12).click();
    console.log('Selected default return date (thirteenth available)');
  },

  /**
   * Performs a complete one-way Evolvi search using predefined route configuration
   * Handles rail tab selection, route setup, date selection, and search execution
   * Uses route data from evolvi.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from evolvi.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await EvolviSearch.searchEvolviOneWay(page, "ldsToDon");
   *   await EvolviSearch.searchEvolviOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in evolvi.json
   */
  async searchEvolviOneWay(page, routeName = evolviRoutes.defaultRoute) {
    console.log(`Starting Evolvi one-way search for route: ${routeName}`);
    // Look up route by name in evolvi.json
    const route = evolviRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in evolvi.json`);
    }

    const { from, to } = route;
    console.log(`Evolvi route: ${from} → ${to}`);
    const evolviPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await evolviPage.clickRailTab();
    await evolviPage.selectOneWayTrip();
    await evolviPage.fillFromStationLocation(from);
    await evolviPage.fillToStationLocation(to);
    await evolviPage.clickDepartureField();
    await searchPage.clickCalendarNextArrow();
    await EvolviSearch.selectDefaultDepartureDate(page);
    await searchPage.clickSearchButton();

    console.log('Evolvi one-way search completed successfully');
    return { searched: true, routeName, from, to };
  },

  /**
   * Performs a complete round trip Evolvi search using predefined route configuration
   * Handles rail tab selection, route setup, departure and return date selection, and search execution
   * Uses route data from evolvi.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from evolvi.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await EvolviSearch.searchEvolviRoundTrip(page, "ldsToDon");
   *   await EvolviSearch.searchEvolviRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in evolvi.json
   */
  async searchEvolviRoundTrip(page, routeName = evolviRoutes.defaultRoute) {
    console.log(`Starting Evolvi round trip search for route: ${routeName}`);
    // Look up route by name in evolvi.json
    const route = evolviRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in evolvi.json`);
    }

    const { from, to } = route;
    console.log(`Evolvi route: ${from} → ${to}`);
    const evolviPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await evolviPage.clickRailTab();
    await evolviPage.selectRoundTrip();
    await evolviPage.fillFromStationLocation(from);
    await evolviPage.fillToStationLocation(to);
    await evolviPage.clickDepartureField();
    await searchPage.clickCalendarNextArrow();
    await EvolviSearch.selectDefaultDepartureDate(page);
    await evolviPage.clickReturnField();
    await EvolviSearch.selectDefaultReturnDate(page);
    await searchPage.clickSearchButton();

    console.log('Evolvi round trip search completed successfully');
    return { searched: true, routeName, from, to };
  },
};

module.exports = EvolviSearch;