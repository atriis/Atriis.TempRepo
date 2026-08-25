require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { AmtrakSearch, Cart } = require("../../src/dsl");
const logger = require("@utils/logger").child("AmtrakSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Amtrak train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Amtrak train", { routeKey });
  await AmtrakSearch.searchAmtrakOneWay(this.page, routeKey);
});

When("I search for a round trip Amtrak train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Amtrak train", { routeKey });
  await AmtrakSearch.searchAmtrakRoundTrip(this.page, routeKey);
});

// Fills the round-trip form but leaves it on screen, so the scenario can go on validating the
// search inputs (time pickers, traveller count, promo code) before submitting.
When("I search for a round trip Amtrak train from {string} without clicking search button", async function (routeKey) {
  logger.info("Filling round trip Amtrak search without clicking search", { routeKey });
  await AmtrakSearch.searchAmtrakRoundTrip(this.page, routeKey, { clickSearch: false });
});

// ===== AMTRAK SEARCH FORM VALIDATIONS (test 60539) =====

When("I validate the departure time selector in Amtrak search by changing the hour", async function () {
  logger.info("Setting the Amtrak departure time to 01:00");
  const { time } = await AmtrakSearch.setDepartureTime(this.page, "01", "00");
  // Asserts the full HH:MM, not just the hour: the page object's own commit check only guards the
  // hour, so a minute that silently failed to select would otherwise go unnoticed.
  expect(time, `Departure time input should read 01:00, got "${time}"`).toContain("01:00");
});

When("I validate the return time selector in Amtrak search by changing the hour", async function () {
  logger.info("Setting the Amtrak return time to 02:00");
  const { time } = await AmtrakSearch.setReturnTime(this.page, "02", "00");
  expect(time, `Return time input should read 02:00, got "${time}"`).toContain("02:00");
});

When("I add a second traveler through the Amtrak search form", async function () {
  logger.info("Raising the Amtrak traveller count to 2");
  const { emptySlotVisible } = await AmtrakSearch.setTravelersCount(this.page, 2);
  expect(emptySlotVisible, "An empty traveler slot should appear after selecting 2 travellers").toBe(true);
});

When("I type {string} in promo code field", async function (code) {
  logger.info("Entering an Amtrak promo code", { code });
  await AmtrakSearch.enterPromoCode(this.page, code);
});

Then("the promo code minimum length validation {string} should be displayed", async function (expectedMessage) {
  logger.info("Verifying the Amtrak promo code length validation", { expectedMessage });
  const { message } = await AmtrakSearch.getPromoCodeValidationMessage(this.page);
  expect(message, `Promo code validation should read "${expectedMessage}"`).toBe(expectedMessage);
});

// "Travelers details" is the loyalty-card section the Amtrak form renders once the trip has
// passengers; expanding it means opening a traveller's loyalty dropdown and picking a card.
When("I expand the traveler detail section in Amtrak search", async function () {
  logger.info("Selecting a loyalty card in the Amtrak Travelers details section");
  const { card } = await AmtrakSearch.selectTravelerLoyaltyCard(this.page);
  expect(card, "A loyalty card should have been selected").toBeTruthy();
});

// ===== TODO STUBS — Then steps =====

Then("the fare rules should be accessible in cart", async function () {
  throw new Error("TODO: Implement clicking both fare rule buttons in cart, verifying dialog content (Cancellations, Changes headings), and closing. See Check_Fare_rules_in_cart() in Testim source.");
});

Then("the fare rules should be accessible in the trip overview after booking", async function () {
  throw new Error("TODO: Implement clicking fare rules button in trip overview, verify title contains NYP, verify Cancellations/Changes, close. See Amtrak_fare_rules_in_cart__after_checkout() in Testim source.");
});

Then("the copy trip should indicate the Amtrak booking cannot be copied", async function () {
  throw new Error("TODO: Implement hovering expand dropdown, clicking Copy Trip, verifying 'This item can not be copied' badge, closing dialog. See Not_eligible_for_copy_trip() in Testim source.");
});

Then("the Amtrak search results should be displayed", async function () {
  throw new Error("TODO: Implement clicking search button, proceeding through reference fields popup, and waiting for Amtrak results list to appear.");
});

