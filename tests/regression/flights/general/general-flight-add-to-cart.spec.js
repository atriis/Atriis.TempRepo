const { test, expect } = require("@fixtures/supplierTest");

const { Search, FlightSearch, FlightResults, FlightPricing, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");
const logger = require('@utils/logger').child('FlightAddToCart');

test.describe("[@regression] Add Flight to Cart Flows", () => {
  test("[@priority:critical] Add One-Way Flight to Cart – Should complete one-way add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight (London → Doha)
    logger.info('Searching one-way flight', { route: 'LHR → DOH' });
    await FlightSearch.searchFlightOneWay(page, "lhrToDoh");

    // Step 4: Select the first available flight and add it to the cart
    logger.info('Adding first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 6: Assert "Pending booking" quote status appears in cart
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const status = await Cart.getBookingStatus({ page });
    expect(status).toContain(tripStatus.label.pendingBooking.status);

    logger.info('One-way flight add to cart flow completed successfully');
  });

  test("[@priority:critical] Add Round Trip Flight to Cart – Should complete round trip add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search round-trip PAR → AMS (HARDCODED ROUTE)
    logger.info('Searching round-trip flight', { from: 'PAR', to: 'AMS' });
    await FlightSearch.searchFlightRoundTrip(page, {
      from: "PAR",
      to: "AMS",
    });

    // Step 4: Add first flight and handle conflict modal if appears
    logger.info('Adding first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusRT = await Cart.getBookingStatus({ page });
    expect(statusRT).toContain(tripStatus.label.pendingBooking.status);

    logger.info('Round trip flight add to cart flow completed successfully');
  });

  test("[@priority:critical] Add Flight By Schedule to Cart – Should complete search by schedule add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search by scheduled LON → AMS flight
    logger.info('Searching by scheduled flight', { from: 'LON', to: 'AMS' });
    await FlightSearch.searchFlightBySchedule(page, {
      from: "LON",
      to: "AMS",
    });

    // Step 4: Select flight segments by schedule
    logger.info('Selecting flight segments by schedule');
    await FlightResults.selectSegmentsBySchedule(page);

    // Step 5: Add the selected flight to cart
    logger.info('Adding selected flight to cart');
    await FlightPricing.addYourSelectionFareToCart(page);

    // Step 6: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    const statusSched = await Cart.getBookingStatus({ page });
    expect(statusSched).toContain(tripStatus.label.pendingBooking.status);

    logger.info('Flight search by schedule add to cart flow completed successfully');
  });
});
