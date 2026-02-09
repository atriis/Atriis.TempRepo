const { test } = require("@fixtures/supplierTest");

const { Search, ManualQuoteSearch, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");

test.describe("Manual Quote - Add Flight Manual Quote to Cart", () => {
  test("[@priority:critical] Should complete add flight manual quote to cart flow", async ({ newTripPageFor }) => {

    // Step 1: Login
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    //Step 3: Search flight manual quote with default route
    console.log("Step 3: Search flight manual quote with default route");
    await ManualQuoteSearch.searchAndAddFlightManualQuote(page);

    //Step 4: Assert 'On Hold' trip status in cart
    console.log("Step 4: Assert 'On Hold' trip status in cart");
    await Cart.expectBookingStatus(tripStatus.label.onHold.status, { page });

    // Step 11: Cancel manual quote flight trip with complete validation
    console.log("Step 11: Cancel manual quote flight trip with complete validation");
    await Cart.cancelTripStrict(page);

    console.log("Flight manual quote add to cart flow completed successfully.");
  });
});
