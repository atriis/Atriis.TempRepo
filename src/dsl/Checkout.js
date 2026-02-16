const { CheckoutPage } = require("@pages/CheckoutPage");
const { CartPage } = require("@pages/CartPage");
const { CommonPage } = require("@src/pages/CommonPage");

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
    if (!page) {
      throw new Error('page is required');
    }
    
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
  },

  /**
   * Navigates to cart from the checkout page.
   *
   * This flow:
   * - waits for checkout details
   * - clicks the trip cart icon
   * - confirms cart page is displayed
   */
  async navigateToCartFromCheckout(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const checkoutPage = new CheckoutPage(page);
    const commonPage = new CommonPage(page);
    const cartPage = new CartPage(page);

    // Ensure checkout page is fully loaded
    await checkoutPage.waitForBookingDetailsText();

    // Intentional wait required for UI stability before interacting, so test is not flaky
    await page.waitForTimeout(4000);

    // Wait for a valid finalize button variant
    await checkoutPage.waitForBookAndFinalizeButton();
    await commonPage.clickTripCart();

    // Confirm trip overview is displayed
    await cartPage.waitForTripOverviewTitle();
    return { navigatedToCart: true };
  },
};

module.exports = Checkout;
