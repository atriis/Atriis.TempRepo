const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ADD_TO_TRIP_BUTTON: '.btns-container .add-to-trip'
};

class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Add to trip" button to appear and become ready for interaction
  // Includes additional timeout to ensure stable element state
  async waitForAddToTripText() {
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, 'Add to trip');
    await this.page.waitForTimeout(4000); // Extra wait for stability
  }

  // Clicks the "Add to trip" button for the first flight in the search results
  // Selects the first available flight option and adds it to the current trip
  async clickAddToTripFirstFlight() {
    await this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).first().click();
  }
}

module.exports = FlightResultsPage;