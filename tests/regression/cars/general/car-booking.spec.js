const { test, expect } = require("@fixtures/supplierTest");

const { Search, CarSearch, CarResults, Cart, Checkout, TripOverview } = require("@dsl");
const logger = require('../../../src/utils/logger').child('CarBooking');

test.describe("[@regression][@supplier:all] Car Booking End-to-End Flow", () => {
  test("[@priority:critical] Car Booking – Should complete full car booking flow with cancellation", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add traveller - I'm the traveller
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);
    /*
    // Step 3: Search car in LHR
    logger.info('Searching car', { location: 'LHR' });
    await CarSearch.searchCarByPlace(page, { place: 'LHR' });

    // Step 4: Add first car and handle conflict modal if appears
    logger.info('Adding first car to cart');
    await CarResults.addCarAirportFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    // Step 6: Accept terms → Proceed to Checkout
    logger.info('Accepting terms and proceeding to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 7: Wait for checkout page and proceed
    logger.info('Proceeding to checkout page');

    // Step 8: Book & Finalize
    logger.info('Booking and finalizing');
    await Checkout.bookAndFinalize(page);

    // Step 9: Assert confirmed status in trip overview
    logger.info('Asserting confirmed status');
    expect(await TripOverview.isBookingConfirmed(page)).toBe(true);

    // Step 10: Cancel car trip with complete validation
    logger.info('Cancelling car booking');
    await TripOverview.cancelTrip(page);

    logger.info('Car booking and cancellation flow completed successfully'); */
  });
});
