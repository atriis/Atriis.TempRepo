const CartPage = require('../pages/CartPage');

const Cart = {
  // Handles conflicting quotes modal that may appear during booking process
  // Automatically proceeds if modal is visible, otherwise continues silently
  async clickProceedConflictQuoteModal(page) {
    console.log('Handling conflict quote modal...');
    const cartPage = new CartPage(page);
    const proceeded = await cartPage.handleConflictQuoteModalIfVisible();
    console.log(`Conflict quote modal handled. Proceeded: ${proceeded}`);
    return { proceeded };
  },

  // Completes the cart checkout process by accepting terms and proceeding
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    console.log('Accepting terms and proceeding to checkout...');
    const cartPage = new CartPage(page);

    await cartPage.acceptTermsAndConditions();
    await cartPage.clickProceedToCheckout();

    console.log('Successfully proceeded to checkout');
    return { proceeded: true };
  },

  // Verifies that a hotel booking has refundable cancellation policy
  // Waits for the refundable text to appear in the cart to confirm booking flexibility
  async isHotelRefundable(page) {
    console.log('Checking if hotel booking is refundable...');
    const cartPage = new CartPage(page);

    await cartPage.waitForHotelRefundableText();
    console.log('Hotel booking confirmed as refundable');
    return true;
  },

  // Checks if a quote is 'Pending booking' in the cart
  async isQuotePendingBooking(page) {
    console.log('Checking if quote is pending booking...');
    const cartPage = new CartPage(page);
    await cartPage.waitForPendingBookingText();

    console.log('Quote confirmed as pending booking');
    return true;
  }
};

module.exports = Cart;
