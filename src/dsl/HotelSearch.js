const HotelSearchPage = require('../pages/HotelSearchPage');
const SearchPage = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');

const DEFAULT_NIGHTS = 1;

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
   * @param {Object} params
   * @param {string} params.where - Destination
   * @param {number} [params.nights=1] - Number of nights (>= 1)
   * @returns {Object}
   */
  async searchHotelByNights(page, { where, nights = DEFAULT_NIGHTS }) {
    if (!where) throw new Error('HotelSearch.searchHotelByNights requires "where"');
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
