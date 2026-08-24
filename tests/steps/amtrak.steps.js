require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
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

// ===== TODO STUBS — converted from Testim (need DSL/Page implementation) =====

When("I fill in Amtrak contact information and proceed to checkout", async function () {
  throw new Error("TODO: Implement filling contact info (phone country '1', area '310', number '3338888'), save, accept T&C, and proceed to checkout. See AmtrakSearch DSL / CartPage.");
});

When("I validate the departure time selector in Amtrak search", async function () {
  throw new Error("TODO: Implement opening From time picker and selecting hour=01, minute=00 in Amtrak search form.");
});

When("I validate the return time selector in Amtrak search", async function () {
  throw new Error("TODO: Implement opening To time picker and selecting hour=02, minute=00 in Amtrak search form.");
});

When("I add a second traveler through the Amtrak search form", async function () {
  throw new Error("TODO: Implement clicking add-traveler icon in Amtrak search and selecting from dropdown.");
});

When("I expand the traveler detail section in Amtrak search", async function () {
  throw new Error("TODO: Implement clicking the traveler detail edit icon and option in Amtrak search form.");
});

When("I enter a valid Amtrak promo code", async function () {
  throw new Error("TODO: Implement entering a valid 4-character promo code ('1234') into the promo code field.");
});

When("I expand the Amtrak extras section in cart", async function () {
  throw new Error("TODO: Implement clicking '.ticket-layout-container .is-clickable' to expand Amtrak extras in cart.");
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

Then("the promo code minimum length validation should be displayed", async function () {
  throw new Error("TODO: Implement entering '123' in promo code field and verifying 'Promo Code must be 4 characters' error.");
});

Then("the Amtrak search results should be displayed", async function () {
  throw new Error("TODO: Implement clicking search button, proceeding through reference fields popup, and waiting for Amtrak results list to appear.");
});

Then("the Amtrak trip timer badge should be visible in cart", async function () {
  throw new Error("TODO: Implement checking visibility of '.app-columns .material-symbols-outlined' and hovering '.timed-quote-badge'. See counter() in Testim source.");
});

Then("the required extras notice should be visible in cart", async function () {
  throw new Error("TODO: Implement verifying 'Please add the required extras' notice is visible in the Amtrak cart section.");
});

Then("the contact information section should be visible in the Amtrak cart extras", async function () {
  throw new Error("TODO: Implement verifying 'Contact Information' card title is visible after expanding Amtrak extras.");
});

Then("the phone number field should be visible in the Amtrak cart extras", async function () {
  throw new Error("TODO: Implement verifying 'Phone number' label is visible in the Amtrak cart extras section.");
});

Then("the Amtrak summary title should contain the destination", async function () {
  throw new Error("TODO: Implement verifying '.summary-title' contains text matching /Amtrak Rail to/.");
});

Then("the fare rules cancellations section should be visible", async function () {
  throw new Error("TODO: Implement verifying '.rules > :nth-child(1)' contains 'Cancellations' after opening fare rules in cart.");
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

Then("the Amtrak destination title and train icon should be displayed in the trip overview", async function () {
  throw new Error("TODO: Implement verifying train icon '.el-tabs .icon-img' is visible and span contains 'Amtrak Rail to Boston , Massachusetts (BOS)'. See Destinatio_title_is_displayed_in_trip_overview() in Testim source.");
});

Then("the Amtrak GetTrip API should return clean data for trip {int} and agency {int}", async function (tripId, agencyId) {
  throw new Error(`TODO: Implement API test calling GetTrip for TripId=${tripId}, AgencyId=${agencyId} and asserting no missing fields.`);
});

Then("the GetTrip API should return passive PNR information for trip {int} and agency {int}", async function (tripId, agencyId) {
  throw new Error(`TODO: Implement API test calling GetTrip for TripId=${tripId}, AgencyId=${agencyId} and asserting passive PNR information is present.`);
});

