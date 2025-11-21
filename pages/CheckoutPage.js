const { waitForText } = require('../utils/wait');

class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Booking details" heading to appear on the checkout page
  // Confirms that the page has loaded and booking details are being displayed
  async waitForBookingDetailsText() {
    console.log('Waiting for Booking Details page...');
    await waitForText(this.page, 'h1.mb-5', 'Booking details');
    console.log('Booking Details text verified');
  }

  // Waits for either "Finalize" or "Book and Finalize" button to become available
  // Handles different button text variations that may appear based on booking type
  async waitForBookAndFinalizeButton() {
    console.log('Waiting for booking/finalize button...');
    // Wait for either "Finalize" or "Book and Finalize" button
    await this.page.waitForSelector(
      'button:has-text("Finalize"), button:has-text("Book and Finalize")',
      { timeout: 10000 }
    );
    console.log('Booking/finalize button found');
  }

  // Clicks the booking finalization button ("Book and Finalize" or "Finalize")
  // Intelligently detects which button variant is available and clicks it
  // Includes fallback logic for edge cases
  async clickBookAndFinalizeButton() {
    console.log('Clicking booking/finalize button');
    // Click whichever button is available
    const finalizeBtn = this.page.locator('button:has-text("Finalize")').first();
    const bookFinalizeBtn = this.page.locator('button:has-text("Book and Finalize")').first();

    if (await finalizeBtn.isVisible()) {
      console.log('Clicking "Finalize" button');
      await finalizeBtn.click();
    } else if (await bookFinalizeBtn.isVisible()) {
      console.log('Clicking "Book and Finalize" button');
      await bookFinalizeBtn.click();
    } else {
      // Fallback to any button in the container
      console.log('Clicking fallback button in container');
      await this.page.click('.btn-container button');
    }
  }

  // Navigates to the trip overview page after successful booking completion
  // Waits for and clicks the "Go to trip" button to view the finalized booking
  async clickGoToTrip() {
    console.log('Waiting for "Go to trip" button...');
    await waitForText(this.page, '.btn-container > :nth-child(1)', 'Go to trip');
    console.log('Clicking "Go to trip"');
    await this.page.click('.btn-container > :nth-child(1)');
    console.log('Navigated to Trip page');
  }
}

module.exports = CheckoutPage;
