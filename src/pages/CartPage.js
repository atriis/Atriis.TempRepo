const { waitForText } = require("@utils/wait");
const { getText } = require("@utils/dom");

/**
 * Page Object for cart page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {

  // Cart general selectors
  TERMS_CHECKBOX: ".el-checkbox__inner",
  PROCEED_TO_CHECKOUT_TEXT: ".btn-container span",
  QUOTE_STATUS_LABEL: ".app-label--quote",
  HOLD_BUTTON: ".btn--default.mt-2",

  // Refundable hotel text
  REFUNDABLE_TEXT: "div.refundable",
  CANCELLATION_POLICY_LABEL: "div.refundable, div.non-refundable",

  // Price breakdown button
  PRICE_BREAKDOWN_BUTTON: ".price-breakdown-btn",
  PRICE_BREAKDOWN_CLOSE_BUTTON: '.app-drawer.flight-price-breakdown-drawer [aria-label="Close this dialog"]',

  // Trip cancellation selectors
  TRIP_ACTIONS_DROPDOWN_ICON: ".dropdowns-container .expand-icon",
  CANCEL_TRIP_OPTION: ".el-dropdown-menu__item span.mr-2",
  TRIP_CANCELLATION_DIALOG_TITLE: "[aria-label='Trip cancellation'] .el-dialog__title",
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS_MESSAGE: "text='Cancellation confirmed!'",

  // Product details selectors
  FLIGHT_DETAILS_BUTTON: ".more-details-btn",
  MORE_DETAILS_HOTEL_BUTTON: ".more-details",
  MORE_DETAILS_CAR_BUTTON: ".more-details.is-flex",

  // Trip Overview selectors
  TRIP_OVERVIEW_TITLE: ".payments-title",

  // OOP Justification selectors
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
  
  // Extras
  EDIT_EXTRAS_BUTTON: ".extra__btns", //All edit buttons in extras section have the same class, so we will use nth(index) to click the right one when needed
  EXTRAS_INFORMATION_FIELD: '.el-select__selected-item span', // The field that shows selected extra option
  EXTRAS_ARROW_BUTTON: '.px-4.ticket-bottom.py-4 .el-icon.el-collapse-item__arrow', // Arrow button to expand/collapse extras information
  NUMBER_OF_BAGGAGE_DROPDOWN_FIELD: "//span[normalize-space()='Number of baggage']", // XPath used due to complex dropdown structure - TODO: adjust when we have a data-test-id selector.
  DROPDOWN_OPTION: 'li.el-select-dropdown__item', // Dropdown option selector (used with hasText filter for partial matching)
  GREEN_ICON_BAGGAGE: ".flight-baggage .material-symbols-outlined.filled.success-icon.green",  // Green icon next to added baggage
};

class CartPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the refundable label text for hotel bookings.
   * Returns the text content after waiting for visibility.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<string>} The label text content
   */
  async getHotelRefundableText({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.REFUNDABLE_TEXT).first();
    await label.waitFor({ state: 'visible', timeout });
    return (await label.textContent()).trim();
  }

  /**
   * Gets the cancellation policy label text from the cart hotel item.
   * Returns text from whichever policy label (refundable or non-refundable) is visible.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<string>} The cancellation policy text
   */
  async getCancellationPolicyFromCart({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CANCELLATION_POLICY_LABEL).first();
    await label.waitFor({ state: 'visible', timeout });
    return (await label.textContent()).trim();
  }

  /**
   * Gets the current booking status text.
   * Waits for the status label to be visible before returning.
   * @param {object} options - Configuration options
   * @param {number} options.timeout - Maximum wait time (default: 30000ms)
   * @param {Page} options.page - Page object to use (default: this.page)
   * @returns {Promise<string>} The booking status text
   */
  async getBookingStatus({ timeout = 30000, page = this.page } = {}) {
    const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL);
    await locator.waitFor({ state: 'visible', timeout });
    return (await locator.innerText()).trim();
  }

  /**
   * Gets the extras information field locator at the specified index.
   * Used to read the selected extra option (e.g., baggage, seat selection).
   *
   * @param {number} [index=1] - The index of the information field (default: 1)
   * @returns {Locator} Playwright locator for the information field
   */
  getInformationField(index = 1) {
    return this.page.locator(SELECTORS.EXTRAS_INFORMATION_FIELD).nth(index);
  }

  /**
   * Gets passport details text from visible input or text field.
   * Looks for input fields with value attribute containing passport pattern.
   *
   * @param {number} [index=0] - The index of the passport field to read
   * @returns {Promise<string>} The passport details text
   */
  async getPassportDetailsText(index = 0) {
    // Wait for the page to stabilize after clicking edit extras
    await this.page.waitForTimeout(2000);
    
    // Try to find passport in input field value attribute
    const inputLocator = this.page.locator('input[value*="-"]').nth(index);
    
    try {
      await inputLocator.waitFor({ state: "visible", timeout: 5000 });
      return await inputLocator.inputValue();
    } catch {
      // If not found in input, try looking in any element containing the text
      const textLocator = this.page.getByText(/[A-Z]{2}-\*+\d+/).nth(index);
      await textLocator.waitFor({ state: "visible", timeout: 5000 });
      return await textLocator.innerText();
    }
  }

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
    return this.page.getByRole("button", { name: "Save justification" });
  }

  /**
   * Gets the justification dropdown (combobox) locator.
   *
   * @returns {Locator} Playwright locator for the justification dropdown.
   */
  getJustificationDropdown() {
    return this.page.getByRole("combobox", {
      name: "Select your justification",
    });
  }

  /**
   * Gets a justification dropdown option by name.
   *
   * @param {string} optionName - The visible text of the option.
   * @returns {Locator} Playwright locator for the dropdown option.
   */
  getJustificationOption(optionName) {
    return this.page.getByRole("option", { name: optionName });
  }

  /**
   * Gets the visible share menu locator.
   *
   * @returns {Locator} Playwright locator for the visible share dropdown menu.
   */
  getVisibleShareMenu() {
    return this.page.locator("ul.share-popper[role=\"menu\"]:visible");
  }

  /**
   * Returns the "Proceed with change" button locator.
   * Used for handling price change modals that appear when flight prices change after adding to cart.
   *
   * @returns {Locator}
   */
  getProceedWithChangeButton() {
    return this.page.getByRole("button", {
      name: "Proceed with change",
      exact: true,
    });
  }

    /**
   * Gets the "Requested" flight title locator.
   * Used to confirm a travel request has been submitted.
   *
   * @returns {Locator} Playwright locator for the requested flight heading.
   */
  getRequestedFlightTitle() {
    return this.page.locator("h5.center-title", {
      hasText: "Requested",
    });
  }

  /**
   * Gets the Save button locator in extras section.
   * @returns {Locator} Playwright locator for the Save button
   */
  getSaveButton() {
    return this.page.getByRole('button', { name: 'Save' });
  }

  /**
   * Gets the Number of baggage dropdown trigger locator.
   * @returns {Locator} Playwright locator for the baggage dropdown trigger
   */
  getNumberOfBaggage() {
    return this.page.getByText('Number of baggage', { exact: true });
  }

  /**
   * Gets the baggage green icon locator.
   * Used to verify baggage was successfully added in extras.
   *
   * @returns {Locator} Playwright locator for the baggage success icon
   */
  getBaggageGreenIcon() {
    return this.page.locator(SELECTORS.GREEN_ICON_BAGGAGE);
  }

  /**
   * Accepts Terms & Conditions checkbox (required before checkout).
   */
  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(SELECTORS.TERMS_CHECKBOX).nth(0);
    await checkbox.waitFor({ state: "visible" });
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
        "Proceed to Checkout",
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
      SELECTORS.MORE_DETAILS_CAR_BUTTON,
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
      "Unable to find any element containing \"details\" (case-insensitive).",
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
    await icon.waitFor({ state: "visible", timeout: 5000 });
    await icon.hover();
    // Intentional wait required for UI stability before interacting, so test is not flaky
    await this.page.waitForTimeout(500);
  }

  /**
   * Waits until the dropdown menu with "Cancel trip" is visible.
   */
  async waitForDropdownMenu() {
    await this.page
      .locator(SELECTORS.CANCEL_TRIP_OPTION, { hasText: "Cancel trip" })
      .waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Clicks the "Cancel trip" option in the dropdown.
   */
  async clickCancelTripOption() {
    const cancelOption = this.page.locator(
      SELECTORS.CANCEL_TRIP_OPTION,
      { hasText: "Cancel trip" },
    );
    await cancelOption.waitFor({ state: "visible", timeout: 5000 });
    await cancelOption.click();
  }

  /**
   * Waits for the cancellation confirmation dialog title.
   */
  async waitForTripCancellationDialogTitle() {
    await waitForText(
      this.page,
      SELECTORS.TRIP_CANCELLATION_DIALOG_TITLE,
      "Trip cancellation",
    );
  }

  /**
   * Clicks the confirm trip cancellation button in the dialog.
   */
  async clickConfirmTripCancellationButton() {
    const button = this.page.getByRole("button", { name: "Cancel trip" });
    await button.waitFor({ state: "visible", timeout: 5000 });
    await button.click();
  }

  /**
   * Waits for the cancellation success message to be visible.
   * Fails if not found within timeout.
   */
  async waitForTripCancelledMessage({ timeout = 60000 } = {}) {
    const successMessage = this.page.getByText(
      "Cancellation confirmed!",
      { exact: true },
    );
    await successMessage.waitFor({ state: "visible", timeout });
    // This method only waits, does not return value
  }

  /**
   * Checks whether the cancellation success message is visible.
   * Never throws. Returns boolean.
   */
  async isTripCancelledMessageVisible({ timeout = 60000 } = {}) {
    try {
      const successMessage = this.page.getByText(
        "Cancellation confirmed!",
        { exact: true },
      );
      await successMessage.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets booking status, waiting for visibility.
   * Use this when checking for "Pending booking" or other statuses.
   * Assertion should be done at DSL/test layer.
   * @param {object} options - Configuration options
   * @param {number} options.timeout - Maximum wait time (default: 30000ms)
   * @param {Page} options.page - Page object to use (default: this.page)
   * @returns {Promise<string>} The booking status text
   */
  async waitForPendingBookingText({ timeout = 30000, page = this.page } = {}) {
    return this.getBookingStatus({ timeout, page });
  }

  /**
   * Hovers over the Share button and waits for the visible share dropdown menu.
   */
  async hoverShareButton() {
    const shareButton = this.page
      .locator(".share-container")
      .getByRole("button", { name: "share" });

    await shareButton.waitFor({ state: "visible", timeout: 30_000 });
    await shareButton.hover();

    // Wait for the menu instance that is actually visible
    await this.getVisibleShareMenu().waitFor({ state: "visible", timeout: 30_000 });
  }

  /**
   * Clicks "Share Quotes" from the currently visible share menu.
   */
  async clickShareQuotes() {
    const menu = this.getVisibleShareMenu();
    await menu.waitFor({ state: "visible", timeout: 30_000 });

    const item = menu.locator("li[role=\"menuitem\"]", { hasText: "Share Quotes" });
    await item.waitFor({ state: "visible", timeout: 30_000 });
    await item.click();
  }

  /**
   * Clicks "Share Itinerary" from the second share menu.
   */
  async clickShareItinerary() {
    const menu = this.getVisibleShareMenu();
    await menu.waitFor({ state: "visible", timeout: 30_000 });

    const item = menu.locator("li[role=\"menuitem\"]", { hasText: "Share Itinerary" });
    await item.waitFor({ state: "visible", timeout: 30_000 });
    await item.click();
  }

  // This can be used when sharing quotes or itinerary from Results page as well
  /**
   * Clicks the "Send" button.
   */
  async clickSendEmailButton() {
    const sendButton = this.page.getByRole("button", { name: "Send" });

    await sendButton.waitFor({ state: "visible" });
    await sendButton.click();
  }

  // ===== OOP JUSTIFICATION =====

  /**
   * Fills in the OOP justification textbox.
   *
   * @param {string} justificationText - The text to enter in the justification field.
   */
  async fillInOOPJustificationText(justificationText) {
    const textbox = this.getOOPJustificationTextbox();
    await textbox.waitFor({ state: "visible", timeout: 10000 });
    await textbox.fill(justificationText);
  }

  /**
   * Clicks the Save Justification button.
   */
  async saveOOPJustificationText() {
    const saveButton = this.getSaveJustificationButton();
    await saveButton.waitFor({ state: "visible", timeout: 10000 });
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
   *
   * @param {string} justificationOption - The name of the justification option to wait for
   */
  async waitForJustificationDropdownOption(justificationOption) {
    await this.getJustificationOption(justificationOption).waitFor({ state: "visible" });
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
      await btn.waitFor({ state: "visible", timeout });
    } catch {
      // Modal did not appear within timeout
      return false;
    }

    await btn.click();
    return true;
  }

  /**
   * Waits for the "Requested" flight title to be visible.
   */
  async waitForRequestedFlightTitle() {
    await this.getRequestedFlightTitle().waitFor({ state: "visible" });
  }

  /**
   * Waits for the Hold button to be visible.
   */
  async waitForHoldButton() {
    await this.page.locator(SELECTORS.HOLD_BUTTON).waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Clicks the Hold button.
   */
  async clickHoldButton() {
    await this.page.locator(SELECTORS.HOLD_BUTTON).click();
  }

  /**
   * Waits for the booking status label to show "on hold" text.
   * Used after clicking the hold button to wait for status to update.
   */
  async waitForOnHoldStatus() {
    await this.page.locator(SELECTORS.QUOTE_STATUS_LABEL, { hasText: /on hold/i })
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Waits for the Price Breakdown button to be visible.
   */
  async waitForPriceBreakdownButton() {
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_BUTTON).waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Clicks the Price Breakdown button.
   */
  async clickPriceBreakdownButton() {
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_BUTTON).click();
  }

  /**
   * Clicks the X button to close the Price Breakdown modal.
   */
  async clickXToClosePriceBreakdownModal() {
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_CLOSE_BUTTON).click();
  }

  /**
   * Clicks edit button in Extras section.
   * @param {number} [index=0] - The index of the extras section (0-based)
   */
  async clickEditExtrasButton(index = 0) {
    await this.page.locator(SELECTORS.EDIT_EXTRAS_BUTTON).nth(index).click();
  }

  /**
   * Waits for the Save button to be visible in extras section.
   */
  async waitForSaveButton() {
    await this.getSaveButton().waitFor({ state: 'visible' });
  }

  /**
   * Clicks the Save button in extras section.
   */
  async clickSaveButton() {
    await this.getSaveButton().click();
  }

  /**
   * Clicks the Number of baggage dropdown to open options.
   */
  async clickNumberOfBaggage() {
    await this.getNumberOfBaggage().click();
  }

  /**
   * Clicks a dropdown option by partial or full text match.
   * Uses hasText filter for flexible matching (e.g., "BAG" matches "CHECKED BAG 2nd - USD80.00").
   *
   * @param {string} optionDropdown - Text to match in dropdown option (partial or full)
   * @throws {Error} If optionDropdown is not a non-empty string
   */
  async clickDropdownOption(optionDropdown) {
    if (!optionDropdown || typeof optionDropdown !== 'string') {
      throw new Error('optionDropdown must be a non-empty string');
    }
    // Use hasText for partial matching - allows "BAG" to match "CHECKED BAG 2nd - USD80.00"
    await this.page
      .locator(SELECTORS.DROPDOWN_OPTION, { hasText: optionDropdown })
      .first()
      .click();
  }

  /**
   * Clicks the arrow button to expand or collapse extras section.
   */
  async clickArrowButtonExtras() {
    await this.page.locator(SELECTORS.EXTRAS_ARROW_BUTTON).click();
  }

}
// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS,
};