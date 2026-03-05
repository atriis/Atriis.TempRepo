/**
 * Room Level Results Step Definitions
 *
 * Maps Gherkin steps to RoomLevelResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection:
 *   "I add a refundable room to my cart"
 *   "I add the first available room to my cart"
 *
 * Extraction:
 *   "I extract cancellation policy from room level results"
 *     → RoomLevelResults.extractCancellationPolicy(page)
 *     → Stores result in this.cancellationPolicy
 *
 * Assertions:
 *   "the hotel should appear as refundable in my cart"
 *   "the cancellation policy in the cart should match the cancellation policy from room level results"
 *     → Compares this.cartCancellationPolicy (set by "I extract cancellation policy from cart")
 *     → with this.roomLevelCancellationPolicy (set by extraction step) using strict equality
 *   "I should see member rates displayed in room level results"
 *     → RoomLevelResults.verifyMemberRatesDisplayed(page)
 *   "the member rate price should be lower than the regular price"
 *     → RoomLevelResults.compareMemberVsRegularPrice(page)
 *
 * ========================
 */

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

// ========================================
// WHEN STEPS - EXTRACTION
// ========================================

When("I extract cancellation policy from first room level results", async function () {
  logger.info("Extracting cancellation policy from first room level results");
  this.roomLevelCancellationPolicy = await RoomLevelResults.extractCancellationPolicy(this.page);
  logger.info("Extracted cancellation policy from room level results", { roomLevelCancellationPolicy: this.roomLevelCancellationPolicy });
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
