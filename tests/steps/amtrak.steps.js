/**
 * Amtrak Step Definitions
 *
 * Maps Gherkin steps to DSL methods for Amtrak rail flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for a one way Amtrak train from {string}"
 *     → AmtrakSearch.searchAmtrakOneWay(page, routeKey)
 *
 *   "I search for a round trip Amtrak train from {string}"
 *     → AmtrakSearch.searchAmtrakRoundTrip(page, routeKey)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { AmtrakSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child("AmtrakSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Amtrak train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Amtrak train", { routeKey });
  await AmtrakSearch.searchAmtrakOneWay(this.page, routeKey);
});

When("I search for a round trip Amtrak train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Amtrak train", { routeKey });
  await AmtrakSearch.searchAmtrakRoundTrip(this.page, routeKey);
});
