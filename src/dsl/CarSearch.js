/**
 * CarSearch DSL Module
 *
 * Provides high-level DSL functions for car rental search functionality.
 * Supports location-based searches with configurable pickup/dropoff dates and rental agencies.
 *
 * Features:
 * - Place-based car rental searches
 * - Rental agency selection
 * - Default nth-based date selection for pickup/dropoff
 * - Combined place + agency searches
 *
 * Dependencies:
 * - CarSearchPage
 * - SearchPage
 * - calendar.helper.js
 */

const CarSearchPage = require('../pages/CarSearchPage');
const SearchPage = require('../pages/SearchPage');
const { SELECTORS } = require('../pages/SearchPage');
const { selectDatesByNthAvailable } = require('../utils/calendar.helper');

const CarSearch = {
  /**
   * Selects the default pickup date (first available date).
   * @param {Object} page - The Playwright page object
   */
  async selectDefaultPickupDate(page) {
    await selectDatesByNthAvailable(page, { startIndex: 0 });
    console.log('Selected default pickup date (first available)');
  },

  /**
   * Selects the default dropoff date (pickup + 5 days / 6th available).
   * @param {Object} page - The Playwright page object
   */
  async selectDefaultDropoffDate(page) {
    await selectDatesByNthAvailable(page, { startIndex: 5 });
    console.log('Selected default drop-off date (pickup + 5 days / 6th available)');
  },

  /**
   * Selects a rental agency by name from the dropdown.
   * @param {Object} page - The Playwright page object
   * @param {string} agencyName - The name of the rental agency to select
   */
  async selectRentalAgencyByName(page, agencyName) {
    console.log(`Selecting rental agency: ${agencyName}`);
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.typeRentalAgencyName(agencyName);
    await carSearchPage.clickRentalAgencyDropdownOption(agencyName);

    console.log(`Rental agency "${agencyName}" selected successfully`);
  },

  /**
   * Performs a car rental search by place with default date selection.
   * @param {Object} page - The Playwright page object
   * @param {Object} options - Search options
   * @param {string} options.place - The location to search for car rentals
   * @returns {Object} Search result status
   */
  async searchCarByPlace(page, { place }) {
    console.log(`Searching for car rental in: ${place}`);
    const carSearchPage = new CarSearchPage(page);
    const searchPage = new SearchPage(page);

    await carSearchPage.clickCarTab();
    await searchPage.fillInOrField(place, 1);

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

  /**
   * Performs a car rental search by place and specific rental agency.
   * @param {Object} page - The Playwright page object
   * @param {Object} options - Search options
   * @param {string} options.place - The location to search for car rentals
   * @param {string} options.agencyName - The rental agency to filter by
   * @returns {Object} Search result status
   */
  async searchCarByPlaceAndRentalAgency(page, { place, agencyName }) {
    console.log(`Searching for car rental in: ${place} with agency: ${agencyName}`);
    const carSearchPage = new CarSearchPage(page);

    await carSearchPage.clickCarTab();
    await CarSearch.selectRentalAgencyByName(page, agencyName);

    // Reuse full flow, including the single search click
    return CarSearch.searchCarByPlace(page, { place });
  },
};

module.exports = CarSearch;
