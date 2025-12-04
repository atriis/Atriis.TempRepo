
// Centralized selectors for easy maintenance
const SELECTORS = {
  RAIL_TAB: "#tab-rails",
  ONE_WAY_BUTTON: ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON: ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  FROM_STATION_LOCATION_INPUT: "[placeholder='From... Station or Location']",
  TO_STATION_LOCATION_INPUT: "[placeholder='To... Station or Location']",
  DEPARTURE_FIELD: "[placeholder='Departure']",
  RETURN_FIELD: "[placeholder='Return']"
};

class BenerailSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the rail tab to switch to rail booking mode
  async clickRailTab() {
    console.log('Clicking rail tab...');
    await this.page.click(SELECTORS.RAIL_TAB);
    console.log('Rail tab clicked successfully');
  }

  // Selects Benerail search option from the rail dropdown
  // Clicks rail tab first, then selects 'EU Rail' option from the dropdown
  async selectBenerailSearch() {
    console.log('Selecting Benerail search...');
    await this.page.click(SELECTORS.RAIL_TAB);
    await this.page.getByRole('option', { name: 'EU Rail' }).click();
    console.log('Benerail search selected successfully');
  }

  // Selects the "One way" trip option for rail booking
  async selectOneWayTrip() {
    console.log('Selecting one-way trip...');
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
    console.log('One-way trip selected successfully');
  }

  // Selects the "Round trip" trip option for rail booking
  async selectRoundTrip() {
    console.log('Selecting round trip...');
    await this.page.click(SELECTORS.ROUND_TRIP_BUTTON);
    console.log('Round trip selected successfully');
  }

  // Fills the "From" station location field and tabs out to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async fillFromStationLocation(from) {
    console.log(`Filling 'From' station location with: ${from}`);
    await this.page.type(SELECTORS.FROM_STATION_LOCATION_INPUT, from);
    await this.page.waitForTimeout(1000); // Ensure option is displayed
    await this.page.keyboard.press('Tab');
    console.log('From station location filled successfully');
  }

  // Fills the "To" station location field and tabs out to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async fillToStationLocation(to) {
    console.log(`Filling 'To' station location with: ${to}`);
    await this.page.type(SELECTORS.TO_STATION_LOCATION_INPUT, to);
    await this.page.waitForTimeout(1000); // Ensure option is displayed
    await this.page.keyboard.press('Tab');
    console.log('To station location filled successfully');
  }

  // Clicks the departure date field to open the date picker calendar
  async clickDepartureField() {
    console.log('Clicking departure field...');
    await this.page.locator(SELECTORS.DEPARTURE_FIELD).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Departure field clicked successfully');
  }

  // Clicks the return date field to open the date picker calendar
  async clickReturnField() {
    console.log('Clicking return field...');
    await this.page.locator(SELECTORS.RETURN_FIELD).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Return field clicked successfully');
  } 
}

module.exports = BenerailSearchPage;
