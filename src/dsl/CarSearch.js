const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');
const { SELECTORS } = require('../pages/SearchPage');

const CarSearch = {

  // Selects the first available date in the pickup calendar
  // Assumes the date picker is already open and visible
  async selectDefaultPickupDate(page) {
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const monthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = monthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    await days.first().waitFor({ state: 'visible' });
    await days.first().click();
    console.log('Selected default pickup date (first available)');
  },

  // Selects a dropoff date that is 5 days after the pickup date
  // Uses the 6th available day (index 5) to ensure proper rental duration
  async selectDefaultDropoffDate(page) {
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const monthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = monthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    const targetIndex = 5;
    const count = await days.count();
    if (count <= targetIndex) {
      throw new Error(
        `Not enough available dates. Found only ${count} available day(s); need at least ${targetIndex + 1}.`
      );
    }
    await days.nth(targetIndex).waitFor({ state: 'visible' });
    await days.nth(targetIndex).click();
    console.log('Selected default drop-off date (pickup + 5 days / 6th available)');
  },

  // Selects Rental Agency by name from dropdown options
  async selectRentalAgencyByName(page, agencyName) {
    console.log(`Selecting rental agency: ${agencyName}`);
    const carSearchPage = new CarSearchPage(page);
    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);
    console.log(`Rental agency "${agencyName}" selected successfully`);
  },

  // Performs a complete car rental search by location with default date range
  async searchCarByPlace(page, { place }) {
    console.log(`Searching for car rental in: ${place}`);
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await carSearchPage.typeCarPickupPlace(place);
    await carSearchPage.tabOutFromCarAutocomplete();

    await carSearchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    await CarSearch.selectDefaultPickupDate(page);

    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();
    await CarSearch.selectDefaultDropoffDate(page);
    await searchPage.clickSearchButton();

    console.log('Car search completed successfully');
    return { searched: true };
  },
  
  // Performs a complete car rental search by location and rental agency
  async searchCarByPlaceAndRentalAgency(page, { place, agencyName }) {
    console.log(`Searching for car rental in: ${place} with agency: ${agencyName}`);
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);
    await CarSearch.searchCarByPlace(page, { place });
    await searchPage.clickSearchButton();

    console.log(`Car search with rental agency completed successfully`);
  },
};

module.exports = CarSearch;
