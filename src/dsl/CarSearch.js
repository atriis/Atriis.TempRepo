const CarSearchPage = require("@pages/CarSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { getPageObject } = require("@utils/pageObjectCache");
const carLocations = require("@data/cars.json");

/**
 * CarSearch DSL
 *
 * Describes how users search for rental cars.
 */
const CarSearch = {
  /**
   * Selects a rental agency by name.
   * @param {Object} page - Playwright page instance
   * @param {string} agencyName - Name of the rental agency (required)
   * @throws {Error} If agencyName is not provided
   */
  async selectRentalAgencyByName(page, agencyName) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error('agencyName must be a non-empty string');
    }
    const carSearchPage = getPageObject(page, CarSearchPage);

    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);
  },

  /**
   * Searches for a car by place (airport or city).
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {Object} options - Search configuration
   * @param {number} options.pickupIndex - Pickup date index (>= 0)
   * @param {number} options.dropoffIndex - Drop-off date index (>= 0)
   * @throws {Error} If pickupIndex or dropoffIndex are negative
   */
  async searchCarByPlace(
    page,
    placeInput = carLocations.defaultLocation,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }
    
    if (dropoffIndex < 0) {
      throw new Error(`dropoffIndex must be >= 0, got ${dropoffIndex}`);
    }
    const place = resolveLocation(
      placeInput,
      ["place", "location"],
      carLocations,
    );

    const carSearchPage = getPageObject(page, CarSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    // Pickup date
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // Drop-off date
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null,
    });

    await searchPage.clickSearchButton();

    return { searched: true, place, pickupIndex, dropoffIndex };
  },

  /**
   * Searches for a car by place and rental agency.
   * @param {Object} page - Playwright page instance
   * @param {string|Object} placeInput - Location or location object
   * @param {string} agencyName - Rental agency name (required)
   * @param {Object} options - Search configuration
   * @throws {Error} If agencyName is not provided
   */
  async searchCarByPlaceAndRentalAgency(
    page,
    placeInput = carLocations.defaultLocation,
    agencyName,
    options = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!agencyName) {
      throw new Error(
        "searchCarByPlaceAndRentalAgency requires \"agencyName\"",
      );
    }

    const carSearchPage = getPageObject(page, CarSearchPage);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Reuse the main search flow
    return CarSearch.searchCarByPlace(page, placeInput, options);
  },
};

module.exports = CarSearch;
