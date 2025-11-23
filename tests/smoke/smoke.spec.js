const {amadeusUserOneTest, amadeusUserTwoTest, test, expect} = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search');
const FlightSearch = require('../../src/dsl/FlightSearch');
const FlightResults = require('../../src/dsl/FlightResults');
const Trips = require('../../src/dsl/Trips');
const App = require('../../src/dsl/App');

test.describe('Smoke Tests', () => {
  // Test 1: Amadeus User One
  amadeusUserOneTest('Smoke - Application Loads', async ({ newTripPageAMADEUS_USER_ONE }) => {
    const page = newTripPageAMADEUS_USER_ONE;

    // Step 1: Assert application loads successfully
    console.log('Step 1: Assert application loads successfully');
    expect(await page.url()).not.toBe('');

    // Step 2: Assert page title is loaded
    console.log('Step 2: Assert page title is loaded');
    expect(await page.title()).not.toBe('');
  });

  // Test 2: Amadeus User One
  amadeusUserOneTest('Smoke - Login and Navigate to Trips', async ({ loggedInPageAMADEUS_USER_ONE }) => {
    const page = loggedInPageAMADEUS_USER_ONE;

    // Step 1: Navigate to Trips page
    console.log('Step 1: Navigate to Trips page');
    await Trips.navigateToTripsPage(page);

    // Step 2: Assert trips page is loaded
    console.log('Step 2: Assert trips page is loaded');
    expect(await page.title()).not.toBe('');
  });

  // Test 3: Amadeus User Two
  amadeusUserTwoTest('Smoke - Flight Search and Verify Results', async ({ newTripPageAMADEUS_USER_TWO }) => {
    const page = newTripPageAMADEUS_USER_TWO;

    // Step 1: Add traveler (I am the traveler)
    console.log('Step 1: Add traveler');
    await Search.addTravelerImTheTraveller(page);

    // Step 2: Search one-way flight CDG → LHR
    console.log('Step 2: Search one-way flight CDG → LHR');
    await FlightSearch.searchFlightsOneWay(page, 'cdgToLhr');

    // Step 3: Assert flight results are displayed
    console.log('Step 3: Assert flight results are displayed');
    expect(await FlightResults.isResultDisplayed(page)).toBe(true);
  });

  // Test 4: Amadeus User Two
  amadeusUserTwoTest('Smoke - Logout', async ({ loggedInPageAMADEUS_USER_TWO }) => {
    const page = loggedInPageAMADEUS_USER_TWO;

    // Step 1: Logout from application
    console.log('Step 1: Logout from application');
    await App.logout(page);

    // Step 2: Assert redirected to login page
    console.log('Step 2: Assert redirected to login page');
    expect(await page.url()).toContain('login');
  });
});