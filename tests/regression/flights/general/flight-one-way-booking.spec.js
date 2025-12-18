const { test, expect } = require('../../../fixtures/supplierTest');

const Search = require('../../../../src/dsl/Search');
const FlightSearch = require('../../../../src/dsl/FlightSearch');
const FlightResults = require('../../../../src/dsl/FlightResults');
const Cart = require('../../../../src/dsl/Cart');
const Checkout = require('../../../../src/dsl/Checkout');
const TripOverview = require('../../../../src/dsl/TripOverview');

/**
 * One-Way Flight Booking – End-to-End
 *
 * This test simulates a real user:
 * - logging in
 * - searching a one-way flight
 * - booking the flight
 * - cancelling the trip
 *
 * It validates the full booking lifecycle.
 */
test.describe('[@regression] One Way Flight Booking End-to-End Flow', () => {
  test(
    '[@priority:critical] Should complete one-way flight booking and cancellation',
    async ({ newTripPage }) => {

      /**
       * The fixture already:
       * - opened the application
       * - logged the user in
       * - navigated to the "New Trip" screen
       */
      const page = newTripPage;

      // Step 1: Confirm the logged-in user is the traveler
      await Search.addTravellerImTheTraveller(page);

      // Step 2: Search for a one-way flight (London → Doha)
      await FlightSearch.searchFlightOneWay(page, 'lhrToDoh');

      // Step 3: Select the first available flight and add it to the cart
      await FlightResults.addFirstFlightToCart(page);

      // Step 4: Accept terms and continue to checkout
      await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

      // Step 5: Complete the booking
      await Checkout.bookAndFinalize(page);

      // Step 6: Verify that the booking is in "finalizing" state
      const isFinalizing = await TripOverview.isBookingFinalizing(page);
      expect(isFinalizing).toBe(true);

      // Step 7: Cancel the trip to keep test environment clean
      await TripOverview.cancelTrip(page);
    }
  );
});