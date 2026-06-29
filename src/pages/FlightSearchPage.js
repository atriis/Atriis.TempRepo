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
  // The el-checkbox__input wrapper carries the `is-checked` class — used to read the checkbox state.
  ALLOW_NEARBY_AIRPORTS_CHECKBOX_INPUT: ".advanced-search-container .el-checkbox__input",
  ADVANCED_SEARCH_OPTIONS: '.flight-more-search-inputs',
  FLIGHT_STOPS_FIELD: '.flight-more-search-inputs > :nth-child(1)',
  FLIGHT_STOPS_COMBOBOX: '.flight-more-search-inputs > :nth-child(1) input[role="combobox"]',
  FLIGHT_STOPS_DISPLAY_TEXT: '.flight-more-search-inputs > :nth-child(1) .el-select__placeholder',
  PREFERRED_CARRIER_FIELD: '.flight-more-search-inputs > :nth-child(2)',
  PREFERRED_CARRIER_INPUT: '.flight-more-search-inputs > :nth-child(2) input[role="combobox"]',
  PREFERRED_CARRIER_CLEAR_ICON: '.el-tag__close',
  VISIBLE_DROPDOWN_ITEMS: '.el-select-dropdown__item:visible',
  // Advanced search — departure leg selectors (round-trip uses section.departure; one-way does not)
  DEPARTURE_APP_SELECT: 'section.departure .app-select',
  // One-way advanced search time/dateType selectors are inside .inputs-wrapper divs (no section.departure wrapper)
  ONE_WAY_APP_SELECT: '.inputs-wrapper .app-select',
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

