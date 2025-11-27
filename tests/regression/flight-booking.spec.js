const { test, expect, amadeusUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search');
const FlightSearch = require('../../src/dsl/FlightSearch');
const FlightResults = require('../../src/dsl/FlightResults');
const Cart = require('../../src/dsl/Cart');
const Checkout = require('../../src/dsl/Checkout');
const TripOverview = require('../../src/dsl/TripOverview');

test.describe('[@regression] One Way Flight Booking End-to-End Flow', () => {
  amadeusUserOneTest('[@priority:critical] One Way Flight Booking – Should complete full flight booking flow with cancellation', async ({ newTripPageAMADEUS_USER_ONE }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageAMADEUS_USER_ONE;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search one-way LHR → DOH
    console.log('Step 3: Search one-way flight LHR → DOH');
    await FlightSearch.searchFlightsOneWay(page, 'lhrToDoh');
    
    // Step 4: Add first flight and handle conflict modal if appears
    console.log('Step 4: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(page); 
    
    // Step 5: Accept terms → Proceed to Checkout
    console.log('Step 5: Accept terms and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 6: Wait for checkout page and proceed 
    console.log('Step 6: Proceeding to checkout page');
    // Step 7: Book & Finalize (DSL)
    console.log('Step 7: Book and finalize booking');
    await Checkout.bookAndFinalize(page);

    // Step 8: Assert finalizing status in trip overview 
    console.log('Step 8: Assert finalizing status');
    expect(await TripOverview.isBookingFinalizing(page)).toBe(true);
    
    // Step 9: Cancel flight trip with complete validation
    console.log('Step 9: Cancel flight booking');
    await TripOverview.cancelTrip(page);

    console.log('Flight booking and cancellation flow completed successfully.');
  });
});