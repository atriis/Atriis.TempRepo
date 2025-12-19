// Centralized selectors for easy maintenance
// NOTE: Selectors are intentionally kept as-is (UI-dependent and may be fragile).
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
  ONE_WAY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  MULTI_CITY_BUTTON: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(3) .el-radio__label",
  TRIP_TYPE: ".search-for-select  .el-radio",
  ADVANCED_SEARCH_BUTTON: ".advanced-search-container .btn",
  ALLOW_NEARBY_AIRPORTS_CHECKBOX: ".advanced-search-container .el-checkbox__inner",
};

class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Opens the Flight search area in the UI (same as clicking the Flights tab)
  async clickFlightTab() {
    await this.page.click(SELECTORS.FLIGHT_TAB);
  }

  // Chooses the "Complete Trip" option (a flight search mode)
  async selectCompleteTrip() {
    await this.page.locator(SELECTORS.TRIP_TYPE).first.click();
  }

  // Chooses the "By Schedule" option (a flight search mode)
  async selectBySchedule() {
    await this.page.locator(SELECTORS.TRIP_TYPE).nth(1).click();
  }

  // Chooses "One Way" (one departure, no return)
  async selectOneWayTrip() {
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
  }

  // Chooses "Round Trip" (departure + return)
  async selectRoundTrip() {
    await this.page.click(SELECTORS.ROUND_TRIP_BUTTON);
  }

  // Chooses "Multi-city" (multiple flight legs)
  async selectMultiCity() {
    await this.page.click(SELECTORS.MULTI_CITY_BUTTON);
  }

  // Opens the Advanced Search section (more filters/options)
  async clickAdvancedSearchButton() {
    await this.page.locator(SELECTORS.ADVANCED_SEARCH_BUTTON).click();
  }

  // Turns the "Allow nearby airports" option on/off
  async toggleAllowNearbyAirportsCheckbox() {
    await this.page.locator(SELECTORS.ALLOW_NEARBY_AIRPORTS_CHECKBOX).click();
  }
}

module.exports = FlightSearchPage;