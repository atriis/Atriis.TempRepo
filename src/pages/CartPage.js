const { expect } = require("@playwright/test");
const { waitForText } = require("@utils/wait");
const { parseAmountText } = require("@utils/dom");

/**
 * Page Object for cart page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {

  // Cart general selectors
  TERMS_CHECKBOX: ".quote-terms-checkbox .el-checkbox__inner",
  TERMS_CHECKBOX_INPUT: ".quote-terms-checkbox .el-checkbox__input",
  PROCEED_TO_CHECKOUT_BUTTON: ".btn-container:has-text('Proceed to Checkout')",
  QUOTE_STATUS_LABEL: ".app-label--quote",
  QUOTE_CARD_STATUS_LABEL: '.quote-payment-card .app-label--quote',
  ANY_STATUS_LABEL: '.app-label, .app-label--quote',
  HOLD_BUTTON: ".btn--default.mt-2",

  // Refundable hotel text
  REFUNDABLE_TEXT: "div.refundable",
  // div.cancellation-terms is always present in hotel-preview (cart); the <p> inside carries the policy text
  CANCELLATION_POLICY_LABEL: "div.cancellation-terms p",

  // Price breakdown button
  PRICE_BREAKDOWN_BUTTON: ".price-breakdown-btn",
  PRICE_BREAKDOWN_CLOSE_BUTTON: '.app-drawer.flight-price-breakdown-drawer [aria-label="Close this dialog"]',
  PRICE_BREAKDOWN_BOOKED_BY: '.flight-price-breakdown-drawer p.booked-by-at',
  PRICE_BREAKDOWN_MINI_RULE_DISCLAIMER: '.flight-price-breakdown-drawer .mini-rule-disclaimer',
  FLIGHT_PRICE_BREAKDOWN_DRAWER: '.flight-price-breakdown-drawer',
  FLIGHT_PRICE_BREAKDOWN_SEGMENT: '.price-breakdown-segment',
  FLIGHT_PRICE_BREAKDOWN_PASSENGER_NAME: '.passenger-name',
  FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_LABEL: '.rate-information .amounts .subtotal > div > span:first-child',
  FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE: '.change-cancel-fees .cancel-fee',
  FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE_BEFORE_DEPARTURE: '.fee-section-wrapper > div:first-child',
  FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE_AFTER_DEPARTURE: '.fee-section-wrapper > .after-departure',
  FLIGHT_PRICE_BREAKDOWN_RATE_ROW: '.rate-information .amounts > div',
  FLIGHT_PRICE_BREAKDOWN_ROW_AMOUNT: '.amount',
  FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_ROW: '.rate-information .amounts .subtotal',
  FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_PASSENGERS: '.passengers',
  FLIGHT_PRICE_BREAKDOWN_TOTAL: '.summary-and-actions .amount',
  FLIGHT_CO2_TOOLTIP_TRIGGER_IN_CART: '.flight-quote-card .co2-emissions-label .info-icon',
  FLIGHT_CO2_TOOLTIP_TRIGGER_IN_MORE_DETAILS: "[aria-label='More details'] .co2-emissions-label .info-icon",
  FLIGHT_CO2_TOOLTIP_DESCRIPTION: '.co2-emissions-tooltip .emission-description-bold',
  FLIGHT_QUOTE_CARD: '.flight-quote-card',
  FLIGHT_QUOTE_SEGMENT: '.flight-info.cart-format',
  FLIGHT_SEGMENT_CARRIER_NAME: '.carrier-container .carrier-name',
  FLIGHT_SEGMENT_FLIGHT_NUMBER_TEXT: '.carrier-container .carrier-name + p',
  FLIGHT_SEGMENT_TIME: '.flight-time',
  FLIGHT_QUOTE_LOCATION_CODE: '.loc-code',

  // Trip cancellation selectors
  TRIP_ACTIONS_DROPDOWN_ICON: ".dropdowns-container .expand-icon",
  CANCEL_TRIP_OPTION: ".el-dropdown-menu__item span.mr-2",
  CANCEL_TRIP_DROPDOWN_ITEM: ".el-dropdown-menu__item",
  SHOW_CANCELLED_ITEMS_OPTION: '.el-dropdown-menu__item',
  TRIP_CANCELLATION_DIALOG_TITLE: "[aria-label='Trip cancellation'] .el-dialog__title",
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS_MESSAGE: "text='Cancellation confirmed!'",
  CANCELLED_QUOTES_SECTION: '.cancelled-quotes-container',
  CANCELLED_QUOTES_TITLE: '.cancelled-quotes-title',
  CANCELLED_QUOTE_CHECK_PRICE_BUTTON: '.cancelled-quotes-container .check-price-btn',
  ACTIVE_QUOTE_ACTIONS_DROPDOWN_ICON: '.quote-payment-card .base-quote-header .expand-icon.is-clickable',
  ACTIVE_QUOTE_CANCEL_OPTION: '.el-dropdown-menu__item',
  BASIC_CANCEL_QUOTE_DIALOG: '.app-confirm.dialog-no-header',
  BASIC_CANCEL_QUOTE_CONFIRM_BUTTON: '.dialog-no-header .btn--primary',
  DETAILED_CANCEL_QUOTE_MODAL: '.cancel-quote-modal',
  DETAILED_CANCEL_QUOTE_CONFIRM_BUTTON: '.cancel-quote-modal .app-footer .btn--primary',
  DETAILED_CANCEL_QUOTE_CLOSE_BUTTON: '.cancel-quote-modal .close-btn',

  // Product details selectors
  FLIGHT_DETAILS_BUTTON: ".more-details-btn",
  POST_TICKETING_TABLE_HEADERS: '.flight-post-ticketing-details .post-ticketing-table thead th',
  POST_TICKETING_TABLE: '.flight-post-ticketing-details .post-ticketing-table',
  POST_TICKETING_TICKET_NUMBER_TEXT: 'tbody tr td:nth-child(2) .mr-1:visible',
  POST_TICKETING_FIRST_SEAT_BUTTON: '.flight-post-ticketing-details .post-ticketing-table tbody tr:first-child td:nth-child(5) .add-seats-btn',
  MORE_DETAILS_HOTEL_BUTTON: ".more-details",
  MORE_DETAILS_CAR_BUTTON: ".more-details.is-flex",
  LOCATION_LABEL: '.location-label',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',

  // Trip Overview selectors
  TRIP_OVERVIEW_TITLE: ".payments-title",
  TRIP_OVERVIEW_STATUS_LABEL: 'xpath=//*[contains(@class,"payments-title")]/following-sibling::*[contains(@class,"app-label")][1]',

  // Trip title and destination selectors (cart-info-bar.vue)
  TRIP_TITLE: '.cart-info-bar h4.trip-title',
  TRIP_DESTINATION_INFO: '.cart-info-bar .info-wrapper p',

  // Quote title selector (base-quote-header.vue)
  QUOTE_TITLE: '.quote-payment-card h6.quote-title',
  FLIGHT_QUOTE_HEADING_TEXT: 'Flight to',
  FIRST_QUOTE_TITLE: '.quote-payment-card:not(.last-quote) h6.quote-title',
  LAST_QUOTE_TITLE: '.last-quote h6.quote-title',
  LAST_QUOTE_STATUS_LABEL: '.last-quote .app-label--quote',
  PNR_CODE: '.pnr-code',
  FLIGHT_QUOTE_NUMBER_TEXT: '.flight-info.cart-format .carrier-container .carrier-name + p',

  // OOP Justification selectors
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
  OOP_JUSTIFICATION_SECTION: '.oop-justification', // Section containing the OOP justification dropdown/text (oop-justification.vue)
  OOP_JUSTIFICATION_SELECT: '.oop-justification .app-select .el-select', // The el-select wrapper inside the OOP justification section
  OOP_JUSTIFICATION_SELECTED_VALUE: '.oop-justification .el-select__selected-item',
  
  // Extras
  EDIT_EXTRAS_BUTTON: ".extra__btns", //All edit buttons in extras section have the same class, so we will use nth(index) to click the right one when needed
  EXTRAS_INFORMATION_FIELD: '.el-select__selected-item span', // The field that shows selected extra option
  EXTRAS_ARROW_BUTTON: '.px-4.ticket-bottom.py-4 .el-icon.el-collapse-item__arrow', // Arrow button to expand/collapse extras information
  // Premier Inn extras selectors (premier-inn.vue)
  PREMIER_INN_PAYMENT_SELECT: '.quote-extras--premier-inn .extras-card .el-select', // First el-select in Premier Inn extras = payment method

  // General
  ADD_SEATS_BUTTON: 'button:has-text("Add Seats")', // Button to open seat selection (text from $t('btn.add') + $t('common.seats'))
  SEAT_MAP_CONTAINER: '.deck-wrapper', // Appears only when seat map data is loaded (v-if="!isLoading && seatsMap.length > 0")
  SEAT_MAP_UNAVAILABLE_STATE: '.flight-deck .no-results',
  SEAT_MAP_LOADING_MASK: '.flight-deck .el-loading-mask',
  SEAT_ELEMENT: '.seat', // div.seat inside plane-seat.vue component
  SEAT_MAP_PRICE: '.total-sum-wrapper .price', // Price element in the seat map footer (app-price component)
  SEAT_MAP_SAVE_CLOSE_BUTTON: 'button:has-text("Save And Close")', // Save & Close button in seat map drawer
  CART_TOTAL_PRICE: '.price-total .amount', // Grand total in the cart summary sidebar (trip-summary.vue)
  NUMBER_OF_BAGGAGE_DROPDOWN_FIELD: "//span[normalize-space()='Number of baggage']", // XPath used due to complex dropdown structure - TODO: adjust when we have a data-test-id selector.
  DROPDOWN_OPTION: 'li.el-select-dropdown__item', // Dropdown option selector (used with hasText filter for partial matching)
  BAGGAGE_CLICKABLE: '.flight-baggage .is-clickable',
  BAGGAGE_SAVE_BUTTON: '.flight-baggage .no-border',
  BAGGAGE_TRAVELER_TAB: '.flight-baggage .flight-cart-tabs .el-tabs__item:visible',
  GREEN_ICON_BAGGAGE: ".flight-baggage .material-symbols-outlined.filled.success-icon.green",  // Green icon next to added baggage
  BAGGAGE_SELECTED_TAG: '.flight-baggage .el-tab-pane:visible .el-tag',
  BAGGAGE_SELECTED_OPTION: '.flight-baggage .el-select__selected-item span', // Selected baggage option text inside the flight-baggage section
  
  // Flight Seating (flight-seating.vue)
  SEATING_EDIT_BUTTON: ".flight-seating .extra__btns", // Edit/Add button in the seating extras row (scoped to flight-seating to avoid matching other extras buttons)
  SEATING_TRAVELER_ROW: '.flight-seating .pax-seat',

  // Flight Meals (flight-meals.vue)
  MEAL_EDIT_BUTTON: ".flight-meals .extra__btns", // Edit/Add button in the meal extras row (scoped to flight-meals to avoid matching other extras buttons)
  MEAL_DROPDOWN_CARET: ".flight-meals .el-select__caret",
  MEAL_DROPDOWN_OPTION_TEXT: '.el-select-dropdown__item span',
  MEAL_SAVE_BUTTON: ".flight-meals .no-border",
  MEAL_CANCEL_BUTTON: ".flight-meals .clear-btn",
  MEAL_SELECTED_TEXT: ".flight-meals .el-select__placeholder span",
  MEAL_STATUS_HELP_TEXT: ".flight-meals .help",
  
  // Delivery Method (UK Rail) selectors
  DELIVERY_METHOD_SECTION: ".uk-rail-delivery-method",
  DELIVERY_METHOD_CLICKABLE: ".uk-rail-delivery-method .is-clickable",
  DELIVERY_METHOD_TITLE: ".uk-rail-delivery-method .card-title",
  DELIVERY_METHOD_FIRST_RADIO: ".uk-rail-delivery-method .el-radio-group > :nth-child(1) .el-radio__inner",
  GREEN_ICON_DELIVERY_METHOD: ".uk-rail-delivery-method .material-symbols-outlined",

  // "Provided by" label in cart hotel preview (hotel-provided-by.vue)
  PROVIDER_LABEL: 'section.hotel-preview .provider-label',
  HOTEL_PREVIEW_NAME: 'section.hotel-preview .quote-names-container h4',
  // Hotel quote price in cart (hotel-quote-card.vue → app-price → h4.amount)
  HOTEL_QUOTE_PRICE: '.quote-payment-card .price-wrapper .amount',
  FLIGHT_QUOTE_DISPLAY_PRICE: '.flight-quote-summary .quote-price',
  FLIGHT_QUOTE_ORIGINAL_PRICE: '.flight-quote-summary .original-price',
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
  VOUCHER_DOWNLOAD_LINKS: ".voucher-box .download-links",

  // Share itinerary / quotes dropdown
  SHARE_BUTTON: ".share-container .share-btn",
  SHARE_POPPER_MENU: "ul.share-popper[role='menu']:visible",

  // Add product from cart product carousel
  ADD_HOTEL_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Hotel")',
  ADD_FLIGHT_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Flight")',
  ADD_HOTEL_SEARCH_DRAWER: '.app-drawer.atrs-edit-search-drawer',

  // Seat map segment tabs (flight-deck.vue el-tabs)
  SEAT_MAP_SEGMENT_TAB: '.flights-tabs .el-tabs__item', // Tab items for outbound/inbound segments
  SEAT_MAP_ACTIVE_SEGMENT_TAB: '.flights-tabs .el-tabs__item.is-active',
  // Next flight button in seat map drawer footer (flight-deck.vue app-btn class="cancel-btn" type="primary")
  NEXT_FLIGHT_BUTTON: 'button:has-text("Next flight")',
  // Seat tooltip red message (plane-seat.vue — .tooltip-item.red for unselectableMessage or cantBuyPaidSeats)
  // The tooltip is rendered by Element Plus as .el-popper.is-light (effect="light" in plane-seat.vue)
  SEAT_TOOLTIP_RED_MESSAGE: '.el-popper.is-light .tooltip-item.red',
  // First available seat in the deck (has a seat number visible)
  FIRST_AVAILABLE_SEAT: '.deck-wrapper .seat',

  // Seating icon in extras section (flight-seating.vue — .yellow class = PendingApproval/PendingPayment)
  SEAT_ICON_IN_EXTRAS: '.flight-seating .material-symbols-outlined.seats',

  // Traveler initials (trip-traveler-tag.vue)
  TRAVELER_INITIALS: '.avatar-initials',

  // Hotel autocomplete destination value (hotel-autocomplete inside cart search drawer)
  HOTEL_SEARCH_DESTINATION_INPUT: ".hotel-autocomplete .el-input__inner",
  HOTEL_SEARCH_CHECK_IN_INPUT: "[placeholder='Check in']",
  HOTEL_SEARCH_CHECK_OUT_INPUT: "[placeholder='Check out']",

  // Passenger title (Travelodge extras - passenger-title.vue)
  PASSENGER_TITLE_SECTION: '.passenger-title',
  PASSENGER_TITLE_STATUS: '.passenger-title .extra__description .is-flex',
  PASSENGER_TITLE_CLICKABLE: '.passenger-title .is-clickable',
  PASSENGER_TITLE_SUCCESS_ICON: '.passenger-title .success-icon.green',
  PASSENGER_TITLE_ERROR_BORDER: '.passenger-title .error-border',
  PASSENGER_TITLE_DROPDOWN_TRIGGER: '.passenger-title .app-select',
  PASSENGER_TITLE_DROPDOWN_OPTION: '.app-select-popper .el-select-dropdown__item',
  PASSENGER_TITLE_SAVE_BUTTON: '.passenger-title .btn--primary',

  // Flight branded fares in cart — selectors shared with FlightResultsPage since same Vue component renders the drawer

  // Hotel address in More Details drawer
  HOTEL_ADDRESS: '.hotel-address',
  MORE_DETAILS_DRAWER_CLOSE: "[aria-label='More details'] [fill='currentColor'], [aria-label='More details'] .el-dialog__close",
  TIME_LIMIT_CONTAINER: '.time-limit-container',
  // More Details drawer — total price in footer (hotel-quote-more-details.vue → app-footer → app-price → h4.amount)
  MORE_DETAILS_TOTAL_PRICE: '.cart-more-details-drawer .app-footer .total-price .amount',
  // Share dialog close button
  SHARE_DIALOG_CLOSE: '.el-dialog__header [fill="currentColor"], .el-dialog__headerbtn',
  // Share dialog language dropdown
  SHARE_LANGUAGE_DROPDOWN: '.app-share-quotes .app-select .el-select',
  SHARE_LANGUAGE_OPTION: (text) => `.app-select-popper .el-select-dropdown__item:has-text("${text}")`,
  SHARE_DETAILED_RADIO: '.app-share-quotes .radio-btns .el-radio',
  SHARE_EMAIL_CONTAINER: '.email-content-container',
  // Share email preview iframe
  SHARE_EMAIL_IFRAME: '.email-content-container iframe',
  // Hotel address in share email preview
  SHARE_EMAIL_HOTEL_ADDRESS: "[target='_blank']",

  // Share email preview — hotel name and image (inside iframe srcdoc)
  SHARE_EMAIL_HOTEL_IMAGE: 'img',
  SHARE_EMAIL_QUOTE_CANCELLATION_TEXT: (quoteIndex) => ({
    1: 'body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody:nth-child(2) > tr:nth-child(7)',
    2: 'body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td.em_side_space > table > tbody:nth-child(2) > tr:nth-child(10)',
  }[quoteIndex]),

  // Expired quote actions (hotel-quote-card.vue)
  CHECK_AVAILABILITY_BUTTON: '.check-price-btn',
  REMOVE_QUOTE_BUTTON: '.delete-btn',

  // Check price dialog (check-price.vue)
  CHECK_PRICE_DIALOG: '.check-price',
  CHECK_PRICE_DIALOG_TITLE: '.check-price .title',
  CHECK_PRICE_DIALOG_SUBTITLE: '.check-price .sub-title',
  CHECK_PRICE_FARE_RULES_BUTTON: '.check-price .fare-rules-btn',
  CHECK_PRICE_PROCEED_BUTTON: '.check-price .proceed-btn',
  CHECK_PRICE_STATUS_LABEL: '.check-price .app-label--quote',

  // Loyalty number extras (loyalty-number.vue)
  LOYALTY_SECTION: '.quote-extras--loyalty-number',
  LOYALTY_CLICKABLE: '.quote-extras--loyalty-number .is-clickable',
  LOYALTY_NEW_RADIO: '.quote-extras--loyalty-number .el-radio-group .el-radio:nth-child(2)',
  LOYALTY_CHAIN_SELECT: '.quote-extras--loyalty-number .select-container .select-element:first-child .el-select',
  LOYALTY_NUMBER_INPUT: '.quote-extras--loyalty-number .select-container .select-element:last-child input',
  LOYALTY_SAVE_BUTTON: '.quote-extras--loyalty-number .btns .no-border',
  LOYALTY_SUCCESS_ICON: '.quote-extras--loyalty-number .success-icon.green',
  LOYALTY_CARD: '.quote-extras--loyalty-number .extras-card',
  LOYALTY_CHAIN_SELECTED_TEXT: '.quote-extras--loyalty-number .select-container .select-element:first-child .el-select .el-select__placeholder',

  // Premier Inn extras - breakfast visibility (premier-inn.vue)
  PREMIER_INN_PAYMENT_LABEL: '.quote-extras--premier-inn .extras-card label.label',
  PREMIER_INN_BREAKFAST_LABEL: '.quote-extras--premier-inn .extras-card label.label:has-text("Breakfast")',

  // Existing loyalty dropdown (selected value text after saving a loyalty number)
  LOYALTY_EXISTING_DROPDOWN_TEXT: '.quote-extras--loyalty-number .extras-card .el-select .el-select__placeholder',

  // Flight Frequent Flyer (FQTV) extras (flight-frequent-flyer.vue)
  FQTV_SECTION: '.flight-frequent-flyer',
  FQTV_CLICKABLE: '.flight-frequent-flyer .is-clickable',
  FQTV_SELECTED_TEXT: '.flight-frequent-flyer .el-select__placeholder span',
  FQTV_SELECTED_TEXT_VISIBLE: '.flight-frequent-flyer .el-tab-pane:visible .el-select__placeholder span',
  FQTV_TRAVELER_TAB: '.flight-frequent-flyer .frequent-flyer-tab .el-tabs__item:visible',
  FQTV_NEW_RADIO: '.flight-frequent-flyer .el-tab-pane:visible .el-radio:has-text("New")',
  FQTV_CARRIER_SELECT: '.flight-frequent-flyer .el-tab-pane:visible .ff-inputs > .app-column:last-child .el-select',
  FQTV_CARRIER_INPUT: '.flight-frequent-flyer .el-tab-pane:visible .ff-inputs > .app-column:last-child .el-select input.el-select__input',
  FQTV_CARRIER_OPTION_TEXT: '.el-select-dropdown__item span',
  FQTV_NUMBER_INPUT: '.flight-frequent-flyer .el-tab-pane:visible .ff-inputs > .app-column:first-child input',
  FQTV_SUCCESS_ICON: '.flight-frequent-flyer .success-icon.green',

  // eHotel supplier details in cart (hotel-quote-card.vue → booking-confirm section)
  EHOTEL_PIN_CODE: '.booking-confirm p:has-text("Pincode:")',
  EHOTEL_CONFIRMATION_NUMBER: '.booking-confirm p:has-text("Confirmation Number:")',
  EHOTEL_CONTACT_PHONE: '.booking-confirm p:has-text("Contact phone")',

  // Flight passenger info section (flight-passenger-info.vue)
  PASSENGER_INFO_SECTION: '.flight-passenger-info',
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
   * Checks whether the "Provided by" label is visible in the cart hotel preview.
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>}
   */
  async isProviderLabelVisible({ timeout = 10000 } = {}) {
    try {
      await this.page.locator(SELECTORS.PROVIDER_LABEL).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the hotel quote price from the cart (the price shown on the hotel card).
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<number>} The price as a numeric value
   */
  async getHotelQuotePrice({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.HOTEL_QUOTE_PRICE).first();
    await el.waitFor({ state: 'visible', timeout });
    const text = await el.innerText();
    const match = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(match) || null;
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
    const quoteCardLocator = page.locator(SELECTORS.QUOTE_CARD_STATUS_LABEL).first();

    try {
      await quoteCardLocator.waitFor({ state: 'visible', timeout });
      return (await quoteCardLocator.innerText()).trim();
    } catch {
      const locator = page.locator(SELECTORS.QUOTE_STATUS_LABEL).first();
      await locator.waitFor({ state: 'visible', timeout });
      return (await locator.innerText()).trim();
    }
  }

  /**
   * Waits for any visible status label that contains the expected text.
   * Useful when the page shows multiple status badges and we need an exact state.
   *
   * @param {string} expectedText
   * @param {object} options
   * @param {number} [options.timeout=30000]
   * @param {import('@playwright/test').Page} [options.page=this.page]
   * @returns {Promise<string>}
   */
  async getStatusByExpectedText(expectedText, { timeout = 30000, page = this.page } = {}) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`expectedText must be a non-empty string, got: ${typeof expectedText}`);
    }

    const locator = page.locator(SELECTORS.ANY_STATUS_LABEL, {
      hasText: new RegExp(expectedText, 'i'),
    }).first();

    await locator.waitFor({ state: 'visible', timeout });
    return (await locator.innerText()).trim();
  }

  /**
   * Gets the trip-level status badge shown beside the Trip overview heading.
   *
   * @param {object} options
   * @param {number} [options.timeout=30000]
   * @param {import('@playwright/test').Page} [options.page=this.page]
   * @returns {Promise<string>}
   */
  async getTripOverviewStatus({ timeout = 30000, page = this.page } = {}) {
    const locator = page.locator(SELECTORS.TRIP_OVERVIEW_STATUS_LABEL).first();
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
   * Gets the OOP justification section locator.
   *
   * @returns {Locator} Playwright locator for the justification section.
   */
  getOOPJustificationSection() {
    return this.page.locator(SELECTORS.OOP_JUSTIFICATION_SECTION);
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
    return this.page.locator(SELECTORS.OOP_JUSTIFICATION_SELECT);
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
   * Gets all visible dropdown option items (li elements).
   * The OOP justification dropdown must be open before calling this.
   *
   * @returns {Locator} Playwright locator for all visible dropdown option list items.
   */
  getAllVisibleJustificationOptions() {
    return this.page.locator(`${SELECTORS.DROPDOWN_OPTION}:visible`);
  }

  /**
   * Gets the first visible justification dropdown option.
   *
   * @returns {Locator} Playwright locator for the first visible option.
   */
  getFirstVisibleJustificationOption() {
    return this.getAllVisibleJustificationOptions().first();
  }

  /**
   * Gets the selected justification text element shown in the dropdown.
   *
   * @returns {Locator} Playwright locator for the selected dropdown value.
   */
  getSelectedJustificationValue() {
    return this.page.locator(SELECTORS.OOP_JUSTIFICATION_SELECTED_VALUE).first();
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
   * Gets the text of the currently selected baggage option.
   * Scoped to .flight-baggage to avoid matching other extras dropdowns.
   *
   * @returns {Promise<string>} The selected baggage option text
   */
  async getSelectedBaggageOptionText() {
    const locator = this.page.locator(SELECTORS.BAGGAGE_SELECTED_OPTION).first();
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    return (await locator.textContent()).trim();
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
   * Accepts every visible quote terms and conditions checkbox on the cart page.
   * Scrolls each checkbox into view before clicking to support multi-quote carts.
   */
  async acceptAllTermsAndConditions() {
    const checkboxInputs = this.page.locator(SELECTORS.TERMS_CHECKBOX_INPUT);
    await checkboxInputs.first().waitFor({ state: 'visible', timeout: 10000 });

    const total = await checkboxInputs.count();
    let acceptedCount = 0;

    for (let index = 0; index < total; index += 1) {
      const checkboxInput = checkboxInputs.nth(index);
      await checkboxInput.scrollIntoViewIfNeeded();

      const isChecked = await checkboxInput.evaluate((element) => element.classList.contains('is-checked'));
      if (isChecked) {
        continue;
      }

      const checkbox = checkboxInput.locator('.el-checkbox__inner');
      await checkbox.waitFor({ state: 'visible', timeout: 10000 });
      await checkbox.click();
      acceptedCount += 1;
    }

    return { acceptedCount };
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
   * Waits for trip overview quote content to render after navigation.
   * The title can appear before the quote card finishes loading.
   *
   * @param {number} [timeout=60000]
   */
  async waitForTripOverviewQuoteContent(timeout = 60000) {
    const quoteTitle = this.page.locator(SELECTORS.QUOTE_TITLE).first();
    const quoteStatus = this.page.locator(SELECTORS.QUOTE_CARD_STATUS_LABEL).first();
    const flightHeading = this.page.getByText(SELECTORS.FLIGHT_QUOTE_HEADING_TEXT, { exact: false }).first();

    await Promise.any([
      quoteTitle.waitFor({ state: 'visible', timeout }),
      quoteStatus.waitFor({ state: 'visible', timeout }),
      flightHeading.waitFor({ state: 'visible', timeout }),
    ]);
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
   * Clicks the "Show cancelled items" option in the trip actions dropdown.
   */
  async clickShowCancelledItemsOption() {
    const option = this.page
      .locator(SELECTORS.SHOW_CANCELLED_ITEMS_OPTION, { hasText: 'Show cancelled items' })
      .first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
  }

  /**
   * Waits for the cancelled quotes section to be visible.
   */
  async waitForCancelledQuotesSection({ timeout = 15000 } = {}) {
    const section = this.page.locator(SELECTORS.CANCELLED_QUOTES_SECTION).first();
    await section.waitFor({ state: 'visible', timeout });
    await this.page.locator(SELECTORS.CANCELLED_QUOTES_TITLE).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Opens the actions dropdown on the first visible active quote card.
   */
  async openActiveQuoteActionsDropdown() {
    const icon = this.page.locator(SELECTORS.ACTIVE_QUOTE_ACTIONS_DROPDOWN_ICON).first();
    await icon.waitFor({ state: 'visible', timeout: 15000 });
    await icon.hover();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clicks the cancel option from the active quote actions dropdown.
   */
  async clickActiveQuoteCancelOption() {
    const option = this.page.locator(SELECTORS.ACTIVE_QUOTE_CANCEL_OPTION, { hasText: 'Cancel item' }).first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
  }

  /**
   * Waits for either the basic or detailed quote cancellation prompt.
   * Returns the prompt type that became visible.
   */
  async waitForQuoteCancellationPrompt({ timeout = 15000 } = {}) {
    const detailedModal = this.page.locator(SELECTORS.DETAILED_CANCEL_QUOTE_MODAL).first();
    const basicDialog = this.page.locator(SELECTORS.BASIC_CANCEL_QUOTE_DIALOG).first();

    return Promise.any([
      detailedModal.waitFor({ state: 'visible', timeout }).then(() => 'detailed'),
      basicDialog.waitFor({ state: 'visible', timeout }).then(() => 'basic'),
    ]);
  }

  /**
   * Confirms quote cancellation in the visible prompt and waits until it closes.
   */
  async confirmQuoteCancellation(promptType) {
    if (promptType === 'detailed') {
      const confirmButton = this.page.locator(SELECTORS.DETAILED_CANCEL_QUOTE_CONFIRM_BUTTON).first();
      await confirmButton.waitFor({ state: 'visible', timeout: 15000 });
      await confirmButton.click();

      const closeButton = this.page.locator(SELECTORS.DETAILED_CANCEL_QUOTE_CLOSE_BUTTON).first();
      await closeButton.waitFor({ state: 'visible', timeout: 60000 });
      await closeButton.click();
      await this.page.locator(SELECTORS.DETAILED_CANCEL_QUOTE_MODAL).first().waitFor({ state: 'hidden', timeout: 30000 });
      return;
    }

    if (promptType === 'basic') {
      const confirmButton = this.page.locator(SELECTORS.BASIC_CANCEL_QUOTE_CONFIRM_BUTTON).last();
      await confirmButton.waitFor({ state: 'visible', timeout: 15000 });
      await confirmButton.click();
      await this.page.locator(SELECTORS.BASIC_CANCEL_QUOTE_DIALOG).first().waitFor({ state: 'hidden', timeout: 60000 });
      return;
    }

    throw new Error(`Unsupported quote cancellation prompt type: ${promptType}`);
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
   * Checks if the "Cancel trip" option in the actions dropdown is disabled.
   * @returns {Promise<boolean>} true if the cancel trip option has the is-disabled class
   */
  async isCancelTripOptionDisabled() {
    const cancelItem = this.page
      .locator(SELECTORS.CANCEL_TRIP_DROPDOWN_ITEM, { hasText: "Cancel trip" })
      .first();
    await cancelItem.waitFor({ state: "visible", timeout: 10000 });
    return cancelItem.evaluate((el) => el.classList.contains("is-disabled"));
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
   * Gets the original-currency text from the first flight quote summary in cart.
   *
   * @returns {Promise<string>}
   */
  async getFirstFlightOriginalPriceText() {
    const originalPrice = this.page.locator(SELECTORS.FLIGHT_QUOTE_ORIGINAL_PRICE).first();
    await originalPrice.waitFor({ state: 'visible', timeout: 30000 });

    return ((await originalPrice.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  async getFirstFlightDisplayPriceValue() {
    const displayPrice = this.page.locator(SELECTORS.FLIGHT_QUOTE_DISPLAY_PRICE).first();
    await displayPrice.waitFor({ state: 'visible', timeout: 30000 });

    return parseAmountText(await displayPrice.textContent(), 'flight quote display price');
  }

  async getFirstFlightOriginalPriceValue() {
    const originalPrice = this.page.locator(SELECTORS.FLIGHT_QUOTE_ORIGINAL_PRICE).first();
    await originalPrice.waitFor({ state: 'visible', timeout: 30000 });

    return parseAmountText(await originalPrice.textContent(), 'flight quote original price');
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
   * Waits for the OOP justification dropdown to be visible.
   */
  async waitForJustificationDropdownVisible() {
    await this.getJustificationDropdown().waitFor({ state: 'visible', timeout: 10000 });
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
   * Waits for the Save Justification button to be hidden after persisting the selection.
   */
  async waitForSaveJustificationButtonHidden() {
    await this.getSaveJustificationButton().waitFor({ state: 'hidden', timeout: 10000 });
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
   * Selects the first visible justification option from the open dropdown.
   *
   * @returns {Promise<string>} Text of the selected option
   */
  async selectFirstVisibleJustificationOption() {
    const firstOption = this.getFirstVisibleJustificationOption();
    await firstOption.waitFor({ state: 'visible', timeout: 10000 });
    const optionText = ((await firstOption.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    await firstOption.click();
    return optionText;
  }

  /**
   * Reads the selected justification value text shown in the dropdown.
   *
   * @returns {Promise<string>}
   */
  async getSelectedJustificationValueText() {
    // In Element Plus 2.x, the selected label may render inside a child span of
    // el-select__selected-item or inside el-select__placeholder — use the full
    // el-select wrapper with innerText() to reliably capture the visible display text.
    const wrapper = this.page.locator(SELECTORS.OOP_JUSTIFICATION_SELECT).first();
    await wrapper.waitFor({ state: 'attached', timeout: 30000 });
    return ((await wrapper.innerText()) ?? '').replace(/\s+/g, ' ').trim();
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
   * Checks if the Hold button is disabled.
   * @returns {Promise<boolean>} true if the hold button has the disabled attribute
   */
  async isHoldButtonDisabled() {
    return this.page.locator(SELECTORS.HOLD_BUTTON).isDisabled();
  }

  /**
   * Waits for the booking status label to show "on hold" text.
   * Used after clicking the hold button to wait for status to update.
   */
  async waitForOnHoldStatus() {
    await this.getOnHoldStatusLabel().waitFor({ state: 'visible', timeout: 60000 });
  }

  getOnHoldStatusLabel() {
    return this.page.locator(SELECTORS.QUOTE_STATUS_LABEL, { hasText: /on hold/i }).first();
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

  async getPriceBreakdownMiniRuleDisclaimerText({ timeout = 10000 } = {}) {
    const disclaimer = this.page.locator(SELECTORS.PRICE_BREAKDOWN_MINI_RULE_DISCLAIMER).first();
    await disclaimer.waitFor({ state: 'visible', timeout });
    return (await disclaimer.innerText()).replace(/\s+/g, ' ').trim();
  }

  async getFlightPriceBreakdownSubtotalLabel({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_LABEL).first();
    await label.waitFor({ state: 'visible', timeout });
    return (await label.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  async getFlightPriceBreakdownCancellationPolicySectionText(sectionSelector, { timeout = 10000 } = {}) {
    const section = this.page
      .locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_SEGMENT)
      .first()
      .locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE)
      .first()
      .locator(sectionSelector)
      .first();
    await section.waitFor({ state: 'visible', timeout });
    return (await section.innerText()).replace(/\s+/g, ' ').trim();
  }

  async getFlightPriceBreakdownBeforeDepartureCancellationPolicyText({ timeout = 10000 } = {}) {
    return this.getFlightPriceBreakdownCancellationPolicySectionText(
      SELECTORS.FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE_BEFORE_DEPARTURE,
      { timeout },
    );
  }

  async getFlightPriceBreakdownAfterDepartureCancellationPolicyText({ timeout = 10000 } = {}) {
    return this.getFlightPriceBreakdownCancellationPolicySectionText(
      SELECTORS.FLIGHT_PRICE_BREAKDOWN_CANCEL_FEE_AFTER_DEPARTURE,
      { timeout },
    );
  }

  /**
   * Hovers the flight CO2 tooltip trigger shown in the cart flight card.
   *
   * @param {{ timeout?: number }} options
   */
  async hoverFlightCO2TooltipInCart({ timeout = 10000 } = {}) {
    const trigger = this.page.locator(SELECTORS.FLIGHT_CO2_TOOLTIP_TRIGGER_IN_CART).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.hover();
  }

  /**
   * Hovers the flight CO2 tooltip trigger inside the flight More Details drawer.
   *
   * @param {{ timeout?: number }} options
   */
  async hoverFlightCO2TooltipInMoreDetails({ timeout = 10000 } = {}) {
    const trigger = this.page.locator(SELECTORS.FLIGHT_CO2_TOOLTIP_TRIGGER_IN_MORE_DETAILS).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.hover();
  }

  /**
   * Gets the visible flight CO2 tooltip description.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getFlightCO2TooltipDescription({ timeout = 10000 } = {}) {
    const description = this.page.locator(SELECTORS.FLIGHT_CO2_TOOLTIP_DESCRIPTION).first();
    await description.waitFor({ state: 'visible', timeout });
    return (await description.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  /**
   * Gets the numeric total shown in the flight price breakdown drawer footer.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<number>}
   */
  async getFlightPriceBreakdownTotal({ timeout = 10000 } = {}) {
    const total = this.page.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_TOTAL).first();
    await total.waitFor({ state: 'visible', timeout });
    return parseAmountText(await total.textContent(), 'flight price breakdown total');
  }

  /**
   * Gets the structured per-passenger-group values displayed in the flight price breakdown drawer.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<Array<{passengerNames: string[], passengerCount: number, price: number, discount: number, tax: number, handlingFee: number, ccCharge: number, optionalServices: number, other: number, subtotal: number}>>}
   */
  async getFlightPriceBreakdownSegments({ timeout = 30000 } = {}) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_DRAWER).first();
    await drawer.waitFor({ state: 'visible', timeout });

    const segments = drawer.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_SEGMENT);
    await segments.first().waitFor({ state: 'visible', timeout });
    const segmentCount = await segments.count();
    const summaries = [];

    for (let index = 0; index < segmentCount; index++) {
      const segment = segments.nth(index);
      const passengerNames = (await segment.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_PASSENGER_NAME).allInnerTexts())
        .map((name) => name.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const passengerLabel = (await segment.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_PASSENGERS).first().textContent().catch(() => ''))
        ?.replace(/\s+/g, ' ')
        .trim() ?? '';
      const passengerCountMatch = passengerLabel.match(/X\s*(\d+)/i);
      const passengerCount = passengerCountMatch
        ? Number.parseInt(passengerCountMatch[1], 10)
        : passengerNames.length;

      summaries.push({
        passengerNames,
        passengerCount,
        price: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Price'),
        discount: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Discount'),
        tax: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Tax'),
        handlingFee: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Handling fee'),
        ccCharge: await this.getFlightPriceBreakdownAmountByLabel(segment, 'CC Charge'),
        optionalServices: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Optional services'),
        other: await this.getFlightPriceBreakdownAmountByLabel(segment, 'Other'),
        subtotal: await this.getFlightPriceBreakdownSubtotalForSegment(segment),
      });
    }

    return summaries;
  }

  async getFlightPriceBreakdownAmountByLabel(segment, label) {
    const row = segment.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_RATE_ROW).filter({ hasText: label }).first();
    const rowCount = await row.count();
    if (!rowCount) {
      return 0;
    }

    const amount = row.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_ROW_AMOUNT).last();
    const amountCount = await amount.count();
    if (!amountCount) {
      return 0;
    }

    return parseAmountText(await amount.textContent(), `${label} amount`);
  }

  async isPriceBreakdownRowVisible(label, timeout = 10000) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_DRAWER).first();
    const row = drawer.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_RATE_ROW).filter({ hasText: label }).first();
    try {
      await row.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getPriceBreakdownRowAmountText(label, timeout = 10000) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_DRAWER).first();
    const row = drawer.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_RATE_ROW).filter({ hasText: label }).first();
    await row.waitFor({ state: 'visible', timeout });
    const amount = row.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_ROW_AMOUNT).last();
    return (await amount.textContent()).trim();
  }

  async getFlightPriceBreakdownSubtotalForSegment(segment) {
    const subtotal = segment.locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_SUBTOTAL_ROW)
      .first()
      .locator(SELECTORS.FLIGHT_PRICE_BREAKDOWN_ROW_AMOUNT)
      .last();
    await subtotal.waitFor({ state: 'visible', timeout: 10000 });
    return parseAmountText(await subtotal.textContent(), 'flight price breakdown subtotal');
  }

  /**
   * Clicks edit button in Extras section.
   * @param {number} [index=0] - The index of the extras section (0-based)
   */
  async clickEditExtrasButton(index = 0) {
    await this.page.locator(SELECTORS.EDIT_EXTRAS_BUTTON).nth(index).click();
  }

  /**
   * Opens the seating extras panel by clicking the Edit/Add button scoped to the flight-seating section.
   */
  async clickEditSeatingExtrasButton() {
    const btn = this.page.locator(SELECTORS.SEATING_EDIT_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Opens the meal extras panel by clicking the Edit/Add button scoped to the flight-meals section.
   */
  async clickEditMealExtrasButton() {
    const btn = this.page.locator(SELECTORS.MEAL_EDIT_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await this.page.locator(SELECTORS.MEAL_DROPDOWN_CARET).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Opens the baggage extras panel by clicking the Edit/Add button scoped to the flight-baggage section.
   * @param {number} [timeout=10000] - Timeout for waiting
   */
  async clickEditBaggageExtrasButton(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.BAGGAGE_CLICKABLE).first();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    await this.waitForBaggageContent(timeout);
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
   * Waits for the baggage extras content to be visible after opening it.
   * Accepts traveler tabs, a baggage dropdown, a selected baggage tag, or a Save button.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async waitForBaggageContent(timeout = 15000) {
    try {
      await Promise.any([
        this.page.locator(SELECTORS.BAGGAGE_TRAVELER_TAB).first().waitFor({ state: 'visible', timeout }),
        this.getNumberOfBaggage().waitFor({ state: 'visible', timeout }),
        this.page.locator(SELECTORS.BAGGAGE_SELECTED_TAG).first().waitFor({ state: 'visible', timeout }),
        this.page.locator(SELECTORS.BAGGAGE_SAVE_BUTTON).first().waitFor({ state: 'visible', timeout }),
      ]);
    } catch {
      throw new Error('Baggage extras did not open');
    }
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
   * Clicks the baggage traveler tab by 1-based index as shown in the UI.
   * @param {number} tabNumber - 1-based tab position
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async clickBaggageTravelerTabByIndex(tabNumber, timeout = 15000) {
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const tab = this.page.locator(SELECTORS.BAGGAGE_TRAVELER_TAB).nth(tabNumber - 1);

    try {
      await tab.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      await this.clickEditBaggageExtrasButton(timeout);
    }

    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Counts the selected baggage tags visible in the active baggage traveler tab.
   * @param {number} [timeout=10000] - Timeout for waiting
   * @returns {Promise<number>} Number of visible selected baggage tags
   */
  async getVisibleBaggageSelectedTagCount(timeout = 10000) {
    await this.page.locator(SELECTORS.BAGGAGE_SAVE_BUTTON).first().waitFor({ state: 'visible', timeout });
    return this.page.locator(SELECTORS.BAGGAGE_SELECTED_TAG).count();
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
    const seatingButton = this.page.locator(SELECTORS.SEATING_EDIT_BUTTON).first();
    const legacyAddSeatsButton = this.page.locator(SELECTORS.ADD_SEATS_BUTTON).first();

    if (await seatingButton.isVisible().catch(() => false)) {
      await seatingButton.click();
      return;
    }

    await legacyAddSeatsButton.waitFor({ state: 'visible', timeout: 15000 });
    await legacyAddSeatsButton.click();
  }

  async clickSeatActionButtonForTraveler(travelerIndex) {
    if (!Number.isInteger(travelerIndex) || travelerIndex < 1) {
      throw new Error(`travelerIndex must be an integer >= 1, got: ${travelerIndex}`);
    }

    const travelerRows = this.page.locator(SELECTORS.SEATING_TRAVELER_ROW);
    await expect.poll(
      async () => {
        const totalTravelerRows = await travelerRows.count();
        let visibleTravelerCount = 0;

        for (let index = 0; index < totalTravelerRows; index += 1) {
          if (await travelerRows.nth(index).isVisible().catch(() => false)) {
            visibleTravelerCount += 1;
          }
        }

        return visibleTravelerCount;
      },
      { timeout: 10000 },
    ).toBeGreaterThan(0);

    const totalTravelerRows = await travelerRows.count();
    const visibleTravelerRowIndexes = [];

    for (let index = 0; index < totalTravelerRows; index += 1) {
      if (await travelerRows.nth(index).isVisible().catch(() => false)) {
        visibleTravelerRowIndexes.push(index);
      }
    }

    const travelerCount = visibleTravelerRowIndexes.length;

    if (travelerIndex > travelerCount) {
      throw new Error(`travelerIndex ${travelerIndex} is out of range for ${travelerCount} visible seating travelers`);
    }

    const travelerRow = travelerRows.nth(visibleTravelerRowIndexes[travelerIndex - 1]);
    await travelerRow.waitFor({ state: 'visible', timeout: 15000 });

    const seatActionButton = travelerRow.getByRole('button', { name: /Add Seats|Change/i }).first();
    await seatActionButton.waitFor({ state: 'visible', timeout: 15000 });
    await seatActionButton.click();
  }

  /**
   * Waits for the seat map to load and be visible.
   */
  async waitForSeatMapToLoad() {
    await expect.poll(
      async () => await this.page.locator(SELECTORS.SEAT_MAP_LOADING_MASK).evaluateAll((elements) => {
        const isVisible = (element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };

        return elements.filter(isVisible).length;
      }),
      { timeout: 30000 },
    ).toBe(0);

    await Promise.any([
      this.page.locator(SELECTORS.SEAT_MAP_CONTAINER).first().waitFor({ state: 'visible', timeout: 30000 }),
      this.page.locator(SELECTORS.SEAT_MAP_UNAVAILABLE_STATE).first().waitFor({ state: 'visible', timeout: 30000 }),
    ]);
  }

  /**
   * Waits for the seat-selection drawer to show either a seat map or the
   * supplier empty state when no seat map is available.
   * @returns {Promise<'map' | 'unavailable'>}
   */
  async waitForSeatMapOrUnavailableState() {
    const seatMap = this.page.locator(SELECTORS.SEAT_MAP_CONTAINER).first();
    const unavailableState = this.page.locator(SELECTORS.SEAT_MAP_UNAVAILABLE_STATE).first();

    const state = await Promise.any([
      seatMap.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'map'),
      unavailableState.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'unavailable'),
    ]);

    return state;
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
   * Clicks the 'Next flight' button in the seat map drawer to advance to the next segment.
   * The button is disabled on the last segment (mergedFlights.length - 1 === currentTabIndex).
   */
  async clickNextFlightButton() {
    const btn = this.page.locator(SELECTORS.NEXT_FLIGHT_BUTTON).first();
    const activeTab = this.page.locator(SELECTORS.SEAT_MAP_ACTIVE_SEGMENT_TAB).first();
    const previousActiveTabLabel = ((await activeTab.innerText().catch(() => '')) || '').trim();

    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();

    if (previousActiveTabLabel) {
      await expect.poll(
        async () => ((await activeTab.innerText().catch(() => '')) || '').trim(),
        { timeout: 15000 },
      ).not.toBe(previousActiveTabLabel);
    }

    await this.waitForSeatMapToLoad();
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
   * Checks if the voucher download links (English/French) are visible in the trip overview.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async areVoucherDownloadLinksVisible({ timeout = 15000 } = {}) {
    const links = this.page.locator(SELECTORS.VOUCHER_DOWNLOAD_LINKS).first();
    try {
      await links.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks that the voucher box is NOT present in the trip overview.
   * @param {object} [options]
   * @param {number} [options.timeout=5000]
   * @returns {Promise<boolean>} true if voucher box is hidden/absent
   */
  async isVoucherBoxHidden({ timeout = 5000 } = {}) {
    const box = this.page.locator(SELECTORS.DOWNLOAD_VOUCHER_BOX).first();
    try {
      await box.waitFor({ state: 'hidden', timeout });
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
   * Clicks the Flight button in the "Add more services" product carousel.
   * Navigates to the flight search page.
   * @param {number} [timeout=10000]
   */
  async clickAddFlightFromCarousel({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_FLIGHT_CAROUSEL_BUTTON);
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Gets the booking status text of the last quote in the cart.
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getLastQuoteStatus({ timeout = 30000 } = {}) {
    const locator = this.page.locator(SELECTORS.LAST_QUOTE_STATUS_LABEL);
    await locator.waitFor({ state: 'visible', timeout });
    return (await locator.innerText()).trim();
  }

  /**
   * Counts the number of visible PNR code elements across all quotes.
   * @param {number} [timeout=10000]
   * @returns {Promise<number>}
   */
  async countVisiblePnrCodes({ timeout = 10000 } = {}) {
    await this.page.locator(SELECTORS.PNR_CODE).first().waitFor({ state: 'visible', timeout });
    return await this.page.locator(SELECTORS.PNR_CODE).count();
  }

  /**
   * Gets all visible PNR codes rendered inside flight quote cards in the cart.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getVisibleFlightQuotePnrCodes({ timeout = 15000 } = {}) {
    const quoteCards = this.page.locator(SELECTORS.FLIGHT_QUOTE_CARD);
    await quoteCards.first().waitFor({ state: 'visible', timeout });

    const count = await quoteCards.count();
    const values = [];

    for (let index = 0; index < count; index += 1) {
      const quoteCard = quoteCards.nth(index);
      await quoteCard.scrollIntoViewIfNeeded();

      const pnrCode = quoteCard.locator(SELECTORS.PNR_CODE).first();
      const isVisible = await pnrCode.isVisible().catch(() => false);

      if (!isVisible) {
        continue;
      }

      const value = ((await pnrCode.innerText()) ?? '').replace(/\s+/g, ' ').trim();

      if (value) {
        values.push(value);
      }
    }

    if (!values.length) {
      throw new Error('Could not extract any PNR codes from flight quotes in the cart');
    }

    return values;
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

  async getHotelPreviewNameText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.HOTEL_PREVIEW_NAME).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  async getFirstQuoteTitleText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.FIRST_QUOTE_TITLE).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  async getLastQuoteTitleText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.LAST_QUOTE_TITLE).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Gets the first visible flight number shown in the cart quote card.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getFirstVisibleFlightNumber({ timeout = 15000 } = {}) {
    const flightNumber = this.page.locator(SELECTORS.FLIGHT_QUOTE_NUMBER_TEXT).first();
    await flightNumber.waitFor({ state: 'visible', timeout });

    const rawText = ((await flightNumber.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    const match = rawText.match(/\b[A-Z0-9]{2,3}\d{1,4}\b/);

    if (!match) {
      throw new Error(`Could not extract a flight number from cart text: "${rawText}"`);
    }

    return match[0];
  }

  /**
   * Gets all visible flight numbers shown in the cart quote card.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getVisibleFlightNumbers({ timeout = 15000 } = {}) {
    const flightNumbers = this.page.locator(SELECTORS.FLIGHT_QUOTE_NUMBER_TEXT);
    await flightNumbers.first().waitFor({ state: 'visible', timeout });

    const count = await flightNumbers.count();
    const values = [];

    for (let index = 0; index < count; index += 1) {
      const rawText = ((await flightNumbers.nth(index).innerText()) ?? '').replace(/\s+/g, ' ').trim();
      const match = rawText.match(/\b[A-Z0-9]{2,3}\d{1,4}\b/);

      if (match) {
        values.push(match[0]);
      }
    }

    if (!values.length) {
      throw new Error('Could not extract any flight numbers from the cart quote card');
    }

    return values;
  }

  /**
   * Gets all visible flight route location codes rendered in the cart quote segments.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getVisibleFlightQuoteLocationCodes({ timeout = 15000 } = {}) {
    const quoteCards = this.page.locator(SELECTORS.FLIGHT_QUOTE_CARD);
    await quoteCards.first().waitFor({ state: 'visible', timeout });

    const segments = quoteCards.locator(SELECTORS.FLIGHT_QUOTE_SEGMENT);
    await segments.first().waitFor({ state: 'visible', timeout });

    const locationCodes = segments.locator(SELECTORS.FLIGHT_QUOTE_LOCATION_CODE);
    const count = await locationCodes.count();
    const codes = [];

    for (let index = 0; index < count; index += 1) {
      const code = (await locationCodes.nth(index).textContent())?.trim();
      if (code) {
        codes.push(code);
      }
    }

    return codes;
  }

  /**
   * Gets the outbound-arrival and return-departure location codes for a round-trip cart.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<{outboundArrivalCode: string, returnDepartureCode: string, locationCodes: string[]}>}
   */
  async getRoundTripMiddleLocationCodes({ timeout = 15000 } = {}) {
    const locationCodes = await this.getVisibleFlightQuoteLocationCodes({ timeout });

    if (locationCodes.length < 4) {
      throw new Error(`Expected at least 4 visible flight location codes in cart, got ${locationCodes.length}: ${locationCodes.join(', ')}`);
    }

    return {
      outboundArrivalCode: locationCodes[1],
      returnDepartureCode: locationCodes[2],
      locationCodes,
    };
  }

  /**
   * Returns the number of visible flight segments in the cart quote card.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<number>}
   */
  async getVisibleFlightQuoteSegmentCount({ timeout = 15000 } = {}) {
    const quoteCards = this.page.locator(SELECTORS.FLIGHT_QUOTE_CARD);
    await quoteCards.first().waitFor({ state: 'visible', timeout });

    const segments = quoteCards.locator(SELECTORS.FLIGHT_QUOTE_SEGMENT);
    await segments.first().waitFor({ state: 'visible', timeout });

    return segments.count();
  }

  async getVisibleFlightQuoteSegmentSummaries({ timeout = 15000 } = {}) {
    const quoteCard = this.page.locator(SELECTORS.FLIGHT_QUOTE_CARD).first();
    await quoteCard.waitFor({ state: 'visible', timeout });

    const segments = quoteCard.locator(SELECTORS.FLIGHT_QUOTE_SEGMENT);
    await segments.first().waitFor({ state: 'visible', timeout });

    const count = await segments.count();
    const summaries = [];

    for (let index = 0; index < count; index += 1) {
      const segment = segments.nth(index);
      const carrier = ((await segment.locator(SELECTORS.FLIGHT_SEGMENT_CARRIER_NAME).first().innerText()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const flightNumberText = ((await segment.locator(SELECTORS.FLIGHT_SEGMENT_FLIGHT_NUMBER_TEXT).first().innerText()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const flightNumberMatch = flightNumberText.match(/\b[A-Z0-9]{2,3}\d{1,4}\b/);
      const times = segment.locator(SELECTORS.FLIGHT_SEGMENT_TIME);

      await times.nth(1).waitFor({ state: 'visible', timeout });

      if (!flightNumberMatch) {
        throw new Error(`Could not extract a flight number from cart text: "${flightNumberText}"`);
      }

      summaries.push({
        carrier,
        flightNumber: flightNumberMatch[0],
        departureTime: ((await times.nth(0).innerText()) ?? '').replace(/\s+/g, ' ').trim(),
        arrivalTime: ((await times.nth(1).innerText()) ?? '').replace(/\s+/g, ' ').trim(),
      });
    }

    if (!summaries.length) {
      throw new Error('Could not extract any visible flight segment details from the quote card');
    }

    return summaries;
  }

  // ========================================
  // Passenger Title (Travelodge extras)
  // ========================================

  /**
   * Gets the passenger title status text (e.g. "* Title0/1" or "Title1/1").
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>}
   */
  async getPassengerTitleStatusText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.PASSENGER_TITLE_STATUS).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Checks whether the passenger title section has an error border (red border).
   * @returns {Promise<boolean>}
   */
  async hasPassengerTitleErrorBorder() {
    return this.page.locator(SELECTORS.PASSENGER_TITLE_ERROR_BORDER).isVisible();
  }

  /**
   * Checks whether the passenger title has a green success check icon.
   * @returns {Promise<boolean>}
   */
  async hasPassengerTitleSuccessIcon() {
    return this.page.locator(SELECTORS.PASSENGER_TITLE_SUCCESS_ICON).isVisible();
  }

  /**
   * Clicks the Add/Edit button to open the passenger title form.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   */
  async clickPassengerTitleEdit({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.PASSENGER_TITLE_CLICKABLE).first();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    // Wait for the title form (Save button) to appear after clicking Add/Edit
    const saveBtn = this.page.locator(SELECTORS.PASSENGER_TITLE_SAVE_BUTTON).first();
    await saveBtn.waitFor({ state: 'visible', timeout });
  }

  /**
   * Selects a title from the dropdown in the passenger title form.
   * Opens the app-select dropdown and picks the first available option.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   */
  async selectFirstTitleOption({ timeout = 10000 } = {}) {
    const dropdown = this.page.locator(SELECTORS.PASSENGER_TITLE_DROPDOWN_TRIGGER).first();
    await dropdown.waitFor({ state: 'visible', timeout });
    await dropdown.click();
    // Scope to .app-select-popper (the popper class from app-select.vue) to avoid hitting hidden dropdown items
    const option = this.page.locator(SELECTORS.PASSENGER_TITLE_DROPDOWN_OPTION).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  /**
   * Clicks the Save button in the passenger title form.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   */
  async clickPassengerTitleSave({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.PASSENGER_TITLE_SAVE_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
  }

  /**
   * Clicks the More Details link on the hotel cart card to open the details drawer.
   */
  async clickMoreDetailsHotel() {
    const moreDetails = this.page.locator(SELECTORS.MORE_DETAILS_HOTEL_BUTTON).first();
    await moreDetails.waitFor({ state: 'visible', timeout: 15000 });
    await moreDetails.click();
  }

  /**
   * Gets the hotel address text from the More Details drawer.
   * @returns {Promise<string>} The hotel address text
   */
  async getHotelAddressText() {
    const address = this.page.locator(SELECTORS.HOTEL_ADDRESS).first();
    await address.waitFor({ state: 'visible', timeout: 15000 });
    return (await address.textContent()).trim();
  }

  /**
   * Gets the total price from the More Details drawer footer.
   * The drawer must already be open.
   * @param {object} options
   * @param {number} options.timeout - Maximum wait time (default: 15000ms)
   * @returns {Promise<number>} The total price as a numeric value
   */
  async getMoreDetailsTotalPrice({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.MORE_DETAILS_TOTAL_PRICE).first();
    await el.waitFor({ state: 'visible', timeout });
    const text = await el.innerText();
    const match = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(match) || null;
  }

  /**
   * Closes the More Details drawer.
   */
  async closeMoreDetailsDrawer() {
    const closeBtn = this.page.locator(SELECTORS.MORE_DETAILS_DRAWER_CLOSE).first();
    await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await closeBtn.click();
  }

  /**
   * Closes the share quote/itinerary dialog.
   */
  async closeShareDialog() {
    const closeBtn = this.page.locator(SELECTORS.SHARE_DIALOG_CLOSE).first();
    await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await closeBtn.click();
  }

  /**
   * Gets the hotel address text from the share email preview.
   * Searches both the main page and iframes for the address link.
   * @returns {Promise<string|null>} The hotel address text or null
   */
  async getHotelAddressFromSharePreview() {
    // Wait for the email container to be visible (content loaded, not skeleton)
    const container = this.page.locator(SELECTORS.SHARE_EMAIL_CONTAINER);
    await container.waitFor({ state: 'visible', timeout: 30_000 });

    // Wait for iframe to appear with srcdoc content (up to 30s, polling every 500ms)
    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    let srcdoc = '';
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const iframeCount = await iframeLocator.count();
      if (iframeCount > 0) {
        srcdoc = (await iframeLocator.getAttribute('srcdoc')) ?? '';
        if (srcdoc.trim().length > 0) break;
      }
      await this.page.waitForTimeout(500);
    }

    // Parse srcdoc HTML for [target='_blank'] link text (address link in email template)
    if (srcdoc.trim().length > 0) {
      const matches = [...srcdoc.matchAll(/target=['"]_blank['"'][^>]*>([^<]+)</gi)];
      for (const match of matches) {
        const text = match[1].trim();
        if (text.length > 5) return text;
      }
    }

    // Fallback: search live iframe DOM
    const frameElements = iframeLocator.contentFrame().locator(SELECTORS.SHARE_EMAIL_HOTEL_ADDRESS);
    const frameCount = await frameElements.count().catch(() => 0);
    if (frameCount > 0) {
      for (let i = 0; i < frameCount; i++) {
        const text = ((await frameElements.nth(i).textContent().catch(() => '')) ?? '').trim();
        if (text.length > 5) return text;
      }
    }

    return null;
  }

  /**
   * Checks if the share email preview iframe contains a hotel image.
   * @returns {Promise<boolean>} True if an image with a real src is found
   */
  async hasHotelImageInSharePreview() {
    // Wait for srcdoc to be populated (same polling approach as getHotelAddressFromSharePreview)
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) return false;

    // Parse img src values directly from srcdoc HTML (all images present regardless of scroll)
    const imgMatches = [...srcdoc.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
    for (const match of imgMatches) {
      const src = match[1];
      if (src && src.startsWith('http') && !src.includes('logo')) return true;
    }
    return false;
  }

  normalizeSharePreviewText(text) {
    return (text ?? '')
      .replace(/[\u200B-\u200D\uFEFF]/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Gets all text content from the share email preview iframe.
   * @returns {Promise<string>} Full text content of the iframe
   */
  async getSharePreviewTextContent() {
    // Wait for srcdoc to be populated (same polling approach as getHotelAddressFromSharePreview)
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) return '';

    // Try live iframe DOM first (more accurate, respects rendered text)
    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    const body = iframeLocator.contentFrame().locator('body');
    const count = await body.count().catch(() => 0);
    if (count > 0) {
      const text = await body.textContent({ timeout: 8000 }).catch(() => '');
      const normalized = this.normalizeSharePreviewText(text);
      if (normalized.length > 0) return normalized;
    }

    // Fallback: strip HTML tags from srcdoc (contains full email content regardless of scroll)
    return this.normalizeSharePreviewText(
      srcdoc
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    );
  }

  /**
   * Gets the raw srcdoc HTML from the share email preview iframe.
   * Unlike getSharePreviewTextContent(), this preserves HTML tags for pattern matching.
   * @returns {Promise<string>} Raw HTML string from the iframe srcdoc attribute
   */
  async getSharePreviewRawHtml() {
    return await this._waitForShareIframeSrcdoc();
  }

  /**
   * Waits for the share email container to be visible and the iframe srcdoc to have content.
   * @param {number} [timeout=30000]
   * @returns {Promise<string>} srcdoc HTML string, or '' if not found
   */
  async _waitForShareIframeSrcdoc(timeout = 30_000) {
    const container = this.page.locator(SELECTORS.SHARE_EMAIL_CONTAINER);
    await container.waitFor({ state: 'visible', timeout });
    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const count = await iframeLocator.count();
      if (count > 0) {
        const srcdoc = (await iframeLocator.getAttribute('srcdoc')) ?? '';
        if (srcdoc.trim().length > 0) return srcdoc;
      }
      await this.page.waitForTimeout(500);
    }
    return '';
  }

  /**
   * Extracts equipment values from the share email preview HTML.
   * Parses "Equipment: {value}" labels from the srcdoc HTML.
   * @returns {Promise<string[]>} Equipment values (e.g., ["High-Speed Train", "320"])
   */
  async getSharePreviewEquipmentValues() {
    const srcDoc = await this.getSharePreviewRawHtml();
    const matches = srcDoc.match(/<span>Equipment:\s*<\/span>\s*([^<]+)/gi) || [];
    return matches.map(m => {
      const match = m.match(/<span>Equipment:\s*<\/span>\s*(.+)/i);
      return match ? match[1].trim() : '';
    }).filter(Boolean);
  }

  /**
   * Checks whether the share email preview HTML contains flight number information.
   * @returns {Promise<boolean>}
   */
  async sharePreviewContainsFlightNumber() {
    const srcDoc = await this.getSharePreviewRawHtml();
    return /Flight<\/span>\s*#:/i.test(srcDoc);
  }

  // ===== EXPIRED QUOTE ACTIONS =====

  /**
   * Checks if the Check Availability button is visible on an expired quote.
   * @returns {Promise<boolean>}
   */
  async isCheckAvailabilityButtonVisible() {
    const btn = this.page.locator(SELECTORS.CHECK_AVAILABILITY_BUTTON).first();
    return btn.isVisible();
  }

  /**
   * Checks if the Remove Quote button is visible on an expired quote.
   * @returns {Promise<boolean>}
   */
  async isRemoveQuoteButtonVisible() {
    const btn = this.page.locator(SELECTORS.REMOVE_QUOTE_BUTTON).first();
    return btn.isVisible();
  }

  /**
   * Clicks the Check Availability button on an expired quote.
   */
  async clickCheckAvailabilityButton() {
    const btn = this.page.locator(SELECTORS.CHECK_AVAILABILITY_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Gets the title text from the check price dialog.
   * @returns {Promise<string>}
   */
  async getCheckPriceDialogTitle() {
    const title = this.page.locator(SELECTORS.CHECK_PRICE_DIALOG_TITLE).first();
    await title.waitFor({ state: 'visible', timeout: 30000 });
    return (await title.textContent()).trim();
  }

  /**
   * Gets the subtitle text from the check price dialog.
   * @returns {Promise<string>}
   */
  async getCheckPriceDialogSubtitle() {
    const subtitle = this.page.locator(SELECTORS.CHECK_PRICE_DIALOG_SUBTITLE).first();
    await subtitle.waitFor({ state: 'visible', timeout: 15000 });
    return (await subtitle.textContent()).trim();
  }

  /**
   * Checks if the Proceed button is visible in the check price dialog.
   * @returns {Promise<boolean>}
   */
  async isCheckPriceProceedButtonVisible() {
    const btn = this.page.locator(SELECTORS.CHECK_PRICE_PROCEED_BUTTON).first();
    return btn.isVisible();
  }

  /**
   * Clicks the Fare Rules button in the check price dialog.
   */
  async clickCheckPriceFareRulesButton() {
    const button = this.page.locator(SELECTORS.CHECK_PRICE_FARE_RULES_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  }

  /**
   * Clicks the first Check Price button inside the cancelled quotes section.
   */
  async clickFirstCancelledQuoteCheckPriceButton() {
    const button = this.page.locator(SELECTORS.CANCELLED_QUOTE_CHECK_PRICE_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 30000 });
    await button.click();
  }

  /**
   * Clicks the Proceed button in the check price dialog.
   */
  async clickCheckPriceProceedButton() {
    const button = this.page.locator(SELECTORS.CHECK_PRICE_PROCEED_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  }

  /**
   * Waits for the check price dialog to close.
   */
  async waitForCheckPriceDialogToDisappear() {
    const dialog = this.page.locator(SELECTORS.CHECK_PRICE_DIALOG).first();
    await dialog.waitFor({ state: 'hidden', timeout: 30000 });
  }

  /**
   * Selects a language in the share dialog language dropdown.
   * @param {string} language - The language label to select (e.g. "German", "English")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async selectShareLanguage(language, { timeout = 15000 } = {}) {
    if (!language || typeof language !== 'string') throw new Error('language must be a non-empty string');
    const dropdown = this.page.locator(SELECTORS.SHARE_LANGUAGE_DROPDOWN).first();
    await dropdown.waitFor({ state: 'visible', timeout });
    await dropdown.click();
    const option = this.page.locator(SELECTORS.SHARE_LANGUAGE_OPTION(language)).first();
    await option.waitFor({ state: 'visible', timeout });
    await option.click();
    // Email preview iframe re-renders via srcdoc after language change; no load event to listen for
    await this.page.waitForTimeout(3000);
  }

  async selectShareDetailedView({ timeout = 30000 } = {}) {
    const detailedRadio = this.page
      .locator(SELECTORS.SHARE_DETAILED_RADIO)
      .filter({ hasText: 'Detailed' })
      .first();
    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();

    await detailedRadio.waitFor({ state: 'visible', timeout });

    const previousSrcDoc = await iframeLocator.getAttribute('srcdoc');
    const previousContent = await this.getSharePreviewTextContent();

    await detailedRadio.click();

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const radioClasses = (await detailedRadio.getAttribute('class')) || '';
      const currentSrcDoc = await iframeLocator.getAttribute('srcdoc');
      const currentContent = await this.getSharePreviewTextContent();

      const isDetailedSelected = radioClasses.includes('is-checked');
      const previewChanged =
        (currentSrcDoc && currentSrcDoc !== previousSrcDoc) ||
        (currentContent && currentContent !== previousContent);

      if (isDetailedSelected && previewChanged) {
        return;
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error('Timed out waiting for the share preview to switch to detailed view');
  }

  /**
   * Checks if the share email preview iframe contains the given text.
   * @param {string} text - Text to search for in the email preview
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async sharePreviewContainsText(text, { timeout = 15000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const content = await this.getSharePreviewTextContent();
      if (content.includes(text)) return true;
      await this.scrollSharePreviewDown();
      await this.page.waitForTimeout(1000);
    }
    return false;
  }

  async getSharePreviewQuoteCancellationText(quoteIndex, { timeout = 15000 } = {}) {
    if (!Number.isInteger(quoteIndex) || quoteIndex < 1) {
      throw new Error(`quoteIndex must be a positive integer, got: ${quoteIndex}`);
    }

    const selector = SELECTORS.SHARE_EMAIL_QUOTE_CANCELLATION_TEXT(quoteIndex);
    if (!selector) {
      throw new Error(`Unsupported quote index for share email preview: ${quoteIndex}`);
    }

    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    await iframeLocator.waitFor({ state: 'visible', timeout });

    const srcDoc = await iframeLocator.getAttribute('srcdoc');
    if (srcDoc && srcDoc.trim().length > 0) {
      const text = await iframeLocator.evaluate((iframe, targetSelector) => {
        const html = iframe.getAttribute('srcdoc') || '';
        if (!html) return '';

        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector(targetSelector)?.textContent ?? '';
      }, selector);

      return this.normalizeSharePreviewText(text);
    }

    const frame = await iframeLocator.contentFrame();
    if (!frame) {
      return '';
    }

    const target = frame.locator(selector).first();
    await target.waitFor({ state: 'visible', timeout });
    return this.normalizeSharePreviewText(await target.textContent());
  }

  async sharePreviewQuoteContainsText(quoteIndex, text, { timeout = 15000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');

    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const content = await this.getSharePreviewQuoteCancellationText(quoteIndex, { timeout });
      if (content.includes(text)) return true;
      await this.scrollSharePreviewDown();
      await this.page.waitForTimeout(1000);
    }

    return false;
  }

  async scrollSharePreviewDown() {
    const container = this.page.locator(SELECTORS.SHARE_EMAIL_CONTAINER).first();
    if (await container.count()) {
      await container.evaluate((element) => {
        element.scrollBy({ top: 500, behavior: 'instant' });
      }).catch(() => {});
    }

    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    if (await iframeLocator.count()) {
      const frame = iframeLocator.contentFrame();
      const body = frame.locator('body');
      if (await body.count().catch(() => 0)) {
        await body.evaluate((element) => {
          element.scrollBy?.({ top: 500, behavior: 'instant' });
          window.scrollBy(0, 500);
          document.documentElement?.scrollBy?.(0, 500);
          document.body?.scrollBy?.(0, 500);
        }).catch(() => {});
      }
    }
  }

  /**
   * Gets the status label text from the check price dialog.
   * @returns {Promise<string>}
   */
  async getCheckPriceStatusLabel() {
    const label = this.page.locator(SELECTORS.CHECK_PRICE_STATUS_LABEL).first();
    const count = await label.count();
    if (count === 0) return '';
    return (await label.textContent()).trim();
  }

  // ========================================
  // LOYALTY NUMBER EXTRAS
  // ========================================

  /**
   * Expands the loyalty number extras section by clicking its clickable area.
   */
  async expandLoyaltySection() {
    const clickable = this.page.locator(SELECTORS.LOYALTY_CLICKABLE);
    await clickable.waitFor({ state: 'visible', timeout: 15000 });
    await clickable.click();
  }

  /**
   * Clicks the "New" radio button in the loyalty number section.
   */
  async selectNewLoyaltyRadio() {
    const radio = this.page.locator(SELECTORS.LOYALTY_NEW_RADIO);
    await radio.waitFor({ state: 'visible', timeout: 10000 });
    await radio.click();
  }

  /**
   * Selects a hotel chain from the loyalty chain dropdown by visible label text.
   * @param {string} chainText - Text to match in the dropdown option (e.g. "Choic Hotels (EC)")
   */
  async selectLoyaltyChain(chainText) {
    const select = this.page.locator(SELECTORS.LOYALTY_CHAIN_SELECT);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator('.el-select-dropdown__item').filter({ hasText: chainText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
   * Selects the first hotel chain option from the loyalty chain dropdown.
   * @returns {Promise<string>} The text of the selected chain option
   */
  async selectFirstLoyaltyChain() {
    const select = this.page.locator(SELECTORS.LOYALTY_CHAIN_SELECT);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator('.el-select-dropdown__item').first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await option.textContent()).trim();
    await option.click();
    return text;
  }

  /**
   * Fills in the loyalty number input field.
   * @param {string} number - The loyalty number to enter
   */
  async fillLoyaltyNumber(number) {
    const input = this.page.locator(SELECTORS.LOYALTY_NUMBER_INPUT);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(number);
  }

  /**
   * Clicks the Save button in the loyalty number section.
   */
  async clickLoyaltySaveButton() {
    const btn = this.page.locator(SELECTORS.LOYALTY_SAVE_BUTTON);
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Waits for the loyalty success icon (green checkmark) to appear.
   */
  async waitForLoyaltySuccessIcon() {
    await this.page.locator(SELECTORS.LOYALTY_SUCCESS_ICON)
      .waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Checks if the loyalty extras card panel is currently visible.
   * @returns {Promise<boolean>}
   */
  async isLoyaltyCardVisible() {
    return this.page.locator(SELECTORS.LOYALTY_CARD).isVisible();
  }

  /**
   * Gets the current value of the loyalty number input field.
   * @returns {Promise<string>}
   */
  async getLoyaltyNumberInputValue() {
    const input = this.page.locator(SELECTORS.LOYALTY_NUMBER_INPUT);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    return input.inputValue();
  }

  /**
   * Gets the selected hotel chain text from the loyalty chain dropdown.
   * @returns {Promise<string>}
   */
  async getLoyaltyChainSelectedText() {
    const placeholder = this.page.locator(SELECTORS.LOYALTY_CHAIN_SELECTED_TEXT);
    await placeholder.waitFor({ state: 'visible', timeout: 10000 });
    return (await placeholder.textContent()).trim();
  }

  /**
   * Gets the text of the existing loyalty dropdown after a loyalty number has been saved.
   * In "Existing" mode, the dropdown shows "ChainName - LoyaltyNumber".
   * @returns {Promise<string>}
   */
  async getExistingLoyaltyDropdownText() {
    const dropdown = this.page.locator(SELECTORS.LOYALTY_EXISTING_DROPDOWN_TEXT).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    return (await dropdown.textContent()).trim();
  }

  // ========================================
  // PREMIER INN EXTRAS (BREAKFAST/PAYMENT)
  // ========================================

  /**
   * Checks if the payment method label is visible in Premier Inn extras.
   * @returns {Promise<boolean>}
   */
  async isPremierInnPaymentLabelVisible() {
    return this.page.locator(SELECTORS.PREMIER_INN_PAYMENT_LABEL).first().isVisible();
  }

  /**
   * Checks if the breakfast type option label is visible in Premier Inn extras.
   * @returns {Promise<boolean>}
   */
  async isPremierInnBreakfastOptionVisible() {
    return this.page.locator(SELECTORS.PREMIER_INN_BREAKFAST_LABEL).isVisible();
  }

  /**
   * Checks whether the eHotel PIN code is visible in the cart booking confirmation section.
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>}
   */
  async isPinCodeVisibleInCart({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.EHOTEL_PIN_CODE).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the eHotel Confirmation Number is visible in the cart booking confirmation section.
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>}
   */
  async isConfirmationNumberVisibleInCart({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.EHOTEL_CONFIRMATION_NUMBER).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the eHotel Contact Phone is visible in the cart booking confirmation section.
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>}
   */
  async isContactPhoneVisibleInCart({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.EHOTEL_CONTACT_PHONE).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ===== FLIGHT DETAILS / BRANDED FARES IN CART =====

  /**
   * Clicks the Flight details button in the cart.
   */
  async clickFlightDetailsButton() {
    const btn = this.page.locator(SELECTORS.FLIGHT_DETAILS_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Gets the visible post-ticketing table headers from the flight details drawer.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getPostTicketingTableHeaders({ timeout = 15000 } = {}) {
    const headers = this.page.locator(SELECTORS.POST_TICKETING_TABLE_HEADERS);
    await headers.first().waitFor({ state: 'visible', timeout });
    const values = await headers.allInnerTexts();
    return values.map((value) => value.trim());
  }

  /**
   * Gets the visible ticket numbers shown in the post-ticketing table.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getPostTicketingTicketNumbers({ timeout = 15000 } = {}) {
    const firstTable = this.page.locator(SELECTORS.POST_TICKETING_TABLE).first();
    await firstTable.waitFor({ state: 'visible', timeout });

    const ticketNumbers = firstTable.locator(SELECTORS.POST_TICKETING_TICKET_NUMBER_TEXT);
    await ticketNumbers.first().waitFor({ state: 'visible', timeout });
    const values = await ticketNumbers.allInnerTexts();
    return values.map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /**
   * Clicks the first seat-selection button in the post-ticketing table.
   * @param {{ timeout?: number }} options
   */
  async clickPostTicketingSeatButton({ timeout = 15000 } = {}) {
    const button = this.page.locator(SELECTORS.POST_TICKETING_FIRST_SEAT_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout });
    await button.click();
  }

  /**
   * Gets the time limit text from the flight details drawer.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>} The time limit text (e.g. "Mon, 31 Mar 26 14:00")
   */
  async getTimeLimitText({ timeout = 10000 } = {}) {
    const container = this.page.locator(SELECTORS.TIME_LIMIT_CONTAINER);
    await container.waitFor({ state: 'visible', timeout });
    const text = await container.locator('p').innerText();
    return text.trim();
  }

  // ========================================
  // Flight Meals
  // ========================================

  /**
   * Selects a meal from the dropdown by visible option text.
   * @param {string} mealName
   */
  async selectMealFromDropdown(mealName) {
    if (!mealName || typeof mealName !== 'string') {
      throw new Error(`mealName must be a non-empty string, got: ${typeof mealName}`);
    }

    const caret = this.page.locator(SELECTORS.MEAL_DROPDOWN_CARET).first();
    await caret.waitFor({ state: 'visible', timeout: 10000 });
    await caret.click();

    const option = this.page.locator(SELECTORS.MEAL_DROPDOWN_OPTION_TEXT, {
      hasText: mealName,
    }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
   * Clicks the save button in the meal panel.
   */
  async clickMealSaveButton() {
    const btn = this.page.locator(SELECTORS.MEAL_SAVE_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Gets the meal status help text (e.g. "Reservation in progress, proceed to checkout for finalization").
   * @param {number} [timeout=15000]
   * @returns {Promise<string>}
   */
  async getMealStatusHelpText({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.MEAL_STATUS_HELP_TEXT).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Gets the currently selected meal text (e.g. "Diabetic Meal (DBML)").
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getMealSelectedText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.MEAL_SELECTED_TEXT).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  // ===== SEATING ICON =====

  /**
   * Checks if the seat icon is visible in the extras section.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isSeatIconVisibleInExtras(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.SEAT_ICON_IN_EXTRAS).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ===== TRAVELER INITIALS =====

  /**
   * Checks if a specific set of traveler initials is visible.
   * @param {string} initials - The initials text to look for (e.g., "AO", "PR")
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isTravelerInitialsVisible(initials, timeout = 10000) {
    try {
      const el = this.page.locator(SELECTORS.TRAVELER_INITIALS, { hasText: initials }).first();
      await el.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ===== HOTEL SEARCH FROM CART =====

  /**
   * Gets the value of the hotel search destination autocomplete input.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<string>}
   */
  async getHotelSearchDestinationValue(timeout = 10000) {
    const input = this.page.locator(SELECTORS.HOTEL_SEARCH_DESTINATION_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    return await input.inputValue();
  }

  /**
   * Checks if the hotel search check-in date field has a value.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isHotelCheckInDateFilled(timeout = 10000) {
    const input = this.page.locator(SELECTORS.HOTEL_SEARCH_CHECK_IN_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    const value = await input.inputValue();
    return value.length > 0;
  }

  /**
   * Checks if the hotel search check-out date field has a value.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isHotelCheckOutDateFilled(timeout = 10000) {
    const input = this.page.locator(SELECTORS.HOTEL_SEARCH_CHECK_OUT_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    const value = await input.inputValue();
    return value.length > 0;
  }

  /**
   * Clicks the Cancel button in the meal panel to close it.
   */
  async clickMealCancelButton() {
    const btn = this.page.locator(SELECTORS.MEAL_CANCEL_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Returns the number of segment tabs in the seat map drawer.
   * @returns {Promise<number>}
   */
  async getSeatMapSegmentTabCount() {
    return this.page.locator(SELECTORS.SEAT_MAP_SEGMENT_TAB).count();
  }

  /**
   * Clicks a segment tab by index (0-based) in the seat map drawer.
   * @param {number} index
   */
  async clickSeatMapSegmentTab(index) {
    const tab = this.page.locator(SELECTORS.SEAT_MAP_SEGMENT_TAB).nth(index);
    await tab.waitFor({ state: 'visible', timeout: 15000 });
    await tab.click();
  }

  /**
   * Hovers over the first available (non-occupied) seat in the seat map to trigger its tooltip.
   * For seats without photos, mouseenter on the outer wrapper sets isTooltipOpen=true.
   * Do NOT click — clicking calls openToolTip() which toggles isTooltipOpen off.
   */
  async hoverFirstAvailableSeat() {
    // Find a seat that is NOT occupied (no 'occupied' class on the parent .plane-seat)
    const seat = this.page.locator('.deck-wrapper .plane-seat:not(.occupied) .seat').first();
    await seat.waitFor({ state: 'visible', timeout: 15000 });
    await seat.hover();
  }

  /**
   * Gets the red tooltip message text displayed on a seat.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} The red tooltip text
   */
  async getSeatTooltipRedMessage({ timeout = 10000 } = {}) {
    const msg = this.page.locator(SELECTORS.SEAT_TOOLTIP_RED_MESSAGE).first();
    await msg.waitFor({ state: 'visible', timeout });
    return (await msg.innerText()).trim();
  }

  /**
   * Gets the "Booked by" text from the price breakdown drawer.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>} The full "Booked by ... on ..." text
   */
  async getBookedByText({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.PRICE_BREAKDOWN_BOOKED_BY);
    await el.waitFor({ state: 'visible', timeout });
    return (await el.innerText()).trim();
  }

  /**
   * Returns the selected FQTV text from the Frequent Flyer section.
   * Assumes the FQTV section is already expanded (e.g. via edit extras).
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<string>} The FQTV selected text (e.g. "LH - 12321")
   */
  async getFqtvSelectedText(timeout = 15000) {
    const text = this.page.locator(SELECTORS.FQTV_SELECTED_TEXT_VISIBLE).first();
    await text.waitFor({ state: 'visible', timeout });
    return (await text.innerText()).trim();
  }

  /**
   * Returns all visible selected FQTV texts from the Frequent Flyer section.
   * Useful for separate-ticket flows where more than one carrier is shown.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<string[]>} The visible FQTV selected texts
   */
  async getAllFqtvSelectedTexts(timeout = 15000) {
    const texts = this.page.locator(SELECTORS.FQTV_SELECTED_TEXT_VISIBLE);
    await texts.first().waitFor({ state: 'visible', timeout }).catch(() => {});

    const count = await texts.count();
    const values = [];

    for (let index = 0; index < count; index += 1) {
      const value = (await texts.nth(index).innerText()).trim();
      if (value) {
        values.push(value);
      }
    }

    const numberInputs = this.page.locator(SELECTORS.FQTV_NUMBER_INPUT);
    const numberInputCount = await numberInputs.count();

    for (let index = 0; index < numberInputCount; index += 1) {
      const value = (await numberInputs.nth(index).inputValue().catch(() => '')).trim();
      if (value) {
        values.push(value);
      }
    }

    return values;
  }

  /**
   * Clicks the FQTV traveler tab by visible traveler name.
   * @param {string} travelerName - Full traveler name shown in the tab
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async clickFqtvTravelerTabByName(travelerName, timeout = 15000) {
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error('travelerName must be a non-empty string');
    }

    const tab = this.page.locator(SELECTORS.FQTV_TRAVELER_TAB, { hasText: travelerName }).first();

    try {
      await tab.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      await this.clickFqtvClickable(timeout);
    }

    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Clicks the FQTV traveler tab by 1-based index as shown in the UI.
   * @param {number} tabNumber - 1-based tab position
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async clickFqtvTravelerTabByIndex(tabNumber, timeout = 15000) {
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const tab = this.page.locator(SELECTORS.FQTV_TRAVELER_TAB).nth(tabNumber - 1);

    try {
      await tab.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      await this.clickFqtvClickable(timeout);
    }

    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Clicks the Frequent Flyer row action to open the FQTV form.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async clickFqtvClickable(timeout = 15000) {
    const clickable = this.page.locator(SELECTORS.FQTV_CLICKABLE).first();
    await clickable.waitFor({ state: 'visible', timeout });
    await clickable.click();
  }

  /**
   * Waits for the frequent flyer extras content to be visible after opening it.
   * Accepts either a saved FQTV value, traveler tabs, editable inputs, or a Save button.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async waitForFqtvContent(timeout = 15000) {
    try {
      await Promise.any([
        this.page.locator(SELECTORS.FQTV_SELECTED_TEXT_VISIBLE).first().waitFor({ state: 'visible', timeout }),
        this.page.locator(SELECTORS.FQTV_TRAVELER_TAB).first().waitFor({ state: 'visible', timeout }),
        this.page.locator(SELECTORS.FQTV_NUMBER_INPUT).first().waitFor({ state: 'visible', timeout }),
        this.getSaveButton().waitFor({ state: 'visible', timeout }),
      ]);
    } catch {
      throw new Error('Frequent flyer extras did not open');
    }
  }

  /**
   * Clicks the "New" radio button in the flight frequent flyer section.
   * @param {number} [timeout=10000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async selectNewFqtvRadio(index = 0, timeout = 10000) {
    const radio = this.page.locator(SELECTORS.FQTV_NEW_RADIO).nth(index);
    await radio.waitFor({ state: 'visible', timeout });
    await radio.click();
  }

  /**
   * Selects the first available airline from the flight frequent flyer carrier dropdown.
   * @param {number} [index=0] - Segment index in the frequent flyer form
   * @param {number} [timeout=10000] - Timeout for waiting
   * @returns {Promise<string>} The selected airline label text
   */
  async selectFirstFqtvCarrier(index = 0, timeout = 10000) {
    const select = this.page.locator(SELECTORS.FQTV_CARRIER_SELECT).nth(index);
    await select.waitFor({ state: 'visible', timeout });
    await select.click();

    const option = this.page.locator(`${SELECTORS.DROPDOWN_OPTION}:visible`).first();
    await option.waitFor({ state: 'visible', timeout });
    const text = (await option.textContent())?.trim() ?? '';
    await option.click();

    return text;
  }

  /**
   * Selects a specific airline from the flight frequent flyer carrier dropdown.
   * @param {string} carrierText - Visible airline text to select
   * @param {number} [index=0] - Segment index in the frequent flyer form
   * @param {number} [timeout=10000] - Timeout for waiting
   * @returns {Promise<string>} The selected airline label text
   */
  async selectFqtvCarrier(carrierText, index = 0, timeout = 10000) {
    if (!carrierText || typeof carrierText !== 'string') {
      throw new Error('carrierText must be a non-empty string');
    }

    const select = this.page.locator(SELECTORS.FQTV_CARRIER_SELECT).nth(index);
    await select.waitFor({ state: 'visible', timeout });
    await select.click();

    const input = this.page.locator(SELECTORS.FQTV_CARRIER_INPUT).nth(index);
    await input.waitFor({ state: 'visible', timeout });
    await input.click();
    await input.fill(carrierText);

    const option = this.page.locator(`${SELECTORS.FQTV_CARRIER_OPTION_TEXT}:visible`).filter({ hasText: carrierText }).first();

    try {
      await option.waitFor({ state: 'visible', timeout: 3000 });
      await option.click();
    } catch {
      await input.press('ArrowDown');
      await input.press('Enter');
    }

    return carrierText;
  }

  /**
   * Fills the flight frequent flyer number input.
   * @param {string} number - Frequent flyer number to enter
   * @param {number} [index=0] - Segment index in the frequent flyer form
   * @param {number} [timeout=10000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async fillFqtvNumber(number, index = 0, timeout = 10000) {
    if (!number || typeof number !== 'string') {
      throw new Error('number must be a non-empty string');
    }

    const input = this.page.locator(SELECTORS.FQTV_NUMBER_INPUT).nth(index);
    await input.waitFor({ state: 'visible', timeout });
    await input.fill(number);
  }

  /**
   * Waits for the flight frequent flyer green success icon to be visible.
   * @param {number} [timeout=30000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async waitForFqtvSuccessIcon(timeout = 30000) {
    await this.page.locator(SELECTORS.FQTV_SUCCESS_ICON).waitFor({ state: 'visible', timeout });
  }

  /**
   * Checks whether the flight frequent flyer section shows the green success icon.
   * @returns {Promise<boolean>}
   */
  async hasFqtvSuccessIcon() {
    return this.page.locator(SELECTORS.FQTV_SUCCESS_ICON).isVisible();
  }

  /**
   * Checks whether a gender radio button is checked in the flight passenger info extras.
   * @returns {Promise<boolean>} true if Male or Female radio is checked
   */
  async isGenderSelected() {
    const section = this.page.locator(SELECTORS.PASSENGER_INFO_SECTION);
    await section.waitFor({ state: 'visible', timeout: 15000 });

    const checkedRadios = section.locator('.el-radio.is-checked');
    return (await checkedRadios.count()) > 0;
  }
}

// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS,
};