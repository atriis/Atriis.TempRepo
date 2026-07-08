require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { TravelRequest } = require("@dsl");
const logger = require("@utils/logger").child("TravelRequest");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I send a flight travel request from {string} to {string}", async function (from, to) {
  logger.info("Sending a flight travel request", { from, to });
  await TravelRequest.sendFlightTravelRequest(this.page, from, to);
});

When("I navigate to the trip from the travel request", async function () {
  logger.info("Navigating to trip from travel request success screen");
  await TravelRequest.navigateToTravelRequestTrip(this.page);
});

When("I open the advanced flight search in the request assistance form", async function () {
  logger.info("Opening advanced flight search in the request assistance form");
  await TravelRequest.openAdvancedFlightSearch(this.page);
});

When(
  "I send an advanced flight search travel request from {string} to {string} with a stop in {string} and preferred airline {string}",
  async function (from, to, via, preferredAirline, dataTable) {
    // The data table carries one row per direction: | direction | dateType | time | cabin |
    const rows = dataTable.hashes();
    const outbound = rows.find((r) => r.direction === "outbound");
    const inbound = rows.find((r) => r.direction === "return");
    logger.info("Sending advanced flight search travel request", { from, to, via, preferredAirline, outbound, inbound });
    await TravelRequest.sendAdvancedFlightSearchTravelRequest(this.page, {
      from,
      to,
      via,
      preferredAirline,
      outbound,
      inbound,
    });
  }
);

When("I save the reference field popup if displayed", async function () {
  logger.info("Saving the reference field popup if displayed");
  await TravelRequest.saveReferenceFieldIfPresent(this.page);
});

// ===== THEN STEPS =====

Then("the {string} confirmation should be displayed", async function (expectedText) {
  logger.info("Verifying travel request confirmation message", { expectedText });
  if (expectedText === "Sent to agent") {
    await TravelRequest.verifySentToAgent(this.page);
  } else {
    await this.page.getByText(expectedText).first().waitFor({ state: "visible", timeout: 30000 });
  }
});

Then("the travel requested items should be visible in the trip", async function () {
  logger.info("Verifying requested items are visible in the trip view");
  await TravelRequest.verifyRequestedItemsVisible(this.page);
});

Then(
  "the travel requested item should be visible in the trip with the title containing {string} text",
  async function (text) {
    logger.info("Verifying travel requested item title contains text", { text });
    await TravelRequest.verifyRequestedItemTitleContains(this.page, text);
  }
);

When("I navigate to the trip cart", async function () {
  logger.info("Navigating to trip cart via shopping cart icon");
  await TravelRequest.navigateToTripCart(this.page);
});

// ===== REQUEST-ASSISTANCE REVIEW FORM =====

// Captures the departure/return dates entered in the flight search form onto World state, so the
// later request-assistance verifies (flight depart/return + hotel check-in/check-out) compare
// against the same ground-truth values.
When("I extract departure and return dates", async function () {
  logger.info("Extracting departure and return dates from the flight search form");
  this.travelRequestDates = await TravelRequest.captureRoundTripDates(this.page);
  logger.info("Extracted travel-request dates", this.travelRequestDates);
});

Then("the travel request travelers section title should display {string}", async function (expected) {
  logger.info("Verifying travel request travelers section title", { expected });
  await TravelRequest.verifyTravelersSectionTitle(this.page, expected);
});

Then("the travel request form should show product {string}", async function (product) {
  logger.info("Verifying product is shown in the travel request form", { product });
  await TravelRequest.verifyProductInRequestForm(this.page, product);
});

Then("the travel request flight origin should show {string}", async function (expected) {
  logger.info("Verifying travel request flight origin", { expected });
  await TravelRequest.verifyRequestFlightOrigin(this.page, expected);
});

Then("the travel request flight destination should show {string}", async function (expected) {
  logger.info("Verifying travel request flight destination", { expected });
  await TravelRequest.verifyRequestFlightDestination(this.page, expected);
});

Then("the travel request flight depart date should show the extracted departure date", async function () {
  const dates = requireExtractedDates(this);
  logger.info("Verifying travel request flight depart date matches extracted date", { expected: dates.departureDate });
  await TravelRequest.verifyRequestFlightDepartDate(this.page, dates.departureDate);
});

