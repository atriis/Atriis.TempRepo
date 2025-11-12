const { test, expect } = require('@playwright/test');
const { McpBrowserHelper } = require('../mcp/browserHelper');
const LoginPage = require('../pages/LoginPage');
const MenuPage = require('../pages/MenuPage');
const SearchPage = require('../pages/SearchPage');
const FlightSearchPage = require('../pages/FlightSearchPage');
const CartPage = require('../pages/CartPage');
const config = require('../test-data/config.json');
const flightData = require('../test-data/flights.json');

test.describe('Search One Way Flight and Add it to Trip - Page Object Model', () => {

  const testRoute = flightData.routes[flightData.defaultRoute];
  
  test(`Should search flight from ${testRoute.origin} to ${testRoute.destination}`, async ({ page, context }) => {
    // Initialize MCP helper and Page Objects
    page.mcp = new McpBrowserHelper(page);
    const loginPage = new LoginPage(page);
    const menuPage = new MenuPage(page);
    
    console.log('Starting flight search test...');
    
    // Get environment from process.env or default to staging
    const environment = process.env.TEST_ENV || 'staging';
    
    // Step 1: Navigate and login
    await loginPage.navigate(environment);
    await loginPage.login('amadeus', 'userOne');
    
    // Step 2: Book a new trip (this will open new tab)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      menuPage.bookANewTrip()
    ]);
    
    // Switch to new page and initialize it with MCP
    newPage.mcp = new McpBrowserHelper(newPage);
    await newPage.bringToFront();
    await newPage.waitForLoadState('networkidle');
    await newPage.mcp.waitFor('2');
    
    // Initialize Page Objects for new page
    const searchPage = new SearchPage(newPage);
    const flightSearchPage = new FlightSearchPage(newPage);
    const cartPage = new CartPage(newPage);
    
    // Step 3: Validate 'One Way' is visible
    await flightSearchPage.validateOneWayVisible();
    
    // Step 4: Add traveller - I'm the traveller
    await searchPage.addTravellerImTheTraveller();
    
    // Step 5: Fill flight details
    await flightSearchPage.fillOrigin(testRoute.origin);
    await flightSearchPage.fillDestination(testRoute.destination);
    await flightSearchPage.selectTripType(testRoute.tripType);
    await flightSearchPage.selectDepartureDate();
    
    // Step 6: Search for flights
    await searchPage.clickSearchButton();
    
    // Step 7: Validate and click 'Add to Trip' button
    await flightSearchPage.validateAndAddToTrip();
    
    // Step 8: Handle modal if needed and validate 'Pending Booking' in Cart Page
    await cartPage.handleConflictQuoteModalIfVisible();
    await cartPage.validatePendingBooking();
  });

});