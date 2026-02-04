const { test } = require('@fixtures/supplierTest');

const { Search, CarSearch, CarResults, Cart } = require('@dsl'); 
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression][@supplier:galileo] Galileo - Add Car From Airport Location To Cart', () => {
  test('[@priority:critical] Should complete adding a car from airport location to cart', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addMeAsTraveler(page);

    // Step 3: Search car in LHR
    console.log('Step 3: Search car in LHR');
    await CarSearch.searchCarByPlace(page, { place: 'LHR' });

    // Step 4: Add first car and handle conflict modal if appears
    console.log('Step 4: Add first car to cart');
    await CarResults.addCarAirportFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

  });
});