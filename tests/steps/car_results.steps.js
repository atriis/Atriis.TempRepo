require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("CarResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SELECTION & CART
// ========================================

When("I add a car from airport results to cart", async function () {
  logger.info("Adding car from airport results to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});

When("I add a car from city center results to cart", async function () {
  logger.info("Adding car from city center results to cart");
  await CarResults.addCarCityCenterFromResultsPageToCart(this.page);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the car location at city center index {int} should contain {string}", async function (index, expectedCity) {
  logger.info("Verifying car location contains expected city", { index, expectedCity });
  await CarResults.expectLocationToContain(this.page, index, expectedCity);
});

Then("the car location at airport index {int} should contain {string} on results", async function (index, expectedAirport) {
  logger.info("Verifying car airport location contains expected airport location on results", { index, expectedAirport });
  await CarResults.expectAirportLocationToContain(this.page, index, expectedAirport);
});

Then("the car location label at index {int} should contain {string} on results", async function (index, expectedLabel) {
  logger.info("Verifying car location label at index contains expected label on results", { index, expectedLabel });
  await CarResults.expectLocationLabelToContain(this.page, index, expectedLabel);
});

When("I select the first city center pickup location", async function () {
  logger.info("Selecting the first city center pickup location");
  await CarResults.selectFirstCityCenterPickupLocation(this.page);
});

Then("none of the car result titles should contain the word {string}", async function (word) {
  logger.info("Verifying car result titles do not contain unexpected word", { word });
  await CarResults.assertCarTitlesDoNotContainWord(this.page, word);
});

Then("the payment type on results should be {string}", async function (expectedPaymentType) {
  logger.info("Verifying car payment type on results", { expectedPaymentType });
  await CarResults.expectPaymentTypeOnResults(this.page, expectedPaymentType);
});

Then("the car FOP on results should be {string}", async function (expectedFOP) {
  logger.info("Verifying car FOP on results", { expectedFOP, agency: this.currentCarAgency || null });
  await CarResults.expectCurrentFOPOnResults(this.page, expectedFOP, { agencyName: this.currentCarAgency });
});

Then("the car FOP for agency {string} on results should be {string}", async function (agencyName, expectedFOP) {
  logger.info("Verifying car FOP for agency on results", { agencyName, expectedFOP });
  await CarResults.expectCurrentFOPOnResults(this.page, expectedFOP, { agencyName });
});

When("I capture the current car FOP on results", async function () {
  logger.info("Capturing current car FOP on results");
  this.currentCarFOP = await CarResults.getCurrentFOPOnResults(this.page);
  logger.info("Captured current car FOP on results", { currentCarFOP: this.currentCarFOP });
});

Then("the car model should be visible in the results", async function () {
  logger.info("Verifying car model is visible in results");
  await CarResults.expectCarModelIsVisible(this.page);
});

Then("the {string} filter should be visible in car results", async function (filterTitle) {
  logger.info("Verifying filter is visible in car results", { filterTitle });
  await CarResults.verifyFilterVisibleOnResults(this.page, filterTitle);
});

When("I open the first car location link in results", async function () {
  throw new Error("TODO: Implement opening first car location link in results using CarResults DSL/Page methods.");
});

Then("I should see the selected car location in Google Maps", async function () {
  throw new Error("TODO: Implement Google Maps location validation for the newly opened tab/window.");
});
