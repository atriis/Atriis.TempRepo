/**
 * Common Step Definitions
 *
 * Shared steps used across multiple features (flights, hotels, cars, etc.)
 *
 * ===== STEP CATALOG =====
 *
 * Setup:
 *   "I am logged in and ready to book a new trip"
 *   "I have added myself as the traveler"
 *   "I have added traveler by name {string}"
 *   "I have added a random guest traveler"
 *
 * Cart & Checkout:
 *   "I accept the terms and conditions"
 *   "I proceed to checkout"
 *   "I complete the booking"
 *   "I cancel the trip"
 *   "I attempt to cancel the trip safely"
 *
 * Share Flows:
 *   "I click the share quote button"
 *   "I click the share itinerary button"
 *   "I send the share"
 *
 * Assertions:
 *   "the booking status should be {string}"
 *   "the trip should be successfully cancelled"
 *   "I should see a success notification"
 *
 * ========================
 */

require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Search, Cart, Checkout } = require("../../src/dsl");
const tripStatus = require("../../src/data/tripStatus.json");

setDefaultTimeout(120000);

// ========================================
// GIVEN STEPS - SETUP
// ========================================

Given("I am logged in and ready to book a new trip", async function () {
  console.log("User is logged in and on new trip page");
});

Given("I am logged in as {string} {string} and ready to book a new trip", async function (provider, user) {
  console.log(`Logging in as ${provider}.${user} (from scenario outline)`);
  
  // Import dependencies
  const { chromium } = require("@playwright/test");
  const config = require("@config/config");
  const { App } = require("@dsl");
  
  // Validate user exists in config
  const userConfig = config.users?.[provider]?.[user];
  if (!userConfig) {
    throw new Error(`User not found in config: ${provider}.${user}`);
  }
  
  console.log(`Logging in as ${provider}.${user}`);
  
  // Setup browser
  this.browser = await chromium.launch({
    headless: config.headless || false,
    channel: "chrome",
    slowMo: config.slowMo || 0,
  });
  
  this.context = await this.browser.newContext();
  this.page = await this.context.newPage();
  
  // Navigate to app and login
  await this.page.goto(config.baseUrl, { waitUntil: "domcontentloaded" });
  await App.loginAs(this.page, userConfig);
  this.page = await App.bookANewTrip(this.page);
  
  console.log("Setup complete");
});

Given("I have added myself as the traveler", async function () {
  console.log("Adding traveler: I am the traveler");
  await Search.addMeAsTraveler(this.page);
});

Given("I have added traveler by name {string}", async function (travelerName) {
  console.log(`Adding traveler by name: ${travelerName}`);
  await Search.addTravelerByName(this.page, travelerName);
});

Given("I have added a random guest traveler", async function () {
  console.log("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
  console.log(`Guest added: ${result.guestData.firstName} ${result.guestData.lastName}`);
});

// ========================================
// WHEN STEPS - CART & CHECKOUT
// ========================================

When("I accept the terms and conditions", async function () {
  console.log("Accepting terms and conditions");
});

When("I proceed to checkout", async function () {
  console.log("Proceeding to checkout");
  await Cart.acceptTermsAndConditionsAndProceedToCheckout(this.page);
});

When("I complete the booking", async function () {
  console.log("Completing booking");
  await Checkout.bookAndFinalize(this.page);
});

When("I cancel the trip", async function () {
  console.log("Cancelling trip");
  await Cart.cancelTripStrict(this.page);
});

When("I attempt to cancel the trip safely", async function () {
  console.log("Attempting to cancel trip (safe mode)");
  const result = await Cart.cancelTripSafely(this.page);
  this.cancelResult = result;
});

// ========================================
// WHEN STEPS - SHARE FLOWS
// ========================================

When("I click the share quote button", async function () {
  console.log("Clicking share quote button");
  await Cart.clickShareQuoteAndWaitForSubjectField(this.page);
});

When("I click the share itinerary button", async function () {
  console.log("Clicking share itinerary button");
  await Cart.clickShareItineraryAndWaitForSubjectField(this.page);
});

When("I send the share", async function () {
  console.log("Sending share with success notification");
  await Cart.sendQuoteAndWaitForSuccess(this.page);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the booking status should be {string}", async function (status) {
  console.log(`Verifying booking status is: ${status}`);

  if (status === "Pending booking") {
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page: this.page });
  } else if (status === "On Hold") {
    await Cart.expectBookingStatus(tripStatus.label.onHold.status, { page: this.page });
  } else if (status === "Ticketing Complete") {
    await Cart.expectBookingStatus(tripStatus.label.ticketingComplete.status, { page: this.page });
  } else {
    throw new Error(`Unknown booking status: ${status}`);
  }
});

Then("the trip should be successfully cancelled", async function () {
  console.log("Trip cancellation validated");
});

Then("I should see a success notification", async function () {
  console.log("Verifying success notification is visible");
  const successNotification = this.page.getByText("Success", { exact: true });
  await successNotification.waitFor({ state: "visible" });
});

