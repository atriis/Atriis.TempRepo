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
 *
 * ========================
 */

require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { RoomLevelResults, Cart } = require("../../src/dsl");
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

Then("the hotel should appear as refundable in my cart", async function () {
  logger.info("Verifying hotel is refundable");
  await Cart.expectHotelToBeRefundableInCart(this.page);
});

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
