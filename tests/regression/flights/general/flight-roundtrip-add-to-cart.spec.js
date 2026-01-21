const { test, expect } = require('@fixtures/supplierTest');

const { Search, FlightSearch, FlightResults, Cart } = require('@dsl');

test.describe('[@regression] Add Round Trip Flight to Cart Flow', () => {
  test('[@priority:critical] Add Round Trip Flight to Cart – Should complete full add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
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
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Round trip flight add to cart flow completed successfully.');
  });
});
