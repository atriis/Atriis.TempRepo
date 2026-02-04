const { test } = require('@fixtures/supplierTest');

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Hotel Add To Cart Multiple Nights', () => {
  test('[@priority:critical] Hotel Add To Cart – Should complete full hotel add to cart flow for multiple nights', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search a hotel in London, UK for 3 nights
    console.log('Step 3: Search hotel in London, UK for 3 nights');
    await HotelSearch.searchHotelByNights(page, { where: 'London, UK', nights: 3 });
    
    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 4: Select first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    console.log('Step 5: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Assert "Pending Booking" quote status appears in cart
    console.log('Step 6: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });


    console.log('Hotel add to cart flow for multiple nights completed successfully.');
  });
});