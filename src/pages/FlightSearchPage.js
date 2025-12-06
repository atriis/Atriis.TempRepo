// Centralized selectors for easy maintenance
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  ONE_WAY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  MULTI_CITY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(3) .el-radio__label",
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