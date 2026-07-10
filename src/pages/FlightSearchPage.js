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
  // Advanced search — per-leg cabin class (the icon-bearing .class-input select in each section)
  DEPARTURE_CLASS_FIELD: 'section.departure .class-input .app-select',
  RETURN_CLASS_FIELD: 'section.return .class-input .app-select',
  // Advanced-search "Via" (add-connection) checkbox. Scoped to the advanced-search container
  // (like ALLOW_NEARBY_AIRPORTS_CHECKBOX) and matched by its exact label text. Rendered only
  // when advanced search is expanded.
  VIA_CHECKBOX: '.advanced-search-container .el-checkbox',
  VIA_CHECKBOX_LABEL: 'Via',
  DROPDOWN_OPTION: (text) => `.el-select-dropdown__item:visible:has-text("${text}")`,
  // Parallel hotel search checkbox (shares the class with car, differentiated by "Add Hotel" text)
  PARALLEL_HOTEL_CHECKBOX: '.parallel-search-checkbox',
  HOTEL_SEARCH_CHECKBOX_TEXT: 'Add Hotel',
  // Parallel car search checkbox (uses same class, differentiated by "Add Car" text)
  CAR_SEARCH_CHECKBOX: '.parallel-search-checkbox',
  CAR_SEARCH_CHECKBOX_TEXT: 'Add Car',
  // Parallel hotel edit block — the hotel checkbox + "Edit"/"Cancel edit" toggle wrapper.
  // Scoped by `.is-align-flex-start` (only the hotel wrapper carries it) so the car block's
  // identical toggle button is never matched.
  PARALLEL_HOTEL_BLOCK: '.parallel-search-container .is-align-flex-start',
  // Destination field inside the parallel hotel inputs. Shares the placeholder with the main
  // hotel tab, so it is scoped to the parallel inputs list to avoid matching the hotel-tab field.
  PARALLEL_HOTEL_DESTINATION_FIELD: ".parallel-search-inputs-list [placeholder='Where would you like to stay?']",
  // First autocomplete suggestion for the parallel hotel destination (same popper as the hotel tab).
  PARALLEL_HOTEL_AUTOCOMPLETE_FIRST_OPTION: ".el-autocomplete-suggestion__list li[id*='item-0']",
  // Pick-up location field inside the parallel car inputs. The car-autocomplete carries the
  // `.app-search-input.pick-up` classes; it is scoped to the parallel inputs list so it never
  // matches the main car-tab pick-up field.
  PARALLEL_CAR_PICKUP_FIELD: ".parallel-search-inputs-list .app-search-input.pick-up input",
  // First autocomplete suggestion for the parallel car pick-up location (shared el-autocomplete popper).
  PARALLEL_CAR_AUTOCOMPLETE_FIRST_OPTION: ".el-autocomplete-suggestion__list li[id*='item-0']",
  // Advanced search — return leg date picker
  ADVANCED_RETURN_DATE_FIELD: 'section.return .flight-date-picker input',
  // Flight-time field validation message shown when the time frame is required but empty
  // (e.g. a user restricted from the Anytime frame). Scoped per leg — in that flow the
  // flight-time field is the only invalid one in its section, so its message is the one rendered.
  DEPARTURE_FLIGHT_TIME_VALIDATION: 'section.departure .form-validation-msg .help',
  RETURN_FLIGHT_TIME_VALIDATION: 'section.return .form-validation-msg .help',
};

