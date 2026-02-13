const { test } = require("@fixtures/supplierTest");

const { Search, GroundTransportSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('GroundScopeSearch');

test.describe("[@regression] Search GroundScope Flow", () => {
  test("[@priority:critical] Search GroundScope – Should complete search flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'groundscope', user: 'user_one' });
    const page = await newTripPageFor("groundscope", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search ground transport LHR → Emirates Stadium
    logger.info('Searching ground transport', { from: 'LHR', to: 'Emirates Stadium, Hornsey Road, London, UK' });
    await GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(page);

    // Step 4: Add first ground transport to cart
    logger.info('Adding first ground transport to cart');
    await Results.waitAndClickAddToTripButton(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    logger.info('Ground transport search flow completed successfully');
  });
});