// ===== AMTRAK CART PAGE VALIDATIONS (test 60544) =====

// extras-collapse.vue prints this notice for any quote whose status is Selected and opens the
// accordion for it on created(), so a pending Amtrak quote shows it with no click of our own.
Then("the required extras notice should be visible in cart", async function () {
  logger.info("Verifying the Amtrak required-extras notice is displayed in the cart");
  await Cart.verifyAmtrakRequiredExtrasNoticeInCart(this.page);
});

// Must follow "I expand the contact informations section in cart": the label lives inside the open
// card, and is not rendered while the row is collapsed or still showing its loading skeleton.
Then("the phone number field should be visible in the Amtrak cart extras", async function () {
  logger.info("Verifying the phone number label is visible in the open Amtrak Contact Information card");
  await Cart.verifyAmtrakContactInfoPhoneLabelVisible(this.page);
});

// Partial match, unlike 67751's full-title step: this scenario asserts only the product prefix,
// which holds for any route, instead of pinning the destination the route under test happens to use.
Then("the Amtrak summary title should contain {string}", async function (expectedText) {
  logger.info("Verifying the Amtrak trip-overview summary title", { expectedText });
  await Cart.verifyAmtrakQuoteSummaryTitleContains(this.page, expectedText);
});

// Self-contained like its Benerail counterpart — opens the quote card's Fare Rules dialog, reads it
// and closes it — so no separate "click to open fare rules" step belongs before it.
Then("the fare rules should be accessible in the Amtrak cart and contain {string}", async function (expectedText) {
  logger.info("Verifying the Amtrak fare rules dialog in the cart", { expectedText });
  await Cart.verifyRailFareRulesDialogContainsText(this.page, expectedText, 0);
});

// ===== AMTRAK CONTACT INFORMATION (mandatory phone number — test 62852) =====

// Reads the collapsed heading, so it must come before the row is expanded: extras-layout.vue
// removes the whole summary (asterisk included) once the row opens.
Then("the contact information section should be required in cart", async function () {
  logger.info("Verifying the Amtrak Contact Information extras row is marked mandatory");
  await Cart.verifyAmtrakContactInfoRequiredInCart(this.page);
});

// Phrase kept as the feature spells it ("informations").
When("I expand the contact informations section in cart", async function () {
  logger.info("Expanding the Amtrak Contact Information extras row in the cart");
  await Cart.expandAmtrakContactInfoInCart(this.page);
});

// Expands the row itself, so it stands alone after "I add the first result to trip" with no
// separate expand step. Stops after Save — the T&C tick and the Proceed click belong to the
// following "I proceed to checkout" step, which already does both.
When("I fill in Amtrak contact information", async function () {
  logger.info("Filling the mandatory Amtrak contact information in the cart");
  await Cart.fillAmtrakContactInfoInCart(this.page, {
    countryCode: "1",
    areaCode: "310",
    number: "3338888",
  });
});

Then("the phone number fields should be empty in cart", async function () {
  logger.info("Verifying the Amtrak phone number fields are empty in the cart");
  await Cart.verifyAmtrakContactInfoPhoneFieldsEmpty(this.page);
});

// The red border needs BOTH an invalid row and a prior Proceed to Checkout click (extras-layout.vue
// only sets isCheckoutActivated from the event trip-cart.ts emits there), so this belongs after one.
Then("the contact information should have red border because it is mandatory", async function () {
  logger.info("Verifying the Amtrak Contact Information row is highlighted in red");
  await Cart.verifyAmtrakContactInfoHighlightedInRed(this.page);
});

Then("the mandatory information validation error should be displayed", async function () {
  throw new Error("TODO: Implement verifying '.form-payment-err' shows '*In order to proceed, please add all required information'.");
});

Then("the Amtrak GetTrip API should return clean data for trip {int} and agency {int}", async function (tripId, agencyId) {
  throw new Error(`TODO: Implement API test calling GetTrip for TripId=${tripId}, AgencyId=${agencyId} and asserting no missing fields.`);
});

Then("the GetTrip API should return passive PNR information for trip {int} and agency {int}", async function (tripId, agencyId) {
  throw new Error(`TODO: Implement API test calling GetTrip for TripId=${tripId}, AgencyId=${agencyId} and asserting passive PNR information is present.`);
});

