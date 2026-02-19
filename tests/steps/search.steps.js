/**
 * Search Step Definitions
 *
 * Maps Gherkin steps to Search DSL methods for traveler management.
 * Search DSL handles adding travelers and managing traveler data.
 *
 * ===== STEP CATALOG =====
 *
 * Given Steps:
 *   "I have added myself as the traveler"
 *     → Search.addMeAsTraveler(page)
 *
 *   "I have added traveler by name {string}"
 *     → Search.addTravelerByName(page, travelerName)
 *
 *   "I have added a random guest traveler"
 *     → Search.addRandomGuest(page)
 *
 * Then Steps:
 *   "the search title should contain {string}"
 *     → Search.validateSearchTitleContains(page, text)
 *
 * ========================
 */

require("module-alias/register");

const { Given, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Search } = require("@dsl");
const { expect } = require("@fixtures/supplierTest");
const logger = require("@utils/logger").child("Search");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given("I have added myself as the traveler", async function () {
  logger.info("Adding traveler: I am the traveler");
  const result = await Search.addMeAsTraveler(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler").toBe(true);
});

Given("I have added traveler by name {string}", async function (travelerName) {
  logger.info("Adding traveler by name", { travelerName });
  const result = await Search.addTravelerByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
});

Given("I have added a random guest traveler", async function () {
  logger.info("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
});

// ===== THEN STEPS =====

Then("the search title should contain {string}", async function (expectedText) {
  logger.info("Validating search title contains text", { expectedText });
  await Search.validateSearchTitleContains(this.page, expectedText);
});
