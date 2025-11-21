const { test, expect } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search')
const CarSearch = require('../../src/dsl/CarSearch');
const CarResults = require('../../src/dsl/CarResults');
const Cart = require('../../src/dsl/Cart'); 

test.describe('Car Booking End-to-End Flow', () => {
  test('Car Booking – Should search, add a car, and validate pending booking', async ({ newTripPage }) => {
    
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search car in LHR
    console.log('Step 3: Search car in LHR');
    await CarSearch.searchCarByPlace(page, { place: 'LHR' });

    // Step 4: Add first car and handle conflict modal if appears
    console.log('Step 4: Add first car to cart');
    await CarResults.addCarFromResultsPageToCart(page);

    // Step 5: Assert Pending booking (assertion in spec, not DSL)
    console.log('Step 5: Assert Quote is "Pending booking"');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Car search and add-to-cart flow completed successfully.');
  });
});