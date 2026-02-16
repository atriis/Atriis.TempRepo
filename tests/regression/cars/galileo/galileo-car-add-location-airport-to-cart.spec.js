const { test, expect } = require("@fixtures/supplierTest");

const { Search, CarSearch, CarResults, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('CarAddToCart');

test.describe("[@regression][@supplier:galileo] Galileo - Add Car From Airport Location To Cart", () => {
  test("[@priority:critical] Should complete adding a car from airport location to cart", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'galileo', user: 'user_one' });
    const page = await newTripPageFor("galileo", "user_one");

    // Step 2: Add traveller - I'm the traveller
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search car in LHR
    logger.info('Searching car', { location: 'LHR' });
    await CarSearch.searchCarByPlace(page, { place: "LHR" });

    // Step 4: Add first car and handle conflict modal if appears
    logger.info('Adding first car to cart');
    await CarResults.addCarAirportFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const status = await Cart.getBookingStatus({ page });
    expect(status).toContain(tripStatus.label.pendingBooking.status);

  });
});
