const { test, amtrakUserOneTest } = require('../../../fixtures/testWithFixtures');

// NEED TO ADD USER IN GITHUB!!!!

// DSL imports
const Search = require('../../../../src/dsl/Search');
const AmtrakSearch = require('../../../../src/dsl/AmtrakSearch');

test.describe('[@regression] One Way Amtrak Search Flow', () => {
  amtrakUserOneTest('[@priority:critical] One Way Amtrak Search – Should complete full amtrak one way search flow', async ({ newTripPageAMTRAK_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageAMTRAK_USER_ONE;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search one-way NYP → WAS
    console.log('Step 3: Search one-way Amtrak NYP → WAS');
    await AmtrakSearch.searchAmtrakOneWay(page, 'nypToWas');
    
    console.log('Amtrak one way search flow completed successfully.');
  });
});