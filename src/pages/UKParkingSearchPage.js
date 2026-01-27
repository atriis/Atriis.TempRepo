
const { pressTab } = require('@utils/dom');
const { expect } = require('@playwright/test');

/**

 * Centralized selectors for UK Parking search page.
 *
 * All selectors for the UK Parking search UI are defined here.
 * Only this object should be updated if selectors change.
 */
const SELECTORS = {
  // Tab selector
  PARKING_TAB: '#tab-parking',

  // Search field
  SEARCH_FIELD_UK_PARKING: '[placeholder="Search UK Airport"]',

  // Date inputs
  PARKING_FROM_DATE_INPUT: '[placeholder="Parking from"]',
  RETURN_DATE_INPUT: '[placeholder="Return Date"]',

  // Time inputs
  TIME_PLACEHOLDERS: '[placeholder="Time"]',
};


/**
 * UKParkingSearchPage
 *
 * Page Object for UK Parking Search functionality.
 * Handles all UI interactions for searching UK airport parking.
 * No business logic or assertions should be placed here.
 */
class UKParkingSearchPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the Parking tab to switch to parking search mode.
   */
  async clickParkingTab() {
    await this.page.click(SELECTORS.PARKING_TAB);
  }

  /**
   * Types UK airport name into the search field.
   * Commits the value by pressing TAB and waits for focus to leave the field.
   *
   * @param {string} airport - Airport name or code to search for
   */
  async typeUKAirport(airport) {
    await this.page.fill(SELECTORS.SEARCH_FIELD_UK_PARKING, airport);

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Ensure search field lost focus (input was applied)
    await expect(this.page.locator(SELECTORS.SEARCH_FIELD_UK_PARKING)).not.toBeFocused();
  }

  /**
   * Clicks the parking start date field to open the calendar picker.
   */
  async clickParkingFromDateField() {
    await this.page.click(SELECTORS.PARKING_FROM_DATE_INPUT);
  }

  /**
   * Clicks the return date field to open the calendar picker.
   */
  async clickReturnDateField() {
    await this.page.click(SELECTORS.RETURN_DATE_INPUT);
  }

  /**
   * Clicks the first start time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickFirstStartTimeField() {
    await this.page.locator(SELECTORS.TIME_PLACEHOLDERS).nth(0).dblclick();
  }

  /**
   * Clicks the second time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickSecondTimeField() {
    await this.page.locator(SELECTORS.TIME_PLACEHOLDERS).nth(1).dblclick();
  }
}

module.exports = UKParkingSearchPage;