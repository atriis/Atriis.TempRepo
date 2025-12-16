const AmtrakSearchPage = require("../pages/AmtrakSearchPage");
const SearchPage = require("../pages/SearchPage");
const amtrakRoutes = require("../data/amtrak.json");
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveRoute } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');

const AmtrakSearch = {
  


  /**
   * Performs a complete one-way Amtrak search using predefined route configuration.
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
   *   await AmtrakSearch.searchAmtrakOneWay(page, "nypToWas");
   *   await AmtrakSearch.searchAmtrakOneWay(page, { from: "New York", to: "Washington" });
   *   await AmtrakSearch.searchAmtrakOneWay(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in amtrak.json
   */
  async searchAmtrakOneWay(page, routeInput = amtrakRoutes.defaultRoute, { departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX } = {}) {
    console.log(`Starting Amtrak one-way search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, amtrakRoutes.routes, "amtrak");
    console.log(`Amtrak route: ${from} → ${to}`);
    
    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Simple, readable sequence of actions
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectOneWayTrip();
    await searchPage.fillInFromField(from); // first "or" field
    await searchPage.fillInToField(to);   // second "or" field
    await searchPage.clickCalendarNextArrow();
    
    // Select departure date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: departureIndex, 
      endIndex: null 
    });
    
    await searchPage.clickSearchButton();

    console.log('Amtrak search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex };
  },

  /**
   * Performs a complete round trip Amtrak search using predefined route configuration.
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
   *   await AmtrakSearch.searchAmtrakRoundTrip(page, "nypToWas");
   *   await AmtrakSearch.searchAmtrakRoundTrip(page, { from: "New York", to: "Washington" });
   *   await AmtrakSearch.searchAmtrakRoundTrip(page); // uses defaultRoute
   * 
   * @throws {Error} - When specified route name is not found in amtrak.json
   */
  async searchAmtrakRoundTrip(page, routeInput = amtrakRoutes.defaultRoute, { 
    departureIndex = SEARCH_DEFAULTS.RAIL.DEPARTURE_INDEX, 
    returnIndex = SEARCH_DEFAULTS.RAIL.RETURN_INDEX 
  } = {}) {
    console.log(`Starting Amtrak round trip search for route: ${JSON.stringify(routeInput)} (departure: nth(${departureIndex}), return: nth(${returnIndex}))`);
    
    // Resolve route using shared resolveRoute function
    const { from, to } = resolveRoute(routeInput, amtrakRoutes.routes, "amtrak");
    console.log(`Amtrak route: ${from} → ${to}`);
    
    // Initialize page objects
    const amtrakPage = new AmtrakSearchPage(page);
    const searchPage = new SearchPage(page);

    // Execute round trip search workflow with proper sequencing
    await amtrakPage.selectAmtrakSearch();
    await amtrakPage.selectRoundTrip();
    await searchPage.fillInFromField(from); // first "or" field
    await searchPage.clickCalendarNextArrow();
    
    // Select departure date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: departureIndex, 
      endIndex: null 
    });
    
    await searchPage.fillInToField(to);   // second "or" field
    
    // Select return date using nth-available strategy
    await selectDatesByNthAvailable(page, { 
      startIndex: returnIndex, 
      endIndex: null 
    });
    
    await searchPage.clickSearchButton();

    console.log('Amtrak search completed successfully');
    return { searched: true, routeInput, from, to, departureIndex, returnIndex };
  },
};

module.exports = AmtrakSearch;
