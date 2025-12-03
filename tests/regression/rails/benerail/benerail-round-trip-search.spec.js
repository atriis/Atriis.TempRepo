const { test, expect, benerailUserOneTest } = require('../../../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../../../src/dsl/Search');
const BenerailSearch = require('../../../../src/dsl/BenerailSearch');
const BenerailResults = require('../../../../src/dsl/BenerailResults');
const Cart = require('../../../../src/dsl/Cart');

test.describe('[@regression] Round Trip Benerail Search Flow', () => {
  benerailUserOneTest('[@priority:critical] Round Trip Benerail Search – Should complete full benerail round trip search flow', async ({ newTripPageBENERAIL_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageBENERAIL_USER_ONE;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search round trip BEBMI → NLASC
    console.log('Step 3: Search round trip Benerail BEBMI → NLASC');
    await BenerailSearch.searchBenerailRoundTrip(page, 'bebmiToNlasc');
    
    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');   
    await BenerailResults.addBenerailRoundtripToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Benerail round trip search flow completed successfully.');
  });
});