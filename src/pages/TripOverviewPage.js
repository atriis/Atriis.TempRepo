const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  TRIP_OVERVIEW_TITLE: ".payments-title",
  FLIGHT_DETAILS_BUTTON: ".more-details-btn",
  MORE_DETAILS_HOTEL_BUTTON: ".more-details",
  MORE_DETAILS_CAR_BUTTON: ".more-details.is-flex",
  TRIP_ACTIONS_DROPDOWN_ICON: ".dropdowns-container .expand-icon",
  CANCEL_TRIP_OPTION: ".el-dropdown-menu__item span.mr-2",
  TRIP_CANCELLATION_DIALOG_TITLE: "[aria-label='Trip cancellation'] .el-dialog__title",
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS_MESSAGE: "text='Cancellation confirmed!'",
  BOOKING_STATUS_LABEL: ".app-label--quote"
};

/**
 * TripOverviewPage
 *
 * Low-level UI interactions on the Trip Overview screen.
 * This class is intentionally quiet:
 * - no logging
 * - no business decisions
 * - only waits and actions
 */
class TripOverviewPage {
  constructor(page) {
    this.page = page;
  }

  /** Confirms Trip Overview page is loaded */
  async waitForTripOverviewTitle() {
    await waitForText(this.page, SELECTORS.TRIP_OVERVIEW_TITLE, "Trip overview");
  }

  /**
   * Waits for any "Details" entry to appear.
   * This works across flights, hotels, and cars.
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

  /** Opens the trip actions (three dots) dropdown */
  async hoverTripActionsDropdownIcon() {
    const icon = this.page
      .locator(SELECTORS.TRIP_ACTIONS_DROPDOWN_ICON)
      .first();

    await icon.waitFor({ state: 'visible', timeout: 5000 });
    await icon.hover();

    // Allow dropdown animation
    await this.page.waitForTimeout(500);
  }

  /** Waits until the dropdown menu with "Cancel trip" is visible */
  async waitForDropdownMenu() {
    await this.page
      .locator(SELECTORS.CANCEL_TRIP_OPTION, { hasText: 'Cancel trip' })
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Clicks the "Cancel trip" option */
  async clickCancelTripOption() {
    const cancelOption = this.page.locator(
      SELECTORS.CANCEL_TRIP_OPTION,
      { hasText: 'Cancel trip' }
    );

    await cancelOption.waitFor({ state: 'visible', timeout: 5000 });
    await cancelOption.click();
  }

  /** Waits for the cancellation confirmation dialog */
  async waitForTripCancellationDialogTitle() {
    await waitForText(
      this.page,
      SELECTORS.TRIP_CANCELLATION_DIALOG_TITLE,
      'Trip cancellation'
    );
  }

  /** Confirms trip cancellation in the dialog */
  async clickConfirmTripCancellationButton() {
    const button = this.page.getByRole('button', { name: 'Cancel trip' });
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
  }

  /** Waits for the cancellation success message */
  async waitForTripCancelledMessage() {
    const successMessage = this.page.getByText(
      'Cancellation confirmed!',
      { exact: true }
    );

    await successMessage.waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Returns true if booking status is "Finalizing".
   * Returns false if status is not found or different.
   */
  async waitForFinalizingText() {
    const locator = this.page.locator(SELECTORS.BOOKING_STATUS_LABEL);

    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      const text = (await locator.innerText()).trim();
      return text.toLowerCase().includes('finalizing');
    } catch {
      return false;
    }
  }

  /**
   * Returns true if booking status is "Confirmed".
   * Returns false if status is not found or different.
   */
  async waitForConfirmedText() {
    const locator = this.page.locator(SELECTORS.BOOKING_STATUS_LABEL);

    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      const text = (await locator.innerText()).trim();
      return text.toLowerCase().includes('confirmed');
    } catch {
      return false;
    }
  }
}

module.exports = TripOverviewPage;