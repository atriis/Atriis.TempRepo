const { test } = require("@fixtures/supplierTest");

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart, Checkout } = require("@dsl");
const logger = require('@utils/logger').child('HotelBooking');

test.describe("[@regression] Hotel Booking End-to-End Flow", () => {
  test("[@priority:critical] Hotel Booking – Should complete full hotel booking flow with cancellation", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'ratehawk', user: 'user_one' });
    const page = await newTripPageFor("ratehawk", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search a hotel in London, UK for 1 night
    logger.info('Searching hotel', { location: 'London, UK', nights: 1 });
    await HotelSearch.searchHotelByNights(page, { where: "London, UK" });

    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    logger.info('Selecting first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    logger.info('Adding refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 7: Accept terms → Proceed to Checkout
    logger.info('Accepting terms and proceeding to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 9: Book & Finalize
    logger.info('Booking and finalizing');
    await Checkout.bookAndFinalize(page);

    // Step 10: Assert refundable hotel appears in cart after booking
    logger.info('Asserting refundable hotel in cart');
    await Cart.isHotelRefundable(page);

    // Step 11: Cancel hotel trip with complete validation
    logger.info('Cancelling hotel booking');
    await Cart.cancelTripStrict(page);

    logger.info('Hotel booking and cancellation flow completed successfully');
  });
});
