const { getPageObject } = require("@utils/pageObjectCache");
const FlightPricingPage = require("@pages/FlightPricingPage");
const { CartPage } = require("@pages/CartPage");
const Results = require("./Results");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger").child("FlightPricing-DSL");

/**
 * FlightPricing DSL
 *
 * High-level actions related to flight pricing and fare selection.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightPricing = {

  async waitForFareTitle(page, fareTitle) {
    if (!page) throw new Error('page is required');
    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error(`fareTitle must be a non-empty string, got: ${typeof fareTitle}`);
    }
    logger.info('Waiting for pricing fare title', { fareTitle });
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    await flightPricingPage.waitForFareTitleText(fareTitle);
  },

  async extractFarePrice(page, fareTitle) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fareTitle || typeof fareTitle !== 'string') {
      throw new Error('fareTitle must be a non-empty string');
    }

    logger.info('Extracting fare price', { fareTitle });
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

    logger.info('Adding fare to cart', { fareTitle });
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const cartPage = getPageObject(page, CartPage);

    await flightPricingPage.waitForFareTitleText(fareTitle);

    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
      flightPricingPage.clickAddToTripForFare(fareTitle),
    ]);

    await Results.clickProceedConflictQuoteModal(page);
    await cartPage.waitForPendingBookingText({ timeout: 90000 });

    logger.info('Fare added to cart', { fareTitle });
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

  /**
   * Verifies the "Separated Tickets" indicator is visible on the pricing page.
   * @param {import('playwright').Page} page
   */
  async verifySeparatedTicketsIndicatorVisible(page) {
    if (!page) throw new Error('page is required');
    logger.info('Verifying Separated Tickets indicator on pricing page');
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const visible = await flightPricingPage.isSeparatedTicketsIndicatorVisible();
    expect(visible, '"Separated Tickets" indicator should be visible on the pricing page').toBe(true);
    logger.info('Separated Tickets indicator verified', { visible });
    return { separatedTickets: true, context: 'pricing' };
  },

  /**
   * Verifies that all flight times on the "Your Selection" pricing page are displayed
   * in 12-hour AM/PM format, guarding against regression of ADO bug #75337.
   *
   * A valid 12-hour time matches: 1:05 PM, 10:30 AM, etc.
   * An invalid 24-hour time looks like: 14:30, 08:00 (no AM/PM suffix).
   *
   * @param {Object} page - Playwright page
   */
  async verifyTimesAreIn12HourFormat(page) {
    if (!page) throw new Error('page is required');

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const timeTexts = await flightPricingPage.getFlightTimesFromPricingSection();

    expect(timeTexts.length, 'Expected at least one flight time element on the pricing page').toBeGreaterThan(0);

    const amPmPattern = /\b\d{1,2}:\d{2}\s*(AM|PM)\b/i;
    const pure24HourPattern = /\b([01]\d|2[0-3]):\d{2}\b(?!\s*(AM|PM))/i;

    for (const text of timeTexts) {
      expect(
        amPmPattern.test(text),
        `Expected time "${text}" to contain AM/PM marker (12-hour format) — bug #75337 regression`
      ).toBe(true);
      expect(
        pure24HourPattern.test(text),
        `Expected time "${text}" NOT to use 24-hour notation without AM/PM — bug #75337 regression`
      ).toBe(false);
    }

    return { verified: true, timeCount: timeTexts.length, times: timeTexts };
  },

  /**
   * Verifies that results-page times are in AM/PM format and that the pricing page
   * also displays times in 12-hour format, guarding cross-page consistency.
   *
   * @param {Object} page - Playwright page
   * @param {string[]} resultsPageTimes - Times collected from the results page step
   */
  async verifyCrossPageTimeFormatConsistency(page, resultsPageTimes) {
    if (!page) throw new Error('page is required');
    if (!Array.isArray(resultsPageTimes) || resultsPageTimes.length === 0) {
      throw new Error('resultsPageTimes must be a non-empty array — run the results page time format step first');
    }

    const amPmPattern = /\b\d{1,2}:\d{2}\s*(AM|PM)\b/i;

    for (const t of resultsPageTimes) {
      expect(amPmPattern.test(t), `Results page time "${t}" should be in AM/PM format`).toBe(true);
    }

    const pricingResult = await FlightPricing.verifyTimesAreIn12HourFormat(page);
    return { resultsTimesCount: resultsPageTimes.length, pricingTimesCount: pricingResult.timeCount };
  },
};

module.exports = FlightPricing;
