const { CartPage, SELECTORS } = require('@pages/CartPage');
const { expect } = require('@playwright/test');
const { caseInsensitiveContains } = require('@utils/text');

/**
 * Cart DSL
 *
 * Exposes business-level actions for cart flows.
 * - Explains intent
 * - Logs behavior
 * - Returns business-level results
 */
const Cart = {
  /**
   * STRICT cancel flow (fails if cancellation fails)
   *
   * This flow:
   * - Confirms Trip Overview page is loaded
   * - Opens actions menu
   * - Confirms cancellation
   * - Waits for success message
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean}>}
   */
  async cancelTripStrict(page) {
    const cartPage = new CartPage(page);

    // Confirm correct page state
    await cartPage.waitForDetailsText();
    await cartPage.waitForTripOverviewTitle();
    // Open actions menu and cancel
    await cartPage.hoverTripActionsDropdownIcon();
    await cartPage.waitForDropdownMenu();
    await cartPage.clickCancelTripOption();

    // Confirm cancellation
    await cartPage.waitForTripCancellationDialogTitle();
    await cartPage.clickConfirmTripCancellationButton();

    // Will FAIL if message is not shown
    await cartPage.waitForTripCancelledMessage();

    // Allow backend and UI to settle
    await page.waitForLoadState('networkidle');

    return { cancelled: true };
  },

  /**
   * SAFE cancel flow (never throws, returns status)
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{cancelled: boolean, error?: string}>}
   */
  async cancelTripSafely(page) {
    const cartPage = new CartPage(page);
    try {
      await cartPage.waitForDetailsText();
      await cartPage.waitForTripOverviewTitle();
      await cartPage.hoverTripActionsDropdownIcon();
      await cartPage.waitForDropdownMenu();
      await cartPage.clickCancelTripOption();
      await cartPage.waitForTripCancellationDialogTitle();
      await cartPage.clickConfirmTripCancellationButton();
      const wasCancelled = await cartPage.isTripCancelledMessageVisible();
      await page.waitForLoadState('networkidle');
      return { cancelled: wasCancelled };
    } catch (error) {
      return {
        cancelled: false,
        error: error?.message
      };
    }
  },

  /**
   * Accepts terms and proceeds to checkout.
   * Used by Flights, Hotels, and Cars.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{proceeded: boolean}>}
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
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>}
   */
  async isHotelRefundable(page) {
    const cartPage = new CartPage(page);
    await cartPage.waitForHotelRefundableText();
    return true;
  },

  /**
   * Waits for a specific booking status label in the cart.
   * Throws a detailed error if the expected status is not found in time.
   *
   * @param {string} expectedStatus - Status text to wait for
   * @param {object} [options]
   * @param {number} [options.timeout=60000] - Timeout in ms
   * @param {import('playwright').Page} options.page - Playwright page instance
   * @returns {Promise<void>}
   */
  async expectBookingStatus(expectedStatus, { timeout = 60000, page } = {}) {
    const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL);
    await expect(locator).toBeVisible({ timeout });
    await expect(locator).toContainText(caseInsensitiveContains(expectedStatus), { timeout });
  }
};


// Export Cart DSL for use in tests
module.exports = Cart;