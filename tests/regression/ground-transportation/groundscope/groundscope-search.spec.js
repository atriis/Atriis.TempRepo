const { test } = require('@fixtures/supplierTest');

const { Search, GroundTransportSearch, Results, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Search GroundScope Flow', () => {
  test('[@priority:critical] Search GroundScope – Should complete search flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search ground transport LHR → Emirates Stadium
    console.log('Step 3: Search ground transport LHR → Emirates Stadium, Hornsey Road, London, UK');
    await GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(page);

    // Step 4: Add first ground transport to cart
    console.log('Step 4: Add first ground transport to cart');
    await Results.waitAndClickAddToTripButton(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Ground transport search flow completed successfully.');
  });
});
