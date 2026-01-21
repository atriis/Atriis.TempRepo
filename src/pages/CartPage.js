const { waitForText } = require('@utils/wait');
const { getText } = require('@utils/dom');

/**
 * CartPage
 *
 * Low-level UI interactions inside the cart.
 * This class is intentionally quiet:
 * - no business decisions
 * - no logging
 * - no assertions
 */
const SELECTORS = {
  TERMS_CHECKBOX: ".el-checkbox__inner",
  PROCEED_TO_CHECKOUT_TEXT: ".btn-container span",
  PENDING_BOOKING_LABEL: ".app-label",
  REFUNDABLE_TEXT: "div.refundable"
};

class CartPage {
  constructor(page) {
    this.page = page;
  }
  
  /**
   * Accepts Terms & Conditions.
   * Required before checkout is enabled.
   */
  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(SELECTORS.TERMS_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible' });
    await checkbox.click();
  }

  /**
   * Waits until "Proceed to Checkout" is ready.
   * Uses text validation to avoid clicking wrong buttons.
   */
  async waitForProceedToCheckout() {
    const text = await getText(this.page, SELECTORS.PROCEED_TO_CHECKOUT_TEXT);

    if (text === "'Proceed to Checkout'") {
      await waitForText(
        this.page,
        SELECTORS.PROCEED_TO_CHECKOUT_TEXT,
        'Proceed to Checkout'
      );
    }
  }

  /** Clicks the Proceed to Checkout button */
  async clickProceedToCheckout() {
    await this.page.click(SELECTORS.PROCEED_TO_CHECKOUT_TEXT);
  }

  /**
   * Waits for "Pending booking" label.
   * Indicates the quote is being processed.
   */
  async waitForPendingBookingText() {
    await waitForText(
      this.page,
      SELECTORS.PENDING_BOOKING_LABEL,
      'Pending booking'
    );
  }

  /**
   * Confirms hotel booking is refundable.
   */
  async waitForHotelRefundableText() {
    const refundable = this.page
      .locator(SELECTORS.REFUNDABLE_TEXT, { hasText: /Refundable/i })
      .first();

    await refundable.waitFor({ state: 'visible', timeout: 10000 });
  }
}

module.exports = CartPage;