const { waitForText } = require('@utils/wait');
/**
 * Selectors for the Flight Results screen.
 * Kept minimal on purpose.
 */
const SELECTORS = {
  YOUR_SELECTION_TEXT: "section.flight-by-schedule-pricing .best-combination-wrapper .header .title",
};

/**
 * FlightPricingPage
 *
 * Low-level interactions with the flight search results UI.
 * This class does NOT contain business logic.
 */
class FlightPricingPage {
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
  async waitForYourSelectionText() {
    await this.page.waitForTimeout(6000);
    await waitForText(
      this.page,
      SELECTORS.YOUR_SELECTION_TEXT,
      'Your selection'
    );

    // Intentional extra wait to avoid clicking during UI transitions
    await this.page.waitForTimeout(4000);
  }
}

module.exports = FlightPricingPage;