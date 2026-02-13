const { test, expect } = require("@fixtures/supplierTest");

const { Search, FlightSearch, FlightResults, Trips, App } = require("@dsl");
const logger = require('../../src/utils/logger').child('SmokeTests');

test.describe("[@smoke] Smoke Tests", () => {
  // Test 1: Application Load Test
  test("[@priority:medium] Smoke - Application Loads", async ({ newTripPageFor }) => {
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 1: Assert application loads successfully
    logger.info('Asserting application loads successfully');
    expect(await page.url()).not.toBe(""); //Need to improve the assertion and add it to the DSL

    // Step 2: Assert page title is loaded
    logger.info('Asserting page title is loaded');
    expect(await page.title()).not.toBe(""); //Need to improve the assertion and add it to the DSL
  });

  // Test 2: Login and Navigation Test
  test("[@priority:critical] Smoke - Login and Navigate to Trips", async ({ newTripPageFor }) => {
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 1: Navigate to Trips page
    logger.info('Navigating to Trips page');
    await Trips.navigateToTripsPage(page);

    // Step 2: Assert trips page is loaded
    logger.info('Asserting trips page is loaded');
    expect(page.url()).toContain("/trips");
  });

  // Test 3: Flight Search Test
  test("[@priority:critical] Smoke - Flight Search and Verify Results", async ({ newTripPageFor }) => {
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 1: Add me as traveler
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 2: Search one-way flight CDG → LHR
    logger.info('Searching one-way flight', { route: 'CDG → LHR' });
    await FlightSearch.searchFlightOneWay(page, "cdgToLhr");

    // Step 3: Assert flight results are displayed
    logger.info('Asserting flight results are displayed');
    expect(await FlightResults.isResultDisplayed(page)).toBe(true);
  });

  // Test 4: Logout Test
  test("[@priority:high] Smoke - Logout", async ({ newTripPageFor }) => {
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 1: Logout from application
    logger.info('Logging out from application');
    await App.logout(page); //Need to improve the assertion and add it to the DSL

    // Step 2: Assert redirected to login page
    logger.info('Asserting redirected to login page');
    expect(await page.url()).toContain("login"); //Need to improve the assertion and add it to the DSL
  });
});
