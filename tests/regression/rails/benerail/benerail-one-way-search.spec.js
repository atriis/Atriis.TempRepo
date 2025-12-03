const { test, expect, benerailUserOneTest } = require('../../../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../../../src/dsl/Search');
const BenerailSearch = require('../../../../src/dsl/BenerailSearch');
const BenerailResults = require('../../../../src/dsl/BenerailResults');
const Cart = require('../../../../src/dsl/Cart');
const Cart = require('../../../../src/dsl/Cart');

test.describe('[@regression] One Way Benerail Search Flow', () => {
  benerailUserOneTest('[@priority:critical] One Way Benerail Search – Should complete full benerail one way search flow', async ({ newTripPageBENERAIL_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageBENERAIL_USER_ONE;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search one-way BEBMI → NLASC
    console.log('Step 3: Search one-way Benerail BEBMI → NLASC');
    await BenerailSearch.searchBenerailOneWay(page, 'bebmiToNlasc');
    
    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');   
    await BenerailResults.addBenerailToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Benerail one way search flow completed successfully.');
  });
});