class CartPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Handle 'Conflicting Quote' modal if visible
   */
  async handleConflictQuoteModalIfVisible() {
    console.log("Handle 'Conflicting Quote' modal if it appears and click 'Proceed");
    
    // Check multiple ways to detect the modal
    let modalVisible = false;
    const modalStrategies = [
      () => this.page.isVisible('text=Proceed', { timeout: 3000 }),
      () => this.page.isVisible('button:has-text("Proceed")', { timeout: 2000 }),
      () => this.page.isVisible('[data-testid*="proceed"]', { timeout: 1000 })
    ];
    
    for (const strategy of modalStrategies) {
      try {
        modalVisible = await strategy().catch(() => false);
        if (modalVisible) {
          console.log('Modal detected, clicking Proceed');
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (modalVisible) {
      // Try MCP click first, fallback to standard click
      try {
        await this.page.mcp.click('Proceed');
      } catch (error) {
        await this.page.click('text=Proceed');
      }
      console.log("Clicked 'Proceed' in modal");
      // Extended wait after modal for headless mode
      await this.page.waitForTimeout(3000);
    } else {
      console.log('No conflicting quote modal detected');
    }
  }

  /**
   * Validate that pending booking is visible after adding flight to trip
   * @returns {Object} - Result object with found status, selector, and text
   */
  async validatePendingBooking() {
    console.log("Validate 'Pending Booking' after adding flight to trip");
    
    // Extended wait for headless mode compatibility (8 seconds)
    await this.page.waitForTimeout(8000);
    
    // Wait for network to be idle to ensure all content is loaded
    await this.page.waitForLoadState('networkidle');
    
    // Use specific pending booking selector
    const selector = 'p.app-label--quote.pending-booking';
    
    console.log(`Looking for pending booking with selector: ${selector}`);
    
    const pendingBookingVisible = await this.page.isVisible(selector, { timeout: 15000 });
    
    if (pendingBookingVisible) {
      const elementText = await this.page.locator(selector).first().textContent();
      console.log(`Found "Pending" booking with selector: ${selector}`);
      console.log(`Element text: "${elementText}"`);
      return { found: true, selector: selector, text: elementText };
    } else {
      console.log(`Pending booking not found with selector: ${selector}`);
      throw new Error(`Expected "Pending Booking" element with selector "${selector}" to be visible after adding flight to trip, but it was not found`);
    }
  }

  async waitAndTakeScreenshot() {
    console.log('Wait for 10 seconds');
    await this.page.mcp.waitFor('10');
    
    console.log('Take screenshot');
    await this.page.mcp.screenshot('flight-search-lhr-mad-results');
  }
}

module.exports = CartPage;