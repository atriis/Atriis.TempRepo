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
  QUOTE_STATUS_LABEL: ".app-label--quote",
  HOLD_BUTTON: ".btn--default.mt-2",
  // OOP Justification selectors
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
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
    const label = this.page.locator(SELECTORS.REFUNDABLE_TEXT).first();

    // Must contain "Refundable"
    await expect(label).toContainText(/Refundable/i, { timeout: 10000 });

    // Must NOT contain any form of "Non Refundable"
    await expect(label).not.toContainText(/Non\s*Refundable/i);
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
    // Intentional wait required for UI stability before interacting, so test is not flaky
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
  async waitForTripCancelledMessage({ timeout = 60000 } = {}) {
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
  async isTripCancelledMessageVisible({ timeout = 60000 } = {}) {
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

/**
 * Hovers over the Share button and waits for the visible share dropdown menu.
 */
async hoverShareButton() {
  const shareButton = this.page
    .locator('.share-container')
    .getByRole('button', { name: 'share' });

  await shareButton.waitFor({ state: 'visible', timeout: 30_000 });
  await shareButton.hover();

  // Wait for the menu instance that is actually visible
  const visibleMenu = this.page.locator('ul.share-popper[role="menu"]:visible');
  await visibleMenu.waitFor({ state: 'visible', timeout: 30_000 });
}

/**
 * Clicks "Share Quotes" from the currently visible share menu.
 */
async clickShareQuotes() {
  const menu = this.page.locator('ul.share-popper[role="menu"]:visible');
  await menu.waitFor({ state: 'visible', timeout: 30_000 });

  const item = menu.locator('li[role="menuitem"]', { hasText: 'Share Quotes' });
  await item.waitFor({ state: 'visible', timeout: 30_000 });
  await item.click();
}


/**
 * Clicks "Share Itinerary" from the second share menu.
 */
async clickShareItinerary() {
  const menu = this.page.locator('ul.share-popper[role="menu"]:visible');
  await menu.waitFor({ state: 'visible', timeout: 30_000 });

  const item = menu.locator('li[role="menuitem"]', { hasText: 'Share Itinerary' });
  await item.waitFor({ state: 'visible', timeout: 30_000 });
  await item.click();
}

  //This can be used when sharing quotes or itinerary from Results page as well
  /**
   * Waits until the "Subject" label is visible.
   */
  async waitForSubjectLabelSharePopUp() {
    const subjectLabel = this.page.getByText('Subject', { exact: true });

    await subjectLabel.waitFor({ state: 'visible', timeout: 30000 });
  }

  //This can be used when sharing quotes or itinerary from Results page as well
  /**
   * Clicks the "Send" button.
   */
  async clickSendEmailButton() {
    const sendButton = this.page.getByRole('button', { name: 'Send' });

    await sendButton.waitFor({ state: 'visible' });
    await sendButton.click();
  }

  // ===== OOP JUSTIFICATION =====

  /**
   * Gets the OOP justification textbox locator.
   *
   * @returns {Locator} Playwright locator for the justification textbox.
   */
  getOOPJustificationTextbox() {
    return this.page.locator(SELECTORS.OOP_JUSTIFICATION_TEXTBOX);
  }

  /**
   * Gets the Save Justification button locator.
   *
   * @returns {Locator} Playwright locator for the Save button.
   */
  getSaveJustificationButton() {
    return this.page.getByRole('button', { name: 'Save justification' });
  }

  /**
   * Gets the justification dropdown (combobox) locator.
   *
   * @returns {Locator} Playwright locator for the justification dropdown.
   */
  getJustificationDropdown() {
    return this.page.getByRole('combobox', {
      name: 'Select your justification'
    });
  }

  /**
   * Gets a justification dropdown option by name.
   *
   * @param {string} optionName - The visible text of the option.
   * @returns {Locator} Playwright locator for the dropdown option.
   */
  getJustificationOption(optionName) {
    return this.page.getByRole('option', { name: optionName });
  }

  /**
   * Fills in the OOP justification textbox.
   *
   * @param {string} justificationText - The text to enter in the justification field.
   */
  async fillInOOPJustificationText(justificationText) {
    const textbox = this.getOOPJustificationTextbox();
    await textbox.waitFor({ state: 'visible', timeout: 10000 });
    await textbox.fill(justificationText);
  }

  /**
   * Clicks the Save Justification button.
   */
  async saveOOPJustificationText() {
    const saveButton = this.getSaveJustificationButton();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
  }

  /**
   * Clicks the justification dropdown to open the list of options.
   */
  async openJustificationDropdown() {
    await this.getJustificationDropdown().click();
  }

  /**
   * Waits for a justification dropdown option to appear.
   */
  async waitForJustificationDropdownOption(justificationOption) {
    await this.getJustificationOption(justificationOption).waitFor({ state: 'visible' });
  }

  /**
   * Selects a justification dropdown option by its visible name.
   *
   * @param {string} justificationOption - The name of the justification option to select.
   */
  async selectJustificationDropdownOption(justificationOption) {
    await this.getJustificationOption(justificationOption).click();
  }

  /**
   * Handles the "Price Change" modal if it appears.
   *
   * Modal appears when flight prices change after adding to cart.
   * Returns:
   * - true  → modal was shown and handled
   * - false → modal did not appear (no price change)
   *
   * @returns {Promise<boolean>} Whether the modal was handled
   */
/**
   * Returns the "Proceed with change" button locator.
   * @returns {Locator}
   */
  getProceedWithChangeButton() {
    return this.page.getByRole('button', {
      name: 'Proceed with change',
      exact: true,
    });
  }

  /**
   * Clicks the "Proceed with change" button if it is visible.
   * Uses waitFor to actually wait for the button to appear.
   *
   * @param {number} [timeout=45000] - How long to wait for the modal
   * @returns {Promise<boolean>} true if clicked, false if not found
   */
  async clickProceedWithChangeIfVisible(timeout = 45000) {
    const btn = this.getProceedWithChangeButton();

    try {
      // waitFor actually waits — unlike isVisible which checks instantly
      await btn.waitFor({ state: 'visible', timeout });
    } catch {
      // Modal did not appear within timeout
      return false;
    }

    await btn.click();
    return true;
  }
}

// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS
};