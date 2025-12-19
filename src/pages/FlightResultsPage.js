const { waitForText } = require('../utils/wait');

/**
 * Selectors for the Flight Results screen.
 * Kept minimal on purpose.
 */
const SELECTORS = {
  ADD_TO_TRIP_BUTTON: '.btns-container .add-to-trip',
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
   * Waits until flight results are ready.
   *
   * Why this works:
   * - "Add to trip" only appears when results are fully loaded
   * - Extra timeout improves stability in CI and slower environments
   */
  async waitForAddToTripText() {
    await waitForText(
      this.page,
      SELECTORS.ADD_TO_TRIP_BUTTON,
      'Add to trip'
    );

    // Intentional extra wait to avoid clicking during UI transitions
    await this.page.waitForTimeout(4000);
  }

  /**
   * Waits for Select button to be visible.
   *
   * Why this works:
   * - Select button appears when flight options are loaded
   * - Uses console logging for debugging purposes
   */
  async waitForSelectText() {
    await this.page
      .locator(`${SELECTORS.ADD_TO_TRIP_BUTTON}:has-text("Select")`)
      .first()
      .waitFor({ state: 'visible' });
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
   * Adds the first available flight to the trip.
   *
   * Assumes results are already visible.
   */
  async clickAddToTripFirstFlight() {
    await this.page
      .locator(SELECTORS.ADD_TO_TRIP_BUTTON)
      .first()
      .click();
  }
}

module.exports = FlightResultsPage;