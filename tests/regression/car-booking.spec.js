const { test, expect, sabreUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search')
const CarSearch = require('../../src/dsl/CarSearch');
const CarResults = require('../../src/dsl/CarResults');
const Cart = require('../../src/dsl/Cart'); 
const Checkout = require('../../src/dsl/Checkout');
const TripOverview = require('../../src/dsl/TripOverview');

test.describe('Car Booking End-to-End Flow', () => {
  sabreUserOneTest('Car Booking – Should search, add a car, and validate pending booking', async ({ newTripPageSABRE_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageSABRE_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search car in LHR
    console.log('Step 3: Search car in LHR');
    await CarSearch.searchCarByPlace(page, { place: 'LHR' });

    // Step 4: Add first car and handle conflict modal if appears
    console.log('Step 4: Add first car to cart');
    await CarResults.addCarFromResultsPageToCart(page);

    // Step 5: Assert Pending booking (assertion in spec, not DSL)
    console.log('Step 5: Assert Quote is "Pending booking"');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

       // Step 7: Accept terms → Proceed to Checkout
    console.log('Step 7: Accept terms and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 8: Wait for checkout page and proceed 
    console.log('Step 8: Proceeding to checkout page');
    // Step 9: Book & Finalize
    console.log('Step 9: Book and finalize booking');
    await Checkout.bookAndFinalize(page);

    // Step 10: Assert confirmed status in trip overview (assertion in spec, not DSL)
    console.log('Step 10: Assert confirmed status');
    expect(await TripOverview.isBookingConfirmed(page)).toBe(true);

    // Step 11: Cancel car trip with complete validation
    console.log('Step 11: Cancel car booking');
    await TripOverview.cancelTrip(page);

    console.log('Car booking and cancellation flow completed successfully.');
  });
});