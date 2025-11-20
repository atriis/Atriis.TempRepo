// dsl/HotelLevelResults.js

const HotelLevelResultsPage = require('../pages/HotelLevelResultsPage');

const HotelLevelResults = {
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
