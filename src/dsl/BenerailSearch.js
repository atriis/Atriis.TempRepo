
/**
 * BenerailSearch DSL Module
 * 
 * Provides high-level DSL functions for Benerail (EU Rail) search functionality.
 * Handles one-way and round-trip searches with configurable routes from benerail.json.
 * Includes date selection, field population, and search execution workflows.
 * 
 * Key Features:
 * - Route-based search configuration using benerail.json
 * - Default date selection strategies for departure and return
 * - Comprehensive logging for debugging
 * - Support for both one-way and round-trip journeys
 * 
 * Dependencies:
 * - BenerailSearchPage: Page object for Benerail-specific interactions
 * - SearchPage: Common search functionality across booking types
 * - benerail.json: Route configuration data
 */

const BenerailSearchPage = require("../pages/BenerailSearchPage");
const SearchPage = require("../pages/SearchPage");
const benerailRoutes = require("../data/benerail.json");
const { SELECTORS } = require('../pages/SearchPage');

const BenerailSearch = {

  /**
   * Selects the 10th available date in the departure calendar
   * Assumes the date picker is already open from clicking the departure field
   * 
   * @param {Object} page - Playwright page instance
   */
  async selectDefaultDepartureDate(page) {
    console.log('Searching for default departure date...');
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
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
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    await days.nth(12).waitFor({ state: 'visible' });
    await days.nth(12).click();
    console.log('Selected default return date (thirteenth available)');
  },

  /**
   * Performs a complete one-way Benerail search using predefined route configuration
   * Handles rail tab selection, route setup, date selection, and search execution
   * Uses route data from benerail.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from benerail.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await BenerailSearch.searchBenerailOneWay(page, "bebmiToNlasc");
   *   await BenerailSearch.searchBenerailOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in benerail.json
   */
  async searchBenerailOneWay(page, routeName = benerailRoutes.defaultRoute) {
    console.log(`Starting Benerail one-way search for route: ${routeName}`);
    // Look up route by name in benerail.json
    const route = benerailRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in benerail.json`);
    }

    const { from, to } = route;
    console.log(`Benerail route: ${from} → ${to}`);

    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await benerailPage.clickRailTab();
    await benerailPage.selectOneWayTrip();
    await searchPage.fillInOrField(from, 1); // first "or" field
    await searchPage.fillInOrField(to, 2);   // second "or" field
    await benerailPage.clickDepartureField();
    await searchPage.clickCalendarNextArrow();
    await BenerailSearch.selectDefaultDepartureDate(page);
    await searchPage.clickSearchButton();

    console.log('Benerail search completed successfully');
    return { searched: true, routeName, from, to };
  },

  /**
   * Performs a complete round trip Benerail search using predefined route configuration
   * Handles rail tab selection, route setup, departure and return date selection, and search execution
   * Uses route data from benerail.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from benerail.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await BenerailSearch.searchBenerailRoundTrip(page, "bebmiToNlasc");
   *   await BenerailSearch.searchBenerailRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in benerail.json
   */
  async searchBenerailRoundTrip(page, routeName = benerailRoutes.defaultRoute) {
    console.log(`Starting Benerail round trip search for route: ${routeName}`);
    
    // Look up route by name in benerail.json
    const route = benerailRoutes.routes[routeName];
    if (!route) {
      throw new Error(`Route "${routeName}" not found in benerail.json`);
    }

    const { from, to } = route;
    console.log(`Benerail route: ${from} → ${to}`);
    
    // Initialize page objects
    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute round trip search workflow with proper sequencing
    await benerailPage.clickRailTab();
    await benerailPage.selectRoundTrip();
    await searchPage.fillInOrField(from, 1); // first "or" field
    await searchPage.fillInOrField(to, 2);   // second "or" field
    await benerailPage.clickDepartureField();
    await searchPage.clickCalendarNextArrow();
    await BenerailSearch.selectDefaultDepartureDate(page);
    await benerailPage.clickReturnField();
    await BenerailSearch.selectDefaultReturnDate(page);
    await searchPage.clickSearchButton();

    console.log('Benerail search completed successfully');
    return { searched: true, routeName, from, to };
  },
};

module.exports = BenerailSearch;
