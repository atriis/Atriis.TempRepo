const { extractNumber } = require("@utils/dom");
const { waitForText } = require("@utils/wait");
const { escapeRegExp } = require("@utils/text");

/**
 * Page Object for flight pricing page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  PRICING_PAGE_SECTION: 'section.flight-by-schedule-pricing',
  PRICING_FARE_CARD: '.flight-by-schedule-pricing-option',
  PRICING_FARE_CARD_TITLE: '.header .title',
  PRICING_FARE_PRICE: '.bottom-bar .price',
  PRICING_FARE_ADD_TO_TRIP_BUTTON: '.add-btn',
  PRICING_FARE_AGREEMENT_SECTION: '.more-info',
  PRICING_FARE_AGREEMENT_ICON: '.agreement-icon',
  YOUR_SELECTION_TEXT: "section.flight-by-schedule-pricing .best-combination-wrapper .header .title",
  YOUR_SELECTION_CARD: '.flight-by-schedule-pricing .flight-by-schedule-pricing-option',
  YOUR_SELECTION_CARD_TITLE: '.header .title',
  YOUR_SELECTION_PRICE: '.bottom-bar .price',
  ADDITIONAL_PRICING_OPTIONS_TOGGLE: 'button:has-text("Additional pricing options")',
  ADDITIONAL_PRICING_OPTIONS_WRAPPER: '.additional-pricing-options-wrapper',
  ADDITIONAL_PRICING_OPTIONS_FIRST_CARD: '.additional-pricing-options-wrapper .flight-by-schedule-pricing-option',
  ADDITIONAL_PRICING_OPTIONS_FIRST_ADD_TO_TRIP_BUTTON: '.additional-pricing-options-wrapper .flight-by-schedule-pricing-option .add-btn',
};

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

  /**
   * Expands the Additional pricing options section if it is collapsed.
   */
  async expandAdditionalPricingOptions() {
    const toggle = this.page.locator(SELECTORS.ADDITIONAL_PRICING_OPTIONS_TOGGLE).first();
    const wrapper = this.page.locator(SELECTORS.ADDITIONAL_PRICING_OPTIONS_WRAPPER).first();

    await toggle.waitFor({ state: 'visible', timeout: 30000 });

    if (!(await wrapper.isVisible().catch(() => false))) {
      await toggle.click({ timeout: 30000 });
    }

    await wrapper.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.locator(SELECTORS.ADDITIONAL_PRICING_OPTIONS_FIRST_CARD).first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Clicks Add to trip on the first card under Additional pricing options.
   */
  async clickAddToTripForFirstAdditionalPricingOption() {
    const addButton = this.page.locator(SELECTORS.ADDITIONAL_PRICING_OPTIONS_FIRST_ADD_TO_TRIP_BUTTON).first();
    await addButton.waitFor({ state: 'visible', timeout: 30000 });
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click({ timeout: 30000 });
  }

  /**
   * Checks whether a fare card shows an agreement icon and the expected agreement label.
   *
   * @param {string} fareTitle
   * @param {string} agreementName
   * @returns {Promise<{iconVisible: boolean, labelVisible: boolean}>}
   */
  async getAgreementIndicatorState(fareTitle, agreementName) {
    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    if (!agreementName || typeof agreementName !== 'string') {
      throw new Error('agreementName must be a non-empty string');
    }

    const fareCard = this.getFareCard(fareTitle);
    const agreementSection = fareCard.locator(SELECTORS.PRICING_FARE_AGREEMENT_SECTION).first();
    const agreementIcon = agreementSection.locator(SELECTORS.PRICING_FARE_AGREEMENT_ICON).first();
    const agreementLabel = agreementSection.getByText(agreementName, { exact: true }).first();

    await this.page.locator(SELECTORS.PRICING_PAGE_SECTION).waitFor({ state: 'visible', timeout: 60000 });
    await fareCard.waitFor({ state: 'visible', timeout: 60000 });
    await agreementSection.waitFor({ state: 'visible', timeout: 60000 });

    const iconVisible = await agreementIcon.isVisible().catch(() => false);
    const labelVisible = await agreementLabel.isVisible().catch(() => false);

    return { iconVisible, labelVisible };
  }
  /**
   * Gets all flight time strings displayed on the "Your Selection" pricing page.
   * Uses DOM text-node walking to find any time-like strings (HH:MM or H:MM, with or without AM/PM)
   * within the pricing section — works for both mobile and desktop layouts.
   *
   * @returns {Promise<string[]>} Deduplicated array of time strings found on the page
   */
  async getFlightTimesFromPricingSection() {
    await this.page.locator(SELECTORS.PRICING_PAGE_SECTION).waitFor({ state: 'visible', timeout: 30000 });

    return this.page.evaluate((sectionSelector) => {
      const section = document.querySelector(sectionSelector);
      if (!section) return [];

      const timePattern = /\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\b/gi;
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      const found = new Set();

      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent || '';
        const matches = text.match(timePattern);
        if (matches) {
          matches.forEach((m) => found.add(m.trim()));
        }
      }
      return [...found];
    }, SELECTORS.PRICING_PAGE_SECTION);
  }
}

module.exports = FlightPricingPage;
