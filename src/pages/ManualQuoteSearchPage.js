const {
  typeIntoNthAvailableInput,
  pressTab,
} = require("@utils/dom");

/**
 * Page Object for manual quote search page.
 * Contains only UI-level interactions.
 */

// Element-Plus renders the picker header month as an abbreviation ("Oct"); keyed on the first
// three letters so a full month name ("October") resolves too.
const MONTH_ABBR_TO_INDEX = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

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

  // ===== FLIGHT ROUND TRIP (multi-segment) =====
  // manual-quote-flight.vue renders one <manual-quote-flight-segment> per leg with a
  // fall-through data-flight-index (0 = outbound, 1 = inbound). "Add another flight"
  // appends the return-leg segment.
  ADD_ANOTHER_FLIGHT_BUTTON: ".manual-quote-flight .add-another-flight .product-btn",
  FLIGHT_SEGMENT: (index) => `.manual-quote-flight-segment[data-flight-index="${index}"]`,
  SEGMENT_ARRIVING_DATE_INPUT: "input[name=\"arriving-date\"]",
  // Element-Plus date-picker popup (teleported to <body>) — scope to the visible one, then
  // its selectable day cells.
  DATE_PICKER_PANEL_VISIBLE: ".el-picker-panel:visible",
  DATE_PICKER_AVAILABLE_DAY: "td.available .el-date-table-cell__text",
  // Header/arrows, resolved INSIDE one panel — the shared calendar helper reads the last
  // visible panel but clicks the first visible arrow, which drives the wrong picker while a
  // closing one is still on screen.
  DATE_PICKER_HEADER_LABEL: ".el-date-picker__header-label",
  DATE_PICKER_NEXT_MONTH_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  DATE_PICKER_PREV_MONTH_ARROW: "button.el-picker-panel__icon-btn.arrow-left[aria-label='Previous Month']",

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
  HOTEL_CITY_DROPDOWN_OPTION: ".boxed-autocomplete-popper:visible .autocomplete-result, .el-autocomplete-suggestion:visible li",
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

  // ===== CAR MANUAL QUOTE FORM FIELDS =====
  // Source: manual-quote-car.vue — car-autocomplete uses app-autocomplete with name prop
  CAR_FORM_SECTION: ".manual-quote-car",
  CAR_PICKUP_LOCATION_INPUT: ".manual-quote-car input[name=\"car-autocomplete-pick-up\"]",
  CAR_PICKUP_CITY_INPUT: ".manual-quote-car input[name=\"hotel-autocomplete-pick-up\"]",
  CAR_PICKUP_DATE_INPUT: ".manual-quote-car input[name=\"date-pick-up\"]",
  CAR_PICKUP_TIME_INPUT: ".manual-quote-car .app-columns:nth-child(1) input.app-timepicker-input",
  CAR_TIME_SELECTOR_POPPER: ".time-selector-popper:visible",
  // Hours/minutes el-selects inside the time popper — present in BOTH 12h and 24h
  // formats (the .section-ampm PM button only renders when isAmPm is true).
  CAR_TIME_HOURS_TRIGGER: ".section-time-select .app-column:nth-child(1) .el-select__wrapper",
  CAR_TIME_MINUTES_TRIGGER: ".section-time-select .app-column:nth-child(2) .el-select__wrapper",
  // Neutral, inert element to click to blur/commit the time popper (Escape does not
  // commit the value). Focusing the Comment textarea reliably collapses the picker.
  CAR_COMMIT_BLUR_TARGET: ".manual-quote-car textarea",
  CAR_DROPOFF_LOCATION_INPUT: ".manual-quote-car input[name=\"car-autocomplete-drop-off\"]",
  CAR_DROPOFF_CITY_INPUT: ".manual-quote-car input[name=\"hotel-autocomplete-drop-off\"]",
  CAR_DROPOFF_DATE_INPUT: ".manual-quote-car .app-columns:nth-of-type(2) .app-datepicker input",
  CAR_DROPOFF_TIME_INPUT: ".manual-quote-car .app-columns:nth-of-type(2) input.app-timepicker-input",
  CAR_CLASS_TRIGGER: ".manual-quote-car .field:has(label:has-text(\"Car Class\")) .el-select__wrapper",
  CAR_VENDOR_TRIGGER: ".manual-quote-car .field:has(label:has-text(\"Vendor\")) .el-select__wrapper",
  CAR_VENDOR_INPUT: ".manual-quote-car .field:has(label:has-text(\"Vendor\")) input",
  CAR_CANCELLATION_INPUT: ".manual-quote-car .field:has(label:has-text(\"Cancellation policy\")) input",
  CAR_CONFIRMATION_INPUT: ".manual-quote-car .field:has(label:has-text(\"Confirmation Number\")) input",
  CAR_BASE_FARE_INPUT: ".manual-quote-car .field:has(label:has-text(\"Base fare\")) input[type=\"number\"]",
  CAR_TAX_INPUT: ".manual-quote-car .field:has(label:has-text(\"Tax\")) input[type=\"number\"]",
  // Autocomplete dropdown — car-autocomplete uses "app-autocomplete-popper", hotel-autocomplete uses "hotel-autocomplete-popper"
  // Use :visible to avoid matching hidden poppers from previous interactions still in DOM
  CAR_AUTOCOMPLETE_OPTION: ".app-autocomplete-popper:visible .autocomplete-result, .hotel-autocomplete-popper:visible .autocomplete-result",

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

  // ===== GROUND TRANSPORT MANUAL QUOTE =====
  // The manual quote page section (confirms we navigated away from main search)
  MANUAL_QUOTE_PAGE_SECTION: ".manual-quote-page",
  // Tab: scoped within .manual-quote-page to avoid collision with main Transport tab (#tab-groundService)
  GROUND_TRANSPORT_TAB: ".manual-quote-page #tab-groundService",
  GROUND_TRANSPORT_SECTION: ".manual-quote-ground-transport",
  // Address autocomplete inputs (address-autocomplete.vue renders app-autocomplete with an input)
  GROUND_PICKUP_INPUT: ".manual-quote-ground-transport .app-columns:first-child .field:nth-child(1) .address-autocomplete input",
  GROUND_DROPOFF_INPUT: ".manual-quote-ground-transport .app-columns:first-child .field:nth-child(2) .address-autocomplete input",
  // Autocomplete suggestion dropdown (only visible popper — multiple exist in DOM)
  GROUND_AUTOCOMPLETE_OPTION: ".boxed-autocomplete-popper:not([style*='display: none']) .autocomplete-result",
  // Date picker (app-datepicker)
  GROUND_DATE_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Date\")) input",
  // Time picker (app-timepicker) — input is readonly, opens el-dropdown with time-selector-popper
  GROUND_HOUR_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Hour\")) input.app-timepicker-input",
  GROUND_TIME_POPPER: ".time-selector-popper",
  GROUND_TIME_HOURS_SELECT: ".time-selector-popper .section-time-select .app-column:nth-child(1) .el-select__wrapper",
  GROUND_TIME_MINUTES_SELECT: ".time-selector-popper .section-time-select .app-column:nth-child(2) .el-select__wrapper",
  GROUND_TIME_PM_BUTTON: ".time-selector-popper .section-ampm .time-part:last-child",
  // Vendor select (required, filterable app-select-v2)
  GROUND_VENDOR_TRIGGER: ".manual-quote-ground-transport .field:has(label:has-text(\"Vendor\")) .el-select__wrapper",
  GROUND_VENDOR_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Vendor\")) input",
  // Vendor phone — redesigned app-phone-input: country dropdown button + area/number text inputs
  GROUND_VENDOR_PHONE_COUNTRY_BTN: ".manual-quote-ground-transport .field:has(label:has-text(\"Vendor phone\")) .app-phone-input__country",
  GROUND_VENDOR_PHONE_AREA: ".manual-quote-ground-transport .field:has(label:has-text(\"Vendor phone\")) .app-phone-input__area",
  GROUND_VENDOR_PHONE_NUMBER: ".manual-quote-ground-transport .field:has(label:has-text(\"Vendor phone\")) .app-phone-input__number",
  // Country-code dropdown popover (teleported to <body> by el-popover; :visible scopes to the active one)
  PHONE_INPUT_POPOVER_SEARCH: ".app-phone-input-popover .app-phone-input__search input:visible",
  PHONE_INPUT_POPOVER_OPTION: ".app-phone-input-popover:visible .app-phone-input__option",
  // Vehicle type select (required, filterable app-select-v2)
  GROUND_VEHICLE_TYPE_TRIGGER: ".manual-quote-ground-transport .field:has(label:has-text(\"Vehicle type\")) .el-select__wrapper",
  GROUND_VEHICLE_TYPE_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Vehicle type\")) input",
  // Cancellation policy (required text input)
  GROUND_CANCELLATION_POLICY_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Cancellation policy\")) input",
  // Confirmation number (required text input)
  GROUND_CONFIRMATION_NUMBER_INPUT: ".manual-quote-ground-transport .field:has(label:has-text(\"Confirmation\")) input",
  // Base fare and tax (in .price-section)
  GROUND_BASE_FARE_INPUT: ".manual-quote-ground-transport .price-section .field:nth-child(1) input[type=\"number\"]",
  GROUND_TAX_INPUT: ".manual-quote-ground-transport .price-section .field:nth-child(3) input[type=\"number\"]",
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
    // Element-Plus keeps closed dropdowns in the DOM (see the VISIBLE_DROPDOWN_ITEM note above),
    // so a multi-segment round trip has the same carrier option present in more than one panel.
    // Scope to the visible panel to avoid a strict-mode multi-match or clicking a hidden option.
    await this.page
      .locator(SELECTORS.CARRIER_DROPDOWN_OPTION(carrierName))
      .locator("visible=true")
      .first()
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

  // ===== FLIGHT ROUND TRIP (multi-segment) =====

  /**
   * Clicks "Add another flight" to append a return-leg segment, then waits for the
   * new segment (index 1) to render.
   */
  async clickAddAnotherFlight() {
    const btn = this.page.locator(SELECTORS.ADD_ANOTHER_FLIGHT_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await this.page
      .locator(SELECTORS.FLIGHT_SEGMENT(1))
      .first()
      .waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Fills the "Departing From" airport for a specific flight segment, committing
   * the value with TAB (same as the single-segment fillInDepartingFromField).
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {string} from - Origin airport text
   */
  async fillSegmentDepartingFromField(segmentIndex, from) {
    const scoped = `${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${SELECTORS.DEPARTING_FROM_INPUT}`;
    await typeIntoNthAvailableInput(this.page, from, [scoped], 0);
    await pressTab(this.page);
    await this.page.waitForTimeout(100);
  }

  /**
   * Fills the "Arriving To" airport for a specific flight segment, committing the
   * value with TAB (same as the single-segment fillInArrivingToField).
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {string} to - Destination airport text
   */
  async fillSegmentArrivingToField(segmentIndex, to) {
    const scoped = `${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${SELECTORS.ARRIVING_TO_INPUT}`;
    await typeIntoNthAvailableInput(this.page, to, [scoped], 0);
    await pressTab(this.page);
    await this.page.waitForTimeout(100);
  }

  /**
   * Fills the flight number for a specific segment.
   * @param {number} segmentIndex
   * @param {string} flightNumber
   */
  async typeSegmentFlightNumber(segmentIndex, flightNumber) {
    await this.page
      .locator(`${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${SELECTORS.FLIGHT_NUMBER_FIELD}`)
      .first()
      .fill(flightNumber);
  }

  /**
   * Returns a segment leg's date <input> locator.
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {"departing"|"arriving"} kind
   * @returns {import('@playwright/test').Locator}
   */
  getSegmentDateInput(segmentIndex, kind) {
    const nameSelector =
      kind === "arriving" ? SELECTORS.SEGMENT_ARRIVING_DATE_INPUT : SELECTORS.DEPARTING_DATE_INPUT;
    return this.page.locator(`${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${nameSelector}`).first();
  }

  /**
   * Opens a segment leg's date picker.
   * @param {number} segmentIndex
   * @param {"departing"|"arriving"} kind
   */
  async clickSegmentDate(segmentIndex, kind) {
    const input = this.getSegmentDateInput(segmentIndex, kind);
    await input.scrollIntoViewIfNeeded().catch(() => {});
    await input.click();
  }

  /**
   * Reads a segment leg's currently-displayed date value (e.g. "Wed, Aug 19").
   * @param {number} segmentIndex
   * @param {"departing"|"arriving"} kind
   * @returns {Promise<string>}
   */
  async getSegmentDateValue(segmentIndex, kind) {
    return this.getSegmentDateInput(segmentIndex, kind).inputValue().catch(() => "");
  }

  /**
   * Fills the carrier locator (airline code) for a specific segment.
   * @param {number} segmentIndex
   * @param {string} carrierLocator
   */
  async typeSegmentCarrierLocator(segmentIndex, carrierLocator) {
    await this.page
      .locator(`${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${SELECTORS.CARRIER_LOCATOR_FIELD}`)
      .first()
      .fill(carrierLocator);
  }

  /**
   * Types into the carrier field for a specific segment to trigger the autocomplete
   * dropdown. The dropdown itself is teleported to <body>; select the option with the
   * shared clickCarrierDropdownOption.
   * @param {number} segmentIndex
   * @param {string} carrierName
   */
  async typeSegmentCarrierName(segmentIndex, carrierName) {
    const input = this.page
      .locator(`${SELECTORS.FLIGHT_SEGMENT(segmentIndex)} ${SELECTORS.CARRIER_INPUT}`)
      .first();
    await input.click();
    await input.fill(carrierName);
  }

  /**
   * Clicks a segment's time picker then blurs it by clicking the segment's flight-number
   * field, mirroring the single-segment clickStartTime/clickEndTime trick that commits
   * the value and triggers time validation.
   * @param {number} segmentIndex
   * @param {number} timeIndex - 0 = departing hour, 1 = arriving hour
   */
  async clickSegmentTime(segmentIndex, timeIndex) {
    const seg = SELECTORS.FLIGHT_SEGMENT(segmentIndex);
    await this.page.locator(`${seg} ${SELECTORS.TIME_PICKER_INPUTS}`).nth(timeIndex).click();
    await this.page.locator(`${seg} ${SELECTORS.FLIGHT_NUMBER_FIELD}`).first().click();
  }

  /**
   * Closes every open Element-Plus picker panel, so the next one opened is unambiguously the
   * only panel on screen.
   *
   * EP keeps a closing picker in the DOM while its fade-out runs, so a freshly opened picker
   * briefly coexists with the previous one. Anything that resolves "the open picker" during
   * that overlap can read one panel and click the other's arrow, or grab a panel that is about
   * to vanish mid-click. Escape is re-sent until nothing is visible.
   */
  async closeAllOpenDatePickers(timeout = 10000) {
    const panels = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE);
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await panels.count() === 0) return;
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(200);
    }
    throw new Error(
      `[ManualQuoteSearchPage.closeAllOpenDatePickers] ${await panels.count()} date picker(s) were `
      + `still visible after ${timeout}ms of Escape presses.`,
    );
  }

  /**
   * Waits until exactly one Element-Plus picker panel is visible AND has stopped animating, so
   * the panel a caller resolves next is stable. Requires two consecutive agreeing reads —
   * a single count of 1 can be caught mid-crossfade between two pickers.
   * Pair with closeAllOpenDatePickers before opening the picker.
   */
  async waitForSingleOpenDatePicker(timeout = 10000) {
    const panels = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE);
    const deadline = Date.now() + timeout;
    let settledReads = 0;
    while (Date.now() < deadline) {
      settledReads = await panels.count() === 1 ? settledReads + 1 : 0;
      if (settledReads >= 2) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(
      "[ManualQuoteSearchPage.waitForSingleOpenDatePicker] Expected exactly one settled visible "
      + `date picker after ${timeout}ms, found ${await panels.count()}.`,
    );
  }

  /**
   * Reads the month/year the currently-open picker is showing. Element-Plus splits the header
   * into a year label and a month label, so both are joined before parsing.
   * @returns {Promise<{year: number, monthIndex: number}>}
   */
  async getOpenPickerMonthAndYear() {
    const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE).last();
    await panel.waitFor({ state: "visible", timeout: 10000 });

    const headerTexts = (await panel.locator(SELECTORS.DATE_PICKER_HEADER_LABEL).allTextContents())
      .map((text) => text.trim())
      .filter((text) => text.length > 0);
    const combined = headerTexts.join(" ");

    const yearMatch = combined.match(/\d{4}/);
    const monthToken = headerTexts.find((text) => /^[A-Za-z]{3,9}\.?$/.test(text));
    if (!yearMatch || !monthToken) {
      throw new Error(
        "[ManualQuoteSearchPage.getOpenPickerMonthAndYear] Could not read a month and year from "
        + `the open picker header: "${combined}"`,
      );
    }

    const monthIndex = MONTH_ABBR_TO_INDEX[monthToken.toLowerCase().replace(/\./g, "").slice(0, 3)];
    if (monthIndex === undefined) {
      throw new Error(
        `[ManualQuoteSearchPage.getOpenPickerMonthAndYear] Unrecognised month "${monthToken}" in `
        + "the open picker header.",
      );
    }

    return { year: Number(yearMatch[0]), monthIndex };
  }

  /**
   * Navigates the currently-open picker to a target month.
   *
   * Resolves the header and the month arrows inside the SAME panel, and re-reads the header
   * after every click so an overshoot corrects itself — a closing picker briefly coexists with
   * the one just opened, and the shared calendar helper reads one while clicking the other's
   * arrow, which either stalls the month or runs it years past the target.
   *
   * @param {Date} targetDate
   * @param {number} [maxSteps=24] Max arrow clicks before giving up
   */
  async navigateOpenPickerToMonth(targetDate, maxSteps = 24) {
    for (let step = 0; step <= maxSteps; step++) {
      const { year, monthIndex } = await this.getOpenPickerMonthAndYear();
      const monthDiff =
        ((targetDate.getFullYear() - year) * 12) + (targetDate.getMonth() - monthIndex);
      if (monthDiff === 0) return;
      if (step === maxSteps) break;

      const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE).last();
      const arrow = panel.locator(
        monthDiff > 0 ? SELECTORS.DATE_PICKER_NEXT_MONTH_ARROW : SELECTORS.DATE_PICKER_PREV_MONTH_ARROW,
      ).first();
      await arrow.waitFor({ state: "visible", timeout: 10000 });
      // The panel repositions itself as it opens, so the arrow reports "not stable"; a forced
      // click skips the actionability wait. The header re-read on the next iteration is what
      // confirms the click landed.
      await arrow.click({ force: true });
    }

    const { year, monthIndex } = await this.getOpenPickerMonthAndYear();
    throw new Error(
      "[ManualQuoteSearchPage.navigateOpenPickerToMonth] Could not reach "
      + `${targetDate.getMonth() + 1}/${targetDate.getFullYear()} within ${maxSteps} arrow clicks — `
      + `the picker is showing ${monthIndex + 1}/${year}.`,
    );
  }

  /**
   * Force-clicks a specific day number in the currently-open Element-Plus date picker.
   * The picker for a lower flight segment can report a transient "not stable/visible" state
   * during its open animation/repositioning; a forced click on the resolved day cell avoids
   * the flaky actionability wait. Assumes the target month is already visible.
   * @param {number|string} dayNumber - Day of month to select (e.g. 19)
   */
  async clickDayInOpenPicker(dayNumber) {
    const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE).last();
    await panel.waitFor({ state: "visible", timeout: 10000 });
    const cell = panel
      .locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY)
      .filter({ hasText: new RegExp(`^${dayNumber}$`) })
      .first();
    await cell.waitFor({ state: "attached", timeout: 10000 });
    await cell.scrollIntoViewIfNeeded().catch(() => {});
    await cell.click({ force: true });
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
  async selectHotelCity(city, timeout = 15000) {
    try {
      const input = this.page.locator(SELECTORS.HOTEL_CITY_INPUT).first();
      await input.click();
      await input.fill(city);

      // Wait for debounce (300ms) + API response to stabilize results
      await this.page.waitForTimeout(500);

      const option = this.page.locator(SELECTORS.HOTEL_CITY_DROPDOWN_OPTION).first();
      await option.waitFor({ state: "visible", timeout });
      await option.click();

      // Verify the dropdown closed (confirming selection registered with el-autocomplete)
      await this.page.locator(SELECTORS.HOTEL_CITY_DROPDOWN_OPTION).first()
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(async () => {
          // Dropdown didn't close — retry click on the option
          const retryOption = this.page.locator(SELECTORS.HOTEL_CITY_DROPDOWN_OPTION).first();
          if (await retryOption.isVisible()) {
            await retryOption.click();
            await this.page.waitForTimeout(300);
          }
        });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.selectHotelCity] Could not select city "${city}" from autocomplete dropdown ` +
        `(input: ${SELECTORS.HOTEL_CITY_INPUT}, options: ${SELECTORS.HOTEL_CITY_DROPDOWN_OPTION}). ` +
        `The dropdown may not have returned results or the selection did not register. ` +
        `Original: ${err.message}`
      );
    }
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
    try {
      await this.page.locator(selector).first().click({ timeout: 10000 });
      await this.page
        .locator(SELECTORS.SELECT_DROPDOWN_OPTION)
        .first()
        .waitFor({ state: "visible", timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.openHotelSelect] Could not open the "${field}" dropdown ` +
        `(selector: ${selector}). The select trigger was not clickable or dropdown options ` +
        `did not appear within 10s — likely the form has not finished rendering. ` +
        `Original: ${err.message}`
      );
    }
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

  // ===== CAR MANUAL QUOTE FORM =====

  async waitForCarFormVisible() {
    try {
      await this.page
        .locator(SELECTORS.CAR_FORM_SECTION)
        .first()
        .waitFor({ state: "visible", timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.waitForCarFormVisible] Car manual quote form (selector: ${SELECTORS.CAR_FORM_SECTION}) ` +
        `did not become visible within 20s — likely the Car tab click did not register or the form is still loading. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillCarPickupLocation(location) {
    try {
      const input = this.page.locator(SELECTORS.CAR_PICKUP_LOCATION_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(location);
      const option = this.page.locator(SELECTORS.CAR_AUTOCOMPLETE_OPTION).first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
      await this.page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarPickupLocation] Could not fill pickup location "${location}" ` +
        `(selector: ${SELECTORS.CAR_PICKUP_LOCATION_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillCarPickupCity(city) {
    try {
      const input = this.page.locator(SELECTORS.CAR_PICKUP_CITY_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(city);
      const option = this.page.locator(SELECTORS.CAR_AUTOCOMPLETE_OPTION).first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
      await this.page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarPickupCity] Could not fill pickup city "${city}" ` +
        `(selector: ${SELECTORS.CAR_PICKUP_CITY_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillCarDropoffLocation(location) {
    try {
      const input = this.page.locator(SELECTORS.CAR_DROPOFF_LOCATION_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(location);
      const option = this.page.locator(SELECTORS.CAR_AUTOCOMPLETE_OPTION).first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
      await this.page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarDropoffLocation] Could not fill dropoff location "${location}" ` +
        `(selector: ${SELECTORS.CAR_DROPOFF_LOCATION_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillCarDropoffCity(city) {
    try {
      const input = this.page.locator(SELECTORS.CAR_DROPOFF_CITY_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(city);
      const option = this.page.locator(SELECTORS.CAR_AUTOCOMPLETE_OPTION).first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click();
      await this.page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarDropoffCity] Could not fill dropoff city "${city}" ` +
        `(selector: ${SELECTORS.CAR_DROPOFF_CITY_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickCarPickupDateInput() {
    try {
      const input = this.page.locator(SELECTORS.CAR_PICKUP_DATE_INPUT).first();
      await input.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickCarPickupDateInput] Could not click the pickup date input ` +
        `(selector: ${SELECTORS.CAR_PICKUP_DATE_INPUT}). Original: ${err.message}`
      );
    }
  }

  async clickCarDropoffDateInput() {
    try {
      const input = this.page.locator(SELECTORS.CAR_DROPOFF_DATE_INPUT).first();
      await input.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickCarDropoffDateInput] Could not click the dropoff date input ` +
        `(selector: ${SELECTORS.CAR_DROPOFF_DATE_INPUT}). Original: ${err.message}`
      );
    }
  }

  /**
   * Opens a car time-picker's popper and returns the visible popper locator.
   * Each timepicker teleports its own .time-selector-popper to <body>, and a
   * just-closed one (e.g. pickup's) can still be transitioning out when the next
   * (dropoff's) opens — so target the LAST visible popper. Retries the open once
   * in case the click's popper closes mid-transition.
   */
  async _openCarTimePopper(input, triggerSelector) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      await input.click({ timeout: 10000 });
      await this.page.waitForTimeout(400); // let the open animation settle
      const popper = this.page.locator(SELECTORS.CAR_TIME_SELECTOR_POPPER).last();
      try {
        await popper.waitFor({ state: "visible", timeout: 5000 });
        await popper.locator(triggerSelector).waitFor({ state: "visible", timeout: 5000 });
        return popper;
      } catch (openErr) {
        if (attempt === 2) throw openErr;
        await this.page.waitForTimeout(400);
      }
    }
  }

  /**
   * Sets a car time-picker to an explicit hour:minute by selecting from the two
   * el-select dropdowns inside the time popper. The time input is readonly, so it
   * can only be set through the popper. Works in BOTH 24-hour ("00:00") and 12-hour
   * ("hh:mm a") display modes — unlike clicking the AM/PM toggle, which only exists
   * in 12-hour mode. Leaving the field empty fails required-field validation and
   * silently blocks "Add Quote".
   *
   * Both hour AND minute must be set, and the value only commits when the picker
   * loses focus — Escape does not commit — so we blur by clicking the Comment box.
   * After picking the hour the popper may collapse, so if it's no longer open the
   * minute is set in a fresh open of the same picker (the prior hour selection
   * persists via modelValue).
   *
   * @param {string} timeInputSelector - locator for the readonly time input
   * @param {string} label - method name for error messages
   * @param {object} [opts]
   * @param {string} [opts.hour="10"] - hour option text (24h "10" / 12h "10" both valid)
   * @param {string} [opts.minute="00"] - minute option text
   */
  async _setCarTime(timeInputSelector, label, { hour = "10", minute = "00" } = {}) {
    try {
      const input = this.page.locator(timeInputSelector).first();

      // --- Hour ---
      let popper = await this._openCarTimePopper(input, SELECTORS.CAR_TIME_HOURS_TRIGGER);
      await popper.locator(SELECTORS.CAR_TIME_HOURS_TRIGGER).click({ timeout: 5000 });
      await this.page
        .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM, { hasText: new RegExp(`^\\s*${hour}\\s*$`) })
        .first()
        .click({ timeout: 5000 });
      await this.page.waitForTimeout(400);

      // --- Minute --- (popper collapses after the hour pick; reopen if needed)
      popper = this.page.locator(SELECTORS.CAR_TIME_SELECTOR_POPPER).last();
      const stillOpen = await popper
        .locator(SELECTORS.CAR_TIME_MINUTES_TRIGGER)
        .isVisible()
        .catch(() => false);
      if (!stillOpen) {
        popper = await this._openCarTimePopper(input, SELECTORS.CAR_TIME_MINUTES_TRIGGER);
      }
      await popper.locator(SELECTORS.CAR_TIME_MINUTES_TRIGGER).click({ timeout: 5000 });
      await this.page
        .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM, { hasText: new RegExp(`^\\s*${minute}\\s*$`) })
        .first()
        .click({ timeout: 5000 });

      // --- Commit --- blur the picker by focusing a neutral field (Escape won't commit).
      await this.page.locator(SELECTORS.CAR_COMMIT_BLUR_TARGET).first().click({ timeout: 5000 });
      await this.page.waitForTimeout(300);

      // Verify the value actually committed — closing an unset picker finalizes to
      // "00:00" (the value that fails validation), so assert the chosen hour stuck
      // rather than merely non-empty. Both "10:00" (24h) and "10:00 AM" (12h) match.
      const value = (await input.inputValue()).trim();
      if (!value || !value.includes(hour)) {
        throw new Error(`the time input reads "${value}" after selecting ${hour}:${minute}`);
      }
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.${label}] Could not set the time to ${hour}:${minute}. ` +
        `The time picker popper (class: time-selector-popper) or its hours/minutes ` +
        `el-select was not available. Original: ${err.message}`
      );
    }
  }

  async setCarPickupTime(opts) {
    await this._setCarTime(SELECTORS.CAR_PICKUP_TIME_INPUT, "setCarPickupTime", opts);
  }

  async setCarDropoffTime(opts) {
    await this._setCarTime(SELECTORS.CAR_DROPOFF_TIME_INPUT, "setCarDropoffTime", opts);
  }

  async selectCarClass(carClass) {
    try {
      await this.page.locator(SELECTORS.CAR_CLASS_TRIGGER).first().click({ timeout: 10000 });
      await this.page
        .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM, { hasText: carClass })
        .first()
        .click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.selectCarClass] Could not select car class "${carClass}" ` +
        `(trigger: ${SELECTORS.CAR_CLASS_TRIGGER}). The select or option was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async selectCarVendor(vendor) {
    try {
      await this.page.locator(SELECTORS.CAR_VENDOR_TRIGGER).first().click({ timeout: 10000 });
      const input = this.page.locator(SELECTORS.CAR_VENDOR_INPUT).first();
      await input.fill(vendor);
      await this.page.waitForTimeout(500);
      await this.page
        .locator(SELECTORS.VISIBLE_DROPDOWN_ITEM)
        .first()
        .click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.selectCarVendor] Could not select vendor "${vendor}" ` +
        `(trigger: ${SELECTORS.CAR_VENDOR_TRIGGER}). The select or option was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillCarCancellationPolicy(policy) {
    try {
      const input = this.page.locator(SELECTORS.CAR_CANCELLATION_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(policy);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarCancellationPolicy] Could not fill cancellation policy "${policy}" ` +
        `(selector: ${SELECTORS.CAR_CANCELLATION_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillCarConfirmationNumber(confirmationNum) {
    try {
      const input = this.page.locator(SELECTORS.CAR_CONFIRMATION_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(confirmationNum);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarConfirmationNumber] Could not fill confirmation number "${confirmationNum}" ` +
        `(selector: ${SELECTORS.CAR_CONFIRMATION_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillCarBaseFare(amount) {
    try {
      const input = this.page.locator(SELECTORS.CAR_BASE_FARE_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(amount));
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarBaseFare] Could not fill base fare "${amount}" ` +
        `(selector: ${SELECTORS.CAR_BASE_FARE_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillCarTax(amount) {
    try {
      const input = this.page.locator(SELECTORS.CAR_TAX_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(amount));
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillCarTax] Could not fill tax "${amount}" ` +
        `(selector: ${SELECTORS.CAR_TAX_INPUT}). Original: ${err.message}`
      );
    }
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

  // ===== GROUND TRANSPORT MANUAL QUOTE =====

  async waitForManualQuotePageVisible() {
    try {
      await this.page.locator(SELECTORS.MANUAL_QUOTE_PAGE_SECTION).first()
        .waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.waitForManualQuotePageVisible] Manual Quote page section did not appear ` +
        `(selector: ${SELECTORS.MANUAL_QUOTE_PAGE_SECTION}) within 15s — the Manual Quote tab click may not have worked. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickGroundTransportTab() {
    try {
      await this.page.locator(SELECTORS.GROUND_TRANSPORT_TAB).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickGroundTransportTab] Could not click the Ground Transport tab ` +
        `(selector: ${SELECTORS.GROUND_TRANSPORT_TAB}). The tab was not visible within 10s. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForGroundTransportFormVisible() {
    try {
      await this.page.locator(SELECTORS.GROUND_TRANSPORT_SECTION).first()
        .waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.waitForGroundTransportFormVisible] Ground transport form did not appear ` +
        `(selector: ${SELECTORS.GROUND_TRANSPORT_SECTION}) within 15s. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillGroundPickup(address) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_PICKUP_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(address);
      const visibleOption = this.page.locator(SELECTORS.GROUND_AUTOCOMPLETE_OPTION).locator("visible=true").first();
      await visibleOption.waitFor({ state: "visible", timeout: 10000 });
      await visibleOption.click();
      // Wait for dropdown to close before proceeding
      await this.page.waitForTimeout(500);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundPickup] Could not fill pickup address "${address}" ` +
        `(selector: ${SELECTORS.GROUND_PICKUP_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillGroundDropoff(address) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_DROPOFF_INPUT).first();
      await input.click({ timeout: 10000 });
      await input.fill(address);
      const visibleOption = this.page.locator(SELECTORS.GROUND_AUTOCOMPLETE_OPTION).locator("visible=true").first();
      await visibleOption.waitFor({ state: "visible", timeout: 10000 });
      await visibleOption.click();
      // Wait for dropdown to close before proceeding
      await this.page.waitForTimeout(500);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundDropoff] Could not fill dropoff address "${address}" ` +
        `(selector: ${SELECTORS.GROUND_DROPOFF_INPUT}). The input or autocomplete dropdown was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickGroundDateInput() {
    try {
      await this.page.locator(SELECTORS.GROUND_DATE_INPUT).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.clickGroundDateInput] Could not click the date input ` +
        `(selector: ${SELECTORS.GROUND_DATE_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillGroundHour(hour) {
    try {
      // Click the timepicker input to open the dropdown
      const input = this.page.locator(SELECTORS.GROUND_HOUR_INPUT).first();
      await input.click({ timeout: 10000 });
      // Wait for the time selector popper to appear (scope to visible one)
      const visiblePopper = this.page.locator(SELECTORS.GROUND_TIME_POPPER).locator("visible=true");
      await visiblePopper.waitFor({ state: "visible", timeout: 5000 });
      // Default is 12:00 AM — just click PM to get 12:00 PM
      await visiblePopper.locator(".section-ampm .time-part:last-child").click({ timeout: 5000 });
      // Close popper by pressing Escape
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundHour] Could not fill hour "${hour}" ` +
        `(selector: ${SELECTORS.GROUND_HOUR_INPUT}). The time popper or PM button were not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async selectGroundVehicleType(vehicleType) {
    try {
      await this.page.locator(SELECTORS.GROUND_VEHICLE_TYPE_TRIGGER).first().click({ timeout: 10000 });
      // "All Types" is excluded from the dropdown by the app — select first available instead
      if (vehicleType.toLowerCase().includes("all")) {
        await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEM).first()
          .click({ timeout: 10000 });
      } else {
        await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEM, { hasText: vehicleType }).first()
          .click({ timeout: 10000 });
      }
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.selectGroundVehicleType] Could not select vehicle type "${vehicleType}" ` +
        `(trigger: ${SELECTORS.GROUND_VEHICLE_TYPE_TRIGGER}). The select or option was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async selectGroundVendor(vendor) {
    try {
      await this.page.locator(SELECTORS.GROUND_VENDOR_TRIGGER).first().click({ timeout: 10000 });
      // Use only the first word for filtering to avoid typos/partial mismatches
      const filterTerm = vendor.split(" ")[0];
      await this.page.locator(SELECTORS.GROUND_VENDOR_INPUT).first().fill(filterTerm);
      await this.page.waitForTimeout(500);
      // Click the first visible dropdown option after filtering
      await this.page.locator(SELECTORS.VISIBLE_DROPDOWN_ITEM).first().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.selectGroundVendor] Could not select vendor "${vendor}" ` +
        `(trigger: ${SELECTORS.GROUND_VENDOR_TRIGGER}). The select or option was not available. ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillGroundVendorPhone(phone) {
    try {
      // Split phone into country code (first 1 digit), area code (next 3), number (rest)
      const countryCode = phone.substring(0, 1);
      const areaCode = phone.substring(1, 4);
      const number = phone.substring(4);

      // Open the country-code dropdown
      const countryBtn = this.page.locator(SELECTORS.GROUND_VENDOR_PHONE_COUNTRY_BTN);
      await countryBtn.waitFor({ state: 'visible', timeout: 10000 });
      await countryBtn.click();

      // Search for the dial code and pick the first matching option
      const searchInput = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_SEARCH);
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.fill(countryCode);
      const option = this.page.locator(SELECTORS.PHONE_INPUT_POPOVER_OPTION)
        .filter({ hasText: `+${countryCode}` })
        .first();
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();

      // Fill area code and phone number
      const areaInput = this.page.locator(SELECTORS.GROUND_VENDOR_PHONE_AREA);
      await areaInput.waitFor({ state: 'visible', timeout: 5000 });
      await areaInput.fill(areaCode);
      const numberInput = this.page.locator(SELECTORS.GROUND_VENDOR_PHONE_NUMBER);
      await numberInput.fill(number);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundVendorPhone] Could not fill vendor phone "${phone}". ` +
        `Original: ${err.message}`
      );
    }
  }

  async fillGroundCancellationPolicy(policy) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_CANCELLATION_POLICY_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(policy);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundCancellationPolicy] Could not fill cancellation policy "${policy}" ` +
        `(selector: ${SELECTORS.GROUND_CANCELLATION_POLICY_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillGroundConfirmationNumber(number) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_CONFIRMATION_NUMBER_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(number);
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundConfirmationNumber] Could not fill confirmation number "${number}" ` +
        `(selector: ${SELECTORS.GROUND_CONFIRMATION_NUMBER_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillGroundBaseFare(amount) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_BASE_FARE_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(amount));
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundBaseFare] Could not fill base fare "${amount}" ` +
        `(selector: ${SELECTORS.GROUND_BASE_FARE_INPUT}). Original: ${err.message}`
      );
    }
  }

  async fillGroundTax(amount) {
    try {
      const input = this.page.locator(SELECTORS.GROUND_TAX_INPUT).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(amount));
    } catch (err) {
      throw new Error(
        `[ManualQuoteSearchPage.fillGroundTax] Could not fill tax "${amount}" ` +
        `(selector: ${SELECTORS.GROUND_TAX_INPUT}). Original: ${err.message}`
      );
    }
  }
}

module.exports = ManualQuoteSearchPage;
