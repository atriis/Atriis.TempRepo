/**
 * EvolviSearch DSL Module
 * 
 * Provides high-level DSL functions for Evolvi train search functionality.
 * Handles one-way and round-trip searches with configurable routes from evolvi.json.
 * Includes date selection, field population, and search execution workflows.
 * 
 * Key Features:
 * - Route-based search configuration using evolvi.json
 * - Automatic split ticket checkbox management
 * - Default date selection strategies
 * - Comprehensive logging for debugging
 * 
 * Dependencies:
 * - EvolviSearchPage: Page object for Evolvi-specific interactions
 * - SearchPage: Common search functionality across booking types
 * - evolvi.json: Route configuration data
 */

// ------------------------------------------------------------------------ CONTINUE FROM HERE ------------------------------------------------------------------------

const EvolviSearchPage = require("../pages/EvolviSearchPage");
const SearchPage = require("../pages/SearchPage");
const evolviRoutes = require("../data/evolvi.json");
const { SELECTORS } = require('../pages/SearchPage');
const { SELECTORS: EVOLVI_SELECTORS } = require('../pages/EvolviSearchPage');
const { pressTab } = require("../utils/dom");

const EvolviSearch = {

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

  /**
   * Ensures the "Request Split Ticket" checkbox is unchecked
   * Verifies the current state and toggles if necessary to ensure unchecked state
   * 
   * @param {Object} page - Playwright page instance
   */
  async ensureSplitTicketIsUnchecked(page) {
    console.log('Verifying that "Request Split Ticket" checkbox is unchecked');
    const evolviPage = new EvolviSearchPage(page);

    const checkbox = page.locator(EVOLVI_SELECTORS.SPLIT_TICKET_CHECKBOX);
    const isChecked = await checkbox.isChecked();

    if (isChecked) {
      await evolviPage.toggleSplitTicketCheckbox();
      console.log('"Request Split Ticket" checkbox was checked and has been unchecked');
      return;
    }
    console.log('"Request Split Ticket" checkbox is confirmed as unchecked');
  },

  /**
   * Performs a complete one-way Evolvi search using predefined route configuration
   * Handles Evolvi search selection, route setup, date selection, and search execution
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
    
    // Initialize page objects
    const evolviPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute search workflow with proper sequencing
    await evolviPage.selectEvolviSearch();
    await evolviPage.selectOneWayTrip();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);
    await searchPage.fillInOrField(from, 1); // first "or" field
    await searchPage.fillInOrField(to, 2);   // second "or" field
    await searchPage.clickCalendarNextArrow();
    await EvolviSearch.selectDefaultDepartureDate(page);
    await searchPage.clickSearchButton();

    console.log('Evolvi one-way search completed successfully');
    return { searched: true, routeName, from, to };
  },

  /**
   * Performs a complete round trip Evolvi search using predefined route configuration
   * Handles Evolvi search selection, route setup, departure and return date selection, and search execution
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
    
    // Initialize page objects
    const evolviPage = new EvolviSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute round trip search workflow with proper sequencing
    await evolviPage.selectEvolviSearch();
    await evolviPage.selectRoundTrip();
    await EvolviSearch.ensureSplitTicketIsUnchecked(page);
    await searchPage.fillInOrField(from, 1); // first "or" field
    await searchPage.clickCalendarNextArrow();
    await EvolviSearch.selectDefaultDepartureDate(page);
    await searchPage.fillInOrField(to, 2);   // second "or" field
    await EvolviSearch.selectDefaultReturnDate(page);
    await searchPage.clickSearchButton();

    console.log('Evolvi round trip search completed successfully');
    return { searched: true, routeName, from, to };
  },
};

module.exports = EvolviSearch;