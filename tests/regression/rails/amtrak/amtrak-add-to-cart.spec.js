const { test, expect } = require("@fixtures/supplierTest");

const { Search, AmtrakSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('AmtrakAddToCart');

test.describe("[@regression] Amtrak Add To Cart Flow", () => {
  // Test 1: Round Trip Amtrak Add To Cart Flow
  test("[@priority:critical] Round Trip Amtrak Add To Cart – Should complete full Amtrak round trip add to cart flow", async ({ newTripPage }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search round trip NYP → WAS
    logger.info('Searching round trip Amtrak', { route: 'NYP → WAS' });
    await AmtrakSearch.searchAmtrakRoundTrip(page, "nypToWas");

    // Step 4: Add Amtrak to trip
    logger.info('Adding Amtrak to trip');
    await Results.clickSelectButtonRoundTripAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusRT = await Cart.getBookingStatus({ page });
    expect(statusRT.toLowerCase()).toContain(tripStatus.label.pendingBooking.status.toLowerCase());

    logger.info('Amtrak round trip add to cart flow completed successfully');
  });

  // Test 2: One Way Amtrak Add To Cart Flow
  test("[@priority:critical] One Way Amtrak Add To Cart – Should complete full Amtrak one way add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amtrak', user: 'user_one' });
    const page = await newTripPageFor("amtrak", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search one-way NYP → WAS
    logger.info('Searching one-way Amtrak', { route: 'NYP → WAS' });
    await AmtrakSearch.searchAmtrakOneWay(page, "nypToWas");

    // Step 4: Add Amtrak to trip
    logger.info('Adding Amtrak to trip');
    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusOW = await Cart.getBookingStatus({ page });
    expect(statusOW.toLowerCase()).toContain(tripStatus.label.pendingBooking.status.toLowerCase());

    logger.info('Amtrak one way add to cart flow completed successfully');
  });
});
