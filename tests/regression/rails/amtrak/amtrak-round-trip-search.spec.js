const { test } = require('../../../fixtures/supplierTest');

const Search = require('../../../../src/dsl/Search');
const AmtrakSearch = require('../../../../src/dsl/AmtrakSearch');

test.describe('[@regression] Round Trip Amtrak Search Flow', () => {
  test('[@priority:critical] Round Trip Amtrak Search – Should complete full amtrak round trip search flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search round trip NYP → WAS
    console.log('Step 3: Search round trip Amtrak NYP → WAS');
    await AmtrakSearch.searchAmtrakRoundTrip(page, 'nypToWas');
    
    console.log('Amtrak round trip search flow completed successfully.');
  });
});