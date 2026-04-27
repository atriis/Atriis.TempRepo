require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("Cars");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SELECTION
// ========================================

When("I add the first car to cart", async function () {
  logger.info("Adding first car to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});
