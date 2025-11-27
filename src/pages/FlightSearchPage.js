// Centralized selectors for easy maintenance
const SELECTORS = {
  flightTab: '#tab-flight',
  oneWayButton: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  roundTripButton: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  multiCityButton: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(3) .el-radio__label",
  fromDepartureInput: "[placeholder='From... Departure']",
  toDestinationInput: "[placeholder='To... Destination']",
  departureDateInput: "[placeholder='Departure date']",
  departDateInput: "[placeholder='Depart Date']",
  returnDateInput: "[placeholder='Return Date']",
  completeTripButton: "label.el-radio input.el-radio__original[value='completeTrip']",
  byScheduleButton: "label.el-radio input.el-radio__original[value='bySchedule']",
  advancedSearchButton: ".advanced-search-container .btn",
  allowNearbyAirportsCheckbox: ".advanced-search-container .el-checkbox__inner",
  addAnotherFlightButtonMultiCity: ".multi-city .add-flight-btn",
  nextMonthArrow: ".el-date-picker__next-btn",
  availableDateCell: "td.available:visible",
  classDropdown: ".app-columns .line-two .field.app-column.class-input",
};

class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Click "Flights" tab to switch to flight search
  async clickFlightTab() {
    console.log('Clicking flight tab');
    await this.page.click(SELECTORS.flightTab);
    console.log('Flight tab clicked successfully');
  }

  // Select the "Complete Trip" option
  async selectCompleteTrip() {
    console.log('Starting selectCompleteTrip');
    await this.page.locator(SELECTORS.completeTripButton).click();
    console.log('Complete Trip option selected successfully');
  }

  // Select the "By Schedule" option
  async selectBySchedule() {
    console.log('Starting selectBySchedule');
    await this.page.locator(SELECTORS.byScheduleButton).click();
    console.log('By Schedule option selected successfully');
  }

  // Select the "One way" option 
  async selectOneWayTrip() {
    console.log('Selecting One way trip option');
    await this.page.click(SELECTORS.oneWayButton);
    console.log('One way trip option selected successfully');
  }

  // Select the "Round trip" option 
  async selectRoundTrip() {
    console.log('Selecting Round trip option');
    await this.page.click(SELECTORS.roundTripButton);
    console.log('Round trip option selected successfully');
  }

  // Select the "Multi-city" option 
  async selectMultiCity() {
    console.log('Selecting Multi-city option');
    await this.page.click(SELECTORS.multiCityButton);
    console.log('Multi-city option selected successfully');
  }

  // Fill the "From... Departure" field and tab out to dismiss suggestions
  async fillFromDeparture(from) {
    console.log(`Filling "From... Departure" field with value: ${from}`);
    await this.page.type(SELECTORS.fromDepartureInput, from);
    await this.page.keyboard.press("Tab");
    console.log('From departure field filled successfully');
  }

  // Fill the "To... Destination" field and tab out to dismiss suggestions
  async fillToDestination(to) {
    console.log(`Filling "To... Destination" field with value: ${to}`);
    await this.page.type(SELECTORS.toDestinationInput, to);
    await this.page.keyboard.press("Tab");
    console.log('To destination field filled successfully');
  }

  // Click the departure date field to open the date picker
  async clickDepartureDateField() {
    console.log('Clicking "Departure Date" field');
    await this.page.click(SELECTORS.departureDateInput);
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Departure date field clicked successfully');
  }

  // Click the "next month" arrow twice to navigate forward in the calendar
  async goToNextMonthInCalendar() {
    console.log('Navigating to next month in calendar');
    await this.page.locator(SELECTORS.nextMonthArrow).last().click();
    await this.page.waitForTimeout(500);
    await this.page.locator(SELECTORS.nextMonthArrow).last().click();
    await this.page.waitForTimeout(500);
    console.log('Navigated to next month in calendar successfully');
  }

  // Select the first available departure date cell in the calendar
  async selectDepartureDate() {
    console.log('Selecting first available departure date');
    await this.page.locator(SELECTORS.availableDateCell).first().click();
    await this.page.waitForTimeout(1000); // Extra wait for stability
    console.log('Departure date selected successfully');
  }

  // Click the depart date field to open the date picker
  async clickDepartDateField() {
    console.log('Clicking "Depart Date" field');
    await this.page.click(SELECTORS.departDateInput);
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Depart date field clicked successfully');
  }

  // Click the return date field to open the date picker
  async clickReturnDateField() {
    console.log('Clicking "Return Date" field');
    await this.page.click(SELECTORS.returnDateInput);
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Return date field clicked successfully');
  }

  // Click the "Advanced Search" button to expand advanced options
  async clickAdvancedSearchButton() {
    console.log('Starting clickAdvancedSearchButton');
    await this.page.locator(SELECTORS.advancedSearchButton).click();
    console.log('Advanced Search button clicked successfully');
  }

  // Toggle the "Allow nearby airports" checkbox
  async toggleAllowNearbyAirportsCheckbox() {
    console.log('Starting toggleAllowNearbyAirportsCheckbox');
    await this.page.locator(SELECTORS.allowNearbyAirportsCheckbox).click();
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