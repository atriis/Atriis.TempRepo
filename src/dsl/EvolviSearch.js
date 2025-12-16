const EvolviSearchPage = require("../pages/EvolviSearchPage");
const SearchPage = require("../pages/SearchPage");
const evolviRoutes = require("../data/evolvi.json");
const { SELECTORS: EVOLVI_SELECTORS } = require('../pages/EvolviSearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveRoute } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');

const EvolviSearch = {
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
   * Performs a complete one-way Evolvi search using predefined route configuration.
   * Default departure: 10th available date.
   *
   * Date strategy (nth available):
   * - Departure = nth(9)  [10th available]
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} [routeInput] - route key OR { from, to } object
   * @param {Object} [options] - Search options
   * @param {number} [options.departureIndex] - nth available departure date
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await EvolviSearch.searchEvolviOneWay(page, "ldsToDon");
   *   await EvolviSearch.searchEvolviOneWay(page, { from: "London", to: "Manchester" });
   *   await EvolviSearch.searchEvolviOneWay(page, "ldsToDon", { departureIndex: 5 });
   *   await EvolviSearch.searchEvolviOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in evolvi.json
   */
  async searchEvolviOneWay(page, routeInput = evolviRoutes.defaultRoute, { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}) {
    console.log(`Starting Evolvi one-way search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, evolviRoutes.routes, "evolvi");
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
    
    // Select departure date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: departureIndex, 
      endIndex: null 
    });
    
    await searchPage.clickSearchButton();

    console.log('Evolvi one-way search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a complete round trip Evolvi search using predefined route configuration.
   * Default dates: departure on 10th available date, return on 13th available date.
   *
   * Date strategy (nth available):
   * - Departure = nth(9)   [10th available]
   * - Return    = nth(12)  [13th available]
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} [routeInput] - route key OR { from, to } object
   * @param {Object} [options] - Search options
   * @param {number} [options.departureIndex] - nth available departure date
   * @param {number} [options.returnIndex] - nth available return date
   * @returns {Object} - Search result object with status, route name, and station codes
   * 
   * Examples:
   *   await EvolviSearch.searchEvolviRoundTrip(page, "ldsToDon");
   *   await EvolviSearch.searchEvolviRoundTrip(page, { from: "London", to: "Manchester" });
   *   await EvolviSearch.searchEvolviRoundTrip(page, "ldsToDon", { departureIndex: 5, returnIndex: 10 });
   *   await EvolviSearch.searchEvolviRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in evolvi.json
   */
  async searchEvolviRoundTrip(page, routeInput = evolviRoutes.defaultRoute, { 
    departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX, 
    returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX 
  } = {}) {
    console.log(`Starting Evolvi round trip search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}), return: nth(${returnIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, evolviRoutes.routes, "evolvi");
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
    
    // Select departure date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: departureIndex, 
      endIndex: null 
    });
    
    await searchPage.fillInOrField(to, 2);   // second "or" field
    
    // Select return date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: returnIndex, 
      endIndex: null 
    });
    
    await searchPage.clickSearchButton();

    console.log('Evolvi round trip search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex, returnIndex };
  },
};

module.exports = EvolviSearch;