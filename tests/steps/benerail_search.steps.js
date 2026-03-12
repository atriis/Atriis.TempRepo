require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { BenerailSearch } = require("@dsl");
const logger = require("@utils/logger").child("BenerailSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Benerail train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Benerail train", { routeKey });
  await BenerailSearch.searchBenerailOneWay(this.page, routeKey);
});

When("I search for a round trip Benerail train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Benerail train", { routeKey });
  await BenerailSearch.searchBenerailRoundTrip(this.page, routeKey);
});
