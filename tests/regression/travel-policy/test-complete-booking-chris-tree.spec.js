const { test, expect } = require("@fixtures/supplierTest");
const { Search, DynamicAndReferenceFields, FlightSearch, Cart } = require("@dsl");
const { FlightResults } = require("@src/dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('ChrisTreeBooking');

test.describe("[@regression][@travel-policy] Complete Booking with Chris Tree", () => {
  test("[@priority:critical] Complete flight booking workflow with Chris Tree traveler", async ({ newTripPageFor }) => {
    // Step 1: Login and start a new trip via fixture
    logger.info('Login + Book a New Trip', { supplier: 'sabre', user: 'chris_tree' });
    const page = await newTripPageFor("sabre", "chris_tree");

    // Step 2: Add a random guest traveler
    logger.info('Adding random guest as traveler');
    await Search.addRandomGuest(page);

    // Step 3: Search one-way flight
    // Note: Destination is intentionally broad (NYC) to increase result availability.
    logger.info('Searching one-way flight', { from: 'DFW', to: 'NYC' });
    await FlightSearch.searchFlightOneWay(page, {
      from: "DFW",
      to: "NYC",
    });

    // Step 4: Trip Purpose reference field selection
    logger.info('Selecting Trip Purpose reference field');
    await DynamicAndReferenceFields.selectTripPurposeReferenceField(page);

    // Step 5: Select first available flight
    logger.info('Selecting first available flight');
    await FlightResults.addFirstFlightToCart(page);

    // Step 6: Accept T&Cs and proceed to checkout
    logger.info('Accepting T&Cs and proceeding to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 7: Fill in checkout number field
    logger.info('Filling in checkout number field');
    await DynamicAndReferenceFields.addNumberCheckoutField(page);

    // Step 8: Book and finalize
    logger.info('Booking and finalizing');
    await Cart.bookAndFinalizeTrip(page);

    // Step 9: Assert Finalizing status
    logger.info('Asserting quote status', { status: 'Finalizing' });
    const status = await Cart.getBookingStatus({ page });
    expect(status).toContain(tripStatus.label.finalizing.status);

    logger.info('Complete booking flow with Chris Tree completed successfully');
  });
});
