const { test } = require('@fixtures/supplierTest');

const { Search, FlightSearch, FlightResults, FlightPricing, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Add Flight to Cart Flows', () => {
  test('[@priority:critical] Add One-Way Flight to Cart – Should complete one-way add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I am the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search for a one-way flight (London → Doha)
    console.log('Step 3: Search for a one-way flight (London → Doha)');
    await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

    // Step 4: Select the first available flight and add it to the cart
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 6: Assert "Pending booking" quote status appears in cart
    console.log('Step 6: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('One-way flight add to cart flow completed successfully.');
  });

  test('[@priority:critical] Add Round Trip Flight to Cart – Should complete round trip add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I am the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search round-trip PAR → AMS (HARDCODED ROUTE)
    console.log('Step 3: Search round-trip flight PAR → AMS');
    await FlightSearch.searchFlightRoundTrip(page, {
      from: 'PAR',
      to: 'AMS',
    });

    // Step 4: Add first flight and handle conflict modal if appears
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Round trip flight add to cart flow completed successfully.');
  });

  test('[@priority:critical] Add Flight By Schedule to Cart – Should complete search by schedule add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I am the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search by scheduled LON → AMS flight
    console.log('Step 3: Search by scheduled flight LON → AMS');
    await FlightSearch.searchFlightBySchedule(page, {
      from: 'LON',
      to: 'AMS',
    });

    // Step 4: Select flight segments by schedule
    console.log('Step 4: Select flight segments by schedule');
    await FlightResults.selectSegmentsBySchedule(page);

    // Step 5: Add the selected flight to cart
    console.log('Step 5: Add selected flight to cart');
    await FlightPricing.addYourSelectionFareToCart(page);

    // Step 6: Assert Pending booking
    console.log('Step 6: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Flight search by schedule add to cart flow completed successfully.');
  });
});
