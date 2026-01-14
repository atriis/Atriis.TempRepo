const {
  typeIntoNthAvailableInput,
  pressTab
} = require('../utils/dom');

/**
 * Centralized selectors for the Search screen.
 *
 * These selectors are shared across Flights, Hotels, Cars and Rails.
 * They are intentionally flexible to support different suppliers and UIs.
 *
 * IMPORTANT:
 * Selectors are UI-dependent and may look fragile.
 * They are kept as-is by design.
 */
const SELECTORS = {
  // Traveler interaction
  TRAVELER_ICON: ".traveler-name",
  IM_THE_TRAVELER_BUTTON: ".imt-btn",
  STAR_ICON: ".star-icon",

  // Search and guest management
  SEARCH_BUTTON: "button.search-btn",
  GUEST_TYPE_MODAL_BUTTON: ".add-guest-btn",

  // Guest information form
  FIRST_NAME_INPUT: "[placeholder='First Name']",
  LAST_NAME_INPUT: "[placeholder='Last Name']",
  GENDER_DROPDOWN: "div.el-select__selected-item:has-text('Please select gender')",
  GENDER_OPTION_MALE: "role=option[name='Male']",
  DATE_OF_BIRTH_INPUT: "[placeholder='DD/MM/YYYY']",
  EMAIL_INPUT: "[placeholder='Enter email address']",
  PHONE_INPUT: "[placeholder='Enter phone number']",
  ADD_GUEST_MODAL_BUTTON: ".app-footer .add-guest-btn",

  // Calendar (date picker)
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  DATE_PICKER_CALENDAR_NEXT_ARROW:
    "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DATE_PICKER_MONTH_TABLE: "table.el-date-table",
  DATE_PICKER_AVAILABLE_DAY_CELL: "td.available .el-date-table-cell__text",

  // Traveller search
  TRAVELLER_NAME_FIELD:
    "[placeholder='Search by name, user group, username or email']",
  FIRST_TRAVELLER_OPTION: "[id*='item-0']",
  ADD_ANOTHER_TRAVELLER_BUTTON: ".add-btn .material-symbols-outlined",

  // Tabs
  GENERAL_RAIL_TAB: "#tab-rails",

  // Autocomplete
  AUTOCOMPLETE_LIST:
    ".el-scrollbar__view.el-autocomplete-suggestion__list li[id*='item-0']:visible",

  // Location inputs (fallbacks for different suppliers)
  FROM_PLACEHOLDER: [
    "input[placeholder='From... Station or Location' i]",
    "input[placeholder='From... Departure' i]",
    "input[placeholder*='From' i]"
  ],

  TO_PLACEHOLDER: [
    "input[placeholder='To... Station or Location' i]",
    "input[placeholder='To... Destination' i]",
    "input[placeholder*='To' i]"
  ],

  OR_PLACEHOLDER: [
    "input[placeholder='Enter station or location' i]",
    "input[placeholder='Airport, City or Address' i]",
    "input[placeholder*='or' i]"
  ],

  PICK_UP_PLACEHOLDER: [
    "input[placeholder*='Pick-up']",
  ],

  DROP_OFF_PLACEHOLDER: [
    "input[placeholder*='Drop-off']",
  ],

  DEPARTURE_PLACEHOLDER: [
    "input[placeholder*='Depart']",
  ],

  RETURN_PLACEHOLDER: [
    "input[placeholder*='Return']",
  ],

  PICK_UP_DATE_INPUT: "[placeholder='Pick-up Date']", //Same locator used for Cars and GroundScope/Transferz
};

/**
 * SearchPage
 *
 * This Page Object handles:
 * - traveler selection
 * - guest details
 * - origin/destination inputs
 * - date selection
 *
 * It does NOT contain business logic.
 * Business flows live in DSL files.
 */
