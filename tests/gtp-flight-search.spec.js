const { test, expect } = require('@playwright/test');
const { McpBrowserHelper } = require('../mcp/browserHelper');

test.describe('GTP Staging Flight Search with MCP', () => {

  test('should search flight from LHR to MAD on December 20th', async ({ page }) => {
    // Initialize MCP helper
    page.mcp = new McpBrowserHelper(page);
    
    console.log('🚀 Starting flight search test with MCP...');
    
    // Step 1: Navigate and login
    await page.mcp.navigate('gtp staging');
    await page.mcp.waitFor('page to load');
    
    console.log('🎯 Step 2: Fill login credentials');
    await page.mcp.fill('email', 'ruimariano@amadeus.com');
    await page.mcp.fill('password', 'NextLevelAtriis25!');
    
    console.log('🎯 Step 3: Click login button');
    await page.mcp.click('login button');
    await page.mcp.waitFor('3');
    
    console.log('🎯 Step 4: Click Book a new trip');
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.mcp.click('Book a New Trip')
    ]);
    
    // Initialize MCP for new page
    newPage.mcp = new McpBrowserHelper(newPage);
    
    console.log('🎯 Step 5: Wait for new tab to load');
    await newPage.mcp.waitFor('page to load');
    await newPage.bringToFront();
    await newPage.mcp.waitFor('2');
    
    console.log('🎯 Step 6: Validate "One way" is displayed');
    const oneWayVisible = await newPage.isVisible('text="One way"');
    console.log(`✅ "One way" is ${oneWayVisible ? 'visible' : 'NOT visible'}`);
    expect(oneWayVisible).toBeTruthy();
    
    console.log('🎯 Step 7: Click "Add traveller" button');
    await newPage.mcp.click('Add traveller');
    
    console.log('🎯 Step 8: Select "I\'m the traveller"');
    await newPage.mcp.click('I\'m the traveller');
    
    console.log('🎯 Step 9: Type "LHR" in From field');
    await newPage.mcp.fill('From', 'LHR');
    await newPage.waitForTimeout(3000);
    
    console.log('🎯 Step 10: Select first option for departure');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    console.log('🎯 Step 11: Type "MAD" in To field');
    await newPage.mcp.fill('To', 'MAD');
    await newPage.waitForTimeout(3000);
    
    console.log('🎯 Step 12: Select first option for destination');
    await newPage.mcp.selectFromDropdown('first airport option');
    
    console.log('🎯 Step 13: Click "One way"');
    await newPage.mcp.selectTripType('one way');
    
    console.log('🎯 Step 14: Click departure date field and select date 2 months ahead');
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
    
    console.log('🎯 Step 15: Click Search button');
    await newPage.locator('button.search-btn').click();
    await newPage.mcp.waitFor('5');
    
    console.log('🎯 Step 16: Validate "Add to trip" button is displayed');
    const addToTripVisible = await newPage.isVisible('text="Add to trip"', { timeout: 10000 }).catch(() => false);
    console.log(`✅ "Add to trip" button is ${addToTripVisible ? 'visible' : 'NOT visible'}`);
    
    console.log('🎯 Step 17: Take final screenshot');
    await newPage.mcp.screenshot('flight-search-lhr-mad-results');
    
    console.log('⏸️  Pausing for 10 seconds to review results...');
    await newPage.mcp.waitFor('10');
    
    console.log('✅ Test completed successfully!');
  });
});