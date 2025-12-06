const {
  typeIntoNthAvailableInput, 
  pressTab
} = require('../utils/dom');

// Centralized selectors for SearchPage functionality
const SELECTORS = {
  // User traveler interaction selectors
  TRAVELER_ICON: ".traveler-name",
  IM_THE_TRAVELER_BUTTON: ".imt-btn",
  STAR_ICON: ".star-icon",
  
  // Search and guest management selectors
  SEARCH_BUTTON: "button.search-btn",
  GUEST_TYPE_MODAL_BUTTON: ".add-guest-btn",
  
  // Guest information form selectors
  FIRST_NAME_INPUT: "[placeholder='First Name']",
  LAST_NAME_INPUT: "[placeholder='Last Name']",
  GENDER_DROPDOWN: "div.el-select__selected-item:has-text('Please select gender')",
  GENDER_OPTION_MALE: "role=option[name='Male']",
  DATE_OF_BIRTH_INPUT: "[placeholder='DD/MM/YYYY']",
  EMAIL_INPUT: "[placeholder='Enter email address']",
  PHONE_INPUT: "[placeholder='Enter phone number']",
  ADD_GUEST_MODAL_BUTTON: ".app-footer .add-guest-btn",
  
  // Date picker field selectors for calendar interaction
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  DATE_PICKER_CALENDAR_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DATE_PICKER_MONTH_TABLE: "table.el-date-table",
  DATE_PICKER_AVAILABLE_DAY_CELL: "td.available .el-date-table-cell__text",
  
  // Traveller search and selection selectors
  TRAVELLER_NAME_FIELD: "[placeholder='Search by name, user group, username or email']",
  FIRST_TRAVELLER_OPTION: "[id*='item-0']",
  ADD_ANOTHER_TRAVELLER_BUTTON: ".add-btn .material-symbols-outlined",
  
  // General transportation tabs
  GENERAL_RAIL_TAB: "#tab-rails",

  // Autocomplete suggestion list selector
  AUTOCOMPLETE_LIST: '.el-scrollbar__view.el-autocomplete-suggestion__list li[id*="item-0"]:visible', 
  
  // Location input field selectors with fallback options
  // Flights, Benerail
  FROM_PLACEHOLDER: [
    "input[placeholder='From... Station or Location' i]",
    "input[placeholder='From... Departure' i]",
    "input[placeholder*='From' i]"
  ],
  
  // Flights, Benerail
  TO_PLACEHOLDER: [
    "input[placeholder='To... Station or Location' i]",
    "input[placeholder='To... Destination' i]",
    "input[placeholder*='To' i]"
  ],
  
  // Evolvi, Cars, Benerail
  OR_PLACEHOLDER: [
    "input[placeholder='Enter station or location' i]",
    "input[placeholder='Airport, City or Address' i]",
    "input[placeholder*='or' i]"
  ],

  // Departure field
  DEPARTURE_PLACEHOLDER: "input[placeholder*='Depart']",

  // Return field
  RETURN_PLACEHOLDER: "input[placeholder*='Return']"
};

/**
 * SearchPage class for managing travel search functionality
 * Handles traveler selection, guest information, and location inputs
 */
