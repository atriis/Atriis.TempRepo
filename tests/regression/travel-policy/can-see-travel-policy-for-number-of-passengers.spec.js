const { test } = require("@fixtures/supplierTest");
const { Search, FlightSearch, Results, Cart } = require("@dsl");

test.describe("[@regression][@travel-policy] 47764 Can see travel policy for number of passengers", () => {
  test("[@priority:high] Should verify OOP indicators and Flight Capacity modal behavior", async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log("Step 1: Login + Book a New Trip (fixtures)");
    const page = await newTripPageFor("travelpolicy", "user_one");

    // Step 2: Add me as traveler
    console.log("Step 2: Add me as traveler");
    await Search.addMeAsTraveler(page);

    // Step 3: Add second traveler by name
    console.log("Step 3: Add second traveler by name");
    await Search.addTravelerByName(page, "Poly Mispar");

    // Step 4: Add third traveler by name
    console.log("Step 4: Add third traveler by name");
    await Search.addTravelerByName(page, "Amber Ofpas");

    // Step 5: Search round trip flight
    console.log("Step 5: Search round trip flight");
    await FlightSearch.searchFlightRoundTrip(page);

    // Step 6: Verify Out of Policy indicators ARE NOT VISIBLE in results (before clicking Add to Trip)
    console.log("Step 6: Verify Out of Policy indicators ARE NOT VISIBLE in results");
    await Results.verifyOutOfPolicyIndicatorNotVisibleInResults(page);

    // Step 7: Click Add to Trip button
    console.log("Step 7: Click Add to Trip button");
    await Results.waitAndClickAddToTripButton(page);

    // Step 8: Validate Flight Capacity Restriction Modal is visible and click 'Go Back'
    console.log("Step 8: Validate Flight Capacity Restriction Modal is visible and click \"Go Back\" button");
    await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page);

    // Step 9: Verify OOP indicators ARE VISIBLE in results
    console.log("Step 9: Verify OOP indicators ARE VISIBLE in results");
    await Results.verifyOutOfPolicyIndicatorVisibleInResults(page);

    // Step 10: Hover over OOP info icon and verify tooltip text
    console.log("Step 10: Hover over OOP info icon and verify tooltip text");
    await Results.hoverOverResultsOOPInfoAndVerifyTooltipTextIs(page, "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only");

    // Step 11: Click Add to Trip button
    console.log("Step 11: Validate Flight Capacity Restriction Modal is visible and click \"Proceed Anyway\" button, after clicking \"Add to Trip\" button");
    await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(page);

    // Step 12: Validate OOP indicators are visible in cart page
    console.log("Step 12: Validate OOP indicators are visible in cart page");
    await Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(page);

    // Step 13: Hover over OOP info icon in cart and verify tooltip text
    console.log("Step 13: Hover over OOP info icon in cart and verify tooltip text");
    await Cart.hoverOverCartOOPInfoAndVerifyTooltipTextIs(page, "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only");

    console.log("Travel Policy Flow completed successfully.");
  });
});
