const { test, expect, evolviUserOneTest } = require('../../../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../../../src/dsl/Search');
const EvolviSearch = require('../../../../src/dsl/EvolviSearch');
const EvolviResults = require('../../../../src/dsl/EvolviResults');
const Cart = require('../../../../src/dsl/Cart');

test.describe('[@regression] Evolvi Round Trip Add to Cart Flow', () => {
  evolviUserOneTest('[@priority:critical] Search and Add Evolvi Round Trip Train to Cart – Should complete full add to cart flow', async ({ newTripPageEVOLVI_USER_ONE }) => {
    // Step 1: Initialize test with logged-in user and new trip page
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageEVOLVI_USER_ONE;

    // Step 2: Configure traveler - set logged-in user as the traveler
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Execute Evolvi round-trip search for BTH to PAD route
    console.log('Step 3: Search round-trip Evolvi train BTH → PAD');
    await EvolviSearch.searchEvolviRoundTrip(page, 'bthToPad');

    // Step 4: Select and add first available train option to cart
    console.log('Step 4: Add first train option to cart');
    await EvolviResults.addEvolviRoundtripToTrip(page);
    
    // Step 5: Validate booking status - should be "Pending booking"
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Evolvi round trip train add to cart flow completed successfully.');
  });
});