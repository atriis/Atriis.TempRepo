const HotelLevelResultsPage = require('../pages/HotelLevelResultsPage');

const HotelLevelResults = {
  // Selects the first hotel from the search results and navigates to room-level details
  // Handles the transition from property-level results to detailed room rate information
  async clickFirstHotelOption(page) {
    console.log('Selecting first hotel option...');
    const hotelResultsPage = new HotelLevelResultsPage(page);

    await hotelResultsPage.waitForViewRatesText();
    await hotelResultsPage.clickViewRatesButtonFirstHotel();

    console.log('First hotel option selected successfully');
    return { selected: true };
  },
};

module.exports = HotelLevelResults;
