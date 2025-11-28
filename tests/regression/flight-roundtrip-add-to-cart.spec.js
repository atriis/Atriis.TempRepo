const { test, expect, amadeusUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search');
const FlightSearch = require('../../src/dsl/FlightSearch');
const FlightResults = require('../../src/dsl/FlightResults');
const Cart = require('../../src/dsl/Cart');

test.describe('[@regression] Add Round Trip Flight to Cart Flow', () => {
  amadeusUserOneTest('[@priority:critical] Add Round Trip Flight to Cart – Should complete full add to cart flow', async ({ newTripPageAMADEUS_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageAMADEUS_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search round-trip LHR → DOH
    console.log('Step 3: Search round-trip flight LHR → DOH');
    await FlightSearch.searchFlightRoundTrip(page, 'lhrToDoh');

    // Step 4: Add first flight and handle conflict modal if appears
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);
    
    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Round trip flight add to cart flow completed successfully.');
  });
});