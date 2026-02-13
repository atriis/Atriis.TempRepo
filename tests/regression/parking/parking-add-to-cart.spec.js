const { test } = require("@fixtures/supplierTest");

const { Search, UKParkingSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('ParkingAddToCart');

test.describe("Parking - Add UK Parking to Cart", () => {
  test("[@priority:critical] Should complete add UK parking to cart flow", async ({ newTripPageFor }) => {

    // Step 1: Login + Book a New Trip (handled by fixture)
    logger.info('Login + Book a New Trip', { supplier: 'ukparking', user: 'user_one' });
    const page = await newTripPageFor("ukparking", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search UK parking
    logger.info('Searching UK parking');
    await UKParkingSearch.searchUKParking(page);

    // Step 4: Add parking to cart
    logger.info('Adding parking to cart');
    await Results.waitAndClickAddToTripButton(page);

    // Step 5: Validate trip status is 'Pending Booking' in cart
    logger.info('Validating trip status', { status: 'Pending Booking' });
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    logger.info('UK parking add to cart flow completed successfully');
  });
});
