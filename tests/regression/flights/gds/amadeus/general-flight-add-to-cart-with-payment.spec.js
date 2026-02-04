const { test, expect } = require('@fixtures/supplierTest');

const { Search, FlightSearch, FlightResults, CartFOP, Cart } = require('@dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression] Add Flight to Cart with Payment', () => {
  test('[@priority:critical] Add One-Way Flight to Cart with Credit Card – Should complete one-way add to cart flow with payment method', async ({ newTripPageAs }) => {
    // Step 1: Login as specific user + Book a New Trip
    console.log('Step 1: Login as specific user + Book a New Trip');
    const page = await newTripPageAs('user_three');

    // Step 2: Add me as traveller
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight (London → Madrid)
    console.log('Step 3: Search for a one-way flight (London → Madrid)');
    await FlightSearch.searchFlightOneWay(page);

    // Step 4: Select the first available flight and add it to the cart
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Assert Pending booking
    console.log('Step 5: Quote is "Pending booking" status');
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    // Step 6: Add credit card as form of payment
    console.log('Step 6: Add credit card as form of payment');
    await CartFOP.addCreditCard(page);

    // Step 7: Assert payment method added
    console.log('Step 7: Assert payment method added');
    expect(await CartFOP.isPaymentMethodAdded(page)).toBe(true);

    console.log('One-way flight add to cart flow with payment completed successfully.');
  });
});
