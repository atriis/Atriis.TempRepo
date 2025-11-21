const { waitForText } = require('../utils/wait');
const { getText } = require('../utils/dom');

class CartPage {
  constructor(page) {
    this.page = page;
  }

  // Handles the "Conflicting Quotes" modal that may appear during booking
  // Automatically clicks "Proceed" if the modal is visible, otherwise continues silently
  async handleConflictQuoteModalIfVisible() {
    console.log("Handle 'Conflicting Quotes' modal if it appears");

    // Try to detect any element that clearly belongs to the modal
    const proceedButton = this.page.locator('button:has-text("Proceed")').first();

    try {
      // Wait a bit for the modal to show up; if it doesn't, just return false
      await proceedButton.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      console.log("No 'Proceed' button found – assuming no Conflicting Quotes modal");
      return false;
    }

    console.log("'Proceed' button visible, clicking it...");
    await proceedButton.click();

    // Extra wait to ensure stability
    await this.page.waitForTimeout(1000);

    console.log("Conflicting Quotes modal handled");
    return true;
  }

  // Accepts the terms and conditions by clicking the checkbox
  // Required step before proceeding to checkout in the booking flow
  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(".el-checkbox__inner").first();
    await checkbox.waitFor({ state: "visible" });

    await checkbox.click();
  }

  // Waits for the "Proceed to Checkout" button to be ready for interaction
  // Handles text validation to ensure proper button state before proceeding
  async waitForProceedToCheckout() {
    const text = await getText(this.page, ".btn-container span");

    if (text === "'Proceed to Checkout'") {
      await waitForText(this.page, ".btn-container span", "Proceed to Checkout");
    }
  }

  // Clicks the "Proceed to Checkout" button to advance to the checkout page
  async clickProceedToCheckout() {
    await this.page.click(".btn-container span");
  }

  // Waits for the "Pending booking" text to appear, indicating booking is being processed
  async waitForPendingBookingText() {
    console.log('Waiting for "Pending booking" text...');

    await waitForText(this.page, ".app-label", "Pending booking");

    console.log('"Pending booking" text found');
  }

  // Waits for the "Refundable" text to appear in hotel cancellation terms
  // Confirms that the selected hotel booking has refundable cancellation policy
  async waitForHotelRefundableText() {
    console.log('Waiting for hotel refundable text...');

    const refundable = this.page
      .locator('div.refundable', { hasText: /Refundable/i })
      .first();

    await refundable.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Refundable hotel text found in cart');
  }
}

module.exports = CartPage;
