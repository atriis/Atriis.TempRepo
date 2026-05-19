require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { App } = require("@dsl");
const logger = require("@utils/logger").child("App");
const { expect } = require("@playwright/test");

setDefaultTimeout(120000);

async function captureTripIdFromCurrentPage(page, { timeoutMs = 20000 } = {}) {
  if (!page) {
    return null;
  }

  try {
    await page.waitForURL(/\/trips\/(\d+)/i, { timeout: timeoutMs });
  } catch {
    // Best-effort wait: some flows may not navigate to /trips/<id> immediately.
  }

  const url = page.url();
  const match = url.match(/\/trips\/(\d+)(?:[/?#]|$)/i);
  return match ? match[1] : null;
}

// ===== GIVEN STEPS =====

/**
 * Login step without provider — resolves user across all providers automatically.
 */
Given("I am logged in as {string}", async function (user) {
  logger.info("Logging in (no provider)", { user });
  const session = await App.loginAsUser(user);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
});

/**
 * Login + booking step without provider.
 */
Given("I am logged in as {string} booking a new trip", async function (user) {
  logger.info("Logging in and booking", { user });
  const session = await App.loginAsUserAndBookANewTrip(user);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;

  const tripId = await captureTripIdFromCurrentPage(this.page);
  if (tripId) {
    this.tripId = tripId;
    this.currentTripId = tripId;
    this.createdTripId = tripId;
    logger.info("Trip id captured from booking flow", { tripId });
  } else {
    logger.warn("Trip id was not available immediately after opening a new trip");
  }
  
  logger.info("Setup complete");
});

/**
 * Opens the trip booking page during a test.
 */
When("I book a new trip", async function () {
  logger.info("Starting new trip booking flow");
  this.page = await App.bookANewTrip(this.page);
  logger.debug("New trip page opened");
});

// ===== WHEN STEPS =====

/**
 * Logs out the current user from the application.
 */
When("I logout from the application", async function () {
  logger.info("Logging out from application");
  await App.logout(this.page);
});

// ===== THEN STEPS =====

/**
 * Verifies that the user has been redirected to the login page
 * Checks if the current URL contains "login"
 * Use this after logout or when testing authentication guards
 */
Then("I should be redirected to the login page", async function () {
  logger.info("Verifying redirect to login page");
  const url = await this.page.url();
  expect(url).toContain("login");
});

Then("the welcome heading should contain {string}", async function (expectedText) {
  logger.info("Verifying welcome heading contains text", { expectedText });
  const isVisible = await App.isHeadingContainingTextVisible(this.page, expectedText);
  expect(isVisible).toBe(true);
});
