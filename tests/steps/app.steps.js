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
 *     → Context setup (login only, use @loginOnly tag)
 *
 * When Steps:
 *   "I book a new trip"
 *     → App.bookANewTrip(page)
 *     → Opens new trip page in separate tab
 *
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
const logger = require("@utils/logger").child("App");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

/**
 * LOGIN STEP DEFINITIONS - USAGE GUIDE
 * =====================================
 * 
 * We have 3 login steps. Here's when to use each one:
 * 
 * 1. NORMAL BOOKING TESTS (99% of tests)
 *    Step: Given I am logged in and ready to book a new trip
 *    Tags: @provider:amadeus @user:user_one
 *    Setup: Handled automatically by Before hook in hooks.js
 *    Result: Logged in + trip booking page open
 * 
 * 2. NON-BOOKING TESTS (logout, trips page, settings, etc.)
 *    Step: Given I am logged in to the application
 *    Tags: @loginOnly @provider:amadeus @user:user_one
 *    Setup: Before hook skips opening booking page (stays on landing page)
 *    Result: Logged in only (no trip page)
 * 
 * 3. SCENARIO OUTLINES (testing multiple users)
 *    Step: Given I am logged in as "<provider>" "<user>" and ready to book a new trip
 *    Tags: None needed (users come from Examples table)
 *    Setup: Does everything itself (doesn't use Before hook)
 *    Result: Logged in + trip booking page open for specific user
 * 
 * WHY DO SOME STEPS HAVE EMPTY FUNCTIONS?
 * The Before hook does the actual work (getting context, opening pages, etc.).
 * The step definition is just a "trigger" telling Cucumber "this test needs auth".
 * Think of it like ordering at a restaurant - you say "I'll have the burger" and
 * the kitchen does all the actual cooking.
 */

/**
 * Standard login step - relies on Before hook for setup
 * Uses default user configured via tags (@provider:amadeus @user:user_one)
 * The Before hook in hooks.js handles authentication, context setup, and bookANewTrip()
 * Use this for most scenarios with standard user flow
 */
Given("I am logged in and ready to book a new trip", async function () {
  logger.debug("User is logged in and on new trip page");
});

/**
 * Parameterized login step - does its own setup without relying on hooks
 * Takes provider and user as parameters (e.g., "amadeus" "user_one")
 * Use this for Scenario Outlines or when you need to specify a different user per test
 * Example: Given I am logged in as "sabre" "user_two" and ready to book a new trip
 */
Given("I am logged in as {string} {string} and ready to book a new trip", async function (provider, user) {
  logger.info("Logging in from scenario outline", { provider, user });
  
  // Validate user exists in config
  const userConfig = config.users?.[provider]?.[user];
  if (!userConfig) {
    throw new Error(`User not found in config: ${provider}.${user}`);
  }
  
  logger.info("Launching browser and creating context", { provider, user });
  
  // Launch browser and create context
  this.browser = await launchBrowser();
  this.context = await this.browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  });
  this.page = await this.context.newPage();
  
  // Navigate and login
  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await App.loginAs(this.page, userConfig);
  
  // Book a new trip
  this.page = await App.bookANewTrip(this.page);
  
  logger.info("Setup complete");
});

/**
 * Login-only step - for tests that don't need the trip booking page
 * Uses @loginOnly tag to skip opening the booking page
 * Before hook handles authentication and navigation to landing page
 * Use this for testing logout, trips page, settings, or other non-booking flows
 */
Given("I am logged in to the application", async function () {
  logger.debug("User is logged in (no new trip started)");
  // This uses the loggedInPage behavior - handled by hook
});

/**
 * Opens the trip booking page during a test
 * Use this when you're already logged in but need to start a new trip
 * WARNING: This opens a NEW TAB - the returned page is the new trip page
 * Example: Testing multiple trips in sequence or navigating away and back
 */
When("I book a new trip", async function () {
  logger.info("Starting new trip booking flow");
  this.page = await App.bookANewTrip(this.page);
  logger.debug("New trip page opened");
});

// ===== WHEN STEPS =====

/**
 * Logs out the current user from the application
 * Clicks the logout button and waits for logout to complete
 * Use this to test logout functionality or to switch users
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
