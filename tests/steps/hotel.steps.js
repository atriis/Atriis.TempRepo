/**
 * Hotel Booking Step Definitions
 *
 * Maps Gherkin steps to DSL methods for hotel-specific flows.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a hotel in {string} for {int} night(s)"
 *
 * Selection:
 *   "I select the first available hotel"
 *   "I add a refundable room to my cart"
 *
 * Assertions:
 *   "the hotel should appear as refundable in my cart"
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  HotelSearch,
  HotelLevelResults,
  RoomLevelResults,
  Cart,
} = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SEARCH
// ========================================

When("I search for a hotel in {string} for {int} night(s)", async function (location, nights) {
  console.log(`Searching for hotel in ${location} for ${nights} night(s)`);
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights: nights });
});

// ========================================
// WHEN STEPS - HOTEL SELECTION
// ========================================

When("I select the first available hotel", async function () {
  console.log("Selecting first hotel option");
  await HotelLevelResults.clickFirstHotelOption(this.page);
});

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

