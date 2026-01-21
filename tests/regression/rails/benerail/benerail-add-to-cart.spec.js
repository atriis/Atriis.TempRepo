const { test, expect } = require('../../../fixtures/supplierTest');

const Search = require('../../../../src/dsl/Search');
const BenerailSearch = require('../../../../src/dsl/BenerailSearch');
const Results = require('../../../../src/dsl/Results');
const Cart = require('../../../../src/dsl/Cart');

test.describe('[@regression] Benerail Add To Cart Flow', () => {
  // Test 1: Round Trip Benerail Add To Cart Flow
  test('[@priority:critical] Round Trip Benerail Add To Cart – Should complete full benerail round trip add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search round trip BELEU → BEABC
    console.log('Step 3: Search round trip Benerail BELEU → BEABC');
    await BenerailSearch.searchBenerailRoundTrip(page);

    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');
    await Results.clickSelectButtonRoundTripAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Benerail round trip add to cart flow completed successfully.');
  });

  // Test 2: One Way Benerail Add To Cart Flow
  test('[@priority:critical] One Way Benerail Add To Cart – Should complete full benerail one way add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search one-way BELEU → BEABC
    console.log('Step 3: Search one-way Benerail BELEU → BEABC');
    await BenerailSearch.searchBenerailOneWay(page);

    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');
    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Benerail one way add to cart flow completed successfully.');
  });
});