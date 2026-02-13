const { test, expect } = require("@fixtures/supplierTest");

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart } = require("@dsl");
const logger = require('../../../src/utils/logger').child('HotelShareQuote');

test.describe("[@regression] Hotel Share Quote", () => {
  test("[@priority:critical] Hotel Search and Share Quote – Should complete hotel search, add to cart, and share quote with success notification", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'galileo', user: 'user_one' });
    const page = await newTripPageFor("galileo", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a hotel in London (LHR area)
    logger.info('Searching hotel', { location: 'London' });
    await HotelSearch.searchHotelByNights(page, { where: "London, UK" });

    // Step 4: Select first hotel option
    logger.info('Selecting first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add hotel to cart
    logger.info('Adding hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Click "Share quote" button and wait for subject field
    logger.info('Clicking Share quote button');
    await Cart.clickShareQuoteAndWaitForSubjectField(page);

    // Step 7: Send quote and wait for success notification
    logger.info('Sending quote');
    await Cart.sendQuoteAndWaitForSuccess(page);

    // Step 8: Assert success notification is visible
    logger.info('Asserting success notification is visible');
    await expect(page.getByText("Success", { exact: true })).toBeVisible();

    logger.info('Hotel search and share quote flow completed successfully');
  });

  test("[@priority:critical] Hotel Search and Share Itinerary – Should complete hotel search, add to cart, and share itinerary with success notification", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'galileo', user: 'user_one' });
    const page = await newTripPageFor("galileo", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a hotel in London (LHR area)
    logger.info('Searching hotel', { location: 'London' });
    await HotelSearch.searchHotelByNights(page, { where: "London, UK" });

    // Step 4: Select first hotel option
    logger.info('Selecting first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add hotel to cart
    logger.info('Adding hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Click "Share itinerary" button and wait for subject field
    logger.info('Clicking Share itinerary button');
    await Cart.clickShareItineraryAndWaitForSubjectField(page);

    // Step 7: Send quote and wait for success notification
    logger.info('Sending quote');
    await Cart.sendQuoteAndWaitForSuccess(page);

    // Step 8: Assert success notification is visible
    logger.info('Asserting success notification is visible');
    await expect(page.getByText("Success", { exact: true })).toBeVisible();

    logger.info('Hotel search and share itinerary flow completed successfully');
  });
});
