const { test, expect } = require("@fixtures/supplierTest");

const { Search, ManualQuoteSearch, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('ManualQuoteAddToCart');

test.describe("Manual Quote - Add Flight Manual Quote to Cart", () => {
  test("[@priority:critical] Should complete add flight manual quote to cart flow", async ({ newTripPageFor }) => {

    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    //Step 3: Search flight manual quote with default route
    logger.info('Searching flight manual quote with default route');
    await ManualQuoteSearch.searchAndAddFlightManualQuote(page);

    //Step 4: Assert 'On Hold' trip status in cart
    logger.info('Asserting trip status', { status: 'On Hold' });
    const status = await Cart.getBookingStatus({ page });
    expect(status.toLowerCase()).toContain(tripStatus.label.onHold.status.toLowerCase());

    // Step 11: Cancel manual quote flight trip with complete validation
    logger.info('Cancelling manual quote flight trip');
    await Cart.cancelTripStrict(page);

    logger.info('Flight manual quote add to cart flow completed successfully');
  });
});
