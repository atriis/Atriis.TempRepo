/**
 * Page Object for flight search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  FLIGHT_TAB: "#tab-flight",
  TRIP_TYPE: ".search-for-select  .el-radio",
  SEARCH_MODE_SECTION: '.search-for-select',
  FLIGHT_CLASS_FIELD: '.class-input .app-select',
  ADVANCED_SEARCH_BUTTON: ".advanced-search-container .btn",
  ALLOW_NEARBY_AIRPORTS_CHECKBOX: ".advanced-search-container .el-checkbox__inner",
  ADVANCED_SEARCH_OPTIONS: '.flight-more-search-inputs',
  FLIGHT_STOPS_FIELD: '.flight-more-search-inputs > :nth-child(1)',
  // Advanced search — departure leg selectors
  DEPARTURE_APP_SELECT: 'section.departure .app-select',
  // Advanced search — return leg selectors
  RETURN_APP_SELECT: 'section.return .app-select',
  DROPDOWN_OPTION: (text) => `.el-select-dropdown__item:visible:has-text("${text}")`,
  // Parallel hotel search checkbox
  PARALLEL_HOTEL_CHECKBOX: '.parallel-search-checkbox',
  // Parallel car search checkbox (uses same class, differentiated by "Add Car" text)
  CAR_SEARCH_CHECKBOX: '.parallel-search-checkbox',
  CAR_SEARCH_CHECKBOX_TEXT: 'Add Car',
  // Advanced search — return leg date picker
  ADVANCED_RETURN_DATE_FIELD: 'section.return .flight-date-picker input',
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
   * Skips gracefully if not found (e.g. when searching from within the cart modal
   * which is already a dedicated flight search form with no product tabs).
   */
  async clickFlightTab() {
    const tab = this.page.locator(SELECTORS.FLIGHT_TAB);
    const isVisible = await tab.isVisible().catch(() => false);
    if (isVisible) {
      await tab.click();
    }
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
   * Selects a cabin class from the flight class dropdown.
   *
   * @param {string} value
   */
  async selectFlightClass(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('value must be a non-empty string');
    }

    const classField = this.page.locator(SELECTORS.FLIGHT_CLASS_FIELD).first();
    await classField.waitFor({ state: 'visible', timeout: 10000 });
    await classField.click();
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
    await classField.getByText(value, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Waits for a search mode option to be visible in the search form.
   *
   * @param {string} searchMode
   */
  async waitForSearchModeOption(searchMode) {
    if (!searchMode || typeof searchMode !== 'string') {
      throw new Error('searchMode must be a non-empty string');
    }

    const option = this.page
      .locator(SELECTORS.SEARCH_MODE_SECTION)
      .getByText(searchMode, { exact: true })
      .first();

    await option.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Opens the Advanced Search options panel.
   */
  async clickAdvancedSearchButton() {
    await this.page.locator(SELECTORS.ADVANCED_SEARCH_BUTTON).click();
  }

  /**
   * Waits for advanced-search-only inputs to be visible.
   */
  async waitForAdvancedSearchOptions() {
    await this.page.locator(SELECTORS.ADVANCED_SEARCH_OPTIONS).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Checks whether the advanced search section is already expanded.
   *
   * @returns {Promise<boolean>}
   */
  async isAdvancedSearchExpanded() {
    return await this.page.locator(SELECTORS.ADVANCED_SEARCH_OPTIONS).isVisible().catch(() => false);
  }

  /**
   * Toggles the "Allow nearby airports" checkbox.
   */
  async toggleAllowNearbyAirportsCheckbox() {
    await this.page.locator(SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX).click();
  }

  /**
   * Selects a value from the departure leg date type dropdown in advanced search.
   * Date type is the first app-select in the departure section.
   * @param {string} value - "Departure" or "Arrival"
   */
  async selectDepartureDateType(value) {
    await this.page.locator(SELECTORS.DEPARTURE_APP_SELECT).nth(0).click();
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
  }

  /**
   * Selects a value from the return leg date type dropdown in advanced search.
   * Date type is the first app-select in the return section.
   * @param {string} value - "Departure" or "Arrival"
   */
  async selectReturnDateType(value) {
    await this.page.locator(SELECTORS.RETURN_APP_SELECT).nth(0).click();
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
  }

  /**
   * Selects a value from the return leg flight time dropdown in advanced search.
   * Flight time is the second app-select in the return section.
   * @param {string} value - e.g. "Anytime", "Morning", "Afternoon"
   */
  async selectReturnFlightTime(value) {
    await this.page.locator(SELECTORS.RETURN_APP_SELECT).nth(1).click();
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
  }

  /**
   * Selects a value from the Stops dropdown in advanced search.
   *
   * @param {string} value
   */
  async selectStopsOption(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('value must be a non-empty string');
    }

    const stopsDropdown = this.page.locator(SELECTORS.FLIGHT_STOPS_FIELD).first();
    await stopsDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await stopsDropdown.click();
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();

    await stopsDropdown.getByText(value, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Checks the "Add hotel to this trip" parallel search checkbox.
   */
  async checkParallelHotelSearch() {
    const checkbox = this.page.locator(SELECTORS.PARALLEL_HOTEL_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await checkbox.locator('input').isChecked();
    if (!isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Clicks the return date field in advanced search mode to open its calendar.
   */
  async clickAdvancedReturnDateField() {
    const field = this.page.locator(SELECTORS.ADVANCED_RETURN_DATE_FIELD);
    await field.waitFor({ state: 'visible', timeout: 10000 });
    await field.click();
    // Wait for the date picker panel to be visible
    await this.page.locator('.el-picker-panel:visible').waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Checks if the car search parallel checkbox is checked.
   * Differentiates from hotel checkbox using "Add Car" text.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isCarSearchCheckboxChecked(timeout = 15000) {
    const checkbox = this.page.locator(SELECTORS.CAR_SEARCH_CHECKBOX)
      .filter({ hasText: SELECTORS.CAR_SEARCH_CHECKBOX_TEXT })
      .first();
    await checkbox.waitFor({ state: 'visible', timeout });
    return await checkbox.locator('.el-checkbox__input').evaluate(el => el.classList.contains('is-checked'));
  }

  /**
   * Enables the "Add Car" parallel search checkbox if not already checked.
   */
  async checkParallelCarSearch() {
    const checkbox = this.page.locator(SELECTORS.CAR_SEARCH_CHECKBOX)
      .filter({ hasText: SELECTORS.CAR_SEARCH_CHECKBOX_TEXT })
      .first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await checkbox.locator('.el-checkbox__input').evaluate(el => el.classList.contains('is-checked'));
    if (!isChecked) {
      await checkbox.click();
    }
  }
}

module.exports = FlightSearchPage;
