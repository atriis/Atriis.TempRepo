const { test, sabreUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search')
const CarSearch = require('../../src/dsl/CarSearch');

// _________________Continue from here_________________________

test.describe('[@regression] Car Search by Rental Agency', () => {
  sabreUserOneTest('[@priority:high] Car Search – Should complete full car search by rental agency', async ({ newTripPageSABRE_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageSABRE_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search car in LHR
    console.log('Step 3: Search car in LHR');
    await CarSearch.searchCarByPlaceAndRentalAgency(page, { place: 'LHR', agencyName: 'Hertz' });
    
    console.log('Car search by rental agency completed successfully.');
  });
});