class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // Opens traveler selection panel
  async clickTravelerIcon() {
    await this.page.click(SELECTORS.TRAVELER_ICON);
  }

  // Adds an additional traveler to the booking
  async clickAnotherTravellerButton() {
    await this.page.click(SELECTORS.ADD_ANOTHER_TRAVELLER_BUTTON);
  }

  // Waits until the UI is ready to confirm traveler identity
  async waitForImTheTravelerButton() {
    await this.page.waitForSelector(
      SELECTORS.IM_THE_TRAVELER_BUTTON,
      { state: "visible" }
    );
  }

  // Confirms that the logged-in user is the traveler
  async clickImTheTraveler() {
    await this.page.click(SELECTORS.IM_THE_TRAVELER_BUTTON);
  }

  // Used as a stability indicator that the page is fully ready
  async waitForStarIcon() {
    await this.page.waitForSelector(SELECTORS.STAR_ICON, { state: "visible" });
  }

  // Searches and selects an existing traveler
  async fillInTravellerName(name) {
    await this.page.fill(SELECTORS.TRAVELLER_NAME_FIELD, name);
  }

  async selectFirstTravellerOption() {
    await this.page.click(SELECTORS.FIRST_TRAVELLER_OPTION);
  }

  // Opens the guest modal to add a new traveler
  async clickGuestTypeModal() {
    await this.page.click(SELECTORS.GUEST_TYPE_MODAL_BUTTON);
  }

  // Guest form fields
  async fillInRandomFirstName(firstName) {
    await this.page.fill(SELECTORS.FIRST_NAME_INPUT, firstName);
  }

  async fillInRandomLastName(lastName) {
    await this.page.fill(SELECTORS.LAST_NAME_INPUT, lastName);
  }

  async selectGenderMale() {
    await this.page.locator(SELECTORS.GENDER_DROPDOWN).click();
    await this.page.getByRole('option', { name: 'Male' }).first().click();
  }

  async fillInRandomDateOfBirth(dateOfBirth) {
    await this.page.fill(SELECTORS.DATE_OF_BIRTH_INPUT, dateOfBirth);
  }

  async fillInRandomEmail(email) {
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  async fillInRandomPhone(phoneNumber) {
    await this.page.fill(SELECTORS.PHONE_INPUT, phoneNumber);
  }

  async clickToAddGuestModal() {
    await this.page.click(SELECTORS.ADD_GUEST_MODAL_BUTTON);
  }

  /**
   * Fills the "From" field.
   * Uses helper logic to support multiple supplier UIs.
   */
  async fillInFromField(from) {
    await typeIntoNthAvailableInput(
      this.page,
      from,
      SELECTORS.FROM_PLACEHOLDER,
      0
    );
    await this.page.waitForTimeout(1000);
    await pressTab(this.page);
  }

  /**
   * Fills the "To" field and confirms the first autocomplete suggestion.
   */
  async fillInToField(to) {
    await typeIntoNthAvailableInput(
      this.page,
      to,
      SELECTORS.TO_PLACEHOLDER,
      0
    );

    const suggestions = this.page
      .locator(SELECTORS.AUTOCOMPLETE_LIST)
      .first();

    await suggestions.waitFor({ state: 'visible', timeout: 3000 });
    await pressTab(this.page);
    await this.page.waitForTimeout(500);
  }

  /**
   * Fills an "or" location field.
   * Used by Cars, Evolvi and other products.
   */
  async fillInOrField(or, occurrence = 1) {
    await typeIntoNthAvailableInput(
      this.page,
      or,
      SELECTORS.OR_PLACEHOLDER,
      occurrence - 1
    );
    await pressTab(this.page);
    await this.page.waitForTimeout(500);
  }

  // Opens departure calendar
  async clickDepartureDateField() {
    await this.page.locator(SELECTORS.DEPARTURE_PLACEHOLDER).nth(1).click();
    await this.page.waitForTimeout(4000);
  }

  // Opens return calendar
  async clickReturnDateField() {
    await this.page.locator(SELECTORS.RETURN_PLACEHOLDER).click();
    await this.page.waitForTimeout(1500);
  }

  /**
   * Advances the calendar by a number of months.
   * Default is 3 months ahead.
   */
  async clickCalendarNextArrow(monthsAhead = 3) {
    const nextArrow = this.page
      .locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW)
      .first();

    await nextArrow.waitFor({ state: 'visible' });

    for (let i = 0; i < monthsAhead; i++) {
      await nextArrow.click();
      await this.page.waitForTimeout(300);
    }
  }

  // Executes the search
  async clickSearchButton() {
    await this.page.locator(SELECTORS.SEARCH_BUTTON).click();
  }

  // Switches to rail search
  async clickRailTab() {
    await this.page.click(SELECTORS.GENERAL_RAIL_TAB);
  }
}

/**
 * Exporting both:
 * - SearchPage class (default)
 * - SELECTORS (for reuse or debugging if needed)
 */
module.exports = SearchPage;
module.exports.SELECTORS = SELECTORS;