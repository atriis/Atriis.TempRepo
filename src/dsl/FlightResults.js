const { expect } = require("@playwright/test");
const FlightResultsPage = require("@pages/FlightResultsPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");
const { CommonPage } = require("@src/pages/CommonPage");
const { getPageObject } = require("@utils/pageObjectCache");

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
    await resultsPage.waitForAddToTripText();
    await resultsPage.clickShareMainButton();
    return { clicked: true };
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
 
 await FlightResults.clickToOpenFareRules(page, 10);
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

}

module.exports = FlightResults;