Then("the travel request flight return date should show the extracted return date", async function () {
  const dates = requireExtractedDates(this);
  logger.info("Verifying travel request flight return date matches extracted date", { expected: dates.returnDate });
  await TravelRequest.verifyRequestFlightReturnDate(this.page, dates.returnDate);
});

Then("the travel request hotel destination should show {string}", async function (expected) {
  logger.info("Verifying travel request hotel destination", { expected });
  await TravelRequest.verifyRequestHotelDestination(this.page, expected);
});

Then("the travel request hotel check-in date should show the extracted flight departure date", async function () {
  const dates = requireExtractedDates(this);
  logger.info("Verifying travel request hotel check-in date matches extracted flight departure date", { expected: dates.departureDate });
  await TravelRequest.verifyRequestHotelCheckInDate(this.page, dates.departureDate);
});

Then("the travel request hotel check-out date should show the extracted flight return date", async function () {
  const dates = requireExtractedDates(this);
  logger.info("Verifying travel request hotel check-out date matches extracted flight return date", { expected: dates.returnDate });
  await TravelRequest.verifyRequestHotelCheckOutDate(this.page, dates.returnDate);
});

When("I click the send request button", async function () {
  logger.info("Clicking the send request button");
  await TravelRequest.clickSendRequest(this.page);
});

// ===== Request-assistance hotel/car/rail items + comments =====

Then("the request assistance hotel destination should contain {string}", async function (expected) {
  logger.info("Verifying request-assistance hotel destination contains text", { expected });
  await TravelRequest.verifyRequestAssistanceHotelDestination(this.page, expected);
});

When("I add the comment {string} to the request assistance hotel item", async function (comment) {
  logger.info("Adding comment to request-assistance hotel item", { comment });
  await TravelRequest.addHotelRequestComment(this.page, comment);
});

When("I add a car to the request assistance picking up in {string} with comment {string}", async function (location, comment) {
  logger.info("Adding car to request assistance", { location, comment });
  await TravelRequest.addCarToRequestAssistance(this.page, { location, comment });
});

When(
  "I add a rail journey to the request assistance from {string} to {string} with comment {string}",
  async function (origin, destination, comment) {
    logger.info("Adding rail journey to request assistance", { origin, destination, comment });
    await TravelRequest.addRailToRequestAssistance(this.page, { origin, destination, comment });
  }
);

// ===== Review popup =====

Then("the travel request review should display the field label {string}", async function (label) {
  logger.info("Verifying travel request review field label", { label });
  await TravelRequest.verifyReviewFieldLabel(this.page, label);
});

Then("the travel request review should display the traveler name {string}", async function (name) {
  logger.info("Verifying travel request review traveler name", { name });
  await TravelRequest.verifyReviewTravelerName(this.page, name);
});

Then("the financial reference field should not be displayed in the travel request popup", async function () {
  logger.info("Verifying financial reference field is not displayed in the travel request popup");
  await TravelRequest.verifyFinancialReferenceNotDisplayed(this.page);
});

Then("the number of reference and dynamic fields in the travel request popup should be {int}", async function (count) {
  logger.info("Verifying number of reference and dynamic fields in the travel request popup", { count });
  await TravelRequest.verifyReviewFieldCount(this.page, count);
});

// ===== Trip requested items =====

Then("the requested {word} item should be displayed in the trip", async function (product) {
  logger.info("Verifying requested item is displayed in the trip", { product });
  const titleMap = { hotel: "Hotel", car: "Car", rail: "Rail" };
  await TravelRequest.verifyRequestedItemTitleContains(this.page, titleMap[product] || product);
});

Then("the requested {word} item comment should be {string}", async function (product, comment) {
  logger.info("Verifying requested item comment in the trip", { product, comment });
  await TravelRequest.verifyRequestedItemComment(this.page, product, comment);
});

/**
 * Returns the dates captured by "I extract departure and return dates", failing with a clear
 * message if that step did not run first (the date verifies depend on the shared World state).
 * @param {object} world - Cucumber World (`this`)
 * @returns {{departureDate: string, returnDate: string}}
 */
function requireExtractedDates(world) {
  if (!world.travelRequestDates) {
    throw new Error(
      'No extracted dates on World state. Run "I extract departure and return dates" before verifying travel-request dates.'
    );
  }
  return world.travelRequestDates;
}
