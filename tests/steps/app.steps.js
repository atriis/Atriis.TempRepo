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
  // Reuse a session an earlier step already opened (e.g. a rejected login attempt) instead of
  // launching a second browser that the After hook would never close. App.login() re-navigates
  // to the base URL, so any previous login-failure state is cleared before signing in.
  // Assign browser/context/page BEFORE login so the After hook can always
  // capture a screenshot, even when login itself fails.
  if (!this.page) {
    const session = await App.createBrowserSession();
    this.browser = session.browser;
    this.context = session.context;
    this.page = session.page;
  }
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
    this.recordTripId(tripId);
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
  // If products were opened from the homepage in this scenario (booker new-tab flow), close the
  // leftover product tab and return to the live homepage tab before booking. Guarded on
  // this.homepageTab so this shared step is unchanged for single-tab scenarios.
  if (this.homepageTab) {
    if (this.productSearchTab && this.productSearchTab !== this.homepageTab) {
      await this.productSearchTab.close().catch(() => {});
      this.productSearchTab = null;
    }
    await this.homepageTab.bringToFront().catch(() => {});
    this.page = this.homepageTab;
  }
  this.page = await App.bookANewTrip(this.page);
  logger.debug("New trip page opened");
});

// ===== WHEN STEPS =====

/**
 * Negative login: submits credentials expected to be rejected and returns while still on the
 * login page. This is the scenario's first step, so it opens the browser session itself.
 */
When("I attempt to log in with invalid credentials as {string}", async function (user) {
  logger.info("Attempting login with invalid credentials", { user });
  // Assign browser/context/page BEFORE the attempt so the After hook can always
  // capture a screenshot, even when the attempt fails for the wrong reason.
  const session = await App.createBrowserSession();
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
  await App.attemptLoginWithInvalidCredentials(this.page, user);
});

/**
 * Logs out the current user from the application.
 */
When("I logout from the application", async function () {
  logger.info("Logging out from application");
  await App.logout(this.page);
});

/**
 * Clicks logout and stops there, leaving the confirmation page on screen.
 * Use this instead of "I logout from the application" when the scenario asserts the
 * confirmation message — that step waits past it and the page then auto-redirects.
 */
When("I click the logout icon", async function () {
  logger.info("Clicking the logout icon");
  await App.clickLogout(this.page);
});

When("I switch the application language to {string}", async function (language) {
  logger.info("Switching application language", { language });
  await App.switchLanguage(this.page, language);
});

/**
 * Opens the corporate expenses provider from the side navigation. The app opens it in a NEW tab,
 * which is stored on its own World property (NOT this.newTabPage, which other suites assert on).
 * this.page deliberately stays on the app tab so the Then step can hand focus back to it.
 */
When("I open the {string} expenses link from the side navigation", async function (expenseName) {
  logger.info("Opening the corporate expenses link from the side navigation", { expenseName });
  // Kept for the Then step's failure message ("<name> - Expenses").
  this.expensesName = expenseName;
  this.expensesSsoTab = await App.openExpensesLinkFromSideNav(this.page, expenseName);
});

// ===== THEN STEPS =====

Then("the expenses link should open the SSO provider page in a new tab", async function () {
  logger.info("Verifying the expenses link opened the SSO provider in a new tab");
  // The DSL closes the SSO tab in its finally block, so drop the World reference afterwards.
  await App.verifyExpensesSsoTabOpened(this.expensesSsoTab, this.page, this.expensesName);
  this.expensesSsoTab = null;
});

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

Then("the login error message {string} should be displayed", async function (expectedMessage) {
  logger.info("Verifying the login failure message", { expectedMessage });
  const actualMessage = await App.getLoginErrorMessage(this.page);
  expect(
    actualMessage,
    `Expected the login page to reject the credentials with "${expectedMessage}", but the message shown was "${actualMessage}"`
  ).toBe(expectedMessage);
});

Then("the logout confirmation message {string} should be displayed", async function (expectedMessage) {
  logger.info("Verifying the logout confirmation message", { expectedMessage });
  const actualMessage = await App.getLogoutSuccessMessage(this.page);
  expect(
    actualMessage,
    `Expected the logout confirmation page to show "${expectedMessage}", but the message shown was "${actualMessage}"`
  ).toBe(expectedMessage);
});

Then("the login page should be displayed again", async function () {
  logger.info("Verifying the login page is displayed again after logout");
  const { displayed } = await App.waitForLoginPageDisplayed(this.page);
  expect(
    displayed,
    "Expected the logout confirmation page to auto-redirect back to the login screen"
  ).toBe(true);
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
  // Remember the persistent homepage tab: booker users open each product in a NEW tab while this
  // tab stays on the homepage, so successive products are all opened from it.
  if (!this.homepageTab) this.homepageTab = this.page;
  // Close any previously-opened product tab so tabs don't accumulate across the loop.
  if (this.productSearchTab && this.productSearchTab !== this.homepageTab) {
    await this.productSearchTab.close().catch(() => {});
    this.productSearchTab = null;
  }
  this.productSearchTab = await Homepage.openProductFromHomepage(this.homepageTab, productName);
  // Keep this.page on the live homepage tab for later steps (e.g. "I book a new trip").
  this.page = this.homepageTab;
});

Then("the {string} search page should be displayed", async function (productName) {
  logger.info("Verifying product search page is displayed", { productName });
  const displayed = await Homepage.isSearchPageDisplayed(this.productSearchTab || this.page, productName);
  expect(
    displayed,
    `Expected the "${productName}" search page to be displayed after opening the product from the homepage`
  ).toBe(true);
});

When("I go back to the homepage", async function () {
  logger.info("Navigating back to the homepage");
  const homepageTab = this.homepageTab || this.page;
  await Homepage.navigateBackToHomepage(homepageTab, this.productSearchTab);
  this.productSearchTab = null;
  this.page = homepageTab;
});

Then("the more products button should be visible on the homepage", async function () {
  logger.info("Verifying the more products button is visible on the homepage");
  const visible = await Homepage.isMoreProductsButtonVisible(this.page);
  expect(
    visible,
    'Expected the "more products" (more_horiz) button to be visible on the homepage for a user with more than five products'
  ).toBe(true);
});

Then("I see the list of trips under my upcoming trips in homepage", async function () {
  logger.info('Verifying the upcoming-trips list is shown on the homepage');
  const count = await Homepage.getUpcomingTripsCount(this.page);
  expect(
    count,
    'Expected at least one trip to be listed under the "My upcoming trips" tab on the homepage'
  ).toBeGreaterThan(0);
});
