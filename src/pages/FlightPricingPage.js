const { waitForText } = require("@utils/wait");

/**
 * Page Object for flight pricing page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  YOUR_SELECTION_TEXT: "section.flight-by-schedule-pricing .best-combination-wrapper .header .title",
};

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
    // Give the page extra time to render after navigation/updates
    await this.page.waitForTimeout(3000);
    
    // Wait for element to exist and be visible first (extended timeout for CI/CD)
    await this.page.locator(SELECTORS.YOUR_SELECTION_TEXT).waitFor({ 
      state: 'visible', 
      timeout: 60000 
    });
    
    // Then verify the exact text content
    await waitForText(
      this.page,
      SELECTORS.YOUR_SELECTION_TEXT,
      "Your selection",
      30000,
    );
  }
}

module.exports = FlightPricingPage;
