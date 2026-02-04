const { test } = require('@fixtures/supplierTest');

const { Search, EvolviSearch, EvolviResults, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

//Note: need to understand why this test is not adding product to cart

test.describe('[@regression] Evolvi One Way Add to Cart Flow', () => {
  test('[@priority:critical] Search and Add Evolvi One Way Train to Cart – Should complete full add to cart flow', async ({ newTripPage }) => {
    // Step 1: Initialize test with logged-in user and new trip page
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Execute Evolvi one-way search for LIC to 105 route
    console.log('Step 3: Search one-way Evolvi train LIC → 105');
    await EvolviSearch.searchEvolviOneWay(page, 'licTo105');

    // Step 4: Select and add first available train option to cart
    console.log('Step 4: Add first train option to cart');
    await EvolviResults.addEvolviToTrip(page);
    
    // Step 5: Validate booking status - should be "Pending booking"
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Evolvi one way train add to cart flow completed successfully.');
  });
});