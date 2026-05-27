const {
  typeIntoNthAvailableInput,
  pressTab,
} = require("@utils/dom");

/**
 * Page Object for manual quote search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MANUAL_QUOTE_TAB: "#tab-manual",
  ENTER_AIRPORT_LOCATION_PLACEHOLDER: "[placeholder=\"Enter airport location\"]",

  // Airport inputs
  DEPARTING_FROM_INPUT: "input[name=\"departing-airport-autocomplete\"]",
  ARRIVING_TO_INPUT: "input[name=\"arriving-airport-autocomplete\"]",

  // Date inputs
  DEPARTING_DATE_INPUT: "input[name=\"departing-date\"]",
  // TODO: Replace with data-testid - this selector is fragile and matches multiple elements
  RETURNING_DATE_INPUT: ".el-input__inner[placeholder=\"DD MM YYYY\"][readonly]",

  // Time inputs
  DEPARTING_HOUR_FIELD: "[name=\"departing-hour\"]",
  RETURNING_HOUR_FIELD: "[name=\"arriving-hour\"]",
  TIME_PICKER_INPUTS: "section.app-timepicker input.app-timepicker-input",

  // Flight details
  FLIGHT_NUMBER_FIELD: "[name=\"flight-number\"]",
  CARRIER_LOCATOR_FIELD: "[name=\"carrier-locator\"]",
  CARRIER_INPUT: "[name=\"carrier\"] input.el-select__input",
  CARRIER_DROPDOWN_OPTION:
    (carrierName) => `li.el-select-dropdown__item span:text("${carrierName}")`,

  // Pricing and actions
  BASE_FARE_FIELD: "[name=\"base-fare\"]",
  ADD_QUOTE_BUTTON: "button.add-quote-btn",

  // ===== HOTEL MANUAL QUOTE =====
  // Sub-tab inside the manual-quote-page (Element-Plus el-tabs, the Hotel pane label)
  HOTEL_SUBTAB: ".manual-quote-page .el-tabs__item:has-text(\"Hotel\")",
  // Container for the hotel manual quote form (manual-quote-hotel.vue)
  HOTEL_FORM_CONTAINER: ".manual-quote-hotel",
  // Radio inside manual-quote-hotel.vue: <el-radio value="manual">Enter details manually</el-radio>
  HOTEL_MANUAL_MODE_RADIO:
    '.manual-quote-hotel .el-radio:has-text("Enter details manually")',
  // Element Plus date picker popup, scoped to whichever picker is currently visible.
  HOTEL_DATE_PICKER_PANEL: ".el-picker-panel:visible",
  // Form fields scoped by visible label text (.field:has(label:text-is("...")) is the
  // project's established pattern — see CartPage.PASSENGER_INFO_*).
  HOTEL_NAME_INPUT: ".manual-quote-hotel input[name=\"hotel-name\"]",
  HOTEL_ADDRESS_INPUT: ".manual-quote-hotel input[name=\"Address\"]",
  HOTEL_CITY_INPUT: ".manual-quote-hotel .field:has(label:text-is(\"City\")) input",
  HOTEL_CITY_DROPDOWN_OPTION: ".boxed-autocomplete-popper .autocomplete-result, .el-autocomplete-suggestion li",
  HOTEL_CHECK_IN_FIELD: ".manual-quote-hotel .field:has(label:text-is(\"Check In Date\"))",
  HOTEL_CHECK_OUT_FIELD: ".manual-quote-hotel .field:has(label:text-is(\"Check Out Date\"))",
  HOTEL_NUMBER_OF_ROOMS_SELECT: ".manual-quote-hotel .field:has(label:text-is(\"Number Of Rooms\")) .el-select__wrapper",
  HOTEL_CANCELLATION_POLICY_SELECT: ".manual-quote-hotel .field:has(label:text-is(\"Cancellation policy\")) .el-select__wrapper",
  HOTEL_CONFIRMATION_NUM_INPUT: ".manual-quote-hotel input[name=\"confirmation-num\"]",
  HOTEL_ROOM_DESCRIPTION_TEXTAREA: ".manual-quote-hotel .field:has(label:text-is(\"Room description\")) textarea",
  // Base fare lives in the price section; it's the first number input there.
  HOTEL_BASE_FARE_INPUT: ".manual-quote-hotel .field:has(label:text-is(\"Base fare\")) input, .manual-quote-hotel .price-section input[type=\"number\"]",
  // Generic visible dropdown options (Element-Plus renders dropdown at body level)
  SELECT_DROPDOWN_OPTION: ".el-select-dropdown:visible .el-select-dropdown__item",

  // ===== MANUAL QUOTE PAGE CHROME (title, back, warning) =====
  // Source: src/app/Atriis.OBT/src/views/trip/manual-quote/manual-quote-page.vue
  // <div class="title-container"> wraps the Back button and the <h1> title.
  PAGE_HEADING: ".title-container h1",
  BACK_BUTTON: ".title-container .go-back-btn",
  // Warning shown before a traveler is added (".has-text-weight-bold" inside the
  // manual-quote-page section). Element-Plus renders one per tab pane; we scope
  // to the active tab via `:visible` so we read the one the user can see.
  WARNING_TEXT: ".manual-quote-page .has-text-weight-bold:visible",

  // ===== CAR MANUAL QUOTE =====
  // Element-Plus el-tabs auto-generates `id="tab-{name}"` / `id="pane-{name}"`
  // from the el-tab-pane :name binding. These are deterministic, NOT dynamic.
  CAR_TAB: "#tab-car",
  CAR_PANE: "#pane-car",
  // Payment details section (named class on <section> in manual-quote-payment-details.vue)
  CAR_PAYMENT_SECTION: "#pane-car .manual-quote-payment-details",
  // FOP (Available credit cards) — label-scoped, matches existing hotel pattern in this file
  CAR_FOP_TRIGGER:
    "#pane-car .manual-quote-payment-details .field:has(label:text-is(\"Available credit cards\")) .el-select__wrapper",
  // Card type uses the explicit class `credit-type-select` from the Vue source
  CAR_CARD_TYPE_SELECT: "#pane-car .credit-type-select",
  CAR_CARD_TYPE_TRIGGER: "#pane-car .credit-type-select .el-select__wrapper",
  CAR_CARD_TYPE_DISPLAY: "#pane-car .credit-type-select .el-select__placeholder",

  // Element-Plus teleports every dropdown to <body>; multiple dropdown panels
  // coexist in the DOM and the closed ones are hidden via a parent wrapper
  // (no inline `style="display:none"` on the items themselves). Use Playwright's
  // `:visible` engine to filter for the dropdown panel that's actually visible.
  VISIBLE_DROPDOWN_ITEM: ".el-select-dropdown__item:visible",

  // ===== OTHER PRODUCTS MANUAL QUOTE =====
  OTHER_PRODUCTS_TAB: "#tab-manualOtherProducts",
  OTHER_PRODUCTS_SECTION: ".manual-quote-other-products",
  OTHER_QUOTE_TYPE_TRIGGER: ".manual-quote-other-products .field:has(label:has-text(\"Select quote type\")) .el-select__wrapper",
  OTHER_START_DATE_INPUT: ".manual-quote-other-products .start-from-input input",
  OTHER_END_DATE_INPUT: ".manual-quote-other-products .end-by-input input",
  OTHER_COMMENT_TEXTAREA: ".manual-quote-other-products textarea",
  OTHER_BASE_FARE_INPUT: ".manual-quote-other-products .price-section input[type=\"number\"]",
};

class ManualQuoteSearchPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the time picker input locator.
   * @param {number} index - 0 for start time, 1 for end time
   * @returns {Locator} Playwright locator for the time picker input
   */
  getTimePickerInput(index) {
    return this.page.locator(SELECTORS.TIME_PICKER_INPUTS).nth(index);
  }

  /**
   * Gets the flight number field locator.
   * @returns {Locator} Playwright locator for the flight number field
   */
  getFlightNumberField() {
    return this.page.locator(SELECTORS.FLIGHT_NUMBER_FIELD);
  }

  // ===== UI INTERACTIONS =====

  /**
   * Clicks the Manual Quote tab to switch to manual quote mode.
   * Skips gracefully if the tab is not present (e.g. when the user already
   * navigated to the dedicated /manual-quote page from the cart product
   * carousel — that page has no `#tab-manual` because it IS the manual quote
   * surface).
   */
  async clickManualQuoteTab() {
    const tab = this.page.locator(SELECTORS.MANUAL_QUOTE_TAB);
    const isVisible = await tab.isVisible().catch(() => false);
    if (isVisible) {
      await tab.click();
    }
  }

  /**
   * Waits for the airport location placeholder to be visible.
   * Used to ensure the manual quote form is fully loaded.
   */
  async waitForEnterAirportLocationPlaceholderVisible() {
    await this.page.locator(
      SELECTORS.ENTER_AIRPORT_LOCATION_PLACEHOLDER,
    ).first().waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Fills the "From" field.
   *
   * Uses a shared helper that supports multiple supplier UIs by targeting the
   * first available input that matches the "From" placeholder selector.
   * After typing, it commits the value by pressing TAB and waits until the field
   * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
   *
   * @param {string} from - Origin text to type into the "From" field
   */
  async fillInDepartingFromField(from) {
    const fromInput = this.page
      .locator(SELECTORS.DEPARTING_FROM_INPUT)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      from,
      [SELECTORS.DEPARTING_FROM_INPUT],
      0,
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
   * Fills the "To" field.
   *
   * Uses a shared helper that supports multiple supplier UIs by targeting the
   * first available input that matches the "To" placeholder selector.
   * After typing, it commits the value by pressing TAB and waits until the field
   * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
   *
   * @param {string} to - Destination text to type into the "To" field
   */
  async fillInArrivingToField(to) {
    const toInput = this.page
      .locator(SELECTORS.ARRIVING_TO_INPUT)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      to,
      [SELECTORS.ARRIVING_TO_INPUT],
      0,
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
   * Clicks the departing date field to open the calendar picker.
   */
  async clickDepartingDateField() {
    await this.page.click(SELECTORS.DEPARTING_DATE_INPUT);
  }

  /**
   * Clicks the returning date field to open the calendar picker.
   * Uses nth(1) because the selector matches multiple readonly date inputs.
   */
  async clickReturningDateField() {
    await this.page.locator(SELECTORS.RETURNING_DATE_INPUT).nth(1).click();
  }

  /**
   * Fills the flight number field.
   *
   * @param {string} flightNumber - Flight number to enter (e.g., "765")
   */
  async typeFlightNumber(flightNumber) {
    await this.page.fill(SELECTORS.FLIGHT_NUMBER_FIELD, flightNumber);
  }

  /**
   * Fills the carrier locator field (airline code).
   *
   * @param {string} carrierLocator - Airline code (e.g., "TP" for TAP Air Portugal)
   */
  async typeCarrierLocator(carrierLocator) {
    await this.page.fill(SELECTORS.CARRIER_LOCATOR_FIELD, carrierLocator);
  }

  /**
   * Types into the carrier name field to trigger autocomplete dropdown.
   *
   * @param {string} carrierName - Carrier name to type (e.g., "TAP Air Portugal (TP)")
   */
  async typeCarrierName(carrierName) {
    const input = this.page.locator(SELECTORS.CARRIER_INPUT);
    await input.click();
    await input.fill(carrierName);
  }

  /**
   * Selects a carrier option from the autocomplete dropdown.
   *
   * @param {string} carrierName - Exact carrier name to select from dropdown
   */
  async clickCarrierDropdownOption(carrierName) {
    await this.page
      .locator(SELECTORS.CARRIER_DROPDOWN_OPTION(carrierName))
      .click();
  }

  /**
   * Clicks the start time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickStartTime() {
    await this.getTimePickerInput(0).click();
    await this.getFlightNumberField().click();
  }

  /**
   * Clicks the end time picker and then clicks away to close it.
   * Required to trigger time validation in the UI.
   */
  async clickEndTime() {
    await this.getTimePickerInput(1).click();
    await this.getFlightNumberField().click();
  }

  /**
   * Fills the base fare field for the manual quote.
   * Scrolls to element first to ensure it's in view.
   *
   * @param {string} baseFare - Base fare amount (e.g., "50")
   */
  async typeBaseFare(baseFare) {
    const baseFareField = this.page.locator(SELECTORS.BASE_FARE_FIELD).first();
    await baseFareField.scrollIntoViewIfNeeded();
    await baseFareField.fill(baseFare);
  }

  /**
   * Clicks the "Add Quote" button to add the manual quote to the cart.
   * Scrolls to element first to ensure it's in view.
   */
  async clickAddQuoteButton() {
    const addQuoteBtn = this.page.locator(SELECTORS.ADD_QUOTE_BUTTON).first();
    await addQuoteBtn.scrollIntoViewIfNeeded();
    await addQuoteBtn.click();
  }

  // ===== HOTEL MANUAL QUOTE =====

  /**
   * Clicks the Hotel sub-tab inside the manual quote page.
   */
  async clickHotelSubTab() {
    await this.page.locator(SELECTORS.HOTEL_SUBTAB).first().click();
  }

  /**
   * Waits for the hotel manual quote form container to be visible.
   */
  async waitForHotelFormVisible() {
    await this.page
      .locator(SELECTORS.HOTEL_FORM_CONTAINER)
      .first()
      .waitFor({ state: "visible", timeout: 20000 });
  }

  /**
   * Selects the "Enter details manually" radio inside the hotel form.
   * The form defaults to "Search location" mode, so this MUST be called
   * before any of the manual-entry fields (hotel name, address, etc.) are
   * visible.
   */
  async selectHotelManualEntryMode() {
    const radio = this.page.locator(SELECTORS.HOTEL_MANUAL_MODE_RADIO).first();
    await radio.waitFor({ state: "visible", timeout: 10000 });
    await radio.click();
  }

  /**
   * Fills the hotel name field.
   * @param {string} name - Hotel name
   */
  async typeHotelName(name) {
    await this.page.locator(SELECTORS.HOTEL_NAME_INPUT).first().fill(name);
  }

  /**
   * Fills the hotel address field.
   * @param {string} address - Hotel street address
   */
  async typeHotelAddress(address) {
    await this.page.locator(SELECTORS.HOTEL_ADDRESS_INPUT).first().fill(address);
  }

  /**
   * Types into the city autocomplete and selects the first suggestion.
   * @param {string} city - City text to type (e.g. "Portland")
   * @param {number} [timeout=10000] - Max wait for dropdown
   */
  async selectHotelCity(city, timeout = 10000) {
    const input = this.page.locator(SELECTORS.HOTEL_CITY_INPUT).first();
    await input.click();
    await input.fill(city);
    const option = this.page.locator(SELECTORS.HOTEL_CITY_DROPDOWN_OPTION).first();
    await option.waitFor({ state: "visible", timeout });
    await option.click();
  }

  /**
   * Opens the check-in or check-out date picker by clicking the field's input,
   * scoped by visible label text. Waits for the picker panel to be visible.
   * @param {number} index - 0 for check-in, 1 for check-out
   */
  async clickHotelDateInput(index) {
    const fieldSelector =
      index === 0 ? SELECTORS.HOTEL_CHECK_IN_FIELD : SELECTORS.HOTEL_CHECK_OUT_FIELD;
    await this.page.locator(`${fieldSelector} input`).first().click();
    await this.page
      .locator(SELECTORS.HOTEL_DATE_PICKER_PANEL)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Opens an app-select dropdown by visible label text.
   * @param {"numberOfRooms"|"cancellationPolicy"} field
   */
  async openHotelSelect(field) {
    const selector =
      field === "cancellationPolicy"
        ? SELECTORS.HOTEL_CANCELLATION_POLICY_SELECT
        : SELECTORS.HOTEL_NUMBER_OF_ROOMS_SELECT;
    await this.page.locator(selector).first().click();
  }

  /**
   * Clicks a dropdown option that exactly matches the provided text.
   * @param {string} optionText - Text of the option to select
   * @param {number} [timeout=10000] - Max wait for the option
   */
  async clickDropdownOptionByText(optionText, timeout = 10000) {
    const option = this.page
      .locator(SELECTORS.SELECT_DROPDOWN_OPTION, { hasText: optionText })
      .first();
    await option.waitFor({ state: "visible", timeout });
    await option.click();
  }

  /**
   * Fills the confirmation number field.
   * @param {string} confirmationNum - Booking confirmation number
   */
  async typeHotelConfirmationNumber(confirmationNum) {
    await this.page
      .locator(SELECTORS.HOTEL_CONFIRMATION_NUM_INPUT)
      .first()
      .fill(confirmationNum);
  }

  /**
   * Fills the room description textarea.
   * @param {string} description - Room description text
   */
  async typeHotelRoomDescription(description) {
    await this.page
      .locator(SELECTORS.HOTEL_ROOM_DESCRIPTION_TEXTAREA)
      .first()
      .fill(description);
  }

  /**
   * Fills the base fare input in the hotel price section.
   * @param {string|number} value - Numeric value to enter
   */
  async typeHotelBaseFare(value) {
    const field = this.page.locator(SELECTORS.HOTEL_BASE_FARE_INPUT).first();
    await field.scrollIntoViewIfNeeded();
    await field.fill(String(value));
  }

  // ===== MANUAL QUOTE PAGE CHROME =====

  /** Returns the manual quote page heading locator (".title-container h1"). */
  getPageHeading() {
    return this.page.locator(SELECTORS.PAGE_HEADING).first();
  }

  /** Returns the manual quote page Back button locator (".title-container .go-back-btn"). */
  getBackButton() {
    return this.page.locator(SELECTORS.BACK_BUTTON).first();
  }

  /** Returns the warning banner locator filtered by the given text. */
  getWarningTextByContent(text) {
    return this.page.locator(SELECTORS.WARNING_TEXT, { hasText: text }).first();
  }

  async clickBackButton() {
    const button = this.getBackButton();
    await button.waitFor({ state: "visible", timeout: 10000 });
    await button.click();
  }

  // ===== CAR MANUAL QUOTE =====

  async clickCarTab() {
    const tab = this.page.locator(SELECTORS.CAR_TAB).first();
    await tab.waitFor({ state: "visible", timeout: 15000 });
    await tab.click();
    await this.page
      .locator(SELECTORS.CAR_PANE)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  async scrollCarPaymentSectionIntoView() {
    const section = this.page.locator(SELECTORS.CAR_PAYMENT_SECTION).first();
    await section.waitFor({ state: "visible", timeout: 10000 });
    await section.scrollIntoViewIfNeeded();
  }

  async openCarFopDropdown() {
    const trigger = this.page.locator(SELECTORS.CAR_FOP_TRIGGER).first();
    await trigger.waitFor({ state: "visible", timeout: 10000 });
    await trigger.click();
    await this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  async openCarCardTypeDropdown() {
    const trigger = this.page.locator(SELECTORS.CAR_CARD_TYPE_TRIGGER).first();
    await trigger.waitFor({ state: "visible", timeout: 10000 });
    await trigger.click();
    await this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  async getCarCardTypeDisplayText() {
    const display = this.page.locator(SELECTORS.CAR_CARD_TYPE_DISPLAY).first();
    await display.waitFor({ state: "visible", timeout: 10000 });
    return (await display.innerText()).trim();
  }

  /** Returns a locator for a visible Element-Plus dropdown option matching the given text. */
  getVisibleDropdownOptionByText(text) {
    return this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM, { hasText: text })
      .first();
  }

  async selectVisibleDropdownOption(text) {
    const option = this.getVisibleDropdownOptionByText(text);
    await option.waitFor({ state: "visible", timeout: 10000 });
    await option.click();
  }

  async listVisibleDropdownOptionTexts() {
    await this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
    const texts = await this.page
      .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
      .allInnerTexts();
    return texts.map((t) => t.trim()).filter((t) => t.length > 0);
  }

  // ===== OTHER PRODUCTS MANUAL QUOTE =====

  async clickOtherProductsTab() {
    const tab = this.page.locator(SELECTORS.OTHER_PRODUCTS_TAB).first();
    try {
      await tab.waitFor({ state: "visible", timeout: 15000 });
      await tab.click();
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickOtherProductsTab] Could not click the "Other" products tab ` +
        `(selector: ${SELECTORS.OTHER_PRODUCTS_TAB}). The tab was not visible within 15s — ` +
        `likely the manual quote page did not load or this product type is not enabled. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForOtherProductsFormVisible() {
    try {
      await this.page
        .locator(SELECTORS.OTHER_PRODUCTS_SECTION)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.waitForOtherProductsFormVisible] The Other Products form ` +
        `(selector: ${SELECTORS.OTHER_PRODUCTS_SECTION}) did not become visible within 20s — ` +
        `likely the tab click did not register or the form skeleton is still loading. ` +
        `Original: ${err.message}`
      );
    }
  }

  async openOtherQuoteTypeDropdown() {
    const trigger = this.page.locator(SELECTORS.OTHER_QUOTE_TYPE_TRIGGER).first();
    try {
      await trigger.waitFor({ state: "visible", timeout: 10000 });
      await trigger.click();
      await this.page
        .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.openOtherQuoteTypeDropdown] Could not open the quote type dropdown ` +
        `(selector: ${SELECTORS.OTHER_QUOTE_TYPE_TRIGGER}). The trigger was not visible or ` +
        `no dropdown options appeared within 10s — likely the form has not finished loading. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickOtherStartDateInput() {
    const input = this.page.locator(SELECTORS.OTHER_START_DATE_INPUT).first();
    try {
      await input.click();
      await this.page
        .locator(SELECTORS.HOTEL_DATE_PICKER_PANEL)
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickOtherStartDateInput] Could not open the start date picker ` +
        `(selector: ${SELECTORS.OTHER_START_DATE_INPUT}). The input was not clickable or the ` +
        `calendar panel did not appear within 10s. Original: ${err.message}`
      );
    }
  }

  async clickOtherEndDateInput() {
    const input = this.page.locator(SELECTORS.OTHER_END_DATE_INPUT).first();
    try {
      await input.click();
      await this.page
        .locator(SELECTORS.HOTEL_DATE_PICKER_PANEL)
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickOtherEndDateInput] Could not open the end date picker ` +
        `(selector: ${SELECTORS.OTHER_END_DATE_INPUT}). The input was not clickable or the ` +
        `calendar panel did not appear within 10s. Original: ${err.message}`
      );
    }
  }

  async typeOtherComment(comment) {
    const textarea = this.page.locator(SELECTORS.OTHER_COMMENT_TEXTAREA).first();
    try {
      await textarea.scrollIntoViewIfNeeded();
      await textarea.fill(comment);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.typeOtherComment] Could not fill the comment textarea ` +
        `(selector: ${SELECTORS.OTHER_COMMENT_TEXTAREA}) with "${comment}". ` +
        `The textarea was not visible or not editable. Original: ${err.message}`
      );
    }
  }

  async typeOtherBaseFare(amount) {
    const field = this.page.locator(SELECTORS.OTHER_BASE_FARE_INPUT).first();
    try {
      await field.scrollIntoViewIfNeeded();
      await field.fill(String(amount));
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.typeOtherBaseFare] Could not fill the base fare field ` +
        `(selector: ${SELECTORS.OTHER_BASE_FARE_INPUT}) with "${amount}". ` +
        `The input was not visible in the price section. Original: ${err.message}`
      );
    }
  }
}

module.exports = ManualQuoteSearchPage;
