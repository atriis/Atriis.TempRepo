const { waitForText } = require('../utils/wait');
const { getText } = require('../utils/dom');

// Centralized selectors for easy maintenance
const SELECTORS = {
  proceedButton: "button:has-text('Proceed')",
  termsCheckbox: ".el-checkbox__inner",
  proceedToCheckoutText: ".btn-container span",
  pendingBookingLabel: ".app-label",
  refundableText: "div.refundable"
};

class CartPage {
  constructor(page) {
    this.page = page;
  }

  // Handles the "Conflicting Quotes" modal that may appear during booking
  // Automatically clicks "Proceed" if the modal is visible, otherwise continues silently
  async handleConflictQuoteModalIfVisible() {
    console.log("Handle 'Conflicting Quotes' modal if it appears");
    const proceedButton = this.page.locator(SELECTORS.proceedButton).first();
    try {
      // Wait briefly for the modal; if not found, assume no modal
      await proceedButton.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      console.log("No 'Proceed' button found – assuming no Conflicting Quotes modal");
      return false;
    }
    console.log("'Proceed' button visible, clicking it...");
    await proceedButton.click();
    await this.page.waitForTimeout(1000); // Extra wait for stability
    console.log("Conflicting Quotes modal handled");
    return true;
  }

  // Accepts the terms and conditions by clicking the checkbox
  // Required step before proceeding to checkout
  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(SELECTORS.termsCheckbox).first();
    await checkbox.waitFor({ state: 'visible' });
    await checkbox.click();
  }

  // Waits for the "Proceed to Checkout" button to be ready
  // Validates text to ensure correct button state
  async waitForProceedToCheckout() {
    const text = await getText(this.page, SELECTORS.proceedToCheckoutText);
    if (text === "'Proceed to Checkout'") {
      await waitForText(this.page, SELECTORS.proceedToCheckoutText, "Proceed to Checkout");
    }
  }

  // Clicks the "Proceed to Checkout" button to advance to checkout page
  async clickProceedToCheckout() {
    await this.page.click(SELECTORS.proceedToCheckoutText);
  }

  // Waits for "Pending booking" text to appear, indicating booking is processing
  async waitForPendingBookingText() {
    console.log('Waiting for "Pending booking" text...');
    await waitForText(this.page, SELECTORS.pendingBookingLabel, "Pending booking");
    console.log('"Pending booking" text found');
  }

  // Waits for "Refundable" text in hotel cancellation terms
  // Confirms selected hotel booking has refundable policy
  async waitForHotelRefundableText() {
    console.log('Waiting for hotel refundable text...');
    const refundable = this.page.locator(SELECTORS.refundableText, { hasText: /Refundable/i }).first();
    await refundable.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Refundable hotel text found in cart');
  }
}

module.exports = CartPage;