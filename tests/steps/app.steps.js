require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { App } = require("@dsl");
const logger = require("@utils/logger").child("App");
const { expect } = require("@playwright/test");

setDefaultTimeout(120000);

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
  logger.info("Logging in and booking (no provider)", { user });
  const session = await App.loginAsUserAndBookANewTrip(user);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
  logger.info("Setup complete");
});

/**
 * Parameterized login step (no booking).
 */
Given("I am logged in as {string} {string}", async function (provider, user) {
  logger.info("Logging in from scenario", { provider, user });
  const session = await App.login(provider, user);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
});

/**
 * Parameterized login step + booking.
 */
Given("I am logged in as {string} {string} booking a new trip", async function (provider, user) {
  logger.info("Logging in from scenario outline", { provider, user });

  const session = await App.loginAndBookANewTrip(provider, user);
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;

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
