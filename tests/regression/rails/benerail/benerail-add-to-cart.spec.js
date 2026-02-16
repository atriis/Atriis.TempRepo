const { test, expect } = require("@fixtures/supplierTest");

const { Search, BenerailSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('BenerailAddToCart');

test.describe("[@regression] Benerail Add To Cart Flow", () => {
  // Test 1: Round Trip Benerail Add To Cart Flow
  test("[@priority:critical] Round Trip Benerail Add To Cart – Should complete full benerail round trip add to cart flow", async ({ newTripPage }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search round trip BELEU → BEABC
    logger.info('Searching round trip Benerail', { from: 'BELEU', to: 'BEABC' });
    await BenerailSearch.searchBenerailRoundTrip(page);

    //  Step 4: Add Benerail to trip
    logger.info('Adding Benerail to trip');
    await Results.clickSelectButtonRoundTripAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusRT = await Cart.getBookingStatus({ page });
    expect(statusRT).toContain(tripStatus.label.pendingBooking.status);

    logger.info('Benerail round trip add to cart flow completed successfully');
  });

  // Test 2: One Way Benerail Add To Cart Flow
  test("[@priority:critical] One Way Benerail Add To Cart – Should complete full benerail one way add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'benerail', user: 'user_one' });
    const page = await newTripPageFor("benerail", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search one-way BELEU → BEABC
    logger.info('Searching one-way Benerail', { from: 'BELEU', to: 'BEABC' });
    await BenerailSearch.searchBenerailOneWay(page);

    // Step 4: Add Benerail to trip
    logger.info('Adding Benerail to trip');
    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusOW = await Cart.getBookingStatus({ page });
    expect(statusOW).toContain(tripStatus.label.pendingBooking.status);

    logger.info('Benerail one way add to cart flow completed successfully');
  });
});
