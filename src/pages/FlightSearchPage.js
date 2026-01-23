// Centralized selectors for easy maintenance
// NOTE: Selectors are intentionally kept as-is (UI-dependent and may be fragile).
const SELECTORS = {
  FLIGHT_TAB: '#tab-flight',
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
    await this.page.locator(SELECTORS.TRIP_TYPE).nth(0).click();
  }

  // Chooses the "By Schedule" option (a flight search mode)
  async selectBySchedule() {
    await this.page.locator(SELECTORS.TRIP_TYPE).nth(1).click();
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