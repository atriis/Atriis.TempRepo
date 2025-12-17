const { test } = require('../../../fixtures/supplierTest');

const Search = require('../../../../src/dsl/Search');
const AmtrakSearch = require('../../../../src/dsl/AmtrakSearch');

test.describe('[@regression] One Way Amtrak Search Flow', () => {
  test('[@priority:critical] One Way Amtrak Search – Should complete full amtrak one way search flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search one-way NYP → WAS
    console.log('Step 3: Search one-way Amtrak NYP → WAS');
    await AmtrakSearch.searchAmtrakOneWay(page, 'nypToWas');
    
    console.log('Amtrak one way search flow completed successfully.');
  });
});