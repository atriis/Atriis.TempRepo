const { test, expect } = require("@fixtures/supplierTest");

const { Search, EvolviSearch, EvolviResults, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('EvolviAddToCart');

//Note: need to understand why this test is not adding product to cart

test.describe("[@regression] Evolvi One Way Add to Cart Flow", () => {
  test("[@priority:critical] Search and Add Evolvi One Way Train to Cart – Should complete full add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Initialize test with logged-in user and new trip page
    logger.info('Login + Book a New Trip', { supplier: 'evolvi', user: 'user_one' });
    const page = await newTripPageFor("evolvi", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Execute Evolvi one-way search for LIC to 105 route
    logger.info('Searching one-way Evolvi train', { route: 'LIC → 105' });
    await EvolviSearch.searchEvolviOneWay(page, "licTo105");

    // Step 4: Select and add first available train option to cart
    logger.info('Adding first train option to cart');
    await EvolviResults.addEvolviToTrip(page);

    // Step 5: Validate booking status - should be "Pending booking"
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const status = await Cart.getBookingStatus({ page });
    expect(status.toLowerCase()).toContain(tripStatus.label.pendingBooking.status.toLowerCase());

    logger.info('Evolvi one way train add to cart flow completed successfully');
  });
});
