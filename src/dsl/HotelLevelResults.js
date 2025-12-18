const HotelLevelResultsPage = require('../pages/HotelLevelResultsPage');

/**
 * HotelLevelResults DSL
 *
 * Business actions at the hotel list level.
 */
const HotelLevelResults = {
  /**
   * Selects the first hotel and navigates to room-level results.
   */
  async clickFirstHotelOption(page) {
    const hotelResultsPage = new HotelLevelResultsPage(page);

    await hotelResultsPage.waitForViewRatesText();
    await hotelResultsPage.clickViewRatesButtonFirstHotel();

    return { selected: true };
  },
};

module.exports = HotelLevelResults;