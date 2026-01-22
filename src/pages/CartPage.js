const { waitForText } = require('@utils/wait');
const { getText } = require('@utils/dom');
const tripStatus = require('@data/tripStatus.json');
const { expect } = require('@playwright/test');
const { caseInsensitiveContains } = require('@utils/text');

/**
 * CartPage
 *
 * Handles low-level UI interactions inside the cart page.
 * Follows project guidelines:
 * - No business logic or assertions
 * - No logging
 * - Only exposes technical UI actions
 */
const SELECTORS = {
  // Cart selectors
  TERMS_CHECKBOX: ".el-checkbox__inner",
  PROCEED_TO_CHECKOUT_TEXT: ".btn-container span",
  REFUNDABLE_TEXT: "div.refundable",
  // Trip Overview selectors
  TRIP_OVERVIEW_TITLE: ".payments-title",
  FLIGHT_DETAILS_BUTTON: ".more-details-btn",
  MORE_DETAILS_HOTEL_BUTTON: ".more-details",
  MORE_DETAILS_CAR_BUTTON: ".more-details.is-flex",
  TRIP_ACTIONS_DROPDOWN_ICON: ".dropdowns-container .expand-icon",
  CANCEL_TRIP_OPTION: ".el-dropdown-menu__item span.mr-2",
  TRIP_CANCELLATION_DIALOG_TITLE: "[aria-label='Trip cancellation'] .el-dialog__title",
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS_MESSAGE: "text='Cancellation confirmed!'",
  QUOTE_STATUS_LABEL: ".app-label--quote"
};


class CartPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }


  /**
   * Accepts Terms & Conditions checkbox (required before checkout).
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
    // Only wait if the button text matches exactly
    if (text === "'Proceed to Checkout'") {
      await waitForText(
        this.page,
        SELECTORS.PROCEED_TO_CHECKOUT_TEXT,
        'Proceed to Checkout'
      );
    }
  }


  /**
   * Clicks the Proceed to Checkout button.
   */
  async clickProceedToCheckout() {
    await this.page.click(SELECTORS.PROCEED_TO_CHECKOUT_TEXT);
  }


  /**
   * Waits for the "Refundable" label to appear for hotel bookings.
   */
  async waitForHotelRefundableText() {
    const refundable = this.page
      .locator(SELECTORS.REFUNDABLE_TEXT, { hasText: /Refundable/i })
      .first();
    await refundable.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Waits for Trip Overview page title to be visible.
   */
  async waitForTripOverviewTitle() {
    await waitForText(this.page, SELECTORS.TRIP_OVERVIEW_TITLE, "Trip overview");
  }

  /**
   * Waits for any "Details" entry to appear (flights, hotels, or cars).
   * Throws if none found.
   */
  async waitForDetailsText() {
    const candidateLocators = [
      SELECTORS.FLIGHT_DETAILS_BUTTON,
      SELECTORS.MORE_DETAILS_HOTEL_BUTTON,
      SELECTORS.MORE_DETAILS_CAR_BUTTON
    ];
    for (const selector of candidateLocators) {
      try {
        await this.page
          .locator(selector, { hasText: /details/i })
          .waitFor({ timeout: 1500 });
        return;
      } catch {
        // Try next locator
      }
    }
    throw new Error(
      'Unable to find any element containing "details" (case-insensitive).'
    );
  }

  /**
   * Hovers the trip actions (three dots) dropdown icon.
   * Waits for dropdown animation.
   */
  async hoverTripActionsDropdownIcon() {
    const icon = this.page
      .locator(SELECTORS.TRIP_ACTIONS_DROPDOWN_ICON)
      .first();
    await icon.waitFor({ state: 'visible', timeout: 5000 });
    await icon.hover();
    // Allow dropdown animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Waits until the dropdown menu with "Cancel trip" is visible.
   */
  async waitForDropdownMenu() {
    await this.page
      .locator(SELECTORS.CANCEL_TRIP_OPTION, { hasText: 'Cancel trip' })
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Clicks the "Cancel trip" option in the dropdown.
   */
  async clickCancelTripOption() {
    const cancelOption = this.page.locator(
      SELECTORS.CANCEL_TRIP_OPTION,
      { hasText: 'Cancel trip' }
    );
    await cancelOption.waitFor({ state: 'visible', timeout: 5000 });
    await cancelOption.click();
  }

  /**
   * Waits for the cancellation confirmation dialog title.
   */
  async waitForTripCancellationDialogTitle() {
    await waitForText(
      this.page,
      SELECTORS.TRIP_CANCELLATION_DIALOG_TITLE,
      'Trip cancellation'
    );
  }

  /**
   * Clicks the confirm trip cancellation button in the dialog.
   */
  async clickConfirmTripCancellationButton() {
    const button = this.page.getByRole('button', { name: 'Cancel trip' });
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
  }

  /**
   * Waits for the cancellation success message to be visible.
   * Fails if not found within timeout.
   */
  async waitForTripCancelledMessage({ timeout = 20000 } = {}) {
    const successMessage = this.page.getByText(
      'Cancellation confirmed!',
      { exact: true }
    );
    await successMessage.waitFor({ state: 'visible', timeout });
    // This method only waits, does not return value
  }

  /**
   * Checks whether the cancellation success message is visible.
   * Never throws. Returns boolean.
   */
  async isTripCancelledMessageVisible({ timeout = 20000 } = {}) {
    try {
      const successMessage = this.page.getByText(
        'Cancellation confirmed!',
        { exact: true }
      );
      await successMessage.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the booking status label to match expected status.
   * Returns the label text.
   */
  async waitForBookingStatus(expectedStatus, { timeout = 30000, page = this.page } = {}) {
    const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL);
    await expect(locator).toBeVisible({ timeout });
    await expect(locator).toContainText(caseInsensitiveContains(expectedStatus), { timeout });
    return (await locator.innerText()).trim();
  }

  /**
   * Waits until booking status becomes "Pending booking" (quote is being processed).
   */
  async waitForPendingBookingText({ timeout = 30000, page = this.page } = {}) {
    return this.waitForBookingStatus(
      tripStatus.label.pendingBooking.status,
      { timeout, page }
    );
  }
}

// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS
};