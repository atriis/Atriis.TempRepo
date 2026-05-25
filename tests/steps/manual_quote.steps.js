require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  ManualQuoteSearch,
} = require("../../src/dsl");
const logger = require("@utils/logger").child("ManualQuote");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search and add a flight manual quote", async function () {
  logger.info("Searching and adding flight manual quote");
  await ManualQuoteSearch.searchAndAddFlightManualQuote(this.page);
});

When("I add a hotel manual quote in {string}", async function (city) {
  logger.info("Adding hotel manual quote", { city });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city);
});
