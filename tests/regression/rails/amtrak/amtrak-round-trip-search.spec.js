const { test, amtrakUserOneTest } = require('../../../fixtures/testWithFixtures');

// NEED TO ADD USER IN GITHUB!!!!

// DSL imports
const Search = require('../../../../src/dsl/Search');
const AmtrakSearch = require('../../../../src/dsl/AmtrakSearch');

test.describe('[@regression] Round Trip Amtrak Search Flow', () => {
  amtrakUserOneTest('[@priority:critical] Round Trip Amtrak Search – Should complete full amtrak round trip search flow', async ({ newTripPageAMTRAK_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageAMTRAK_USER_ONE;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search round trip NYP → WAS
    console.log('Step 3: Search round trip Amtrak NYP → WAS');
    await AmtrakSearch.searchAmtrakRoundTrip(page, 'nypToWas');
    
    console.log('Amtrak round trip search flow completed successfully.');

    await page.pause();
  });
});