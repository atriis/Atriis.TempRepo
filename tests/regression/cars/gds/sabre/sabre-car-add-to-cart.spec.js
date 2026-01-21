const { test, expect } = require('@fixtures/supplierTest');

const { Search, CarSearch, CarResults, Cart } = require('@dsl'); 

test.describe('[@regression][@supplier:sabre] Sabre – Add Car to Cart from Airport', () => {
  test('[@priority:critical] Should complete full airport location search and add-to-trip flow successfully', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search car in LHR
    console.log('Step 3: Search car in LHR');
    await CarSearch.searchCarByPlace(page, { place: 'LHR' });

    // Step 4: Add first car and handle conflict modal if appears
    console.log('Step 4: Add first car to cart');
    await CarResults.addCarAirportFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Sabre car add to cart airport location flow completed successfully.');

  });
});