const {
  typeIntoNthAvailableInput,
  pressTab
} = require('@utils/dom');
const { expect } = require('@playwright/test');

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

  // Trip types
  TRIP_TYPE_RADIO_LABELS:
    ":is(.search-options-wrapper, .eu-rail-search-inputs, .amtrak-search-inputs, .uk-rail-search) > :nth-child(1) [role='radiogroup'] .el-radio__label",

  // Calendar (date picker)
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  DATE_PICKER_CALENDAR_NEXT_ARROW:
    "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DATE_PICKER_MONTH_TABLE: "table.el-date-table",
  DATE_PICKER_AVAILABLE_DAY_TEXT: "td.available .el-date-table-cell__text",
  DATE_PICKER_AVAILABLE_DAY_CELL: "td.available",

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
  PICK_UP_PLACEHOLDER: "input[placeholder*='Pick-up']",
  DROP_OFF_PLACEHOLDER: "input[placeholder*='Drop-off']",
  DEPARTURE_PLACEHOLDER: "input[placeholder*='Depart']",
  RETURN_PLACEHOLDER: "input[placeholder*='Return']",
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

  /**
   * Waits for the star icon to confirm traveler selection.
   * @param {object} options
   */
  async waitForStarIcon({ timeout = 15000 } = {}) {
    const starIcon = this.page.locator(SELECTORS.STAR_ICON);
    await expect(starIcon, 'Star icon should be visible after adding traveller').toBeVisible({ timeout });
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
 *
 * Uses a shared helper that supports multiple supplier UIs by targeting the
 * first available input that matches the "From" placeholder selector.
 * After typing, it commits the value by pressing TAB and waits until the field
 * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
 *
 * @param {string} from - Origin text to type into the "From" field
 */
async fillInFromField(from) {
  const fromInput = this.page
    .locator(SELECTORS.FROM_PLACEHOLDER)
    .first();

  await typeIntoNthAvailableInput(
    this.page,
    from,
    SELECTORS.FROM_PLACEHOLDER,
    0
  );

  // Commit the value (blur the field)
  await pressTab(this.page);

  // Ensure the "From" field lost focus (input was applied)
  await expect(fromInput).not.toBeFocused();
}

/**
 * Fills the "To" field and confirms the first autocomplete suggestion.
 *
 * The method types into the "To" input, waits for the autocomplete list
 * to appear, and commits the first suggestion by pressing TAB.
 * It then waits until the field loses focus, ensuring the selection
 * has been applied by the UI before continuing.
 *
 * @param {string} to - Destination text to type into the "To" field
 */
async fillInToField(to) {
  const toInput = this.page
    .locator(SELECTORS.TO_PLACEHOLDER)
    .first();

  await typeIntoNthAvailableInput(
    this.page,
    to,
    SELECTORS.TO_PLACEHOLDER,
    0
  );

  const suggestions = this.page
    .locator(SELECTORS.AUTOCOMPLETE_LIST)
    .first();

  // Wait until autocomplete suggestions are shown
  await suggestions.waitFor({ state: 'visible' });

  // Confirm first suggestion (triggers blur + selection)
  await pressTab(this.page);

  // Ensure the "To" field lost focus (selection was applied)
  await expect(toInput).not.toBeFocused();
}

/**
 * Fills an "OR" location field.
 *
 * Used by Cars, Evolvi, and other products that support multiple locations.
 * The value is committed by pressing TAB, which triggers blur/validation logic
 * in the UI. The method waits until the field loses focus to ensure the input
 * has been fully applied before continuing.
 *
 * @param {string} or - Location text to type into the OR field
 * @param {number} occurrence - Which OR field to target (1-based index)
 */
async fillInOrField(or, occurrence = 1) {
  const index = occurrence - 1;

  const orInput = this.page
    .locator(SELECTORS.OR_PLACEHOLDER)
    .nth(index);

  await typeIntoNthAvailableInput(
    this.page,
    or,
    SELECTORS.OR_PLACEHOLDER,
    index
  );

  // Commit the value (blur the field)
  await pressTab(this.page);

  // Ensure the OR field lost focus (input was applied)
  await expect(orInput).not.toBeFocused();
}

/**
 * Opens the departure date calendar.
 *
 * Clicks the departure date field and waits until the date picker
 * panel is visible, ensuring the calendar is fully open and ready
 * for interaction.
 */
  async clickDepartureDateField() {
    // Use .first() to ensure compatibility with UIs that only have one departure field
    await this.page
      .locator(SELECTORS.DEPARTURE_PLACEHOLDER)
      .first()
      .click();

    // Wait until the date picker panel is visible
    await this.page
      .locator(SELECTORS.DATE_PICKER_PANEL)
      .waitFor({ state: 'visible' });
  }

/**
 * Opens the return date calendar.
 *
 * Clicks the return date field and waits until the date picker
 * panel is visible, ensuring the calendar is fully open and ready
 * for interaction.
 */
async clickReturnDateField() {
  await this.page
    .locator(SELECTORS.RETURN_PLACEHOLDER)
    .click();

  // Wait until the date picker panel is visible
  await this.page
    .locator(SELECTORS.DATE_PICKER_PANEL)
    .waitFor({ state: 'visible' });
}

  /**
   * Advances the calendar by a number of months.
   * Default is 3 months ahead.
   */

  /**
   * Advances the calendar by a number of months (default: 3).
   * @param {number} monthsAhead
   */
  async clickCalendarNextArrow(monthsAhead = 3) {
    const nextArrow = this.page
      .locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW)
      .first();

    await nextArrow.waitFor({ state: 'visible' });

    for (let i = 0; i < monthsAhead; i++) {
      await nextArrow.click();
    }
  }

  // Executes the search

  /**
   * Clicks the main search button.
   */
  async clickSearchButton() {
    await this.page.locator(SELECTORS.SEARCH_BUTTON).click();
  }

  // Switches to rail search

  /**
   * Switches to the rail search tab.
   */
  async clickRailTab() {
    await this.page.click(SELECTORS.GENERAL_RAIL_TAB);
  }

  // "Pick-up Date" field (used by Cars and Ground Transport)

  /**
   * Clicks the pick-up date field (used by Cars and Ground Transport).
   */
  async clickPickupDateField() {
    await this.page.click(SELECTORS.PICK_UP_DATE_INPUT);
  }

 /**
 * Clicks a trip type radio button by label text (e.g., "One Way", "Round Trip").
 *
 * Waits until the trip type radio labels are visible before attempting
 * to locate and click the requested option.
 *
 * @param {string|RegExp} labelText
 */
