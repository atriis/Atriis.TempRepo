const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveLocation } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');
const carLocations = require('../data/cars.json');

const CarSearch = {

  /**
   * Selects a rental agency by name from the dropdown.
   * @param {Object} page - The Playwright page object
   * @param {string} agencyName - The name of the rental agency to select
   */
  async selectRentalAgencyByName(page, agencyName) {
    console.log(`Selecting rental agency: ${agencyName}`);
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);

    console.log(`Rental agency "${agencyName}" selected successfully`);
  },

  /**
   * Performs a car rental search by place.
   * Default rental period: pickup on 1st available date, dropoff on 6th available date (5-day rental).
   *
   * Date strategy (nth available):
   * - Pickup  = nth(0)  [1st available]
   * - Dropoff = nth(5)  [6th available, i.e., pickup + 5 days]
   *
   * @param {Object} page - The Playwright page object
   * @param {string|Object} placeInput - JSON config key OR location string OR { place } or { location } object
   * @param {Object} [options] - Search options
   * @param {number} [options.pickupIndex] - nth available pickup date
   * @param {number} [options.dropoffIndex] - nth available dropoff date
   * @returns {Object} Search result status
   * 
   * Examples:
   *   await CarSearch.searchCarByPlace(page, carLocations.defaultLocation); // Use JSON config
   *   await CarSearch.searchCarByPlace(page, "london"); // Use JSON config key
   *   await CarSearch.searchCarByPlace(page, "London"); // Direct string
   *   await CarSearch.searchCarByPlace(page, { place: "London" }); // Object format
   *   await CarSearch.searchCarByPlace(page, "London", { pickupIndex: 2, dropoffIndex: 7 });
   */
  async searchCarByPlace(page, placeInput = carLocations.defaultLocation, { 
    pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX, 
    dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX 
  } = {}) {
    const place = resolveLocation(placeInput, ['place', 'location'], carLocations);
    console.log(`Searching for car rental in: ${place} (pickup: nth(${pickupIndex}), dropoff: nth(${dropoffIndex}))`);
    
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    // Pickup date selection
    await carSearchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    
    // Select pickup date only (endIndex: null for single date selection)
    await selectDatesByNthAvailable(page, { 
      startIndex: pickupIndex, 
      endIndex: null 
    });

    // Dropoff date selection
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
    
    // Select dropoff date only
    await selectDatesByNthAvailable(page, { 
      startIndex: dropoffIndex, 
      endIndex: null 
    });

    await searchPage.clickSearchButton();

    console.log('Car search completed successfully');
    return { searched: true, placeInput, place, pickupIndex, dropoffIndex };
  },

  /**
   * Performs a car rental search by place and specific rental agency.
   * Uses the same default date logic as searchCarByPlace.
   *
   * @param {Object} page - The Playwright page object
   * @param {string|Object} placeInput - JSON config key OR location string OR { place } or { location } object
   * @param {string} agencyName - The rental agency to filter by
   * @param {Object} [options] - Search options
   * @param {number} [options.pickupIndex] - nth available pickup date
   * @param {number} [options.dropoffIndex] - nth available dropoff date
   * @returns {Object} Search result status
   * 
   * Examples:
   *   await CarSearch.searchCarByPlaceAndRentalAgency(page, carLocations.defaultLocation, "Hertz"); // Use JSON config
   *   await CarSearch.searchCarByPlaceAndRentalAgency(page, "london", "Hertz"); // Use JSON config key
   *   await CarSearch.searchCarByPlaceAndRentalAgency(page, "London", "Hertz"); // Direct string
   *   await CarSearch.searchCarByPlaceAndRentalAgency(page, { place: "London" }, "Hertz"); // Object format
   */
  async searchCarByPlaceAndRentalAgency(page, placeInput = carLocations.defaultLocation, agencyName, { 
    pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX, 
    dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX 
  } = {}) {
    if (!agencyName) throw new Error('CarSearch.searchCarByPlaceAndRentalAgency requires "agencyName"');
    
    const place = resolveLocation(placeInput, ['place', 'location'], carLocations);
    console.log(`Searching for car rental in: ${place} with agency: ${agencyName}`);
    
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Use the main search flow with date parameters
    return CarSearch.searchCarByPlace(page, placeInput, { pickupIndex, dropoffIndex });
  },
};

module.exports = CarSearch;
