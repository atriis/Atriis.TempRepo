const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  BOOKING_DETAILS_HEADING: 'h1.mb-5',
  FINALIZE_BUTTON: "button:has-text('Finalize')",
  BOOK_AND_FINALIZE_BUTTON: "button:has-text('Book and Finalize')",
  FALLBACK_BUTTON: '.btn-container button',
  GO_TO_TRIP_BUTTON: '.btn-container > :nth-child(1)'
};

class CheckoutPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Booking details" heading to appear on the checkout page
  // Confirms that the page has loaded and booking details are being displayed
  async waitForBookingDetailsText() {
    console.log('Waiting for Booking Details page...');
    await waitForText(this.page, SELECTORS.BOOKING_DETAILS_HEADING, 'Booking details');
    console.log('Booking Details text verified');
  }

  // Waits for either "Finalize" or "Book and Finalize" button to become available
  // Handles different button text variations that may appear based on booking type
  async waitForBookAndFinalizeButton() {
    console.log('Waiting for booking/finalize button...');
    await this.page.waitForSelector(
      `${SELECTORS.FINALIZE_BUTTON}, ${SELECTORS.BOOK_AND_FINALIZE_BUTTON}`,
      { timeout: 10000 }
    );
    console.log('Booking/finalize button found');
  }

  // Clicks the booking finalization button ("Book and Finalize" or "Finalize")
  // Intelligently detects which button variant is available and clicks it
  // Includes fallback logic for edge cases
  async clickBookAndFinalizeButton() {
    console.log('Clicking booking/finalize button');
    const finalizeBtn = this.page.locator(SELECTORS.FINALIZE_BUTTON).first();
    const bookFinalizeBtn = this.page.locator(SELECTORS.BOOK_AND_FINALIZE_BUTTON).first();

    if (await finalizeBtn.isVisible()) {
      console.log('Clicking "Finalize" button');
      await finalizeBtn.click();
    } else if (await bookFinalizeBtn.isVisible()) {
      console.log('Clicking "Book and Finalize" button');
      await bookFinalizeBtn.click();
    } else {
      console.log('Clicking fallback button in container');
      await this.page.click(SELECTORS.FALLBACK_BUTTON);
    }
  }

  // Navigates to the trip overview page after successful booking completion
  // Waits for and clicks the "Go to trip" button to view the finalized booking
  async clickGoToTrip() {
    console.log('Waiting for "Go to trip" button...');
    await waitForText(this.page, SELECTORS.GO_TO_TRIP_BUTTON, 'Go to trip');
    console.log('Clicking "Go to trip"');
    await this.page.click(SELECTORS.GO_TO_TRIP_BUTTON);
    console.log('Navigated to Trip page');
  }
}

module.exports = CheckoutPage;