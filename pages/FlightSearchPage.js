class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Click on the "Flights" tab
  async clickFlightTab() {
    await this.page.click("#tab-flight > div");
  }

  // Select the "One way" radio option
  async selectOneWayTrip() {
    await this.page.click(
      ".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label"
    );
  }

  // Fill the "From... Departure" field and tab out
  async fillFromDeparture(from) {
    await this.page.type("[placeholder='From... Departure']", from);
    await this.page.keyboard.press("Tab");
  }

  // Fill the "To... Destination" field and tab out
  async fillToDestination(to) {
    await this.page.type("[placeholder='To... Destination']", to);
    await this.page.keyboard.press("Tab");
  }

  // Click the departure date field to open the date picker
  async clickDepartureDateField() {
    await this.page.click("[placeholder='Departure date']");
    await this.page.waitForTimeout(1500);
  }

  // Click the "next month" arrow in the date picker
  async goToNextMonthInCalendar() {
    await this.page.locator('.el-date-picker__next-btn').last().click();
    await this.page.waitForTimeout(500);
    await this.page.locator('.el-date-picker__next-btn').last().click();
    await this.page.waitForTimeout(500);
  }

  // Select a specific departure date cell (same as your original selector)
  async selectDepartureDate() {
    await this.page.locator('td.available:visible').first().click();
    await this.page.waitForTimeout(1000);;
  }
}

module.exports = FlightSearchPage;
