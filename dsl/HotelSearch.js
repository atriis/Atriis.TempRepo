// dsl/HotelSearch.js

const HotelSearchPage = require('../pages/HotelSearchPage');
const SearchPage = require('../pages/SearchPage');

const HotelSearch = {
  async searchHotelOneNight(page, { where }) {
    console.log(`Searching for hotel in ${where} for 1 night...`);
    const hotelSearchPage = new HotelSearchPage(page);
    const searchPage = new SearchPage(page);

    // Click hotel tab and wait for it to be active
    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    
    // Type destination and handle autocomplete
    await hotelSearchPage.typeHotelDestination(where);
    await hotelSearchPage.tabOutFromHotelAutocomplete();
    
    // Handle calendar selection
    await hotelSearchPage.clickCheckInField();
    await hotelSearchPage.clickCalendarNextArrow();
    await hotelSearchPage.selectDefaultCheckInDate();
    await hotelSearchPage.selectDefaultCheckOutDate();
    
    // Execute search
    await searchPage.clickSearchButton();

    console.log('Hotel search completed successfully');
    return { searched: true };
  },
};

module.exports = HotelSearch;
