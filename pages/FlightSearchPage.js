class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Validate that 'One way' option is visible
   * @returns {boolean} - True if visible
   */
  async validateOneWayVisible() {
    console.log("Validate 'One way' is displayed");
    const oneWayVisible = await this.page.isVisible('text="One way"');
    console.log(`"One way" is ${oneWayVisible ? 'visible' : 'NOT visible'}`);
    return oneWayVisible;
  }

  /**
   * Fill origin airport and select from dropdown
   * @param {string} airport - Airport code (e.g., 'LHR')
   */
  async fillOrigin(airport) {
    console.log(`Type "${airport}" in From field`);
    await this.page.mcp.fill('From', airport);
    await this.page.waitForTimeout(3000);

    console.log('Select first option for departure');
    await this.page.mcp.selectFromDropdown('first airport option');
  }

  /**
   * Fill destination airport and select from dropdown
   * @param {string} airport - Airport code (e.g., 'MAD')
   */
  async fillDestination(airport) {
    console.log(`Type "${airport}" in To field`);
    await this.page.mcp.fill('To', airport);
    await this.page.waitForTimeout(3000);

    console.log('Select first option for destination');
    await this.page.mcp.selectFromDropdown('first airport option');
  }

  async selectTripType(type = 'one way') {
    console.log(`Click "${type}"`);
    await this.page.mcp.selectTripType(type);
  }

  async selectDepartureDate() {
    console.log("Click departure date field and select date 2 months ahead");
    
    // Click the date input field
    await this.page.locator('input[placeholder="Departure date"]').click();
    await this.page.waitForTimeout(1500);
    
    // Navigate 2 months ahead
    await this.page.locator('.el-date-picker__next-btn').last().click();
    await this.page.waitForTimeout(500);
    await this.page.locator('.el-date-picker__next-btn').last().click();
    await this.page.waitForTimeout(500);
    
    // Click first available date that is visible
    await this.page.locator('td.available:visible').first().click();
    await this.page.waitForTimeout(1000);
  }

  async validateAndAddToTrip() {
    console.log("Validate 'Add to trip' button is displayed");
    const addToTripVisible = await this.page.isVisible('text="Add to trip"', { timeout: 10000 }).catch(() => false);
    console.log(`"Add to trip" button is ${addToTripVisible ? 'visible' : 'NOT visible'}`);

    console.log("Click 'Add to trip' button");
    await this.page.click('text="Add to trip"');
    await this.page.waitForTimeout(2000);
  }

  async fillFlightDetails(origin, destination, tripType = 'one way') {
    await this.fillOrigin(origin);
    await this.fillDestination(destination);
    await this.selectTripType(tripType);
    await this.selectDepartureDate();
  }
}

module.exports = FlightSearchPage;