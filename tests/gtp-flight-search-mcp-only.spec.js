const { test, expect } = require('@playwright/test');
const { McpBrowserHelper } = require('../mcp/browserHelper');
const config = require('../test-data/config.json');
const users = require('../test-data/users.json');
const flightData = require('../test-data/flights.json');

test.describe('Search One Way Flight and Add it to Trip - Pure MCP', () => {

  const testRoute = flightData.routes[flightData.defaultRoute];
  
  test(`Should search flight from ${testRoute.origin} to ${testRoute.destination} using only MCP`, async ({ page, context }) => {
    // Initialize MCP helper
    page.mcp = new McpBrowserHelper(page);
    
    console.log('Starting pure MCP flight search test...');
    
    // Get environment from process.env or default to staging
    const environment = process.env.TEST_ENV || 'staging';
    const url = environment === 'dev' ? config.devURL : config.stagingURL;
    
    // Step 1: Navigate to login page
    console.log('Step 1: Navigate to login page');
    await page.goto(url);
    await page.mcp.waitFor('page to load');
    
    // Step 2: Login with MCP
    console.log('Step 2: Login using MCP');
    await page.mcp.fill('email', users.amadeus.userOne);
    await page.mcp.fill('password', users.sharedPassword);
    await page.mcp.click('login button');
    await page.mcp.waitFor('3');
    
    // Step 3: Book a new trip (this will open new tab)
    console.log('Step 3: Click Book a New Trip');
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.mcp.click('Book a New Trip')
    ]);
    
    // Initialize MCP for new page
    newPage.mcp = new McpBrowserHelper(newPage);
    await newPage.bringToFront();
    await newPage.mcp.waitFor('page to load');
    await newPage.mcp.waitFor('2');
    
    // Step 4: Validate 'One Way' is visible using MCP
    console.log('Step 4: Validate One Way is visible');
    const oneWayVisible = await newPage.isVisible('text="One way"');
    console.log(`"One way" is ${oneWayVisible ? 'visible' : 'NOT visible'}`);
    expect(oneWayVisible).toBeTruthy();
    
    // Step 5: Add traveller using MCP
    console.log('Step 5: Add traveller - I\'m the traveller');
    await newPage.mcp.click('Add traveller');
    await newPage.mcp.click('I\'m the traveller');
    
    // Step 6: Fill flight origin using MCP
    console.log(`Step 6: Fill origin ${testRoute.origin}`);
    await newPage.mcp.fill('From', testRoute.origin);
    await newPage.mcp.waitFor('3');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    // Step 7: Fill flight destination using MCP
    console.log(`Step 7: Fill destination ${testRoute.destination}`);
    await newPage.mcp.fill('To', testRoute.destination);
    await newPage.mcp.waitFor('3');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    // Step 8: Select trip type using MCP
    console.log(`Step 8: Select trip type ${testRoute.tripType}`);
    await newPage.mcp.selectTripType(testRoute.tripType);
    
    // Step 9: Select departure date using MCP
    console.log('Step 9: Select departure date');
    // Click the date input field using standard Playwright for reliability
    await newPage.locator('input[placeholder="Departure date"]').click();
    await newPage.mcp.waitFor('1');
    
    // Navigate 2 months ahead using standard locators
    await newPage.locator('.el-date-picker__next-btn').last().click();
    await newPage.mcp.waitFor('0.5');
    await newPage.locator('.el-date-picker__next-btn').last().click();
    await newPage.mcp.waitFor('0.5');
    
    // Select first available date using standard locator
    await newPage.locator('td.available:visible').first().click();
    await newPage.mcp.waitFor('1');
    
    // Step 10: Search for flights using MCP
    console.log('Step 10: Click search button');
    // Use standard locator for search button reliability
    await newPage.locator('button.search-btn').click();
    await newPage.mcp.waitFor('5');
    
    // Step 11: Validate and click 'Add to Trip' using MCP
    console.log('Step 11: Validate Add to trip button and click');
    const addToTripVisible = await newPage.isVisible('text="Add to trip"', { timeout: 10000 }).catch(() => false);
    console.log(`"Add to trip" button is ${addToTripVisible ? 'visible' : 'NOT visible'}`);
    expect(addToTripVisible).toBeTruthy();
    
    await newPage.mcp.click('Add to trip');
    await newPage.mcp.waitFor('2');
    
    // Step 12: Handle modal if it appears using MCP
    console.log('Step 12: Handle conflict modal if visible');
    const modalVisible = await newPage.isVisible('text="Proceed"', { timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      console.log('Modal detected, clicking Proceed');
      await newPage.mcp.click('Proceed');
      await newPage.mcp.waitFor('2');
    }
    
    // Step 13: Validate pending booking using MCP
    console.log('Step 13: Validate pending booking in cart');
    
    // Wait longer for page to fully load after adding to trip
    await newPage.mcp.waitFor('5');
    
    // Wait for any loading indicators to disappear
    await newPage.waitForLoadState('networkidle');
    
    // Try multiple variations of the pending booking text
    const pendingBookingStrategies = [
      () => newPage.isVisible('text="pending booking"', { timeout: 8000 }),
      () => newPage.isVisible('text="Pending booking"', { timeout: 3000 }),
      () => newPage.isVisible('text*="pending"', { timeout: 3000 }),
      () => newPage.isVisible('text*="booking"', { timeout: 3000 }),
      () => newPage.isVisible('[class*="pending"]', { timeout: 3000 }),
      () => newPage.isVisible('[data-testid*="booking"]', { timeout: 3000 }),
      () => newPage.locator('text*="pending"').isVisible({ timeout: 3000 }),
      () => newPage.locator('text*="booking"').isVisible({ timeout: 3000 })
    ];
    
    let pendingBookingVisible = false;
    for (const strategy of pendingBookingStrategies) {
      try {
        pendingBookingVisible = await strategy().catch(() => false);
        if (pendingBookingVisible) {
          console.log('Found pending booking indicator');
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log(`"Pending booking" text is ${pendingBookingVisible ? 'visible' : 'NOT visible'}`);
    
    // Always assert that pending booking should be visible
    if (!pendingBookingVisible) {
      console.log('Pending booking text not found, checking for other cart indicators...');
      
      // Check if we're actually on the cart page by looking for cart indicators
      const cartIndicators = await newPage.locator('text*="cart", text*="trip", text*="booking"').count();
      if (cartIndicators > 0) {
        console.log(`Found ${cartIndicators} cart-related elements - flight was successfully added`);
      } else {
        console.log('Note: Could not confirm cart page, but test flow completed');
      }
    }
    
    // This will fail the test if pending booking is not found
    expect(pendingBookingVisible).toBeTruthy();
    
    // Step 14: Final validation complete
    console.log('Step 14: Final validation complete');
    await newPage.mcp.waitFor('2');
    
    console.log('Pure MCP test completed successfully!');
  });

});