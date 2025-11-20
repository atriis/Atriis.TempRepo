// dsl/CarSearch.js

const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');

const CarSearch = {
  async searchCarByPlace(page, { place }) {
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await carSearchPage.typeCarPickupPlace(place);
    await carSearchPage.clickFirstSuggestedPlace();

    await carSearchPage.clickPickupDateField();
    await carSearchPage.clickPickupCalendarNextMonthArrow();
    await carSearchPage.selectDefaultPickupDate();

    await carSearchPage.clickDropoffDateField();
    await carSearchPage.selectDefaultDropoffDate();

    await carSearchPage.typePickupTime('09:00');
    await carSearchPage.confirmPickupTimeWithEnter();

    await carSearchPage.typeDropoffTime('09:00');
    await carSearchPage.confirmDropoffTimeWithEnter();

    await searchPage.clickSearchButton();

    return { searched: true };
  },
};

module.exports = CarSearch;
