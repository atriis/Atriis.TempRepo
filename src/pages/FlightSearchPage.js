// Centralized selectors for easy maintenance
const SELECTORS = {
  flightTab: '#tab-flight',
  oneWayRadio: ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  fromDepartureInput: "[placeholder='From... Departure']",
  toDestinationInput: "[placeholder='To... Destination']",
  departureDateInput: "[placeholder='Departure date']",
  nextMonthArrow: ".el-date-picker__next-btn",
  availableDateCell: "td.available:visible"
};

class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Click on the "Flights" tab to switch to flight booking mode
  async clickFlightTab() {
    await this.page.click(SELECTORS.flightTab);
  }

  // Select the "One way" radio option for flight search
  async selectOneWayTrip() {
    await this.page.click(SELECTORS.oneWayRadio);
  }

  // Fill the "From... Departure" field and tab out to dismiss suggestions
  async fillFromDeparture(from) {
    await this.page.type(SELECTORS.fromDepartureInput, from);
    await this.page.keyboard.press("Tab");
  }

  // Fill the "To... Destination" field and tab out to dismiss suggestions
  async fillToDestination(to) {
    await this.page.type(SELECTORS.toDestinationInput, to);
    await this.page.keyboard.press("Tab");
  }

  // Click the departure date field to open the date picker
  async clickDepartureDateField() {
    await this.page.click(SELECTORS.departureDateInput);
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
  }

  // Click the "next month" arrow twice to navigate forward in the calendar
  async goToNextMonthInCalendar() {
    await this.page.locator(SELECTORS.nextMonthArrow).last().click();
    await this.page.waitForTimeout(500);
    await this.page.locator(SELECTORS.nextMonthArrow).last().click();
    await this.page.waitForTimeout(500);
  }

  // Select the first available departure date cell in the calendar
  async selectDepartureDate() {
    await this.page.locator(SELECTORS.availableDateCell).first().click();
    await this.page.waitForTimeout(1000); // Extra wait for stability
  }
}

module.exports = FlightSearchPage;