const { getPageObject } = require("@utils/pageObjectCache");
const FlightPricingPage = require("@pages/FlightPricingPage");
const { CartPage } = require("@pages/CartPage");
const Results = require("./Results");
const { expect } = require("@playwright/test");

/**
 * FlightPricing DSL
 *
 * High-level actions related to flight pricing and fare selection.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightPricing = {

  async extractFarePrice(page, fareTitle) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    await flightPricingPage.waitForFareTitleText(fareTitle);
    return flightPricingPage.getFarePrice(fareTitle);
  },

  async extractYourSelectionPrice(page) {
    return this.extractFarePrice(page, 'Your selection');
  },

  async addFareToCart(page, fareTitle) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const cartPage = getPageObject(page, CartPage);

    await flightPricingPage.waitForFareTitleText(fareTitle);

    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
      flightPricingPage.clickAddToTripForFare(fareTitle),
    ]);

    await Results.clickProceedConflictQuoteModal(page);
    await cartPage.waitForPendingBookingText({ timeout: 90000 });

    return { added: true, fareTitle };
  },

  async addYourSelectionFareToCart(page) {
    return this.addFareToCart(page, 'Your selection');
  },

  async addFirstAdditionalPricingOptionToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const cartPage = getPageObject(page, CartPage);

    await flightPricingPage.waitForYourSelectionText();
    await flightPricingPage.expandAdditionalPricingOptions();

    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
      flightPricingPage.clickAddToTripForFirstAdditionalPricingOption(),
    ]);

    await Results.clickProceedConflictQuoteModal(page);
    await cartPage.waitForPendingBookingText({ timeout: 90000 });

    return { added: true, fareTitle: 'Additional pricing options (first)' };
  },

  async verifyAgreementIndicatorVisible(page, fareTitle = 'Your selection', agreementName = 'Agency') {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string, got: ' + fareTitle);
    }

    if (!agreementName || typeof agreementName !== 'string') {
      throw new Error('agreementName must be a non-empty string, got: ' + agreementName);
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const { iconVisible, labelVisible } = await flightPricingPage.getAgreementIndicatorState(fareTitle, agreementName);

    expect(iconVisible, `Agreement icon should be visible in pricing fare "${fareTitle}"`).toBe(true);
    expect(labelVisible, `Agreement label "${agreementName}" should be visible in pricing fare "${fareTitle}"`).toBe(true);

    return { fareTitle, agreementName, iconVisible, labelVisible };
  },
};

module.exports = FlightPricing;
