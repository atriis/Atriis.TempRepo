const CartPage = require('../pages/CartPage');

/**
 * Cart DSL
 *
 * High-level business actions performed in the cart.
 * This is the only place that:
 * - explains intent
 * - logs behavior
 * - returns business-level results
 */
const Cart = {
  /**
   * Handles the "Conflicting Quotes" modal if it appears.
   * Safe to call even if no modal is shown.
   */
  async clickProceedConflictQuoteModal(page) {
    const cartPage = new CartPage(page);

    const proceeded = await cartPage.handleConflictQuoteModalIfVisible();
    return { proceeded };
  },

  /**
   * Accepts terms and proceeds to checkout.
   * Used by Flights, Hotels and Cars.
   */
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    const cartPage = new CartPage(page);

    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();

    return { proceeded: true };
  },

  /**
   * Confirms that a hotel booking is refundable.
   */
  async isHotelRefundable(page) {
    const cartPage = new CartPage(page);

    await cartPage.waitForHotelRefundableText();
    return true;
  },

  /**
   * Confirms that a quote is in "Pending booking" state.
   */
  async isQuotePendingBooking(page) {
    const cartPage = new CartPage(page);

    await cartPage.waitForPendingBookingText();
    return true;
  }
};

module.exports = Cart;