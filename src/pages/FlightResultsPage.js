const { waitForText } = require('@utils/wait');

const SELECTORS = {
  CHANGE_FLIGHT_BUTTON: '.change-flight-btn-wrapper'
};

/**
 * FlightResultsPage
 *
 * Low-level interactions with the flight search results UI.
 * This class does NOT contain business logic.
 */
class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the Change Flight button to appear.
   *
   * Used when user needs to modify their flight selection.
   */
  async waitForChangeFlightButton() {
    await waitForText(
      this.page,
      SELECTORS.CHANGE_FLIGHT_BUTTON,
      'Change flight'
    );
  }
}

module.exports = FlightResultsPage;