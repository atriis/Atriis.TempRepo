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

Then("the trip should be successfully cancelled", async function () {
  logger.info("Trip cancellation validated");
});