const { escapeRegExp } = require("@utils/text");
const { pressTab } = require("@utils/dom");

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
   * Selects a cabin class for a specific leg's cabin dropdown by index.
   * On a round trip the form shows two cabin fields: index 0 = outbound, index 1 = return.
   *
   * @param {string} value - Cabin class label, e.g. "Economy", "Business"
   * @param {number} index - Zero-based cabin-field index (0 = outbound, 1 = return)
   */
  async selectFlightClassByIndex(value, index) {
    if (!value || typeof value !== 'string') {
      throw new Error('value must be a non-empty string');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    const classField = this.page.locator(SELECTORS.FLIGHT_CLASS_FIELD).nth(index);
    await classField.waitFor({ state: 'visible', timeout: 10000 });
    await classField.click();
    // Exact text so "Economy" does not also match "Premium Economy"; .last() = the popper that just opened.
    const option = this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEMS)
      .filter({ hasText: new RegExp(`^\\s*${value}\\s*$`) })
      .last();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.scrollIntoViewIfNeeded().catch(() => {});
    await option.click({ force: true });
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
   * Waits until the "Allow nearby airports" checkbox reports checked.
   *
   * The checkbox renders immediately, but its state is applied reactively from the
   * administration configuration a beat after the flight tab loads — so a single
   * read can observe the pre-config (unchecked) state. Polls the `is-checked` class
   * on the same (first) checkbox input the instant reader targets until it appears.
   *
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>} true if it became checked within the timeout
   */
  async waitForAllowNearbyAirportsChecked(timeout = 15000) {
    const selector = SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX_INPUT;
    try {
      await this.page.locator(selector).first().waitFor({ state: 'visible', timeout });
      await this.page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return !!el && el.classList.contains('is-checked');
        },
        selector,
        { timeout },
      );
      return true;
    } catch {
      return false;
    }
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
   * Enables the advanced-search "Via" (add-connection) checkbox if not already checked,
   * so the per-leg connection airport fields render. Idempotent — clicking an already-checked
   * box would disable it, so the checked state is read first.
   */
  async enableViaConnection() {
    const viaCheckbox = this.page
      .locator(SELECTORS.VIA_CHECKBOX)
      .filter({ hasText: new RegExp(`^\\s*${SELECTORS.VIA_CHECKBOX_LABEL}\\s*$`) })
      .first();
    try {
      await viaCheckbox.waitFor({ state: 'visible', timeout: 10000 });
      // Read the checked state from the .el-checkbox__input wrapper (same convention as
      // isAllowNearbyAirportsCheckboxChecked) — the root label may not carry is-checked.
      const inputClass = (await viaCheckbox.locator('.el-checkbox__input').getAttribute('class')) || '';
      if (!inputClass.includes('is-checked')) {
        await viaCheckbox.click();
      }
    } catch (err) {
      throw new Error(
        `[FlightSearchPage.enableViaConnection] Could not enable the "Via" connection checkbox. ` +
        `The advanced-search panel may not be open (the checkbox renders only when it is). ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Selects the cabin class for the departure (outbound) leg in advanced round-trip search.
   * @param {string} value - Cabin label, e.g. "Business", "Economy"
   */
  async selectDepartureFlightClass(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`[FlightSearchPage.selectDepartureFlightClass] "value" must be a non-empty string, got: ${typeof value}`);
    }
    try {
      const field = this.page.locator(SELECTORS.DEPARTURE_CLASS_FIELD).first();
      await field.waitFor({ state: 'visible', timeout: 10000 });
      await field.click();
      // Match the option by EXACT text — a substring match would resolve "Economy" to both
      // "Economy" and "Premium Economy" and throw a strict-mode violation.
      await this._clickDropdownOptionExact(value);
      await field.getByText(value, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[FlightSearchPage.selectDepartureFlightClass] Could not select departure cabin "${value}". ` +
        `The advanced round-trip panel may not be open or the cabin option is unavailable. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects the cabin class for the return (inbound) leg in advanced round-trip search.
   * @param {string} value - Cabin label, e.g. "Business", "Economy"
   */
  async selectReturnFlightClass(value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`[FlightSearchPage.selectReturnFlightClass] "value" must be a non-empty string, got: ${typeof value}`);
    }
    try {
      const field = this.page.locator(SELECTORS.RETURN_CLASS_FIELD).first();
      await field.waitFor({ state: 'visible', timeout: 10000 });
      await field.click();
      // Exact-match the option (see selectDepartureFlightClass) to avoid "Economy" also
      // matching "Premium Economy".
      await this._clickDropdownOptionExact(value);
      await field.getByText(value, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[FlightSearchPage.selectReturnFlightClass] Could not select return cabin "${value}". ` +
        `The advanced round-trip panel may not be open or the cabin option is unavailable. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the visible El-Plus select-dropdown option whose text is EXACTLY `value`.
   * Avoids the substring match of DROPDOWN_OPTION (e.g. "Economy" matching "Premium Economy").
   * @param {string} value - Exact option label
   */
  async _clickDropdownOptionExact(value) {
    await this.page
      .locator('.el-select-dropdown__item:visible')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(value)}\\s*$`) })
      .first()
      .click();
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
  async waitForSelectDropdownToClose(timeout = 5000) {
    await this.page.locator('.el-select-dropdown:visible')
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  async selectReturnFlightTime(value) {
    await this.page.locator(SELECTORS.RETURN_APP_SELECT).nth(1).click();
    // Wait for the dropdown list to be fully rendered before clicking the target option
    await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEMS).first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.locator(SELECTORS.DROPDOWN_OPTION(value)).click();
  }

  /**
   * Reads the validation message shown under the departure-leg flight-time field in
   * advanced search. The message only renders after a search is submitted with the
   * field empty and the time frame is required (Anytime-restricted user).
   *
   * @param {number} timeout - Max wait for the message to appear (default: 10000)
   * @returns {Promise<string>} Trimmed message text, or '' if none is shown.
   */
  async getDepartureFlightTimeValidationMessage(timeout = 10000) {
    const message = this.page.locator(SELECTORS.DEPARTURE_FLIGHT_TIME_VALIDATION).first();
    const appeared = await message
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
    if (!appeared) return '';
    return ((await message.textContent()) ?? '').trim();
  }

  /**
   * Reads the validation message shown under the return-leg flight-time field in
   * advanced search. See {@link FlightSearchPage#getDepartureFlightTimeValidationMessage}.
   *
   * @param {number} timeout - Max wait for the message to appear (default: 10000)
   * @returns {Promise<string>} Trimmed message text, or '' if none is shown.
   */
  async getReturnFlightTimeValidationMessage(timeout = 10000) {
    const message = this.page.locator(SELECTORS.RETURN_FLIGHT_TIME_VALIDATION).first();
    const appeared = await message
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
    if (!appeared) return '';
    return ((await message.textContent()) ?? '').trim();
  }

  /**
   * Opens the given leg's flight-time dropdown and reports whether an "Anytime"
   * option is offered. A user restricted from the Anytime frame (dontAllowAnytime)
   * should never see it in the option list. Leaves the dropdown closed afterwards.
   *
   * Flight time is the 2nd app-select in each leg section (date-type is the 1st) —
   * matching the departure/return time selectors used elsewhere in this page.
   *
   * @param {'departure'|'return'} leg
   * @returns {Promise<boolean>} true if an "Anytime" option is present, false otherwise.
   */
  async isAnytimeFlightTimeOffered(leg) {
    if (leg !== 'departure' && leg !== 'return') {
      throw new Error(`[FlightSearchPage.isAnytimeFlightTimeOffered] "leg" must be "departure" or "return", got: ${leg}`);
    }

    const sectionSelector = leg === 'departure' ? SELECTORS.DEPARTURE_APP_SELECT : SELECTORS.RETURN_APP_SELECT;
    const timeSelect = this.page.locator(sectionSelector).nth(1);

    try {
      await timeSelect.click({ timeout: 15000 });
      await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEMS).first().waitFor({ state: 'visible', timeout: 10000 });
      const anytimeOptionCount = await this.page.locator(SELECTORS.DROPDOWN_OPTION('Anytime')).count();
      // Close the dropdown so the next leg's read starts from a clean state.
      await timeSelect.click();
      await this.waitForSelectDropdownToClose();
      return anytimeOptionCount > 0;
    } catch (err) {
      throw new Error(
        `[FlightSearchPage.isAnytimeFlightTimeOffered] Could not read the "${leg}" leg flight-time options. ` +
        `The advanced search panel may not be open or the time dropdown selector needs updating. Original: ${err.message}`
      );
    }
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
   * Resolves the hotel parallel-search checkbox. The hotel and car checkboxes
   * share the `.parallel-search-checkbox` class, so it is scoped by the
   * "Add Hotel" text to avoid matching the car checkbox.
   * @returns {import('@playwright/test').Locator}
   */
  getHotelParallelCheckbox() {
    return this.page.locator(SELECTORS.PARALLEL_HOTEL_CHECKBOX)
      .filter({ hasText: SELECTORS.HOTEL_SEARCH_CHECKBOX_TEXT })
      .first();
  }

  /**
   * Checks the "Add hotel to this trip" parallel search checkbox.
   */
  async checkParallelHotelSearch() {
    const checkbox = this.getHotelParallelCheckbox();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    const isChecked = await checkbox.locator('input').isChecked();
    if (!isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Checks whether the "Add Hotel to this trip" parallel search checkbox is visible on the flight tab.
   * Returns false instead of throwing when the checkbox never appears, so callers can assert
   * visibility with a descriptive message rather than a raw waitFor timeout.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isHotelParallelCheckboxVisible(timeout = 15000) {
    const checkbox = this.getHotelParallelCheckbox();
    try {
      await checkbox.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      // Hotel parallel checkbox not rendered within the timeout — treat as not visible.
      return false;
    }
  }

  /**
   * Checks if the hotel search parallel checkbox is checked.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isParallelHotelSearchChecked(timeout = 15000) {
    const checkbox = this.getHotelParallelCheckbox();
    await checkbox.waitFor({ state: 'visible', timeout });
    return await checkbox.locator('input').isChecked();
  }

  /**
   * Disables the "Add hotel to this trip" parallel search checkbox if enabled.
   * Tolerates the checkbox being absent (hotel product not accessible for the
   * user) — there is nothing to uncheck in that case, so it returns quietly.
   */
  async uncheckParallelHotelSearch() {
    const checkbox = this.getHotelParallelCheckbox();
    try {
      await checkbox.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Hotel parallel checkbox not rendered — hotel product not accessible; nothing to uncheck.
      return;
    }
    const isChecked = await checkbox.locator('input').isChecked();
    if (isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Resolves the "Edit" toggle button inside the parallel HOTEL block.
   * The hotel and car parallel blocks each render an identical app-btn that reads
   * "Edit" when closed and "Cancel edit" when open; scoping to the hotel wrapper
   * (`PARALLEL_HOTEL_BLOCK`) with an exact name ensures the car block's button and
   * the open-state "Cancel edit" label are never matched.
   * @returns {import('@playwright/test').Locator}
   */
  getParallelHotelEditButton() {
    return this.page
      .locator(SELECTORS.PARALLEL_HOTEL_BLOCK)
      .getByRole('button', { name: 'Edit', exact: true });
  }

  /**
   * Opens the parallel hotel edit inputs (destination / dates / rooms) if not already open.
   * The toggle shows "Edit" only while the panel is closed, so a missing button means the
   * panel is already open and nothing needs clicking. Waits for the destination field to
   * confirm the inputs are ready.
   */
  async openParallelHotelEditInputs() {
    const editButton = this.getParallelHotelEditButton();
    try {
      await editButton.waitFor({ state: 'visible', timeout: 5000 });
      await editButton.click();
    } catch {
      // "Edit" not present — the panel is already open ("Cancel edit"); nothing to toggle.
    }
    await this.page
      .locator(SELECTORS.PARALLEL_HOTEL_DESTINATION_FIELD)
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Types a destination into the parallel hotel search inputs and confirms the autocomplete
   * selection. Clicks the first suggestion when it appears, otherwise falls back to TAB to
   * accept the highlighted match. Scoped to the parallel inputs list so it never types into
   * the main hotel-tab destination field.
   * @param {string} where - Hotel destination to search for
   */
  async typeParallelHotelDestination(where) {
    const destinationField = this.page.locator(SELECTORS.PARALLEL_HOTEL_DESTINATION_FIELD);
    const firstSuggestion = this.page
      .locator(SELECTORS.PARALLEL_HOTEL_AUTOCOMPLETE_FIRST_OPTION)
      .first();

    await destinationField.waitFor({ state: 'visible', timeout: 10000 });
    await destinationField.click();
    await destinationField.fill(where);

    try {
      await firstSuggestion.waitFor({ state: 'visible', timeout: 5000 });
      await firstSuggestion.click();
    } catch {
      await pressTab(this.page);
    }

    // Small wait for the UI to process the blur event and apply the selection.
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks the return date field in advanced search mode to open its calendar.
   */
  async clickAdvancedReturnDateField() {
    const field = this.page.locator(SELECTORS.ADVANCED_RETURN_DATE_FIELD);
    await field.waitFor({ state: 'visible', timeout: 10000 });
    await field.click();
    // Wait for the date picker panel to be visible. Scope to .first(): the departure
    // panel may still be visible while the return one opens, and matching two panels
    // would throw a strict-mode violation.
    await this.page.locator('.el-picker-panel:visible').first().waitFor({ state: 'visible', timeout: 10000 });
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
   * Resolves the "Edit" toggle button inside the parallel CAR block.
   * Unlike the hotel block (scoped by `.is-align-flex-start`), the car block has no unique wrapper
   * class, so the button is resolved as the sibling of the "Add Car" checkbox: scoping to that
   * checkbox's parent with an exact name ensures the hotel block's identical toggle and the
   * open-state "Cancel edit" label are never matched.
   * @returns {import('@playwright/test').Locator}
   */
  getParallelCarEditButton() {
    return this.page
      .locator(SELECTORS.CAR_SEARCH_CHECKBOX)
      .filter({ hasText: SELECTORS.CAR_SEARCH_CHECKBOX_TEXT })
      .first()
      .locator('xpath=..')
      .getByRole('button', { name: 'Edit', exact: true });
  }

  /**
   * Opens the parallel car edit inputs (pick-up location / dates) if not already open.
   * The toggle shows "Edit" only while the panel is closed, so a missing button means the panel is
   * already open and nothing needs clicking. Waits for the pick-up field to confirm the inputs are ready.
   */
  async openParallelCarEditInputs() {
    const editButton = this.getParallelCarEditButton();
    try {
      await editButton.waitFor({ state: 'visible', timeout: 5000 });
      await editButton.click();
    } catch {
      // "Edit" not present — the panel is already open ("Cancel edit"); nothing to toggle.
    }
    await this.page
      .locator(SELECTORS.PARALLEL_CAR_PICKUP_FIELD)
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Types a pick-up location into the parallel car search inputs and confirms the autocomplete
   * selection. Clicks the first suggestion when it appears, otherwise falls back to TAB to accept
   * the highlighted match. Scoped to the parallel inputs list so it never types into the main
   * car-tab pick-up field.
   * @param {string} where - Car pick-up location to search for
   */
  async typeParallelCarDestination(where) {
    const pickupField = this.page.locator(SELECTORS.PARALLEL_CAR_PICKUP_FIELD);
    const firstSuggestion = this.page
      .locator(SELECTORS.PARALLEL_CAR_AUTOCOMPLETE_FIRST_OPTION)
      .first();

    await pickupField.waitFor({ state: 'visible', timeout: 10000 });
    await pickupField.click();
    await pickupField.fill(where);

    try {
      await firstSuggestion.waitFor({ state: 'visible', timeout: 5000 });
      await firstSuggestion.click();
    } catch {
      await pressTab(this.page);
    }

    // Small wait for the UI to process the blur event and apply the selection.
    await this.page.waitForTimeout(300);
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
