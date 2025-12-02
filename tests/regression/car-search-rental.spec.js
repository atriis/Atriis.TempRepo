const { test, sabreUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search')
const CarSearch = require('../../src/dsl/CarSearch');

test.describe('[@regression] Car City Center Search by Rental Agency', () => {
  sabreUserOneTest('[@priority:high] Car Search – Should complete full city center car search by rental agency', async ({ newTripPageSABRE_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageSABRE_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search car in London, UK
    console.log('Step 3: Search car in London, UK by rental agency Hertz');
    await CarSearch.searchCarByPlaceAndRentalAgency(page, { place: 'London, UK', agencyName: 'Hertz' });
    
    // Step 4: Add first car and handle conflict modal if appears
    console.log('Step 4: Add first car to cart');
    await CarResults.addCarCityCenterFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);
    
    console.log('Car search by rental agency completed successfully.');
  });
});