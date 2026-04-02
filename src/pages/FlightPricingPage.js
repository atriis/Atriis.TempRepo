const { extractNumber } = require("@utils/dom");
const { waitForText } = require("@utils/wait");

/**
 * Page Object for flight pricing page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  YOUR_SELECTION_TEXT: "section.flight-by-schedule-pricing .best-combination-wrapper .header .title",
  YOUR_SELECTION_CARD: '.flight-by-schedule-pricing .flight-by-schedule-pricing-option',
  YOUR_SELECTION_CARD_TITLE: '.header .title',
  YOUR_SELECTION_PRICE: '.bottom-bar .price',
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

  /**
   * Gets the numeric price shown in the "Your selection" card on the by-schedule pricing page.
   * @returns {Promise<number|null>}
   */
  async getYourSelectionPrice() {
    const card = this.page
      .locator(SELECTORS.YOUR_SELECTION_CARD)
      .filter({
        has: this.page
          .locator(SELECTORS.YOUR_SELECTION_CARD_TITLE)
          .filter({ hasText: 'Your selection' }),
      })
      .first();

    await card.waitFor({ state: 'visible', timeout: 30000 });
    return extractNumber(card, SELECTORS.YOUR_SELECTION_PRICE, 0);
  }
}

module.exports = FlightPricingPage;
