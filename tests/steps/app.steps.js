require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { App, Homepage } = require("@dsl");
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
  // Assign browser/context/page BEFORE login so the After hook can always
  // capture a screenshot, even when login itself fails.
  const session = await App.createBrowserSession();
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
  await App.login(this.page, user);
});

/**
 * Login + booking step without provider.
 */
Given("I am logged in as {string} booking a new trip", async function (user) {
  logger.info("Logging in and booking", { user });
  // Assign browser/context/page BEFORE login so the After hook can always
  // capture a screenshot, even when login itself fails.
  const browserSession = await App.createBrowserSession();
  this.browser = browserSession.browser;
  this.context = browserSession.context;
  this.page = browserSession.page;
  await App.login(this.page, user);
  this.page = await App.bookANewTrip(this.page);

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

When("I switch the application language to {string}", async function (language) {
  logger.info("Switching application language", { language });
  await App.switchLanguage(this.page, language);
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

Then("the start new trip button should be visible on the homepage", async function () {
  logger.info('Verifying the "Start New Trip" button is visible on the homepage');
  const visible = await Homepage.isStartNewTripButtonVisible(this.page);
  expect(
    visible,
    'Expected the "Start New Trip" button (.imt-btn) to be visible on the homepage for a low-product user (2 products or fewer)'
  ).toBe(true);
});

When("I hover over the quick link product card on the homepage", async function () {
  logger.info("Hovering over quick link product card on homepage");
  await Homepage.hoverQuickLinkProductCard(this.page);
});

When("I click the all trips button on the homepage", async function () {
  logger.info('Clicking the "All trips" button on the homepage');
  await Homepage.clickAllTripsFromHomepage(this.page);
});

Then("the default product picture should be displayed on the quick link card", async function () {
  logger.info("Verifying default picture is displayed on quick link card");
  const src = await Homepage.getQuickLinkCardImageSrc(this.page);
  // Vite inlines the no-qlink.svg as a data URI; an external configured image would be an http(s) URL
  expect(
    src,
    `Quick link card should display the default inline SVG (data:image/svg+xml) when no external image is configured. Got: "${src}"`
  ).toMatch(/^data:image\/svg\+xml/);
});

Then("the {string} product should be visible on the homepage", async function (productName) {
  logger.info("Verifying product is visible on the homepage", { productName });
  const visible = await Homepage.isProductVisibleOnHomepage(this.page, productName);
  expect(
    visible,
    `Expected the "${productName}" product tile to be visible on the homepage product carousel`
  ).toBe(true);
});

When("I open the {string} product from the homepage", async function (productName) {
  logger.info("Opening product from the homepage", { productName });
  await Homepage.openProductFromHomepage(this.page, productName);
});

Then("the {string} search page should be displayed", async function (productName) {
  logger.info("Verifying product search page is displayed", { productName });
  const displayed = await Homepage.isSearchPageDisplayed(this.page, productName);
  expect(
    displayed,
    `Expected the "${productName}" search page to be displayed after opening the product from the homepage`
  ).toBe(true);
});

When("I go back to the homepage", async function () {
  logger.info("Navigating back to the homepage");
  await Homepage.navigateBackToHomepage(this.page);
});

Then("the more products button should be visible on the homepage", async function () {
  logger.info("Verifying the more products button is visible on the homepage");
  const visible = await Homepage.isMoreProductsButtonVisible(this.page);
  expect(
    visible,
    'Expected the "more products" (more_horiz) button to be visible on the homepage for a user with more than five products'
  ).toBe(true);
});
