const CheckoutPage = require('@pages/CheckoutPage');
const { CartPage } = require('@pages/CartPage');

/**
 * Checkout DSL
 *
 * High-level booking finalization flow.
 * Describes WHAT the user does, not HOW the UI works.
 */
const Checkout = {
  /**
   * Completes the booking and navigates to the Trip Overview.
   *
   * This flow:
   * - waits for checkout details
   * - finalizes the booking
   * - navigates to the trip overview page
   */
  async bookAndFinalize(page) {
    const checkoutPage = new CheckoutPage(page);
    const cartPage = new CartPage(page);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();

    // Finalize the booking (button text may vary)
    await checkoutPage.clickBookAndFinalizeButton();

    // Navigate to trip overview
    await checkoutPage.clickGoToTrip();

    // Confirm trip overview is displayed
    await cartPage.waitForTripOverviewTitle();

    return { finalized: true };
  }
};

module.exports = Checkout;