const { test, expect } = require('../fixtures/testWithFixtures');

//NEED TO ADJUST ASSERTIONS

// DSL imports
const Search = require('../../src/dsl/Search');
const FlightSearch = require('../../src/dsl/FlightSearch');
const FlightResults = require('../../src/dsl/FlightResults');
const Trips = require('../../src/dsl/Trips');
const App = require('../../src/dsl/App');

test.describe('Smoke Tests', () => {
  test('Smoke - Application Loads', async ({ newTripPage }) => {
    const page = newTripPage;

    // Step 1: Verify application URL is not empty
    const currentUrl = await page.url();
    expect(currentUrl).not.toBe('');
    console.log(`Application URL: ${currentUrl}`);

    // Step 2: Verify page title is not empty
    const title = await page.title();
    expect(title).not.toBe('');
    console.log(`Page title: ${title}`);
  });

  test('Smoke - Login and Navigate to "Trips"', async ({ loggedInPage }) => {
    const page = loggedInPage;

    // Step 1: Navigate to Trips page
    await Trips.navigateToTripsPage(page);

    // Step 2: Verify we are on the Trips page (title not empty)
    const title = await page.title();
    expect(title).not.toBe('');
    console.log(`Trips page title: ${title}`);
  });

  test('Smoke - Flight Search and Verify Results', async ({ newTripPage }) => {
    const page = newTripPage;

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

  test('Smoke - Logout', async ({ loggedInPage }) => {
    const page = loggedInPage;

    // Step 1: Logout from application
    console.log('Step 1: Logout from application');
    await App.logout(page);

    // Step 2: Verify we are redirected to login page
    console.log('Step 2: Verify login page is displayed');
    const currentUrl = await page.url();
    expect(currentUrl).toContain('login');
    console.log(`Post-logout URL: ${currentUrl}`);
  });
});