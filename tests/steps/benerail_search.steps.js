/**
 * Benerail Search Step Definitions
 *
 * Maps Gherkin steps to BenerailSearch DSL methods for EU Rail search orchestration.
 * BenerailSearch DSL handles route selection, date picking, and search submission.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I search for a one way Benerail train from {string}"
 *     → BenerailSearch.searchBenerailOneWay(page, routeKey)
 *
 *   "I search for a round trip Benerail train from {string}"
 *     → BenerailSearch.searchBenerailRoundTrip(page, routeKey)
 *
 * ========================
 */

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
