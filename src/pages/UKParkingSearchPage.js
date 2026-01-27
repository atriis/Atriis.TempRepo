const { pressTab } = require('@utils/dom');
const { expect } = require('@playwright/test');

/**
 * Centralized selectors for UK Parking search page.
 */
const SELECTORS = {
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
 * Page Object for UK Parking Search functionality.
 * Handles all UI interactions for searching UK airport parking.
 */
class UKParkingSearchPage {
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
    return this.page.click(SELECTORS.RETURN_DATE_INPUT);
  }

  /**
   * Clicks the first start time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickFirstStartTimeField() {
    await this.page.locator(SELECTORS.TIME_PLACEHOLDERS).nth(0).click();
    await this.page.locator(SELECTORS.PARKING_FROM_DATE_INPUT).click();
  }

  /**
   * Clicks the second time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickSecondTimeField() {
    await this.page.locator(SELECTORS.TIME_PLACEHOLDERS).nth(1).click();
    await this.page.locator(SELECTORS.RETURN_DATE_INPUT).click();
  }
}

module.exports = UKParkingSearchPage;