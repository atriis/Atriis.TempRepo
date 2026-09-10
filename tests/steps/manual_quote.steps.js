require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  ManualQuoteSearch,
} = require("../../src/dsl");
const logger = require("@utils/logger").child("ManualQuote");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a flight manual quote from {string} to {string}", async function (from, to) {
  logger.info("Adding one-way flight manual quote", { from, to });
  await ManualQuoteSearch.searchAndAddFlightManualQuote(this.page, { from, to });
});

When("I add a flight manual quote from {string} to {string} round trip", async function (from, to) {
  logger.info("Adding round-trip flight manual quote", { from, to });
  await ManualQuoteSearch.searchAndAddFlightManualQuoteRoundTrip(this.page, { from, to });
});

When("I add a hotel manual quote in {string}", async function (city) {
  logger.info("Adding hotel manual quote", { city });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city);
});

When("I add a hotel manual quote in {string} for {int} room(s)", async function (city, numberOfRooms) {
  logger.info("Adding hotel manual quote", { city, numberOfRooms });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city, { numberOfRooms });
});

// Adds a hotel manual quote pinned to a single room. Some bookers (e.g. will@mref.com) only offer
// "1 Room" in the manual-quote Number Of Rooms dropdown, so the default step's 4 rooms has no option
// to select and times out — this variant selects the single available room (test 37964).
When("I add a hotel manual quote in {string} for a single room", async function (city) {
  logger.info("Adding single-room hotel manual quote", { city });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city, { numberOfRooms: 1 });
});

When("I navigate to the manual quote search page", async function () {
  logger.info("Navigating to the manual quote search page");
  await ManualQuoteSearch.openManualQuotePage(this.page);
});

Then("the manual quote page should warn {string}", async function (text) {
  logger.info("Verifying manual quote warning text", { text });
  await ManualQuoteSearch.expectWarningText(this.page, text);
});

Then("the manual quote page title should mention {string}", async function (fragment) {
  logger.info("Verifying manual quote heading", { fragment });
  await ManualQuoteSearch.expectHeadingContains(this.page, fragment);
});

Then("a Back button should be displayed on the manual quote page", async function () {
  logger.info("Verifying Back button is displayed on manual quote page");
  await ManualQuoteSearch.expectBackButtonVisible(this.page);
});

When("I click the Back button on the manual quote page", async function () {
  logger.info("Clicking Back button on manual quote page");
  await ManualQuoteSearch.clickBack(this.page);
});

// ===== CAR MANUAL QUOTE FORM OF PAYMENT =====

When("I navigate to car search form", async function () {
  logger.info("Switching to Car sub-tab in manual quote");
  await ManualQuoteSearch.navigateToCarSearchForm(this.page);
});

When("I scroll to the manual quote car form of payment section", async function () {
  logger.info("Scrolling to Car payment section");
  await ManualQuoteSearch.scrollToCarFopSection(this.page);
});

When("I open the manual quote car form of payment dropdown", async function () {
  logger.info("Opening Car FOP dropdown");
  await ManualQuoteSearch.openCarFopDropdown(this.page);
});

Then("the credit card {string} should be available", async function (cardName) {
  logger.info("Verifying credit card is available in FOP dropdown", { cardName });
  await ManualQuoteSearch.expectFopOptionVisible(this.page, cardName);
});

When("I select the credit card {string}", async function (cardName) {
  logger.info("Selecting credit card from FOP dropdown", { cardName });
  await ManualQuoteSearch.selectFopOption(this.page, cardName);
});

Then("the manual quote car card type should display {string}", async function (cardType) {
  logger.info("Verifying Car card type display value", { cardType });
  await ManualQuoteSearch.expectCardTypeDisplayed(this.page, cardType);
});

When("I open the manual quote car credit type dropdown", async function () {
  logger.info("Opening Car Card Type dropdown");
  await ManualQuoteSearch.openCardTypeDropdown(this.page);
});

Then(
  "the credit type dropdown should list the following card types",
  async function (dataTable) {
    const expectedList = dataTable.raw().map((row) => String(row[0]).trim());
    logger.info("Verifying card types in dropdown", { expectedList });
    await ManualQuoteSearch.expectCardTypesInDropdown(this.page, expectedList);
  },
);

// ===== OTHER PRODUCTS MANUAL QUOTE =====

