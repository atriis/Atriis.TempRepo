/**
 * Manual Quote Step Definitions
 *
 * Maps Gherkin steps to DSL methods for manual quote flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search and add a flight manual quote"
 *     → ManualQuoteSearch.searchAndAddFlightManualQuote(page)
 *
 *   "I cancel the trip"
 *     → Cart.cancelTripStrict(page)
 *
 * Then Steps:
 *   "the trip should be successfully cancelled"
 *     → Validated by cancelTripStrict (includes assertions)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  ManualQuoteSearch,
} = require("../../src/dsl");
const logger = require("../../src/utils/logger").child("ManualQuote");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search and add a flight manual quote", async function () {
  logger.info("Searching and adding flight manual quote");
  await ManualQuoteSearch.searchAndAddFlightManualQuote(this.page);
});
