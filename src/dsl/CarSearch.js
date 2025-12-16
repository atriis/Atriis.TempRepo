const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');

// Default nth-based date strategy
const DEFAULT_PICKUP_INDEX = 0;  // 1st available date
const DEFAULT_DROPOFF_INDEX = 5; // 6th available date (pickup + 5 days)

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
   * @param {Object} params
   * @param {string} params.place - The location to search for car rentals
   * @param {number} [params.pickupIndex] - nth available pickup date
   * @param {number} [params.dropoffIndex] - nth available dropoff date
   * @returns {Object} Search result status
   */
  async searchCarByPlace(page, { 
    place, 
    pickupIndex = DEFAULT_PICKUP_INDEX, 
    dropoffIndex = DEFAULT_DROPOFF_INDEX 
  }) {
    if (!place) throw new Error('CarSearch.searchCarByPlace requires "place"');
    
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
    return { searched: true, place, pickupIndex, dropoffIndex };
  },

  /**
   * Performs a car rental search by place and specific rental agency.
   * Uses the same default date logic as searchCarByPlace.
   *
   * @param {Object} page - The Playwright page object
   * @param {Object} params
   * @param {string} params.place - The location to search for car rentals
   * @param {string} params.agencyName - The rental agency to filter by
   * @param {number} [params.pickupIndex] - nth available pickup date
   * @param {number} [params.dropoffIndex] - nth available dropoff date
   * @returns {Object} Search result status
   */
  async searchCarByPlaceAndRentalAgency(page, { 
    place, 
    agencyName, 
    pickupIndex = DEFAULT_PICKUP_INDEX, 
    dropoffIndex = DEFAULT_DROPOFF_INDEX 
  }) {
    if (!place) throw new Error('CarSearch.searchCarByPlaceAndRentalAgency requires "place"');
    if (!agencyName) throw new Error('CarSearch.searchCarByPlaceAndRentalAgency requires "agencyName"');
    
    console.log(`Searching for car rental in: ${place} with agency: ${agencyName}`);
    
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Use the main search flow with date parameters
    return CarSearch.searchCarByPlace(page, { place, pickupIndex, dropoffIndex });
  },
};

module.exports = CarSearch;
