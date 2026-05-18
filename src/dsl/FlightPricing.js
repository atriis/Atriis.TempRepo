const { getPageObject } = require("@utils/pageObjectCache");
const FlightPricingPage = require("@pages/FlightPricingPage");
const { CartPage } = require("@pages/CartPage");
const Results = require("./Results");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger").child("FlightPricing-DSL");

/**
 * Finds the first pricing result whose validating/marketing/operating carrier
 * matches the given carrier code. The flightPricing response shape is supplier-
 * specific so we scan the result tree for any string property whose key looks
 * like a carrier field (carrier, airline, validatingCarrier, etc.) and whose
 * value equals the code.
 *
 * @param {Array<object>} results
 * @param {string} carrierCode - IATA carrier code (e.g. "TP", "LH").
 * @returns {object|undefined}
 */
function findResultByCarrier(results, carrierCode) {
  const target = carrierCode.toUpperCase();
  const carrierKeyPattern = /carrier|airline/i;

  function matches(node) {
    if (node === null || node === undefined) return false;
    if (typeof node === 'string') return false;
    if (Array.isArray(node)) return node.some(matches);
    if (typeof node !== 'object') return false;
    for (const [key, value] of Object.entries(node)) {
      if (carrierKeyPattern.test(key) && typeof value === 'string' && value.toUpperCase() === target) {
        return true;
      }
      if (value && typeof value === 'object' && matches(value)) return true;
    }
    return false;
  }

  return results.find(matches);
}

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

  async verifyAgreementIndicatorVisible(page, agreementName = 'Agency') {
    if (!page) {
      throw new Error('page is required');
    }

    if (!agreementName || typeof agreementName !== 'string') {
      throw new Error('agreementName must be a non-empty string, got: ' + agreementName);
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const { iconVisible, labelVisible } = await flightPricingPage.getAgreementIndicatorStateAnywhere(agreementName);

    expect(iconVisible, `Agreement icon should be visible somewhere in the pricing page`).toBe(true);
    expect(labelVisible, `Agreement label "${agreementName}" should be visible somewhere in the pricing page`).toBe(true);

    return { agreementName, iconVisible, labelVisible };
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
   * Verifies the "Separated Tickets" indicator is NOT visible on the pricing page.
   * Used to confirm "Your Selection" is a single-ticket fare.
   * @param {import('playwright').Page} page
   */
  async verifySeparatedTicketsIndicatorNotVisible(page) {
    if (!page) throw new Error('page is required');
    logger.info('Verifying Separated Tickets indicator is NOT shown on pricing page');
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const visible = await flightPricingPage.isSeparatedTicketsIndicatorVisible(3000);
    expect(visible, '"Separated Tickets" indicator should NOT be visible on the pricing page').toBe(false);
    logger.info('Separated Tickets indicator absence verified');
    return { separatedTickets: false, context: 'pricing' };
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

  /**
   * Starts capturing the next flightPricing API response.
   * Must be called BEFORE the user action that triggers the API call (e.g., clicking pricing options).
   * Returns an unresolved Promise — do NOT await in the calling step.
   */
  startCapturingPricingResponse(page) {
    if (!page) throw new Error('page is required');
    logger.info('Setting up flightPricing API response capture');
    const flightPricingPage = getPageObject(page, FlightPricingPage);
    return flightPricingPage.capturePricingApiResponse();
  },

  /**
   * Validates the markup value in a captured flightPricing API response.
   *
   * The markup is configured in the admin panel in a specific currency (typically USD).
   * The response may return the markup in any currency depending on the user's display settings:
   *   - If response.currency === configuredCurrency  → direct equality check (no FX needed).
   *   - If response.currency !== configuredCurrency  → response.markup is in response.currency
   *     and must be converted back to configuredCurrency using response.currencyRate. The
   *     response.displayCurrency MUST equal configuredCurrency, otherwise we cannot verify.
   *
   * @param {import('playwright').Page} page
   * @param {Promise<*>} responsePromise - Captured flightPricing response promise.
   * @param {string} expectedMarkup - Configured markup amount (numeric string, e.g. "15").
   * @param {string|null} configuredCurrency - The currency in which the markup was configured
   *   in the admin panel (e.g. "USD"). Pass null to skip the currency check.
   * @param {string|null} [carrierCode] - Optional carrier code to filter results by (e.g. "TP").
   *   When provided, the first result whose validating/marketing carrier matches is validated
   *   instead of results[0]. Useful when the response mixes different offices/markups.
   */
  async validatePricingResponseMarkup(page, responsePromise, expectedMarkup, configuredCurrency, carrierCode = null) {
    if (!page) throw new Error('page is required');
    if (!responsePromise) throw new Error('responsePromise is required — call startCapturingPricingResponse before the pricing action');
    if (typeof expectedMarkup !== 'string') throw new Error(`expectedMarkup must be a string, got: ${typeof expectedMarkup}`);
    if (configuredCurrency !== null && typeof configuredCurrency !== 'string') {
      throw new Error(`configuredCurrency must be a string or null, got: ${typeof configuredCurrency}`);
    }
    if (carrierCode !== null && (typeof carrierCode !== 'string' || carrierCode.length === 0)) {
      throw new Error(`carrierCode must be a non-empty string or null, got: ${carrierCode}`);
    }

    const flightPricingPage = getPageObject(page, FlightPricingPage);
    const body = await flightPricingPage.readPricingApiResponseBody(responsePromise);

    // Response shape: { results: [...], comparisonTable, cityAirportNameDictionary, ... }
    // Each result has its own markup, currency, currencyRate, officeId, sourceSystem.
    // Different results may come from different offices with different markup configurations,
    // so when a carrierCode is provided we pick the first result whose carrier matches it;
    // otherwise we fall back to results[0] (the cheapest / first pricing option the user opened).
    const results = body && Array.isArray(body.results) ? body.results : Array.isArray(body) ? body : null;
    if (!results || results.length === 0) {
      throw new Error('flightPricing response body has no results array');
    }

    const firstResult = carrierCode
      ? findResultByCarrier(results, carrierCode)
      : results[0];
    if (!firstResult) {
      throw new Error(`No result in flightPricing response matches carrier code "${carrierCode}" (got ${results.length} results)`);
    }
    // The response's `markup` field is already per-pax in `responseCurrency`.
    // Expected values are also expressed per-pax in `configuredCurrency`, so we
    // compare them directly (with FX conversion when currencies differ).
    const actualMarkup = Number(firstResult.markup);
    const paxCount = Number(firstResult.numberOfPassengers) || 1;
    const responseCurrency = firstResult.currency;
    const displayCurrency = firstResult.displayCurrency;
    const currencyRate = Number(firstResult.currencyRate);
    const expected = Number(expectedMarkup);
    // FX rates in the response are a per-call snapshot, so per-pax converted markup
    // can drift a few percent from the configured amount; 10% accommodates normal drift.
    const TOLERANCE_RATIO = 0.10;

    logger.info('Validating markup on first pricing result', {
      perPaxMarkup: actualMarkup,
      paxCount,
      currency: responseCurrency,
      displayCurrency,
      currencyRate: firstResult.currencyRate,
      officeId: firstResult.officeId,
      sourceSystem: firstResult.sourceSystem,
      expectedMarkup,
      configuredCurrency,
    });

    // Direct equality when currencies match (no conversion needed) or when caller does not constrain currency.
    if (!configuredCurrency || responseCurrency === configuredCurrency) {
      expect(
        actualMarkup,
        `Markup per pax should be ${expectedMarkup} ${configuredCurrency || ''} but got ${actualMarkup} ${responseCurrency || ''}`,
      ).toBe(expected);
      logger.info('Markup validation passed (direct match)', { expected, actualMarkup });
      return { markup: expected, currency: configuredCurrency };
    }

    // Currencies differ — markup in response is in responseCurrency, configured in configuredCurrency.
    // Use the response's own currencyRate (responseCurrency → displayCurrency) to convert back.
    if (displayCurrency !== configuredCurrency) {
      throw new Error(
        `Cannot convert markup — configuredCurrency "${configuredCurrency}" matches neither response currency "${responseCurrency}" nor displayCurrency "${displayCurrency}"`,
      );
    }
    if (!Number.isFinite(currencyRate) || currencyRate <= 0) {
      throw new Error(`Cannot convert markup — currencyRate is missing or invalid (${firstResult.currencyRate})`);
    }

    const convertedMarkup = actualMarkup * currencyRate;
    const tolerance = Math.max(expected * TOLERANCE_RATIO, 0.5);

    expect(
      Math.abs(convertedMarkup - expected) <= tolerance,
      `Markup per pax ${actualMarkup} ${responseCurrency} converted to ${convertedMarkup.toFixed(2)} ${configuredCurrency} (rate ${currencyRate}) should be within ${tolerance} of expected ${expected} ${configuredCurrency}`,
    ).toBe(true);

    logger.info('Markup validation passed (FX converted)', {
      expected,
      actualMarkup,
      convertedMarkup,
      currencyRate,
    });
    return { markup: expected, currency: configuredCurrency };
  },
};

module.exports = FlightPricing;
