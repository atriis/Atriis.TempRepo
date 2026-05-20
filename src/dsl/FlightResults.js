const { expect } = require("@playwright/test");
const FlightResultsPage = require("@pages/FlightResultsPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");
const { CommonPage } = require("@src/pages/CommonPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { expectNumbersToBeEqualWithTolerance } = require("../assertions/numberAssertions");
const {
  extractCurrencySymbol,
  getCurrencyCodeFromSymbol,
  getCurrencySymbolFromCode,
  getCurrencyConversionTolerance,
  getExchangeRate,
  normalizeCurrencyCode,
} = require("../utils/currencyConversion");

function extractDayToken(dateText) {
  if (!dateText || typeof dateText !== 'string') {
    throw new Error('dateText must be a non-empty string');
  }

  const match = dateText.match(/\b(\d{1,2})\b/);
  if (!match) {
    throw new Error(`Could not extract day token from date text: ${dateText}`);
  }

  return match[1];
}

/**
 * FlightResults DSL
 *
 * High-level actions related to flight search results.
 * Describes WHAT the user does, not HOW the UI works.
 */
const FlightResults = {
  /**
   * Checks whether flight results are available.
   *
   * Useful for:
   * - conditional flows
   * - negative test scenarios
   */
  async isResultDisplayed(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    const timeout = 120000;
    const startTime = Date.now();

    try {
      if (await flightResultsPage.isResultsLoaderVisible()) {
        await flightResultsPage.waitForResultsLoaderToFinish(timeout);
      }

      if (await flightResultsPage.isResultsSkeletonVisible()) {
        await flightResultsPage.waitForResultsSkeletonToFinish(timeout);
      }

      const remainingTimeout = Math.max(1000, timeout - (Date.now() - startTime));
      await flightResultsPage.waitForFlightResults(remainingTimeout);
      return true;
    } catch {
      const remainingTimeout = Math.max(1000, timeout - (Date.now() - startTime));

      try {
        await resultsPage.waitForNoResults(remainingTimeout);
        return false;
      } catch {
        return false;
      }
    }
  },

  /**
   * Waits for a visible alert on the flight results page.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Exact alert text
   * @returns {Promise<{visible: boolean, expectedText: string}>}
   */
  async verifyAlertTextDisplayed(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAlertText(expectedText);

    return { visible: true, expectedText };
  },

  /**
   * Hovers over the first disabled add-to-trip button in results and returns the tooltip text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async hoverAddToTripButtonAndGetTooltipText(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.hoverFirstAddToTripButtonInResults();

    const tooltipText = await flightResultsPage.getVisibleTooltipText();
    expect(tooltipText).toBeTruthy();

    return tooltipText;
  },

  /**
   * Verifies that the add-to-trip tooltip text contains the expected text.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>}
   */
  async verifyAddToTripTooltipContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getVisibleTooltipText();

    expect(actualText).toContain(expectedText);

    return actualText;
  },

  /**
   * Hovers over the office-hours restriction icon and returns the tooltip title text.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async hoverTimeLimitIconAndGetBookingRestrictedMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.hoverOfficeHoursRestrictionInfoIcon();

    const message = await flightResultsPage.getOfficeHoursRestrictionTooltipTitle();
    expect(message).toBeTruthy();

    return message;
  },

  /**
   * Verifies that the office-hours restriction tooltip title contains the expected text.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<string>}
   */
  async verifyBookingRestrictedMessageContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getOfficeHoursRestrictionTooltipTitle();

    expect(actualText).toContain(expectedText);

    return actualText;
  },

  /**
   * Verifies the CO2 Squake tooltip is available from the first result card.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, resultTooltipText: string}>}
   */
  async verifyCO2SquakeTooltipInResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const expectedText = 'Emissions are calculated per passenger in the selected class of service.';
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.openResultsCO2Tooltip();
    const resultTooltipText = await flightResultsPage.getCO2TooltipDescription();
    expect(resultTooltipText).toBe(expectedText);
    await flightResultsPage.closeCO2Tooltip();

    return { visible: true, resultTooltipText };
  },

  /**
   * Verifies that a flight-comparison row has no visible prices.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stopLabel - Comparison row label
   * @returns {Promise<{stopLabel: string, priceCount: number}>}
   */
  async verifyComparisonRowHasNoPrices(page, stopLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!stopLabel || typeof stopLabel !== 'string') {
      throw new Error('stopLabel must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceCount = await flightResultsPage.getComparisonPriceCount(stopLabel);

    expect(priceCount, `Expected "${stopLabel}" comparison row to have no prices, got ${priceCount}`).toBe(0);

    return { stopLabel, priceCount };
  },

  /**
   * Verifies that a flight-comparison row has at least one visible price.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} stopLabel - Comparison row label
   * @returns {Promise<{stopLabel: string, priceCount: number}>}
   */
  async verifyComparisonRowHasPrices(page, stopLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!stopLabel || typeof stopLabel !== 'string') {
      throw new Error('stopLabel must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceCount = await flightResultsPage.getComparisonPriceCount(stopLabel);

    expect(priceCount, `Expected "${stopLabel}" comparison row to have prices`).toBeGreaterThan(0);

    return { stopLabel, priceCount };
  },

  /**
   * Hides the comparison table from flight results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{hidden: boolean}>}
   */
  async hideComparisonTable(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.waitForComparisonTable();
    await flightResultsPage.waitForComparisonToggleText('Hide Comparison');
    await flightResultsPage.clickComparisonToggle();
    await flightResultsPage.waitForComparisonToggleText('Show Comparison');

    return { hidden: true };
  },

  /**
   * Shows the comparison table from flight results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean}>}
   */
  async showComparisonTable(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();
    await flightResultsPage.waitForComparisonToggleText('Show Comparison');
    await flightResultsPage.clickComparisonToggle();
    await flightResultsPage.waitForComparisonTable();
    await flightResultsPage.waitForComparisonToggleText('Hide Comparison');

    return { visible: true };
  },

  /**
   * Verifies the comparison toggle label.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{expectedText: string, actualText: string}>}
   */
  async verifyComparisonToggleText(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForComparisonToggleText(expectedText);
    const actualText = await flightResultsPage.getComparisonToggleText();

    expect(actualText).toBe(expectedText);

    return { expectedText, actualText };
  },

  /**
   * Verifies the comparison table is visible and the toggle label matches.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedText
   * @returns {Promise<{tableVisible: boolean, expectedText: string}>}
   */
  async verifyComparisonTableVisibleWithToggleText(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForComparisonTable();
    await this.verifyComparisonToggleText(page, expectedText);

    return { tableVisible: true, expectedText };
  },

  /**
   * Verifies the stops filter is visible in flight results.
   * @param {import('playwright').Page} page
   */
  async verifyStopsFilterVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopsFilterVisible();
    expect(visible, 'Stops filter should be visible in flight results').toBe(true);
    return { visible: true };
  },

  /**
   * Verifies that the first flight result highlights the expected airport codes.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} airportCodes - Airport codes expected to be marked
   * @returns {Promise<{airportCodes: string[], markedCodes: string[]}>}
   */
  async verifyMarkedAirportCodesInFirstResult(page, airportCodes) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Array.isArray(airportCodes) || airportCodes.length === 0) {
      throw new Error('airportCodes must be a non-empty array, got: ' + JSON.stringify(airportCodes));
    }

    const normalizedCodes = airportCodes.map((airportCode) => {
      if (!airportCode || typeof airportCode !== 'string') {
        throw new Error('each airport code must be a non-empty string, got: ' + airportCode);
      }

      return airportCode.trim().toUpperCase();
    });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const markedCodes = (await flightResultsPage.getMarkedLocationCodesInFirstFlightResult())
      .map((airportCode) => airportCode.toUpperCase());

    expect(markedCodes, 'Expected the first flight result to highlight the requested airport changes')
      .toEqual(expect.arrayContaining(normalizedCodes));

    return { airportCodes: normalizedCodes, markedCodes };
  },

  /**
   * Verifies that a per-leg airport filter route label is visible.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @returns {Promise<{routeLabel: string}>}
   */
  async verifyAirportFilterRouteLabelVisible(page, routeLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForAirportRouteLabel(routeLabel);

    return { routeLabel };
  },

  /**
   * Verifies that the expected airport filter sections are visible under a route label.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @param {string[]} sectionTitles
   * @returns {Promise<{routeLabel: string, sectionTitles: string[]}>}
   */
  async verifyAirportFilterSectionsVisible(page, routeLabel, sectionTitles) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    if (!Array.isArray(sectionTitles) || sectionTitles.length === 0) {
      throw new Error('sectionTitles must be a non-empty array, got: ' + JSON.stringify(sectionTitles));
    }

    const resultsPage = getPageObject(page, ResultsPage);
    for (const sectionTitle of sectionTitles) {
      if (!sectionTitle || typeof sectionTitle !== 'string') {
        throw new Error('each sectionTitle must be a non-empty string, got: ' + sectionTitle);
      }

      await resultsPage.waitForAirportSection(routeLabel, sectionTitle);
    }

    return { routeLabel, sectionTitles };
  },

  /**
   * Applies route-scoped airport filters by airport code.
   *
   * @param {import('playwright').Page} page
   * @param {string} routeLabel
   * @param {Array<{sectionTitle: string, airportCode: string}>} selections
   * @returns {Promise<{routeLabel: string, selections: Array<{sectionTitle: string, airportCode: string}>}>}
   */
  async filterByAirportCodesForRoute(page, routeLabel, selections) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!routeLabel || typeof routeLabel !== 'string') {
      throw new Error('routeLabel must be a non-empty string');
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      throw new Error('selections must be a non-empty array, got: ' + JSON.stringify(selections));
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForFlightResults();

    for (const selection of selections) {
      if (!selection || typeof selection !== 'object') {
        throw new Error('each selection must be an object, got: ' + selection);
      }

      const { sectionTitle, airportCode } = selection;
      if (!sectionTitle || typeof sectionTitle !== 'string') {
        throw new Error('sectionTitle must be a non-empty string, got: ' + sectionTitle);
      }

      if (!airportCode || typeof airportCode !== 'string') {
        throw new Error('airportCode must be a non-empty string, got: ' + airportCode);
      }

      await resultsPage.selectAirportOption(routeLabel, sectionTitle, airportCode);

      await Promise.any([
        flightResultsPage.waitForFlightResults(),
        resultsPage.waitForNoResultsTitle('No results found'),
      ]);
    }

    return { routeLabel, selections };
  },

  /**
   * Verifies that the first flight result displays the requested original-currency symbol.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, priceText: string}>}
   */
  async verifyOriginalCurrencySymbolVisibleInResults(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceText = await flightResultsPage.getFirstFlightResultPriceText();

    expect(priceText, 'Expected the first flight result to display the original currency symbol')
      .toContain(currencySymbol);

    return { currencySymbol, priceText };
  },

  /**
   * Verifies that the pricing options drawer displays the requested original-currency symbol.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, originalPriceTexts: string[]}>}
   */
  async verifyOriginalCurrencySymbolVisibleInPricingOptions(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const originalPriceTexts = await flightResultsPage.getPricingOptionsOriginalPriceTexts();

    expect(
      originalPriceTexts.some((text) => text.includes(currencySymbol)),
      `Expected pricing options to display the original currency symbol ${currencySymbol}`,
    ).toBe(true);

    return { currencySymbol, originalPriceTexts };
  },

  async extractFirstFlightResultDisplayAndOriginalPrices(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFirstFlightResultDisplayAndOriginalPriceValues();
  },

  async extractFirstFlightResultDisplayAndOriginalPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstFlightResultDisplayAndOriginalPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first flight result display price'),
      originalCurrencySymbol: extractCurrencySymbol(priceData.originalPriceText, 'first flight result original price'),
    };
  },

  async extractFirstFlightResultDisplayPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstFlightResultDisplayPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first flight result display price'),
    };
  },

  async verifyFirstPricingOptionMatchesStoredFlightResultPrices(page, expectedPrices) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedPrices || typeof expectedPrices !== 'object') {
      throw new Error('expectedPrices must be an object');
    }

    const { displayPrice, originalPrice } = expectedPrices;

    if (typeof displayPrice !== 'number' || Number.isNaN(displayPrice)) {
      throw new Error(`expectedPrices.displayPrice must be a valid number, got: ${displayPrice}`);
    }

    if (typeof originalPrice !== 'number' || Number.isNaN(originalPrice)) {
      throw new Error(`expectedPrices.originalPrice must be a valid number, got: ${originalPrice}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualPrices = await flightResultsPage.getFirstPricingOptionDisplayAndOriginalPriceValues();

    expectNumbersToBeEqualWithTolerance(
      actualPrices.displayPrice,
      displayPrice,
      0.02,
      'Pricing options display price vs stored flight result display price',
    );

    expectNumbersToBeEqualWithTolerance(
      actualPrices.originalPrice,
      originalPrice,
      0.02,
      'Pricing options original price vs stored flight result original price',
    );

    return { expectedPrices, actualPrices };
  },

  async verifyFirstPricingOptionDisplayPriceMatchesStored(page, expectedDisplayPrice) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof expectedDisplayPrice !== 'number' || Number.isNaN(expectedDisplayPrice)) {
      throw new Error(`expectedDisplayPrice must be a valid number, got: ${expectedDisplayPrice}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualDisplayPrice = await flightResultsPage.getAmountPriceValuePricingOptions(0);

    if (typeof actualDisplayPrice !== 'number' || Number.isNaN(actualDisplayPrice)) {
      throw new Error(`Could not read first pricing option display price, got: ${actualDisplayPrice}`);
    }

    expectNumbersToBeEqualWithTolerance(
      actualDisplayPrice,
      expectedDisplayPrice,
      0.02,
      'First pricing option display price vs stored flight result display price',
    );

    return { expectedDisplayPrice, actualDisplayPrice };
  },

  async extractFirstPricingOptionDisplayAndOriginalPriceData(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceData = await flightResultsPage.getFirstPricingOptionDisplayAndOriginalPriceData();

    return {
      ...priceData,
      displayCurrencySymbol: extractCurrencySymbol(priceData.displayPriceText, 'first pricing option display price'),
      originalCurrencySymbol: extractCurrencySymbol(priceData.originalPriceText, 'first pricing option original price'),
    };
  },

  async verifyStoredPriceMatchesCurrencyConversion(
    page,
    displayPriceEntry,
    originalPriceEntry,
    locationLabel,
    expectedOriginalCurrencyCode,
    expectedDisplayCurrencyCode,
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!displayPriceEntry || typeof displayPriceEntry !== 'object') {
      throw new Error('displayPriceEntry must be an object');
    }

    if (!originalPriceEntry || typeof originalPriceEntry !== 'object') {
      throw new Error('originalPriceEntry must be an object');
    }

    if (!locationLabel || typeof locationLabel !== 'string') {
      throw new Error('locationLabel must be a non-empty string');
    }

    const { amount: displayAmount, currencySymbol: displayCurrencySymbol } = displayPriceEntry;
    const { amount: originalAmount, currencySymbol: originalCurrencySymbol } = originalPriceEntry;

    if (typeof displayAmount !== 'number' || Number.isNaN(displayAmount)) {
      throw new Error(`displayPriceEntry.amount must be a valid number, got: ${displayAmount}`);
    }

    if (typeof originalAmount !== 'number' || Number.isNaN(originalAmount)) {
      throw new Error(`originalPriceEntry.amount must be a valid number, got: ${originalAmount}`);
    }

    const normalizedExpectedOriginalCurrencyCode = normalizeCurrencyCode(
      expectedOriginalCurrencyCode,
      'expectedOriginalCurrencyCode',
    );
    const normalizedExpectedDisplayCurrencyCode = normalizeCurrencyCode(
      expectedDisplayCurrencyCode,
      'expectedDisplayCurrencyCode',
    );

    const displayCurrencyCode = getCurrencyCodeFromSymbol(displayCurrencySymbol);
    const originalCurrencyCode = getCurrencyCodeFromSymbol(originalCurrencySymbol);

    expect(
      originalCurrencyCode,
      `${locationLabel} original currency should be ${normalizedExpectedOriginalCurrencyCode} (${getCurrencySymbolFromCode(normalizedExpectedOriginalCurrencyCode)}) but extracted ${originalCurrencySymbol}`,
    ).toBe(normalizedExpectedOriginalCurrencyCode);

    expect(
      displayCurrencyCode,
      `${locationLabel} display currency should be ${normalizedExpectedDisplayCurrencyCode} (${getCurrencySymbolFromCode(normalizedExpectedDisplayCurrencyCode)}) but extracted ${displayCurrencySymbol}`,
    ).toBe(normalizedExpectedDisplayCurrencyCode);

    const exchangeRate = await getExchangeRate(
      normalizedExpectedOriginalCurrencyCode,
      normalizedExpectedDisplayCurrencyCode,
    );
    const expectedConvertedAmount = Number((originalAmount * exchangeRate).toFixed(2));
    const tolerance = getCurrencyConversionTolerance(expectedConvertedAmount);

    expectNumbersToBeEqualWithTolerance(
      displayAmount,
      expectedConvertedAmount,
      tolerance,
      `${locationLabel} converted price ${originalCurrencyCode}->${displayCurrencyCode}`,
    );

    return {
      locationLabel,
      displayAmount,
      displayCurrencyCode,
      expectedDisplayCurrencyCode: normalizedExpectedDisplayCurrencyCode,
      originalAmount,
      originalCurrencyCode,
      expectedOriginalCurrencyCode: normalizedExpectedOriginalCurrencyCode,
      exchangeRate,
      expectedConvertedAmount,
      tolerance,
    };
  },

  /**
   * Verifies that pricing options are displayed in ascending (lowest-to-highest) price order.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{verified: boolean, amounts: number[]}>}
   */
  async verifyPricingOptionsInAscendingOrder(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const amounts = await flightResultsPage.getAllPricingOptionAmounts();

    if (amounts.length < 2) {
      throw new Error(`Expected at least 2 pricing options to verify order, got: ${amounts.length}`);
    }

    for (let i = 1; i < amounts.length; i++) {
      expect(
        amounts[i],
        `Expected pricing option ${i + 1} (${amounts[i]}) to be >= pricing option ${i} (${amounts[i - 1]})`,
      ).toBeGreaterThanOrEqual(amounts[i - 1]);
    }

    return { verified: true, amounts };
  },

  async verifyPricingOptionsPriceIsPerTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const resultsPerTravelerPrice = await flightResultsPage.getFirstFlightResultPriceValue();
    const pricingOptionsPrice = await flightResultsPage.getAmountPriceValuePricingOptions(0);
    const hasPerTravellerLabel = await flightResultsPage.isPricingOptionsPerTravellerLabelVisible();

    if (pricingOptionsPrice == null) {
      throw new Error('Could not extract pricing options price from the first option');
    }

    expect(hasPerTravellerLabel, 'Expected the pricing options drawer to display the per-traveller indicator').toBe(true);
    expectNumbersToBeEqualWithTolerance(
      pricingOptionsPrice,
      resultsPerTravelerPrice,
      0.02,
      'Pricing options price vs results per-traveler price',
    );

    return { resultsPerTravelerPrice, pricingOptionsPrice, hasPerTravellerLabel };
  },

  /**
   * Verifies the cabin class shown on the first pricing option card matches
   * the expected class name (case-insensitive) and is not rendered as
   * "undefined". Guards against the brandDesc-missing rendering bug.
   *
   * @param {Object} page - Playwright page object
   * @param {string} expectedClass - Expected cabin class label, e.g. "Business"
   * @param {number} index - Zero-based pricing option index (default: 0)
   * @returns {Promise<{verified: true, cabinClassText: string}>}
   */
  async verifyCabinClassInPricingOptions(page, expectedClass, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!expectedClass || typeof expectedClass !== 'string') {
      throw new Error('expectedClass must be a non-empty string, got: ' + expectedClass);
    }
    if (typeof index !== 'number' || index < 0) {
      throw new Error('index must be a non-negative number, got: ' + index);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const cabinClassText = await flightResultsPage.getPricingOptionsCabinClassText(index);

    expect(
      cabinClassText.toLowerCase(),
      `Cabin class on pricing option #${index} should not contain "undefined" — got "${cabinClassText}"`,
    ).not.toContain('undefined');

    expect(
      cabinClassText.toLowerCase(),
      `Cabin class on pricing option #${index} should contain "${expectedClass}" — got "${cabinClassText}"`,
    ).toContain(expectedClass.toLowerCase());

    return { verified: true, cabinClassText };
  },

  async extractTotalPriceFromFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFlightDetailsTotalPrice();
  },

  async verifyFlightDetailsPriceIsTotalForAllPax(page, perTravelerPrice, travelerCount, flightDetailsTotalPrice = null) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof perTravelerPrice !== 'number' || Number.isNaN(perTravelerPrice)) {
      throw new Error(`perTravelerPrice must be a valid number, got: ${perTravelerPrice}`);
    }

    if (!Number.isInteger(travelerCount) || travelerCount < 1) {
      throw new Error(`travelerCount must be a positive integer, got: ${travelerCount}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualTotalPrice = flightDetailsTotalPrice ?? await flightResultsPage.getFlightDetailsTotalPrice();
    const expectedTotalPrice = perTravelerPrice * travelerCount;

    expectNumbersToBeEqualWithTolerance(
      actualTotalPrice,
      expectedTotalPrice,
      0.02,
      `Flight details total price vs per-traveler price x ${travelerCount}`,
    );

    return { perTravelerPrice, travelerCount, expectedTotalPrice, actualTotalPrice };
  },

  /**
   * Opens the share quote email dialog from the first flight result, verifies that the
   * email preview contains the requested original-currency symbol, then closes the dialog.
   *
   * @param {import('playwright').Page} page
   * @param {string} currencySymbol - Expected currency symbol, e.g. "$"
   * @returns {Promise<{currencySymbol: string, found: boolean}>}
   */
  async verifyOriginalCurrencyInShareQuoteFromResults(page, currencySymbol) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!currencySymbol || typeof currencySymbol !== 'string') {
      throw new Error('currencySymbol must be a non-empty string');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    const cartPage = getPageObject(page, CartPage);

    // Enter share mode and select the first result quote
    await FlightResults.waitForAddToTripButtonAndClickShareButton(page);
    await resultsPage.clickShareQuoteButton(1);
    await resultsPage.clickShareQuoteToGetEmailPopUp();
    await commonPage.waitForSubjectLabelSharePopUp();

    // Verify the email preview contains the currency symbol
    const found = await cartPage.sharePreviewContainsText(currencySymbol);
    expect(found, `Expected share quote email preview to contain the currency symbol "${currencySymbol}"`).toBe(true);

    // Close the share dialog so the test can continue
    await cartPage.closeShareDialog();

    return { currencySymbol, found };
  },

  /**
   * Adds the first flight result to the cart.
   *
   * This flow:
   * - waits for results
   * - adds the first flight
   * - handles conflict quote modal if it appears
   * - waits until the cart shows "Pending booking"
   *
   * Returns a simple status object so callers can assert intent,
   * not UI details.
   */
  async addFirstFlightToCart(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const cartPage = getPageObject(page, CartPage);

    await Results.waitAndClickAddToTripButton(page);

    // Some suppliers show a conflict modal; handle it defensively
    await Results.clickProceedConflictQuoteModal(page);

    // Ensure the flight is now present in the cart
    await cartPage.waitForPendingBookingText();

    return { added: true };
  },

  async extractFirstFlightResultSegmentDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFirstResultFlightSegmentSummaries();
  },

  /**
   * Selects a single flight segment by schedule.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>}
   */
  async selectOneSegmentBySchedule(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    await Results.waitAndClickSelectButton(page);

    return { selected: true };
  },

  async verifySelectFlightButtonVisible(page) {
    if (!page) throw new Error('page is required');

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.waitForSelectText();
    return { visible: true };
  },

  async verifyAddToTripAndPricingOptionsNotVisible(page) {
    if (!page) throw new Error('page is required');

    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    const addToTripVisible = await resultsPage.getAddToTripButton().isVisible();
    expect(addToTripVisible, '"Add to trip" button should not be visible').toBe(false);

    const pricingOptionsVisible = await flightResultsPage.isPricingOptionsButtonVisible();
    expect(pricingOptionsVisible, '"Pricing Options" button should not be visible').toBe(false);

    return { addToTripVisible: false, pricingOptionsVisible: false };
  },

  async confirmPricingOptionForCurrentSegment(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.confirmBySchedulePricingSelection();

    return { confirmed: true };
  },

  /**
   * Selects both segments for a round-trip flight by schedule.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>}
   */
  async selectSegmentsBySchedule(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    // Select first segment
    await this.selectOneSegmentBySchedule(page);
    await flightResultsPage.waitForChangeFlightButton();

    // Select second segment
    await this.selectOneSegmentBySchedule(page);

    return { selected: true };
  },

  /**
   * Waits for flight results, clicks the main Share button, and waits for the share dialog to appear.
   * Use when sharing all visible flight results (not filtered by carrier).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{clicked: boolean}>}
   */
  async waitForAddToTripButtonAndClickShareButton(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const resultsPage = getPageObject(page, ResultsPage);

    await Promise.any([
      resultsPage.waitForAddToTripText(),
      resultsPage.waitForSelectText(),
      resultsPage.waitForShareMainButton(),
    ]);

    await resultsPage.clickShareMainButton();
    return { clicked: true };
  },

  /**
   * Clicks a share quote button from results share mode using the UI-visible button number.
   *
   * @param {import('playwright').Page} page
   * @param {number} buttonNumber - UI-visible share button number (1-based)
   * @returns {Promise<{clicked: boolean, buttonNumber: number}>}
   */
  async clickShareQuoteButtonInResults(page, buttonNumber) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(buttonNumber) || buttonNumber < 1) {
      throw new Error(`buttonNumber must be an integer >= 1, got: ${buttonNumber}`);
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickShareQuoteButton(buttonNumber);

    return { clicked: true, buttonNumber };
  },

  /**
   * Navigates to a specific by-schedule flight segment using the stepper.
   *
   * @param {import('playwright').Page} page
   * @param {number} segmentNumber - UI-visible segment number (1-based)
   * @returns {Promise<{clicked: boolean, segmentNumber: number}>}
   */
  async clickByScheduleFlightSegment(page, segmentNumber) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Number.isInteger(segmentNumber) || segmentNumber < 1) {
      throw new Error(`segmentNumber must be an integer >= 1, got: ${segmentNumber}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickByScheduleFlightSegment(segmentNumber);

    return { clicked: true, segmentNumber };
  },

  /**
   * Verifies that the currently active by-schedule leg matches the expected
   * route and that flight results are visible for it.
   *
   * @param {import('playwright').Page} page
   * @param {string} leg - Leg code in "FROM-TO" format (e.g. "GLA-AMS")
   * @returns {Promise<{leg: string, activeTitle: string}>}
   */
  async verifyByScheduleLegHasResults(page, leg) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof leg !== 'string' || !/^[A-Za-z]{3}-[A-Za-z]{3}$/.test(leg)) {
      throw new Error(`leg must be a "FROM-TO" code (e.g. "GLA-AMS"), got: ${leg}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const activeTitle = await flightResultsPage.getActiveByScheduleLegTitle();
    const [from, to] = leg.toUpperCase().split('-');
    const expected = `${from} to ${to}`;
    const normalized = activeTitle.toUpperCase();

    if (normalized !== expected.toUpperCase() && !(normalized.includes(from) && normalized.includes(to))) {
      throw new Error(
        `Expected active by-schedule leg to be "${expected}", but stepper shows "${activeTitle}"`
      );
    }

    await flightResultsPage.waitForFlightResults(60000);

    return { leg, activeTitle };
  },

  /**
   * Waits for a field label to be visible in the share dialog.
   *
   * @param {import('playwright').Page} page
   * @param {string} fieldLabel
   * @returns {Promise<{visible: boolean, fieldLabel: string}>}
   */
  async waitForFieldInShareDialog(page, fieldLabel) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!fieldLabel || typeof fieldLabel !== 'string') {
      throw new Error('fieldLabel must be a non-empty string');
    }

    const commonPage = getPageObject(page, CommonPage);
    await commonPage.waitForFieldLabelSharePopUp(fieldLabel);

    return { visible: true, fieldLabel };
  },

  /**
   * Exits share mode by clicking the X button on the share bar.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async exitShareMode(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    await resultsPage.clickExitShareModeButton();
  },

  /**
   * Filters flight results by carrier, extracts the price, and shares that quote.
   * Use for sharing a quote from a specific carrier (e.g., KLM, Air France).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} carrier - Carrier name to filter
   * @param {number} index - Index of the result to share (default: 0 for first result)
   * @returns {Promise<{price: number, shared: boolean}>} The price and share status
   */
  async getPriceAndShareQuoteFromCarrier(page, carrier, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!carrier || typeof carrier !== 'string') {
      throw new Error('carrier must be a non-empty string');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const resultsPage = getPageObject(page, ResultsPage);
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Filter by carrier
    await flightResultsPage.typeInSearchFlightFilter(carrier);
    
    // Necessary wait to ensure results are filtered before interacting
    await page.waitForTimeout(1000);
    
    // Get price from the filtered result (index 0 = first filtered result)
    const price = await resultsPage.getAmountPriceValueResults(index);
    
    // Share the same result (index + 1 because share buttons include disabled main button at index 0)
    await resultsPage.clickShareQuoteButton(index + 1);
    
    return { price, shared: true };
  },

  /**
   * Shares the first two available flight quotes from results by email.
   * Mirrors the legacy Testim flow for simple multi-quote sharing from results.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{shared: boolean, quotesSelected: number}>}
   */
  async shareFirstTwoQuotesByEmailFromResults(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const resultsPage = getPageObject(page, ResultsPage);
    const commonPage = getPageObject(page, CommonPage);

    await FlightResults.waitForAddToTripButtonAndClickShareButton(page);

    // Index 0 is the disabled share entry in this results share mode.
    await resultsPage.clickShareQuoteButton(1);
    await resultsPage.clickShareQuoteButton(2);
    await resultsPage.clickShareQuoteToGetEmailPopUp();
    await commonPage.waitForSubjectLabelSharePopUp();

    return { shared: true, quotesSelected: 2 };
  },

  /**
   * Scrolls to each shared flight offer in the share dialog and extracts their prices.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{sharedPrice1: number, sharedPrice2: number}>} The prices of the two shared offers
   */
  // TODO: Locator needs to be created
  async scrollIntoOffersAndGetPrices(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const commonPage = getPageObject(page, CommonPage);
    
    // Scroll to make both offers visible in the share dialog
    await commonPage.scrollIntoViewOffer(1);
    await commonPage.getPriceFromEmailOffer(3);
    await commonPage.scrollIntoViewOffer(2);
    await commonPage.getPriceFromEmailOffer(7);
    
    // Extract prices from the shared offers (indices 1 and 2 skip the first price element)
    const sharedPrice1 = await commonPage.getPriceFromEmailOffer(3);
    const sharedPrice2 = await commonPage.getPriceFromEmailOffer(7);
    
    return { sharedPrice1, sharedPrice2 };
  },

  /**
   * Selects the first pricing option by clicking "Select to share" button.
   * Assumes pricing options modal is already open.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{selected: boolean}>} Selection status
   */
  async selectToShareFirstPricingOption(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Click "Select to share" button for first pricing option
    await flightResultsPage.waitForSelectToShareButton();
    await flightResultsPage.clickSelectToShareButton();
    
    return { selected: true };
  },

  async selectFirstPricingOptionInModal(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Click "Select" button for first pricing option
    await flightResultsPage.waitForSelectButtonInPricingOptionsModal();
    await flightResultsPage.clickSelectButtonInPricingOptionsModal();
    
    return { selected: true };
  },

  /**
   * Selects a pricing option in the open modal at the given zero-based index.
   * Used by tests that need to pick a specific fare (e.g. the second fare).
   * @param {import('playwright').Page} page
   * @param {number} index - Zero-based index of the pricing option
   * @returns {Promise<{ selected: true, index: number }>}
   */
  async selectPricingOptionInModalByIndex(page, index) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.waitForSelectButtonInPricingOptionsModal(index);
    await flightResultsPage.clickSelectButtonInPricingOptionsModal(index);

    return { selected: true, index };
  },

  /**
   * Selects a cabin-class tab in the top section of the pricing options modal.
   * The tab labels are the cabin class names (Economy / Premium Eco / Business / First),
   * and matching is done by substring so passing "Premium" selects "Premium Eco".
   *
   * @param {import('playwright').Page} page
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @returns {Promise<{ selected: true, cabinName: string }>}
   */
  async selectCabinClassFromPricingOptionsTop(page, cabinName) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error('cabinName must be a non-empty string, got: ' + cabinName);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickPricingOptionsCabinClassTabByName(cabinName);

    return { selected: true, cabinName };
  },

  async clickToOpenPricingOptions(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightResults(90000);
    await flightResultsPage.waitForPricingOptionsButton(index, 90000);
    await flightResultsPage.clickPricingOptionsButton(index);
  },

  /**
   * Verifies the pricing options header contains the expected fare text.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedText - Expected text inside the pricing options header
   * @returns {Promise<{expectedText: string, actualText: string}>}
   */
  async verifyPricingOptionsHeaderContains(page, expectedText) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getPricingOptionsHeaderText();

    expect(actualText).toContain(expectedText);

    return { expectedText, actualText };
  },

  /**
   * Verifies the "Brand information is currently unavailable." message is
   * displayed inside the currently open branded fares drawer. The same drawer
   * component renders in three contexts (results flight-details, pricing
   * options, and cart flight-details), so a single verification works for all.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{ visible: boolean }>}
   */
  async verifyBrandInformationUnavailable(page, { timeout = 15000 } = {}) {
    if (!page) throw new Error('page is required');
    if (typeof timeout !== 'number' || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isBrandInformationUnavailableVisible(timeout);

    expect(
      visible,
      'Expected "Brand information is currently unavailable." message to be visible in branded fares drawer',
    ).toBe(true);

    return { visible };
  },

  /**
   * Verifies that a specific brand name is visible in pricing options.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} expectedBrandName - Brand name expected in the pricing options drawer
   * @returns {Promise<{expectedBrandName: string, brandNames: string[]}>}
   */
  async verifyPricingOptionsBrandDisplayed(page, expectedBrandName) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!expectedBrandName || typeof expectedBrandName !== 'string') {
      throw new Error('expectedBrandName must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const brandNames = await flightResultsPage.getPricingOptionsBrandNames();

    expect(
      brandNames.some((brandName) => brandName.toLowerCase() === expectedBrandName.toLowerCase()),
      `Expected pricing options brands to include "${expectedBrandName}", got: ${brandNames.join(', ')}`,
    ).toBe(true);

    return { expectedBrandName, brandNames };
  },

  /**
   * Verifies that each multi-city segment is visible in pricing options and can be selected in sequence.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string[]} segmentRoutes - Array of routes in FROM-TO format
   * @returns {Promise<{verified: boolean, segmentRoutes: string[]}>}
   */
  async verifyMultiCitySegmentsVisibleInPricingOptions(page, segmentRoutes) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!Array.isArray(segmentRoutes) || segmentRoutes.length < 2) {
      throw new Error(`segmentRoutes must be an array of at least 2 routes, got: ${JSON.stringify(segmentRoutes)}`);
    }

    const normalizedRoutes = segmentRoutes.map((route, index) => {
      if (!route || typeof route !== 'string') {
        throw new Error(`segmentRoutes[${index}] must be a non-empty string`);
      }

      return route.toUpperCase().split('-').map((part) => part.trim()).join(' - ');
    });

    const flightResultsPage = getPageObject(page, FlightResultsPage);
  await flightResultsPage.waitForPricingOptionsTabCount(normalizedRoutes.length, 60000);
  const tabCount = await flightResultsPage.getPricingOptionsTabCount();

    expect(
      tabCount,
      `Expected at least ${normalizedRoutes.length} pricing options tabs, got: ${tabCount}`,
    ).toBeGreaterThanOrEqual(normalizedRoutes.length);

    for (let index = 0; index < normalizedRoutes.length; index += 1) {
      await flightResultsPage.waitForPricingOptionsTabRouteText(index, normalizedRoutes[index]);
      await flightResultsPage.waitForSelectButtonInPricingOptionsModal();
      await flightResultsPage.clickSelectButtonInPricingOptionsModal();

      await flightResultsPage.waitForPricingOptionsTabGreenIcon(index);

      if (index < normalizedRoutes.length - 1) {
        await flightResultsPage.waitForPricingOptionsTabRouteText(index + 1, normalizedRoutes[index + 1]);
      }
    }

    return { verified: true, segmentRoutes: normalizedRoutes };
  },

  /**
   * Shares the selected pricing option and closes the modal.
   * 
   * Flow:
   * - Click share quote button from pricing options
   * - Close the pricing options modal
   * - Wait for share action to complete
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{shared: boolean}>} Share status
   */
  async shareFromPricingOptions(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    
    // Share the quote
    await flightResultsPage.clickPricingOptionsShareQuoteButton();
    
    // Wait for share action to process
    await page.waitForTimeout(1000);
    
    // Close the pricing options drawer
    await flightResultsPage.clickXToClosePricingOptionsModal();
    
    // Wait for drawer close animation and for results to update
    await page.waitForTimeout(500);
    
    return { shared: true };
  },

  /**
   * Gets the fare rules note text from the fare rules drawer.
   * Returns the text for validation in step definitions.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>} The fare rules note text
   */
  async getFareRulesNoteText(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return await flightResultsPage.getFareRulesNote().textContent();
  },

  /**
   * Opens the fare rules drawer and waits for the note to render.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   * @returns {Promise<void>}
   */
  async clickToOpenFareRules(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    // Open the fare rules drawer and wait for its content to be visible.
    await flightResultsPage.waitForFareRulesButton(index);
    await flightResultsPage.clickFareRulesButton(index);
    await flightResultsPage.waitForFareRulesNote();
  },

  async clickToOpenFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFlightDetailsButton();
    await flightResultsPage.clickFlightDetailsButton();
    await flightResultsPage.waitForFlightDetailsHeadline();
  },

  /**
   * Opens the seat preview drawer from flight results and waits for it to load.
   * Accepts either a rendered seat map or the unavailable-state panel.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the Seats button (default: 0)
   * @returns {Promise<{opened: boolean, state: 'map' | 'unavailable'}>}
   */
  async openSeatMapFromResults(page, index = 0) {
    if (!page) {
      throw new Error('page is required');
    }

    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForSeatsButton(index);
    await flightResultsPage.clickSeatsButton(index);
    const state = await flightResultsPage.waitForSeatMapOrUnavailableState();
    return { opened: true, state };
  },

  /**
   * Verifies the preview-only message in the results seat drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<string>}
   */
  async verifySeatPreviewOnlyMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const expectedMessage = 'Preview only. Seat selection available at checkout.';
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualMessage = await flightResultsPage.getSeatPreviewOnlyMessage();

    expect(actualMessage).toBe(expectedMessage);
    return actualMessage;
  },

async clickToOpenFareRulesFromResultsModal(page) {
  if (!page) {
    throw new Error('page is required');
  }
  const flightResultsPage = getPageObject(page, FlightResultsPage);

  // Try flight details drawer first, then pricing options overlay
  const flightDetailsDrawer = page.locator("[aria-label='Flight details']");
  const isFlightDetailsOpen = await flightDetailsDrawer.isVisible().catch(() => false);

  if (isFlightDetailsOpen) {
    await flightResultsPage.waitAndClickFareRulesButtonInFlightDetails();
  } else {
    await flightResultsPage.waitAndClickFareRulesButtonInPricingOptions(0);
  }
  await flightResultsPage.waitForFareRulesNote();
},

  /**
   * Clicks a leg tab inside the already-open fare rules drawer.
   * Tabs are displayed at the top of the drawer (e.g. BRU-FRA, FRA-DFW, DFW-BRU).
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {number} index - Zero-based index of the leg tab
   * @returns {Promise<void>}
   */
  async clickFareRulesLegTab(page, index) {
    if (!page) {
      throw new Error('page is required');
    }
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got: ${index}`);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitForFareRulesLegTab(index);
    await flightResultsPage.clickFareRulesLegTab(index);
    await flightResultsPage.waitForFareRulesNote();
  },

