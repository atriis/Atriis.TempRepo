const { test } = require("@fixtures/supplierTest");

const { Search, FlightSearch, FlightResults, Cart, Checkout } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('LufthansaBooking');

test.describe("[@regression] Lufthansa NDC - One Way Flight Booking End-to-End Flow", () => {
  test("[@priority:critical] Should complete one-way flight booking end-to-end flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'lufthansa', user: 'user_one' });
    const page = await newTripPageFor("lufthansa", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight (Munich → Frankfurt)
    logger.info('Searching one-way flight', { route: 'MUC → FRA' });
    await FlightSearch.searchFlightOneWay(page, "mucToFra");

    // Step 4: Select the first available flight and add it to the cart
    logger.info('Adding first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Accept terms and continue to checkout
    logger.info('Accepting terms and proceeding to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 6: Complete the booking
    logger.info('Completing the booking');
    await Checkout.bookAndFinalize(page);

    // Step 7: Verify that the booking is in "Ticketing Complete" state
    logger.info('Verifying booking status', { status: 'Ticketing Complete' });
    await Cart.expectBookingStatus(tripStatus.label.ticketingComplete.status, { page });

    logger.info('One-way flight booking end-to-end flow completed successfully');
  });
});
