const { test, expect } = require('@fixtures/supplierTest');

const { Search, HotelSearch, HotelLevelResults, RoomLevelResults, Cart, Checkout } = require('@dsl');

test.describe('[@regression] Hotel Booking End-to-End Flow', () => {
  test('[@priority:critical] Hotel Booking – Should complete full hotel booking flow with cancellation', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search a hotel in London, UK for 1 night
    console.log('Step 3: Search hotel in London, UK for 1 night');
    await HotelSearch.searchHotelByNights(page, { where: 'London, UK' });
    
    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 4: Select first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    console.log('Step 5: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Assert refundable hotel appears in cart before booking
    console.log('Step 6: Assert refundable hotel in cart');
    expect(await Cart.isHotelRefundable(page)).toBe(true);

    // Step 7: Accept terms → Proceed to Checkout
    console.log('Step 7: Accept terms and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);
    
    // Step 9: Book & Finalize 
    console.log('Step 9: Book and finalize booking');
    await Checkout.bookAndFinalize(page);

    // Step 10: Assert refundable hotel appears in cart after booking
    console.log('Step 10: Assert refundable hotel in cart');
    expect(await Cart.isHotelRefundable(page)).toBe(true);
    
    // Step 11: Cancel hotel trip with complete validation
    console.log('Step 11: Cancel hotel booking');
    await Cart.cancelTripStrict(page);

    console.log('Hotel booking and cancellation flow completed successfully.');
  });
});