require("module-alias/register");
const { getPageObject } = require("@utils/pageObjectCache");
const FlightResultsPage = require("./FlightResultsPage");

const NDC_LABEL_TEXT = "NDC direct rate";
const SELECTORS = {
  FLIGHT_RESULT_CARD: ".flight-list .flight-preview",
  RESULT_NDC_LABEL: `.flight-info-top-bar :text("${NDC_LABEL_TEXT}")`,
  PRICING_OPTION_CARD: ".leg-pricing-option",
  PRICING_OPTION_NDC_LABEL: `p.is-flex.is-align-items-center:has-text("${NDC_LABEL_TEXT}")`,
};

class FlightNdcPage {
  constructor(page) {
    this.page = page;
  }

  _getFlightResultsPage() {
    return getPageObject(this.page, FlightResultsPage);
  }

  async waitForResults(timeout = 60000) {
    await this._getFlightResultsPage().waitForFlightResults(timeout);
  }

  async getResultCardCount() {
    await this.waitForResults();
    return this.page.locator(SELECTORS.FLIGHT_RESULT_CARD).count();
  }

  async getResultsWithNdcLabelCount() {
    await this.waitForResults();
    return this.page.locator(SELECTORS.FLIGHT_RESULT_CARD)
      .filter({ has: this.page.locator(SELECTORS.RESULT_NDC_LABEL) })
      .count();
  }

  getPricingOptionsOverlay() {
    return this._getFlightResultsPage().getPricingOptionsOverlay();
  }

  async waitForPricingOptionsLoaded(timeout = 60000) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: "visible", timeout });
    // Wait for real price data to appear (amount element signals skeleton is gone)
    await overlay.locator(".leg-pricing-option .amount").first().waitFor({ state: "visible", timeout });
    await overlay.locator(SELECTORS.PRICING_OPTION_CARD).first().waitFor({ state: "visible", timeout });
  }

  async getPricingOptionCardCount() {
    await this.waitForPricingOptionsLoaded();
    return this.getPricingOptionsOverlay().locator(SELECTORS.PRICING_OPTION_CARD).count();
  }

  async getPricingOptionsWithNdcLabelCount() {
    await this.waitForPricingOptionsLoaded();
    return this.getPricingOptionsOverlay()
      .locator(SELECTORS.PRICING_OPTION_CARD)
      .filter({ has: this.page.locator(SELECTORS.PRICING_OPTION_NDC_LABEL) })
      .count();
  }
}

module.exports = FlightNdcPage;
