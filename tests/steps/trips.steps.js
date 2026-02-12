/**
 * Trips Step Definitions
 *
 * Maps Gherkin steps to Trips DSL methods for trips page navigation.
 * Trips DSL handles navigating to and interacting with the Trips section.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I navigate to the trips page"
 *     → Trips.navigateToTripsPage(page)
 *
 * Then Steps:
 *   "the trips page should be loaded"
 *     → Verify page title is not empty
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { Trips } = require("@dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I navigate to the trips page", async function () {
  console.log("Navigating to Trips page");
  await Trips.navigateToTripsPage(this.page);
});

// ===== THEN STEPS =====

Then("the trips page should be loaded", async function () {
  console.log("Verifying trips page is loaded");
  const title = await this.page.title();
  expect(title).not.toBe("");
});
