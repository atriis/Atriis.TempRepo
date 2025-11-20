// tests/flight-booking.spec.js
const { test, expect } = require('@playwright/test');

// DSL imports
const App = require('../dsl/App');
const Search = require('../dsl/Search');
const FlightSearch = require('../dsl/FlightSearch');
const FlightResults = require('../dsl/FlightResults');
const Cart = require('../dsl/Cart');
const Checkout = require('../dsl/Checkout');
const TripOverview = require('../dsl/TripOverview');

// Test data imports
const config = require('../test-data/config.json');
const users = require('../test-data/users.json');

test.describe('Flight Booking End-to-End Flow', () => {
  test('should complete full flight booking flow with cancellation', async ({ page }) => {
    // Step 1: Login
    console.log('Step 1: Login');
    await page.goto(config.stagingURL);
    await App.loginAs(page, users.amadeus.userOne);

    // Step 2: Book a new trip (opens new tab)
    console.log('Step 2: Book a new trip');
    const tripPage = await App.bookANewTrip(page);

    // Step 3: Add traveller - I'm the traveller
    console.log('Step 3: Add traveller - I am the traveller');
    await Search.addTravelerImTheTraveller(tripPage);

    // Step 4: Search one-way LHR → DOH
    console.log('Step 4: Search one-way flight LHR → DOH');
    await FlightSearch.searchFlightsOneWay(tripPage, 'lhrToDoh');

    // Step 5: Add first flight and handle conflict modal if appears
    console.log('Step 5: Add first flight to cart');
    await FlightResults.addFirstFlightToCart(tripPage);

    // Step 6: Assert Pending booking (assertion in spec, not DSL)
    console.log('Step 6: Assert Pending booking');
    await expect(tripPage.getByText('Pending booking')).toBeVisible();

    // Step 7: Accept terms → Proceed to Checkout
    console.log('Step 7: Accept terms and proceed to checkout');
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(tripPage);

    // Step 8: Wait for checkout page and proceed (let DSL handle the page validation)
    console.log('Step 8: Proceeding to checkout page');

    // Step 9: Book & Finalize (DSL)
    console.log('Step 9: Book and finalize booking');
    await Checkout.bookAndFinalize(tripPage);

    // Step 10: Assert finalizing status in trip overview
    console.log('Step 10: Assert finalizing status');
    expect(await TripOverview.isBookingFinalizing(tripPage)).toBe(true);

    // Step 11: Cancel flight trip with complete validation
    console.log('Step 11: Cancel flight booking');
    await TripOverview.cancelFlightTrip(tripPage);

    console.log('Flight booking and cancellation flow completed successfully!');
  });
});