const { test, expect } = require('@fixtures/supplierTest');

const { Search, FlightSearch, FlightResults, Trips, App } = require('@dsl');

test.describe('[@smoke] Smoke Tests', () => {
  // Test 1: Application Load Test
  test('[@priority:medium] Smoke - Application Loads', async ({ newTripPage }) => {
    const page = newTripPage;

    // Step 1: Assert application loads successfully
    console.log('Step 1: Assert application loads successfully');
    expect(await page.url()).not.toBe(''); //Need to improve the assertion and add it to the DSL

    // Step 2: Assert page title is loaded
    console.log('Step 2: Assert page title is loaded');
    expect(await page.title()).not.toBe(''); //Need to improve the assertion and add it to the DSL
  });

  // Test 2: Login and Navigation Test
  test('[@priority:critical] Smoke - Login and Navigate to Trips', async ({ loggedInPage }) => {
    const page = loggedInPage;

    // Step 1: Navigate to Trips page
    console.log('Step 1: Navigate to Trips page');
    await Trips.navigateToTripsPage(page);

    // Step 2: Assert trips page is loaded
    console.log('Step 2: Assert trips page is loaded');
    expect(await page.title()).not.toBe('');
  });

  // Test 3: Flight Search Test
  test('[@priority:critical] Smoke - Flight Search and Verify Results', async ({ newTripPage }) => {
    const page = newTripPage;

    // Step 1: Add me as traveler
    console.log('Step 1: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 2: Search one-way flight CDG → LHR
    console.log('Step 2: Search one-way flight CDG → LHR');
    await FlightSearch.searchFlightOneWay(page, 'cdgToLhr');

    // Step 3: Assert flight results are displayed
    console.log('Step 3: Assert flight results are displayed');
    expect(await FlightResults.isResultDisplayed(page)).toBe(true);
  });

  // Test 4: Logout Test
  test('[@priority:high] Smoke - Logout', async ({ loggedInPage }) => {
    const page = loggedInPage;

    // Step 1: Logout from application
    console.log('Step 1: Logout from application');
    await App.logout(page); //Need to improve the assertion and add it to the DSL

    // Step 2: Assert redirected to login page
    console.log('Step 2: Assert redirected to login page');
    expect(await page.url()).toContain('login'); //Need to improve the assertion and add it to the DSL
  });
});