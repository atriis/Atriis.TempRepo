const { test } = require('@fixtures/supplierTest');

const { Search, BenerailSearch, Results, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Benerail Add To Cart Flow', () => {
  // Test 1: Round Trip Benerail Add To Cart Flow
  test('[@priority:critical] Round Trip Benerail Add To Cart – Should complete full benerail round trip add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search round trip BELEU → BEABC
    console.log('Step 3: Search round trip Benerail BELEU → BEABC');
    await BenerailSearch.searchBenerailRoundTrip(page);

    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');
    await Results.clickSelectButtonRoundTripAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Benerail round trip add to cart flow completed successfully.');
  });

  // Test 2: One Way Benerail Add To Cart Flow
  test('[@priority:critical] One Way Benerail Add To Cart – Should complete full benerail one way add to cart flow', async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('benerail', 'user_one');

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search one-way BELEU → BEABC
    console.log('Step 3: Search one-way Benerail BELEU → BEABC');
    await BenerailSearch.searchBenerailOneWay(page);

    // Step 4: Add Benerail to trip
    console.log('Step 4: Add Benerail to trip');
    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log('Benerail one way add to cart flow completed successfully.');
  });
});