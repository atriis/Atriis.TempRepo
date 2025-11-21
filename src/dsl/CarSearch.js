const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');

const CarSearch = {
  // Performs a complete car rental search by location with default date range
  async searchCarByPlace(page, { place }) {
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await carSearchPage.typeCarPickupPlace(place);
    await carSearchPage.tabOutFromCarAutocomplete();

    await carSearchPage.clickPickupDateField();
    await carSearchPage.clickPickupFirstCalendarNextMonthArrow();
    await carSearchPage.selectDefaultPickupDate();

    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
    await carSearchPage.selectDefaultDropoffDate();

    await searchPage.clickSearchButton();

    return { searched: true };
  },
};

module.exports = CarSearch;
