require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("CarResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SELECTION & CART
// ========================================

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

Then("the car city center address at index {int} should contain {string} on results", async function (index, expectedAddress) {
  logger.info("Verifying car city center address at index contains expected address on results", { index, expectedAddress });
  await CarResults.expectCityCenterAddressToContain(this.page, index, expectedAddress);
});

When("I select the first city center pickup location", async function () {
  logger.info("Selecting the first city center pickup location");
  await CarResults.selectFirstCityCenterPickupLocation(this.page);
});

Then("the agency station label should contain {string} on the vendor list", async function (expectedLabel) {
  if (!expectedLabel) return;
  logger.info("Verifying agency station label is visible on the vendor list", { expectedLabel });
  await CarResults.expectAgencyStationLabelOnVendorList(this.page, expectedLabel);
});

Then("the agency station label should contain {string} and address should contain {string} on the vendor list", async function (expectedLabel, expectedAddress) {
  if (!expectedLabel || !expectedAddress) return;
  logger.info("Verifying agency station label and address are visible on the vendor list", { expectedLabel, expectedAddress });
  await CarResults.expectAgencyStationLabelOnVendorList(this.page, expectedLabel, expectedAddress);
});

When("I select the city center pickup location by agency station label {string}", async function (stationLabel) {
  if (!stationLabel) {
    logger.info("Skipping selection - no station label provided, selecting first city center pickup location instead");
    await CarResults.selectFirstCityCenterPickupLocation(this.page);
    return;
  }
  logger.info("Selecting city center pickup location by agency station label", { stationLabel });
  await CarResults.selectCityCenterPickupLocationByLabel(this.page, stationLabel);
});

When("I select the city center pickup location by agency station label {string} and address {string}", async function (stationLabel, stationAddress) {
  if (!stationLabel || !stationAddress) {
    logger.info("Skipping selection by label and address - missing value(s), selecting first city center pickup location instead");
    await CarResults.selectFirstCityCenterPickupLocation(this.page);
    return;
  }
  logger.info("Selecting city center pickup location by agency station label and address", { stationLabel, stationAddress });
  await CarResults.selectCityCenterPickupLocationByLabel(this.page, stationLabel, stationAddress);
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

// ========================================
// PAYMENT & TERMS - CARS SPECIFIC
// ========================================

When("I click on the terms and conditions link in the trip overview", async function () {
  const { Cart } = require("@dsl");
  logger.info("Clicking terms and conditions link in trip overview");
  await Cart.clickPaymentTermsLink(this.page);
  this.termsAndConditionsModalOpenedAtStep = true;
});

When("I close the terms and conditions modal", async function () {
  const { Cart } = require("@dsl");
  logger.info("Closing terms and conditions modal");
  await Cart.closeTermsModal(this.page);
  this.termsAndConditionsModalClosed = true;
});

Then("The terms and conditions modal should display the {string} section", async function (sectionHeading) {
  const { Cart } = require("@dsl");
  logger.info(`Extracting terms and conditions modal section: ${sectionHeading}`);
  const result = await Cart.extractAndVerifyTermsModalSection(this.page, sectionHeading);
  this.termsAndConditionsSection = result;
});

When("I open the first car location link in results", async function () {
  throw new Error("TODO: Implement opening first car location link in results using CarResults DSL/Page methods.");
});

Then("I should see the selected car location in Google Maps", async function () {
  throw new Error("TODO: Implement Google Maps location validation for the newly opened tab/window.");
});

