const FlightResultsPage = require("@pages/FlightResultsPage");
const { CartPage } = require("@pages/CartPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");
const { CommonPage } = require("@src/pages/CommonPage");
const { expect } = require("@fixtures/supplierTest");

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
    
    const resultsPage = new ResultsPage(page);

    try {
      await resultsPage.waitForAddToTripText();
      return true;
    } catch {
      return false;
    }
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
    
    const cartPage = new CartPage(page);

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
    
    const flightResultsPage = new FlightResultsPage(page);

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
    
    const resultsPage = new ResultsPage(page);
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
    
    const resultsPage = new ResultsPage(page);
    const flightResultsPage = new FlightResultsPage(page);
    
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
    
    const commonPage = new CommonPage(page);
    
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
    
    const flightResultsPage = new FlightResultsPage(page);
    
    // Click "Select to share" button for first pricing option
    await flightResultsPage.waitForSelectToShareButton();
    await flightResultsPage.clickSelectToShareButton();
    
    return { selected: true };
  },

  async selectFirstPricingOptionInModal(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = new FlightResultsPage(page);
    
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
    
    const flightResultsPage = new FlightResultsPage(page);
    await flightResultsPage.waitForPricingOptionsButton(index);
    await flightResultsPage.clickPricingOptionsButton(index);
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
    
    const flightResultsPage = new FlightResultsPage(page);
    
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
   * Validates the strictest terms message inside the fare rules drawer.
   *
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{validated: boolean}>}
   */
  async verifyFareRulesStrictestTermsMessage(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = new FlightResultsPage(page);

    // Validate the policy text displayed in the fare rules drawer.
    await expect(flightResultsPage.getFareRulesNote())
      .toContainText('Fare rules would be applied according to the strictest terms');

    return { validated: true };
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
    
    const flightResultsPage = new FlightResultsPage(page);
    // Open the fare rules drawer and wait for its content to be visible.
    await flightResultsPage.waitForFareRulesButton(index);
    await flightResultsPage.clickFareRulesButton(index);
    await flightResultsPage.waitForFareRulesNote();
  },

  async clickToOpenFlightDetails(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const flightResultsPage = new FlightResultsPage(page);
    await flightResultsPage.waitForFlightDetailsButton();
    await flightResultsPage.clickFlightDetailsButton();
    await flightResultsPage.waitForFlightDetailsHeadline();
  },

async clickToOpenFareRulesFromResultsModal(page) {
 if (!page) {
   throw new Error('page is required');
 }
 
 await FlightResults.clickToOpenFareRules(page, 10);
},

/**
 * Verifies the green circle icon is displayed in the pricing options modal.
 * This icon indicates a successful selection of a pricing option.
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {number} index - Zero-based index of the icon (default: 0)
 * @returns {Promise<{displayed: boolean}>}
 */
async greenCircleIconIsDisplayedInPricingOptions(page, index = 0) {
  if (!page) {
    throw new Error('page is required');
  }
  
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }
  
  const flightResultsPage = new FlightResultsPage(page);
  
  // Wait for the green icon to appear
  await flightResultsPage.waitForGreenIconPricingOptionsModal(index);
  
  // Assert the icon is visible
  await expect(
    flightResultsPage.getGreenIconInPricingOptions(index),
    'Green circle icon should be visible in pricing options'
  ).toBeVisible();
  
  return { displayed: true };
},
}

module.exports = FlightResults;

