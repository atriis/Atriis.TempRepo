const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');
const { resolveLocation } = require('../utils/route.helper');
const { SEARCH_DEFAULTS } = require('../utils/search.constants');
const carLocations = require('../data/cars.json');

/**
 * CarSearch DSL
 *
 * Describes how users search for rental cars.
 */
const CarSearch = {
  /**
   * Selects a rental agency by name.
   */
  async selectRentalAgencyByName(page, agencyName) {
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);
  },

  /**
   * Searches for a car by place (airport or city).
   */
  async searchCarByPlace(
    page,
    placeInput = carLocations.defaultLocation,
    {
      pickupIndex = SEARCH_DEFAULTS.CAR.PICKUP_INDEX,
      dropoffIndex = SEARCH_DEFAULTS.CAR.DROPOFF_INDEX
    } = {}
  ) {
    const place = resolveLocation(
      placeInput,
      ['place', 'location'],
      carLocations
    );

    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

    // Pickup date
    await carSearchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null
    });

    // Drop-off date
    await carSearchPage.clickDropoffDateField();
    await carSearchPage.clickDropoffSecondCalendarNextMonthArrow();

    await selectDatesByNthAvailable(page, {
      startIndex: dropoffIndex,
      endIndex: null
    });

    await searchPage.clickSearchButton();

    return { searched: true, place, pickupIndex, dropoffIndex };
  },

  /**
   * Searches for a car by place and rental agency.
   */
  async searchCarByPlaceAndRentalAgency(
    page,
    placeInput = carLocations.defaultLocation,
    agencyName,
    options = {}
  ) {
    if (!agencyName) {
      throw new Error(
        'searchCarByPlaceAndRentalAgency requires "agencyName"'
      );
    }

    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Reuse the main search flow
    return CarSearch.searchCarByPlace(page, placeInput, options);
  },
};

module.exports = CarSearch;