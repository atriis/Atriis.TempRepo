const { test, expect } = require("@fixtures/supplierTest");

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('HotelAddToCart');

test.describe("[@regression] Hotel Add To Cart Multiple Nights", () => {
  test("[@priority:critical] Hotel Add To Cart – Should complete full hotel add to cart flow for multiple nights", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'ratehawk', user: 'user_one' });
    const page = await newTripPageFor("ratehawk", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search a hotel in London, UK for 3 nights
    logger.info('Searching hotel', { location: 'London, UK', nights: 3 });
    await HotelSearch.searchHotelByNights(page, { where: "London, UK", nights: 3 });

    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    logger.info('Selecting first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    logger.info('Adding refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Assert "Pending Booking" quote status appears in cart
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const status = await Cart.getBookingStatus({ page });
    expect(status).toContain(tripStatus.label.pendingBooking.status);

    logger.info('Hotel add to cart flow for multiple nights completed successfully');
  });
});
