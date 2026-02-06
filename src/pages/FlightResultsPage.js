const { waitForText } = require('@utils/wait');

const SELECTORS = {
  CHANGE_FLIGHT_BUTTON: ".change-flight-btn-wrapper",
  SEARCH_FLIGHT_FILTER: "[placeholder='Search flight']"
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

  /**
   * Types text in the search flight filter field.
   *
   * @param {string} text - The text to type in the search filter.
   */
  async typeInSearchFlightFilter(text) {
    await this.page.fill(SELECTORS.SEARCH_FLIGHT_FILTER, text);
  }
}

module.exports = FlightResultsPage;