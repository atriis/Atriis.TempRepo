const { test, expect } = require('@fixtures/supplierTest');

const { Search, FlightSearch, FlightResults, Cart, Checkout, TripOverview } = require('@dsl');

test.describe('[@regression] One Way Flight Booking End-to-End Flow', () => {
  test('[@priority:critical] Should complete one-way flight booking and cancellation', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search for a one-way flight (London → Doha)
    console.log('Step 3: Search for a one-way flight (London → Doha)');
    await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

    // Step 4: Select the first available flight and add it to the cart
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Accept terms and continue to checkout
    console.log('Step 5: Accept terms and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 6: Complete the booking
    console.log('Step 6: Complete the booking');
    await Checkout.bookAndFinalize(page);

    // Step 7: Verify that the booking is in "finalizing" state
    console.log('Step 7: Verify booking is finalizing');
    expect(await TripOverview.isBookingFinalizing(page)).toBe(true);

    // Step 8: Cancel the trip to keep test environment clean
    console.log('Step 8: Cancel the trip');
    await TripOverview.cancelTrip(page);

    console.log('One-way flight booking flow completed successfully.');
  });
});