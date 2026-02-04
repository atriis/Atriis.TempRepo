const { test, expect } = require('@fixtures/supplierTest');

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart } = require('@dsl');

test.describe('[@regression] Hotel Share Quote', () => {
  test('[@priority:critical] Hotel Search and Share Quote – Should complete hotel search, add to cart, and share quote with success notification', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a hotel in London (LHR area)
    console.log('Step 3: Search hotel in London');
    await HotelSearch.searchHotelByNights(page, { where: 'London, UK' });

    // Step 4: Select first hotel option
    console.log('Step 4: Select first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add hotel to cart
    console.log('Step 5: Add hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Click "Share quote" button and wait for subject field
    console.log('Step 6: Click "Share quote" button and wait for subject field');
    await Cart.clickShareQuoteAndWaitForSubjectField(page);

    // Step 7: Send quote and wait for success notification
    console.log('Step 7: Send quote and wait for success notification');
    await Cart.sendQuoteAndWaitForSuccess(page);

    // Step 8: Assert success notification is visible
    console.log('Step 8: Assert success notification is visible');
    await expect(page.getByText('Success', { exact: true })).toBeVisible();

    console.log('Hotel search and share quote flow completed successfully.');
  });

  test('[@priority:critical] Hotel Search and Share Itinerary – Should complete hotel search, add to cart, and share itinerary with success notification', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a hotel in London (LHR area)
    console.log('Step 3: Search hotel in London');
    await HotelSearch.searchHotelByNights(page, { where: 'London, UK' });

    // Step 4: Select first hotel option
    console.log('Step 4: Select first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add hotel to cart
    console.log('Step 5: Add hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Click "Share itinerary" button and wait for subject field
    console.log('Step 6: Click "Share itinerary" button and wait for subject field');
    await Cart.clickShareItineraryAndWaitForSubjectField(page);

    // Step 7: Send quote and wait for success notification
    console.log('Step 7: Send quote and wait for success notification');
    await Cart.sendQuoteAndWaitForSuccess(page);

    // Step 8: Assert success notification is visible
    console.log('Step 8: Assert success notification is visible');
    await expect(page.getByText('Success', { exact: true })).toBeVisible();

    console.log('Hotel search and share itinerary flow completed successfully.');
  });
});
