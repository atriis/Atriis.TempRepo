require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  ManualQuoteSearch,
} = require("../../src/dsl");
const logger = require("@utils/logger").child("ManualQuote");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a flight manual quote from {string} to {string}", async function (from, to) {
  logger.info("Adding flight manual quote", { from, to });
  await ManualQuoteSearch.searchAndAddFlightManualQuote(this.page, { from, to });
});

When("I add a hotel manual quote in {string}", async function (city) {
  logger.info("Adding hotel manual quote", { city });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city);
});
