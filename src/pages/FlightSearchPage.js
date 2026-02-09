/**
 * FlightSearchPage
 *
 * Handles low-level UI interactions for flight search configuration.
 * Provides methods for search mode selection and advanced options.
 */

/** Centralized selectors for easy maintenance */
const SELECTORS = {
  FLIGHT_TAB: "#tab-flight",
  TRIP_TYPE: ".search-for-select  .el-radio",
  ADVANCED_SEARCH_BUTTON: ".advanced-search-container .btn",
  ALLOW_NEARBY_AIRPORTS_CHECKBOX: ".advanced-search-container .el-checkbox__inner",
};

class FlightSearchPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Complete Trip" radio button.
   * @returns {import('@playwright/test').Locator}
   */
  getCompleteTripRadio() {
    return this.page.locator(SELECTORS.TRIP_TYPE).nth(0);
  }

  /**
   * Gets the "By Schedule" radio button.
   * @returns {import('@playwright/test').Locator}
   */
  getByScheduleRadio() {
    return this.page.locator(SELECTORS.TRIP_TYPE).nth(1);
  }

  /**
   * Opens the Flight search tab.
   */
  async clickFlightTab() {
    await this.page.click(SELECTORS.FLIGHT_TAB);
  }

  /**
   * Selects the "Complete Trip" search mode.
   */
  async selectCompleteTrip() {
    await this.getCompleteTripRadio().click();
  }

  /**
   * Selects the "By Schedule" search mode.
   */
  async selectBySchedule() {
    await this.getByScheduleRadio().click();
  }

  /**
   * Opens the Advanced Search options panel.
   */
  async clickAdvancedSearchButton() {
    await this.page.locator(SELECTORS.ADVANCED_SEARCH_BUTTON).click();
  }

  /**
   * Toggles the "Allow nearby airports" checkbox.
   */
  async toggleAllowNearbyAirportsCheckbox() {
    await this.page.locator(SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX).click();
  }
}

module.exports = FlightSearchPage;