class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks the traveler icon to open traveler options
  async clickTravelerIcon() {
    console.log('Clicking traveler icon...');
    await this.page.click(SELECTORS.TRAVELER_ICON);
    console.log('Traveler icon clicked successfully');
  }
  
  // Clicks the "Add Another Traveller" button to add more travelers
  async clickAnotherTravellerButton() {
    console.log('Clicking "Add Another Traveller" button...');
    await this.page.click(SELECTORS.ADD_ANOTHER_TRAVELLER_BUTTON);
    console.log('"Add Another Traveller" button clicked successfully');
  }

  // Waits for "I am the traveler" button to load
  async waitForImTheTravelerButton() {
    console.log('Waiting for "I am the traveler" button to be visible...');
    await this.page.waitForSelector(SELECTORS.IM_THE_TRAVELER_BUTTON, { state: "visible" });
    console.log('"I am the traveler" button is now visible');
  }

  // Clicks the "I am the traveler" button to confirm traveler identity
  async clickImTheTraveler() {
    console.log('Clicking "I am the traveler" button...');
    await this.page.click(SELECTORS.IM_THE_TRAVELER_BUTTON);
    console.log('"I am the traveler" button clicked successfully');
  }

  // Waits for the star icon to appear, confirming page readiness
  async waitForStarIcon() {
    console.log('Waiting for star icon...');
    await this.page.waitForSelector(SELECTORS.STAR_ICON, { state: "visible" });
    console.log('Star icon found successfully');
  }

  // Type in the traveller name
  async fillInTravellerName(name) {
    console.log(`Filling traveller name: ${name}`);
    await this.page.fill(SELECTORS.TRAVELLER_NAME_FIELD, name);
    console.log('Traveller name filled successfully');
  }

  // Select the first traveller from the autocomplete suggestions
  async selectFirstTravellerOption() {
    console.log('Selecting first traveller option...');
    await this.page.click(SELECTORS.FIRST_TRAVELLER_OPTION);
    console.log('First traveller option selected successfully');
  }

  // Opens the guest information modal to add traveller details
  async clickGuestTypeModal() {
    console.log('Clicking guest type modal...');
    await this.page.click(SELECTORS.GUEST_TYPE_MODAL_BUTTON);
    console.log('Guest type modal opened successfully');
  }

  // Fills in the traveller's random first name in the guest information form
  async fillInRandomFirstName(firstName) {
    console.log(`Filling first name: ${firstName}`);
    await this.page.fill(SELECTORS.FIRST_NAME_INPUT, firstName);
    console.log('First name filled successfully');
  }

  // Fills in the traveller's random last name in the guest information form
  async fillInRandomLastName(lastName) {
    console.log(`Filling last name: ${lastName}`);
    await this.page.fill(SELECTORS.LAST_NAME_INPUT, lastName);
    console.log('Last name filled successfully');
  }

  // Selects "Male" from the gender dropdown in the guest information form
  async selectGenderMale() {
    console.log('Selecting gender Male...');
    await this.page.locator(SELECTORS.GENDER_DROPDOWN).click();
    await this.page.getByRole('option', { name: 'Male' }).first().click();
    console.log('Gender Male selected successfully');
  }

  // Fills in the traveler's random date of birth in DD/MM/YYYY format
  async fillInRandomDateOfBirth(dateOfBirth) {
    console.log(`Filling date of birth: ${dateOfBirth}`);
    await this.page.fill(SELECTORS.DATE_OF_BIRTH_INPUT, dateOfBirth);
    console.log('Date of birth filled successfully');
  }

  // Fills in the traveler's random email address for booking confirmation
  async fillInRandomEmail(email) {
    console.log(`Filling email: ${email}`);
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
    console.log('Email filled successfully');
  }

  // Fills in the traveler's random phone number for contact purposes
  async fillInRandomPhone(phoneNumber) {
    console.log(`Filling phone number: ${phoneNumber}`);
    await this.page.fill(SELECTORS.PHONE_INPUT, phoneNumber);
    console.log('Phone number filled successfully');
  }

  // Clicks the "Add Guest" button to confirm guest information entry
  async clickToAddGuestModal() {
    console.log('Clicking "Add Guest" button...');
    await this.page.click(SELECTORS.ADD_GUEST_MODAL_BUTTON);
    console.log('"Add Guest" button clicked successfully');
  }
  
  // Fills in departure location into the "From" field
  async fillInFromField(from) {
    console.log(`Filling in "From" field with value: ${from}`);
    const fromSelectors = SELECTORS.FROM_PLACEHOLDER; 
    await typeIntoNthAvailableInput(this.page, from, fromSelectors, 0);
    await this.page.waitForTimeout(1000);
    await pressTab(this.page);
    console.log('"From" field filled successfully');
  }

  // Fills in destination location into the "To" field
  async fillInToField(to) {
    console.log(`Filling in "To" field with value: ${to}`);
    const toSelectors = SELECTORS.TO_PLACEHOLDER; 

    await typeIntoNthAvailableInput(this.page, to, toSelectors, 0);

    // Wait for the suggestion list to appear, adjust selector to your DOM
    const suggestions = this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).first();
    await suggestions.waitFor({ state: 'visible', timeout: 3000 });

    // Now Tab will actually select the first suggestion instead of leaving the field
    await pressTab(this.page);

    await this.page.waitForTimeout(500);
    console.log('"To" field filled and first suggestion selected successfully');
  }

  // Fills in location into the "or" field with specified occurrence
  async fillInOrField(or, occurrence = 1) {
    console.log(`Filling in occurrence #${occurrence} of "or" field with value: ${or}`);
    const orSelectors = SELECTORS.OR_PLACEHOLDER;

    // dom.js helper: 0-based index
    await typeIntoNthAvailableInput(this.page, or, orSelectors, occurrence - 1);

    console.log(`Occurrence #${occurrence} of "or" field filled successfully`);

    await pressTab(this.page);

    await this.page.waitForTimeout(500); // Ensure option is displayed
  }

  // Click the departure date field to open the date picker
  async clickDepartureDateField() {
    console.log('Clicking "Departure Date" field');
    await this.page.locator(SELECTORS.DEPARTURE_PLACEHOLDER).nth(1).click();
    await this.page.waitForTimeout(4000); // Extra wait for calendar stability
    console.log('"Departure Date" field clicked successfully');
  }

  // Click the return date field to open the date picker
  async clickReturnDateField() {
    console.log('Clicking "Return Date" field');
    await this.page.locator(SELECTORS.RETURN_PLACEHOLDER).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('"Return Date" field clicked successfully');
  }

  // Clicks the calendar "next month" arrow; you can set how many months to advance (0 = same month, default = 3)
  async clickCalendarNextArrow(monthsAhead = 3) {
    console.log(`Advancing calendar ${monthsAhead} month(s)...`);

    const nextArrow = this.page.locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW).first();
    await nextArrow.waitFor({ state: 'visible' });

    for (let i = 0; i < monthsAhead; i++) {
      await nextArrow.click();
      await this.page.waitForTimeout(300);
    }

    console.log(`Calendar advanced ${monthsAhead} month(s)`);
  }

  // Executes search by clicking the search button
  async clickSearchButton() {
    console.log('Clicking search button...');
    await this.page.locator(SELECTORS.SEARCH_BUTTON).click();
    console.log('Search button clicked successfully');
  }
  
  // Clicks the rail tab to switch to rail search options
  async clickRailTab() { 
    console.log('Clicking rail tab...');
    await this.page.click(SELECTORS.GENERAL_RAIL_TAB);
    console.log('Rail tab clicked successfully');
  }
}

module.exports = SearchPage;
module.exports.SELECTORS = SELECTORS;