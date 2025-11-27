const { test, amadeusUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search');
const FlightSearch = require('../../src/dsl/FlightSearch');

test.describe('[@regression] Round Trip Flight Search Flow', () => {
  amadeusUserOneTest('[@priority:critical] Round Trip Flight Search – Should complete full flight search flow', async ({ newTripPageAMADEUS_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageAMADEUS_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search round-trip LHR → DOH
    console.log('Step 3: Search round-trip flight LHR → DOH');
    await FlightSearch.searchFlightRoundTrip(page, 'lhrToDoh');
    
    console.log('Round trip flight search flow completed successfully.');
  });
});