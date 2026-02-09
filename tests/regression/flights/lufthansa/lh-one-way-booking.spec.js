const { test } = require("@fixtures/supplierTest");

const { Search, FlightSearch, FlightResults, Cart, Checkout } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");

test.describe("[@regression] Lufthansa NDC - One Way Flight Booking End-to-End Flow", () => {
  test("[@priority:critical] Should complete one-way flight booking end-to-end flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = await newTripPageFor("lufthansa", "user_one");

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    // Step 3: Search for a one-way flight (Munich → Frankfurt)
    console.log("Step 3: Search for a one-way flight (Munich → Frankfurt)");
    await FlightSearch.searchFlightOneWay(page, "mucToFra");

    // Step 4: Select the first available flight and add it to the cart
    console.log("Step 4: Add first flight to cart");
    await FlightResults.addFirstFlightToCart(page);

    // Step 5: Accept terms and continue to checkout
    console.log("Step 5: Accept terms and proceed to checkout");
    await Cart.acceptTermsAndConditionsAndProceedToCheckout(page);

    // Step 6: Complete the booking
    console.log("Step 6: Complete the booking");
    await Checkout.bookAndFinalize(page);

    // Step 7: Verify that the booking is in "Ticketing Complete" state
    console.log("Step 7: Verify booking is \"Ticketing Complete\" status");
    await Cart.expectBookingStatus(tripStatus.label.ticketingComplete.status, { page });

    console.log("One-way flight booking end-to-end flow completed successfully.");
  });
});
