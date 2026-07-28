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
   * 4. Selects return date
   * 5. Ensures both required times hold a value
   * 6. Executes the search and confirms it was accepted
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

    // 2. Fill in airport, once the form has finished rendering/animating in
    await ukParkingSearchPage.waitForSearchFormReady();
    await ukParkingSearchPage.typeUKAirport(airport);

    // 3. Select parking start date
    await ukParkingSearchPage.clickParkingFromDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: parkingFromIndex,
      endIndex: null, // Single date selection for parking start
    });

    // 4. Select return date. Arrival and return are two independent single-date pickers, so the
    // arrival popper must be fully gone before the return one opens — selectDatesByNthAvailable
    // picks from the first VISIBLE panel, and a still-closing arrival panel would swallow the
    // clicks, leaving the return date at its prefilled value (which the app then rejects as an
    // "Invalid date" because it precedes the newly chosen arrival).
    await ukParkingSearchPage.waitForNoOpenDatePicker();

    await ukParkingSearchPage.clickReturnDateField();
    await selectDatesByNthAvailable(page, {
      startIndex: returnIndex,
      endIndex: null, // Single date selection for return
    });

    // 5. Both times are required. From the cart they arrive prefilled from the trip's search
    // suggestion; on a new trip they start empty and must be primed. Priming only when empty
    // keeps the timepicker popper closed in the prefilled case, where an open popper would cover
    // the Search button and swallow the submit click.
    await ukParkingSearchPage.ensureDropOffTimeIsSet();
    await ukParkingSearchPage.ensureReturnTimeIsSet();

    // 6. Execute search
    // The primary-class-specific button avoids a strict-mode violation: when this search
    // runs from the cart's "add parking" drawer, the trip overview behind it renders its
    // own unrelated ".search-btn" alongside the drawer's — the "btn--primary" class is the
    // one distinguishing selector present in both this and the general search-page context.
    await searchPage.waitAndClickPrimarySearchButtonFromCart();

    // The click is forced (see waitAndClickPrimarySearchButtonFromCart), so a rejected submit
    // looks identical to a successful one from here. The form validates on submit and renders the
    // reason in place instead of navigating, so surface that text rather than letting it become an
    // opaque 120s "waiting for Add to trip" timeout on a results page that was never requested.
    const outcome = await ukParkingSearchPage.waitForSearchOutcome();
    if (outcome === 'rejected') {
      const messages = await ukParkingSearchPage.getValidationMessages();
      throw new Error(
        `[UKParkingSearch.searchUKParking] The parking search form rejected the Search click and ` +
        `stayed open: ${messages.join('; ')}. No results page was requested.`
      );
    }
  },
};

module.exports = UKParkingSearch;
