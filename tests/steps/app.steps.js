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
 * Signs in with a two-factor-enabled user and stops at the verification code prompt.
 * This is the scenario's first step, so it opens the browser session itself.
 */
When("I log in triggering two-factor authentication as {string}", async function (user) {
  logger.info("Logging in with a two-factor-enabled user", { user });
  // Assign browser/context/page BEFORE the attempt so the After hook can always
  // capture a screenshot, even when the code prompt never appears.
  const session = await App.createBrowserSession();
  this.browser = session.browser;
  this.context = session.context;
  this.page = session.page;
  await App.loginTriggeringTwoFactor(this.page, user);
});

/**
 * Submits a code that is expected to be rejected. The attempt counter lives on the World, so a
 * CI retry starts a fresh scenario at attempt 1; the DSL turns it into a unique wrong code.
 */
When("I enter an incorrect verification code", async function () {
  this.verificationCodeAttempts = (this.verificationCodeAttempts || 0) + 1;
  logger.info("Entering an incorrect verification code", {
    attempt: this.verificationCodeAttempts,
  });
  const { code } = await App.enterIncorrectVerificationCode(this.page, this.verificationCodeAttempts);
  logger.debug("Incorrect verification code submitted", { code });
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
  const opened = await App.openExpensesLinkFromSideNav(this.page, expenseName);
  this.expensesSsoTab = opened.ssoTab;
  // The URL the app asked the browser to open. Kept because the opened tab's own url() is not the
  // configured value once the provider is unreachable or redirects — see App.verifyExpensesTabUrl.
  this.expensesRequestedUrl = opened.requestedUrl;
});

// ===== THEN STEPS =====

/**
 * Asserts the corporate expenses entry is in the side navigation, labelled "<name> - Expenses".
 * Read-only, so it can precede the step that opens the link in the same scenario.
 * The parameter is the expense DISPLAY NAME only ("MESH"), matching the open step above.
 */
Then("the homepage menu should display the {string} expenses link", async function (expenseName) {
  logger.info("Verifying the corporate expenses link is displayed in the homepage menu", { expenseName });
  await App.verifyExpensesLinkDisplayedInSideNav(this.page, expenseName);
});

/**
 * Asserts the expenses link opened a new tab targeting an exact expected URL. The expected value
 * must include the scheme, because it is compared against the app's window.open target verbatim.
 * Use when the corporation's configured expenses URL is known; use the SSO-provider step below
 * when it is not (that one asserts only that the tab left the app's own origin).
 */
Then("the expenses link should open a new tab with the url {string}", async function (expectedUrl) {
  logger.info("Verifying the URL of the tab opened by the expenses link", { expectedUrl });
  // The DSL closes the opened tab in its finally block, so drop the World references afterwards.
  await App.verifyExpensesTabUrl(this.expensesSsoTab, this.page, expectedUrl, this.expensesRequestedUrl);
  this.expensesSsoTab = null;
  this.expensesRequestedUrl = null;
});

Then("the expenses link should open the SSO provider page in a new tab", async function () {
  logger.info("Verifying the expenses link opened the SSO provider in a new tab");
  // The DSL closes the SSO tab in its finally block, so drop the World reference afterwards.
  await App.verifyExpensesSsoTabOpened(this.expensesSsoTab, this.page, this.expensesName);
  this.expensesSsoTab = null;
});

/**
 * Asserts the expenses link's new tab LANDS on an expected URL prefix, after any provider-side
 * redirect. Use when the corporation is configured with an SSO bounce endpoint rather than the
 * provider itself, so the configured URL and the URL the user ends on are different hosts - the
 * exact-URL step above compares the window.open target and cannot express "the user reached the
 * provider". A prefix, not equality: the landing URL is provider-controlled.
 */
Then("the expenses link should land on the url starting with {string}", async function (expectedUrlPrefix) {
  logger.info("Verifying the landing URL of the tab opened by the expenses link", { expectedUrlPrefix });
  // The DSL closes the opened tab in its finally block, so drop the World references afterwards.
  await App.verifyExpensesTabLandingUrl(this.expensesSsoTab, this.page, expectedUrlPrefix);
  this.expensesSsoTab = null;
  this.expensesRequestedUrl = null;
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

Then("the two-factor verification code prompt should be displayed", async function () {
  logger.info("Verifying the two-factor verification code prompt is displayed");
  const { displayed } = await App.waitForTwoFactorPromptDisplayed(this.page);
  expect(
    displayed,
    "Expected the two-factor verification code prompt after signing in with a 2FA-enabled user"
  ).toBe(true);
});

Then("the verification code error {string} should be displayed", async function (expectedMessage) {
  logger.info("Verifying the verification code error message", { expectedMessage });
  const actualMessage = await App.getVerificationCodeMessage(this.page, expectedMessage);
  expect(
    actualMessage,
    `Expected the two-factor screen to reject the submitted code with "${expectedMessage}", but ` +
    `the message shown was "${actualMessage}"`
  ).toBe(expectedMessage);
});

Then("the final attempt warning {string} should be displayed", async function (expectedMessage) {
  logger.info("Verifying the final attempt warning", { expectedMessage });
  const actualMessage = await App.getVerificationCodeMessage(this.page, expectedMessage);
  expect(
    actualMessage,
    `Expected the two-factor screen to warn about the last remaining attempt with ` +
    `"${expectedMessage}", but the message shown was "${actualMessage}"`
  ).toBe(expectedMessage);
});

Then("the login page subtitle {string} should be displayed", async function (expectedSubtitle) {
  logger.info("Verifying the login page subtitle", { expectedSubtitle });
  const actualSubtitle = await App.getLoginPageSubtitle(this.page, expectedSubtitle);
  expect(
    actualSubtitle,
    `Expected the login page subtitle "${expectedSubtitle}", but the text shown was ` +
    `"${actualSubtitle}"`
  ).toBe(expectedSubtitle);
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

// Timeout covers Homepage.openAwaitingApprovalTripWhenListed's 300000ms poll budget plus opening the trip.
When("I open the trip awaiting my approval from the homepage", { timeout: 420000 }, async function () {
  if (!this.tripId) {
    throw new Error(
      "No trip number on the World. The trip id must be captured during 'I am logged in ... booking a new trip' before this step."
    );
  }
  logger.info('Opening the scenario trip from the homepage "Awaiting my approval" tab', { tripId: this.tripId });
  await Homepage.openAwaitingApprovalTripWhenListed(this.page, String(this.tripId));
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
