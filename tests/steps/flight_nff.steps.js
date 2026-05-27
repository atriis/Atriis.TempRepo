require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("FlightNFF");

setDefaultTimeout(120000);

// ===== NEW FLIGHT FLOW STEPS =====

When("I select the outbound first option from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first outbound brand card");
  await FlightResults.selectOutboundFirstBrandCardNewFlightFlow(this.page);
});

When("I select the inbound first option from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first inbound brand card");
  await FlightResults.selectInboundFirstBrandCardNewFlightFlow(this.page);
});

Then("I should see the inbound heading {string} in pricing options new flight flow", async function (expectedHeading) {
  logger.info("[NewFlightFlow] Verifying inbound heading", { expectedHeading });
  await FlightResults.verifyInboundHeadingNewFlightFlow(this.page, expectedHeading);
});

When("I add to cart from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Clicking add to cart from pricing options");
  await FlightResults.addToCartNewFlightFlow(this.page);
});