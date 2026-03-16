const { waitForText } = require("@utils/wait");

/**
 * Page Object for cart page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {

  // Cart general selectors
  TERMS_CHECKBOX: ".el-checkbox__inner",
  PROCEED_TO_CHECKOUT_BUTTON: ".btn-container:has-text('Proceed to Checkout')",
  QUOTE_STATUS_LABEL: ".app-label--quote",
  HOLD_BUTTON: ".btn--default.mt-2",

  // Refundable hotel text
  REFUNDABLE_TEXT: "div.refundable",
  // div.cancellation-terms is always present in hotel-preview (cart); the <p> inside carries the policy text
  CANCELLATION_POLICY_LABEL: "div.cancellation-terms p",

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
  LOCATION_LABEL: '.location-label',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',

  // Trip Overview selectors
  TRIP_OVERVIEW_TITLE: ".payments-title",

  // Trip title and destination selectors (cart-info-bar.vue)
  TRIP_TITLE: '.cart-info-bar h4.trip-title',
  TRIP_DESTINATION_INFO: '.cart-info-bar .info-wrapper p',

  // Quote title selector (base-quote-header.vue)
  QUOTE_TITLE: '.quote-payment-card h6.quote-title',

  // OOP Justification selectors
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
  
  // Extras
  EDIT_EXTRAS_BUTTON: ".extra__btns", //All edit buttons in extras section have the same class, so we will use nth(index) to click the right one when needed
  EXTRAS_INFORMATION_FIELD: '.el-select__selected-item span', // The field that shows selected extra option
  EXTRAS_ARROW_BUTTON: '.px-4.ticket-bottom.py-4 .el-icon.el-collapse-item__arrow', // Arrow button to expand/collapse extras information
  // Premier Inn extras selectors (premier-inn.vue)
  PREMIER_INN_PAYMENT_SELECT: '.quote-extras--premier-inn .extras-card .el-select', // First el-select in Premier Inn extras = payment method

  // General
  ADD_SEATS_BUTTON: 'button:has-text("Add Seats")', // Button to open seat selection (text from $t('btn.add') + $t('common.seats'))
  SEAT_MAP_CONTAINER: '.deck-wrapper', // Appears only when seat map data is loaded (v-if="!isLoading && seatsMap.length > 0")
  SEAT_ELEMENT: '.seat', // div.seat inside plane-seat.vue component
  SEAT_MAP_PRICE: '.total-sum-wrapper .price', // Price element in the seat map footer (app-price component)
  SEAT_MAP_SAVE_CLOSE_BUTTON: 'button:has-text("Save And Close")', // Save & Close button in seat map drawer
  CART_TOTAL_PRICE: '.price-total .amount', // Grand total in the cart summary sidebar (trip-summary.vue)
  NUMBER_OF_BAGGAGE_DROPDOWN_FIELD: "//span[normalize-space()='Number of baggage']", // XPath used due to complex dropdown structure - TODO: adjust when we have a data-test-id selector.
  DROPDOWN_OPTION: 'li.el-select-dropdown__item', // Dropdown option selector (used with hasText filter for partial matching)
  GREEN_ICON_BAGGAGE: ".flight-baggage .material-symbols-outlined.filled.success-icon.green",  // Green icon next to added baggage
  
  // Delivery Method (UK Rail) selectors
  DELIVERY_METHOD_SECTION: ".uk-rail-delivery-method",
  DELIVERY_METHOD_CLICKABLE: ".uk-rail-delivery-method .is-clickable",
  DELIVERY_METHOD_TITLE: ".uk-rail-delivery-method .card-title",
  DELIVERY_METHOD_FIRST_RADIO: ".uk-rail-delivery-method .el-radio-group > :nth-child(1) .el-radio__inner",
  GREEN_ICON_DELIVERY_METHOD: ".uk-rail-delivery-method .material-symbols-outlined",

  // Hotel rooms badge in cart trip summary (.dates-and-rooms from hotel-quote-summary.vue)
  ROOMS_BADGE: '.dates-and-rooms, .dates span',

  // Special request (special-requests.vue)
  SPECIAL_REQUEST_CLICKABLE: '.quote-extras--special-requests .is-clickable',
  SPECIAL_REQUEST_TEXTAREA: '.quote-extras--special-requests textarea',
  SPECIAL_REQUEST_SAVE_BTN: '.quote-extras--special-requests .btn--primary',
  SPECIAL_REQUEST_SUCCESS: '.success-icon',

  // CO2 eco-label in trip overview (hotel-preview.vue in cart context)
  CO2_LABEL_TRIP_OVERVIEW: "section.hotel-preview .eco-label",
  CO2_VALUE_TRIP_OVERVIEW: "section.hotel-preview .eco-label .is-size-7",

  // Voucher download box in hotel-quote-card.vue (.voucher-box)
  DOWNLOAD_VOUCHER_BOX: ".download-text",

  // Share itinerary / quotes dropdown
  SHARE_BUTTON: ".share-container .share-btn",
  SHARE_POPPER_MENU: "ul.share-popper[role='menu']:visible",

  // Add hotel from cart product carousel
  ADD_HOTEL_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Hotel")',
  ADD_HOTEL_SEARCH_DRAWER: '.app-drawer.atrs-edit-search-drawer',
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
    const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL).first();
    await locator.waitFor({ state: 'visible', timeout });
    return (await locator.innerText()).trim();
  }

  /**
   * Gets the payment type label locator by expected text.
   * @param {string} expectedType - Expected payment type text (e.g., "Paid by TMC")
   * @returns {Locator}
   */
  getPaymentTypeLabel(expectedType) {
    if (!expectedType || typeof expectedType !== "string") {
      throw new Error(`expectedType must be a non-empty string, got: ${typeof expectedType}`);
    }

    return this.page.getByText(expectedType, { exact: true });
  }

  /**
   * Waits for payment type label to be visible and returns its text.
   * @param {string} expectedType - Expected payment type text (e.g., "Paid by TMC")
   * @param {number} [timeout=30000] - Maximum wait time in milliseconds
   * @returns {Promise<string>} The payment type label text
   */
  async waitForPaymentTypeText(expectedType, { timeout = 30000 } = {}) {
    if (typeof timeout !== "number" || timeout < 0) {
      throw new Error(`timeout must be >= 0, got ${timeout}`);
    }

    const label = this.getPaymentTypeLabel(expectedType);
    await label.waitFor({ state: "visible", timeout });
    return (await label.innerText()).trim();
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
    return this.page.locator(SELECTORS.SHARE_POPPER_MENU);
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
    return this.page.getByText('Number of baggage', { exact: true }).first();
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
   * Ensures button is visible and ready to click.
   */
  async waitForProceedToCheckout() {
    // Wait for button with exact text
    await this.page.locator(SELECTORS.PROCEED_TO_CHECKOUT_BUTTON).waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
  }

  /**
   * Clicks the Proceed to Checkout button.
   * Uses text-based selector to ensure correct button.
   */
  async clickProceedToCheckout() {
    // Click the specific button container that has "Proceed to Checkout" text
    await this.page.locator(SELECTORS.PROCEED_TO_CHECKOUT_BUTTON).click();
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
    await icon.waitFor({ state: "visible", timeout: 10000 });
    await icon.hover();
    // Extended wait: el-dropdown is disabled while page is loading; give UI time to open
    await this.page.waitForTimeout(1500);
  }

  /**
   * Waits until the dropdown menu with "Cancel trip" is visible.
   */
  async waitForDropdownMenu() {
    await this.page
      .locator(SELECTORS.CANCEL_TRIP_OPTION, { hasText: "Cancel trip" })
      .waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Clicks the "Cancel trip" option in the dropdown.
   */
  async clickCancelTripOption() {
    const cancelOption = this.page.locator(
      SELECTORS.CANCEL_TRIP_OPTION,
      { hasText: "Cancel trip" },
    );
    await cancelOption.waitFor({ state: "visible", timeout: 15000 });
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
    await button.waitFor({ state: "visible", timeout: 10000 });
    await button.click();
  }

  /**
   * Waits for the cancellation success message to be visible.
   * Fails if not found within timeout.
   */
  async waitForTripCancelledMessage({ timeout = 120000 } = {}) {
    // Text-based polling: works whether navigation already happened (fast backend)
    // or is still in-progress (slow GDS backends like Sabre/Amadeus).
    // 120s covers slow backend cancellation processing times.
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
  async isTripCancelledMessageVisible({ timeout = 120000 } = {}) {
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
      .locator(SELECTORS.SHARE_BUTTON);

    await shareButton.waitFor({ state: "visible", timeout: 30_000 });
    // Use click() instead of hover() — click() also fires mouseenter (which
    // is the actual El-dropdown trigger) but enforces actionability checks
    // (stable, not covered, scrolled into view), making it more reliable.
    await shareButton.click();

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

  /**
   * Clicks the 'Add seats' button in the extras section.
   */
  async clickAddSeatsButton() {
    await this.page.locator(SELECTORS.ADD_SEATS_BUTTON).first().waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(SELECTORS.ADD_SEATS_BUTTON).first().click();
  }

  /**
   * Waits for the seat map to load and be visible.
   */
  async waitForSeatMapToLoad() {
    await this.page.locator(SELECTORS.SEAT_MAP_CONTAINER).first().waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Gets the raw seat price text shown in the seat map drawer footer.
   * @returns {Promise<string>} The raw price text (e.g. "€40.48")
   */
  async getSeatPriceTextFromDrawer() {
    const priceEl = this.page.locator(SELECTORS.SEAT_MAP_PRICE).first();
    await priceEl.waitFor({ state: 'visible', timeout: 15000 });
    return (await priceEl.innerText()).trim();
  }

  /**
   * Clicks the 'Save And Close' button in the seat map drawer.
   */
  async saveAndCloseSeatMapDrawer() {
    const btn = this.page.locator(SELECTORS.SEAT_MAP_SAVE_CLOSE_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Gets the cart grand total price from the trip summary sidebar.
   * Uses the .price-total .amount selector from trip-summary.vue.
   * @returns {Promise<number|null>} The total price as a numeric value
   */
  async getCartTotalPrice() {
    const totalEl = this.page.locator(SELECTORS.CART_TOTAL_PRICE).first();
    await totalEl.waitFor({ state: 'visible', timeout: 15000 });
    const text = await totalEl.innerText();
    const match = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(match) || null;
  }

  /**
   * Waits for the hotel rooms badge in the cart to show the expected count.
   * Matches text like "2 Rooms" in the hotel quote summary.
   * Selector covers both .dates-and-rooms (Vue source) and .dates span (legacy Testim).
   *
   * @param {number} count - Expected number of rooms (e.g. 2)
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Max wait time in ms
   */
  async waitForRoomsBadge(count, { timeout = 30000 } = {}) {
    if (typeof count !== 'number') throw new Error('count must be a number, got: ' + typeof count);
    const label = count === 1 ? 'Room' : 'Rooms';
    const badge = this.page
      .locator(SELECTORS.ROOMS_BADGE)
      .filter({ hasText: new RegExp(count + '\\s+' + label, 'i') });
    await badge.first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for the delivery method section to be visible.
   * Used before interacting with delivery method options.
   */
  async waitForDeliveryMethodSection() {
    await this.page.locator(SELECTORS.DELIVERY_METHOD_SECTION).waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Waits for the delivery method section to be hidden.
   * Used after saving delivery method to ensure panel has closed.
   */
  async waitForDeliveryMethodSectionHidden() {
    await this.page.locator(SELECTORS.DELIVERY_METHOD_SECTION).waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Clicks the delivery method clickable element to expand/toggle the section.
   */
  async clickDeliveryMethodClickable() {
    const element = this.page.locator(SELECTORS.DELIVERY_METHOD_CLICKABLE);
    await element.waitFor({ state: 'visible', timeout: 15000 });
    await element.click();
  }

  /**
   * Waits for the delivery method title to be visible.
   */
  async waitForDeliveryMethodTitle() {
    await this.page.locator(SELECTORS.DELIVERY_METHOD_TITLE).waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Selects the first delivery method option via radio button.
   */
  async selectFirstDeliveryMethod() {
    const radio = this.page.locator(SELECTORS.DELIVERY_METHOD_FIRST_RADIO);
    await radio.waitFor({ state: 'visible', timeout: 15000 });
    await radio.click();
  }

  /**
   * Waits for the green success icon to appear next to delivery method.
   * Indicates that the delivery method has been successfully saved.
   */
  async waitForDeliveryMethodGreenIcon() {
    await this.page.locator(SELECTORS.GREEN_ICON_DELIVERY_METHOD).waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Opens the special request panel, types the given text, saves it,
   * and waits for the success icon to confirm the save.
   *
   * @param {string} text - The special request text to submit
   * @param {object} [options]
   * @param {number} [options.timeout=20000] - Max wait time per action in ms
   */
  async fillSpecialRequest(text, { timeout = 20000 } = {}) {
    if (typeof text !== 'string') throw new Error('text must be a string, got: ' + typeof text);
    const clickable = this.page.locator(SELECTORS.SPECIAL_REQUEST_CLICKABLE);
    await clickable.waitFor({ state: 'visible', timeout });
    await clickable.click();
    const textarea = this.page.locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
    await textarea.waitFor({ state: 'visible', timeout });
    await textarea.fill(text);
    await this.page.locator(SELECTORS.SPECIAL_REQUEST_SAVE_BTN).click();
    await this.page.locator(SELECTORS.SPECIAL_REQUEST_SUCCESS).waitFor({ state: 'visible', timeout });
  }

  /**
   * Opens the special request panel and types the given text WITHOUT saving.
   * Useful for verifying truncation/character limit before save.
   *
   * @param {string} text - The text to type into the special request textarea
   * @param {object} [options]
   * @param {number} [options.timeout=20000] - Max wait time per action in ms
   */
  async fillSpecialRequestWithoutSaving(text, { timeout = 20000 } = {}) {
    if (typeof text !== 'string') throw new Error('text must be a string, got: ' + typeof text);
    const clickable = this.page.locator(SELECTORS.SPECIAL_REQUEST_CLICKABLE);
    await clickable.waitFor({ state: 'visible', timeout });
    await clickable.click();
    const textarea = this.page.locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
    await textarea.waitFor({ state: 'visible', timeout });
    await textarea.fill(text);
  }

  /**
   * Gets the current text value from the special request textarea.
   * Assumes the special request panel is already open.
   * @param {number} [timeout=10000]
   * @returns {Promise<string>} The current textarea value
   */
  async getSpecialRequestValue({ timeout = 10000 } = {}) {
    const textarea = this.page.locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
    await textarea.waitFor({ state: 'visible', timeout });
    return (await textarea.inputValue()).trim();
  }

  /**
   * Checks if CO2 eco-label is visible in trip overview.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<boolean>} True if CO2 label is visible
   */
  async isCO2LabelVisibleInTripOverview({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CO2_LABEL_TRIP_OVERVIEW).first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the CO2 value text from the trip overview.
   * @returns {Promise<string>} The CO2 numeric value text
   */
  async getCO2ValueInTripOverview() {
    const value = this.page.locator(SELECTORS.CO2_VALUE_TRIP_OVERVIEW).first();
    await value.waitFor({ state: 'visible', timeout: 10000 });
    return (await value.textContent()).trim();
  }

  /**
   * Checks if the "Download Voucher" box is visible in the trip overview.
   * Only visible for suppliers that provide a voucher (e.g. Ratehawk).
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isVoucherDownloadVisible({ timeout = 15000 } = {}) {
    const box = this.page.locator(SELECTORS.DOWNLOAD_VOUCHER_BOX).first();
    try {
      await box.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the payment method dropdown in the Premier Inn extras panel.
   */
  async clickPremierInnPaymentMethodDropdown() {
    const select = this.page.locator(SELECTORS.PREMIER_INN_PAYMENT_SELECT).first();
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    // Wait for the open popper to render items (El-Plus shows them via display, not aria)
    await this.page.waitForTimeout(800);
  }

  /**
   * Counts payment method options in the Premier Inn extras dropdown after it is opened.
   * Traverses ancestor chain to skip items inside poppers that are display:none (closed dropdowns).
   * @returns {Promise<number>} Number of options in the currently open dropdown
   */
  async getPremierInnPaymentOptionCount() {
    return await this.page.evaluate((selector) => {
      let count = 0;
      for (const item of document.querySelectorAll(selector)) {
        let visible = true;
        let node = item.parentElement;
        while (node && node !== document.body) {
          if (window.getComputedStyle(node).display === 'none') {
            visible = false;
            break;
          }
          node = node.parentElement;
        }
        if (visible) count++;
      }
      return count;
    }, SELECTORS.DROPDOWN_OPTION);
  }

    /**
   * Gets a location element by index.
   * @param {number} index - Zero-based index of the location element (ex. pick-up > index 0 or drop-off > index 1 for the first quote, two indexes per quote)
   * @param {string} [locationType='cityCenter'] - Type of location: 'cityCenter' or 'airport'
   * @returns {import('playwright').Locator}
   */
  getLocationByIndexOnCart(index, locationType = 'cityCenter') {
    const selector = locationType === 'airport' ? SELECTORS.LOCATION_AIRPORT : SELECTORS.LOCATION_CITY_CENTER;
    return this.page.locator(selector).nth(index);
  }

  /**
   * Gets the location label text (e.g., "Pick up", "Drop off") at the given index.
   * @param {number} index - Zero-based index of the location element (ex. pick-up > index 0 or drop-off > index 1 for the first quote, two indexes per quote)
   * @returns {Promise<string>} The label text
   */
  getLocationLabelOnCartByIndex(index) {
      const selector = SELECTORS.LOCATION_LABEL;
      return this.page.locator(selector).nth(index);
  }

  /**
   * Clicks the Hotel button in the "Add more services" product carousel.
   * Waits for the search drawer to open after clicking.
   * @param {number} [timeout=10000]
   */
  async clickAddHotelFromCarousel({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_HOTEL_CAROUSEL_BUTTON);
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    await this.page.locator(SELECTORS.ADD_HOTEL_SEARCH_DRAWER).waitFor({ state: 'visible', timeout });
  }

  /**
   * Gets the trip title text from the cart info bar (e.g. "Trip to Ashdod").
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getTripTitleText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TRIP_TITLE).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Gets the trip destination text from the cart info bar (e.g. "Ashdod").
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getTripDestinationInfoText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TRIP_DESTINATION_INFO).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Gets the quote title text from the hotel quote card header (e.g. "Leonardo Plana Ashdod").
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getQuoteTitleText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.QUOTE_TITLE).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }
}
// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS,
};