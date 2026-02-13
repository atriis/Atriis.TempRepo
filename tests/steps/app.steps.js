/**
 * App (Application) Step Definitions
 *
 * Maps Gherkin steps to App DSL methods for application-level flows.
 * App DSL handles login, logout, and session management.
 *
 * ===== STEP CATALOG =====
 *
 * Given Steps:
 *   "I am logged in and ready to book a new trip"
 *     → Context setup (handled by hooks)
 *
 *   "I am logged in as {string} {string} and ready to book a new trip"
 *     → App.loginAs(page, userConfig) + App.bookANewTrip(page)
 *
 *   "I am logged in to the application"
 *     → Context setup for smoke tests (no new trip started)
 *
 * When Steps:
 *   "I logout from the application"
 *     → App.logout(page)
 *
 * Then Steps:
 *   "I should be redirected to the login page"
 *     → Verify URL contains "login"
 *
 * ========================
 */

require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { App } = require("@dsl");
const config = require("@config/config");
const { launchBrowser } = require("../support/browserFactory");
const logger = require("../../src/utils/logger").child("App");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given("I am logged in and ready to book a new trip", async function () {
  logger.debug("User is logged in and on new trip page");
});

Given("I am logged in as {string} {string} and ready to book a new trip", async function (provider, user) {
  logger.info("Logging in from scenario outline", { provider, user });
  
  // Validate user exists in config
  const userConfig = config.users?.[provider]?.[user];
  if (!userConfig) {
    throw new Error(`User not found in config: ${provider}.${user}`);
  }
  
  logger.info("Logging in as user", { provider, user });
  
  // Setup browser
  this.browser = await launchBrowser();
  

  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  
  // Navigate to app and login
  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await App.loginAs(this.page, userConfig);
  this.page = await App.bookANewTrip(this.page);
  
  logger.info("Setup complete");
});

Given("I am logged in to the application", async function () {
  logger.debug("User is logged in (no new trip started)");
  // This uses the loggedInPage behavior - handled by hook
});

// ===== WHEN STEPS =====

When("I logout from the application", async function () {
  logger.info("Logging out from application");
  await App.logout(this.page);
});

// ===== THEN STEPS =====

Then("I should be redirected to the login page", async function () {
  logger.info("Verifying redirect to login page");
  const url = await this.page.url();
  expect(url).toContain("login");
});
