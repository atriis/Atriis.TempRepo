const { extractNumber } = require("@utils/dom");
const { waitForText } = require("@utils/wait");

/**
 * Page Object for flight pricing page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  PRICING_FARE_CARD: '.flight-by-schedule-pricing-option',
  PRICING_FARE_CARD_TITLE: '.header .title',
  PRICING_FARE_PRICE: '.bottom-bar .price',
  PRICING_FARE_ADD_TO_TRIP_BUTTON: '.add-btn',
  YOUR_SELECTION_TEXT: "section.flight-by-schedule-pricing .best-combination-wrapper .header .title",
  YOUR_SELECTION_CARD: '.flight-by-schedule-pricing .flight-by-schedule-pricing-option',
  YOUR_SELECTION_CARD_TITLE: '.header .title',
  YOUR_SELECTION_PRICE: '.bottom-bar .price',
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class FlightPricingPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets a by-schedule fare card by its title text.
   *
   * @param {string} fareTitle
   * @returns {import('@playwright/test').Locator}
   */
  getFareCard(fareTitle) {
    const fareTitlePattern = new RegExp(`^${escapeRegExp(fareTitle)}$`, 'i');

    return this.page
      .locator(SELECTORS.PRICING_FARE_CARD)
      .filter({
        has: this.page
          .locator(SELECTORS.PRICING_FARE_CARD_TITLE)
          .filter({ hasText: fareTitlePattern }),
      })
      .first();
  }

  /**
   * Waits for a pricing fare title to be visible.
   *
   * @param {string} fareTitle
   */
  async waitForFareTitleText(fareTitle) {
    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    const fareCard = this.getFareCard(fareTitle);

    await this.page.waitForTimeout(3000);
    await fareCard.waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Gets the numeric price from a by-schedule fare card title.
   *
   * @param {string} fareTitle
   * @returns {Promise<number|null>}
   */
  async getFarePrice(fareTitle) {
    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    const fareCard = this.getFareCard(fareTitle);
    await fareCard.waitFor({ state: 'visible', timeout: 30000 });

    return extractNumber(fareCard, SELECTORS.PRICING_FARE_PRICE, 0);
  }

  /**
   * Clicks Add to trip inside a by-schedule fare card.
   *
   * @param {string} fareTitle
   */
  async clickAddToTripForFare(fareTitle) {
    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    const fareCard = this.getFareCard(fareTitle);
    const addButton = fareCard.locator(SELECTORS.PRICING_FARE_ADD_TO_TRIP_BUTTON).first();

    await fareCard.waitFor({ state: 'visible', timeout: 30000 });
    await addButton.waitFor({ state: 'visible', timeout: 30000 });
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click({ timeout: 30000 });
  }

  /**
   * Waits until flight results are ready.
   *
   * Why this works:
   * - "Add to trip" only appears when results are fully loaded
   * - Extra timeout improves stability in CI and slower environments
   */
  async waitForYourSelectionText() {
    await this.waitForFareTitleText('Your selection');

    await waitForText(this.page, SELECTORS.YOUR_SELECTION_TEXT, 'Your selection', 30000);
  }

  /**
   * Gets the numeric price shown in the "Your selection" card on the by-schedule pricing page.
   * @returns {Promise<number|null>}
   */
  async getYourSelectionPrice() {
    return this.getFarePrice('Your selection');
  }
}

module.exports = FlightPricingPage;
