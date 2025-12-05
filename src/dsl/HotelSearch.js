/**
 * HotelSearch DSL Module
 * 
 * Provides high-level DSL functions for hotel search functionality.
 * Handles location-based hotel searches with configurable check-in and check-out dates.
 * Includes date selection strategies and comprehensive search workflows.
 * 
 * Key Features:
 * - Location-based hotel searches
 * - Default check-in and check-out date selection (one-night stay)
 * - Comprehensive logging for debugging
 * - Automatic calendar navigation
 * 
 * Dependencies:
 * - HotelSearchPage: Page object for hotel-specific interactions
 * - SearchPage: Common search functionality across booking types
 */

const HotelSearchPage = require('../pages/HotelSearchPage');
const SearchPage = require('../pages/SearchPage');
const { SELECTORS } = require('../pages/SearchPage');

const HotelSearch = {
  /**
   * Selects the first available date in the check-in calendar
   * Assumes the date picker is already open from clicking the check-in field
   * 
   * @param {Object} page - Playwright page instance
   */
  async selectDefaultCheckInDate(page) {
    console.log(`Searching for default check-in date...`);
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    await days.first().waitFor({ state: 'visible' });
    await days.first().click();
    console.log('Selected default check-in date (first available)');
  },

  /**
   * Selects the second available date as the check-out date
   * Ensures one-night stay duration for the hotel booking
   * 
   * @param {Object} page - Playwright page instance
   * @throws {Error} When not enough available dates are found
   */
  async selectDefaultCheckOutDate(page) {
    console.log(`Searching for default check-out date...`);
    const picker = page.locator(SELECTORS.DATE_PICKER_PANEL).first();
    const datePickerPanelMonthTable = picker.locator(SELECTORS.DATE_PICKER_MONTH_TABLE).first();
    const days = datePickerPanelMonthTable.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL);
    const count = await days.count();
    
    if (count < 2) {
      throw new Error(`Not enough available dates. Found only ${count} available day(s) in visible calendar.`);
    }
    
    await days.nth(1).waitFor({ state: 'visible' });
    await days.nth(1).click();
    console.log('Selected default check-out date (second available)');
  },

  /**
   * Performs a complete hotel search for a one-night stay at specified destination
   * Uses default date selection for check-in/check-out with one night duration
   * 
   * @param {Object} page - Playwright page instance
   * @param {Object} params - Search parameters
   * @param {string} params.where - Destination location for hotel search
   * @returns {Object} - Search result object with status confirmation
   */
  async searchHotelOneNight(page, { where }) {
    console.log(`Searching for hotel in ${where} for 1 night...`);
    const hotelSearchPage = new HotelSearchPage(page);
    const searchPage = new SearchPage(page);

    // Click hotel tab and wait for it to be active
    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();

    // Type destination and handle autocomplete
    await hotelSearchPage.typeHotelDestination(where);

    // Handle calendar selection
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();
    await HotelSearch.selectDefaultCheckInDate(page);
    await HotelSearch.selectDefaultCheckOutDate(page);

    // Execute search
    await searchPage.clickSearchButton();

    console.log('Hotel search completed successfully');
    return { searched: true };
  },
};

module.exports = HotelSearch;