async clickTripType(labelText) {
  const labels = this.page.locator(SELECTORS.TRIP_TYPE_RADIO_LABELS);

  // Ensure trip type labels are present and visible before interacting
  await labels.first().waitFor({ state: 'visible' });

  // Fail fast if your base locator is wrong (helps debugging a lot)
  const count = await labels.count();
  if (count === 0) {
    throw new Error(
      `Trip type labels not found. Selector: ${SELECTORS.TRIP_TYPE_RADIO_LABELS}`
    );
  }

  const target = labels.filter({ hasText: labelText }).first();
  const matches = await target.count();
  if (matches === 0) {
    throw new Error(
      `Trip type option "${labelText}" not found under selector: ${SELECTORS.TRIP_TYPE_RADIO_LABELS}`
    );
  }

  await target.click();
}

  /**
   * Selects the "One Way" trip type.
   */
  async selectOneWayTrip() {
    await this.clickTripType(/one way/i);
  }

  /**
   * Selects the "Round Trip" trip type.
   */
  async selectRoundTrip() {
    await this.clickTripType(/round trip/i);
  }
}

/**
 * Exporting both:
 * - SearchPage class (default)
 * - SELECTORS (for reuse or debugging if needed)
 */
module.exports = {
  SearchPage,
  SELECTORS
};