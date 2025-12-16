const HotelSearchPage = require('../pages/HotelSearchPage');
const SearchPage = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveLocation } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');
const hotelLocations = require('../data/hotels.json');

const HotelSearch = {
  /**
   * Performs a hotel search.
   * Default stay: 1 night.
   *
   * Date strategy (nth available):
   * - Check-in  = nth(0)
   * - Check-out = nth(nights)
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} whereInput - JSON config key OR destination string OR { where } or { destination } object
   * @param {Object} [options] - Search options
   * @param {number} [options.nights=1] - Number of nights (>= 1)
   * @returns {Object}
   * 
   * Examples:
   *   await HotelSearch.searchHotelByNights(page, hotelLocations.defaultLocation); // Use JSON config
   *   await HotelSearch.searchHotelByNights(page, "london"); // Use JSON config key
   *   await HotelSearch.searchHotelByNights(page, "London"); // Direct string
   *   await HotelSearch.searchHotelByNights(page, { where: "London" }); // Object format
   *   await HotelSearch.searchHotelByNights(page, "London", { nights: 3 });
   */
  async searchHotelByNights(page, whereInput = hotelLocations.defaultLocation, options = {}) {
    // Handle case where all parameters are in a single object (legacy format)
    let where, nights;
    if (typeof whereInput === 'object' && whereInput !== null && !Array.isArray(whereInput) && 
        (whereInput.where || whereInput.destination) && whereInput.nights !== undefined) {
      // Legacy format: { where: 'London', nights: 3 }
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    } else {
      // Standard format: (page, whereInput, { nights })
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    }
    
    if (nights < 1) throw new Error(`"nights" must be >= 1. Got ${nights}`);
    console.log(`Searching for hotel in ${where} for ${nights} night(s)...`);

    const hotelSearchPage = new HotelSearchPage(page);
    const searchPage = new SearchPage(page);

    // Open hotel tab
    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();

    // Destination
    await hotelSearchPage.typeHotelDestination(where);

    // Calendar must be opened by clicking check-in
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();

    // Select check-in + check-out in ONE call
    await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: nights });

    // Search
    await searchPage.clickSearchButton();

    console.log('Hotel search completed successfully');
    return { searched: true, where, nights };
  },
};

module.exports = HotelSearch;
