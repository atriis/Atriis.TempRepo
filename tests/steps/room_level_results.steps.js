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

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - ROOM SELECTION
// ========================================

When("I add a refundable room to my cart", async function () {
  console.log("Adding refundable room to cart");
  await RoomLevelResults.addRefundableHotelRoomLevelToCart(this.page);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the hotel should appear as refundable in my cart", async function () {
  console.log("Verifying hotel is refundable");
  await Cart.isHotelRefundable(this.page);
});
