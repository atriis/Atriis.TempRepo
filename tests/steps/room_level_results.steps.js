require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { RoomLevelResults } = require("../../src/dsl");
const { ResultsPage } = require("../../src/pages/ResultsPage");
const RoomLevelResultsPage = require("../../src/pages/RoomLevelResultsPage");
const logger = require("@utils/logger").child("RoomResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - ROOM SELECTION
// ========================================

When("I add a refundable room to my cart", async function () {
  logger.info("Adding refundable room to cart");
  await RoomLevelResults.addRefundableHotelRoomLevelToCart(this.page);
});

When("I add the first available room to my cart", async function () {
  logger.info("Adding first available room to cart");
  await RoomLevelResults.addFirstHotelRoomLevelToCart(this.page);
});

When("I wait for the first add to trip button in room level results to be visible", async function () {
  logger.info("Waiting for first add to trip button in room level results to be visible");
  const roomLevelResultsPage = new RoomLevelResultsPage(this.page);
  const resultsPage = new ResultsPage(this.page);
    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.scrollToFirstAddToTripButton();
    await resultsPage.waitForAddToTripText();
});

When("I wait for the first add to trip button to be visible in room level results", async function () {
  logger.info("Waiting for first add to trip button to be visible in room level results");
  const roomLevelResultsPage = new RoomLevelResultsPage(this.page);
  const resultsPage = new ResultsPage(this.page);
  await roomLevelResultsPage.waitForViewHotelOnMapText();
  await resultsPage.scrollToFirstAddToTripButton();
  await resultsPage.waitForAddToTripText();
});

When("I wait for view hotel on map button to be visible in room level results", async function () {
  logger.info("Waiting for view hotel on map button in room level results");
  await RoomLevelResults.waitForViewHotelOnMapButtonInRoomLevelResults(this.page);
});

When("I click the view on map button in room level", async function () {
  logger.info("Clicking view hotel on map button in room level results");
  await RoomLevelResults.clickViewOnMap(this.page);
});

// ========================================
// WHEN STEPS - EXTRACTION
// ========================================

When("I extract cancellation policy from first room level results", async function () {
  logger.info("Extracting cancellation policy from first room level results");
  this.roomLevelCancellationPolicy = await RoomLevelResults.extractCancellationPolicy(this.page);
  logger.info("Extracted cancellation policy from room level results", { roomLevelCancellationPolicy: this.roomLevelCancellationPolicy });
});

When("I extract the price from room level results", async function () {
  logger.info("Extracting price from room level results");
  this.roomLevelPrice = await RoomLevelResults.extractRoomLevelPrice(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(this.roomLevelPrice);
  logger.info("Stored room level price", { roomLevelPrice: this.roomLevelPrice });
});

When("I extract the booking fee from the first room result", async function () {
  logger.info("Extracting booking fee from first room result");
  this.roomBookingFee = await RoomLevelResults.extractBookingFeeRoomLevel(this.page);
  logger.info("Stored room booking fee", { roomBookingFee: this.roomBookingFee });
});

When("I check terms and conditions in room level", async function () {
  logger.info("Clicking terms and conditions on first room");
  this.termsDialogVisible = await RoomLevelResults.checkTermsAndConditions(this.page);
});

When("I filter room results by deposit not required", async function () {
  logger.info("Filtering room results by deposit not required");
  await RoomLevelResults.filterRoomsByDepositNotRequired(this.page);
});

When("I filter room results by deposit required", async function () {
  logger.info("Filtering room results by deposit required");
  await RoomLevelResults.filterRoomsByDeposit(this.page);
});

When("I filter room results by refundable", async function () {
  logger.info("Filtering room results by refundable");
  await RoomLevelResults.filterRoomsByRefundable(this.page);
});

When("I verify the room price appears in the terms and conditions", async function () {
  if (this.roomLevelPrice === undefined) {
    throw new Error(
      "No room level price stored. Run 'When I extract the price from room level results' before this step."
    );
  }
  logger.info("Verifying room price appears in terms and conditions", { price: this.roomLevelPrice });
  await RoomLevelResults.verifyPriceInTermsAndConditions(this.page, this.roomLevelPrice);
});

Then("terms and conditions are displayed", async function () {
  if (this.termsDialogVisible === undefined) {
    throw new Error("Terms dialog state not recorded. Run 'When I check terms and conditions in room level' before this step.");
  }
  if (!this.termsDialogVisible) {
    throw new Error("Terms and conditions dialog was not visible after clicking the button.");
  }
  logger.info("Terms and conditions dialog confirmed visible");
});

Then("the booking fee from hotel level should match the booking fee from room level", async function () {
  if (this.hotelBookingFee === undefined) {
    throw new Error("No hotel booking fee stored. Run 'I extract the booking fee from the first hotel result' before this step.");
  }
  if (this.roomBookingFee === undefined) {
    throw new Error("No room booking fee stored. Run 'I extract the booking fee from the first room result' before this step.");
  }
  logger.info("Comparing booking fees", { hotelBookingFee: this.hotelBookingFee, roomBookingFee: this.roomBookingFee });
  await RoomLevelResults.compareBookingFees(this.page, this.hotelBookingFee, this.roomBookingFee);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the cancellation policy in the cart should match the cancellation policy from room level results", async function () {
  if (!this.roomLevelCancellationPolicy) {
    throw new Error("No cancellation policy stored. Run 'I extract cancellation policy from first room level results' before this step.");
  }
  if (!this.cartCancellationPolicy) {
    throw new Error("No cart cancellation policy stored. Run 'I extract cancellation policy from cart' before this step.");
  }
  logger.info("Comparing cancellation policies", { roomResults: this.roomLevelCancellationPolicy, cart: this.cartCancellationPolicy });
  expect(this.cartCancellationPolicy).toBe(this.roomLevelCancellationPolicy);
});

Then("I should see member rates displayed in room level results", async function () {
  logger.info("Verifying member rates are displayed in room level results");
  const isVisible = await RoomLevelResults.verifyMemberRatesDisplayed(this.page);
  logger.info("Member rates verification result", { isVisible });
  expect(isVisible).toBe(true);
});

Then("the CO2 emissions should be displayed in room level results", async function () {
  logger.info("Verifying CO2 emissions are displayed in room level results");
  const result = await RoomLevelResults.verifyCO2InRoomLevel(this.page);
  logger.info("CO2 verification result in room level", { visible: result.visible, value: result.value });
  expect(result.visible).toBe(true);
});

Then("the {string} supplier logo should be visible in room level results", async function (supplierName) {
  logger.info("Verifying supplier logo is visible in room level results", { supplierName });
  const isVisible = await RoomLevelResults.verifySupplierLogo(this.page, supplierName);
  if (!isVisible) throw new Error(`Supplier logo for "${supplierName}" not visible in room level results`);
});

Then("the member rate price should be lower than the regular price", async function () {
  logger.info("Comparing member rate price vs regular price");
  const comparison = await RoomLevelResults.compareMemberVsRegularPrice(this.page);
  logger.info("Price comparison result", comparison);
  expect(comparison.hasDiscount).toBe(true);
  expect(comparison.memberPrice).toBeLessThan(comparison.regularPrice);
});



Then("the room level results should display {int} nights", async function (nights) {
  logger.info(`Verifying ${nights} nights displayed in room level results`);
  await RoomLevelResults.verifyNightsCountInRoomLevel(this.page, nights);
});

Then("the hotel level price should match the room level price", async function () {
  logger.info("Comparing hotel level price with room level price", {
    hotelLevelPrice: this.hotelLevelPrice,
    roomLevelPrice: this.roomLevelPrice,
  });

  const result = await RoomLevelResults.compareHotelAndRoomLevelPrices(
    this.page,
    this.hotelLevelPrice,
    this.roomLevelPrice,
  );

  logger.info("Price comparison succeeded", result);
  expect(result.difference).toBeLessThanOrEqual(0.01);
});

Then("the hotel map should open in room level results", async function () {
  logger.info("Verifying hotel map modal is visible in room level results");
  await RoomLevelResults.verifyMapModalOpened(this.page);
});

When("I filter room results by Wi-Fi amenity", async function () {
  logger.info("Filtering room results by Wi-Fi amenity");
  await RoomLevelResults.filterRoomsByWifi(this.page);
});

Then("only rooms with Wi-Fi should be displayed", async function () {
  logger.info("Verifying only rooms with Wi-Fi amenity are displayed");
  await RoomLevelResults.verifyWifiRoomsOnly(this.page);
});

When("I filter room results by breakfast included", async function () {
  logger.info("Filtering room results by breakfast included");
  await RoomLevelResults.filterRoomsByBreakfast(this.page);
});

Then("only rooms with breakfast should be displayed", async function () {
  logger.info("Verifying only rooms with breakfast amenity are displayed");
  await RoomLevelResults.verifyBreakfastRoomsOnly(this.page);
});

When("I click on price details button in room level results", async function () {
  logger.info("Clicking price details button in room level results");
  const roomLevelResultsPage = new RoomLevelResultsPage(this.page);
  await roomLevelResultsPage.clickPriceDetailsButton();
});

When("I hover over info icon next to taxes and fees", async function () {
  logger.info("Hovering over info icon next to taxes and fees");
  const roomLevelResultsPage = new RoomLevelResultsPage(this.page);
  await roomLevelResultsPage.hoverPayAtHotelInfoIcon();
});

Then("the {string} tooltip should be correct", async function (tooltipText) {
  logger.info("Verifying tooltip text", { expected: tooltipText });
  const roomLevelResultsPage = new RoomLevelResultsPage(this.page);
  const actualText = await roomLevelResultsPage.getPayAtHotelTooltipText();
  logger.info("Tooltip text found", { actual: actualText });
  expect(actualText).toBe("Paid at the hotel");
});

Then("I see room level filter sections", async function () {
  logger.info("Verifying room level filter sections are visible");
  await RoomLevelResults.verifyRoomLevelFilters(this.page);
});

When("I apply room level filter {string} with option {string}", async function (filterName, optionText) {
  logger.info("Applying room level filter", { filterName, optionText });
  await RoomLevelResults.applyRoomFilter(this.page, filterName, optionText);
});
