/**
 * Hotel Booking Step Definitions
 * 
 * Maps Gherkin steps to DSL methods for hotel-specific flows.
 * 
 * ===== STEP CATALOG =====
 * 
 * When Steps:
 *   "I search for a hotel in {string} for {int} night(s)"
 *     → HotelSearch.searchHotelByNights(page, { where: location, nights: nights })
 * 
 *   "I select the first available hotel"
 *     → HotelLevelResults.clickFirstHotelOption(page)
 * 
 *   "I add a refundable room to my cart"
 *     → RoomLevelResults.addRefundableHotelRoomLevelToCart(page)
 * 
 *   "I accept the terms and conditions"
 *   "I proceed to checkout"
 *     → Cart.acceptTermsAndConditionsAndProceedToCheckout(page)
 * 
 *   "I complete the booking"
 *     → Checkout.bookAndFinalize(page)
 * 
 *   "I cancel the trip"
 *     → Cart.cancelTripStrict(page)
 * 
 *   "I click the share quote button"
 *     → Cart.clickShareQuoteAndWaitForSubjectField(page)
 * 
 *   "I click the share itinerary button"
 *     → Cart.clickShareItineraryAndWaitForSubjectField(page)
 * 
 *   "I send the share"
 *     → Cart.sendQuoteAndWaitForSuccess(page)
 * 
 * Then Steps:
 *   "the hotel should appear as refundable in my cart"
 *     → Cart.isHotelRefundable(page)
 * 
 *   "the trip should be successfully cancelled"
 *     → Validated by cancelTripStrict (includes assertions)
 * 
 *   "I should see a success notification"
 *     → page.getByText('Success').waitFor() + validation
 * 
 * ========================
 */

require('module-alias/register');

const { When, Then, setDefaultTimeout } = require('@cucumber/cucumber');
const {
  HotelSearch,
  HotelLevelResults,
  RoomLevelResults,
  Cart
} = require('../../src/dsl');

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When('I search for a hotel in {string} for {int} night(s)', async function (location, nights) {
  console.log(`Searching for hotel in ${location} for ${nights} night(s)`);
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights: nights });
});

When('I select the first available hotel', async function () {
  console.log('Selecting first hotel option');
  await HotelLevelResults.clickFirstHotelOption(this.page);
});

When('I add a refundable room to my cart', async function () {
  console.log('Adding refundable room to cart');
  await RoomLevelResults.addRefundableHotelRoomLevelToCart(this.page);
});

// ===== THEN STEPS  =====

Then('the hotel should appear as refundable in my cart', async function () {
  console.log('Verifying hotel is refundable');
  await Cart.isHotelRefundable(this.page);
});

