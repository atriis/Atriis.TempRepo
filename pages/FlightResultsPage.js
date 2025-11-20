const { waitForText } = require('../utils/wait');

class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  async waitForAddToTripText() {
    await waitForText(
      this.page,
      '.btns-container .add-to-trip',
      'Add to trip'
    );

  // Optional extra wait just to see the state
    await this.page.waitForTimeout(4000);
  }

  async waitForPendingBooking() {
    await waitForText(this.page, ".app-label", "Pending booking");
  }

  // Only the click. No other steps.
  async clickAddToTripFirstFlight() {
    await this.page.locator('.btns-container .add-to-trip').first().click();
  }
}

module.exports = FlightResultsPage;
