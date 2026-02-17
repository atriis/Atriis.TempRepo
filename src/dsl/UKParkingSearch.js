const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingSearchPage = require("@pages/UKParkingSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");

/**
 * UKParkingSearch DSL
 *
 * Provides business-level methods for searching UK airport parking.
 * All business logic for the UK Parking search flow should be placed here.
 */
const UKParkingSearch = {
  /**
   * Performs a complete UK parking search.
   *
   * Steps:
   * 1. Navigates to the parking tab
   * 2. Fills in the airport
   * 3. Selects parking start date
   * 4. Sets default start time
   * 5. Selects return date
   * 6. Sets return time
   * 7. Executes the search
   *
   * @param {Object} page - Playwright page instance
   * @param {string} airport - UK Airport name or code (e.g., "Heathrow", "LHR")
   * @param {number} parkingFromIndex - Index of parking start date in calendar (>= 0)
   * @param {number} returnIndex - Index of return date in calendar (>= 0)
   * @throws {Error} If airport is empty or indices are negative
   */
  async searchUKParking(
    page,
    airport = "LHR",
    parkingFromIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!airport || typeof airport !== 'string') {
      throw new Error('airport must be a non-empty string');
    }
    
    if (parkingFromIndex < 0) {
      throw new Error(`parkingFromIndex must be >= 0, got ${parkingFromIndex}`);
    }
    
    if (returnIndex < 0) {
      throw new Error(`returnIndex must be >= 0, got ${returnIndex}`);
    }
    
    // Start of the search flow

    const ukParkingSearchPage = getPageObject(page, UKParkingSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // 1. Navigate to parking tab
    await ukParkingSearchPage.clickParkingTab();

    // 2. Fill in airport
    await ukParkingSearchPage.typeUKAirport(airport);

    // Wait for airport suggestions to load (UI requirement)
    await page.waitForTimeout(500);

    // 3. Select parking start date
    await ukParkingSearchPage.clickParkingFromDateField();
    // Wait for calendar to open after clicking parking from date field
    await page.waitForTimeout(500);
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: parkingFromIndex,
      endIndex: null, // Single date selection for parking start
    });

    // 4. Set default times (required by UI to enable submission)
    await ukParkingSearchPage.clickFirstStartTimeField();

    // 5. Select return date
    await ukParkingSearchPage.clickReturnDateField();
    // Wait for calendar to open after clicking return date field
    await page.waitForTimeout(500);
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null, // Single date selection for return
    });

    // 6. Set return time
    await ukParkingSearchPage.clickSecondTimeField();

    // 7. Execute search
    await searchPage.clickSearchButton();
  },
};

module.exports = UKParkingSearch;
