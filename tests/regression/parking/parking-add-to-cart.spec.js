const { test } = require("@fixtures/supplierTest");

const { Search, UKParkingSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");

test.describe("Parking - Add UK Parking to Cart", () => {
  test("[@priority:critical] Should complete add UK parking to cart flow", async ({ newTripPageFor }) => {

    // Step 1: Login + Book a New Trip (handled by fixture)
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = await newTripPageFor("ukparking", "user_one");

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    // Step 3: Search UK parking
    console.log("Step 3: Search UK parking");
    await UKParkingSearch.searchUKParking(page);

    // Step 4: Add parking to cart
    console.log("Step 4: Add parking to cart");
    await Results.waitAndClickAddToTripButton(page);

    // Step 5: Validate trip status is 'Pending Booking' in cart
    console.log("Step 5: Validate trip status is 'Pending Booking' in cart");
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log("UK parking add to cart flow completed successfully.");
  });
});
