const { test, expect } = require('@playwright/test');
const { McpBrowserHelper } = require('../mcp/browserHelper');
const config = require('../test-data/config.json');
const users = require('../test-data/users.json');

test.describe('Search One Way Flight and Add it to Trip', () => {

  test('Should search one way flight from LHR to MAD', async ({ page }) => {
    // Initialize MCP helper
    page.mcp = new McpBrowserHelper(page);
    
    console.log('Starting test');
    
    // Get environment from process.env or default to staging
    const environment = process.env.TEST_ENV || 'staging';
    const url = environment === 'dev' ? config.devURL : config.stagingURL;
    
    // Step 1: Navigate to specified environment
    await page.goto(url);
    await page.mcp.waitFor('page to load');
    
    console.log('Step 2: Fill login credentials');
    await page.mcp.fill('email', users.amadeus.userOne);
    await page.mcp.fill('password', users.sharedPassword);
    
    console.log('Step 3: Click login button');
    await page.mcp.click('login button');
    await page.mcp.waitFor('3');
    
    console.log('Step 4: Click Book a new trip');
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.mcp.click('Book a New Trip')
    ]);
    
    // Initialize MCP for new page
    newPage.mcp = new McpBrowserHelper(newPage);
    
    console.log('Step 5: Wait for new tab to load');
    await newPage.mcp.waitFor('page to load');
    await newPage.bringToFront();
    await newPage.mcp.waitFor('2');
    
    console.log('Step 6: Validate "One way" is displayed');
    const oneWayVisible = await newPage.isVisible('text="One way"');
    console.log(`"One way" is ${oneWayVisible ? 'visible' : 'NOT visible'}`);
    expect(oneWayVisible).toBeTruthy();
    
    console.log('Step 7: Click "Add traveller" button');
    await newPage.mcp.click('Add traveller');
    
    console.log('Step 8: Select "I\'m the traveller"');
    await newPage.mcp.click('I\'m the traveller');
    
    console.log('Step 9: Type "LHR" in From field');
    await newPage.mcp.fill('From', 'LHR');
    await newPage.waitForTimeout(3000);
    
    console.log('Step 10: Select first option for departure');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    console.log('Step 11: Type "MAD" in To field');
    await newPage.mcp.fill('To', 'MAD');
    await newPage.waitForTimeout(3000);
    
    console.log('Step 12: Select first option for destination');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    console.log('Step 13: Click "One way"');
    await newPage.mcp.selectTripType('one way');
    
    console.log('Step 14: Click departure date field and select date 2 months ahead');
    // Click the date input field
    await newPage.locator('input[placeholder="Departure date"]').click();
    await newPage.waitForTimeout(1500);
    
    // Navigate 2 months ahead
    await newPage.locator('.el-date-picker__next-btn').last().click();
    await newPage.waitForTimeout(500);
    await newPage.locator('.el-date-picker__next-btn').last().click();
    await newPage.waitForTimeout(500);
    
    // Click first available date that is visible
    await newPage.locator('td.available:visible').first().click();
    await newPage.waitForTimeout(1000);
    
    console.log('Step 15: Click Search button');
    await newPage.locator('button.search-btn').click();
    await newPage.mcp.waitFor('5');
    
    console.log('Step 16: Validate "Add to trip" button is displayed');
    const addToTripVisible = await newPage.isVisible('text="Add to trip"', { timeout: 10000 }).catch(() => false);
    console.log(`"Add to trip" button is ${addToTripVisible ? 'visible' : 'NOT visible'}`);
    
    console.log('Step 17: Click "Add to trip" button');
    await newPage.click('text="Add to trip"');
    await newPage.waitForTimeout(2000);
    
    console.log('Step 18: Handle modal if it appears and click proceed');
    const modalVisible = await newPage.isVisible('text="Proceed"', { timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      await newPage.click('text="Proceed"');
      console.log('Clicked Proceed in modal');
      await newPage.waitForTimeout(2000);
    }
    
    console.log('Step 19: Validate "pending booking" text in cart page');
    
    // Wait for booking to be processed like the POM test does
    await newPage.waitForTimeout(5000);
    await newPage.waitForLoadState('networkidle');
    
    const pendingBookingVisible = await newPage.isVisible('text="Pending booking"', { timeout: 10000 }).catch(() => false);
    console.log(`"Pending booking" text is ${pendingBookingVisible ? 'visible' : 'NOT visible'}`);
    
    // Assert that pending booking is visible - will fail test if not found
    expect(pendingBookingVisible).toBeTruthy();
    
    console.log('Test completed successfully!');
  });
});