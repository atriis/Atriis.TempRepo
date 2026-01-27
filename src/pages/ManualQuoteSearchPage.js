const {
  typeIntoNthAvailableInput,
  pressTab,
  scrollToElement
} = require('@utils/dom');
const { expect } = require('@playwright/test');

/**
 * Centralized selectors for manual quote search page.
 * NOTE: Some selectors are UI-dependent and may be fragile.
 */
const SELECTORS = {
  MANUAL_QUOTE_TAB: '#tab-manual',
  ENTER_AIRPORT_LOCATION_PLACEHOLDER: '[placeholder="Enter airport location"]',
  
  // Airport inputs
  DEPARTING_FROM_INPUT: 'input[name="departing-airport-autocomplete"]',
  ARRIVING_TO_INPUT: 'input[name="arriving-airport-autocomplete"]',
  
  // Date inputs
  DEPARTING_DATE_INPUT: 'input[name="departing-date"]',
  // TODO: Replace with data-testid - this selector is fragile and matches multiple elements
  RETURNING_DATE_INPUT: '.el-input__inner[placeholder="DD MM YYYY"][readonly]',
  
  // Time inputs
  DEPARTING_HOUR_FIELD: '[name="departing-hour"]',
  RETURNING_HOUR_FIELD: '[name="arriving-hour"]',
  TIME_PICKER_INPUTS: 'section.app-timepicker input.app-timepicker-input',
  
  // Flight details
  FLIGHT_NUMBER_FIELD: '[name="flight-number"]',
  CARRIER_LOCATOR_FIELD: '[name="carrier-locator"]',
  CARRIER_INPUT: '[name="carrier"] input.el-select__input',
  CARRIER_DROPDOWN_OPTION:
    (carrierName) => `li.el-select-dropdown__item span:text("${carrierName}")`,
  
  // Pricing and actions
  BASE_FARE_FIELD: '[name="base-fare"]',
  ADD_QUOTE_BUTTON: 'button.add-quote-btn',
};

/**
 * Page Object for Manual Quote Search functionality.
 * Handles all UI interactions for creating manual flight quotes.
 */
class ManualQuoteSearchPage {
  constructor(page) {
    this.page = page;
  }

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
      SELECTORS.ENTER_AIRPORT_LOCATION_PLACEHOLDER
    ).first().waitFor({ state: 'visible', timeout: 20000 });
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
      0
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Ensure the "From" field lost focus (input was applied)
    await expect(fromInput).not.toBeFocused();
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
      0
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Ensure the "To" field lost focus (input was applied)
    await expect(toInput).not.toBeFocused();
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
    await this.page.locator(SELECTORS.TIME_PICKER_INPUTS).nth(0).click();
    await this.page.locator(SELECTORS.FLIGHT_NUMBER_FIELD).click();
  }

  /**
   * Clicks the end time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickEndTime() {
    await this.page.locator(SELECTORS.TIME_PICKER_INPUTS).nth(1).click();
    await this.page.locator(SELECTORS.FLIGHT_NUMBER_FIELD).click();
  }

  /**
   * Fills the base fare field for the manual quote.
   * Scrolls to element first to ensure it's in view.
   *
   * @param {string} baseFare - Base fare amount (e.g., "50")
   */
  async typeBaseFare(baseFare) {
    await scrollToElement(this.page, SELECTORS.BASE_FARE_FIELD);
    await this.page.fill(SELECTORS.BASE_FARE_FIELD, baseFare);
  }

  /**
   * Clicks the "Add Quote" button to add the manual quote to the cart.
   * Scrolls to element first to ensure it's in view.
   */
  async clickAddQuoteButton() {
    await scrollToElement(this.page, SELECTORS.ADD_QUOTE_BUTTON);
    await this.page.click(SELECTORS.ADD_QUOTE_BUTTON);
  }
}

module.exports = ManualQuoteSearchPage;