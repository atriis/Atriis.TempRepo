const CartPage = require('../pages/CartPage');

const Cart = {
  // Handles conflicting quotes modal that may appear during booking process
  // Automatically proceeds if modal is visible, otherwise continues silently
  async clickProceedConflictQuoteModal(page) {
    const cartPage = new CartPage(page);
    const proceeded = await cartPage.handleConflictQuoteModalIfVisible();
    return { proceeded };
  },

  // Completes the cart checkout process by accepting terms and proceeding
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    const cartPage = new CartPage(page);

    await cartPage.acceptTermsAndConditions();
    await cartPage.clickProceedToCheckout();

    return { proceeded: true };
  },

  // Verifies that a hotel booking has refundable cancellation policy
  // Waits for the refundable text to appear in the cart to confirm booking flexibility
  async isHotelRefundable(page) {
    const cartPage = new CartPage(page);

    await cartPage.waitForHotelRefundableText();
    return true;
  },

  // Checks if a quote is 'Pending booking' in the cart
  async isQuotePendingBooking(page) {
    const cartPage = new CartPage(page);
    await cartPage.waitForPendingBookingText();

    return true;
  }
};

module.exports = Cart;
