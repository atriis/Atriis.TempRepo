const { waitForText } = require("@utils/wait");

/**
 * Page Object for evolvi results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  OUTBOUND_TEXT: "h3",
  SUGGESTED_FARES_TEXT: ".price-container.mb-5 .desc",
  CHEAPEST_SUGGESTED_FARE: ".suggested-btn .app-price",
};

class EvolviResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Confirms the Evolvi results page is loaded.
   *
   * Waits until the "Outbound" text is visible, which indicates
   * the outbound results section has been rendered.
   */
  async waitForOutboundText() {
    await waitForText(
      this.page,
      SELECTORS.OUTBOUND_TEXT,
      "Outbound",
    );
  }

  /**
   * Waits until suggested fares are visible.
   *
   * The "Suggested fares" text only appears once fares
   * have finished loading and are ready for interaction.
   */
  async waitForSuggestedFaresText() {
    await waitForText(
      this.page,
      SELECTORS.SUGGESTED_FARES_TEXT,
      "Suggested fares",
    );
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