/**
 * Checks if the green circle icon is displayed in the pricing options modal.
 * Returns visibility status for validation in step definitions.
 * This icon indicates a successful selection of a pricing option.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {number} index - Zero-based index of the icon (default: 0)
 * @returns {Promise<boolean>} True if icon is visible
 */
async isGreenCircleIconVisibleInPricingOptions(page, index = 0) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }
  
  const flightResultsPage = getPageObject(page, FlightResultsPage);
  
  // Wait for the green icon to appear
  await flightResultsPage.waitForGreenIconPricingOptionsModal(index);
  
  // Return visibility status
  return await flightResultsPage.getGreenIconInPricingOptions(index).isVisible();
},

async verifyFareComponentTextColorInPricingOptions(page, expectedColor, index = 0) {
  if (!page) {
    throw new Error('page is required');
  }

  if (!expectedColor || typeof expectedColor !== 'string') {
    throw new Error(`expectedColor must be a non-empty string, got: ${typeof expectedColor}`);
  }

  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }

  const flightResultsPage = getPageObject(page, FlightResultsPage);
  const actualColor = await flightResultsPage.getFareComponentTextColorInPricingOptions(index);

  expect(actualColor).toBe(expectedColor);
},

 async selectFareWithBaggage(page, baggageText) {
  if (!page) {
    throw new Error('page is required');
  }
  
  const resultsPage = getPageObject(page, FlightResultsPage);
  await resultsPage.clickSelectForFareWithBaggagePricingOptions(baggageText);
},

  /**
   * Scrolls to the Flight Duration filter title.
   * Useful for ensuring the filter is in view before interacting with it.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async scrollToFlightDurationTitle(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.getFlightDurationTitle().scrollIntoViewIfNeeded();
  },

  /**
   * Scrolls to the Flight Duration filter title for a specific location.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} location - The location text (e.g., "Depart from London", "Depart from Madrid")
   * @returns {Promise<void>}
   */
  async scrollToFlightDurationFromLocationTitle(page, location) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!location || typeof location !== 'string') {
      throw new Error('location must be a non-empty string');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.getFlightDurationFromLocationTitle(location).scrollIntoViewIfNeeded();
  },

  /**
   * Asserts that the Flight Duration filter title is visible.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<void>}
   */
  async assertFlightDurationTitleVisible(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await expect(flightResultsPage.getFlightDurationTitle()).toBeVisible();
  },

  /**
   * Asserts that the Flight Duration filter title for a specific location is visible.
   * 
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} location - The location text (e.g., "Depart from London", "Depart from Madrid")
   * @returns {Promise<void>}
   */
  async assertFlightDurationFromLocationVisible(page, location) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!location || typeof location !== 'string') {
      throw new Error('location must be a non-empty string');
    }
    
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await expect(
      flightResultsPage.getFlightDurationFromLocationTitle(location)
    ).toBeVisible();
  },

  /**
   * Adjusts the Limit Layover Duration filter by moving its lower bound to the midpoint.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{adjusted: boolean, originalRangeText: string, targetStartMinutes: number}>}
   */
  async adjustLimitLayoverDurationFilterFromMidpoint(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const result = await flightResultsPage.adjustLimitLayoverDurationFilterFromMidpoint();

    await flightResultsPage.waitForFlightResults();

    return result;
  },

  /**
   * Extracts the arrival date text from a flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Thu, 11 Dec"
   */
  async extractFlightArrivalDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightArrivalDate(cardIndex);
  },

  /**
   * Extracts the departure date text from a flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Mon, 15 Dec"
   */
  async extractFlightDepartureDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightDepartureDate(cardIndex);
  },

  /**
   * Extracts the departure location code from a flight result card segment.
   *
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based result card index (default: 0)
   * @param {number} segmentIndex - Zero-based segment index within the card (default: 0)
   * @returns {Promise<string>} Departure location code like "SEA"
   */
  async extractFlightDepartureLocationCode(page, cardIndex = 0, segmentIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getFlightDepartureLocationCode(cardIndex, segmentIndex);
  },

  /**
   * Extracts the inbound (return) departure date from a round-trip flight result card.
   * @param {Object} page - Playwright page
   * @param {number} cardIndex - Zero-based index (default: 0)
   * @returns {Promise<string>} Date text like "Mon, 15 Dec"
   */
  async extractInboundFlightDepartureDate(page, cardIndex = 0) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    return flightResultsPage.getInboundFlightDepartureDate(cardIndex);
  },

  /**
   * Verifies the first round-trip result reflects the edited departure and return dates.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} expectedDepartureDate - Edited departure date value from the search form
   * @param {string} expectedReturnDate - Edited return date value from the search form
   */
  async verifyResultsReflectEditedDates(page, expectedDepartureDate, expectedReturnDate) {
    if (!page) throw new Error('page is required');
    if (!expectedDepartureDate || typeof expectedDepartureDate !== 'string') {
      throw new Error('expectedDepartureDate must be a non-empty string');
    }
    if (!expectedReturnDate || typeof expectedReturnDate !== 'string') {
      throw new Error('expectedReturnDate must be a non-empty string');
    }

    const expectedDepartureDay = extractDayToken(expectedDepartureDate);
    const expectedReturnDay = extractDayToken(expectedReturnDate);
    const actualDepartureDate = await this.extractFlightDepartureDate(page, 0);
    const actualReturnDate = await this.extractInboundFlightDepartureDate(page, 0);

    expect(actualDepartureDate).toContain(expectedDepartureDay);
    expect(actualReturnDate).toContain(expectedReturnDay);

    return {
      actualDepartureDate,
      actualReturnDate,
      expectedDepartureDay,
      expectedReturnDay,
    };
  },

  /**
   * Verifies the first result reflects the edited departure location.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} expectedDepartureLocation - Updated departure location code
   */
  async verifyResultsReflectUpdatedDepartureLocation(page, expectedDepartureLocation) {
    if (!page) throw new Error('page is required');
    if (!expectedDepartureLocation || typeof expectedDepartureLocation !== 'string') {
      throw new Error('expectedDepartureLocation must be a non-empty string');
    }

    const actualDepartureLocation = await this.extractFlightDepartureLocationCode(page, 0, 0);
    expect(actualDepartureLocation.toUpperCase()).toBe(expectedDepartureLocation.trim().toUpperCase());

    return {
      actualDepartureLocation,
      expectedDepartureLocation: expectedDepartureLocation.trim().toUpperCase(),
    };
  },

  // ===== CODESHARE / OPERATED BY =====

  /**
   * Verifies "Operated by" text is visible in the first flight result.
   * @param {import('playwright').Page} page
   */
  async verifyOperatedByInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isFlightOperatorVisibleInResults();
    expect(isVisible).toBe(true);
  },

  /**
   * Verifies "Operated by" text is visible in the flight details drawer.
   * @param {import('playwright').Page} page
   */
  async verifyOperatedByInFlightDetails(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isFlightOperatorVisibleInDrawer();
    expect(isVisible).toBe(true);
  },

  // ===== BRANDED FARES =====

  /**
   * Opens branded fares from the flight details drawer and verifies ancillaries text.
   * Flight details drawer must already be open.
   * @param {import('playwright').Page} page
   */
  async openBrandedFaresAndVerifyAncillaries(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.clickBrandedFaresButtonInDetails();
    await flightResultsPage.waitForBrandedFaresDrawer();
  },

  /**
   * Closes the branded fares drawer.
   * @param {import('playwright').Page} page
   */
  async closeBrandedFaresDrawer(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.closeBrandedFaresDrawer();
  },

  /**
   * Verifies that the branded fare ancillaries text is visible.
   * @param {import('playwright').Page} page
   */
  async verifyAncillariesTextVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const isVisible = await flightResultsPage.isAncillariesTextVisible();
    expect(isVisible).toBe(true);
  },

  /**
   * Opens branded fares from the pricing options drawer.
   * The pricing options drawer must already be open.
   * Clicks the brand name link in the first leg pricing option.
   * @param {import('playwright').Page} page
   */
  async openBrandedFaresFromPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);

    await flightResultsPage.clickBrandNameInPricingOptions();
    await flightResultsPage.waitForBrandedFaresDrawer();
  },

  /**
   * Verifies carrier name text in the more details drawer.
   * @param {import('playwright').Page} page
   * @param {string} expectedName - Expected carrier name (e.g., "Iberia")
   */
  async verifyCarrierNameInDetails(page, expectedName) {
    if (!page) throw new Error('page is required');
    if (typeof expectedName !== 'string') throw new Error('expectedName must be a string, got: ' + typeof expectedName);
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actual = await flightResultsPage.getCarrierNameInDetails();
    expect(actual).toContain(expectedName);
  },

  /**
   * Verifies the EU Rail options banner is visible in flight results.
   * @param {import('playwright').Page} page
   */
  async verifyRailBannerVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isRailBannerVisible();
    expect(visible, 'Rail banner should be visible in flight results').toBe(true);
  },

  /**
   * Verifies the "Separated Tickets" indicator is visible in flight results.
   * This tag appears when split rules apply and the system issues tickets per carrier.
   * @param {import('playwright').Page} page
   */
  async verifySeparatedTicketsIndicatorVisible(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isSeparatedTicketsIndicatorVisible();
    expect(visible, '"Separated Tickets" indicator should be visible in flight results').toBe(true);
  },

  /**
   * Verifies the agreement indicator is visible in the first flight result.
   * @param {import('playwright').Page} page
   */
  async verifyAgreementIndicatorVisibleInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isAgreementIndicatorVisibleInFirstResult();
    expect(visible, 'Agreement indicator should be visible in the first flight result').toBe(true);
  },

  /**
   * Verifies a flight result displays the expected info label (e.g. "NDC direct rate").
   * @param {import('playwright').Page} page
   * @param {string} expectedText - The expected label text
   * @param {number} flightIndex - 1-based index of the flight result (default: 1)
   */
  async verifyFlightResultInfoLabel(page, expectedText, flightIndex = 1) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);
    }
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const labelText = await flightResultsPage.getFlightResultInfoLabel(flightIndex);
    expect(labelText, `Flight result ${flightIndex} should display "${expectedText}" label`).toBe(expectedText);
  },

  /**
   * Verifies the Marine Fare icon (anchor) is visible in flight results.
   * @param {import('playwright').Page} page
   */
  async verifyMarineFareIconVisibleInResults(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isMarineFareIconVisible();
    expect(visible, 'Marine Fare icon should be visible in flight results').toBe(true);
  },

  /**
   * Verifies the Marine Fare icon (anchor) is visible in pricing options.
   * @param {import('playwright').Page} page
   */
  async verifyMarineFareIconVisibleInPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isMarineFareIconVisibleInPricingOptions();
    expect(visible, 'Marine Fare icon should be visible in pricing options').toBe(true);
  },

  /**
   * Verifies the agreement indicator is visible in the first pricing option.
   * @param {import('playwright').Page} page
   */
  async verifyAgreementIndicatorVisibleInPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isAgreementIndicatorVisibleInPricingOptions();
    expect(visible, 'Agreement indicator should be visible in the first pricing option').toBe(true);
  },

  /**
   * Verifies that all flight results are from a specific airline.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @param {string} airlineName - Expected airline name (e.g., "British Airways")
   * @returns {Promise<void>}
   */
  async verifyAllResultsFromAirline(page, airlineName) {
    if (!page) throw new Error('page is required');
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error('airlineName must be a non-empty string');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const names = await flightResultsPage.getAllCarrierNamesInResults();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name).toBe(airlineName);
    }
  },

  // ===== ADVISORY VERIFICATION =====

  /**
   * Hovers over the advisory icon in flight results and verifies the tooltip text.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - Expected tooltip text (e.g. "Mixed transportation")
   */
  async verifyAdvisoryTooltipText(page, expectedText) {
    if (!page) throw new Error('page is required');
    if (!expectedText || typeof expectedText !== 'string') throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.hoverAdvisoryIcon();
    const isVisible = await flightResultsPage.isAdvisoryTooltipVisible(expectedText);
    expect(isVisible, `Expected advisory tooltip to contain "${expectedText}"`).toBeTruthy();
  },

  /**
   * Verifies the full mixed transportation advisory in flight details:
   * (1) Each segment shows a transport equipment icon (flight, directions_railway, directions_bus)
   * (2) Connection messages display "Connection: Change transportation" with "Change to {type}..."
   * (3) Connection advisory icon matches the next segment's transport type
   * @param {import('playwright').Page} page
   */
  async verifyFlightDetailsConnectionAdvisory(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);

    const validIcons = ['flight', 'directions_railway', 'directions_bus'];

    // 1. Verify connection advisory messages exist with "Change transportation"
    const hasAdvisory = await flightResultsPage.hasConnectionAdvisoryInDetails();
    expect(hasAdvisory, 'Expected flight details to contain a connection advisory with "Change transportation"').toBeTruthy();

    const advisories = await flightResultsPage.getFlightDetailsConnectionAdvisories();
    expect(advisories.length, 'Expected at least one connection advisory message').toBeGreaterThan(0);
    for (const advisory of advisories) {
      // Verify message contains "Connection" context and "Change to {transport type}" instruction
      expect(advisory.text, `Connection advisory should contain "Change to", got: "${advisory.text}"`).toContain('Change to');
      expect(advisory.text, `Connection advisory should reference transport change context, got: "${advisory.text}"`).toMatch(/change\s+to/i);
      // Verify the advisory icon is a valid transport icon (train/bus/flight)
      if (advisory.icon) {
        expect(validIcons, `Advisory icon "${advisory.icon}" should be a valid transport icon`).toContain(advisory.icon);
      }
    }

    // 2. Verify per-segment equipment icons
    const segments = await flightResultsPage.getFlightDetailsSegmentEquipment();
    expect(segments.length, 'Expected at least 2 segments for a mixed itinerary').toBeGreaterThanOrEqual(2);

    const hasMultipleTypes = new Set(segments.map(s => s.icon)).size > 1;
    expect(hasMultipleTypes, `Expected mixed transport types across segments, but all segments have the same icon: ${segments[0]?.icon}`).toBeTruthy();

    for (const segment of segments) {
      expect(validIcons, `Segment equipment icon "${segment.icon}" should be one of: ${validIcons.join(', ')}`).toContain(segment.icon);
    }

    // 3. Verify connection advisory icon matches the next segment's transport type
    const connectionIcons = await flightResultsPage.getConnectionAdvisoryIcons();
    expect(connectionIcons.length, 'Expected at least one connection advisory icon').toBeGreaterThan(0);
    for (const icon of connectionIcons) {
      expect(validIcons, `Connection advisory icon "${icon}" should be a valid transport icon`).toContain(icon);
    }
  },

  /**
   * Verifies that the share email preview contains equipment information for flight segments.
   * Checks that segment/equipment text (aircraft names or transport types) appears in the preview.
   * @param {import('playwright').Page} page
   */
  async verifyShareEmailContainsEquipment(page) {
    if (!page) throw new Error('page is required');

    const cartPage = getPageObject(page, CartPage);

    // Extract equipment values from the share email HTML
    const equipmentValues = await cartPage.getSharePreviewEquipmentValues();
    expect(equipmentValues.length, 'Share email should contain at least one Equipment label per segment').toBeGreaterThan(0);

    // For mixed itineraries, at least one segment should have non-aircraft equipment (train/bus)
    const nonAircraftKeywords = ['train', 'bus', 'rail'];
    const hasNonAircraft = equipmentValues.some(val =>
      nonAircraftKeywords.some(kw => val.toLowerCase().includes(kw))
    );
    expect(hasNonAircraft, `Share email should contain at least one non-aircraft equipment (train/bus) for mixed itinerary. Found: ${equipmentValues.join(', ')}`).toBeTruthy();

    // Verify flight segment info is also present (flight numbers)
    const hasFlightInfo = await cartPage.sharePreviewContainsFlightNumber();
    expect(hasFlightInfo, 'Share email should contain flight number information').toBeTruthy();
  },

  /**
   * Verifies all flight times on the search results page are in 12-hour AM/PM format.
   * Returns the collected times so they can be compared later against the pricing page.
   *
   * @param {Object} page
   * @returns {Promise<string[]>} Array of time strings found
   */
  async verifyResultsTimesAreIn12HourFormat(page) {
    if (!page) throw new Error('page is required');

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const timeTexts = await flightResultsPage.getFlightTimesFromResultsPage();

    expect(timeTexts.length, 'Expected at least one flight time on the results page').toBeGreaterThan(0);

    const amPmPattern = /\b\d{1,2}:\d{2}\s*(AM|PM)\b/i;
    const pure24HourPattern = /\b([01]\d|2[0-3]):\d{2}\b(?!\s*(AM|PM))/i;

    for (const text of timeTexts) {
      expect(
        amPmPattern.test(text),
        `Results page: expected time "${text}" to be in 12-hour AM/PM format — bug #75337 regression`
      ).toBe(true);
      expect(
        pure24HourPattern.test(text),
        `Results page: expected time "${text}" NOT to use 24-hour notation — bug #75337 regression`
      ).toBe(false);
    }

    return timeTexts;
  },

  /**
   * Opens the second fare rules drawer within the pricing options modal.
   * Uses a scoped locator (index 1 within the overlay) to avoid targeting
   * background buttons blocked by the overlay.
   * @param {import('playwright').Page} page
   */
  async clickToOpenSecondFareRulesFromPricingOptions(page) {
    if (!page) throw new Error('page is required');
    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.waitAndClickFareRulesButtonInPricingOptions(1);
    await flightResultsPage.waitForFareRulesNote();
  },

  /**
   * Clicks "Add to trip" and then asserts the conflicting quotes warning dialog is visible.
   *
   * Use this when searching for the same flight a second time on an existing trip —
   * the conflict modal should appear instead of navigating to the cart.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{dialogVisible: boolean}>}
   */
  async addFirstFlightToCartAndVerifyConflictingQuotesDialog(page) {
    if (!page) {
      throw new Error('page is required');
    }

    await Results.waitAndClickAddToTripButton(page);
    await Results.verifyConflictQuoteModalVisible(page);

    return { dialogVisible: true };
  },

  async verifyStopoverIndicatorInResultsForFlight(page, flightNumber) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new Error('flightNumber must be a non-empty string, got: ' + typeof flightNumber);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopoverIndicatorVisibleForFlight(flightNumber);
    expect(visible, `Stopover indicator icon with "Stop over" tooltip should be visible for flight ${flightNumber}`).toBe(true);

    return { visible, flightNumber };
  },

  async verifyStopoverIndicatorInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const visible = await flightResultsPage.isStopoverIndicatorVisibleInDetails();
    expect(visible, 'Stopover indicator should be visible in flight details').toBe(true);

    return { visible };
  },

  async verifyStopoverLocationInFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const actualText = await flightResultsPage.getStopoverLocationTextInDetails();
    expect(actualText, 'Stopover location should contain "Stop over in"').toContain('Stop over in');
    expect(actualText, 'Stopover location should contain "no plane change"').toContain('no plane change');

    return { actualText };
  },

  async verifyFirstFlightResultPriceIsNotZero(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const priceValue = await flightResultsPage.getFirstFlightResultPriceValue();

    expect(priceValue, 'First flight result price should not be null').not.toBeNull();
    expect(priceValue, 'First flight result price should be greater than zero').toBeGreaterThan(0);

    return { priceValue };
  },

  /**
   * Navigates back from the flight results page to the trip search page by
   * clicking the "Search" link in the results breadcrumb.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   */
  async navigateBackToSearchViaBreadcrumb(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickBreadcrumbSearchLink();

    return { navigated: true };
  },

  /**
   * Verifies that a pricing-option card in the open modal whose visible text
   * contains the given substring shows the out-of-policy indicator.
   *
   * Used by tests that need to assert OOP on a specific fare row identified
   * by its baggage label (e.g. "2PC Luggage").
   *
   * @param {import('playwright').Page} page
   * @param {string} cardText - Substring used to identify the target card.
   * @returns {Promise<{ cardText: string }>}
   */
  async verifyPricingOptionOOPByText(page, cardText) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardText || typeof cardText !== 'string') {
      throw new Error('cardText must be a non-empty string, got: ' + typeof cardText);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    const card = flightResultsPage.getPricingOptionCardByText(cardText);
    await card.waitFor({ state: 'visible', timeout: 30000 });

    const oopIndicator = flightResultsPage.getOOPIndicatorInPricingOptionByText(cardText);
    await expect(
      oopIndicator,
      `Expected out-of-policy indicator on pricing option card containing "${cardText}"`,
    ).toBeVisible({ timeout: 30000 });

    return { cardText };
  },

  /**
   * Selects the first pricing-option card in the open modal whose visible text
   * contains the given substring by clicking its Select button.
   *
   * @param {import('playwright').Page} page
   * @param {string} cardText - Substring used to identify the target card.
   * @returns {Promise<{ selected: true, cardText: string }>}
   */
  async selectPricingOptionByText(page, cardText) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!cardText || typeof cardText !== 'string') {
      throw new Error('cardText must be a non-empty string, got: ' + typeof cardText);
    }

    const flightResultsPage = getPageObject(page, FlightResultsPage);
    await flightResultsPage.clickSelectButtonInPricingOptionByText(cardText);

    return { selected: true, cardText };
  },
}

module.exports = FlightResults;
