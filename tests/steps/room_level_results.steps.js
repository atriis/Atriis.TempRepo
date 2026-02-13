/**
 * Room Level Results Step Definitions
 *
 * Maps Gherkin steps to RoomLevelResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection:
 *   "I add a refundable room to my cart"
 *
 * Assertions:
 *   "the hotel should appear as refundable in my cart"
 *
 * ========================
 */

require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
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

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the hotel should appear as refundable in my cart", async function () {
  logger.info("Verifying hotel is refundable");
  await Cart.isHotelRefundable(this.page);
});
