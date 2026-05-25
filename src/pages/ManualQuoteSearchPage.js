const {
  typeIntoNthAvailableInput,
  pressTab,
} = require("@utils/dom");

/**
 * Page Object for manual quote search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MANUAL_QUOTE_TAB: "#tab-manual",
  ENTER_AIRPORT_LOCATION_PLACEHOLDER: "[placeholder=\"Enter airport location\"]",

  // Airport inputs
  DEPARTING_FROM_INPUT: "input[name=\"departing-airport-autocomplete\"]",
  ARRIVING_TO_INPUT: "input[name=\"arriving-airport-autocomplete\"]",

  // Date inputs
  DEPARTING_DATE_INPUT: "input[name=\"departing-date\"]",
  // TODO: Replace with data-testid - this selector is fragile and matches multiple elements
  RETURNING_DATE_INPUT: ".el-input__inner[placeholder=\"DD MM YYYY\"][readonly]",

  // Time inputs
  DEPARTING_HOUR_FIELD: "[name=\"departing-hour\"]",
  RETURNING_HOUR_FIELD: "[name=\"arriving-hour\"]",
  TIME_PICKER_INPUTS: "section.app-timepicker input.app-timepicker-input",

  // Flight details
  FLIGHT_NUMBER_FIELD: "[name=\"flight-number\"]",
  CARRIER_LOCATOR_FIELD: "[name=\"carrier-locator\"]",
  CARRIER_INPUT: "[name=\"carrier\"] input.el-select__input",
  CARRIER_DROPDOWN_OPTION:
    (carrierName) => `li.el-select-dropdown__item span:text("${carrierName}")`,

  // Pricing and actions
  BASE_FARE_FIELD: "[name=\"base-fare\"]",
  ADD_QUOTE_BUTTON: "button.add-quote-btn",

  // ===== HOTEL MANUAL QUOTE =====
  // Sub-tab inside the manual-quote-page (Element-Plus el-tabs, the Hotel pane label)
  HOTEL_SUBTAB: ".manual-quote-page .el-tabs__item:has-text(\"Hotel\")",
  // Container for the hotel manual quote form (manual-quote-hotel.vue)
  HOTEL_FORM_CONTAINER: ".manual-quote-hotel",
  // Radio inside manual-quote-hotel.vue: <el-radio value="manual">Enter details manually</el-radio>
  HOTEL_MANUAL_MODE_RADIO:
    '.manual-quote-hotel .el-radio:has-text("Enter details manually")',
  // Element Plus date picker popup, scoped to whichever picker is currently visible.
  HOTEL_DATE_PICKER_PANEL: ".el-picker-panel:visible",
  // Form fields scoped by visible label text (.field:has(label:text-is("...")) is the
  // project's established pattern — see CartPage.PASSENGER_INFO_*).
  HOTEL_NAME_INPUT: ".manual-quote-hotel input[name=\"hotel-name\"]",
  HOTEL_ADDRESS_INPUT: ".manual-quote-hotel input[name=\"Address\"]",
  HOTEL_CITY_INPUT: ".manual-quote-hotel .field:has(label:text-is(\"City\")) input",
  HOTEL_CITY_DROPDOWN_OPTION: ".boxed-autocomplete-popper .autocomplete-result, .el-autocomplete-suggestion li",
  HOTEL_CHECK_IN_FIELD: ".manual-quote-hotel .field:has(label:text-is(\"Check In Date\"))",
  HOTEL_CHECK_OUT_FIELD: ".manual-quote-hotel .field:has(label:text-is(\"Check Out Date\"))",
  HOTEL_NUMBER_OF_ROOMS_SELECT: ".manual-quote-hotel .field:has(label:text-is(\"Number Of Rooms\")) .el-select__wrapper",
  HOTEL_CANCELLATION_POLICY_SELECT: ".manual-quote-hotel .field:has(label:text-is(\"Cancellation policy\")) .el-select__wrapper",
  HOTEL_CONFIRMATION_NUM_INPUT: ".manual-quote-hotel input[name=\"confirmation-num\"]",
  HOTEL_ROOM_DESCRIPTION_TEXTAREA: ".manual-quote-hotel .field:has(label:text-is(\"Room description\")) textarea",
  // Base fare lives in the price section; it's the first number input there.
  HOTEL_BASE_FARE_INPUT: ".manual-quote-hotel .field:has(label:text-is(\"Base fare\")) input, .manual-quote-hotel .price-section input[type=\"number\"]",
  // Generic visible dropdown options (Element-Plus renders dropdown at body level)
  SELECT_DROPDOWN_OPTION: ".el-select-dropdown:visible .el-select-dropdown__item",
};

class ManualQuoteSearchPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the time picker input locator.
   * @param {number} index - 0 for start time, 1 for end time
   * @returns {Locator} Playwright locator for the time picker input
   */
  getTimePickerInput(index) {
    return this.page.locator(SELECTORS.TIME_PICKER_INPUTS).nth(index);
  }

  /**
   * Gets the flight number field locator.
   * @returns {Locator} Playwright locator for the flight number field
   */
  getFlightNumberField() {
    return this.page.locator(SELECTORS.FLIGHT_NUMBER_FIELD);
  }

  // ===== UI INTERACTIONS =====

  /**
   * Clicks the Manual Quote tab to switch to manual quote mode.
   */
  async clickManualQuoteTab() {
    await this.page.click(SELECTORS.MANUAL_QUOTE_TAB);
  }

  /**
   * Waits for the airport location placeholder to be visible.
   * Used to ensure the manual quote form is fully loaded.
   */
  async waitForEnterAirportLocationPlaceholderVisible() {
    await this.page.locator(
      SELECTORS.ENTER_AIRPORT_LOCATION_PLACEHOLDER,
    ).first().waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Fills the "From" field.
   *
   * Uses a shared helper that supports multiple supplier UIs by targeting the
   * first available input that matches the "From" placeholder selector.
   * After typing, it commits the value by pressing TAB and waits until the field
   * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
   *
   * @param {string} from - Origin text to type into the "From" field
   */
  async fillInDepartingFromField(from) {
    const fromInput = this.page
      .locator(SELECTORS.DEPARTING_FROM_INPUT)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      from,
      [SELECTORS.DEPARTING_FROM_INPUT],
      0,
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
   * Fills the "To" field.
   *
   * Uses a shared helper that supports multiple supplier UIs by targeting the
   * first available input that matches the "To" placeholder selector.
   * After typing, it commits the value by pressing TAB and waits until the field
   * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
   *
   * @param {string} to - Destination text to type into the "To" field
   */
  async fillInArrivingToField(to) {
    const toInput = this.page
      .locator(SELECTORS.ARRIVING_TO_INPUT)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      to,
      [SELECTORS.ARRIVING_TO_INPUT],
      0,
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
   * Clicks the departing date field to open the calendar picker.
   */
  async clickDepartingDateField() {
    await this.page.click(SELECTORS.DEPARTING_DATE_INPUT);
  }

  /**
   * Clicks the returning date field to open the calendar picker.
   * Uses nth(1) because the selector matches multiple readonly date inputs.
   */
  async clickReturningDateField() {
    await this.page.locator(SELECTORS.RETURNING_DATE_INPUT).nth(1).click();
  }

  /**
   * Fills the flight number field.
   *
   * @param {string} flightNumber - Flight number to enter (e.g., "765")
   */
  async typeFlightNumber(flightNumber) {
    await this.page.fill(SELECTORS.FLIGHT_NUMBER_FIELD, flightNumber);
  }

  /**
   * Fills the carrier locator field (airline code).
   *
   * @param {string} carrierLocator - Airline code (e.g., "TP" for TAP Air Portugal)
   */
  async typeCarrierLocator(carrierLocator) {
    await this.page.fill(SELECTORS.CARRIER_LOCATOR_FIELD, carrierLocator);
  }

  /**
   * Types into the carrier name field to trigger autocomplete dropdown.
   *
   * @param {string} carrierName - Carrier name to type (e.g., "TAP Air Portugal (TP)")
   */
  async typeCarrierName(carrierName) {
    const input = this.page.locator(SELECTORS.CARRIER_INPUT);
    await input.click();
    await input.fill(carrierName);
  }

  /**
   * Selects a carrier option from the autocomplete dropdown.
   *
   * @param {string} carrierName - Exact carrier name to select from dropdown
   */
  async clickCarrierDropdownOption(carrierName) {
    await this.page
      .locator(SELECTORS.CARRIER_DROPDOWN_OPTION(carrierName))
      .click();
  }

  /**
   * Clicks the start time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickStartTime() {
    await this.getTimePickerInput(0).click();
    await this.getFlightNumberField().click();
  }

  /**
   * Clicks the end time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickEndTime() {
    await this.getTimePickerInput(1).click();
    await this.getFlightNumberField().click();
  }

  /**
   * Fills the base fare field for the manual quote.
   * Scrolls to element first to ensure it's in view.
   *
   * @param {string} baseFare - Base fare amount (e.g., "50")
   */
  async typeBaseFare(baseFare) {
    const baseFareField = this.page.locator(SELECTORS.BASE_FARE_FIELD).first();
    await baseFareField.scrollIntoViewIfNeeded();
    await baseFareField.fill(baseFare);
  }

  /**
   * Clicks the "Add Quote" button to add the manual quote to the cart.
   * Scrolls to element first to ensure it's in view.
   */
  async clickAddQuoteButton() {
    const addQuoteBtn = this.page.locator(SELECTORS.ADD_QUOTE_BUTTON).first();
    await addQuoteBtn.scrollIntoViewIfNeeded();
    await addQuoteBtn.click();
  }

  // ===== HOTEL MANUAL QUOTE =====

  /**
   * Clicks the Hotel sub-tab inside the manual quote page.
   */
  async clickHotelSubTab() {
    await this.page.locator(SELECTORS.HOTEL_SUBTAB).first().click();
  }

  /**
   * Waits for the hotel manual quote form container to be visible.
   */
  async waitForHotelFormVisible() {
    await this.page
      .locator(SELECTORS.HOTEL_FORM_CONTAINER)
      .first()
      .waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Selects the "Enter details manually" radio inside the hotel form.
   * The form defaults to "Search location" mode, so this MUST be called
   * before any of the manual-entry fields (hotel name, address, etc.) are
   * visible.
   */
  async selectHotelManualEntryMode() {
    const radio = this.page.locator(SELECTORS.HOTEL_MANUAL_MODE_RADIO).first();
    await radio.waitFor({ state: "visible", timeout: 10000 });
    await radio.click();
  }

  /**
   * Fills the hotel name field.
   * @param {string} name - Hotel name
   */
  async typeHotelName(name) {
    await this.page.locator(SELECTORS.HOTEL_NAME_INPUT).first().fill(name);
  }

  /**
   * Fills the hotel address field.
   * @param {string} address - Hotel street address
   */
  async typeHotelAddress(address) {
    await this.page.locator(SELECTORS.HOTEL_ADDRESS_INPUT).first().fill(address);
  }

  /**
   * Types into the city autocomplete and selects the first suggestion.
   * @param {string} city - City text to type (e.g. "Portland")
   * @param {number} [timeout=10000] - Max wait for dropdown
   */
  async selectHotelCity(city, timeout = 10000) {
    const input = this.page.locator(SELECTORS.HOTEL_CITY_INPUT).first();
    await input.click();
    await input.fill(city);
    const option = this.page.locator(SELECTORS.HOTEL_CITY_DROPDOWN_OPTION).first();
    await option.waitFor({ state: "visible", timeout });
    await option.click();
  }

  /**
   * Opens the check-in or check-out date picker by clicking the field's input,
   * scoped by visible label text. Waits for the picker panel to be visible.
   * @param {number} index - 0 for check-in, 1 for check-out
   */
  async clickHotelDateInput(index) {
    const fieldSelector =
      index === 0 ? SELECTORS.HOTEL_CHECK_IN_FIELD : SELECTORS.HOTEL_CHECK_OUT_FIELD;
    await this.page.locator(`${fieldSelector} input`).first().click();
    await this.page
      .locator(SELECTORS.HOTEL_DATE_PICKER_PANEL)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Opens an app-select dropdown by visible label text.
   * @param {"numberOfRooms"|"cancellationPolicy"} field
   */
  async openHotelSelect(field) {
    const selector =
      field === "cancellationPolicy"
        ? SELECTORS.HOTEL_CANCELLATION_POLICY_SELECT
        : SELECTORS.HOTEL_NUMBER_OF_ROOMS_SELECT;
    await this.page.locator(selector).first().click();
  }

  /**
   * Clicks a dropdown option that exactly matches the provided text.
   * @param {string} optionText - Text of the option to select
   * @param {number} [timeout=10000] - Max wait for the option
   */
  async clickDropdownOptionByText(optionText, timeout = 10000) {
    const option = this.page
      .locator(SELECTORS.SELECT_DROPDOWN_OPTION, { hasText: optionText })
      .first();
    await option.waitFor({ state: "visible", timeout });
    await option.click();
  }

  /**
   * Fills the confirmation number field.
   * @param {string} confirmationNum - Booking confirmation number
   */
  async typeHotelConfirmationNumber(confirmationNum) {
    await this.page
      .locator(SELECTORS.HOTEL_CONFIRMATION_NUM_INPUT)
      .first()
      .fill(confirmationNum);
  }

  /**
   * Fills the room description textarea.
   * @param {string} description - Room description text
   */
  async typeHotelRoomDescription(description) {
    await this.page
      .locator(SELECTORS.HOTEL_ROOM_DESCRIPTION_TEXTAREA)
      .first()
      .fill(description);
  }

  /**
   * Fills the base fare input in the hotel price section.
   * @param {string|number} value - Numeric value to enter
   */
  async typeHotelBaseFare(value) {
    const field = this.page.locator(SELECTORS.HOTEL_BASE_FARE_INPUT).first();
    await field.scrollIntoViewIfNeeded();
    await field.fill(String(value));
  }
}

module.exports = ManualQuoteSearchPage;
