require("module-alias/register");
const { Then } = require("@cucumber/cucumber");
const FlightNdc = require("../../src/dsl/FlightNdc");
const logger = require("@utils/logger").child("FlightNdc");

Then("all visible flight results should have the {string} label", async function (label) {
  logger.info("Asserting all flight results have label", { label });
  await FlightNdc.verifyAllResultsHaveNdcLabel(this.page);
});

Then("all visible flight results should not have the {string} label", async function (label) {
  logger.info("Asserting no flight results have label", { label });
  await FlightNdc.verifyNoResultsHaveNdcLabel(this.page);
});

Then("all fares in pricing options should have the {string} indicator", async function (label) {
  logger.info("Asserting all pricing options have label", { label });
  await FlightNdc.verifyAllPricingOptionsHaveNdcLabel(this.page);
});

Then("all fares in pricing options should not have the {string} indicator", async function (label) {
  logger.info("Asserting no pricing options have label", { label });
  await FlightNdc.verifyNoPricingOptionsHaveNdcLabel(this.page);
});
