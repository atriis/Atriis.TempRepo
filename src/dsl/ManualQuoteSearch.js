const { getPageObject } = require("@utils/pageObjectCache");
const ManualQuoteSearchPage = require("@pages/ManualQuoteSearchPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const flightRoutes = require("@data/flights.json");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("ManualQuoteSearch-DSL");

/**
 * DSL for Manual Quote Search functionality.
 * Provides business-level methods for creating manual flight quotes.
 */
const ManualQuoteSearch = {
  /**
   * Performs a complete manual quote search for a flight.
   * Fills in route, dates, carrier details, and adds the quote to the trip.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} routeInput - Route identifier (e.g., "LHR-JFK")
   * @param {number} departureIndex - Index of departure date in calendar
   * @param {number} returnIndex - Index of return date in calendar
   */
  async searchAndAddFlightManualQuote(
    page,
    routeInput = flightRoutes.defaultRoute,
    departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    logger.info("Starting manual quote flight search", { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // Navigate to the manual quote flight tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.waitForEnterAirportLocationPlaceholderVisible();
    await flightSearchPage.clickFlightTab();

    // Fill in route details
    await manualQuoteSearchPage.fillInDepartingFromField(from);
    await manualQuoteSearchPage.fillInArrivingToField(to);
    await manualQuoteSearchPage.typeFlightNumber("765");

    // Select departure date
    await manualQuoteSearchPage.clickDepartingDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null, // Single date selection for departure
    });

    // TODO: Add return date selection once a stable locator is available
    // Current RETURNING_DATE_INPUT selector matches multiple elements

    // Fill in carrier details
    await manualQuoteSearchPage.typeCarrierLocator("TP");
    await manualQuoteSearchPage.typeCarrierName("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickCarrierDropdownOption("TAP Air Portugal (TP)");

    // Set default times (required by UI to enable submission)
    await manualQuoteSearchPage.clickStartTime();
    await manualQuoteSearchPage.clickEndTime();

    // Enter pricing and add quote to cart
    await manualQuoteSearchPage.typeBaseFare("10");
    await manualQuoteSearchPage.clickAddQuoteButton();
  },
};

module.exports = ManualQuoteSearch;
