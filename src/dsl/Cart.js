
const { CartPage, SELECTORS } = require('@pages/CartPage');
const { expect } = require('@playwright/test');
const { caseInsensitiveContains } = require('@utils/text');


/**
 * Cart DSL
 *
 * High-level business actions performed in the cart.
 * - Explains intent
 * - Logs behavior
 * - Returns business-level results
 */
const Cart = {
  /**
   * Accepts terms and proceeds to checkout.
   * Used by Flights, Hotels and Cars.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<{proceeded: boolean}>}
   */
  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    // Instantiate CartPage for UI actions
    const cartPage = new CartPage(page);

    // Accept terms, wait for button, proceed
    await cartPage.acceptTermsAndConditions();
    await cartPage.waitForProceedToCheckout();
    await cartPage.clickProceedToCheckout();

    return { proceeded: true };
  },

  /**
   * Confirms that a hotel booking is refundable.
   * @param {import('playwright').Page} page - Playwright page instance
   * @returns {Promise<boolean>}
   */
  async isHotelRefundable(page) {
    // Instantiate CartPage for UI actions
    const cartPage = new CartPage(page);

    // Wait for refundable text to appear
    await cartPage.waitForHotelRefundableText();
    return true;
  },

  /**
   * Waits for a specific booking status label in the cart.
   * Throws a detailed error if the expected status is not found in time.
   * @param {string} expectedStatus - Status text to wait for
   * @param {object} [options]
   * @param {number} [options.timeout=60000] - Timeout in ms
   * @param {import('playwright').Page} options.page - Playwright page instance
   * @returns {Promise<string>} - The status text found
   */
async expectBookingStatus(expectedStatus, { timeout = 60000, page } = {}) {
  const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL);

  await expect(locator).toBeVisible({ timeout });
  await expect(locator).toContainText(caseInsensitiveContains(expectedStatus), { timeout });
}
};

module.exports = Cart;