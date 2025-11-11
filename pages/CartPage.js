class CartPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Handle 'Conflicting Quote' modal if visible
   */
  async handleConflictQuoteModalIfVisible() {
    console.log("Handle 'Conflicting Quote' modal if it appears and click 'Proceed");
    const modalVisible = await this.page.isVisible('text=Proceed', { timeout: 3000 }).catch(() => false);
    if (modalVisible) {
      await this.page.click('text=Proceed');
      console.log("Clicked 'Proceed' in modal");
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Validate that pending booking is visible after adding flight to trip
   * @returns {Object} - Result object with found status, selector, and text
   */
  async validatePendingBooking() {
    console.log("Validate 'Pending Booking' after adding flight to trip");
    
    // Wait for the booking to be processed
    await this.page.waitForTimeout(5000);
    
    // Wait for page to fully load after adding to trip
    await this.page.waitForLoadState('networkidle');
    
    // More specific and stable selectors for "Pending Booking"
    const stableSelectors = [
      // Direct text matches
      'text="Pending Booking"',
      'text="Pending booking"', 
      'text="PENDING BOOKING"',
      
      // Partial text matches
      'text*="Pending Booking"',
      'text*="Pending booking"',
      'text*="pending booking"',
      
      // Element with specific classes or data attributes
      '[class*="pending"]',
      '[class*="booking"]',
      '[data-testid*="pending"]',
      '[data-testid*="booking"]',
      '[data-status="pending"]',
      '[data-booking-status="pending"]',
      
      // Common booking status containers
      '.booking-status:has-text("Pending")',
      '.trip-status:has-text("Pending")',
      '.cart-item:has-text("Pending")',
      '.booking-item:has-text("Pending")',
      
      // Generic containers with pending text
      'div:has-text("Pending Booking")',
      'span:has-text("Pending Booking")',
      'p:has-text("Pending Booking")',
      'td:has-text("Pending")',
      'li:has-text("Pending")',
      
      // Broader pending text search
      '*:has-text("Pending")'
    ];
    
    let pendingBookingVisible = false;
    let foundSelector = '';
    let elementText = '';
    
    console.log('Searching for "Pending Booking" with multiple selectors...');
    
    for (const selector of stableSelectors) {
      try {
        pendingBookingVisible = await this.page.isVisible(selector, { timeout: 3000 });
        if (pendingBookingVisible) {
          foundSelector = selector;
          // Get the actual text content for verification
          try {
            const element = this.page.locator(selector).first();
            elementText = await element.textContent();
          } catch (e) {
            elementText = 'Could not extract text';
          }
          console.log(`✅ Found "Pending" booking with selector: ${foundSelector}`);
          console.log(`📝 Element text: "${elementText}"`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Additional debugging if not found
    if (!pendingBookingVisible) {
      console.log('🔍 Debugging: Checking page content...');
      try {
        const bodyText = await this.page.textContent('body');
        console.log('Page contains "Pending":', bodyText.includes('Pending'));
        console.log('Page contains "Booking":', bodyText.includes('Booking'));
        console.log('Page contains "pending":', bodyText.includes('pending'));
        console.log('Page contains "booking":', bodyText.includes('booking'));
        
        // Log visible text in potential cart areas
        const cartSelectors = ['.cart', '.trip', '.booking', '#cart', '#trip-list'];
        for (const cartSelector of cartSelectors) {
          try {
            const cartText = await this.page.textContent(cartSelector);
            if (cartText) {
              console.log(`Content in ${cartSelector}:`, cartText.substring(0, 200));
            }
          } catch (e) {
            // Selector doesn't exist, continue
          }
        }
      } catch (e) {
        console.log('Could not extract page content for debugging');
      }
    }
    
    console.log(`"Pending Booking" is ${pendingBookingVisible ? `visible (found with: ${foundSelector})` : 'NOT visible on current page'}`);
    
    // Assert that "Pending Booking" is visible - fail the test if not found
    if (!pendingBookingVisible) {
      throw new Error('Expected "Pending Booking" to be visible after adding flight to trip, but it was not found after checking multiple selectors');
    }
    
    return { found: true, selector: foundSelector, text: elementText };
  }

  async waitAndTakeScreenshot() {
    console.log('Wait for 10 seconds');
    await this.page.mcp.waitFor('10');
    
    console.log('Take screenshot');
    await this.page.mcp.screenshot('flight-search-lhr-mad-results');
  }
}

module.exports = CartPage;