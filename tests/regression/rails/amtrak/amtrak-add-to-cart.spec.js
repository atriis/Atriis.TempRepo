const { test } = require("@fixtures/supplierTest");

const { Search, AmtrakSearch, Results, Cart } = require("@dsl");
const tripStatus = require("@data/tripStatus.json");

test.describe("[@regression] Amtrak Add To Cart Flow", () => {
  // Test 1: Round Trip Amtrak Add To Cart Flow
  test("[@priority:critical] Round Trip Amtrak Add To Cart – Should complete full Amtrak round trip add to cart flow", async ({ newTripPage }) => {
    // Step 1: Login
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = newTripPage;

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    // Step 3: Search round trip NYP → WAS
    console.log("Step 3: Search round trip Amtrak NYP → WAS");
    await AmtrakSearch.searchAmtrakRoundTrip(page, "nypToWas");

    // Step 4: Add Amtrak to trip
    console.log("Step 4: Add Amtrak to trip");
    await Results.clickSelectButtonRoundTripAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log("Step 5: Quote is \"Pending booking\" status");
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log("Amtrak round trip add to cart flow completed successfully.");
  });

  // Test 2: One Way Amtrak Add To Cart Flow
  test("[@priority:critical] One Way Amtrak Add To Cart – Should complete full Amtrak one way add to cart flow", async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = await newTripPageFor("amtrak", "user_one");

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    // Step 3: Search one-way NYP → WAS
    console.log("Step 3: Search one-way Amtrak NYP → WAS");
    await AmtrakSearch.searchAmtrakOneWay(page, "nypToWas");

    // Step 4: Add Amtrak to trip
    console.log("Step 4: Add Amtrak to trip");
    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);

    // Step 5: Assert Pending booking
    console.log("Step 5: Quote is \"Pending booking\" status");
    await Cart.expectBookingStatus(tripStatus.label.pendingBooking.status, { page });

    console.log("Amtrak one way add to cart flow completed successfully.");
  });
});
