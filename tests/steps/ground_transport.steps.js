require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { GroundTransportSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child("GroundTransport");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for ground transport from {string}", async function (routeKey) {
  logger.info("Searching for ground transport", { routeKey });
  await GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(this.page, routeKey);
});