const { escapeRegExp } = require("@utils/text");

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
   * Checks whether the "Allow nearby airports" checkbox is checked.
   *
   * The checkbox lives in the advanced-search-container footer and is always rendered, so it can be
   * read without expanding the advanced options. Reads the `is-checked` class on the el-checkbox input.
   *
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isAllowNearbyAirportsCheckboxChecked(timeout = 15000) {
    // Shares the el-checkbox `is-checked` read used by isCarSearchCheckboxChecked / check|uncheckParallelCarSearch.
    // If a 5th copy is ever needed, extract a private _isElCheckboxChecked(input) helper instead of duplicating.
    const checkboxInput = this.page.locator(SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX_INPUT).first();
    await checkboxInput.waitFor({ state: 'visible', timeout });
    return await checkboxInput.evaluate((el) => el.classList.contains('is-checked'));
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
   * Selects a value from the departure leg flight time dropdown in advanced search.
   * Flight time is the second app-select in the departure section.
   * @param {string} value - e.g. "Anytime", "Early (04:00-08:00)", "Morning (08:00-12:00)"
   */
  async selectDepartureFlightTime(value) {
    try {
      // Round-trip advanced search wraps departure fields in section.departure;
      // one-way advanced search does not — fall back to .inputs-wrapper .app-select
      const roundTripCount = await this.page.locator(SELECTORS.DEPARTURE_APP_SELECT).count();
      const locator = roundTripCount >= 2
        ? this.page.locator(SELECTORS.DEPARTURE_APP_SELECT).nth(1)
        : this.page.locator(SELECTORS.ONE_WAY_APP_SELECT).nth(1);
      await locator.click({ timeout: 15000 });
      await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
    } catch (err) {
      throw new Error(
        `[FlightSearchPage.selectDepartureFlightTime] Could not select departure flight time "${value}". ` +
        `The advanced search panel may not be open, the time option is unavailable, or the selector needs updating. Original: ${err.message}`
      );
    }
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
   * Clears all selected preferred carriers from the advanced-search multi-select.
   */
  async clearPreferredCarriers() {
    const preferredCarrierField = this.page.locator(SELECTORS.PREFERRED_CARRIER_FIELD).first();
    await preferredCarrierField.waitFor({ state: 'visible', timeout: 10000 });

    const clearIcons = preferredCarrierField.locator(SELECTORS.PREFERRED_CARRIER_CLEAR_ICON);
    let remaining = await clearIcons.count();

    while (remaining > 0) {
      await clearIcons.nth(0).click({ force: true });
      await this.page.waitForTimeout(200);
      remaining = await clearIcons.count();
    }
  }

  /**
   * Selects a preferred carrier from the advanced-search multi-select.
   *
   * @param {string} value
   */
  async selectPreferredCarrier(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('value must be a non-empty string');
    }

    const escapedValue = escapeRegExp(value.trim());
    const preferredCarrierField = this.page.locator(SELECTORS.PREFERRED_CARRIER_FIELD).first();
    const preferredCarrierInput = this.page.locator(SELECTORS.PREFERRED_CARRIER_INPUT).first();
    const preferredCarrierOption = this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEMS)
      .filter({ hasText: new RegExp(`(?:^${escapedValue}(?:\\s*\\(|$)|\\(${escapedValue}\\)\\s*$)`, 'i') })
      .first();

    await preferredCarrierField.waitFor({ state: 'visible', timeout: 10000 });
    await preferredCarrierField.click();
    await preferredCarrierInput.waitFor({ state: 'visible', timeout: 10000 });
    await preferredCarrierInput.fill(value);
    await preferredCarrierOption.waitFor({ state: 'visible', timeout: 10000 });
    await preferredCarrierOption.click();

    await this.page.waitForFunction(
      ([selector, text]) => {
        const element = document.querySelector(selector);

        return !!element && element.textContent.replace(/\s+/g, ' ').includes(text);
      },
      [SELECTORS.PREFERRED_CARRIER_FIELD, value],
      { timeout: 10000 },
    );
  }

  /**
   * Attempts to type free text into the Stops dropdown.
   *
   * @param {string} value
   * @returns {Promise<{typedValue: string, inputValue: string, isEditable: boolean}>}
   */
  async typeFreeTextInStopsDropdown(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('value must be a non-empty string');
    }

    const stopsDropdown = this.page.locator(SELECTORS.FLIGHT_STOPS_FIELD).first();
    const combobox = this.page.locator(SELECTORS.FLIGHT_STOPS_COMBOBOX).first();

    await stopsDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await stopsDropdown.click();

    await combobox.waitFor({ state: 'attached', timeout: 10000 });
    const isEditable = await combobox.isEditable().catch(() => false);
    await this.page.keyboard.type(value);

    const inputValue = await combobox.inputValue().catch(() => '');
    await this.page.keyboard.press('Tab');

    return { typedValue: value, inputValue, isEditable };
  }

  /**
   * Waits for the Stops dropdown to show the expected text.
   *
   * @param {string} expectedText
   * @param {number} timeout
   */
  async waitForStopsDropdownDisplayText(expectedText, timeout = 10000) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    await this.page.waitForFunction(
      ([selector, text]) => {
        const element = document.querySelector(selector);

        return !!element && element.textContent.replace(/\s+/g, ' ').includes(text);
      },
      [SELECTORS.FLIGHT_STOPS_FIELD, expectedText],
      { timeout },
    );
  }

  /**
   * Gets the current visible Stops dropdown text.
   *
   * @returns {Promise<string>}
   */
  async getStopsDropdownDisplayText() {
    const displayText = await this.page.locator(SELECTORS.FLIGHT_STOPS_FIELD).first().textContent();

    return displayText.replace(/\s+/g, ' ').trim();
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
   * Checks if the hotel search parallel checkbox is checked.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isParallelHotelSearchChecked(timeout = 15000) {
    const checkbox = this.page.locator(SELECTORS.PARALLEL_HOTEL_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout });
    return await checkbox.locator('input').isChecked();
  }

  /**
   * Disables the "Add hotel to this trip" parallel search checkbox if enabled.
   */
  async uncheckParallelHotelSearch() {
    const checkbox = this.page.locator(SELECTORS.PARALLEL_HOTEL_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await checkbox.locator('input').isChecked();
    if (isChecked) {
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

  /**
   * Disables the "Add Car" parallel search checkbox if enabled.
   */
  async uncheckParallelCarSearch() {
    const checkbox = this.page.locator(SELECTORS.CAR_SEARCH_CHECKBOX)
      .filter({ hasText: SELECTORS.CAR_SEARCH_CHECKBOX_TEXT })
      .first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await checkbox.locator('.el-checkbox__input').evaluate(el => el.classList.contains('is-checked'));
    if (isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Checks whether a search-type radio button (e.g. "Complete trip" or "By schedule") is currently selected.
   * Returns false instead of throwing when the radio is not found, to support polling assertions.
   *
   * @param {string} displayLabel - Visible label text of the radio, e.g. "Complete trip" or "By schedule"
   * @returns {Promise<boolean>}
   */
  async isSearchTypeSelected(displayLabel) {
    if (!displayLabel || typeof displayLabel !== 'string') {
      throw new Error('[FlightSearchPage.isSearchTypeSelected] "displayLabel" must be a non-empty string, got: ' + typeof displayLabel);
    }
    try {
      const radio = this.page
        .locator(SELECTORS.SEARCH_MODE_SECTION)
        .locator('.el-radio')
        .filter({ hasText: displayLabel })
        .first();
      return await radio.locator('.el-radio__input').evaluate(el => el.classList.contains('is-checked'));
    } catch (err) {
      // Re-throw infrastructure failures (page closed, navigation away) so they
      // propagate instead of being silently swallowed as a false poll result.
      if (err.message?.includes('Target page') || err.message?.includes('page was closed')) {
        throw err;
      }
      return false;
    }
  }
}

module.exports = FlightSearchPage;
