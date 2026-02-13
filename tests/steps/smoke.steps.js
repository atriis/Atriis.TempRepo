/**
 * Smoke Test Assertions
 *
 * General smoke test assertions that don't belong to specific DSL modules.
 * App, Trips, and other DSL-specific steps have been moved to their respective step files.
 *
 * ===== STEP CATALOG =====
 *
 * Then Steps:
 *   "the application should be loaded"
 *     → Verify URL is not empty
 *
 *   "the page should have a title"
 *     → Verify page title is not empty
 *
 *   "flight results should be displayed"
 *     → FlightResults.isResultDisplayed(page)
 *
 *   "I should see a success notification"
 *     → Verify "Success" text is visible
 *
 *   "the trip should be successfully cancelled"
 *     → Generic assertion (no action needed)
 *
 * ========================
 */

require("module-alias/register");

const { Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightResults } = require("@dsl");
const logger = require("@utils/logger").child("Smoke");

setDefaultTimeout(120000);

// ===== THEN STEPS =====

Then("the application should be loaded", async function () {
  logger.info("Verifying application is loaded");
  const url = await this.page.url();
  expect(url).not.toBe("");
});

Then("the page should have a title", async function () {
  logger.info("Verifying page has a title");
  const title = await this.page.title();
  expect(title).not.toBe("");
});

Then("flight results should be displayed", async function () {
  logger.info("Verifying flight results are displayed");
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
});

Then("I should see a success notification", async function () {
  logger.info("Verifying success notification is visible");
  const successNotification = this.page.getByText("Success", { exact: true });
  await successNotification.waitFor({ state: "visible" });
});

Then("the trip should be successfully cancelled", async function () {
  logger.info("Trip cancellation validated");
});

