/**
 * Smoke Test Step Definitions
 * 
 * Maps Gherkin steps to DSL methods for smoke test flows.
 * 
 * ===== STEP CATALOG =====
 * 
 * Given Steps:
 *   "I am logged in to the application"
 *     → Uses loggedInPage behavior (no new trip started)
 * 
 * When Steps:
 *   "I navigate to the trips page"
 *     → Trips.navigateToTripsPage(page)
 * 
 *   "I logout from the application"
 *     → App.logout(page)
 * 
 * Then Steps:
 *   "the application should be loaded"
 *     → Validates page URL is not empty
 * 
 *   "the page should have a title"
 *     → Validates page title is not empty
 * 
 *   "the trips page should be loaded"
 *     → Validates trips page title exists
 * 
 *   "flight results should be displayed"
 *     → FlightResults.isResultDisplayed(page)
 * 
 *   "I should be redirected to the login page"
 *     → Validates URL contains 'login'
 * 
 * ========================
 */

require('module-alias/register');

const { Given, When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { Trips, App, FlightResults } = require('../../src/dsl');

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given('I am logged in to the application', async function () {
  console.log('User is logged in (no new trip started)');
  // This uses the loggedInPage behavior - handled by hook
  // We need to modify the hook to support this
});

// ===== WHEN STEPS =====

When('I navigate to the trips page', async function () {
  console.log('Navigating to Trips page');
  await Trips.navigateToTripsPage(this.page);
});

When('I logout from the application', async function () {
  console.log('Logging out from application');
  await App.logout(this.page);
});

// ===== THEN STEPS =====

Then('the application should be loaded', async function () {
  console.log('Verifying application is loaded');
  const url = await this.page.url();
  expect(url).not.toBe('');
});

Then('the page should have a title', async function () {
  console.log('Verifying page has a title');
  const title = await this.page.title();
  expect(title).not.toBe('');
});

Then('the trips page should be loaded', async function () {
  console.log('Verifying trips page is loaded');
  const title = await this.page.title();
  expect(title).not.toBe('');
});

Then('flight results should be displayed', async function () {
  console.log('Verifying flight results are displayed');
  const isDisplayed = await FlightResults.isResultDisplayed(this.page);
  expect(isDisplayed).toBe(true);
});

Then('I should be redirected to the login page', async function () {
  console.log('Verifying redirect to login page');
  const url = await this.page.url();
  expect(url).toContain('login');
});