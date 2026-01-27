const UKParkingSearchPage = require("@pages/UKParkingSearchPage");
const { SearchPage } = require('@pages/SearchPage');
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

/**
 * DSL for UK Parking Search functionality.
 * Provides business-level methods for searching UK airport parking.
 */
const UKParkingSearch = {
  /**
   * Performs a complete UK parking search.
   * Fills in airport, parking dates, times, and executes the search.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} airport - UK Airport name or code (e.g., "Heathrow", "LHR")
   * @param {number} parkingFromIndex - Index of parking start date in calendar
   * @param {number} returnIndex - Index of return date in calendar
   */
  async searchUKParking(
    page,
    airport = "LHR",
    parkingFromIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    console.log(`Starting UK parking search for: ${airport}`);

    const ukParkingSearchPage = new UKParkingSearchPage(page);
    const searchPage = new SearchPage(page);

    // Navigate to parking tab
    await ukParkingSearchPage.clickParkingTab();

    // Fill in airport
    await ukParkingSearchPage.typeUKAirport(airport);

    // Select parking start date
    await ukParkingSearchPage.clickParkingFromDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: parkingFromIndex,
      endIndex: null, // Single date selection for parking start
    });

    // Select return date
    await ukParkingSearchPage.clickReturnDateField();
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null, // Single date selection for return
    });

    // Set default times (required by UI to enable submission)
    await ukParkingSearchPage.clickFirstStartTimeField();
    await ukParkingSearchPage.clickSecondTimeField();

    // Execute search
    await searchPage.clickSearchButton();
  },
};

module.exports = UKParkingSearch;
