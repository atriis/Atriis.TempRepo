
/**
 * AmtrakSearch DSL Module
 * 
 * Provides high-level DSL functions for Amtrak (US Rail) search functionality.
 * Handles one-way and round-trip searches with configurable routes from amtrak.json.
 * Includes date selection, field population, and search execution workflows.
 * 
 * Key Features:
 * - Route-based search configuration using amtrak.json
 * - Default date selection strategies for departure and return
 * - Comprehensive logging for debugging
 * - Support for both one-way and round-trip journeys
 * 
 * Dependencies:
 * - AmtrakSearchPage: Page object for Amtrak-specific interactions
 * - SearchPage: Common search functionality across booking types
 * - amtrak.json: Route configuration data
 */

const AmtrakSearchPage = require("../pages/AmtrakSearchPage");
const SearchPage = require("../pages/SearchPage");
const amtrakRoutes = require("../data/amtrak.json");
const { SELECTORS } = require('../pages/SearchPage');

const AmtrakSearch = {
  
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
   * Performs a complete one-way Amtrak search using predefined route configuration
   * Handles rail tab selection, route setup, date selection, and search execution
   * Uses route data from amtrak.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from amtrak.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await AmtrakSearch.searchAmtrakOneWay(page, "nypToWas");
   *   await AmtrakSearch.searchAmtrakOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in amtrak.json
   */
  async searchAmtrakOneWay(page, routeName = amtrakRoutes.defaultRoute) {
    console.log(`Starting Amtrak one-way search for route: ${routeName}`);
    // Look up route by name in amtrak.json
    const route = amtrakRoutes.routes[routeName];

    if (!route) {
      throw new Error(`Route "${routeName}" not found in amtrak.json`);
    }

    const { from, to } = route;
    console.log(`Amtrak route: ${from} → ${to}`);
    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectOneWayTrip();
    await searchPage.fillInFromField(from); // first "or" field
    await searchPage.fillInToField(to);   // second "or" field
    await searchPage.clickCalendarNextArrow();
    await AmtrakSearch.selectDefaultDepartureDate(page);
    await searchPage.clickSearchButton();

    console.log('Amtrak search completed successfully');
    return { searched: true, routeName, from, to };
  },

  /**
   * Performs a complete round trip Amtrak search using predefined route configuration
   * Handles rail tab selection, route setup, departure and return date selection, and search execution
   * Uses route data from amtrak.json for consistent and maintainable test scenarios
   * 
   * @param {Object} page - Playwright page instance
   * @param {string} routeName - Named route from amtrak.json (defaults to defaultRoute)
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await AmtrakSearch.searchAmtrakRoundTrip(page, "nypToWas");
   *   await AmtrakSearch.searchAmtrakRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in amtrak.json
   */
  async searchAmtrakRoundTrip(page, routeName = amtrakRoutes.defaultRoute) {
    console.log(`Starting Amtrak round trip search for route: ${routeName}`);
    
    // Look up route by name in amtrak.json
    const route = amtrakRoutes.routes[routeName];
    if (!route) {
      throw new Error(`Route "${routeName}" not found in amtrak.json`);
    }

    const { from, to } = route;
    console.log(`Amtrak route: ${from} → ${to}`);
    
    // Initialize page objects
    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute round trip search workflow with proper sequencing
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectRoundTrip();
    await searchPage.fillInFromField(from); // first "or" field
    await searchPage.clickCalendarNextArrow();
    await AmtrakSearch.selectDefaultDepartureDate(page);
    await searchPage.fillInToField(to);   // second "or" field
    await AmtrakSearch.selectDefaultReturnDate(page);  // second "or" field
    await searchPage.clickSearchButton();

    console.log('Amtrak search completed successfully');
    return { searched: true, routeName, from, to };
  },
};

module.exports = AmtrakSearch;
