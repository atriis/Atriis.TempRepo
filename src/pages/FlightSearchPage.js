// Centralized selectors for easy maintenance
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  ONE_WAY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  MULTI_CITY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(3) .el-radio__label",
  FROM_DEPARTURE_INPUT: "[placeholder='From... Departure']",
  TO_DESTINATION_INPUT: "[placeholder='To... Destination']",
  DEPARTURE_DATE_INPUT: "input[placeholder*='Depart']",
  RETURN_DATE_INPUT: "[placeholder='Return Date']",
  COMPLETE_TRIP_BUTTON: "label.el-radio input.el-radio__original[value='completeTrip']",
  BY_SCHEDULE_BUTTON: "label.el-radio input.el-radio__original[value='bySchedule']",
  ADVANCED_SEARCH_BUTTON: ".advanced-search-container .btn",
  ALLOW_NEARBY_AIRPORTS_CHECKBOX: ".advanced-search-container .el-checkbox__inner",
};

class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Click "Flights" tab to switch to flight search
  async clickFlightTab() {
    console.log('Clicking flight tab...');
    await this.page.click(SELECTORS.FLIGHT_TAB);
    console.log('Flight tab clicked successfully');
  }

  // Select the "Complete Trip" option
  async selectCompleteTrip() {
    console.log('Selecting "Complete Trip" option...');
    await this.page.locator(SELECTORS.COMPLETE_TRIP_BUTTON).click();
    console.log('"Complete Trip" option selected successfully');
  }

  // Select the "By Schedule" option
  async selectBySchedule() {
    console.log('Selecting "By Schedule" option...');
    await this.page.locator(SELECTORS.BY_SCHEDULE_BUTTON).click();
    console.log('"By Schedule" option selected successfully');
  }

  // Select the "One way" option 
  async selectOneWayTrip() {
    console.log('Selecting "One Way" option...');
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
    console.log('"One Way" option selected successfully');
  }

  // Select the "Round trip" option 
  async selectRoundTrip() {
    console.log('Selecting "Round Trip" option...');
    await this.page.click(SELECTORS.ROUND_TRIP_BUTTON);
    console.log('"Round Trip" option selected successfully');
  }

  // Select the "Multi-city" option 
  async selectMultiCity() {
    console.log('Selecting "Multi-city" option...');
    await this.page.click(SELECTORS.MULTI_CITY_BUTTON);
    console.log('"Multi-city" option selected successfully');
  }

  // Fill the "From... Departure" field and tab out to dismiss suggestions
  async fillFromDeparture(from) {
    console.log(`Filling "From... Departure" field with value: ${from}`);
    await this.page.type(SELECTORS.FROM_DEPARTURE_INPUT, from);
    await this.page.waitForTimeout(500); // Ensure option is displayed
    await this.page.keyboard.press("Tab");
    console.log('"From... Departure" field filled successfully');
  }

  // Fill the "To... Destination" field and tab out to dismiss suggestions
  async fillToDestination(to) {
    console.log(`Filling "To... Destination" field with value: ${to}`);
    await this.page.type(SELECTORS.TO_DESTINATION_INPUT, to);
    await this.page.waitForTimeout(500); // Ensure option is displayed
    await this.page.keyboard.press("Tab");
    console.log('"To... Destination" field filled successfully');
  }

  // Click the departure date field to open the date picker
  async clickDepartureDateField() {
    console.log('Clicking "Departure Date" field');
    await this.page.locator(SELECTORS.DEPARTURE_DATE_INPUT).nth(1).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('"Departure Date" field clicked successfully');
  }

  // Click the return date field to open the date picker
  async clickReturnDateField() {
    console.log('Clicking "Return Date" field');
    await this.page.click(SELECTORS.RETURN_DATE_INPUT);
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('"Return Date" field clicked successfully');
  }

  // Click the "Advanced Search" button to expand advanced options
  async clickAdvancedSearchButton() {
    console.log('Starting clickAdvancedSearchButton');
    await this.page.locator(SELECTORS.ADVANCED_SEARCH_BUTTON).click();
    console.log('Advanced Search button clicked successfully');
  }

  // Toggle the "Allow nearby airports" checkbox
  async toggleAllowNearbyAirportsCheckbox() {
    console.log('Starting toggleAllowNearbyAirportsCheckbox');
    await this.page.locator(SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX).click();
    console.log('Allow nearby airports checkbox toggled successfully');
  }

  // Click the "Add another flight" button in multi-city mode
  async clickAddAnotherFlightButton() {
    console.log('Starting clickAddAnotherFlightButton');
    await this.page.locator(SELECTORS.addAnotherFlightButtonMultiCity).click();
    console.log('Add another flight button clicked successfully');
  }

  // Click the class dropdown to select flight class
  async clickClassDropdown() {
    console.log('Starting clickClassDropdown');
    await this.page.locator(SELECTORS.classDropdown).click();
    console.log('Class dropdown clicked successfully');
  }
}

module.exports = FlightSearchPage;