/**
 * Price Extraction Utilities
 * 
 * Helper functions for extracting prices from different page locations.
 */

/**
 * Extracts price from a specific location on the page.
 * 
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {number} index - Zero-based index of the price element
 * @param {string} location - Location identifier (e.g., "results", "cart", "pricing options")
 * @returns {Promise<number|null>} The extracted price value
 * @throws {Error} If page is null/undefined or index is negative
 * 
 * @example
 * const price = await extractPriceFromLocation(page, 0, "results");
 * const cartPrice = await extractPriceFromLocation(page, 0, "cart");
 */
async function extractPriceFromLocation(page, index, location) {
  // Validate inputs
  if (!page) {
    throw new Error('page is required');
  }
  
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be a non-negative number, got ${typeof index === 'number' ? index : typeof index}`);
  }
  
  if (!location || typeof location !== 'string') {
    throw new Error('location must be a non-empty string');
  }
  switch (location.toLowerCase()) {
    case "results":
      const { ResultsPage } = require("../pages/ResultsPage");
      const resultsPage = new ResultsPage(page);
      return await resultsPage.getAmountPriceValueResults(index);
      
    case "cart":
      const { CommonPage: CartCommonPage } = require("../pages/CommonPage");
      const cartCommonPage = new CartCommonPage(page);
      return await cartCommonPage.getAmountPriceValue(index);
      
    case "pricing options":
      const FlightResultsPage = require("../pages/FlightResultsPage");
      const flightResultsPage = new FlightResultsPage(page);
      return await flightResultsPage.getAmountPriceValuePricingOptions(index);
      
    default:
      const { CommonPage } = require("../pages/CommonPage");
      const commonPage = new CommonPage(page);
      return await commonPage.getAmountPriceValue(index);
  }
}

module.exports = {
  extractPriceFromLocation,
};
