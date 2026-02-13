const { test } = require("@fixtures/supplierTest");
const { Search, FlightSearch, Results, Cart } = require("@dsl");
const logger = require('@utils/logger').child('TravelPolicyPassengers');

test.describe("[@regression][@travel-policy] 47764 Can see travel policy for number of passengers", () => {
  test("[@priority:high] Should verify OOP indicators and Flight Capacity modal behavior", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'travelpolicy', user: 'user_one' });
    const page = await newTripPageFor("travelpolicy", "user_one");

    // Step 2: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Add second traveler by name
    logger.info('Adding second traveler', { name: 'Poly Mispar' });
    await Search.addTravelerByName(page, "Poly Mispar");

    // Step 4: Add third traveler by name
    logger.info('Adding third traveler', { name: 'Amber Ofpas' });
    await Search.addTravelerByName(page, "Amber Ofpas");

    // Step 5: Search round trip flight
    logger.info('Searching round trip flight');
    await FlightSearch.searchFlightRoundTrip(page);

    // Step 6: Verify Out of Policy indicators ARE NOT VISIBLE in results (before clicking Add to Trip)
    logger.info('Verifying OOP indicators are NOT visible in results');
    await Results.verifyOutOfPolicyIndicatorNotVisibleInResults(page);

    // Step 7: Click Add to Trip button
    logger.info('Clicking Add to Trip button');
    await Results.waitAndClickAddToTripButton(page);

    // Step 8: Validate Flight Capacity Restriction Modal is visible and click 'Go Back'
    logger.info('Validating Flight Capacity Restriction Modal and clicking Go Back');
    await Results.validateFlightCapacityModalIsVisibleInResultsAndClickGoBack(page);

    // Step 9: Verify OOP indicators ARE VISIBLE in results
    logger.info('Verifying OOP indicators ARE visible in results');
    await Results.verifyOutOfPolicyIndicatorVisibleInResults(page);

    // Step 10: Hover over OOP info icon and verify tooltip text
    logger.info('Hovering over OOP info icon and verifying tooltip text');
    await Results.hoverOverResultsOOPInfoAndVerifyTooltipTextIs(page, "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only");

    // Step 11: Click Add to Trip button
    logger.info('Validating Flight Capacity Restriction Modal and clicking Proceed Anyway');
    await Results.validateFlightCapacityModalIsVisibleAfterAddToCart(page);

    // Step 12: Validate OOP indicators are visible in cart page
    logger.info('Validating OOP indicators are visible in cart');
    await Cart.verifyOutOfPolicyIndicatorIsVisibleInCart(page);

    // Step 13: Hover over OOP info icon in cart and verify tooltip text
    logger.info('Hovering over OOP info icon in cart and verifying tooltip text');
    await Cart.hoverOverCartOOPInfoAndVerifyTooltipTextIs(page, "Number of Passengers is greater than or equals 3  and role - dont change is for number of passengers only");

    logger.info('Travel Policy Flow completed successfully');
  });
});
