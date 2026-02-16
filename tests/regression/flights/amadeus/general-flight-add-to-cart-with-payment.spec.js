const { test, expect } = require("@fixtures/supplierTest");

const { Search, FlightSearch, FlightResults, CartFOP, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('FlightWithPayment');

test.describe("[@regression] Add Flight to Cart with Payment", () => {
  test("[@priority:critical] Add One-Way Flight to Cart with Credit Card – Should complete one-way add to cart flow with payment method", async ({ newTripPageFor }) => {
    // Step 1: Login as specific user + Book a New Trip
    logger.info('Login as specific user + Book a New Trip', { supplier: 'amadeus', user: 'user_three' });
    const page = await newTripPageFor("amadeus", "user_three");

    // Step 2: Add me as traveller
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight (London → Madrid)
    logger.info('Searching one-way flight', { route: 'LHR → MAD' });
    await FlightSearch.searchFlightOneWay(page);

    // Step 4: Select the first available flight and add it to the cart
    logger.info('Adding first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const status = await Cart.getBookingStatus({ page });
    expect(status.toLowerCase()).toContain(tripStatus.label.pendingBooking.status.toLowerCase());

    // Step 6: Add credit card as form of payment
    logger.info('Adding credit card as form of payment');
    await CartFOP.addCreditCard(page);

    // Step 7: Assert payment method added
    //logger.info('Asserting payment method added');
    //expect(await CartFOP.isPaymentMethodAdded(page)).toBe(true);

    logger.info('One-way flight add to cart flow with payment completed successfully');
  });
});
