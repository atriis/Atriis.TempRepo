const BenerailSearchPage = require("../pages/BenerailSearchPage");
const SearchPage = require("../pages/SearchPage");
const benerailRoutes = require("../data/benerail.json");
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveRoute } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');

const BenerailSearch = {



  /**
   * Performs a complete one-way Benerail search using predefined route configuration.
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
   *   await BenerailSearch.searchBenerailOneWay(page, "bebmiToNlasc");
   *   await BenerailSearch.searchBenerailOneWay(page, { from: "Brussels", to: "Amsterdam" });
   *   await BenerailSearch.searchBenerailOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in benerail.json
   */
  async searchBenerailOneWay(page, routeInput = benerailRoutes.defaultRoute, { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}) {
    console.log(`Starting Benerail one-way search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, "benerail");
    console.log(`Benerail route: ${from} → ${to}`);

    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await benerailPage.selectBenerailSearch();
    await benerailPage.selectOneWayTrip();
    await searchPage.fillInOrField(from, 1); // first "or" field
    await searchPage.fillInOrField(to, 2);   // second "or" field
    await searchPage.clickCalendarNextArrow();
    
    // Select departure date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: departureIndex, 
      endIndex: null 
    });
    
    await searchPage.clickSearchButton();

    console.log('Benerail search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a complete round trip Benerail search using predefined route configuration.
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
   *   await BenerailSearch.searchBenerailRoundTrip(page, "bebmiToNlasc");
   *   await BenerailSearch.searchBenerailRoundTrip(page, { from: "Brussels", to: "Amsterdam" });
   *   await BenerailSearch.searchBenerailRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in benerail.json
   */
  async searchBenerailRoundTrip(page, routeInput = benerailRoutes.defaultRoute, { 
    departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX, 
    returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX 
  } = {}) {
    console.log(`Starting Benerail round trip search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}), return: nth(${returnIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, benerailRoutes.routes, "benerail");
    console.log(`Benerail route: ${from} → ${to}`);
    
    // Initialize page objects
    const benerailPage = new BenerailSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute round trip search workflow with proper sequencing
    await benerailPage.selectBenerailSearch();
    await benerailPage.selectRoundTrip();
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

    console.log('Benerail search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex, returnIndex };
  },
};

module.exports = BenerailSearch;
