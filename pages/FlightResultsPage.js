const { waitForText } = require('../utils/wait');

class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Add to trip" button to appear and become ready for interaction
  // Includes additional timeout to ensure stable element state
  async waitForAddToTripText() {
    await waitForText(
      this.page,
      '.btns-container .add-to-trip',
      'Add to trip'
    );

    // Extra wait to ensure stability
    await this.page.waitForTimeout(4000);
  }

  // Clicks the "Add to trip" button for the first flight in the search results
  // Selects the first available flight option and adds it to the current trip
  async clickAddToTripFirstFlight() {
    await this.page.locator('.btns-container .add-to-trip').first().click();
  }
}

module.exports = FlightResultsPage;