When("I add a {string} other manual quote with comment {string} and base fare {int}", async function (quoteType, comment, baseFare) {
  logger.info("Adding other product manual quote", { quoteType, comment, baseFare });
  await ManualQuoteSearch.addOtherProductManualQuote(this.page, { quoteType, comment, baseFare });
});

// ===== CAR MANUAL QUOTE =====

When("I add a car manual quote with pick up in {string} and drop off in {string}", async function (pickupCity, dropoffCity) {
  logger.info("Adding car manual quote", { pickupCity, dropoffCity });
  await ManualQuoteSearch.addCarManualQuote(this.page, { pickupCity, dropoffCity });
});

// ===== GROUND TRANSPORT MANUAL QUOTE =====

When("I add a ground transport manual quote with pickup {string} dropoff {string} vendor {string} phone {string} vehicle {string} cancellation {string} confirmation {string} base fare {int} and tax {int}", async function (
  pickup, dropoff, vendor, vendorPhone, vehicleType, cancellationPolicy, confirmationNumber, baseFare, tax
) {
  logger.info("Adding ground transport manual quote", { pickup, dropoff, vendor, baseFare });
  await ManualQuoteSearch.addGroundTransportManualQuote(this.page, {
    pickup,
    dropoff,
    hour: "10:00",
    vehicleType,
    vendor,
    vendorPhone,
    cancellationPolicy,
    confirmationNumber,
    baseFare,
    tax,
  });
});

// ===== GROUND TRANSPORT MANUAL QUOTE — optional "new format" fields (test 74842) =====

// The mandatory half of the ground transport form carries no meaning for test 74842 — it only
// has to be valid so "Add Quote" enables. These are the values test 41117 already proves work
// against the vendor/vehicle-type lists on staging.
const GROUND_TRANSPORT_MANDATORY_DEFAULTS = {
  hour: "10:00",
  vehicleType: "All Types",
  vendor: "aces transporation",
  vendorPhone: "7183232323",
  cancellationPolicy: "test cancellation policy",
  confirmationNumber: "SJ-90885",
  baseFare: 29,
  tax: 10,
};

When("I open the ground transport manual quote form", async function () {
  logger.info("Opening the ground transport manual quote form");
  await ManualQuoteSearch.openGroundTransportManualQuoteForm(this.page);
});

Then("the ground transport manual quote form should show {string} as an optional field", async function (labelText) {
  logger.info("Verifying a ground transport manual quote field is present and optional", { labelText });
  await ManualQuoteSearch.expectGroundFieldIsPresentAndOptional(this.page, labelText);
});

Then("the ground transport manual quote form of payment should be {string}", async function (expectedLabel) {
  logger.info("Verifying the ground transport manual quote form of payment", { expectedLabel });
  await ManualQuoteSearch.expectGroundFormOfPayment(this.page, expectedLabel);
});

When("I select the ground transport manual quote form of payment {string}", async function (label) {
  logger.info("Selecting the ground transport manual quote form of payment", { label });
  await ManualQuoteSearch.selectGroundFormOfPayment(this.page, label);
});

When("I fill the ground transport manual quote from {string} to {string}", async function (pickup, dropoff) {
  logger.info("Filling the ground transport manual quote form", { pickup, dropoff });
  await ManualQuoteSearch.fillGroundTransportManualQuoteForm(this.page, {
    ...GROUND_TRANSPORT_MANDATORY_DEFAULTS,
    pickup,
    dropoff,
    isFormAlreadyOpen: true,
  });
});

// The three optional fields are stored on the World so the later cart and share-email steps can
// assert against exactly what was typed instead of repeating the literals.
When("I fill the ground transport manual quote flight number {string}, comment {string} and passenger phone {string}", async function (flightNumber, comment, passengerPhone) {
  logger.info("Filling the optional ground transport manual quote details", {
    flightNumber,
    comment,
    passengerPhone,
  });
  this.groundManualQuoteDetails = await ManualQuoteSearch.fillGroundTransportOptionalDetails(this.page, {
    flightNumber,
    comment,
    passengerPhone,
  });
});

When("I add the ground transport manual quote", async function () {
  logger.info("Submitting the ground transport manual quote");
  await ManualQuoteSearch.submitGroundTransportManualQuote(this.page);
});
