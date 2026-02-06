const { test } = require('@fixtures/supplierTest');
const { Search, DynamicAndReferenceFields, FlightSearch, Cart } = require('@dsl');
const { FlightResults } = require('@src/dsl');
const tripStatus = require('@data/tripStatus.json');

test.describe('[@regression][@travel-policy] Complete Booking with Chris Tree', () => {
  test('[@priority:critical] Complete flight booking workflow with Chris Tree traveler', async ({ newTripPageFor }) => {
    // Step 1: Login and start a new trip via fixture
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('sabre', 'chris_tree');

    // Step 2: Add a random guest traveler
    console.log('Step 2: Random Guest as traveler');
    await Search.addRandomGuest(page);

    // Step 3: Search one-way flight
    // Note: Destination is intentionally broad (NYC) to increase result availability.
    console.log('Step 3: Search one-way flight');
    await FlightSearch.searchFlightOneWay(page, {
      from: 'DFW',
      to: 'NYC',
    });

    // Step 4: Trip Purpose reference field selection
    console.log('Step 4: Trip Purpose reference field selection');
    await DynamicAndReferenceFields.selectTripPurposeReferenceField(page);

    // Step 5: Select first available flight
    console.log('Step 5: Select first available flight');
    await FlightResults.addFirstFlightToCart(page);

    // Step 6: Accept T&Cs and proceed to checkout
    console.log('Step 7: Accept T&Cs and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 7: Fill in checkout number field
    console.log('Step 8: Fill in checkout number field');
    await DynamicAndReferenceFields.addNumberCheckoutField(page);

    // Step 8: Book and finalize
    console.log('Step 9: Book and finalize');
    await Cart.bookAndFinalizeTrip(page);

    // Step 9: Assert Finalizing status
    console.log('Step 10: Quote is "Finalizing" status');
    await Cart.expectBookingStatus(tripStatus.label.finalizing.status, { page });

    console.log('Complete booking flow with Chris Tree completed successfully.');
  });
});
