const { waitForText } = require('@utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  OUTBOUND_TEXT: 'h3',
  SUGGESTED_FARES_TEXT: '.price-container.mb-5 .desc',
  CHEAPEST_SUGGESTED_FARE: '.suggested-btn .app-price',
};

/**
 * EvolviResultsPage
 *
 * Low-level UI interactions on Evolvi results.
 * Quiet and mechanical by design.
 */
class EvolviResultsPage {
  constructor(page) {
    this.page = page;
  }

  /** Confirms Evolvi results page is loaded */
  async waitForOutboundText() {
    await waitForText(this.page, SELECTORS.OUTBOUND_TEXT, 'Outbound');
    await this.page.waitForTimeout(4000); // keep stability wait
  }

  /** Waits until suggested fares are visible */
  async waitForSuggestedFaresText() {
    await waitForText(
      this.page,
      SELECTORS.SUGGESTED_FARES_TEXT,
      'Suggested fares'
    );
    await this.page.waitForTimeout(4000);
  }

  /** Clicks the cheapest suggested fare option */
  async clickCheapestSuggestedFareOption() {
    await this.page
      .locator(SELECTORS.CHEAPEST_SUGGESTED_FARE)
      .first()
      .click();
  }
}

module.exports = EvolviResultsPage;

