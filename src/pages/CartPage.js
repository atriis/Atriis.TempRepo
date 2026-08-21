const { expect } = require("@playwright/test");
const { waitForText } = require("@utils/wait");
const { parseAmountText, extractHtmlLinks } = require("@utils/dom");
const { getNetworkInterceptor } = require("@utils/networkInterceptor");
const config = require("@config/config");
const { SELECTORS: SEARCH_SELECTORS } = require("@pages/SearchPage");

/**
 * Page Object for cart page.
 * Contains only UI-level interactions.
 */

// Canonical, correctly-spelled cancellation-confirmed message. Single source of truth shared by the
// visibility checks and the spelling assertion so the literal is never re-typed (and can't drift).
const CANCELLATION_CONFIRMED_TEXT = "Cancellation confirmed!";

// How long a mandatory UK Rail (Evolvi) extras row may take to persist — see
// fillAllMandatoryEvolviExtras. Sized for the slowest row, the seat reservation.
const EVOLVI_EXTRAS_SAVE_TIMEOUT_MS = 45000;

// UK Rail (Evolvi) seat reservation save endpoint (uk-rail.service.ts POSTs the whole
// IUkRailSeatsSaveReq here). The request body is the only place the coach actually sent to the
// supplier can be read — the panel's Coach dropdown labels every option with the coach letter
// whether or not it is the bound value (test 62143).
const UK_RAIL_SEATS_API_PATH = '/EvolviSeats';

const SELECTORS = {

  // Cart general selectors
  TERMS_CHECKBOX: ".quote-terms-checkbox .el-checkbox__inner",
  TERMS_CHECKBOX_INPUT: ".quote-terms-checkbox .el-checkbox__input",
  PROCEED_TO_CHECKOUT_BUTTON: ".btn-container:has-text('Proceed to Checkout')",
  // The native <button class="btn"> rendered by app-btn behind the cart CTA (trip-summary #btn
  // slot). Used for the disabled-state check: app-btn binds `:disabled="isCheckoutDisabled"`, so
  // for a look-but-not-book role the element carries the native `disabled` attribute.
  PROCEED_TO_CHECKOUT_NATIVE_BTN: "button.btn:has-text('Proceed to Checkout')",
  // Same native CTA, matched only while it is actionable. app-btn re-disables the button for a
  // beat whenever the cart re-validates (e.g. right after an OOP justification is saved), and the
  // outer `.btn-container` we click is a plain div — so clicking during that window is a silent
  // no-op that leaves the run sitting on the cart. Gate every click on this instead.
  PROCEED_TO_CHECKOUT_ENABLED_BTN:
    "button.btn:has-text('Proceed to Checkout'):not([disabled]):not(.disabled):not(.is-disabled)",
  // Same cart CTA as Proceed to Checkout, but relabelled "Send For Approvals" when the
  // user's trip requires pre-booking approval (trip-cart.vue: isPreBookingNeeded).
  SEND_FOR_APPROVAL_BUTTON: ".btn-container:has-text('Send For Approvals')",
  QUOTE_STATUS_LABEL: ".app-label--quote",
  QUOTE_CARD_STATUS_LABEL: '.quote-payment-card .app-label--quote',
  QUOTE_PAYMENT_CARD: '.quote-payment-card',

  // Per-Diem quote card (trip overview) — per-diem-quote-card.vue wraps base-quote-card/header.
  // The card root carries both `.quote-payment-card` and `.per-diem-quote-card` classes; the
  // status badge (`.app-label--quote`) is rendered by the nested base-quote-header.
  PER_DIEM_QUOTE_TYPE_VALUE: '.per-diem-quote-card .quote-info > p:first-child .muliSemiBold',
  PER_DIEM_QUOTE_TITLE: '.per-diem-quote-card h5.center-title',
  PER_DIEM_QUOTE_STATUS_LABEL: '.per-diem-quote-card .app-label--quote',
  // Card root — a data/locale-independent "card rendered" anchor for per-diem verifications.
  PER_DIEM_QUOTE_CARD: '.per-diem-quote-card',
  // The "N Personal days deducted" span on the per-diem quote card (35726). It is gated by
  // `v-if="quote.vacationDays > 0"` in per-diem-quote-card.vue, so it renders ONLY once days off
  // were deducted (persisted after proceeding through booking); its text is "{N} Personal days deducted".
  PER_DIEM_QUOTE_VACATION: '.per-diem-quote-card .vacation',
  // Total-price amount shown on the per-diem quote card (base-quote-card header → app-price →
  // `.amount`). Its text is the numeric total with no currency symbol inside `.amount`, e.g. "3000.00".
  PER_DIEM_QUOTE_AMOUNT: '.per-diem-quote-card .amount',
  // Edit affordance(s) in the per-diem card's read-only actions container (`.box-center .btns`).
  // Per per-diem-quote-card.vue that container holds ONLY the "Edit details" button, gated by
  // `v-if="canEditPerDiem"` — empty for a locked quote, populated for an editable one. Matching
  // *any element child* (not a localized label or a specific tag) keeps the negative "not
  // editable" check from silently passing under a different locale or a changed button render.
  PER_DIEM_QUOTE_EDIT_CONTROLS: '.per-diem-quote-card .box-center .btns > *',

  // Per-Diem breakdown (per-diem-breakdown.vue, rendered inside the quote card's extras section).
  // The component wraps its table in the shared `extras-layout`, so it opens in two steps like the
  // attach-files extra: expand the quote-card extras collapse, then click the "View" toggle.
  // IMPORTANT: every quote card renders its OWN `.extras-collapse-container`, so the per-diem
  // collapse header is scoped to `.per-diem-quote-card` — otherwise a flight card's extras (added
  // in the same trip) would be opened instead. All breakdown selectors below carry `:visible`
  // because the cart renders hidden responsive duplicates, and a bare `.first()` can otherwise
  // resolve to a permanently-hidden copy (observed: 24 hidden "View" spans → click timeout).
  PER_DIEM_EXTRAS_COLLAPSE_HEADER: '.per-diem-quote-card .extras-collapse-container .el-collapse-item__header:visible',
  PER_DIEM_BREAKDOWN: '.per-diem-breakdown',
  PER_DIEM_BREAKDOWN_VIEW_BTN: '.per-diem-breakdown .extra__btns .is-clickable:visible',
  // Title inside the OPEN breakdown card (`el-card.extras-card`), reads "Per diem breakdown". The
  // collapsed extras-layout renders its own `.card-title`, so scoping to `.extras-card` makes this
  // a true "breakdown expanded" anchor rather than matching the still-collapsed header.
  PER_DIEM_BREAKDOWN_CARD_TITLE: '.per-diem-breakdown .extras-card .card-title:visible',
  // Edit / Add-line buttons in the open breakdown's actions row. Both are gated behind
  // `v-if="canEditTable"` in per-diem-breakdown.vue, so they are absent from the DOM when the
  // breakdown is locked (auto-created after issuing a flight). Scoped to `button` inside the open
  // `.extras-card` so they never match the collapsed extras-layout's `.is-clickable` <span>s, and
  // matched by their English labels (the only way these sibling buttons differ — Export/Close are
  // not gated). Runs are English-locale (Testim asserted the literal "Breakdown"/"Add line" text).
  PER_DIEM_BREAKDOWN_EDIT_BTN: '.per-diem-breakdown .extras-card button:has-text("Edit"):visible',
  PER_DIEM_BREAKDOWN_ADD_LINE_BTN: '.per-diem-breakdown .extras-card button:has-text("Add line"):visible',
  // Per-Diem breakdown EDIT flow (33094 "new method" — an editable breakdown, `canEditTable` true).
  // Data rows exclude the header row (`.muliSemiBold`); `:visible` avoids the cart's hidden
  // responsive duplicate tables (see the breakdown-selector note above).
  PER_DIEM_BREAKDOWN_DATA_ROW: '.per-diem-breakdown .extras-card .breakdown-table .table-row:not(.muliSemiBold):visible',
  // Sub-selectors applied RELATIVE to a data row (see setPerDiemBreakdownRowDeduction / …Comment).
  // In edit mode the deduction cell holds an app-select (el-select) and the comment cell an el-input.
  PER_DIEM_BREAKDOWN_ROW_DEDUCTION_TRIGGER: '.deduction .el-select__wrapper',
  PER_DIEM_BREAKDOWN_ROW_COMMENT_INPUT: '.comment-text input',
  // Save button inside the breakdown edit form's actions row (`.btns`), present only in edit mode.
  PER_DIEM_BREAKDOWN_SAVE_BTN: '.per-diem-breakdown .extras-card .btns button:has-text("Save"):visible',
  // Deduction cells of the READ-ONLY breakdown rows (post-save `<p>` view) — the anchor for the
  // saved-deduction assertion. Excludes the header row and hidden responsive duplicates.
  PER_DIEM_BREAKDOWN_DEDUCTION_CELL: '.per-diem-breakdown .extras-card .breakdown-table .table-row:not(.muliSemiBold) .deduction p:visible',
  // Per-Diem breakdown ADD-LINE flow (33095 "new method" — the inline `.add-line` form shown via
  // `showLineToAdd`, gated behind `canEditTable`). Per per-diem-breakdown.vue the form holds a
  // datepicker, an airport-autocomplete destination, a deduction app-select, a percent input and a
  // comment input. `:visible` guards against the cart's hidden responsive duplicates (see note above).
  // Readonly datepicker input; click to open the teleported EP panel, then pick an available day. A
  // date is mandatory (vuelidate `required`) and, with the destination, triggers the async price calc.
  PER_DIEM_ADD_LINE_DATE_INPUT: '.per-diem-breakdown .add-line .per-diem-date-picker input:visible',
  // Destination airport-autocomplete: type ≥3 chars to trigger the airport search, then click a
  // result in the shared `boxed-autocomplete-popper`. Selecting the destination triggers the calc.
  PER_DIEM_ADD_LINE_DEST_INPUT: '.per-diem-breakdown .add-line .destination-autocomplete input:visible',
  PER_DIEM_ADD_LINE_DEST_OPTION: '.boxed-autocomplete-popper:visible .autocomplete-result',
  // The deduction is the ONLY app-select in the add-line form (date/dest/percent/comment are not).
  PER_DIEM_ADD_LINE_DEDUCTION_TRIGGER: '.per-diem-breakdown .add-line .app-select .el-select__wrapper:visible',
  PER_DIEM_ADD_LINE_COMMENT_INPUT: ".per-diem-breakdown .add-line input[placeholder='Comment']",
  // The add-line form (`v-if="showLineToAdd"`) is removed from the DOM once the line is saved
  // (addLine → setShowLineToAdd(false)); its detachment is the "save accepted" signal. No `:visible`
  // here so a detached-state wait is meaningful.
  PER_DIEM_ADD_LINE_FORM_ANY: '.per-diem-breakdown .add-line',
  // Element-Plus date-picker panel (teleported to <body>) + its selectable day cells.
  DATE_PICKER_PANEL_VISIBLE: '.el-picker-panel:visible',
  DATE_PICKER_AVAILABLE_DAY: 'td.available .el-date-table-cell__text',
  // The selectable day CELL (parent of the text span) — a stable, sized click target.
  DATE_PICKER_AVAILABLE_DAY_CELL: 'td.available',

  // Per-Diem breakdown EXPORT-TO-EXCEL flow (33096). The "Export to excel" button lives in the same
  // open-breakdown actions row (`.btns`) as Edit/Save/Close, but is NOT gated behind `canEditTable`
  // (per per-diem-breakdown.vue it renders whenever the breakdown is not in edit/add-line mode).
  // Matched by its English label; `:visible` guards against the cart's hidden responsive duplicates.
  PER_DIEM_BREAKDOWN_EXPORT_BTN: '.per-diem-breakdown .extras-card .btns button:has-text("Export to excel"):visible',
  // The "Additional currency" confirm popup (app-confirm.vue → el-dialog with class `app-confirm`).
  // It is appended to <body> (append-to-body), so it is NOT scoped to `.per-diem-breakdown`.
  EXCEL_CURRENCY_DIALOG: '.el-dialog.app-confirm:visible',
  // The primary "Yes" button in that dialog's footer (`.app-footer`), which fires the export/download.
  EXCEL_CURRENCY_DIALOG_CONFIRM_BTN: '.app-confirm .app-footer .btn--primary:visible',

  // Per-Diem DAYS OFF at checkout (35694 — per-diem-days-off.vue). The section renders in checkout
  // for a per-diem trip. `:visible` guards the cart/checkout's hidden responsive duplicates.
  PER_DIEM_DAYS_OFF_SECTION: '.per-diem-days-off',
  // The "I have days off in the trip" checkbox that reveals the date-range inputs. Its label is the
  // "days off exists" anchor (Testim waited for it to contain "I have days off"); clicking the
  // el-checkbox root (a <label>) toggles it.
  PER_DIEM_DAYS_OFF_CHECKBOX_LABEL: '.per-diem-days-off .el-checkbox__label:visible',
  PER_DIEM_DAYS_OFF_CHECKBOX: '.per-diem-days-off .days-off-inputs-container .el-checkbox:visible',
  // One wrapper per days-off range (vacation): index 0 = first range, 1 = second, etc. Each holds a
  // start app-datepicker, an end app-datepicker, and the read-only day counter.
  PER_DIEM_DAYS_OFF_RANGE_WRAPPER: '.per-diem-days-off .days-off-inputs-wrapper:visible',
  // The two app-datepicker inputs inside a range wrapper (start then end). Applied RELATIVE to a wrapper.
  PER_DIEM_DAYS_OFF_DATE_INPUT: '.days-off-date-input input',
  // Read-only "days off" counter inside a range wrapper (days = calendar-diff(end,start)+1). Applied
  // RELATIVE to a wrapper.
  PER_DIEM_DAYS_OFF_SUM_INPUT: '.sum-days-readonly-input',
  // The "More days off in the trip" add button — its material-symbols icon reads exactly "add"
  // (the per-range remove icon reads "close"), so :text-is("add") targets only the add control.
  PER_DIEM_DAYS_OFF_ADD_RANGE_ICON: '.per-diem-days-off .add-icon:text-is("add"):visible',

  QUOTE_CARD_PRICE_AMOUNT: '.price-wrapper .amount, .product-extra-info .amount',
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

  // Trip actions dropdown selectors
  TRIP_ACTIONS_DROPDOWN_ICON: ".dropdowns-container .expand-icon",
  CANCEL_TRIP_OPTION: ".el-dropdown-menu__item span.mr-2",
  CANCEL_TRIP_DROPDOWN_ITEM: ".el-dropdown-menu__item",
  COPY_TRIP_OPTION: ".el-dropdown-menu__item",
  COPY_TRIP_DIALOG: ".copy-trip-dialog",
  COPY_TRIP_CONFIRM_BUTTON: ".copy-trip-dialog .app-footer .btn--primary",
  COPY_TRIP_CANNOT_COPY_INDICATOR: ".copy-trip-dialog .can-not-copy",
  COPY_TRIP_CANCEL_BUTTON: ".copy-trip-dialog .app-footer .cancel-btn",
  // Copy-trip dialog body (copy-trip-modal.vue). The intro paragraph is anchored with a direct-child
  // chain on purpose: `p.regular-text` is ALSO rendered inside each ineligible quote row ("This item
  // can not be copied"), so an unanchored `.regular-text p` can resolve to the wrong paragraph.
  COPY_TRIP_DIALOG_MESSAGE: '.copy-trip-dialog .cancel-trip-modal > .regular-text > p',
  // One row per copied quote; read each row's own status label rather than a page-wide nth() so the
  // assertion does not depend on which product occupies which row.
  COPY_TRIP_DIALOG_QUOTE_ROW: '.copy-trip-dialog .quote-details-container .quote-details',
  COPY_TRIP_DIALOG_QUOTE_STATUS: '.app-label--quote',
  // Row-relative (like COPY_TRIP_DIALOG_QUOTE_STATUS above) — always resolved INSIDE a
  // COPY_TRIP_DIALOG_QUOTE_ROW, never page-wide: the dialog's intro paragraph is also a
  // `p.regular-text`. Present only on a quote that cannot be copied, where copy-trip-modal.vue
  // renders $t('trip.canNotCopyItem') in place of the status label.
  COPY_TRIP_DIALOG_QUOTE_WARNING: 'p.regular-text',
  // Row-relative product name (h2.bold-text = quoteName(quote)), used to identify which row a
  // reading came from in assertion messages.
  COPY_TRIP_DIALOG_QUOTE_NAME: 'h2.bold-text',
  TICKET_DETAILS_SECTION: ".ticket-details",
  SHOW_CANCELLED_ITEMS_OPTION: '.el-dropdown-menu__item',
  TRIP_CANCELLATION_DIALOG_TITLE: "[aria-label='Trip cancellation'] .el-dialog__title",
  // Terminal failure state of the cancellation dialog (cancel-trip-modal.vue renders
  // <p class="bold-text cancel-trip-error"> with trip.cancelTripError when a supplier refuses to
  // cancel one or more items). Matched structurally so the wording can change without breaking.
  TRIP_CANCELLATION_ERROR: '.cancel-trip-modal .cancel-trip-error',
  CONFIRM_CANCEL_BUTTON: "role=button[name='Cancel trip']",
  CANCELLATION_SUCCESS_MESSAGE: "text='Cancellation confirmed!'",
  // Title on the cancellation-confirmed page; renders $t('trip.cancellationConfirmed') + '!'. Matched
  // structurally (not by text) so its actual rendered text can be read to verify correct spelling.
  CANCELLATION_CONFIRMED_TITLE: '.booking-success .msg-title',
  // Quotes tabs container in the cart (el-tabs.tabs-container), scoped to the cart view (.trip-cart)
  // because the .tabs-container class is reused by profile/manual-quote/parking views.
  CART_TABS_CONTAINER: '.trip-cart .tabs-container',
  CANCELLED_QUOTES_SECTION: '.cancelled-quotes-container',
  CANCELLED_QUOTES_TITLE: '.cancelled-quotes-title',
  CANCELLED_QUOTE_CHECK_PRICE_BUTTON: '.cancelled-quotes-container .check-price-btn',
  ACTIVE_QUOTE_ACTIONS_DROPDOWN_ICON: '.quote-payment-card .base-quote-header .expand-icon.is-clickable',
  ACTIVE_QUOTE_CANCEL_OPTION: '.el-dropdown-menu__item',
  // Hotel quote "Change Dates" modification (no data-testid on this flow).
  // 3-dots (more_vert) kebab in the hotel quote's shared header; hover opens the menu.
  // Scoped to .base-quote-header (the quote-level header) so it never picks up the
  // trip-level actions kebab (.dropdowns-container .expand-icon).
  HOTEL_QUOTE_ACTIONS_ICON: '.base-quote-header .expand-icon.material-symbols-outlined',
  CHANGE_DATES_QUOTE_OPTION: '.el-dropdown-menu__item',
  // Countdown clock shown while a quote is pending modification (~30 min for Sabre hotels).
  MODIFICATION_COUNTDOWN: '.timed-quote .countdown, .timed-quote-badge',
  // "Cancel Modify" button shown in the quote header while pending modification.
  CANCEL_MODIFY_BUTTON: '.base-quote-header .btn-cancel-modify',
  // Cookie consent banner "Allow all cookies" button (CookieHub / OneTrust)
  COOKIE_ALLOW_ALL_BUTTON: '#ch2-allow-all-btn, button:has-text("Allow all cookies"), button:has-text("Allow all"), button:has-text("Accept all")',
  // Info icon inside the "Cancel trip" option in the trip-level dropdown (shown when a quote is In Progress)
  CANCEL_TRIP_INFO_ICON: '.share-popper .expand-icon.is-size-6',
  // Any option in the trip-level actions dropdown (share-popper)
  TRIP_ACTION_MENU_OPTION: '.share-popper .el-dropdown-menu__item',
  BASIC_CANCEL_QUOTE_DIALOG: '.app-confirm.dialog-no-header',
  BASIC_CANCEL_QUOTE_CONFIRM_BUTTON: '.dialog-no-header .btn--primary',
  DETAILED_CANCEL_QUOTE_MODAL: '.cancel-quote-modal',
  DETAILED_CANCEL_QUOTE_CONFIRM_BUTTON: '.cancel-quote-modal .app-footer .btn--primary',
  DETAILED_CANCEL_QUOTE_CLOSE_BUTTON: '.cancel-quote-modal .close-btn',

  // Product details selectors
  FLIGHT_DETAILS_BUTTON: ".more-details-btn",
  FLIGHT_DETAILS_DRAWER_BODY: '.app-drawer.flight-details-drawer .el-drawer__body',
  FLIGHT_DETAILS_DRAWER_CABIN_TEXT: (text) => `.app-drawer.flight-details-drawer .el-drawer__body :text("${text}")`,
  // Text-based locator for baggage advisory inside the flight details drawer body.
  // Robust against layout changes (avoids position-based selectors like :nth-child(3)).
  FLIGHT_DETAILS_DRAWER_BAGGAGE_TEXT: (text) => `.app-drawer.flight-details-drawer .el-drawer__body :text("${text}")`,
  FLIGHT_CART_MORE_DETAILS_DRAWER: "[aria-label='More details']",
  FLIGHT_CART_MORE_DETAILS_PRICE_TEXT: /\$\s*\d[\d,]*(?:\.\d+)?/,
  // Fare-rules button scoped inside the open More Details drawer. Manual quotes
  // must NOT show this button — the assertion in Cart.verifyFareRulesLinkNotVisibleInMoreDetails
  // relies on this selector returning 0 elements while the drawer is open.
  FARE_RULES_BUTTON_IN_MORE_DETAILS_DRAWER: "[aria-label='More details'] .fare-rules-btn",
  POST_TICKETING_TABLE_HEADERS: '.flight-post-ticketing-details .post-ticketing-table thead th',
  POST_TICKETING_TABLE: '.flight-post-ticketing-details .post-ticketing-table',
  POST_TICKETING_TICKET_NUMBER_TEXT: 'tbody tr td:nth-child(2) .mr-1:visible',
  POST_TICKETING_FIRST_SEAT_BUTTON: '.flight-post-ticketing-details .post-ticketing-table tbody tr:first-child td:nth-child(5) .add-seats-btn',
  MORE_DETAILS_HOTEL_BUTTON: ".more-details",
  MORE_DETAILS_CAR_BUTTON: ".more-details.is-flex",
  // Daily rate under the price on a car cart line item (car-quote-card.vue -> app-price
  // subtitle slot). Only rendered when the quote's numberOfDays > 1.
  CAR_CART_CARD_DAILY_RATE: '.product-extra-info.price-wrapper .price-subtitle p',
  // Car's own inline "More details" drawer (car-quote-card.vue el-drawer) — NOT the shared
  // hotel/flight .cart-more-details-drawer (general-quote-more-details.vue has no Car entry in
  // its typeMap). Class name is shared with the unrelated parking product's drawer, so :visible
  // is required to target only the one currently open. Same selector value as the
  // `.parking-details-drawer:visible` half of ANY_VISIBLE_DRAWER below — kept as its own
  // constant because callers here need ONLY the car/parking drawer, never the generic
  // `.el-drawer:visible` half.
  CAR_MORE_DETAILS_DRAWER: '.parking-details-drawer:visible',
  // Price-breakdown rows in the car drawer's "Price Summary" section — each is a `.price-item`
  // div with two <p> children (label, value), in a FIXED template order: Price Per day (0),
  // Subtotal (1), Tax, Surcharges, [Handling Fee], Cancellation Service.
  CAR_MORE_DETAILS_PRICE_ITEMS: '.price-breakdown .price-summary .price-item',
  // Generic "More details" trigger that matches both hotel cart items (.more-details)
  // and flight cart items (.more-details-btn). Used by Cart.openMoreDetailsInCart
  // so a single Gherkin step works across hotel and flight manual quotes.
  MORE_DETAILS_BUTTON_ANY: ".more-details-btn, .more-details",
  // Any VISIBLE "More details" trigger, whatever the product: flights/rail render an app-btn
  // `.more-details-btn`, hotels/cars a `.more-details` wrapper. `:visible` keeps the mobile
  // duplicate of the same card out. Used as the "the booked trip overview has finished rendering"
  // gate before a post-booking price is read (test 67503).
  MORE_DETAILS_BUTTON_ANY_VISIBLE: '.more-details-btn:visible, .more-details:visible',
  // Any visible Element-Plus drawer (used to read text from whichever drawer is currently open)
  ANY_VISIBLE_DRAWER: '.el-drawer:visible, .parking-details-drawer:visible',
  // Inner anchor inside a More Details wrapper (car quote uses div > a pattern)
  MORE_DETAILS_INNER_LINK: 'a',
  LOCATION_LABEL: ".location-lines .location-address-text",
  CITY_CENTER_ADDRESS: '.location-label + a[target="_blank"]',
  LOCATION_CITY_CENTER: '.has-text-weight-bold.is-size-7',
  LOCATION_AIRPORT: 'a[href*="maps.google.com"][target="_blank"]',
  LOCATION_ADDRESS_TEXT: ".location-address-text",
  LOCATION_DETAILS_BTN: ".location-details-link",
  CAR_LOCATION_DETAILS_TOOLTIP: ".car-location-details-tooltip",
  TOOLTIP_ANY_ADDRESS: ".car-location-details-tooltip .location-address-plain",
  TOOLTIP_PICKUP_ADDRESS: ".car-location-details-tooltip .pickup-details .location-address-plain",
  TOOLTIP_DROPOFF_ADDRESS: ".car-location-details-tooltip .dropoff-details .location-address-plain",
  LOCATION_TYPE_LABEL: ".location-type-label",

  // Trip Overview selectors
  TRIP_OVERVIEW_TITLE: ".payments-title",
  TRIP_OVERVIEW_STATUS_LABEL: 'xpath=//*[contains(@class,"payments-title")]/following-sibling::*[contains(@class,"app-label")][1]',

  // "Trip reference form" option label ($t('cart.extraAction.tripReferenceForm')) in the trip actions
  // menu — opens the reference-fields dialog holding the financial reference. The menu trigger and item
  // container are reused from TRIP_ACTIONS_DROPDOWN_ICON + TRIP_ACTION_MENU_OPTION (same .share-popper
  // menu as "Cancel trip"); this text selects the item, matched by text (not index) since item
  // visibility is dynamic (approvals/copy/cancel items are conditional).
  TRIP_REFERENCE_FORM_MENU_TEXT: 'Trip reference form',
  // Reference-fields dialog (trip-app.vue el-dialog wrapping .ref-container) shown for the financial reference details.
  REFERENCE_FORM_DIALOG: '.el-dialog:has(.ref-container)',
  REFERENCE_FORM_DIALOG_CLOSE: '.el-dialog:has(.ref-container) .el-dialog__headerbtn',
  // Selected financial reference value shown in the (disabled) el-select inside the .financial-section.
  FINANCIAL_REFERENCE_FIELD_VALUE: '.financial-section .el-select__placeholder span',

  // Trip title and destination selectors (cart-info-bar.vue)
  TRIP_TITLE: '.cart-info-bar h4.trip-title',
  TRIP_ID_DISPLAY: '.cart-info-bar p.trip-id',
  TRIP_DESTINATION_INFO: '.cart-info-bar .info-wrapper p',

  // Quote title selector (base-quote-header.vue)
  QUOTE_TITLE: '.quote-payment-card h6.quote-title',
  FLIGHT_QUOTE_HEADING_TEXT: 'Flight to',
  FIRST_QUOTE_TITLE: '.quote-payment-card:not(.last-quote) h6.quote-title',
  LAST_QUOTE_TITLE: '.last-quote h6.quote-title',
  LAST_QUOTE_STATUS_LABEL: '.last-quote .app-label--quote',
  PNR_CODE: '.pnr-code',
  FLIGHT_QUOTE_NUMBER_TEXT: '.flight-info.cart-format .carrier-container .carrier-name + p',

  // Product-scoped quote destination titles (base-quote-header.vue h6.quote-title). Both the flight
  // and car quote cards are .quote-payment-card, so in a parallel flight+car trip the generic
  // QUOTE_TITLE .first() only reads the flight; these scope to the specific product card.
  FLIGHT_QUOTE_TITLE: '.flight-quote-card h6.quote-title',   // e.g. "Flight to Budapest"
  CAR_QUOTE_TITLE: '.car-quote-card h6.quote-title',         // e.g. "Car rental in ... Hungary"

  // Flight quote segment times in the trip overview (flight-preview-segment.vue, isCart=true).
  // Outbound segment carries .not-last-segment; its arrival time is the right-aligned
  // (.is-align-items-end) .flight-time. The return segment is the last one (NOT .not-last-segment);
  // its departure time is the first .flight-time inside its .flight-duration.
  FLIGHT_QUOTE_OUTBOUND_ARRIVAL_TIME: '.flight-quote-card .flight-info.cart-format.not-last-segment .is-align-items-end .flight-time',
  FLIGHT_QUOTE_RETURN_DEPARTURE_TIME: '.flight-quote-card .flight-info.cart-format:not(.not-last-segment) .flight-duration .flight-time',

  // "To pay" price block on the flight quote card (flight-extra-info.vue, isCart=true). The .to-pay
  // span is shared with two other states — "Price starts from" outside the cart and "Expired offer"
  // for a lapsed quote — so reading its text is what proves the quote is live and payable. ':visible'
  // skips the hidden responsive duplicates the cart keeps mounted.
  FLIGHT_QUOTE_TO_PAY_LABEL: '.flight-quote-card .flight-extra-info .to-pay:visible',
  FLIGHT_QUOTE_TO_PAY_PRICE: '.flight-quote-card .flight-extra-info .price-wrapper .price:visible',

  // EU rail (Benerail) quote card in the cart (eu-rail-quote-card.vue). Used for absence checks: a
  // copied trip must not carry over a rail quote, which is not eligible for copy.
  EU_RAIL_QUOTE_CARD: '.eu-rail-quote-card',

  // The rail quote's carrier name(s), rendered by the same eu-rail-route-details.vue component the
  // results cards use (one block per leg of the journey, in leg order — see
  // BenerailResultsPage.ROUTE_DETAILS_CARRIER_NAME for why .supplier-name and not
  // .train-carrier-text). Desktop-only in the quote card: the mobile branch prints carrier names
  // as plain .title-suppliers paragraphs instead.
  EU_RAIL_QUOTE_ROUTE_CARRIER_NAME: '.eu-rail-quote-card .eu-rail-route-details .supplier-name',

  // One block per leg of the rail quote — eu-rail-quote-card.vue's v-for over quote.segments, in
  // leg order, so index 0 is the outbound and index 1 the return (same leg ordering as
  // clickRailFareRulesButton's segmentIndex). `.ticket-title` appears exactly once in that
  // component, so scoping it to the rail card is enough to isolate the per-leg blocks.
  EU_RAIL_QUOTE_SEGMENT: '.eu-rail-quote-card .ticket-title',
  // That leg's travel class, e.g. "1st Class" (eu-rail-quote-card.vue's getClass(segment)).
  // Relative to EU_RAIL_QUOTE_SEGMENT — see getEuRailQuoteSegmentClass, do not prefix with
  // '.eu-rail-quote-card' again. Two nodes in the component carry this class, each behind a
  // mutually exclusive guard: a <p> gated on `!(isMobile && isBeneMooveRail)` and a <span> gated on
  // `isBeneMooveRail && isMobile`. On the desktop viewport the suite runs at, only the <p> mounts.
  EU_RAIL_QUOTE_SEGMENT_CLASS: '.rail-class',

  // "Mobile Barcode" button on a BOOKED rail quote card. eu-rail-quote-card.vue renders it in its
  // #booking-confirm-voucher slot, which base-quote-card.vue forwards to booking-confirm-layout.vue's
  // .box-right, and only when the supplier returned barcode URLs (v-if="barcodeUrls.length") — so the
  // button being rendered at all is what proves this booking carries a mobile barcode. Scoped to the
  // rail card because the car and hotel quote cards fill the same slot with their own buttons.
  EU_RAIL_MOBILE_BARCODE_BUTTON: '.eu-rail-quote-card .box-right .btns-container button:has-text("Mobile Barcode")',
  // The barcode dialog is appended to <body> (append-to-body), so it sits outside the quote card, and
  // the trip overview keeps other el-dialogs mounted but hidden. It is therefore identified by the
  // barcode image only it owns and filtered to the visible one — see getEuRailMobileBarcodeDialog.
  EU_RAIL_MOBILE_BARCODE_DIALOG: '.el-dialog',
  // One <img class="barcode-img"> per barcode URL inside .barcode-dialog — app-img.vue renders the
  // <img> as its own root, so the class lands on the image itself and not on a wrapper.
  EU_RAIL_MOBILE_BARCODE_IMAGE: '.barcode-dialog .barcode-img',
  // Same two shapes as SHARE_DIALOG_CLOSE: the app skins some el-dialog headers with its own svg icon
  // and leaves the stock .el-dialog__headerbtn in others. Resolved inside the barcode dialog only.
  EU_RAIL_MOBILE_BARCODE_DIALOG_CLOSE: '.el-dialog__header [fill="currentColor"], .el-dialog__headerbtn',

  // UK rail (Evolvi) quote card route row in the cart. uk-rail-quote-card.vue renders one
  // <uk-rail-segment-info> per quote.segments entry, and that component's `.segment-route` block
  // holds exactly two <p> nodes — origin (`segment.originForSearch`) then destination
  // (`segment.destinationForSearch`) — separated by an arrow_right_alt icon span. Both values are
  // the supplier's own "Station Name (CRS)" strings with a space forced before the bracket
  // (`.replace('(', ' (')`), e.g. "Newcastle (NCL)". Rows follow journey order, so index 0 is the
  // outbound leg and index 1 the inbound leg of a round trip — see getUkRailRoute.
  UK_RAIL_SEGMENT_ROUTE: '.uk-rail-quote-card .uk-rail-segment-info .segment-route',
  // The two station <p> nodes of a single UK_RAIL_SEGMENT_ROUTE row, which holds nothing else but
  // them and the arrow icon span between them. ':scope >' marks this as resolved RELATIVE to a row
  // locator — see getUkRailRoute; do not prefix it with '.uk-rail-quote-card' again.
  UK_RAIL_SEGMENT_ROUTE_STATION: ':scope > p',

  // UK rail (Evolvi) split-ticket ticket-type row in the cart. uk-rail-segment-info.vue swaps the
  // plain `.muliBold` description for a `.has-text-weight-bold` paragraph carrying the SplitTix
  // glyph plus "SplitTix <fare class>" whenever `segment.isSplitTicket` — so the glyph and the label
  // are the two things that prove the cart kept the split ticket.
  // The glyph is looked for inside the More details drawer too, where
  // general-quote-more-details.vue mounts uk-rail-more-details.vue — which renders
  // uk-rail-segment-info again (this time with `isMoreDetails`), followed by the per-leg
  // "Remain on the train, change ticket" lines. That drawer is MORE_DETAILS_DRAWER_CONTAINER.
  UK_RAIL_SPLIT_TICKET_SEGMENT: '.uk-rail-quote-card .uk-rail-segment-info',
  UK_RAIL_SPLIT_TICKET_ICON: '.evolvi-splittix-icon',

  // The footer line under one UK rail segment's route, which prints "Travel dates: <date>" then
  // "Ticket type: <description>" then the "Fare rules" link (uk-rail-segment-info.vue's
  // .segment-info-footer). One row per quote segment in journey order, so index 0 is the outbound
  // leg and index 1 the inbound leg of a round trip — the same ordering UK_RAIL_SEGMENT_ROUTE uses.
  UK_RAIL_SEGMENT_FOOTER: '.uk-rail-quote-card .uk-rail-segment-info .segment-info-footer',
  // The ticket type VALUE inside that footer, e.g. "Anytime Return". Anchored on its own
  // "Ticket type:" label rather than on a position, because the footer holds two label/value pairs
  // whose value nodes share the same `.muliBold` class — reading the wrong one would return the
  // travel date and quietly compare it against a fare name. The following sibling is picked without
  // a class filter so the split-ticket variant (`.has-text-weight-bold` + SplitTix glyph) is read
  // by the same locator instead of coming back empty. Resolved RELATIVE to
  // UK_RAIL_SEGMENT_FOOTER — see getUkRailTicketType.
  UK_RAIL_SEGMENT_TICKET_TYPE:
    'xpath=./p[contains(@class,"info-title")][normalize-space()="Ticket type:"]/following-sibling::p[1]',

  // Eticket reference on a BOOKED UK rail (Evolvi) quote in the trip overview. The quote card's
  // #booking-confirm-info slot (uk-rail-quote-card.vue, rendered only once quote.orderItemNumber
  // exists) lays out two sibling `.confirmation-number` divs — the order reference first, the
  // Eticket one second — so the row is picked by its own label rather than by position. The
  // reference itself is quote.segments[0].confNum (uk-rail-quote-card.ts getEticketRef).
  UK_RAIL_ETICKET_ROW: '.uk-rail-quote-card .confirmation-number:has-text("Eticket")',
  // Eticket value node. Staging renders it as "Eticket ref: <ref>" — label included — where the
  // component source has the label as a bare sibling text node and the span holding only the
  // reference, so the label is stripped after reading rather than assumed absent. Resolved WITHIN
  // UK_RAIL_ETICKET_ROW — see getUkRailEticketNumberFromTripOverview.
  UK_RAIL_ETICKET_VALUE: '.confirmation-number--value',

  // Car pickup/drop-off date·time label shown in the car quote card body (car-quote-card.ts
  // formattedPickupDateLabel/formattedDropoffDateLabel), e.g.
  // "03 Jul 2026 · 14:30 - 05 Jul 2026 · 10:15". Split on " - " to separate pickup from drop-off.
  CAR_QUOTE_DATE_RANGE: '.car-quote-card .date-range-text',

  // OOP Justification selectors
  OOP_JUSTIFICATION_TEXTBOX: "[placeholder='Add your justification']",
  OOP_VIOLATION_LABEL: '.out-of-policy-label', // Violation reason text shown inside .oop-justification (oop-justification.vue)
  OOP_JUSTIFICATION_SECTION: '.oop-justification', // Section containing the OOP justification dropdown/text (oop-justification.vue)
  OOP_JUSTIFICATION_SELECT: '.oop-justification .app-select .el-select', // The el-select wrapper inside the OOP justification section
  OOP_JUSTIFICATION_SELECTED_VALUE: '.oop-justification .el-select__selected-item',
  
  // Extras
  EDIT_EXTRAS_BUTTON: ".extra__btns", //All edit buttons in extras section have the same class, so we will use nth(index) to click the right one when needed
  EXTRAS_INFORMATION_FIELD: '.el-select__selected-item span', // The field that shows selected extra option
  EXTRAS_ARROW_BUTTON: '.px-4.ticket-bottom.py-4 .el-icon.el-collapse-item__arrow', // Arrow button to expand/collapse extras information
  EXTRAS_COLLAPSE_HEADER: '.px-4.ticket-bottom.py-4 .el-collapse-item__header', // Clickable header row for the extras collapse; aria-expanded reflects true open/closed state
  EXTRAS_SAVE_BUTTON_SAVING: 'button.btn.is-loading', // app-btn renders "button is-loading" while its :is-loading prop is true (app-btn.vue) — Bulma hides the label (transparent) but "Save" stays in the DOM, so filter by text to pick the extras Save button
  FLIGHT_OPTIONAL_SERVICES_TITLE: '.flight-optional-services .card-title', // "Optional Services" title in the extras section (flight-optional-services.vue)
  FLIGHT_OPTIONAL_SERVICES_EDIT_BUTTON: '.flight-optional-services .extra__btns', // Edit/Add button in the optional services extras row (flight-optional-services.vue)
  FLIGHT_OPTIONAL_SERVICES_MESSAGE: '.flight-optional-services .el-tab-pane span', // Message text inside the optional services tab content (flight-optional-services.vue)
  FLIGHT_OPTIONAL_SERVICES_OPTION_TITLE: '.flight-optional-services .service-option .option-title', // Each available service option title inside the expanded optional services panel
  FLIGHT_OPTIONAL_SERVICES_OPTION_CHECKBOX: '.flight-optional-services .el-tab-pane:visible .service-option .el-checkbox:not(.is-disabled)', // Selectable (non-disabled) service checkboxes scoped to the active traveler tab
  FLIGHT_OPTIONAL_SERVICES_OPTION_ROW: '.flight-optional-services .el-tab-pane:visible .service-option', // A whole service option row (title + checkbox) in the active traveler tab
  FLIGHT_OPTIONAL_SERVICES_ROW_CHECKBOX: '.el-checkbox:not(.is-disabled)', // Selectable checkbox, relative to a FLIGHT_OPTIONAL_SERVICES_OPTION_ROW
  FLIGHT_OPTIONAL_SERVICES_SAVE_BUTTON: '.flight-optional-services .no-border', // Save button scoped to the optional services panel (disambiguates from other simultaneously-open extras panels)
  FLIGHT_OPTIONAL_SERVICES_SUCCESS_ICON: '.flight-optional-services .material-symbols-outlined.filled.success-icon.green:visible', // Green checkmark after successful save (extras-layout.vue), scoped to the visible instance (hidden duplicates can exist, e.g. responsive layouts)
  // Flight Ancillary Services (flight-ancillary-services.vue)
  FLIGHT_ANCILLARY_SERVICES_EDIT_BUTTON: '.flight-ancillary-services .extra__btns', // Edit/Add button in the ancillary services extras row
  FLIGHT_ANCILLARY_SERVICES_CARRIER_NAME: '.flight-ancillary-services .carrier-name', // Carrier name in ancillary services segment
  FLIGHT_ANCILLARY_SERVICES_SEGMENT: '.flight-ancillary-services .segment', // Each segment row (one per flight leg)
  FLIGHT_ANCILLARY_SERVICES_SELECT_TRIGGER: '.flight-ancillary-services .app-select .el-select__wrapper', // Click to open the ancillary service dropdown
  FLIGHT_ANCILLARY_SERVICES_SEGMENT_SELECT_TRIGGER: '.app-select .el-select__wrapper', // Sub-selector — clicked relative to a segment to open its dropdown
  FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL: '.el-select-dropdown:visible', // Visible Element-Plus dropdown panel (rendered at body level)
  FLIGHT_ANCILLARY_SERVICES_DROPDOWN_OPTION: '.el-select-dropdown:visible .el-select-dropdown__item', // Dropdown option in the visible panel
  FLIGHT_ANCILLARY_SERVICES_SUCCESS_ICON: '.flight-ancillary-services .material-symbols-outlined.filled.success-icon.green', // Green checkmark after successful save
  FLIGHT_ANCILLARY_SERVICES_TRAVELER_TAB: '.flight-ancillary-services .flight-cart-tabs .el-tabs__item:visible', // Per-traveler tab inside the ancillary services panel
  FLIGHT_ANCILLARY_SERVICES_VISIBLE_SEGMENT: '.flight-ancillary-services .el-tab-pane:visible .segment', // Segment row scoped to the active traveler tab (multi-pax)
  // Flight Ancillary Options (flight-ancillary-options.vue) — passenger-based single dropdown
  FLIGHT_ANCILLARY_OPTIONS_EDIT_BUTTON: '.flight-ancillary-options .extra__btns', // Edit/Add button in the ancillary options extras row
  FLIGHT_ANCILLARY_OPTIONS_CARD_TITLE: '.flight-ancillary-options .card-title', // "Ancillary Options" card title rendered by extras-layout slot (visible whenever the section exists and extras is open)
  FLIGHT_ANCILLARY_OPTIONS_SELECT_TRIGGER: '.flight-ancillary-options .app-select .el-select__wrapper', // Click to open the ancillary options dropdown
  FLIGHT_ANCILLARY_OPTIONS_FILLED_INDICATOR: '.flight-ancillary-options .material-symbols-outlined.filled.success-icon.green', // Green filled indicator after successful save
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
  // Seat map drawer host (flight-quote-card.vue — el-drawer.app-drawer.flight-details-drawer.seats,
  // destroy-on-close). Saving seats keeps it open behind a loading mask until the save call
  // returns, so this is the post-condition to wait on after "Save And Close".
  SEAT_MAP_DRAWER: '.app-drawer.flight-details-drawer.seats',
  CART_TOTAL_PRICE: '.price-total .amount', // Grand total in the cart summary sidebar (trip-summary.vue)
  PRICE_CHANGE_PREV_PRICE: '.booking-response-errors .prev-price', // Previous price in the price-change modal
  PRICE_CHANGE_UPDATED_PRICE: '.booking-response-errors .updated-price', // New price in the price-change modal
  // ADO 77842 — "Checkout notification" price-change modal. The modal body is
  // trip-booking-response-errors.vue (.booking-response-errors); each changed item is a
  // booking-response-preview.vue card. Rendered inside an app-confirm el-dialog.
  PRICE_CHANGE_DIALOG: ".el-dialog:has(.booking-response-errors)",
  PRICE_CHANGE_TITLE: ".booking-response-errors h5.muliBold", // section title ("Price change")
  PRICE_CHANGE_BODY_TEXT: ".booking-response-errors p.muliRegular", // body copy under the title
  PRICE_CHANGE_PREVIEW: ".booking-response-errors .preview-container",
  PRICE_CHANGE_HOTEL_NAME: ".booking-response-errors .preview-container .quote-results__name",
  PRICE_CHANGE_DATES: ".booking-response-errors .preview-container .quote-results__dates",
  PRICE_CHANGE_STATUS_LABEL: ".booking-response-errors .preview-container .app-label--quote",
  PRICE_CHANGE_ALL_PRICES: ".booking-response-errors .preview-container .prev-price, .booking-response-errors .preview-container .updated-price",
  // Footer action buttons of the dialog, excluding the header close (X) button. NOTE: confirm
  // this scope on the first live run — app-confirm's footer markup may need tightening.
  PRICE_CHANGE_FOOTER_BUTTON: ".el-dialog:has(.booking-response-errors) .el-dialog__footer button, .el-dialog:has(.booking-response-errors) button:not(.el-dialog__headerbtn):not(.el-dialog__close)",
  // Cart hotel quote card stay dates (hotel-preview.vue, cart context — "<checkIn> - <checkOut>")
  HOTEL_PREVIEW_DATES: "section.hotel-preview .dates",
  NUMBER_OF_BAGGAGE_DROPDOWN_FIELD: "//span[normalize-space()='Number of baggage']", // XPath used due to complex dropdown structure - TODO: adjust when we have a data-test-id selector.
  DROPDOWN_OPTION: 'li.el-select-dropdown__item', // Dropdown option selector (used with hasText filter for partial matching)
  BAGGAGE_CLICKABLE: '.flight-baggage .is-clickable',
  BAGGAGE_SAVE_BUTTON: '.flight-baggage .no-border',
  BAGGAGE_TRAVELER_TAB: '.flight-baggage .flight-cart-tabs .el-tabs__item:visible',
  GREEN_ICON_BAGGAGE: ".flight-baggage .material-symbols-outlined.filled.success-icon.green",  // Green icon next to added baggage
  GREEN_ICON_BAGGAGE_VISIBLE: ".flight-baggage .material-symbols-outlined.filled.success-icon.green:visible", // Same icon, scoped to the currently visible instance (multiple hidden duplicates can exist, e.g. responsive layouts)
  BAGGAGE_SELECTED_TAG: '.flight-baggage .el-tab-pane:visible .el-tag',
  BAGGAGE_SELECTED_OPTION: '.flight-baggage .el-select__selected-item span', // Selected baggage option text inside the flight-baggage section
  BAGGAGE_EXTRAS_CARD: '.flight-baggage .extras-card:visible', // Visible only when the baggage panel is expanded
  BAGGAGE_SEGMENT_ROW: '.flight-baggage .el-tab-pane:visible .segment', // One row per flight direction (idx 0 = outbound, idx 1 = inbound)
  BAGGAGE_SEGMENT_SELECT_TRIGGER: '.el-select__wrapper', // Sub-selector — clicked relative to a segment row to open its dropdown
  BAGGAGE_DROPDOWN_PANEL: '.el-select-dropdown:visible', // Visible Element-Plus popper containing the segment dropdown options
  BAGGAGE_DROPDOWN_ENABLED_OPTION: '.el-select-dropdown__item:not(.is-disabled)', // Enabled (selectable) option inside a baggage dropdown panel
  BAGGAGE_SEGMENT_CARRIER_NAME: '.flight-baggage .el-tab-pane:visible .form-date-section > :nth-child(1) .carrier-name', // Carrier name in the first baggage segment row (flight-baggage.vue)
  
  // Flight Seating (flight-seating.vue)
  SEATING_EDIT_BUTTON: ".flight-seating .extra__btns", // Edit/Add button in the seating extras row (scoped to flight-seating to avoid matching other extras buttons)
  SEATING_TRAVELER_ROW: '.flight-seating .pax-seat',
  // Mandatory seat error in seat map drawer (plane-deck/flight-deck.vue — shown when not all travelers have a seat)
  MANDATORY_SEAT_ERROR: '.error-text',
  // Per-traveler seat status text in the seating extras pane (e.g. "Pending confirmation")
  SEAT_STATUS_TEXT: ".pax-seat-container .seat-info-container span",

  // Flight Meals (flight-meals.vue)
  MEAL_EDIT_BUTTON: ".flight-meals .extra__btns", // Edit/Add button in the meal extras row (scoped to flight-meals to avoid matching other extras buttons)
  MEAL_DROPDOWN_CARET: ".flight-meals .el-select__caret",
  MEAL_DROPDOWN_OPTION_TEXT: '.el-select-dropdown__item span',
  MEAL_SAVE_BUTTON: ".flight-meals .no-border",
  MEAL_CANCEL_BUTTON: ".flight-meals .clear-btn",
  MEAL_SELECTED_TEXT: ".flight-meals .el-select__placeholder span",
  MEAL_STATUS_HELP_TEXT: ".flight-meals .help",
  MEAL_TRAVELER_TAB: ".flight-meals .flight-cart-tabs .el-tabs__item:visible",
  
  // Delivery Method (UK Rail) selectors
  DELIVERY_METHOD_SECTION: ".uk-rail-delivery-method",
  DELIVERY_METHOD_CLICKABLE: ".uk-rail-delivery-method .is-clickable",
  DELIVERY_METHOD_TITLE: ".uk-rail-delivery-method .card-title",
  DELIVERY_METHOD_FIRST_RADIO: ".uk-rail-delivery-method .el-radio-group > :nth-child(1) .el-radio__inner",
  GREEN_ICON_DELIVERY_METHOD: ".uk-rail-delivery-method .material-symbols-outlined",
  // The expanded panel loads its queues and TOD stations over the network
  // (ukRailStore/loadDeliveryMethods) and shows an el-skeleton meanwhile, so every read of an
  // option must wait for this to disappear first — otherwise the station select is not mounted yet.
  DELIVERY_METHOD_LOADING_SKELETON: ".uk-rail-delivery-method .el-skeleton",
  // One el-radio per delivery queue (uk-rail-delivery-method.vue's v-for over
  // deliveryMethodsToShow). Its label prints `deliveryMethod.queueName` — e.g.
  // "Atriis - Ticket on Departure (Collect at Station)" — plus " (Default)" on the default queue,
  // which is why callers match the row by substring and not by exact text.
  DELIVERY_METHOD_OPTION: ".uk-rail-delivery-method .el-radio-group .el-radio",
  // The station picker rendered inside a TOD queue's row only (v-if="deliveryMethod.isTOD"), an
  // app-select whose chosen option label Element Plus prints in `.el-select__placeholder` (same
  // shape as MEAL_SELECTED_TEXT / FQTV_SELECTED_TEXT). Relative to DELIVERY_METHOD_OPTION.
  // uk-rail-delivery-method.ts's initSelectedField() pre-selects the quote's origin station here
  // when the quote has no station saved yet, so this is where the departure city surfaces.
  DELIVERY_METHOD_OPTION_STATION_VALUE: ".delivery-option__station .el-select__placeholder",

  // UK Rail (Evolvi) cart "Extras" panel — ADO #81973. Confirmed live against the app (see
  // debug capture during Phase 3 implementation): the panel root is `.extras-container` (NOT
  // `.extras-collapse-container` — that generic selector above does not match this panel), each
  // field row is `.extras-layout` with a `.card-title`, and mandatory rows prefix their title with
  // `<span class="has-text-danger">*</span>`. IMPORTANT: that asterisk is a permanent "this field
  // is required" label — it does NOT disappear once the field is filled (confirmed live: a filled
  // "Delivery Method" row still shows "* Delivery Method" plus a green checkmark). The real
  // filled/unfilled signal is the row's trigger link text: "Add" (not yet filled) vs "Edit"
  // (already filled) — matches the recording too, which only ever clicks "Add" links
  // (records/81973_1.js). Known rows include `.uk-rail-delivery-method`, `.uk-rail-accounts`,
  // `.uk-rail-client-reference` — plus, only when a non-cheapest fare is selected, a "Reason for
  // Non Lowest Fare" row and a fare-flexibility dropdown row (recorded as an ARIA region literally
  // named "Extras" containing an icon — records/81973_1.js:36-40). Any mandatory-and-unfilled row
  // blocks "Proceed to Checkout", so the DSL fills whichever such rows are actually present rather
  // than hardcoding two specific ones.
  EVOLVI_EXTRAS_PANEL: '.extras-container',
  EVOLVI_EXTRAS_PANEL_VISIBLE: '.extras-container:visible',
  EVOLVI_MANDATORY_EXTRAS_ROW: '.extras-container .extras-layout:has(.card-title .has-text-danger):has(.is-clickable:text-is("Add"))',
  // An extras row's own heading, e.g. "* Delivery Method" / "* Seating" / "* Reason for Non Lowest".
  // Resolved RELATIVE to a row locator, and used to tell one outstanding mandatory row from the next
  // so a saved row is not filled twice — see _waitForEvolviExtrasRowToClear.
  EVOLVI_EXTRAS_ROW_TITLE: '.card-title',
  EVOLVI_EXTRAS_VISIBLE_RADIO_OPTION: '.el-radio-group .el-radio:visible',

  // ===== ONE NAMED UK RAIL (EVOLVI) EXTRAS ROW (test 62132) =====
  // The generic EVOLVI_MANDATORY_EXTRAS_ROW above finds "whichever mandatory row is outstanding".
  // 62132 instead names each row ("Delivery Method", "Seating", "Reason for Non Lowest") and
  // asserts/fills THAT one, so a row has to be addressable by its own heading.
  //
  // Every row below is anchored on its `.card-title` text rather than on position, and that anchor
  // survives expanding the row: extras-layout.vue swaps the collapsed `div.extra` (which owns the
  // `#extra-title` slot) for a `div.padding` holding `#extra-content`, and all four uk-rail extras
  // components repeat the same heading as a `.card-title` inside that content
  // (uk-rail-delivery-method / uk-rail-non-lowest-reason / uk-rail-client-reference reuse their
  // own i18n key, uk-rail-seats hardcodes "Seating"). Scoping to the row instead of to the whole
  // panel — as fillAllMandatoryEvolviExtras has to — is what makes "fill the row I was asked for"
  // provable rather than "fill whichever row happened to open".
  EVOLVI_EXTRAS_ROW: '.extras-container .extras-layout',
  // The collapsed summary line of a row. Carries `error-border` while the row is invalid AND a
  // checkout has been attempted (extras-layout.ts: isShowRedBorder = isShowInvalid &&
  // isCheckoutActivated), which is exactly the "highlighted" state 62132 asserts — so that
  // assertion only means anything AFTER a proceed-to-checkout click.
  EVOLVI_EXTRAS_ROW_SUMMARY: '.extra',
  EVOLVI_EXTRAS_ROW_SUMMARY_HIGHLIGHTED: '.extra.error-border',
  // The mandatory marker inside a row heading: `<span class="has-text-danger">*</span>`. Rendered
  // unconditionally by Delivery Method / Seating / Reason for Non Lowest, and only while invalid by
  // Client Reference (`v-if="!isValid"`), where it therefore doubles as the "still unfilled" signal.
  EVOLVI_EXTRAS_ROW_ASTERISK: '.extra .card-title .has-text-danger',
  // The filled/valid marker on a row: the `check_circle` icon extras-layout.vue renders under
  // `v-if="isValid && hasValue"`. `.green` is what separates it from the red `info` (isError) and the
  // yellow `schedule`/`info` (isWaitingApproval / isWarning) icons, which share `.success-icon`.
  EVOLVI_EXTRAS_ROW_GREEN_CHECK: '.extra .success-icon.green',
  // Add / Edit / View trigger on the collapsed row. Matched by class, never by label: the same
  // trigger reads "Add" before the row is filled and "Edit" afterwards.
  EVOLVI_EXTRAS_ROW_OPEN_BUTTON: '.extra .extra__btns .is-clickable',
  // Row-scoped variants of the two widgets fillAllMandatoryEvolviExtras has to search panel-wide.
  // `.padding` is the expanded-content wrapper, so neither can match the collapsed summary line.
  EVOLVI_EXTRAS_ROW_RADIO_OPTION: '.padding .el-radio-group .el-radio:visible',
  EVOLVI_EXTRAS_ROW_DROPDOWN: '.padding .el-select:visible',

  // "Provided by" label in cart hotel preview (hotel-provided-by.vue)
  PROVIDER_LABEL: 'section.hotel-preview .provider-label',
  HOTEL_PREVIEW_NAME: 'section.hotel-preview .quote-names-container h4',
  // Hotel quote price in cart (hotel-quote-card.vue → app-price → h4.amount)
  HOTEL_QUOTE_PRICE: '.quote-payment-card .price-wrapper .amount',
  FLIGHT_QUOTE_DISPLAY_PRICE: '.flight-quote-summary .quote-price',
  FLIGHT_QUOTE_ORIGINAL_PRICE: '.flight-quote-summary .original-price',
  // Hotel rooms badge in cart trip summary (.dates-and-rooms from hotel-quote-summary.vue)
  ROOMS_BADGE: '.dates-and-rooms, .dates span',

  // Product icons in the cart trip-summary sidebar (trip-summary.vue > ul.quote-summary-list).
  // app-product-icon.vue applies the product type as a class on .icon-img itself
  // ([product]: productTypeName binding), so each icon is identified by its product —
  // this pinpoints the flight quote's icon vs. the hotel quote's icon rather than by position.
  FLIGHT_QUOTE_SUMMARY_ICON: '.quote-summary-list .icon-img-wrapper .icon-img.flight',
  HOTEL_QUOTE_SUMMARY_ICON: '.quote-summary-list .icon-img-wrapper .icon-img.hotel',
  // The rail quote's own line in that same sidebar (eu-rail-quote-summary.vue, mounted by
  // general-quote-summary.vue for Products.Rail). Anchored on its product icon rather than a
  // position, so it still resolves in a cart holding other products.
  RAIL_QUOTE_SUMMARY_ITEM: '.quote-summary-list .quote-item:has(.icon-img.rail)',
  // The "Seating" row inside that rail line. eu-rail-quote-summary.vue renders it only when the
  // quote carries a seat price (`v-if="!!quote.pricings[0].displaySeatPrice"`), so its absence is
  // what proves no seat reservation cost has been folded into the quote price (test 51524).
  RAIL_QUOTE_SUMMARY_SEAT_PRICE: '.quote-summary-list .quote-item:has(.icon-img.rail) .seat-price',

  // ===== RAIL SEATING EXTRAS (eu-rail-seats.vue) =====
  // Rail seats are their OWN extras component, not the flight `.flight-seating` one — none of the
  // SEATING_* / seat-map selectors above apply here. Every selector below is rooted on the
  // component's own `<section class="seats">`, which is the only `class="seats"` in Atriis.OBT and
  // so identifies the section outright. :visible throughout — responsive layouts render hidden
  // duplicates of extras rows.
  // Add / Edit / View trigger on the collapsed row (extras-layout.vue renders exactly one of the
  // three depending on hasValue/isPending/isViewMode). Matched by class, never by label: the same
  // step opens the panel as "Add" before any seat is chosen and as "Edit" afterwards.
  RAIL_SEATING_EXTRAS_OPEN_BUTTON: '.seats:visible .extras-layout .extra .extra__btns .is-clickable',
  // The expanded panel (eu-rail-seats.vue el-card.extras-card)
  RAIL_SEATING_EXTRAS_CARD: '.seats:visible .extras-card',
  // Shown in place of the panel body while euRailService.getSeats is in flight (eu-rail-seats.vue
  // `v-else` branch) — must be gone before any seat row is read.
  RAIL_SEATING_LOADING_SKELETON: '.seats:visible .el-skeleton',
  // One <section> per journey leg (`v-for="(segment, segmentIdx) in seats"`). The API returns the
  // outbound leg at index 0 and the return leg at index 1, matching the journey stepper's order.
  RAIL_SEATING_SEGMENT: '.seats:visible .extras-card .control > section',
  // Leg heading inside a segment (segment.header) — relative to RAIL_SEATING_SEGMENT
  RAIL_SEATING_SEGMENT_CAPTION: '.seats-caption',
  // A selectable seat's checkbox inside a segment — relative to RAIL_SEATING_SEGMENT. The
  // `.seats-list` class is what separates these from the "Continue without reserving seats"
  // checkbox, which sits in the same card without it.
  RAIL_SEATING_SEAT_CHECKBOX: '.el-checkbox.seats-list',
  // A seat's price spans — relative to RAIL_SEATING_SEGMENT. eu-rail-seats.vue renders TWO: the
  // first is the display-currency amount (what the cart summary's seating row also shows), the
  // second is the original-currency "( ... ) - per Traveller" figure. Always take .first().
  RAIL_SEATING_SEAT_DISPLAY_PRICE: '.el-checkbox.seats-list .price',
  // "Continue without reserving seats" (euRail.continueWithoutSeats). Ticking it clears every
  // selected seat AND is the only thing that re-enables Save once nothing is selected
  // (canSaveMooveSeats in eu-rail-seats.ts). Identified as the card's non-seat checkbox.
  RAIL_SEATING_NO_SEATS_CHECKBOX: '.seats:visible .extras-card .el-checkbox:not(.seats-list)',
  // Save scoped to the rail seating panel (app-btn type="primary" class="no-border"). The feature
  // clicks Save through the shared cart step; this exists to report the button's enabled state,
  // which is the difference between "save did nothing" and "save failed".
  RAIL_SEATING_SAVE_BUTTON: '.seats:visible .extras-card .btns .no-border',

  // ===== UK RAIL (EVOLVI) SEAT RESERVATION EXTRAS (uk-rail-seats.vue) =====
  // Deliberately NOT the RAIL_SEATING_* selectors above: those are rooted on eu-rail-seats.vue's
  // `<section class="seats">` (Benerail). Evolvi renders its own `<section class="uk-rail-seats">`
  // with a completely different body — per-leg seat-TYPE radios instead of a seat checkbox list.
  // :visible throughout, because responsive layouts render hidden duplicates of extras rows.
  // Add / Edit / View trigger on the collapsed "Seating" row (extras-layout.vue renders exactly one
  // of the three). Matched by class, never by label, so the same method opens the row before and
  // after a seat has been reserved.
  UK_RAIL_SEATS_EXTRAS_OPEN_BUTTON: '.uk-rail-seats:visible .extras-layout .extra .extra__btns .is-clickable',
  // The expanded panel (uk-rail-seats.vue el-card.extras-card)
  UK_RAIL_SEATS_EXTRAS_CARD: '.uk-rail-seats:visible .extras-card',
  // Shown in place of the panel body while ukRailStore loads the seat map (the `v-if="isLoading"`
  // branch) — must be gone before any radio or dropdown is read.
  UK_RAIL_SEATS_LOADING_SKELETON: '.uk-rail-seats:visible .el-skeleton',
  // One radio per offered seat type: "Seat", "Specific Seat", "Berth", "No Seat". Which of them
  // render is conditional — "Specific Seat" needs !isBerthAvail && !isBerthMandatory AND a
  // single-passenger trip (uk-rail-seats.vue), so a missing option is a data condition, not a bug.
  UK_RAIL_SEATS_TYPE_RADIO: '.uk-rail-seats:visible .extras-card .el-radio-group .el-radio',
  // The Coach / Seat / Direction app-selects only exist while the Specific Seat radio is the
  // selected type. Scoped by their own label so the three are never confused with each other.
  UK_RAIL_SEATS_FIELD_SELECT: (label) =>
    `.uk-rail-seats:visible .extras-card .app-column:has(label.label:text-is("${label}")) .el-select`,
  // Leading Traveller telephone (`common.telephone`, el-input type="number"). It is the only
  // number input in the panel — every other field is an app-select or a plain text el-input.
  UK_RAIL_SEATS_TELEPHONE_INPUT: '.uk-rail-seats:visible .extras-card input[type="number"]',

  // Timed quote badge — appears on quotes with a limited time window
  // (flight-timed-quote.vue / app-timed-quote.vue both render `.timed-quote-badge`)
  TIMED_QUOTE_BADGE: '.timed-quote-badge',
  // The live countdown INSIDE the badge. app-timed-quote.vue (and the flights variant) render the
  // badge as an icon span carrying the "schedule" ligature plus a plain span holding the ticking
  // `M:SS` derived from the server's `quote.expires` — and when the quote runs out that same plain
  // span is replaced by "Expired". Excluding the icon span keeps the ligature text out of the read.
  // :visible skips the hidden responsive duplicates the cart renders.
  TIMED_QUOTE_BADGE_COUNTDOWN: '.timed-quote-badge:visible span:not(.material-symbols-outlined)',
  // Tooltip revealed by hovering the badge above. app-timed-quote.vue wraps the badge in an
  // el-tooltip whose content is teleported to a body-level popper, so it is not a descendant of
  // the quote card — hence the unscoped class. The message lives in the inner <p>; the sibling
  // `span.warning-icon` (ligature text "warning") is excluded so the read is the message only.
  // :visible skips poppers Element Plus keeps in the DOM after other tooltips close.
  TIMED_QUOTE_TOOLTIP_MESSAGE: '.timed-quote-tooltip-content:visible p',

  // Special request — two components share the same extras-layout markup but different roots:
  // hotels/rail use special-requests.vue (.quote-extras--special-requests, maxlength 75/120),
  // cars use car-special-request.vue (.car-special-request, maxlength 64). :visible skips the
  // hidden responsive duplicates the cart renders. Inner selectors are scoped to this container.
  SPECIAL_REQUEST_CONTAINER: '.quote-extras--special-requests:visible, .car-special-request:visible',
  // Add/View/Edit opener in extras-layout.vue `.extra__btns` — last, so an "Add traveller"
  // sibling span never wins.
  SPECIAL_REQUEST_CLICKABLE: '.extra__btns .is-clickable',
  SPECIAL_REQUEST_TEXTAREA: 'textarea',
  SPECIAL_REQUEST_SAVE_BTN: '.btn--primary',
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

  // Options (more_vert) dropdown — contains "View approvals", "Cancel trip", etc.
  OPTIONS_BUTTON: ".options-container .share-btn",

  // Approvals dialog (opened via options menu → "View approvals")
  APPROVALS_DIALOG: '.el-dialog.approvals-dialog',
  APPROVALS_DIALOG_APPROVER_NAME: '.approvals-dialog .approver-name',
  APPROVALS_DIALOG_CLOSE_BUTTON: '.approvals-dialog .el-dialog__headerbtn',

  // Manual approval controls inside the approvals dialog (trip-approval-steps.vue).
  // "Modify" toggles isModifyApprovalMode, which is what reveals "Skip all"; "Save"
  // (rendered as app-btn class="p-0 ml-4") commits via onUpdateStepApprovals.
  // Text-based because every one of these is an app-btn with no stable class of its own.
  APPROVALS_DIALOG_MODIFY_BUTTON: '.approvals-dialog .btns-wrapper button:has-text("Modify")',
  APPROVALS_DIALOG_SKIP_ALL_BUTTON: '.approvals-dialog .app-footer.btns-container button:has-text("Skip all")',
  APPROVALS_DIALOG_SAVE_BUTTON: '.approvals-dialog .btns-wrapper button:has-text("Save")',
  // Step status description. When every step is done the component swaps the timeline for a
  // single `div.status-desc` holding trip.approvals.noPendingItems.
  APPROVALS_DIALOG_STATUS_DESC: '.approvals-dialog .status-desc',

  // ===== Additional items section (trip-cart.vue) =====
  // The cart's "Additional items" section is where on-demand products (Stay Safe, the
  // Climate Contribution tile) are offered before they become real quotes. It is gated by
  // `v-show`, so it stays in the DOM and hides when there is nothing to offer — visibility,
  // not presence, is the meaningful assertion.
  // Anchored on the heading text ON PURPOSE: the Agent "Suggested items" section directly
  // below it reuses the same `.suggested-quotes-container` class, so a class-only selector
  // would match either one.
  ADDITIONAL_ITEMS_HEADING: '.suggested-quotes-container h2:text-is("Additional items")',

  // ===== Agent "Suggested items" section (trip-cart.vue, below Additional items) =====
  // Heading-anchored for the same reason as ADDITIONAL_ITEMS_HEADING above: both sections share
  // the `.suggested-quotes-container` class. Each agent suggestion renders as a `.suggested-quote`
  // wrapper (suggested-quote-card.vue); a not-yet-chosen car suggestion renders the car quote card
  // with an "Add to trip" button (car-quote-card.vue, `isAgentQuote` branch).
  SUGGESTED_ITEMS_HEADING: '.suggested-quotes-container h2:text-is("Suggested items")',
  SUGGESTED_QUOTE_ITEM: '.suggested-quote',
  SUGGESTED_CAR_ADD_BUTTON: '.suggested-quote .car-quote-card .add-to-trip-btn',

  // ===== Compensation / Climate Contribution (compensation-quote-card.vue) =====
  // The card root carries both `quote-payment-card` and `compensation-quote-card`.
  COMPENSATION_QUOTE_CARD: '.compensation-quote-card',
  // Title differs by state, so both are matched:
  //   * real quote (test 44362) -> base-quote-card > base-quote-header renders
  //     `h6.has-text-weight-semibold.quote-title` whose text comes from
  //     util.service.getProductTitle() -> compensation.climateContribution.
  //   * product tile (test 44424, !isRealQuote) -> a plain `h5` inside `.title`.
  // Matching only the h5 silently misses the real-quote case.
  COMPENSATION_QUOTE_TITLE: '.compensation-quote-card h6.quote-title, .compensation-quote-card .title h5',
  // The terms link is the <a> inside quote-terms-checkbox (base-quote-card slot), which
  // emits openTermsAndConditions. This is what Testim's bare `.compensation-quote-card a` hit.
  COMPENSATION_TERMS_LINK: '.compensation-quote-card .quote-terms-checkbox a',
  // Terms dialog is append-to-body, so it is NOT nested under the card in the DOM.
  COMPENSATION_TERMS_DIALOG: '.el-dialog.terms-dialog',
  COMPENSATION_TERMS_DIALOG_BODY: '.el-dialog.terms-dialog .el-dialog__body p',
  COMPENSATION_TERMS_DIALOG_CLOSE: '.el-dialog.terms-dialog .el-dialog__headerbtn',
  // "Add to trip" button on the compensation card. Gated by `v-if="!isRealQuote"`, so it renders
  // ONLY for the on-demand product tile (test 44424). Once the compensation exists as a real quote
  // (test 44362) the button must be absent — that absence is an assertion, not a wait target.
  COMPENSATION_ADD_TO_TRIP_BUTTON: '.compensation-quote-card .add-to-trip-btn',
  // "Related Items" app-btn in the ticket-related-quotes slot of the compensation card.
  COMPENSATION_RELATED_ITEMS_BUTTON: '.compensation-quote-card button:has-text("Related Items")',
  // Related-quotes dialog body (compensation-related-quotes.vue), also append-to-body.
  COMPENSATION_RELATED_QUOTES: '.compensation-related-quotes',
  COMPENSATION_RELATED_QUOTES_TITLE: '.compensation-related-quotes .quote-title',
  COMPENSATION_RELATED_QUOTES_DIALOG: '.el-dialog:has(.compensation-related-quotes)',
  COMPENSATION_RELATED_QUOTES_DIALOG_CLOSE: '.el-dialog:has(.compensation-related-quotes) .el-dialog__headerbtn',

  // Per-product status badges. base-quote-header.vue renders one
  // `p.app-label.app-label--quote` inside EACH quote card, so scoping by card root is what makes
  // "the flight is Confirmed AND the compensation is On hold" two distinct assertions instead of
  // two reads of whichever badge happens to come first in the DOM.
  // Safe from collisions: compensation-related-quotes.vue also renders app-label--quote per row,
  // but that lives in an append-to-body dialog, outside .compensation-quote-card.
  FLIGHT_QUOTE_STATUS_LABEL: '.flight-quote-card .app-label--quote',
  COMPENSATION_QUOTE_STATUS_LABEL: '.compensation-quote-card .app-label--quote',

  // Quote names listed in the trip-cancellation confirmation dialog (cancel-trip-modal.vue →
  // .quote-details-container → h2.bold-text = quoteName(quote)). Matched by text, never by
  // position: which row a product occupies depends on what else is in the trip.
  TRIP_CANCELLATION_QUOTE_NAME: '.cancel-trip-modal .quote-details-container .quote-details h2.bold-text',


  // Add product from cart product carousel
  ADD_HOTEL_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Hotel")',
  ADD_FLIGHT_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Flight")',
  ADD_PARKING_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Parking")',
  ADD_MANUAL_QUOTE_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Manual quote")',
  // Car tile in the same carousel. Like Hotel (and unlike Flight/Parking) it opens the edit-search
  // drawer: product-carousel.ts → productAction() emits `openDrawer` for every product except
  // 'manual-quote', and the cart renders that drawer in place instead of routing away.
  ADD_CAR_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Car")',
  // Rail tile. Unlike every other tile this one is an el-dropdown trigger, not a direct action:
  // product-carousel.vue wraps it in <el-dropdown trigger="hover"> whose menu lists one item per
  // rail supplier the user can access (railTypesOptions), and only picking an item emits openDrawer.
  // So the tile is HOVERED, then the supplier item is clicked.
  ADD_RAIL_CAROUSEL_BUTTON: '.product-carousel button.product-btn:has-text("Rail")',
  // Rail supplier items in that dropdown. Element Plus renders dropdown items as
  // `.el-dropdown-menu__item` (BEM double underscore) and appends the popper to body, so the menu is
  // NOT inside .product-carousel — scope by ':visible' instead, since other closed poppers linger in
  // the DOM. Matched by text (the item renders the raw `rail.value`, e.g. "EU Rails"), never by
  // index: which suppliers appear depends on the user's product access.
  RAIL_TYPE_DROPDOWN_ITEM: '.el-dropdown-menu__item:visible',
  ADD_HOTEL_SEARCH_DRAWER: '.app-drawer.atrs-edit-search-drawer',
  MANUAL_QUOTE_PAGE_CONTAINER: '.manual-quote-page',

  // Cross-sell suggestions on the trip overview (cross-sell-suggestions.vue). After a product is
  // added, the backend /suggestion endpoint returns complementary products; each renders as a
  // `.suggestion-container` inside `section.cross-sell-suggestions`. The car card is identified
  // language-independently by its product icon (app-product-icon -> `.material-symbols-outlined.car`).
  // Its title reads "Add car rental in <city>" and the desktop action opens the edit-search drawer
  // pre-filled with the flight's arrival city.
  CROSS_SELL_CAR_SUGGESTION: 'section.cross-sell-suggestions .suggestion-container:has(.material-symbols-outlined.car)',
  CROSS_SELL_SUGGESTION_TITLE: '.suggestion-title',
  // Older builds rendered the action as `.action span`; current builds use an app-btn `.search-btn`.
  // Match either so the click works against both the deployed staging and the latest source.
  CROSS_SELL_SUGGESTION_ACTION: '.search-btn, .action span',

  // Seat map segment tabs (flight-deck.vue el-tabs)
  SEAT_MAP_SEGMENT_TAB: '.flights-tabs .el-tabs__item', // Tab items for outbound/inbound segments
  SEAT_MAP_ACTIVE_SEGMENT_TAB: '.flights-tabs .el-tabs__item.is-active',
  // Next flight button in seat map drawer footer (flight-deck.vue app-btn class="cancel-btn" type="primary")
  NEXT_FLIGHT_BUTTON: 'button:has-text("Next flight")',
  // Seat tooltip red message (plane-seat.vue — .tooltip-item.red for unselectableMessage or cantBuyPaidSeats)
  // The tooltip is rendered by Element Plus as .el-popper.is-light (effect="light" in plane-seat.vue)
  SEAT_TOOLTIP_RED_MESSAGE: '.el-popper.is-light .tooltip-item.red',
  // Preferred + Extra Legroom seat (plane-seat.vue — both classes applied via seatImageClass computed)
  PREFERRED_EXTRA_LEGROOM_SEAT: '.deck-wrapper .plane-seat.preferred.extra-leg-room .seat',
  // Visible seat tooltip container (Element Plus el-popper with light effect, visible state)
  SEAT_TOOLTIP_VISIBLE: '.el-popper.is-light:not([aria-hidden="true"])',
  // First available seat in the deck (has a seat number visible)
  FIRST_AVAILABLE_SEAT: '.deck-wrapper .seat',

  // Seating icon in extras section (flight-seating.vue — .yellow class = PendingApproval/PendingPayment)
  SEAT_ICON_IN_EXTRAS: '.flight-seating .material-symbols-outlined.seats',
  // Collapsed summary row of the seating extras section (extras-layout.vue —
  // `<div class="extra" v-if="!isOpen">`). Only the collapsed row carries the Edit button,
  // so the panel must be collapsed before it can be re-opened.
  SEATING_EXTRAS_COLLAPSED_ROW: '.flight-seating .extra',
  // "Close" button inside the expanded seating panel (flight-seating.vue → el-card.extras-card .btns)
  SEATING_EXTRAS_CLOSE_BUTTON: '.flight-seating .extras-card .btns button:has-text("Close")',
  // Per-passenger seat rows inside the expanded seating panel (flight-seating.vue .pax-seat-container)
  SEATING_PAX_SEAT_ROW: '.flight-seating .pax-seat-container .pax-seat',
  // Per-passenger seat status icon in the expanded seating panel. flight-seating.vue's
  // seatIconByStatus maps SeatStatusType PendingApproval / PendingPayment to className
  // 'yellow' (a `schedule` icon) — this is the yellow indicator shown for saved-but-unpaid seats.
  SEATING_PAX_YELLOW_STATUS_ICON: '.flight-seating .pax-seat-container .seat-status-icon.yellow',
  // Any per-passenger status icon in the expanded panel — used for failure diagnostics
  SEATING_PAX_STATUS_ICON: '.flight-seating .pax-seat-container .seat-status-icon',
  // Section-level pending indicator on the COLLAPSED seating summary row. extras-layout.vue
  // renders `filled success-icon yellow` (a `schedule` icon) when isWaitingApproval is true,
  // which flight-seating.vue binds to hasPendingSeats (TripValidationStatusType.Pending).
  // Scoped to :visible — responsive layouts render hidden duplicates of the extras row.
  SEATING_EXTRAS_PENDING_STATUS_ICON:
    '.flight-seating .extra .material-symbols-outlined.filled.success-icon.yellow:visible',
  // Any section-level state icon on the collapsed seating row (green check / red info /
  // yellow schedule / yellow info) — used for failure diagnostics
  SEATING_EXTRAS_STATUS_ICON: '.flight-seating .extra .success-icon',

  // Traveler initials (trip-traveler-tag.vue)
  TRAVELER_INITIALS: '.avatar-initials',
  // Traveler full name (trip-traveler-tag.vue), rendered by trip-cart.vue's <trip-travelers-list>
  // under the "Travellers" section — same class pattern as SearchPage.SELECTED_TRAVELER_NAME.
  TRAVELER_NAME: '.trip-traveler-tag .traveler-name',
  // Traveler tag root (trip-traveler-tag.vue), used to scope the remove icon to one specific
  // traveler by name via .filter({ hasText }) — app-btn always renders 'btn btn--default
  // btn--size-default btn--round' plus its own class, so the remove icon (a nested
  // .material-symbols-outlined span) is reliably found by class alone within this scope.
  TRAVELER_TAG_ROOT: '.trip-traveler-tag',
  TRAVELER_REMOVE_ICON: '.material-symbols-outlined.remove-btn',

  // Hotel autocomplete destination value (hotel-autocomplete inside cart search drawer)
  HOTEL_SEARCH_DESTINATION_INPUT: ".hotel-autocomplete .el-input__inner",
  HOTEL_SEARCH_CHECK_IN_INPUT: "[placeholder='Check in']",
  HOTEL_SEARCH_CHECK_OUT_INPUT: "[placeholder='Check out']",

  // Rail (Benerail eu-rail) passenger info section (eu-rail-passenger-info.vue). Shares the
  // extras-layout.vue wrapper with .flight-passenger-info / .passenger-title, so the
  // click-to-edit / green success-icon / card-title status text follow the identical class
  // pattern used by those sections. One el-tabs tab per passenger, labeled "{firstName} {lastName}".
  RAIL_PASSENGER_INFO_SECTION: '.eu-rail-passenger-info',
  RAIL_PASSENGER_INFO_EXPAND_BUTTON: '.eu-rail-passenger-info .is-clickable',
  RAIL_PASSENGER_INFO_STATUS_TEXT: '.eu-rail-passenger-info .card-title',
  RAIL_PASSENGER_INFO_SUCCESS_ICON: '.eu-rail-passenger-info .success-icon.green',
  RAIL_PASSENGER_INFO_TAB: '.eu-rail-passenger-info .el-tabs__item',
  // Each field renders as a bare <p>{Label}</p> immediately followed by its input wrapper <div>
  // (no shared .field wrapper like flight-passenger-info's DOB field), so fields are targeted by
  // the adjacent-sibling combinator off the label paragraph, scoped :visible to the active tab
  // (inactive el-tab-pane content stays in the DOM, hidden via display:none).
  RAIL_PASSENGER_INFO_EMAIL_INPUT: '.eu-rail-passenger-info p:text-is("Email"):visible + div input',
  RAIL_PASSENGER_INFO_EMAIL_FIELD: '.eu-rail-passenger-info p:text-is("Email"):visible + div .el-input',

  // Rail (Benerail eu-rail) date-of-birth extras section (date-of-birth.vue → <section
  // class="eu-rail-date-of-birth">), rendered only when the quote's validations require a
  // passenger DOB. Shares the same extras-layout.vue wrapper as RAIL_PASSENGER_INFO_* above, so
  // it follows the identical is-clickable/card-title/success-icon.green/.no-border conventions
  // used across every other extras section in this file (test 33896).
  RAIL_DATE_OF_BIRTH_SECTION: '.eu-rail-date-of-birth',
  RAIL_DATE_OF_BIRTH_CARD_TITLE: '.eu-rail-date-of-birth .card-title',
  RAIL_DATE_OF_BIRTH_EXPAND_BUTTON: '.eu-rail-date-of-birth .is-clickable',
  RAIL_DATE_OF_BIRTH_INPUT: '.eu-rail-date-of-birth .eu-rail-date-picker input',
  RAIL_DATE_OF_BIRTH_SAVE_BUTTON: '.eu-rail-date-of-birth .btns .no-border',
  RAIL_DATE_OF_BIRTH_SUCCESS_ICON: '.eu-rail-date-of-birth .success-icon.green',

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
  // More Details drawer — hotel quote total price in footer (hotel-quote-more-details.vue → app-footer → app-price → h4.amount)
  MORE_DETAILS_TOTAL_PRICE: ".cart-more-details-drawer .app-footer .total-price .amount",
  MORE_DETAILS_DRAWER_CONTAINER: ".cart-more-details-drawer",
  // Skeleton placeholders rendered inside the More Details drawer while content loads.
  MORE_DETAILS_DRAWER_SKELETON: ".el-skeleton, .el-skeleton__item",
  // Share dialog close button. Scope to :visible — multiple el-dialogs can linger hidden in
  // the DOM, and an unscoped .first() would resolve to a stale hidden dialog's close button
  // instead of the currently open share dialog.
  SHARE_DIALOG_CLOSE: '.el-dialog__header [fill="currentColor"]:visible, .el-dialog__headerbtn:visible',
  // Share dialog language dropdown
  SHARE_LANGUAGE_DROPDOWN: '.app-share-quotes .app-select .el-select',
  SHARE_LANGUAGE_OPTION: (text) => `.app-select-popper .el-select-dropdown__item:has-text("${text}")`,
  SHARE_DETAILED_RADIO: '.app-share-quotes .radio-btns .el-radio',
  SHARE_EMAIL_CONTAINER: '.email-content-container',
  // Share email preview iframe
  SHARE_EMAIL_IFRAME: '.email-content-container iframe',
  // Share dialog "Send to" recipient picker (app-share-quotes.vue -> user-autocomplete ->
  // app-autocomplete -> el-autocomplete). The component is mounted with 'allow-external-email',
  // so an address matching no corporate user is offered back as a single synthetic suggestion
  // in its own popper, which has to be clicked before it becomes a recipient.
  SHARE_RECIPIENT_INPUT: '.app-share-quotes .user-autocomplete input',
  // Scoped to real option rows, not a bare `li`: el-autocomplete renders a handler-less
  // `<li v-if="suggestionLoading">` spinner inside the very same `<ul>`, and user-autocomplete
  // always hits the server (shouldUseServerSearch is true unless isForProfile), so that spinner
  // is guaranteed to appear. A bare `li` matches it first, the click silently does nothing, and
  // the popper is left open with no recipient added. Only real options carry the `-item-N` id —
  // the same idiom ChatPage/HotelSearchPage/SearchPage already use on this component.
  SHARE_RECIPIENT_SUGGESTION: ".user-autocomplete-popper .el-autocomplete-suggestion__list li[id*='item-']",
  // Recipient chips (trip-traveler-tag). app-share-quotes renders a mobile and a desktop
  // recipients-list, so callers filter this to the visible one.
  SHARE_RECIPIENT_CHIPS: '.app-share-quotes .recipients-list > *',
  // Hotel address in share email preview
  SHARE_EMAIL_HOTEL_ADDRESS: "[target='_blank']",

  // Share email preview — hotel name and image (inside iframe srcdoc)
  SHARE_EMAIL_HOTEL_IMAGE: 'img',
  // Share email preview — flight/price offer blue price box (inside iframe srcdoc).
  // The bgcolor anchor is the email template's price box, carried over from the
  // original Testim recording; the email HTML is backend-generated (not in OBT source).
  SHARE_EMAIL_PRICE_OFFER_BOX: "[bgcolor='#1C73FF']",
  // Share email preview — any "label + its value" pair (inside iframe srcdoc), e.g. "Vendor
  // Message" or a fare rule category like "Conditions of Cancellation and Exchange".
  // The email HTML is backend-generated and the two templates differ: the share quote email
  // renders the label and value as adjacent cells, the share itinerary email as a .glist
  // label/value sibling pair. So the label is located by its text and the value read from the
  // adjacent node rather than by a template-specific path.
  SHARE_EMAIL_VENDOR_MESSAGE_LABEL_TEXT: 'Vendor Message',
  SHARE_EMAIL_LABELED_CONTENT_CANDIDATES: 'td, th, div, span, p, b, strong, li',
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
  LOYALTY_CLICKABLE: '.quote-extras--loyalty-number .is-clickable, .car-driver-loyalty .card-title, .quote-extras--container .is-clickable:has-text("Loyalty ID")',
  LOYALTY_ADD_BUTTON: '.car-driver-loyalty .is-clickable, .quote-extras--loyalty-number .add-text, .quote-extras--loyalty-number .add-btn, .quote-extras--container .add-text:has-text("Add")',
  LOYALTY_EXISTING_RADIO: '.quote-extras--loyalty-number .el-radio-group .el-radio:nth-child(1)',
  LOYALTY_EXISTING_DROPDOWN: '.quote-extras--loyalty-number .extras-card .el-select',
  LOYALTY_NEW_RADIO: '.quote-extras--loyalty-number .el-radio-group .el-radio:nth-child(2)',
  LOYALTY_CHAIN_SELECT: '.quote-extras--loyalty-number .select-container .select-element:first-child .el-select',
  LOYALTY_NUMBER_INPUT: '.quote-extras--loyalty-number .select-container .select-element:last-child input, .quote-extras--loyalty-number .el-input__inner, .car-driver-loyalty input[type="text"], .car-driver-loyalty .el-input__inner',
  LOYALTY_SAVE_BUTTON: '.quote-extras--loyalty-number .btns .no-border',
  LOYALTY_SUCCESS_ICON: '.quote-extras--loyalty-number .success-icon.green',
  LOYALTY_CARD: '.quote-extras--loyalty-number .extras-card, .car-driver-loyalty, .quote-extras--container .extras-card:has-text("Loyalty ID")',
  LOYALTY_CHAIN_SELECTED_TEXT: '.quote-extras--loyalty-number .select-container .select-element:first-child .el-select .el-select__placeholder',
  // Expander for the HOTEL loyalty extras specifically. The generic EDIT_EXTRAS_BUTTON is resolved by
  // page-wide nth(index), so in a trip holding flight + hotel + car quote cards nth(0) opens the
  // flight card's extras. This selector self-scopes to the hotel loyalty section.
  HOTEL_LOYALTY_EXPAND: '.quote-extras--loyalty-number .is-clickable',

  // Car driver loyalty extras (car-driver-loyalty.vue → <section class="car-driver-loyalty">).
  // Deliberately NOT folded into the LOYALTY_* selectors above: those are either hotel-only
  // (LOYALTY_SAVE_BUTTON, LOYALTY_SUCCESS_ICON) or `.first()`-resolved unions that would pick the
  // hotel card when a trip holds both a hotel and a car.
  CAR_DRIVER_LOYALTY_SECTION: '.car-driver-loyalty',
  CAR_DRIVER_LOYALTY_EXPAND: '.car-driver-loyalty .is-clickable',
  CAR_DRIVER_LOYALTY_INPUT: '.car-driver-loyalty .extras-card .inputs input.el-input__inner',
  // Driver `app-select` (non-filterable el-select of trip passengers) — only rendered when the
  // quote's validation requires a driver, so it's scoped to `.field .app-select` to avoid matching
  // anything else inside `.inputs`.
  CAR_DRIVER_LOYALTY_DRIVER_SELECT: '.car-driver-loyalty .extras-card .inputs .field .app-select .el-select',
  // "Use Existing" el-switch — only rendered when the quote already carries a membershipId
  // (car-driver-loyalty.vue: `v-if="quote.membershipId"`). It starts ON, which disables the
  // Loyalty ID input, so editing to a new number requires toggling it off first.
  CAR_DRIVER_LOYALTY_USE_EXISTING_TOGGLE: '.car-driver-loyalty .toggle-container .el-switch',
  // Primary "Save" app-btn inside the panel's `.btns` row (carries the `no-border` class).
  CAR_DRIVER_LOYALTY_SAVE_BUTTON: '.car-driver-loyalty .btns .no-border',
  CAR_DRIVER_LOYALTY_SUCCESS_ICON: '.car-driver-loyalty .success-icon',

  // Car billback extras (car-billback.vue → <section class="car-billback">). Rendered in the car
  // quote card's `#extras-content` slot next to car-driver-loyalty, so it opens the same way: one
  // click on the extras-layout Add/View/Edit `.is-clickable` span.
  CAR_BILLBACK_EXPAND: '.car-billback .extra__btns .is-clickable',
  // Every selector below is scoped through `.extras-card`, which exists only while the panel is
  // expanded — the collapsed summary row reuses `.card-title` and would otherwise match too.
  // "Apply to this quote" el-checkbox (`car.applyToThisQuote`). Element-Plus puts `is-checked` on the
  // `.el-checkbox` root, so that is the state anchor; `.el-checkbox__inner` is the click target.
  // `.billback-checkbox` is on both the el-checkbox and its inner label span, hence the `.el-checkbox`
  // qualifier.
  CAR_BILLBACK_APPLY_CHECKBOX: '.car-billback .extras-card .el-checkbox.billback-checkbox',
  CAR_BILLBACK_APPLY_CHECKBOX_INNER: '.car-billback .extras-card .el-checkbox.billback-checkbox .el-checkbox__inner',
  // Label text of that checkbox. Element-Plus wraps the slot in `.el-checkbox__label`, so this also
  // picks up the trailing tooltip icon's "info" glyph text — match with contains, not equality.
  CAR_BILLBACK_APPLY_CHECKBOX_LABEL: '.car-billback .extras-card .el-checkbox.billback-checkbox .el-checkbox__label',
  // "Corporate billing number" input — the FIRST `.field` of the `.columns` row. The second field
  // holds the "Amount to be covered" radios with their own amount input, so an unscoped input
  // selector inside the card would read the custom amount instead of the billing number.
  CAR_BILLBACK_BILLING_NUMBER_INPUT: '.car-billback .extras-card .columns .field:first-child input.el-input__inner',

  // "Payment method is optional you can proceed without it." alert on the car quote card
  // (car-quote-card.vue → `<div class="optional-fop-message">`, gated by the showOptionalFopMessage
  // computed: pending quote + optional FOP + not pre-paid). The same markup is emitted three times —
  // the desktop extra-info column, the mobile extra-info column, and inside form-of-payment.vue — so
  // `:visible` keeps the read on whichever one the current viewport actually renders. Scoped to
  // `.car-quote-card` because form-of-payment.vue renders the same alert for flight and hotel quotes,
  // which would otherwise be matched in a multi-product trip.
  CAR_OPTIONAL_FOP_MESSAGE: '.car-quote-card .optional-fop-message:visible',
  // Payment-method column of the same car quote card (car-quote-card.vue → `<div class="payment-method">`
  // holding `<p v-if="isPrePaidDisplay">Pre paid</p>` / `<p v-else>Pay On Departure</p>`). Unlike the
  // alert above it renders UNCONDITIONALLY inside the card's extra-info slot, which makes it the
  // positive render anchor for the NEGATIVE assertion: once this is visible the payment column has
  // rendered, so an absent optional-payment alert is a real absence and not an un-loaded card.
  // `.payment-method` is reused by the hotel, ground and car-preview cards, so the `.car-quote-card`
  // scope plus `:visible` (desktop vs mobile duplicates) plus `.first()` are all required.
  CAR_QUOTE_CARD_PAYMENT_METHOD: '.car-quote-card .payment-method:visible',

  // SunnyCars "Add location" extras (car-sunnycars-add-location.vue → <section class="car-sunnycars-add-location">).
  // Same extras-layout wrapper as billback, so it opens with one click on the Add/View/Edit
  // `.is-clickable` span.
  CAR_ADD_LOCATION_EXPAND: '.car-sunnycars-add-location .extra__btns .is-clickable',
  // The panel fetches its locations on open (carService.getLocation) behind an el-skeleton, so
  // `.extras-card .inputs` is the marker that the pick-up/drop-off selects actually rendered —
  // `.extras-card` alone is present while the skeleton is still showing.
  CAR_ADD_LOCATION_INPUTS: '.car-sunnycars-add-location .extras-card .inputs',
  // The two app-selects sit in one `.columns` row: first column = "Pickup location",
  // second = "Dropoff location". Positional scoping is the only anchor — both render the same
  // markup with no data-testid or distinguishing class.
  CAR_ADD_LOCATION_PICKUP_SELECT: '.car-sunnycars-add-location .extras-card .columns .column:nth-child(1) .app-select .el-select',
  CAR_ADD_LOCATION_DROPOFF_SELECT: '.car-sunnycars-add-location .extras-card .columns .column:nth-child(2) .app-select .el-select',
  // The drop-off select carries `:disabled="!pickUpLoc.id"`, and Element-Plus puts `is-disabled` on
  // the inner `.el-select__wrapper` (see app-select.vue's `.el-select__wrapper.is-disabled` rule).
  // Waiting for the wrapper WITHOUT that class is what proves a pick-up location has been committed
  // and the server returned the matching drop-off list — clicking the select earlier is a no-op.
  CAR_ADD_LOCATION_DROPOFF_SELECT_ENABLED:
    '.car-sunnycars-add-location .extras-card .columns .column:nth-child(2) .app-select .el-select .el-select__wrapper:not(.is-disabled)',
  // Selected-value text of each select. app-select.vue is a single (non-multiple) el-select, so
  // Element-Plus renders the chosen option's label inside `.el-select__placeholder`.
  CAR_ADD_LOCATION_PICKUP_SELECTED_TEXT:
    '.car-sunnycars-add-location .extras-card .columns .column:nth-child(1) .el-select__placeholder',
  CAR_ADD_LOCATION_DROPOFF_SELECTED_TEXT:
    '.car-sunnycars-add-location .extras-card .columns .column:nth-child(2) .el-select__placeholder',
  // Options render in a body-level popper (app-select.vue sets popper-class "app-select-popper").
  // Both selects keep their own popper mounted after first use and both carry that same class, so
  // a document-wide match is ambiguous: while the pick-up dropdown is open, `.first()` resolves to
  // the PICK-UP option even when the caller asked for a drop-off — that is what made "select the
  // first drop-off location" re-pick the pick-up value. Always scope the item selector to one
  // popper resolved from the owning select (see `_getCarAddLocationPopperSelector`).
  CAR_ADD_LOCATION_DROPDOWN_ITEM: '.el-select-dropdown__item:visible',
  // Element-Plus points each select's wrapper at its own popper through `aria-describedby`. It is
  // the only per-field link between a select and its options in this DOM — nothing on the popper
  // itself identifies which field it belongs to.
  CAR_ADD_LOCATION_SELECT_WRAPPER_SUFFIX: ' .el-select__wrapper',
  // Green "check_circle" that extras-layout.vue renders on the COLLAPSED row (`v-if="!isOpen"`)
  // once the section is valid and has a value. Saving calls the panel's own close(), so the row —
  // and this icon — only exist after a successful save. `:visible` guards against hidden
  // responsive duplicates of the quote card, same as the flight optional-services icon.
  CAR_ADD_LOCATION_SUCCESS_ICON:
    '.car-sunnycars-add-location .material-symbols-outlined.filled.success-icon.green:visible',

  // Car type on the cart's car quote card (car-quote-card.vue → .car-title-block > h4.center-title).
  // `.center-title` alone is unusable here — per-diem, parking, ground-transport and
  // general-product quote cards all reuse that class.
  CAR_QUOTE_CARD_TYPE_TITLE: '.car-quote-card .car-title-block h4.center-title',

  // Links row at the bottom of the car quote card (car-quote-card.vue:199 →
  // `<div class="more-details is-flex">`). It holds two anchors: an OPTIONAL "All-inclusive rate"
  // link (`v-if="isAllInclusive"`) and an UNCONDITIONAL "More details" link. Because the second
  // anchor always renders, this row is the positive render anchor for the negative all-inclusive
  // assertion — once it is visible the card's links have painted, so a missing all-inclusive link
  // is a real absence rather than an un-rendered card. Scoped to `.car-quote-card` (hotel cards
  // reuse the bare `.more-details` class) and `:visible` (desktop/mobile duplicates).
  CAR_QUOTE_MORE_DETAILS_ROW: '.car-quote-card .more-details:visible',
  // The "All-inclusive rate" link itself, matched PAGE-WIDE by its exact text rather than by
  // container: the check must prove the link is absent from the whole cart, not just from the first
  // car card, so a trip with several car quotes cannot hide a stray link behind a scoped selector.
  // `text-is` (exact) not `has-text` (substring) — the coverage dialog opened by the link carries
  // the same wording as its title (car.allInclusiveRate, en.json:250), and a substring match on an
  // ancestor would report the whole card as a hit. `a` narrows to the link, excluding that dialog
  // title. Wording comes from car.allInclusiveRate, so this is en-locale only.
  ALL_INCLUSIVE_RATE_LINK: 'a:text-is("All-inclusive rate"):visible',

  // EU Rail loyalty program extras (loyalty-program.vue) — <section class="loyalty-program">, no data-testid.
  // Tabs are <el-tabs>/<el-tab-pane> with values from LoyaltyTabs enum ('0' = New, '1' = Existing);
  // labels are "Use Existing" / "Enter New" (en.json euRail.loyaltyNumber.useExisting/enterNew).
  EURAIL_LOYALTY_SECTION: '.loyalty-program',
  // The section's own extra-layout expander. Scoped to `.loyalty-program` so it opens the rail
  // loyalty extras specifically, unlike the page-wide, index-based clickEditExtrasButton() which
  // resolves to whichever extras section happens to come first in the cart.
  EURAIL_LOYALTY_EXPAND: '.loyalty-program .is-clickable',
  EURAIL_LOYALTY_TAB: '.loyalty-program .tabs-container .el-tabs__item:visible',
  EURAIL_LOYALTY_EXISTING_SELECT: '.loyalty-program .loyalty-existing .app-select .el-select',
  EURAIL_LOYALTY_EXISTING_SELECT_TEXT: '.loyalty-program .loyalty-existing .app-select .el-select__placeholder',
  EURAIL_LOYALTY_VENDOR_SELECT: '.loyalty-program .loyalty-new .field:first-child .app-select .el-select',
  // Not scoped to .loyalty-new: on the deployed app the card-number input renders inline
  // under whichever tab ("Use Existing" or "Enter New") is currently active, not only under
  // a .loyalty-new pane. ':visible' selects the one actually rendered for the active tab.
  EURAIL_LOYALTY_NUMBER_INPUT: '.loyalty-program .loyalty-number-input .el-input__inner:visible',
  EURAIL_LOYALTY_VALIDATION_MSG: '.loyalty-program .validation-msg:visible',
  // The vendor/existing-program popper (Element Plus renders it at body level, not scoped under
  // .loyalty-program). Scoping option lookups to THIS single, most-recently-opened panel (via
  // .last()) avoids mixing in options from a prior select's popper that can still match
  // ":visible" for a moment while it fades out.
  EURAIL_LOYALTY_DROPDOWN_PANEL: '.el-select-dropdown:visible',

  // Premier Inn extras - breakfast visibility (premier-inn.vue)
  PREMIER_INN_PAYMENT_LABEL: '.quote-extras--premier-inn .extras-card label.label',
  PREMIER_INN_BREAKFAST_LABEL: '.quote-extras--premier-inn .extras-card label.label:has-text("Breakfast")',

  // Existing loyalty dropdown (selected value text after saving a loyalty number)
  LOYALTY_EXISTING_DROPDOWN_TEXT: '.quote-extras--loyalty-number .extras-card .el-select .el-select__placeholder, .car-driver-loyalty .el-select .el-select__placeholder',

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
  FQTV_SAVE_BUTTON: '.flight-frequent-flyer .btns .no-border',
  FQTV_HELP_TEXT: '.flight-frequent-flyer .help',

  // Flight Hand Luggage extras (flight-hand-luggage.vue)
  HAND_LUGGAGE_CLICKABLE: '.flight-hand-luggage .is-clickable',
  HAND_LUGGAGE_CARD_TITLE: '.flight-hand-luggage .card-title',
  HAND_LUGGAGE_SUCCESS_ICON: '.flight-hand-luggage .success-icon.green',
  HAND_LUGGAGE_SELECT_WRAPPER: '.flight-hand-luggage .el-select__wrapper',
  EL_SELECT_VISIBLE_DROPDOWN_ITEM: '.el-select-dropdown:visible .el-select-dropdown__item',

  // eHotel supplier details in cart (hotel-quote-card.vue → booking-confirm section)
  EHOTEL_PIN_CODE: '.booking-confirm p:has-text("Pincode:")',
  EHOTEL_CONFIRMATION_NUMBER: '.booking-confirm p:has-text("Confirmation Number:")',
  // Bare confirmation-number value span, scoped within EHOTEL_CONFIRMATION_NUMBER (avoids the
  // label text and the separate Pincode <p> whose span reuses this same class).
  EHOTEL_CONFIRMATION_NUMBER_VALUE: 'span.confirmation-number',
  EHOTEL_CONTACT_PHONE: '.booking-confirm p:has-text("Contact phone")',

  // Flight passenger info section (flight-passenger-info.vue)
  PASSENGER_INFO_SECTION: '.flight-passenger-info',
  PASSENGER_INFO_EXPAND_BUTTON: '.flight-passenger-info .is-clickable',
  PASSENGER_INFO_REQUIRED_ASTERISK: '.flight-passenger-info .card-title .has-text-danger',
  // Red error border the cart paints on the Passenger Info extras row once a checkout attempt was
  // blocked. extras-layout.vue adds 'error-border' only when isShowRedBorder = !isValid &&
  // isCheckoutActivated, and isCheckoutActivated is set solely by the 'checkoutActivated' event that
  // trip-cart.ts emits from beforeProceedToPayment() — so this is absent until Proceed to Checkout
  // is actually clicked. The class sits on the collapsed `.extra` row or the expanded `.padding`
  // wrapper, both inside `.flight-passenger-info`, so match on the class alone.
  PASSENGER_INFO_ERROR_BORDER: '.flight-passenger-info .error-border',
  PASSENGER_INFO_DOB_FIELD: '.flight-passenger-info .field:has(label:text-is("Date of birth"))',
  PASSENGER_INFO_DOB_DATEPICKER: '.flight-passenger-info .field:has(label:text-is("Date of birth")) .app-datepicker',
  PASSENGER_INFO_DOB_INPUT: '.flight-passenger-info .field:has(label:text-is("Date of birth")) input',
  EXTRAS_COLLAPSE_HEADER: '.extras-collapse-container .el-collapse-item__header',
  EXTRAS_COLLAPSE_ACTIVE: '.extras-collapse-container .el-collapse-item__header.is-active',
  PASSENGER_INFO_EDIT_NOT_ALLOWED_MSG: '.flight-passenger-info .app-msg-text',
  PASSENGER_INFO_PASSPORT_LABEL_TEXT: 'Passport number',
  PASSENGER_INFO_SAVE_BUTTON_NAME: 'Save',
  PASSENGER_INFO_SAVE_SUCCESS_ICON: '.flight-passenger-info .success-icon',
  PASSPORT_NUMBER_INPUT: '.flight-passenger-info .field:has(label:text-is("Passport number")) input',
  PASSENGER_INFO_EXPIRY_DATE_INPUT: '.flight-passenger-info .field:has(label:text-is("Expiry date")) input',
  PASSENGER_INFO_APPLICABLE_COUNTRY_SELECT: '.flight-passenger-info .field:has(label:text-is("Applicable country")) .el-select',
  PASSENGER_INFO_APPLICABLE_COUNTRY_INPUT: '.flight-passenger-info .field:has(label:text-is("Applicable country")) input.el-select__input',
  PASSENGER_INFO_NATIONALITY_SELECT: '.flight-passenger-info .field:has(label:text-is("Nationality")) .el-select',
  PASSENGER_INFO_NATIONALITY_INPUT: '.flight-passenger-info .field:has(label:text-is("Nationality")) input.el-select__input',
  PASSENGER_INFO_EDITABLE_FIELD: '.flight-passenger-info .extras-card .field', // Each form field wrapper in the passenger info panel (flight-passenger-info.vue)

  // Extras sections visibility (generic — used to verify which sections are rendered)
  EXTRAS_SECTION_CARD_TITLE: '.extras-collapse-container .card-title',
  EXTRAS_SECTION_ITEM: '.extras-collapse-container .extras-layout',

  // Payment terms selectors (for car rentals, hotels, etc)
  PAYMENT_TERMS_LINK: 'a:has-text("terms"), button:has-text("terms"), .more-details-btn:has-text("terms"), [role="button"]:has-text("terms")',
  RENTAL_PERIOD_TERMS_MODAL: ':has(> :text("Terms & Conditions")), .app-dialog, .el-dialog, .terms-modal, [role="dialog"]',
  TERMS_MODAL_CLOSE_BUTTON: '[aria-label="Close this dialog"], .el-dialog__close, .close-btn, button:has-text("Close")',
  // Car Terms & Conditions dialog content root (car-terms-conditions.vue). The same component is
  // rendered by car-results.vue (results) and car-quote-card.vue (cart / after booking), so this one
  // selector covers all three contexts. :visible skips the responsive/closed duplicates that
  // el-dialog leaves attached to the body.
  CAR_TERMS_DIALOG_CONTENT: '.car-terms-conditions:visible',
  // el-tabs nav item for the "Vendor and location details" tab in car-terms-conditions.vue —
  // Element Plus renders the nav button id as `tab-{paneName}` from the el-tab-pane's `name`.
  CAR_TERMS_LOCATION_DETAILS_TAB: '#tab-locationDetails:visible',
  // el-tab-pane content roots (Element Plus renders each pane's id as `pane-{paneName}`), used to
  // read the FULL tab content (all rule lines) for cross-context (results/cart/booked) comparison —
  // distinct from CAR_TERMS_DIALOG_CONTENT's h5-heading-scoped extraction above.
  CAR_TERMS_FARE_RULES_PANE: '#pane-fareRules:visible',
  CAR_TERMS_LOCATION_DETAILS_PANE: '#pane-locationDetails:visible',
  // Hotel Terms & Conditions dialog content root (app-terms-conditions.vue). Rendered inside the
  // hotel-quote-card el-dialog in the cart; holds the rule lines (cancellation policy, room notices
  // such as the shared-bathroom note). :visible skips the closed duplicate el-dialog leaves attached.
  HOTEL_TERMS_DIALOG_CONTENT: '.app-terms-conditions:visible',
  // Whichever cart T&C dialog is open, regardless of product: the hotel card's
  // app-terms-conditions.vue, or uk-rail-quote-card.vue's own .terms-dialog el-dialog, which hosts
  // uk-rail-result-fare-rules.vue instead (so .app-terms-conditions never appears for an Evolvi
  // quote). Both halves carry :visible because el-dialog leaves closed instances attached.
  CART_TERMS_DIALOG_CONTENT:
    '.app-terms-conditions:visible, .app-dialog.terms-dialog:visible .uk-rail-result-fare-rules',

  // Rail (EU Rail / Benerail) quote-card Fare Rules dialog — same `.app-dialog` el-dialog used for
  // Terms & Conditions/Journey Details on the quote card, scoped to the body for content text.
  RAIL_FARE_RULES_DIALOG_BODY: '.el-dialog.app-dialog .el-dialog__body',
  // Close button scoped to the same `.el-dialog.app-dialog` — the generic TERMS_MODAL_CLOSE_BUTTON
  // is unscoped and can resolve to an unrelated dialog's close button elsewhere in the DOM, leaving
  // this dialog open.
  RAIL_FARE_RULES_DIALOG_CLOSE_BUTTON: '.el-dialog.app-dialog [aria-label="Close this dialog"], .el-dialog.app-dialog .el-dialog__close, .el-dialog.app-dialog .el-dialog__headerbtn',

  // UK rail (Evolvi) quote-card fare rules. Unlike the Benerail card above, uk-rail-quote-card.vue
  // opens them in an el-drawer.app-drawer titled "Full information" (hosting
  // uk-rail-result-fare-rules.vue), so the RAIL_FARE_RULES_DIALOG_* selectors do not match here —
  // and the drawer itself needs no locator of its own: ANY_VISIBLE_DRAWER already covers reading
  // and closing whichever drawer is open (see Cart.verifyOpenDrawerContainsText / closeOpenDrawer).
  //
  // The link is uk-rail-segment-info.vue's "Fare rules" app-btn, one per journey segment in segment
  // order. Scoped to .uk-rail-quote-card because the More Details drawer renders the same
  // segment-info component (there with withoutRules, so no button), and :visible skips the hidden
  // responsive duplicates the cart keeps mounted.
  UK_RAIL_QUOTE_FARE_RULES_BUTTON: '.uk-rail-quote-card .fare-rules-btn:visible',

  // Quote Extras - Attach Files (per-diem-quote-card → extras-collapse → attach-files-extra)
  ATTACH_FILES_VIEW_BTN: '.attach-file-extra .extra__btns .is-clickable',
  // Scoped to the attach-files extra to avoid ambiguity with the trip Related Files pane (#fileUploader appears in multiple upload-file.vue instances)
  ATTACH_FILES_UPLOAD_INPUT: '.attach-file-extra #fileUploader',
  ATTACH_FILES_SAVE_BTN: '.attach-file-extra button:has-text("Save")',
  ATTACH_FILES_FILE_ITEM: '.attach-file-extra .file-item',
  ATTACH_FILES_FILE_NAME: '.attach-file-extra .file-item p',

  // Trip-level Related Files tab (trip-cart tabs → upload-file component)
  RELATED_FILES_TAB: '#tab-relatedFiles',
  RELATED_FILES_BROWSE_BTN: '#pane-relatedFiles label.color-primary',
  RELATED_FILES_FILE_ITEM: '#pane-relatedFiles .file-item',
  RELATED_FILES_FILE_NAME: '#pane-relatedFiles .file-item p',
  // Scoped to the Related Files pane to avoid ambiguity with ATTACH_FILES_UPLOAD_INPUT (#fileUploader appears in multiple upload-file.vue instances)
  RELATED_FILES_UPLOAD_INPUT: '#pane-relatedFiles #fileUploader',
  // "Include in itinerary email" checkbox label — renders per uploaded file inside the Related Files pane
  RELATED_FILES_ITINERARY_EMAIL_LABEL: "#pane-relatedFiles .el-checkbox__label",
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
   * Opens the Terms & Conditions dialog from a cart quote card and returns its full text, then
   * closes it so the overlay does not block the next step.
   *
   * Product-agnostic on purpose — the step it serves ("the cart terms and conditions should
   * include …") is used by hotel and rail quotes alike, and the two render different dialogs:
   * a hotel card mounts app-terms-conditions.vue, while uk-rail-quote-card.vue mounts
   * uk-rail-result-fare-rules.vue inside its own .terms-dialog. CART_TERMS_DIALOG_CONTENT covers
   * both, so whichever card the cart holds is the one read.
   *
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<string>} Full text content of the T&C dialog
   */
  async getCartTermsAndConditionsText({ timeout = 20000 } = {}) {
    await this.clickPaymentTermsLink();
    const dialog = this.page.locator(SELECTORS.CART_TERMS_DIALOG_CONTENT).first();
    try {
      await dialog.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getCartTermsAndConditionsText] No Terms & Conditions dialog became visible within ` +
        `${timeout}ms after clicking the T&C link (selector: ${SELECTORS.CART_TERMS_DIALOG_CONTENT}). ` +
        `The link may have opened a different dialog, or this quote type renders its terms in a ` +
        `container neither branch of the selector covers. Original: ${err.message}`,
      );
    }
    // Hotel terms only: wait for the async-loaded rule lines to render past the loading skeleton.
    // The rail dialog has no such stage — its rules are already fetched when the dialog mounts —
    // so this is best-effort and never gates the read.
    await this.page
      .locator(`${SELECTORS.HOTEL_TERMS_DIALOG_CONTENT} .terms-container`)
      .first()
      .waitFor({ state: 'visible', timeout })
      .catch(() => {});
    const text = (await dialog.textContent()) ?? '';
    await this.page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    return text.trim();
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
   * Opens the Financial Reference details from the trip actions menu in the Trip
   * overview and clicks the "Trip reference form" option, then waits for the
   * reference-fields dialog. Reuses the retry-hardened trip actions menu helpers
   * (hoverTripActionsDropdownIconWithRetry / waitForTripActionMenuOptionText); the
   * "Trip reference form" item lives in the same .share-popper menu as "Cancel trip".
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<void>}
   */
  async openFinancialReferenceDetailsFromTripOverview({ timeout = 15000 } = {}) {
    try {
      // The el-dropdown is briefly disabled during backend polling, so a single hover can silently
      // fail — reuse the retry helper that opens the menu and confirms it rendered.
      await this.hoverTripActionsDropdownIconWithRetry();
      await this.waitForTripActionMenuOptionText(SELECTORS.TRIP_REFERENCE_FORM_MENU_TEXT);
      await this.page
        .locator(SELECTORS.TRIP_ACTION_MENU_OPTION, { hasText: SELECTORS.TRIP_REFERENCE_FORM_MENU_TEXT })
        .first()
        .click();

      await this.page.locator(SELECTORS.REFERENCE_FORM_DIALOG).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.openFinancialReferenceDetailsFromTripOverview] Could not open the Financial Reference details ` +
        `from the trip actions menu in the trip overview (open menu, click the ` +
        `"${SELECTORS.TRIP_REFERENCE_FORM_MENU_TEXT}" item). The menu or reference-fields dialog did not appear ` +
        `within ${timeout}ms — the trip may have no financial reference configured. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the selected Financial Reference description text shown in the
   * financial-section el-select inside the reference-fields dialog.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The trimmed field description text
   */
  async getFinancialReferenceFieldDescription({ timeout = 15000 } = {}) {
    const valueSpan = this.page.locator(SELECTORS.FINANCIAL_REFERENCE_FIELD_VALUE).first();
    try {
      await valueSpan.waitFor({ state: 'visible', timeout });
      return (await valueSpan.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getFinancialReferenceFieldDescription] The Financial Reference field value ` +
        `(selector: ${SELECTORS.FINANCIAL_REFERENCE_FIELD_VALUE}) was not visible within ${timeout}ms. ` +
        `The reference-fields dialog may not be open, or no financial reference was selected. Original: ${err.message}`
      );
    }
  }

  /**
   * Closes the Financial Reference (reference-fields) dialog in the trip overview
   * by clicking its dialog close button, then waits for the dialog to disappear.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<void>}
   */
  async closeFinancialReferenceDialogInTripOverview({ timeout = 10000 } = {}) {
    try {
      const closeBtn = this.page.locator(SELECTORS.REFERENCE_FORM_DIALOG_CLOSE).first();
      await closeBtn.waitFor({ state: 'visible', timeout });
      await closeBtn.click({ timeout: 5000 });
      await this.page.locator(SELECTORS.REFERENCE_FORM_DIALOG).first().waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.closeFinancialReferenceDialogInTripOverview] Could not close the Financial Reference dialog ` +
        `(close button: ${SELECTORS.REFERENCE_FORM_DIALOG_CLOSE}) within ${timeout}ms — the dialog may already be ` +
        `closed or its markup changed. Original: ${err.message}`
      );
    }
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
   * Expands the flight passenger-info panel and waits for the form fields to render
   * (anchored on the "Passport number" label).
   * @param {number} timeout
   */
  async openPassengerInfoPanel(timeout = 15000) {
    const collapseHeader = this.page.locator(SELECTORS.EXTRAS_COLLAPSE_HEADER).first();
    if (await collapseHeader.count()) {
      // Check the active state on THIS header, not page-wide. Other collapse items
      // (e.g. baggage, seats) being active would otherwise wrongly mark this one as open.
      const headerClass = (await collapseHeader.getAttribute('class')) || '';
      const isActive = headerClass.split(/\s+/).includes('is-active');
      if (!isActive) {
        await collapseHeader.click();
      }
    }
    const expandButton = this.page.locator(SELECTORS.PASSENGER_INFO_EXPAND_BUTTON).first();
    await expandButton.waitFor({ state: 'visible', timeout });
    await expandButton.click();
    await this.page
      .locator(SELECTORS.PASSENGER_INFO_SECTION)
      .getByText(SELECTORS.PASSENGER_INFO_PASSPORT_LABEL_TEXT, { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Reads the "edit not allowed" warning text shown inside the passenger-info
   * panel for Sabre quotes (e.g. "These details cannot be edited after order
   * is created").
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async getPassengerInfoEditNotAllowedMessage(timeout = 15000) {
    const message = this.page.locator(SELECTORS.PASSENGER_INFO_EDIT_NOT_ALLOWED_MSG).first();
    await message.waitFor({ state: 'visible', timeout });
    return (await message.innerText()).trim();
  }

  /**
   * Returns true when the passport-number input is disabled (post-hold lock state).
   */
  async isPassportNumberInputDisabled() {
    const input = this.page.locator(SELECTORS.PASSPORT_NUMBER_INPUT).first();
    await input.waitFor({ state: 'attached', timeout: 10000 });
    return await input.isDisabled();
  }

  /**
   * Clicks the Save button inside the passenger-info panel.
   */
  async clickSavePassengerInfoButton() {
    const saveButton = this.page
      .locator(SELECTORS.PASSENGER_INFO_SECTION)
      .getByRole('button', { name: SELECTORS.PASSENGER_INFO_SAVE_BUTTON_NAME })
      .first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
  }

  /**
   * Waits for the success icon to appear after saving the passenger-info form.
   */
  async waitForPassengerInfoSaveSuccess(timeout = 15000) {
    await this.page
      .locator(SELECTORS.PASSENGER_INFO_SAVE_SUCCESS_ICON)
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Opens the rail (Benerail eu-rail) passenger-info panel (eu-rail-passenger-info.vue).
   *
   * extras-layout.ts watches the trip's `passengers` array and force-closes the panel
   * (`isOpen = false`) whenever that reference changes — which happens on the trip reload
   * triggered by adding/removing a traveler. If that reload is still in flight when this method's
   * click fires, the watcher can snap the panel shut again just after opening, so the tabs never
   * appear even though the click itself succeeded (test 62001). Retrying the click covers that race.
   * @param {number} timeout
   */
  async openRailPassengerInfoPanel(timeout = 15000) {
    const expandButton = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_EXPAND_BUTTON).first();
    const tab = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_TAB).first();

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await expandButton.waitFor({ state: 'visible', timeout });
        await expandButton.click();
        await tab.waitFor({ state: 'visible', timeout });
        return;
      } catch (error) {
        if (attempt === 1) {
          throw error;
        }
      }
    }
  }

  /**
   * Gets the rail passenger-info card-title status text (e.g. "Passenger info 3/3").
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async getRailPassengerInfoStatusText(timeout = 15000) {
    const statusText = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_STATUS_TEXT).first();
    await statusText.waitFor({ state: 'visible', timeout });
    return (await statusText.innerText()).trim();
  }

  /**
   * Returns true when the rail passenger-info green success icon is visible.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async hasRailPassengerInfoSuccessIcon(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_SUCCESS_ICON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks a passenger's tab by their visible name ("{firstName} {lastName}") inside the
   * rail passenger-info panel.
   * @param {string} passengerName
   * @param {number} timeout
   */
  async clickRailPassengerInfoTabByName(passengerName, timeout = 15000) {
    if (!passengerName || typeof passengerName !== 'string') {
      throw new Error('passengerName must be a non-empty string');
    }
    const tab = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_TAB, { hasText: passengerName }).first();
    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Gets the current value of the active passenger's email field in the rail passenger-info panel.
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async getRailPassengerInfoEmailValue(timeout = 15000) {
    const input = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    return await input.inputValue();
  }

  /**
   * Fills the active passenger's email field in the rail passenger-info panel.
   * @param {string} email
   * @param {number} timeout
   */
  async fillRailPassengerInfoEmail(email, timeout = 15000) {
    const input = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.fill(email);
  }

  /**
   * Clears the active passenger's email field in the rail passenger-info panel.
   * @param {number} timeout
   */
  async clearRailPassengerInfoEmail(timeout = 15000) {
    const input = this.page.locator(SELECTORS.RAIL_PASSENGER_INFO_EMAIL_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.fill('');
  }

  /**
   * Opens the rail (Benerail eu-rail) date-of-birth panel (date-of-birth.vue).
   * @param {number} timeout
   */
  async openRailBirthDatePanel(timeout = 15000) {
    try {
      const expandButton = this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_EXPAND_BUTTON).first();
      await expandButton.waitFor({ state: 'visible', timeout });
      await expandButton.click();
      await this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_INPUT).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.openRailBirthDatePanel] Could not open the Benerail birth-date panel ` +
        `(selector: ${SELECTORS.RAIL_DATE_OF_BIRTH_EXPAND_BUTTON}). The section may not be rendered ` +
        `for this quote. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns true when the rail birth-date section is marked required (card-title carries the
   * leading "*" required marker, e.g. "* Birth Date").
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isRailBirthDateSectionRequired(timeout = 15000) {
    const cardTitle = this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_CARD_TITLE).first();
    await cardTitle.waitFor({ state: 'visible', timeout });
    const text = (await cardTitle.innerText()).trim();
    return text.startsWith('*');
  }

  /**
   * Opens the rail birth-date calendar popper by clicking the DOB input. Typing directly into
   * this input is unreliable (its placeholder "DD/MM/YYYY" does not match the format the
   * component actually parses on blur), so date selection must go through the calendar UI —
   * see calendar.helper.js's selectDateOfBirthWithYearArrows.
   * @param {number} timeout
   */
  async openRailBirthDateCalendar(timeout = 10000) {
    try {
      const dobInput = this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_INPUT).first();
      await dobInput.waitFor({ state: 'visible', timeout });
      await dobInput.click();
      await this.page.locator(SEARCH_SELECTORS.DATE_PICKER_PANEL).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.openRailBirthDateCalendar] Could not open the rail birth-date calendar ` +
        `(selector: ${SELECTORS.RAIL_DATE_OF_BIRTH_INPUT}). Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the Save button in the rail birth-date panel.
   * @param {number} timeout
   */
  async clickRailBirthDateSaveButton(timeout = 10000) {
    const saveButton = this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_SAVE_BUTTON).first();
    try {
      await saveButton.waitFor({ state: 'visible', timeout });
      await saveButton.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickRailBirthDateSaveButton] Could not click the rail birth-date "Save" button ` +
        `(selector: ${SELECTORS.RAIL_DATE_OF_BIRTH_SAVE_BUTTON}). The panel may not be in edit mode. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Returns true when the rail birth-date green success icon is visible.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async hasRailBirthDateSuccessIcon(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_SUCCESS_ICON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current value of the rail birth-date input.
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async getRailBirthDateValue(timeout = 10000) {
    const dobInput = this.page.locator(SELECTORS.RAIL_DATE_OF_BIRTH_INPUT).first();
    await dobInput.waitFor({ state: 'visible', timeout });
    return await dobInput.inputValue();
  }

  /**
   * Returns true when the active passenger's email field is marked invalid (is-danger) in the
   * rail passenger-info panel — rendered after an unsuccessful save attempt.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isRailPassengerInfoEmailFieldInvalid(timeout = 10000) {
    const field = this.page.locator(`${SELECTORS.RAIL_PASSENGER_INFO_EMAIL_FIELD}.is-danger`).first();
    try {
      await field.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the traveler-tag (trip-traveler-tag.vue) root locator matching the given name, scoped to
   * the cart page's Travellers section.
   * @param {string} travelerName
   * @returns {Locator}
   */
  getTravelerTagByName(travelerName) {
    return this.page.locator(SELECTORS.TRAVELER_TAG_ROOT).filter({ hasText: travelerName }).first();
  }

  /**
   * Clicks the remove icon on a specific traveler's tag by name in the cart page's Travellers
   * section.
   * @param {string} travelerName
   * @param {number} timeout
   */
  async clickRemoveTravelerButtonByName(travelerName, timeout = 15000) {
    const removeIcon = this.getTravelerTagByName(travelerName).locator(SELECTORS.TRAVELER_REMOVE_ICON).first();
    await removeIcon.waitFor({ state: 'visible', timeout });
    await removeIcon.click();
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
   * Gets the OOP violation label text (the policy reason shown above the justification input).
   * Returns the first violation label, trimmed.
   *
   * @returns {Promise<string>}
   */
  async getOOPViolationLabelText() {
    const label = this.page.locator(SELECTORS.OOP_VIOLATION_LABEL).first();
    try {
      await label.waitFor({ state: 'visible', timeout: 10000 });
      return (await label.textContent())?.trim() ?? '';
    } catch (err) {
      throw new Error(
        `[CartPage.getOOPViolationLabelText] OOP violation label (.out-of-policy-label) was not visible within 10s. ` +
        `Check that the OOP justification section is present on the page. Original: ${err.message}`
      );
    }
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
   * Gets the Per-Diem quote card "Type" value locator (should read "Per diem").
   * @returns {Locator} Playwright locator for the per-diem quote type value.
   */
  getPerDiemQuoteTypeValue() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_TYPE_VALUE).first();
  }

  /**
   * Gets the Per-Diem quote card title locator (e.g. "Per-Diem for Madrid").
   * @returns {Locator} Playwright locator for the per-diem quote title.
   */
  getPerDiemQuoteTitle() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_TITLE).first();
  }

  /**
   * Gets the Per-Diem quote card status label locator (e.g. "Confirmed").
   * @returns {Locator} Playwright locator for the per-diem quote status badge.
   */
  getPerDiemQuoteStatusLabel() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_STATUS_LABEL).first();
  }

  /**
   * Gets the Per-Diem quote card root locator. Used as a data/locale-independent
   * "card rendered" gate before asserting the presence/absence of edit controls.
   * @returns {Locator} Playwright locator for the per-diem quote card root.
   */
  getPerDiemQuoteCard() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_CARD).first();
  }

  /**
   * Gets the per-diem quote card's "N Personal days deducted" span locator (35726). Present only
   * when `quote.vacationDays > 0`, so its visibility alone signals days off were deducted.
   * @returns {Locator} Playwright locator for the per-diem quote vacation span.
   */
  getPerDiemQuoteVacation() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_VACATION).first();
  }

  /**
   * Gets the per-diem quote card's total-price amount locator (base-quote-card header → app-price →
   * `.amount`). Its text is the numeric total, e.g. "3000.00". Used to verify the quote amount (35703).
   * @returns {Locator} Playwright locator for the per-diem quote amount.
   */
  getPerDiemQuoteAmount() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_AMOUNT).first();
  }

  /**
   * Gets the per-diem card's read-only edit affordances (children of `.box-center .btns`).
   * Empty when the quote is locked (`canEditPerDiem` false → edit button removed via v-if),
   * populated when editable. Un-scoped to `.first()` so a count reflects the true match count.
   * @returns {Locator} Playwright locator for the per-diem quote edit controls.
   */
  getPerDiemQuoteEditControls() {
    return this.page.locator(SELECTORS.PER_DIEM_QUOTE_EDIT_CONTROLS);
  }

  /**
   * Clicks the Per-Diem quote card's own extras collapse header to expand its extras section.
   * Scoped to `.per-diem-quote-card` so a flight (or other) quote card's extras — which render an
   * identical `.extras-collapse-container` on the same trip — are never opened by mistake.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemExtrasCollapse(timeout = 10000) {
    const header = this.page.locator(SELECTORS.PER_DIEM_EXTRAS_COLLAPSE_HEADER).first();
    try {
      await header.waitFor({ state: 'visible', timeout });
      await header.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemExtrasCollapse] Could not click the Per-Diem quote card's extras collapse header ` +
        `(selector: ${SELECTORS.PER_DIEM_EXTRAS_COLLAPSE_HEADER}). The header was not visible within ${timeout}ms — ` +
        `likely the per-diem quote card did not render or has no extras section. Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the "View" toggle on the Per-Diem breakdown extras-layout to open the breakdown table.
   * Assumes the per-diem quote card's extras collapse is already expanded (see `clickPerDiemExtrasCollapse`).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemBreakdownViewBtn(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_VIEW_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemBreakdownViewBtn] Could not click the Per-Diem breakdown "View" toggle ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_VIEW_BTN}). The toggle was not visible within ${timeout}ms — ` +
        `likely the quote card extras section is not expanded, or the quote has no per-diem breakdown. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Gets the Per-Diem breakdown card title locator (reads "Per diem breakdown"), present only
   * once the breakdown is expanded. Used as the "breakdown displayed" anchor.
   * @returns {Locator} Playwright locator for the open breakdown card title.
   */
  getPerDiemBreakdownCardTitle() {
    return this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_CARD_TITLE).first();
  }

  /**
   * Gets the Per-Diem breakdown "Edit" button(s). Empty when the breakdown is locked
   * (`canEditTable` false → button removed via v-if). Un-scoped to `.first()` so a count
   * reflects the true match count for a negative (not-editable) assertion.
   * @returns {Locator} Playwright locator for the breakdown edit button.
   */
  getPerDiemBreakdownEditControls() {
    return this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_EDIT_BTN);
  }

  /**
   * Gets the Per-Diem breakdown "Add line" button(s). Empty when the breakdown is locked
   * (`canEditTable` false → button removed via v-if). Un-scoped to `.first()` so a count
   * reflects the true match count for a negative (cannot-add-line) assertion.
   * @returns {Locator} Playwright locator for the breakdown add-line button.
   */
  getPerDiemBreakdownAddLineControls() {
    return this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_ADD_LINE_BTN);
  }

  /**
   * Clicks the "Edit" button in the open Per-Diem breakdown to enter edit mode. The button is gated
   * behind `v-if="canEditTable"` in per-diem-breakdown.vue, so it is only present for an editable
   * ("new method") breakdown. The breakdown must be expanded first (see `clickPerDiemBreakdownViewBtn`).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemBreakdownEditBtn(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_EDIT_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemBreakdownEditBtn] Could not click the Per-Diem breakdown "Edit" button ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_EDIT_BTN}). The button was not visible within ${timeout}ms — ` +
        `likely the breakdown is not expanded, or is locked (not editable). Original: ${err.message}`,
      );
    }
  }

  /**
   * Selects a deduction on a Per-Diem breakdown data row (0-based) while in edit mode. Opens the
   * row's deduction `app-select` (el-select), then clicks the option whose label contains
   * `deductionText` (case-insensitive) in the open dropdown panel. Enter edit mode first via
   * `clickPerDiemBreakdownEditBtn`.
   * @param {number} rowIndex - 0-based index of the breakdown data row.
   * @param {string} deductionText - Text contained in the deduction option label (e.g. "mini bar").
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async setPerDiemBreakdownRowDeduction(rowIndex, deductionText, timeout = 10000) {
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new Error(
        `[CartPage.setPerDiemBreakdownRowDeduction] "rowIndex" must be a non-negative integer, got: ${rowIndex}`,
      );
    }
    if (typeof deductionText !== 'string' || !deductionText.trim()) {
      throw new Error(
        `[CartPage.setPerDiemBreakdownRowDeduction] "deductionText" must be a non-empty string, got: ${typeof deductionText}`,
      );
    }
    const row = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_DATA_ROW).nth(rowIndex);
    const trigger = row.locator(SELECTORS.PER_DIEM_BREAKDOWN_ROW_DEDUCTION_TRIGGER).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout });
      await trigger.click();
      const option = this.page
        .locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM, { hasText: deductionText })
        .first();
      await option.waitFor({ state: 'visible', timeout });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.setPerDiemBreakdownRowDeduction] Could not select the "${deductionText}" deduction on breakdown row ${rowIndex}. ` +
        `The row's deduction dropdown or the matching option did not appear within ${timeout}ms — the breakdown may not be in ` +
        `edit mode, or no deduction option matches "${deductionText}". Original: ${err.message}`,
      );
    }
  }

  /**
   * Fills the comment field on a Per-Diem breakdown data row (0-based) while in edit mode. A comment
   * is mandatory once a deduction is set — the app blocks Save otherwise. Enter edit mode and set the
   * deduction first.
   * @param {number} rowIndex - 0-based index of the breakdown data row.
   * @param {string} comment - Comment text to enter.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async fillPerDiemBreakdownRowComment(rowIndex, comment, timeout = 10000) {
    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new Error(
        `[CartPage.fillPerDiemBreakdownRowComment] "rowIndex" must be a non-negative integer, got: ${rowIndex}`,
      );
    }
    if (typeof comment !== 'string' || !comment.trim()) {
      throw new Error(
        `[CartPage.fillPerDiemBreakdownRowComment] "comment" must be a non-empty string, got: ${typeof comment}`,
      );
    }
    const row = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_DATA_ROW).nth(rowIndex);
    const input = row.locator(SELECTORS.PER_DIEM_BREAKDOWN_ROW_COMMENT_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      await input.fill(comment);
    } catch (err) {
      throw new Error(
        `[CartPage.fillPerDiemBreakdownRowComment] Could not fill the comment on breakdown row ${rowIndex} ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_ROW_COMMENT_INPUT}). The input was not visible within ${timeout}ms — ` +
        `the breakdown may not be in edit mode. Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the "Save" button in the open Per-Diem breakdown edit form to persist the edited line.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemBreakdownSaveBtn(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_SAVE_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemBreakdownSaveBtn] Could not click the Per-Diem breakdown "Save" button ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_SAVE_BTN}). The button was not visible within ${timeout}ms — ` +
        `the breakdown may not be in edit mode. Original: ${err.message}`,
      );
    }
  }

  /**
   * Gets the deduction-column cells of the Per-Diem breakdown data rows (read-only `<p>` view). Used
   * to assert a saved deduction label is shown in the breakdown. Excludes the header row and hidden
   * responsive duplicates.
   * @returns {Locator} Playwright locator for the breakdown deduction cells.
   */
  getPerDiemBreakdownDeductionCells() {
    return this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_DEDUCTION_CELL);
  }

  /**
   * Clicks the "Add line" button in the open Per-Diem breakdown to reveal the inline add-line form.
   * Gated behind `v-if="canEditTable"` in per-diem-breakdown.vue (editable "new method" breakdown),
   * so it is absent for a locked breakdown. The breakdown must be expanded first
   * (see `clickPerDiemBreakdownViewBtn`).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemBreakdownAddLineBtn(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_ADD_LINE_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemBreakdownAddLineBtn] Could not click the Per-Diem breakdown "Add line" button ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_ADD_LINE_BTN}). The button was not visible within ${timeout}ms — ` +
        `likely the breakdown is not expanded, or is locked (not editable). Original: ${err.message}`,
      );
    }
  }

  /**
   * Picks the first available day in the Per-Diem add-line datepicker. Opens the readonly picker
   * input, waits for the teleported EP panel, and clicks the first selectable (`td.available`) day.
   * A date is mandatory to add a line (vuelidate `required`) and, with the destination, triggers the
   * async price calc. The add-line form must be shown first (see `clickPerDiemBreakdownAddLineBtn`).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async pickPerDiemAddLineFirstAvailableDate(timeout = 10000) {
    const input = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_DATE_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      await input.click();
      const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE).last();
      await panel.waitFor({ state: 'visible', timeout });
      const day = panel.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY).first();
      await day.waitFor({ state: 'visible', timeout });
      await day.click();
    } catch (err) {
      throw new Error(
        `[CartPage.pickPerDiemAddLineFirstAvailableDate] Could not select a date in the Per-Diem add-line datepicker ` +
        `(input: ${SELECTORS.PER_DIEM_ADD_LINE_DATE_INPUT}). The picker or an available day did not appear within ${timeout}ms — ` +
        `the add-line form may not be shown. Original: ${err.message}`,
      );
    }
  }

  /**
   * Fills the Per-Diem add-line destination airport-autocomplete and selects the first result. Types
   * the term (≥3 chars triggers the airport search), then clicks the first popper result. Selecting
   * the destination triggers the async price calc. The add-line form must be shown first.
   * @param {string} destination - Destination search term (e.g. "bkk").
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async fillPerDiemAddLineDestination(destination, timeout = 10000) {
    if (typeof destination !== 'string' || !destination.trim()) {
      throw new Error(
        `[CartPage.fillPerDiemAddLineDestination] "destination" must be a non-empty string, got: ${typeof destination}`,
      );
    }
    const input = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_DEST_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      await input.click();
      await input.fill('');
      await input.pressSequentially(destination, { delay: 50 });
      const option = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_DEST_OPTION).first();
      await option.waitFor({ state: 'visible', timeout });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.fillPerDiemAddLineDestination] Could not select destination "${destination}" in the Per-Diem add-line form ` +
        `(input: ${SELECTORS.PER_DIEM_ADD_LINE_DEST_INPUT}). The input or an autocomplete result did not appear within ${timeout}ms. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Waits for the Per-Diem add-line form to close after Save. The form is removed via
   * `v-if="showLineToAdd"` only once `addLine()` accepts the save, so its detachment confirms the
   * line was persisted (if the save is blocked, the form stays open and this times out). The quote
   * then re-renders (refreshQuotes), collapsing the breakdown — callers should re-expand afterwards.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async waitForPerDiemAddLineFormClosed(timeout = 30000) {
    const form = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_FORM_ANY).first();
    try {
      await form.waitFor({ state: 'detached', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForPerDiemAddLineFormClosed] The Per-Diem add-line form did not close within ${timeout}ms after Save ` +
        `(selector: ${SELECTORS.PER_DIEM_ADD_LINE_FORM_ANY}). The save may have been blocked (e.g. the price calc failed) or did not persist. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Selects a deduction in the Per-Diem add-line form (the only app-select in the form). Opens the
   * dropdown and clicks the option whose label contains `deductionText` (case-insensitive).
   * @param {string} deductionText - Text contained in the deduction option label (e.g. "limo").
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async selectPerDiemAddLineDeduction(deductionText, timeout = 10000) {
    if (typeof deductionText !== 'string' || !deductionText.trim()) {
      throw new Error(
        `[CartPage.selectPerDiemAddLineDeduction] "deductionText" must be a non-empty string, got: ${typeof deductionText}`,
      );
    }
    const trigger = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_DEDUCTION_TRIGGER).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout });
      await trigger.click();
      const option = this.page
        .locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM, { hasText: deductionText })
        .first();
      await option.waitFor({ state: 'visible', timeout });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.selectPerDiemAddLineDeduction] Could not select the "${deductionText}" deduction in the Per-Diem add-line form. ` +
        `The dropdown or a matching option did not appear within ${timeout}ms — no deduction option may match "${deductionText}". ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Fills the comment field in the Per-Diem add-line form. A comment is mandatory (vuelidate
   * `required`) — the app blocks Save otherwise.
   * @param {string} comment - Comment text to enter.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async fillPerDiemAddLineComment(comment, timeout = 10000) {
    if (typeof comment !== 'string' || !comment.trim()) {
      throw new Error(
        `[CartPage.fillPerDiemAddLineComment] "comment" must be a non-empty string, got: ${typeof comment}`,
      );
    }
    const input = this.page.locator(SELECTORS.PER_DIEM_ADD_LINE_COMMENT_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      await input.fill(comment);
    } catch (err) {
      throw new Error(
        `[CartPage.fillPerDiemAddLineComment] Could not fill the comment in the Per-Diem add-line form ` +
        `(selector: ${SELECTORS.PER_DIEM_ADD_LINE_COMMENT_INPUT}). The input was not visible within ${timeout}ms. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the "Export to excel" button in the open Per-Diem breakdown. This opens the "Additional
   * currency" confirm dialog (it does NOT download directly). The breakdown must be expanded first
   * (see `clickPerDiemBreakdownViewBtn`).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickPerDiemBreakdownExportBtn(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.PER_DIEM_BREAKDOWN_EXPORT_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickPerDiemBreakdownExportBtn] Could not click the Per-Diem breakdown "Export to excel" button ` +
        `(selector: ${SELECTORS.PER_DIEM_BREAKDOWN_EXPORT_BTN}). The button was not visible within ${timeout}ms — ` +
        `likely the breakdown is not expanded, or is in edit/add-line mode. Original: ${err.message}`,
      );
    }
  }

  /**
   * Enables the checkout "I have days off in the trip" per-diem checkbox, revealing the date-range
   * inputs (35694). Waits for the checkbox label (the "days off exists" anchor) before clicking the
   * el-checkbox root. The per-diem days-off section must be present (checkout of a per-diem trip).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async enablePerDiemDaysOff(timeout = 10000) {
    const label = this.page
      .locator(SELECTORS.PER_DIEM_DAYS_OFF_CHECKBOX_LABEL, { hasText: 'days off' })
      .first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      const checkbox = this.page.locator(SELECTORS.PER_DIEM_DAYS_OFF_CHECKBOX).first();
      await checkbox.click();
    } catch (err) {
      throw new Error(
        `[CartPage.enablePerDiemDaysOff] Could not enable the per-diem days-off checkbox ` +
        `(label: ${SELECTORS.PER_DIEM_DAYS_OFF_CHECKBOX_LABEL}). The days-off section may not have rendered ` +
        `within ${timeout}ms — the trip may not be per-diem, or the checkout did not show the section. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Picks the start and end dates of the days-off range at `rangeIndex` (0-based) by selecting the
   * `startDayIndex`-th and `endDayIndex`-th selectable days in the respective app-datepicker panels.
   * The end picker's minimum is the chosen start day, so `endDayIndex` counts from the start day: 0 =
   * same day (a 1-day range), 1 = the next day (a 2-day range), etc. The days-off checkbox must be
   * enabled first (see `enablePerDiemDaysOff`).
   * @param {number} rangeIndex - 0-based index of the days-off range wrapper.
   * @param {number} startDayIndex - 0-based index of the selectable start day in the start panel.
   * @param {number} endDayIndex - 0-based index of the selectable end day in the end panel (counts from the start day).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async pickPerDiemDaysOffRangeDates(rangeIndex, startDayIndex = 0, endDayIndex = 0, timeout = 10000) {
    for (const [name, value] of [['rangeIndex', rangeIndex], ['startDayIndex', startDayIndex], ['endDayIndex', endDayIndex]]) {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(
          `[CartPage.pickPerDiemDaysOffRangeDates] "${name}" must be a non-negative integer, got: ${value}`,
        );
      }
    }
    const wrapper = this.page.locator(SELECTORS.PER_DIEM_DAYS_OFF_RANGE_WRAPPER).nth(rangeIndex);
    try {
      await wrapper.waitFor({ state: 'visible', timeout });
      // The checkout page lazy-loads sections (contact details, reference questions) after the
      // days-off section renders; the reflow keeps repositioning the teleported datepicker popper,
      // making its day cells "not stable" to click. Let the page settle first (best-effort).
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const dateInputs = wrapper.locator(SELECTORS.PER_DIEM_DAYS_OFF_DATE_INPUT);
      await this.pickAvailableDayInDatepicker(dateInputs.nth(0), startDayIndex, timeout);
      await this.pickAvailableDayInDatepicker(dateInputs.nth(1), endDayIndex, timeout);
    } catch (err) {
      throw new Error(
        `[CartPage.pickPerDiemDaysOffRangeDates] Could not set the dates for days-off range ${rangeIndex} ` +
        `(start day #${startDayIndex}, end day #${endDayIndex}; wrapper: ${SELECTORS.PER_DIEM_DAYS_OFF_RANGE_WRAPPER}). ` +
        `The range or its date pickers did not appear within ${timeout}ms. Original: ${err.message}`,
      );
    }
  }

  /**
   * Opens a readonly app-datepicker input and clicks the `dayIndex`-th selectable (`td.available`) day
   * in the teleported EP panel. Shared by the per-diem days-off date pickers.
   * @param {import('@playwright/test').Locator} inputLocator - The datepicker's readonly input.
   * @param {number} dayIndex - 0-based index of the selectable day to click.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async pickAvailableDayInDatepicker(inputLocator, dayIndex = 0, timeout = 10000) {
    await inputLocator.scrollIntoViewIfNeeded().catch(() => {});
    await inputLocator.waitFor({ state: 'visible', timeout });
    await inputLocator.click();
    const panel = this.page.locator(SELECTORS.DATE_PICKER_PANEL_VISIBLE).last();
    await panel.waitFor({ state: 'visible', timeout });
    // Click the selectable cell itself (a stable, sized target) rather than its inner text span.
    const day = panel.locator(SELECTORS.DATE_PICKER_AVAILABLE_DAY_CELL).nth(dayIndex);
    await day.waitFor({ state: 'visible', timeout });
    try {
      await day.click({ timeout: 5000 });
    } catch {
      // Residual popper jitter (page still reflowing): force the click on the already-validated cell.
      await day.click({ force: true });
    }
  }

  /**
   * Clicks the "More days off in the trip" button to append an additional days-off range. Targeted by
   * the add material-symbol (`add-icon` reading exactly "add"), never the per-range remove icon
   * (which reads "close"). The days-off checkbox must be enabled first.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickAddPerDiemDaysOffRange(timeout = 10000) {
    const icon = this.page.locator(SELECTORS.PER_DIEM_DAYS_OFF_ADD_RANGE_ICON).first();
    try {
      await icon.waitFor({ state: 'visible', timeout });
      await icon.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickAddPerDiemDaysOffRange] Could not click the "More days off" add button ` +
        `(selector: ${SELECTORS.PER_DIEM_DAYS_OFF_ADD_RANGE_ICON}). The button was not visible within ${timeout}ms — ` +
        `the days-off checkbox may not be enabled. Original: ${err.message}`,
      );
    }
  }

  /**
   * Gets the read-only day counter of the days-off range at `rangeIndex` (0-based). The value reflects
   * the picked range length (calendar-diff(end,start)+1), or 0 for an unset range.
   * @param {number} rangeIndex - 0-based index of the days-off range wrapper.
   * @returns {import('@playwright/test').Locator} Locator for that range's counter input.
   */
  getPerDiemDaysOffRangeCounter(rangeIndex) {
    if (!Number.isInteger(rangeIndex) || rangeIndex < 0) {
      throw new Error(
        `[CartPage.getPerDiemDaysOffRangeCounter] "rangeIndex" must be a non-negative integer, got: ${rangeIndex}`,
      );
    }
    return this.page
      .locator(SELECTORS.PER_DIEM_DAYS_OFF_RANGE_WRAPPER)
      .nth(rangeIndex)
      .locator(SELECTORS.PER_DIEM_DAYS_OFF_SUM_INPUT);
  }

  /**
   * Waits for the "Additional currency" confirm dialog (app-confirm) to become visible after clicking
   * "Export to excel". The dialog is appended to <body>, so it is not scoped to the breakdown.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async waitForExcelCurrencyDialog(timeout = 10000) {
    const dialog = this.page.locator(SELECTORS.EXCEL_CURRENCY_DIALOG).first();
    try {
      await dialog.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForExcelCurrencyDialog] The "Additional currency" export dialog did not become visible within ${timeout}ms ` +
        `(selector: ${SELECTORS.EXCEL_CURRENCY_DIALOG}). Likely the "Export to excel" button was not clicked, or the dialog failed to open. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the primary "Yes" button in the "Additional currency" dialog, which triggers the Excel
   * export. The app fetches the file, then synchronously clicks a hidden `<a download>` — surfacing
   * as a Playwright download event (arm `waitForExcelDownload` BEFORE calling this).
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<void>}
   */
  async clickExcelCurrencyDialogConfirm(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.EXCEL_CURRENCY_DIALOG_CONFIRM_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickExcelCurrencyDialogConfirm] Could not click the "Yes" confirm button in the "Additional currency" export dialog ` +
        `(selector: ${SELECTORS.EXCEL_CURRENCY_DIALOG_CONFIRM_BTN}). The button was not visible within ${timeout}ms — ` +
        `likely the export dialog is not open. Original: ${err.message}`,
      );
    }
  }

  /**
   * Returns a promise that resolves with the Playwright download event fired by the Excel export
   * (a client-side blob `<a download='...xlsx'>` click). Call this to ARM the wait BEFORE clicking
   * the dialog's confirm button, then await the returned promise afterwards.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<import('@playwright/test').Download>}
   */
  waitForExcelDownload(timeout = 30000) {
    return this.page.waitForEvent('download', { timeout }).catch((err) => {
      throw new Error(
        `[CartPage.waitForExcelDownload] No Excel file download was triggered within ${timeout}ms after confirming the export ` +
        `(waited for a Playwright 'download' event). Likely the export service call failed, or the "Yes" confirm button was not clicked. ` +
        `Original: ${err.message}`,
      );
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
   * Gets the baggage green icon locator, scoped to the currently visible instance.
   * Use this instead of getBaggageGreenIcon() when hidden duplicate icons may exist
   * (e.g. responsive layouts), which would otherwise make the plain locator resolve
   * to a hidden element first.
   *
   * @returns {Locator} Playwright locator for the visible baggage success icon
   */
  getVisibleBaggageGreenIcon() {
    return this.page.locator(SELECTORS.GREEN_ICON_BAGGAGE_VISIBLE).first();
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
   * Accepts Terms & Conditions checkbox (required before checkout). Verifies the checkbox
   * actually stayed checked and retries once: a trip reload still in flight from a just-completed
   * save (e.g. re-validating a re-added traveler's passenger info) can re-render this checkbox
   * back to unchecked right after the click registers, silently leaving it unaccepted (test 62001).
   */
  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(SELECTORS.TERMS_CHECKBOX).nth(0);
    const checkboxInput = this.page.locator(SELECTORS.TERMS_CHECKBOX_INPUT).nth(0);
    await checkbox.waitFor({ state: "visible" });

    for (let attempt = 0; attempt < 2; attempt++) {
      await checkbox.click();
      const classes = (await checkboxInput.getAttribute('class')) || '';
      if (classes.includes('is-checked')) {
        return;
      }
      await this.page.waitForTimeout(1000);
    }

    throw new Error(
      '[CartPage.acceptTermsAndConditions] Terms & Conditions checkbox did not stay checked after ' +
      'clicking twice — likely a trip reload from a recent save reset it right after the click.'
    );
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
   * Waits until the cart's "Proceed to Checkout" CTA is not just visible but actionable.
   *
   * Deliberately NOT folded into `waitForProceedToCheckout()`: tests such as 62852 (Amtrak
   * mandatory phone number) click the CTA precisely while it is expected to be disabled, and
   * must keep getting a harmless no-op rather than a thrown error.
   *
   * @param {{ timeout?: number }} [options]
   * @throws {Error} If the button stays disabled for the whole timeout
   * @returns {Promise<void>}
   */
  async waitForProceedToCheckoutEnabled({ timeout = 30000 } = {}) {
    await this.waitForProceedToCheckout();

    try {
      await this.page.locator(SELECTORS.PROCEED_TO_CHECKOUT_ENABLED_BTN).first().waitFor({
        state: 'visible',
        timeout,
      });
    } catch (error) {
      throw new Error(
        `[CartPage.waitForProceedToCheckoutEnabled] The "Proceed to Checkout" button was visible but ` +
        `stayed disabled for ${timeout}ms (selector: ${SELECTORS.PROCEED_TO_CHECKOUT_ENABLED_BTN}). ` +
        `The cart still has outstanding required information, or a save is still in flight. ` +
        `Original: ${error.message}`
      );
    }
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
   * Waits until the "Send For Approvals" cart button is ready.
   * Shown in place of "Proceed to Checkout" when the trip requires pre-booking approval.
   */
  async waitForSendForApproval() {
    await this.page.locator(SELECTORS.SEND_FOR_APPROVAL_BUTTON).waitFor({
      state: 'visible',
      timeout: 10000
    });
  }

  /**
   * Clicks the "Send For Approvals" cart button.
   * Uses text-based selector to ensure correct button.
   */
  async clickSendForApproval() {
    await this.page.locator(SELECTORS.SEND_FOR_APPROVAL_BUTTON).click();
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
   * Opens the hotel quote's 3-dots (more_vert) actions menu.
   * The el-dropdown trigger is hover-based, so we hover the kebab and wait for
   * the menu to render. Retries the hover once to absorb the render gap where
   * the menu closes before its items paint.
   */
  async openHotelQuoteActionsDropdown() {
    const icon = this.page.locator(SELECTORS.HOTEL_QUOTE_ACTIONS_ICON).first();
    await icon.waitFor({ state: 'visible', timeout: 15000 });
    await icon.scrollIntoViewIfNeeded().catch(() => {});
    // The el-dropdown opens on hover. Wait for the "Change Dates" item itself to
    // become visible (the reliable signal the QUOTE menu opened) rather than the
    // trip-level menu's items. Re-hover once to absorb the open/close render gap.
    const changeDates = this.page
      .locator(SELECTORS.CHANGE_DATES_QUOTE_OPTION, { hasText: 'Change Dates' })
      .first();
    await icon.hover();
    try {
      await changeDates.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await icon.hover();
      await changeDates.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  /**
   * Clicks the "Change Dates" option in the open hotel quote menu.
   */
  async clickChangeDatesQuoteOption() {
    const option = this.page
      .locator(SELECTORS.CHANGE_DATES_QUOTE_OPTION, { hasText: 'Change Dates' })
      .first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
  }

  /**
   * Reads the modification countdown text (e.g. "29:58"), or '' if absent.
   * @returns {Promise<string>}
   */
  async getModificationCountdownText({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.MODIFICATION_COUNTDOWN).first();
    try {
      await el.waitFor({ state: 'visible', timeout });
    } catch {
      return '';
    }
    return ((await el.innerText()) ?? '').trim();
  }

  /**
   * Whether the "Cancel Modify" button is visible on the quote.
   * @returns {Promise<boolean>}
   */
  async isCancelModifyButtonVisible({ timeout = 15000 } = {}) {
    const el = this.page.locator(SELECTORS.CANCEL_MODIFY_BUTTON).first();
    try {
      await el.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
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
      CANCELLATION_CONFIRMED_TEXT,
      { exact: true },
    );
    await successMessage.waitFor({ state: "visible", timeout });
    // This method only waits, does not return value
  }

  /**
   * Waits for the trip-cancellation dialog to reach a terminal state and reports which one.
   *
   * cancel-trip-modal.vue ends in exactly one of two states: the "Cancellation confirmed!" success
   * view, or the failure view headed by `.cancel-trip-error`. Racing both means a supplier-side
   * refusal is detected as soon as it renders instead of burning the whole timeout waiting for a
   * success message that will never appear.
   *
   * Never throws — callers decide whether a non-success outcome is fatal.
   *
   * Kept generous (slow GDS backends like Sabre/Amadeus can take a minute to confirm a
   * cancellation) — safe to do so because the failure branch short-circuits as soon as it renders,
   * and callers bound the total wait themselves.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=90000] Max wait for either terminal state.
   * @returns {Promise<'cancelled'|'failed'|'unknown'>} 'unknown' when neither state appeared in time.
   */
  async waitForTripCancellationOutcome({ timeout = 90000 } = {}) {
    // Each wait carries its own rejection handler, so the losing branch can never surface as an
    // unhandled rejection after the race has already settled.
    const settleAs = (locator, outcome) =>
      locator.waitFor({ state: 'visible', timeout }).then(
        () => outcome,
        () => null,
      );

    const outcome = await Promise.race([
      settleAs(this.page.getByText(CANCELLATION_CONFIRMED_TEXT, { exact: true }).first(), 'cancelled'),
      settleAs(this.page.locator(SELECTORS.TRIP_CANCELLATION_ERROR).first(), 'failed'),
    ]);

    return outcome ?? 'unknown';
  }

  /**
   * Reads the rendered text of the cancellation-confirmed page title.
   *
   * Returned text-as-displayed so callers can assert correct spelling (e.g. "Cancellation confirmed!").
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>} The trimmed title text
   */
  async getCancellationConfirmedTitleText({ timeout = 30000 } = {}) {
    const title = this.page.locator(SELECTORS.CANCELLATION_CONFIRMED_TITLE).first();
    await title.waitFor({ state: "visible", timeout });
    return ((await title.textContent()) ?? "").replace(/\s+/g, " ").trim();
  }

  /**
   * Checks whether the given date text appears anywhere in the cart quotes tabs container.
   *
   * Used to guard against the broken default date (e.g. "Thursday, January 01") rendering when a
   * product's date fails to parse. Text-based (not positional) so it catches the value regardless
   * of which quote-card element shows it. Never throws; returns a boolean.
   *
   * @param {string} dateText - The date text to look for
   * @param {{ timeout?: number }} options
   * @returns {Promise<boolean>}
   */
  async isDateTextShownInCartTabs(dateText, { timeout = 10000 } = {}) {
    if (!dateText || typeof dateText !== "string") {
      throw new Error(
        `[CartPage.isDateTextShownInCartTabs] "dateText" must be a non-empty string, got: ${typeof dateText} (${JSON.stringify(dateText)})`,
      );
    }
    const tabs = this.page.locator(SELECTORS.CART_TABS_CONTAINER).first();
    await tabs.waitFor({ state: "visible", timeout });
    // exact:false is deliberate — the date renders as "{date} · {time}", so the broken value must be
    // matched as a substring. Do not tighten to exact:true or the guard will stop catching it.
    return (await tabs.getByText(dateText, { exact: false }).count()) > 0;
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
   * Opens the trip-level options (more_vert) dropdown and waits for its menu.
   * The menu is HOVER-triggered on desktop (`:trigger="isMobile ? 'click' : 'hover'"`)
   * and its el-dropdown is briefly disabled while the trip polls the backend, so a
   * single click silently fails — reuse the proven hover-with-retry opener. The menu
   * contains "View approvals", "Cancel trip", etc.
   */
  async clickOptionsButton() {
    await this.hoverTripActionsDropdownIconWithRetry();
  }

  /**
   * Clicks "View approvals" from the currently visible options dropdown menu.
   */
  async clickViewApprovalsMenuItem() {
    const menu = this.getVisibleShareMenu();
    try {
      const item = menu.locator('li[role="menuitem"]', { hasText: 'View approvals' });
      await item.waitFor({ state: 'visible', timeout: 10000 });
      await item.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickViewApprovalsMenuItem] Could not click "View approvals" menu item. ` +
        `Item may not be visible — trip may have no approval flow or trip is cancelled. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the approvals dialog to become visible after clicking "View approvals".
   */
  async waitForApprovalsDialogVisible() {
    try {
      await this.page.locator(SELECTORS.APPROVALS_DIALOG).waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForApprovalsDialogVisible] Approvals dialog did not open (${SELECTORS.APPROVALS_DIALOG}). Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the approvals dialog and its first approver name to render, then
   * returns the approver-name locator. The dialog shows a skeleton while
   * isLoading=true, so callers must wait for real data before reading it.
   * @param {string} caller - Calling method name, for error context
   * @param {number} timeout - Max wait for the first approver name (ms)
   * @returns {Promise<import('playwright').Locator>}
   */
  async waitForApproverNamesReady(caller, timeout) {
    const dialog = this.page.locator(SELECTORS.APPROVALS_DIALOG);
    try {
      await dialog.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.${caller}] Approvals dialog not visible (${SELECTORS.APPROVALS_DIALOG}). Original: ${err.message}`
      );
    }
    const approverNames = this.page.locator(SELECTORS.APPROVALS_DIALOG_APPROVER_NAME);
    try {
      await approverNames.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.${caller}] No approver names appeared in the approvals dialog after ${timeout}ms (${SELECTORS.APPROVALS_DIALOG_APPROVER_NAME}). ` +
        `The trip may have no approval flow or data failed to load. Original: ${err.message}`
      );
    }
    return approverNames;
  }

  /**
   * Counts the approver name elements inside the approvals dialog.
   * Waits for the first approver to appear (dialog has a loading state before data renders).
   * @param {number} [timeout=15000]
   * @returns {Promise<number>}
   */
  async getApproverCount({ timeout = 15000 } = {}) {
    const approverNames = await this.waitForApproverNamesReady('getApproverCount', timeout);
    return approverNames.count();
  }

  /**
   * Reads the trimmed approver names listed in the open approvals dialog.
   * Waits for the first approver to render (dialog shows a skeleton while isLoading=true).
   * @param {number} [timeout=15000]
   * @returns {Promise<string[]>}
   */
  async getApproverNames({ timeout = 15000 } = {}) {
    const approverNames = await this.waitForApproverNamesReady('getApproverNames', timeout);
    const names = await approverNames.allInnerTexts();
    return names.map((name) => name.trim()).filter((name) => name.length > 0);
  }

  /**
   * Closes the approvals dialog by clicking its header close button.
   */
  async closeApprovalsDialog() {
    const closeBtn = this.page.locator(SELECTORS.APPROVALS_DIALOG_CLOSE_BUTTON);
    try {
      await closeBtn.waitFor({ state: 'visible', timeout: 5000 });
      await closeBtn.click();
      await this.page.locator(SELECTORS.APPROVALS_DIALOG).waitFor({ state: 'hidden', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.closeApprovalsDialog] Could not close approvals dialog (${SELECTORS.APPROVALS_DIALOG_CLOSE_BUTTON}). Original: ${err.message}`
      );
    }
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
   * Locator for the share dialog's "Send" button.
   *
   * Scoped to the visible share dialog: a page-wide match risked resolving to a
   * stale/hidden dialog's button (strict-mode failure) or clicking the wrong element,
   * which left the dialog open and the send never firing.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getSendEmailButton() {
    return this.page
      .locator(".el-dialog")
      .filter({ visible: true })
      .getByRole("button", { name: "Send" })
      .filter({ visible: true });
  }

  /**
   * Clicks the "Send" button in the share dialog.
   */
  async clickSendEmailButton() {
    const sendButton = this.getSendEmailButton();

    await sendButton.waitFor({ state: "visible", timeout: 30_000 });
    await sendButton.scrollIntoViewIfNeeded();
    // The button is enabled only once the recipient/preview finish loading. click()
    // auto-waits for enabled, but assert it so a stuck-disabled state fails loudly
    // instead of silently waiting out the timeout.
    await expect(sendButton).toBeEnabled({ timeout: 15_000 });
    await sendButton.click();
  }

  /**
   * Whether the share dialog's "Send" button is currently visible (i.e. the dialog is
   * still open). Used to decide whether a re-click is needed after a dropped click.
   * @returns {Promise<boolean>}
   */
  async isSendEmailButtonVisible() {
    return this.getSendEmailButton().isVisible().catch(() => false);
  }

  /**
   * Locator for the share dialog's "Copy to clipboard" footer button.
   *
   * Scoped to the visible dialog for the same reason as getSendEmailButton: a
   * page-wide match could resolve to a stale/hidden dialog. Matches the pre-copy
   * label "Copy to clipboard"; after a successful copy the button re-renders as
   * "Copied to clipboard", so this locator intentionally stops matching then.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCopyToClipboardButton() {
    return this.page
      .locator(".el-dialog")
      .filter({ visible: true })
      .getByRole("button", { name: "Copy to clipboard" })
      .filter({ visible: true });
  }

  /**
   * Clicks the "Copy to clipboard" button in the share dialog footer.
   */
  async clickCopyToClipboardButton() {
    const button = this.getCopyToClipboardButton();
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.scrollIntoViewIfNeeded();
    await button.click();
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
   * Reads the old and new prices from the price-change modal.
   *
   * @returns {Promise<{oldPrice: number, newPrice: number, oldText: string, newText: string}>}
   */
  async getPriceChangeValues() {
    const parsePrice = (text) => parseFloat((text ?? '').replace(/[^0-9.]/g, '')) || 0;
    const oldText = await this.page.locator(SELECTORS.PRICE_CHANGE_PREV_PRICE).first().textContent().catch(() => '');
    const newText = await this.page.locator(SELECTORS.PRICE_CHANGE_UPDATED_PRICE).first().textContent().catch(() => '');
    return { oldPrice: parsePrice(oldText), newPrice: parsePrice(newText), oldText, newText };
  }

  // ===== ADO 77842 — "Checkout notification" price-change modal accessors =====

  /** @returns {import('playwright').Locator} the price-change dialog wrapper */
  getPriceChangeDialog() {
    return this.page.locator(SELECTORS.PRICE_CHANGE_DIALOG).first();
  }

  /** Waits for the price-change modal to be present (its "Proceed with change" button is visible). */
  async waitForPriceChangeDialog(timeout = process.env.CI ? 60000 : 45000) {
    await this.getProceedWithChangeButton().waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for the price-change modal to be torn down after an action dismisses it.
   * Hidden-state counterpart of waitForPriceChangeDialog.
   *
   * @param {number} [timeout=10000]
   */
  async waitForPriceChangeDialogHidden(timeout = 10000) {
    await this.getPriceChangeDialog().waitFor({ state: 'hidden', timeout });
  }

  /**
   * Whether the "Proceed with change" button is currently visible. Distinguishes a
   * price-change modal from a booking-error modal — trip-cart.vue renders this button
   * only for changed-but-bookable quotes, and both modals share the same el-dialog.
   *
   * @returns {Promise<boolean>}
   */
  async isProceedWithChangeButtonVisible() {
    return this.getProceedWithChangeButton().isVisible();
  }

  /** @returns {Promise<string>} the full visible text of the price-change dialog */
  async getPriceChangeDialogText() {
    return (await this.getPriceChangeDialog().innerText().catch(() => '')) ?? '';
  }

  async getPriceChangeTitleText() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_TITLE).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return ((await el.innerText()) ?? '').trim();
  }

  async getPriceChangeBodyText() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_BODY_TEXT).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return ((await el.innerText()) ?? '').trim();
  }

  async getPriceChangeHotelNameText() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_HOTEL_NAME).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return ((await el.innerText()) ?? '').trim();
  }

  async getPriceChangeDatesText() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_DATES).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return ((await el.innerText()) ?? '').replace(/\s+/g, ' ').trim();
  }

  async getPriceChangeStatusText() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_STATUS_LABEL).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return ((await el.innerText()) ?? '').trim();
  }

  /** @returns {Promise<number>} number of price elements shown in the popup (old + new) */
  async getPriceChangePriceCount() {
    return this.page.locator(SELECTORS.PRICE_CHANGE_ALL_PRICES).count();
  }

  /** @returns {Promise<boolean>} true if the old (prev) price is rendered with a strikethrough */
  async isPriceChangePrevPriceStrikethrough() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_PREV_PRICE).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return el.evaluate((node) => window.getComputedStyle(node).textDecorationLine.includes('line-through'));
  }

  /** @returns {Promise<boolean>} true if the new (updated) price is rendered with a strikethrough */
  async isPriceChangeUpdatedPriceStrikethrough() {
    const el = this.page.locator(SELECTORS.PRICE_CHANGE_UPDATED_PRICE).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    return el.evaluate((node) => window.getComputedStyle(node).textDecorationLine.includes('line-through'));
  }

  /** @returns {Promise<string[]>} the visible text of each footer action button in the popup */
  async getPriceChangeFooterButtonNames() {
    const buttons = this.page.locator(SELECTORS.PRICE_CHANGE_FOOTER_BUTTON);
    const count = await buttons.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const text = ((await buttons.nth(i).innerText()) ?? '').replace(/\s+/g, ' ').trim();
      if (text) names.push(text);
    }
    return names;
  }

  /** @returns {Promise<string>} the hotel name shown on the cart hotel quote card */
  async getHotelPreviewNameText() {
    const el = this.page.locator(SELECTORS.HOTEL_PREVIEW_NAME).first();
    await el.waitFor({ state: 'visible', timeout: 30000 });
    return ((await el.innerText()) ?? '').trim();
  }

  /** @returns {Promise<string>} the stay dates shown on the cart hotel quote card */
  async getHotelPreviewDatesText() {
    const el = this.page.locator(SELECTORS.HOTEL_PREVIEW_DATES).first();
    await el.waitFor({ state: 'visible', timeout: 30000 });
    return ((await el.innerText()) ?? '').replace(/\s+/g, ' ').trim();
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
    const button = this.page.locator(SELECTORS.HOLD_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });

    // Wait until the button finishes its own loading state before clicking.
    await this.page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector);
        if (!element) return false;
        return !element.classList.contains('is-loading') && !element.hasAttribute('disabled');
      },
      SELECTORS.HOLD_BUTTON,
      { timeout: 10000 },
    ).catch(() => {});

    await button.click({ timeout: 10000 });
  }

  /**
   * Checks if the Hold button is disabled.
   * @returns {Promise<boolean>} true if the hold button has the disabled attribute
   */
  async isHoldButtonDisabled() {
    return this.page.locator(SELECTORS.HOLD_BUTTON).isDisabled();
  }

  /**
   * Reports whether the cart's "Proceed to Checkout" CTA is disabled. app-btn renders a native
   * <button class="btn" :disabled="isCheckoutDisabled">, so the native disabled state is the
   * source of truth (true for a look-but-not-book role — trip-cart.vue). A `.disabled`/`.is-disabled`
   * class check is kept as a fallback for deployed staging DOM that can lag the Atriis.App source.
   * @returns {Promise<boolean>}
   */
  async isProceedToCheckoutButtonDisabled() {
    const button = this.page.locator(SELECTORS.PROCEED_TO_CHECKOUT_NATIVE_BTN).first();
    await button.waitFor({ state: "visible", timeout: 15000 });
    if (await button.isDisabled()) return true;
    return button.evaluate((el) => {
      const container = el.closest(".btn-container") || el;
      return (
        el.classList.contains("disabled") ||
        el.classList.contains("is-disabled") ||
        container.classList.contains("disabled") ||
        container.classList.contains("is-disabled")
      );
    });
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
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_BUTTON).first().waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Clicks the Price Breakdown button.
   */
  async clickPriceBreakdownButton() {
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_BUTTON).first().click();
  }

  /**
   * Clicks the X button to close the Price Breakdown modal.
   */
  async clickXToClosePriceBreakdownModal() {
    await this.page.locator(SELECTORS.PRICE_BREAKDOWN_CLOSE_BUTTON).first().click();
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
   * Returns the number of traveler tabs in the meal extras panel.
   * @returns {Promise<number>}
   */
  async getMealTravelerTabCount() {
    return this.page.locator(SELECTORS.MEAL_TRAVELER_TAB).count();
  }

  /**
   * Clicks a meal traveler tab by 1-based index.
   * @param {number} tabNumber - 1-based tab index
   * @param {number} [timeout=10000]
   */
  async clickMealTravelerTabByIndex(tabNumber, timeout = 10000) {
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }
    const tab = this.page.locator(SELECTORS.MEAL_TRAVELER_TAB).nth(tabNumber - 1);
    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Opens the baggage extras panel by clicking the Edit/Add button scoped to the flight-baggage section.
   * The content timeout is deliberately separate from (and much larger than) the button timeout:
   * the panel cannot populate until the supplier's ancillary offers come back. Sabre NDC fires
   * several Get Ancillaries calls per open and is slow to settle, so this allows two minutes.
   * Callers must keep their step timeout above it (see BAGGAGE_EXTRAS_STEP_TIMEOUT_MS) or
   * cucumber's own timeout fires first and hides this error.
   * @param {number} [timeout=10000] - Timeout for the Edit/Add button to become visible
   * @param {number} [contentTimeout=120000] - Timeout for the panel content to render after the click
   */
  async clickEditBaggageExtrasButton(timeout = 10000, contentTimeout = 120000) {
    const btn = this.page.locator(SELECTORS.BAGGAGE_CLICKABLE).first();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    await this.waitForBaggageContent(contentTimeout);
  }

  /**
   * Returns true if the baggage extras panel is currently expanded.
   * @returns {Promise<boolean>}
   */
  async isBaggageExtrasOpen() {
    return this.page.locator(SELECTORS.BAGGAGE_EXTRAS_CARD).first().isVisible();
  }

  /**
   * Selects a baggage option (e.g. "Extra 5kg") for the given flight segment
   * inside the currently active passenger tab. Index 0 = outbound, 1 = inbound.
   *
   * @param {number} segmentIndex - 0-based segment index
   * @param {string} optionText - Substring to match against the dropdown option label
   * @param {number} [timeout=10000] - Per-action timeout
   */
  async selectBaggageOptionForSegment(segmentIndex, optionText, timeout = 10000) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative integer, got: ${segmentIndex}`);
    }
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('optionText must be a non-empty string');
    }

    const segment = this.page.locator(SELECTORS.BAGGAGE_SEGMENT_ROW).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });

    const trigger = segment.locator(SELECTORS.BAGGAGE_SEGMENT_SELECT_TRIGGER).first();
    await trigger.click();

    const panel = this.page.locator(SELECTORS.BAGGAGE_DROPDOWN_PANEL).last();
    await panel.waitFor({ state: 'visible', timeout });

    const option = panel
      .locator(SELECTORS.DROPDOWN_OPTION, { hasText: optionText })
      .first();
    await option.waitFor({ state: 'visible', timeout });
    await option.click();
  }

  /**
   * Clicks the first non-disabled option in the first baggage segment dropdown.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   */
  async selectFirstAvailableBaggageOption(timeout = 10000) {
    const segment = this.page.locator(SELECTORS.BAGGAGE_SEGMENT_ROW).first();
    await segment.waitFor({ state: 'visible', timeout });
    const trigger = segment.locator(SELECTORS.BAGGAGE_SEGMENT_SELECT_TRIGGER).first();
    await trigger.click();
    const firstOption = this.page.locator(`${SELECTORS.BAGGAGE_DROPDOWN_PANEL} ${SELECTORS.BAGGAGE_DROPDOWN_ENABLED_OPTION}`).first();
    await firstOption.waitFor({ state: 'visible', timeout });
    await firstOption.click();
  }

  /**
   * Selects the first paid baggage option for a given segment index.
   * Paid options are identified by containing " - " in their label (price separator).
   * Free options like "0 x hold bag" do not have this separator.
   * Waits for the dropdown to fully close after selection to avoid race conditions
   * when called multiple times in sequence (e.g. outbound then return).
   * @param {number} segmentIndex - 0-based segment index (0 = outbound, 1 = inbound)
   * @param {number} [timeout=10000] - Max wait time in ms
   */
  async selectFirstAvailableBaggageOptionForSegment(segmentIndex, timeout = 10000) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative integer, got: ${segmentIndex}`);
    }
    const segment = this.page.locator(SELECTORS.BAGGAGE_SEGMENT_ROW).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });
    const trigger = segment.locator(SELECTORS.BAGGAGE_SEGMENT_SELECT_TRIGGER).first();
    await trigger.click();
    const panel = this.page.locator(SELECTORS.BAGGAGE_DROPDOWN_PANEL).last();
    await panel.waitFor({ state: 'visible', timeout });
    // Select only PAID options — they contain " - " (price separator, e.g. "1 x hold bag (15kg) - 67.98EUR")
    const paidOption = panel.locator(SELECTORS.BAGGAGE_DROPDOWN_ENABLED_OPTION).filter({ hasText: / - / }).first();
    await paidOption.waitFor({ state: 'visible', timeout });
    await paidOption.click();
    await this.page.locator(SELECTORS.BAGGAGE_DROPDOWN_PANEL).waitFor({ state: 'hidden', timeout });
  }

  /**
   * Returns the carrier name text from the first segment in the baggage panel.
   * @returns {import('@playwright/test').Locator}
   */
  getBaggageSegmentCarrierNameLocator() {
    return this.page.locator(SELECTORS.BAGGAGE_SEGMENT_CARRIER_NAME).first();
  }

  /**
   * Waits for the Save button to be visible in extras section.
   */
  async waitForSaveButton() {
    await this.getSaveButton().waitFor({ state: 'visible' });
  }

  /**
   * Returns the extras Save button while its save request is still in flight.
   * Resolves to zero elements once the save settles, so `isVisible()` is a safe
   * "is a save still running?" probe and `waitFor({ state: 'hidden' })` is a safe wait.
   * @returns {import('@playwright/test').Locator}
   */
  getSavingExtrasButton() {
    return this.page.locator(SELECTORS.EXTRAS_SAVE_BUTTON_SAVING).filter({ hasText: 'Save' }).first();
  }

  /**
   * Waits for a just-clicked Save button's loading state to clear. Whether the button then
   * disappears entirely (panel collapses) or stays visible (panel remains open, e.g. showing
   * the newly saved entry) varies by section, so this only waits for the loading state itself —
   * not for the button to vanish — to avoid hanging on sections that keep the panel open.
   * @param {number} [timeout=15000] - Timeout for the loading state to clear
   */
  async waitForSaveButtonLoadingToClear(timeout = 15000) {
    await this.getSavingExtrasButton().waitFor({ state: 'hidden', timeout });
  }

  /**
   * Clicks the Save button in extras section. Re-queries and retries once on detachment: some
   * extras panels (e.g. rail passenger info right after a traveler was just added/removed) can
   * still be re-rendering their traveler tabs when this is called, detaching the Save button
   * mid-click (test 62001).
   */
  async clickSaveButton() {
    try {
      await this.getSaveButton().click();
    } catch (error) {
      if (!/detached|not attached/i.test(error.message || '')) {
        throw error;
      }
      await this.getSaveButton().click();
    }
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
      throw new Error(
        `Baggage extras did not open: no traveler tab, baggage dropdown, selected tag or Save button ` +
          `appeared within ${timeout}ms of the panel being clicked.`
      );
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
   * Re-opens the extras accordion after a save, only if it is not already expanded.
   * Saving an individual extra (baggage, optional services, etc.) collapses the outer
   * extras accordion back to its summary row, so this must be called before checking
   * anything inside it (e.g. a green success icon).
   *
   * Uses the `aria-expanded` attribute on the collapse header as the source of truth —
   * the arrow icon's `is-active` class (see isExtrasExpanded) can be stale immediately
   * after a save, still reporting "active" while the content is actually collapsed
   * (`aria-hidden="true"`, `display: none`).
   */
  async reopenExtrasAfterSave() {
    const header = this.page.locator(SELECTORS.EXTRAS_COLLAPSE_HEADER).first();
    const maxAttempts = 6;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isExpanded = (await header.getAttribute('aria-expanded').catch(() => null)) === 'true';
      if (isExpanded) return;

      await header.click();
      // The save request can still be settling (loading spinner) right after the save
      // button click returns; a re-render during that window can silently re-collapse
      // the accordion right after we open it. Give it a moment, then re-check.
      await this.page.waitForTimeout(1000);
    }

    throw new Error(
      `Extras accordion kept re-collapsing after save (still not expanded after ${maxAttempts} attempts).`
    );
  }

  /**
   * Waits for a green success icon to be visible inside the extras panel.
   *
   * Two independent things have to be true before the icon can even exist:
   *   1. The individual extra's save must have RESOLVED. The icon is rendered only on the
   *      collapsed summary row (extras-layout.vue, `v-if="!isOpen"`), and the panel closes
   *      itself only after the save request comes back (e.g. flight-optional-services.ts
   *      `saveServices` -> close()). While it is in flight the Save button carries
   *      `is-loading`, the panel stays open, and no icon is in the DOM at all. Sabre
   *      ancillary saves can take well over half a minute, so this is waited for
   *      explicitly rather than absorbed by short icon polls.
   *   2. The OUTER extras accordion must be expanded — saving collapses it, and it can
   *      auto-collapse again afterwards (e.g. a background quote reload), so the
   *      reopen+check cycle is retried rather than done once.
   *
   * If the save fails, the app shows an error notification and leaves the panel OPEN, so a
   * still-open panel after the save settled is reported as a save failure, not a missing icon.
   *
   * @param {() => import('@playwright/test').Locator} getIconLocator - Returns the icon locator to check
   * @param {number} [timeout=90000] - Total budget; stays under the 120s step timeout
   */
  async waitForGreenIconAfterSave(getIconLocator, timeout = 90000) {
    const deadline = Date.now() + timeout;
    const savingButton = this.getSavingExtrasButton();
    let sawSaveInFlight = false;

    while (Date.now() < deadline) {
      if (await savingButton.isVisible().catch(() => false)) {
        sawSaveInFlight = true;
        // Clamped to >= 1ms: Playwright treats a timeout of 0 as "no timeout" (waits forever).
        await savingButton
          .waitFor({ state: 'hidden', timeout: Math.max(1, deadline - Date.now()) })
          .catch(() => {});
        continue;
      }

      await this.reopenExtrasAfterSave();

      const becameVisible = await getIconLocator()
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (becameVisible) return;
    }

    const stillSaving = await savingButton.isVisible().catch(() => false);
    if (stillSaving) {
      throw new Error(
        `Green success icon never appeared: the extras save was still in flight after ${timeout}ms ` +
          `(Save button stuck in its loading state, so the panel never collapsed).`
      );
    }
    throw new Error(
      `Green success icon did not become visible within ${timeout}ms` +
        `${sawSaveInFlight ? ', although the save request had settled' : ' (no save was in flight)'}. ` +
        `If the extra's panel is still expanded, the save failed — the app leaves it open and shows an ` +
        `error notification; otherwise the icon itself is not rendering.`
    );
  }

  /**
   * Returns true when the extras collapse is currently expanded.
   * Element Plus adds `is-active` class to the arrow icon when the collapse-item is open.
   * @returns {Promise<boolean>}
   */
  async isExtrasExpanded() {
    const arrow = this.page.locator(SELECTORS.EXTRAS_ARROW_BUTTON).first();
    const classAttr = await arrow.getAttribute('class').catch(() => '');
    return classAttr.includes('is-active');
  }

  /**
   * Expands the extras collapse only if it is not already expanded.
   * Unlike clickArrowButtonExtras (a plain toggle), this is idempotent and safe to call
   * regardless of the panel's current state.
   */
  async ensureExtrasExpanded() {
    if (!(await this.isExtrasExpanded())) {
      await this.clickArrowButtonExtras();
    }
  }

  /**
   * Checks whether the passenger info section is visible in the extras panel.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isPassengerInfoSectionVisible(timeout = 5000) {
    return this.page.locator(SELECTORS.PASSENGER_INFO_SECTION)
      .first()
      .isVisible({ timeout })
      .catch(() => false);
  }

  /**
   * Checks whether an extras section with the given card-title text is visible.
   * @param {string} sectionName - Display text of the section title (e.g. "Frequent Flyer", "Seating")
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isExtrasSectionVisibleByName(sectionName, timeout = 10000) {
    if (!sectionName) throw new Error('sectionName is required');
    const locator = this.page.locator(SELECTORS.EXTRAS_SECTION_CARD_TITLE, { hasText: sectionName }).first();
    return locator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Returns the count of visible extras-layout sections in the extras panel.
   * @returns {Promise<number>}
   */
  async getVisibleExtrasSectionsCount() {
    return this.page.locator(SELECTORS.EXTRAS_SECTION_ITEM).count();
  }

  /**
   * Fills every mandatory row currently shown in the UK Rail (Evolvi) cart "Extras" panel
   * (ADO #81973) — e.g. "Delivery Method" (always present), and, only when a non-cheapest fare
   * was selected, "Reason for Non Lowest Fare" and a fare-flexibility dropdown. Which mandatory
   * rows exist depends on the fare actually selected upstream, so rows are discovered live rather
   * than hardcoded: each mandatory row (`.card-title` prefixed with the danger asterisk) is opened
   * via its Add/Edit trigger, then:
   *   - if it renders a radio group, the first option is selected (the specific choice is not
   *     asserted — mirrors selectFirstOOPJustificationOptionAndSave: the flow only needs A valid
   *     option selected so checkout can proceed);
   *   - otherwise it is treated as a dropdown and `dropdownOptionName` is selected if offered,
   *     else the first available option (see records/81973_1.js for the recorded "Need More
   *     Flexible Ticket" selection).
   * Stops once no mandatory rows remain.
   *
   * @param {string} [dropdownOptionName="Need More Flexible Ticket"]
   * @param {{maxIterations?: number}} [options]
   * @returns {Promise<{fieldsFilled: number}>}
   */
  async fillAllMandatoryEvolviExtras(dropdownOptionName = "Need More Flexible Ticket", { maxIterations = 8 } = {}) {
    // The cart's "Extras" panel loads asynchronously after the quote card itself renders (it
    // fetches which fields are mandatory for the selected fare), so wait for the panel container
    // before looking for individual mandatory rows — otherwise the very first check below can
    // run before the panel exists at all and wrongly conclude there is nothing to fill.
    await this.page.locator(SELECTORS.EVOLVI_EXTRAS_PANEL).first().waitFor({ state: "visible", timeout: 20000 });

    for (let i = 0; i < maxIterations; i++) {
      const mandatoryRow = this.page.locator(SELECTORS.EVOLVI_MANDATORY_EXTRAS_ROW).first();
      const isPresent = await mandatoryRow
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (!isPresent) {
        return { fieldsFilled: i };
      }

      // Recorded before opening the row, so the save below can be confirmed against the row it
      // actually belongs to — see the _waitForEvolviExtrasRowToClear call at the end of the loop.
      const rowTitle = await this._readEvolviExtrasRowTitle(mandatoryRow);

      const editButton = mandatoryRow.locator(SELECTORS.EDIT_EXTRAS_BUTTON).first();
      await editButton.click();

      // Search the whole (visible) panel — not `mandatoryRow` — for the now-expanded edit UI:
      // once a row expands, its `.card-title` drops the mandatory asterisk span (confirmed live),
      // so the `mandatoryRow` locator — which matches on that asterisk — can stop resolving to
      // this same element the moment it expands. The panel-wide locator stays valid regardless,
      // and relying on only one field being expanded for edit at a time is safe here.
      const panel = this.page.locator(SELECTORS.EVOLVI_EXTRAS_PANEL_VISIBLE).first();

      // NOTE: `.isVisible()` is a one-shot check (no auto-retry), unlike `.waitFor()`, which polls
      // until the timeout elapses — required here since the radio group/dropdown renders
      // asynchronously right after the click above.
      const radioOption = panel.locator(SELECTORS.EVOLVI_EXTRAS_VISIBLE_RADIO_OPTION).first();
      const hasRadio = await radioOption
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);

      if (hasRadio) {
        await radioOption.click();
      } else {
        // Dropdown-style field (e.g. the fare-flexibility "Extras" option) — open it and pick the
        // requested option if offered, else the first available one.
        const dropdownIcon = panel.getByRole("img").first();
        await dropdownIcon.waitFor({ state: "visible", timeout: 8000 });
        await dropdownIcon.click();

        const namedOption = this.page.getByRole("option", { name: dropdownOptionName });
        const hasNamedOption = await namedOption
          .waitFor({ state: "visible", timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (hasNamedOption) {
          await namedOption.click();
        } else {
          await this.page.getByRole("option").first().click();
        }
      }

      const saveButton = panel.getByRole("button", { name: "Save" }).first();
      await saveButton.click();

      // The Save button hides only once the row has actually been persisted server-side —
      // same signal (and same reason) as CartPage.waitForSaveJustificationButtonHidden for the
      // OOP-justification flow. The row's own mandatory asterisk/"Add" label can disappear
      // optimistically before that persistence finishes, so waiting on it instead (or on a
      // fixed delay) can let the next iteration — or the caller's checkout click — run before
      // the cart has actually finished re-validating.
      //
      // The ceiling is generous because how long the save takes depends on WHICH row it is: the
      // Delivery Method row persists a local choice, but the Seating row reserves the seat with the
      // supplier, and that round trip was observed still spinning (`btn.is-loading`) past 10s on a
      // one-way Evolvi quote (test 64936).
      await saveButton.waitFor({ state: "hidden", timeout: EVOLVI_EXTRAS_SAVE_TIMEOUT_MS });

      // The Save button hiding is NOT the row leaving the mandatory set: the row's own asterisk and
      // its "Add" -> "Edit" flip land one cart re-validation later. Without waiting for that, the
      // next iteration re-resolves EVOLVI_MANDATORY_EXTRAS_ROW to the row just saved and fills it a
      // second time — two iterations per field, so a quote with 3 mandatory rows needed 6 and blew
      // the cap (observed live on a SplitTix quote: Delivery Method, Seating, Reason for Non Lowest).
      await this._waitForEvolviExtrasRowToClear(rowTitle);
    }

    throw new Error(
      `[CartPage.fillAllMandatoryEvolviExtras] Exceeded ${maxIterations} iterations filling mandatory Evolvi extras rows — ` +
      "either the panel keeps re-adding rows or a row failed to save."
    );
  }

  /**
   * Reads an extras row's card title, normalized and without the leading mandatory asterisk.
   * Returns '' when the title cannot be read, which callers treat as "cannot track this row".
   * @param {import('playwright').Locator} row
   * @returns {Promise<string>}
   */
  async _readEvolviExtrasRowTitle(row) {
    const title = await row
      .locator(SELECTORS.EVOLVI_EXTRAS_ROW_TITLE)
      .first()
      .innerText()
      .catch(() => "");
    return title.replace(/\s+/g, " ").replace(/^\*\s*/, "").trim();
  }

  // ===== ONE NAMED UK RAIL (EVOLVI) EXTRAS ROW (test 62132) =====

  /**
   * The single UK Rail extras row whose heading is `sectionName`, e.g. "Delivery Method".
   *
   * Anchored on the row's own `.card-title`, which is why it keeps resolving to the same row after
   * the row is expanded (see the EVOLVI_EXTRAS_ROW comment). Matching is a substring, so a feature
   * can name a row the way the UI labels it without repeating any surrounding markup.
   *
   * @param {string} sectionName - Row heading as rendered, e.g. "Seating"
   * @returns {import('playwright').Locator}
   */
  evolviExtrasRowByName(sectionName) {
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[CartPage.evolviExtrasRowByName] "sectionName" must be a non-empty string, got: ${JSON.stringify(sectionName)}`
      );
    }
    return this.page
      .locator(SELECTORS.EVOLVI_EXTRAS_ROW)
      .filter({ has: this.page.locator(SELECTORS.EVOLVI_EXTRAS_ROW_TITLE, { hasText: sectionName }) })
      .first();
  }

  /**
   * Waits for the UK Rail extras panel, then for the named row inside it to render.
   *
   * The panel is fetched after the quote card itself (it asks the server which fields are mandatory
   * for the selected fare) and extras-collapse.ts only opens the accordion for a Selected quote or
   * on an `extrasValidationsError` event, so a row read before that lands is a false negative —
   * the same reason fillAllMandatoryEvolviExtras waits on the panel first.
   *
   * @param {string} sectionName
   * @param {number} [timeout=20000]
   * @returns {Promise<import('playwright').Locator>} The row locator, once visible
   */
  async waitForEvolviExtrasRow(sectionName, timeout = 20000) {
    await this.page.locator(SELECTORS.EVOLVI_EXTRAS_PANEL).first().waitFor({ state: 'visible', timeout });
    const row = this.evolviExtrasRowByName(sectionName);
    await row.waitFor({ state: 'visible', timeout });
    return row;
  }

  /**
   * Reads whether the named extras row is drawn in its invalid-and-checkout-attempted state: the red
   * `error-border` on its summary line, and the mandatory asterisk in its heading.
   *
   * Both halves are returned so the caller can say WHICH one is missing — the border is gated on
   * isCheckoutActivated, so its absence usually means checkout was never clicked rather than that
   * the row is valid.
   *
   * @param {string} sectionName
   * @param {number} [timeout=15000]
   * @returns {Promise<{isHighlighted: boolean, hasAsterisk: boolean, asteriskText: string}>}
   */
  async getEvolviExtrasRowRequiredState(sectionName, timeout = 15000) {
    const row = await this.waitForEvolviExtrasRow(sectionName, timeout);

    // Polled rather than read once: the border is painted by the render pass that follows the
    // checkout click. The asterisk is there from first paint, so it needs no wait of its own.
    const isHighlighted = await row
      .locator(SELECTORS.EVOLVI_EXTRAS_ROW_SUMMARY_HIGHLIGHTED)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    const asterisk = row.locator(SELECTORS.EVOLVI_EXTRAS_ROW_ASTERISK).first();
    const hasAsterisk = await asterisk.isVisible().catch(() => false);
    const asteriskText = hasAsterisk ? (await asterisk.innerText().catch(() => '')).trim() : '';

    return { isHighlighted, hasAsterisk, asteriskText };
  }

  /**
   * Whether the named extras row shows its green `check_circle` — the app's own "saved and valid"
   * marker (`isValid && hasValue` in extras-layout.vue).
   *
   * @param {string} sectionName
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>}
   */
  async hasEvolviExtrasRowGreenCheck(sectionName, timeout = 15000) {
    const row = await this.waitForEvolviExtrasRow(sectionName, timeout);
    return row
      .locator(SELECTORS.EVOLVI_EXTRAS_ROW_GREEN_CHECK)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Fills and saves ONE named UK Rail extras row, then waits for the app to confirm it.
   *
   * The filling rule is deliberately the same as fillAllMandatoryEvolviExtras' — the first radio
   * option if the row renders a radio group, else the requested dropdown option or the first one
   * offered — because 62132 only needs each mandatory row to hold A valid value before checkout;
   * which value it holds is not what the test is about. The difference is scope: every locator here
   * is rooted on the row that was asked for, so being handed "Seating" and filling "Delivery
   * Method" instead is not a thing that can happen.
   *
   * A row already showing its green check is left untouched and reported as such — re-opening and
   * re-saving a saved row is how the generic filler used to burn two iterations per field.
   *
   * @param {string} sectionName - Row heading, e.g. "Reason for Non Lowest"
   * @param {{dropdownOptionName?: string}} [options]
   * @returns {Promise<{alreadyFilled: boolean, widget: 'radio'|'dropdown'|'none'}>}
   */
  async fillEvolviExtrasRowByName(sectionName, { dropdownOptionName } = {}) {
    const row = await this.waitForEvolviExtrasRow(sectionName);

    const greenCheck = row.locator(SELECTORS.EVOLVI_EXTRAS_ROW_GREEN_CHECK).first();
    if (await greenCheck.isVisible().catch(() => false)) {
      return { alreadyFilled: true, widget: 'none' };
    }

    await row.locator(SELECTORS.EVOLVI_EXTRAS_ROW_OPEN_BUTTON).first().click();

    // The widget renders asynchronously after the row expands (each component fetches its own
    // options), so this has to be a polling waitFor and not a one-shot isVisible().
    const radioOption = row.locator(SELECTORS.EVOLVI_EXTRAS_ROW_RADIO_OPTION).first();
    const hasRadio = await radioOption
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    let widget;
    if (hasRadio) {
      widget = 'radio';
      await radioOption.click();
    } else {
      widget = 'dropdown';
      const dropdown = row.locator(SELECTORS.EVOLVI_EXTRAS_ROW_DROPDOWN).first();
      await dropdown.waitFor({ state: 'visible', timeout: 15000 });
      await dropdown.click();

      // The options render in an el-select-dropdown teleported to <body>, so they are NOT inside
      // `row` and have to be read off the page. Only one dropdown is ever open at a time here.
      let option = null;
      if (dropdownOptionName) {
        const named = this.page.getByRole('option', { name: dropdownOptionName }).first();
        const hasNamed = await named
          .waitFor({ state: 'visible', timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (hasNamed) option = named;
      }
      if (!option) option = this.page.getByRole('option').first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
    }

    const saveButton = row.getByRole('button', { name: 'Save' }).first();
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();

    // Save hides only once the row has actually persisted server-side — the same signal, and the
    // same generous ceiling, as fillAllMandatoryEvolviExtras: Delivery Method persists a local
    // choice, but Seating reserves the seat with the supplier and was observed still spinning past
    // 10s on a one-way Evolvi quote (test 64936).
    await saveButton.waitFor({ state: 'hidden', timeout: EVOLVI_EXTRAS_SAVE_TIMEOUT_MS });

    // Save hiding is not the same as the row being accepted: the green check lands one cart
    // re-validation later. Waiting for it here is what lets the caller treat a returned value as
    // "the row is filled" — and it is the exact marker 62132 asserts afterwards.
    await row
      .locator(SELECTORS.EVOLVI_EXTRAS_ROW_GREEN_CHECK)
      .first()
      .waitFor({ state: 'visible', timeout: EVOLVI_EXTRAS_SAVE_TIMEOUT_MS });

    return { alreadyFilled: false, widget };
  }

  /**
   * Waits until the named row is no longer the first outstanding mandatory extras row — i.e. the
   * cart has finished re-validating the save and moved on to the next field (or none remain).
   *
   * Deliberately does NOT throw on timeout: if a row genuinely fails to clear, the caller's loop
   * re-opens and re-saves it exactly as it did before this wait existed, so a slow or unusual panel
   * degrades to the old behaviour instead of failing a scenario that used to pass.
   *
   * @param {string} rowTitle - Title of the row just saved, as returned by _readEvolviExtrasRowTitle
   * @param {number} [timeout=15000]
   * @returns {Promise<boolean>} Whether the row cleared within the timeout
   */
  async _waitForEvolviExtrasRowToClear(rowTitle, timeout = 15000) {
    if (!rowTitle) return false;

    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const firstMandatory = this.page.locator(SELECTORS.EVOLVI_MANDATORY_EXTRAS_ROW).first();
      if ((await firstMandatory.count()) === 0) return true;
      if ((await this._readEvolviExtrasRowTitle(firstMandatory)) !== rowTitle) return true;
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  /**
   * Whether a "More details" trigger is visible on the current cart / trip overview.
   * @param {number} [timeout=60000]
   * @returns {Promise<boolean>}
   */
  async isMoreDetailsLinkVisible(timeout = 60000) {
    return this.page
      .locator(SELECTORS.MORE_DETAILS_BUTTON_ANY_VISIBLE)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Checks whether the passenger info section has the required asterisk indicator.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isPassengerInfoMarkedAsRequired(timeout = 10000) {
    const asterisk = this.page.locator(SELECTORS.PASSENGER_INFO_REQUIRED_ASTERISK).first();
    return asterisk.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Checks whether the Passenger Info extras row carries the red error border shown after a
   * blocked checkout attempt.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isPassengerInfoHighlightedInRed(timeout = 15000) {
    const border = this.page.locator(SELECTORS.PASSENGER_INFO_ERROR_BORDER).first();
    return border.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Checks whether the Date of Birth field is highlighted as required (has is-danger class).
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isDateOfBirthFieldRequired(timeout = 10000) {
    const dobField = this.page.locator(SELECTORS.PASSENGER_INFO_DOB_FIELD).first();
    await dobField.waitFor({ state: 'visible', timeout });
    const datepicker = this.page.locator(SELECTORS.PASSENGER_INFO_DOB_DATEPICKER).first();
    const classes = await datepicker.getAttribute('class');
    return (classes || '').split(/\s+/).includes('is-danger');
  }

  /**
   * Fills a valid date in the passenger info Date of Birth field.
   * Uses the input directly with a formatted date string.
   * @param {string} dateValue - Date in "DD MMM YYYY" format (e.g. "15 Jan 1990"). Defaults to "15 Jan 1990".
   * @param {number} timeout
   */
  async fillPassengerInfoDateOfBirth(dateValue = '15 Jan 1990', timeout = 10000) {
    const dobInput = this.page.locator(SELECTORS.PASSENGER_INFO_DOB_INPUT).first();
    await dobInput.waitFor({ state: 'visible', timeout });
    await dobInput.click();
    await dobInput.fill(dateValue);
    await dobInput.press('Enter');
  }

  /**
   * Counts the number of fields highlighted with is-danger inside the passenger info section.
   * @returns {Promise<number>}
   */
  async getHighlightedFieldsCountInPassengerInfo() {
    return this.page.locator(`${SELECTORS.PASSENGER_INFO_SECTION} .is-danger`).count();
  }

  /**
   * Counts the number of visible form fields in the passenger info panel.
   * @returns {Promise<number>}
   */
  async getEditableFieldsCountInPassengerInfo() {
    return this.page.locator(SELECTORS.PASSENGER_INFO_EDITABLE_FIELD).count();
  }

  /**
   * Fills the passport number field in the passenger info section.
   * @param {string} value - The passport number to enter
   * @param {number} timeout
   */
  async fillPassportNumber(value, timeout = 10000) {
    if (!value || typeof value !== 'string') throw new Error('value must be a non-empty string');
    const input = this.page.locator(SELECTORS.PASSPORT_NUMBER_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.click();
    await input.fill(value);
  }

  /**
   * Selects a country in the applicable country dropdown inside the passenger info section.
   * Uses the filterable app-select pattern: click to open, type to filter, select option.
   * @param {string} country - Country name to search and select
   * @param {number} timeout
   */
  async fillApplicableCountry(country, timeout = 10000) {
    if (!country || typeof country !== 'string') throw new Error('country must be a non-empty string');
    const select = this.page.locator(SELECTORS.PASSENGER_INFO_APPLICABLE_COUNTRY_SELECT).first();
    await select.waitFor({ state: 'visible', timeout });
    await select.click();

    const input = this.page.locator(SELECTORS.PASSENGER_INFO_APPLICABLE_COUNTRY_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.fill(country);

    const option = this.page.locator('.el-select-dropdown__item:visible').filter({ hasText: new RegExp(country, 'i') }).first();
    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch {
      await input.press('ArrowDown');
      await input.press('Enter');
    }
  }

  /**
   * Selects a nationality in the nationality dropdown inside the passenger info section.
   * @param {string} nationality - Nationality name to search and select
   * @param {number} timeout
   */
  async fillNationality(nationality, timeout = 10000) {
    if (!nationality || typeof nationality !== 'string') throw new Error('nationality must be a non-empty string');
    const select = this.page.locator(SELECTORS.PASSENGER_INFO_NATIONALITY_SELECT).first();
    await select.waitFor({ state: 'visible', timeout });
    await select.click();

    const input = this.page.locator(SELECTORS.PASSENGER_INFO_NATIONALITY_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.fill(nationality);

    const option = this.page.locator('.el-select-dropdown__item:visible').filter({ hasText: new RegExp(nationality, 'i') }).first();
    try {
      await option.waitFor({ state: 'visible', timeout: 5000 });
      await option.click();
    } catch {
      await input.press('ArrowDown');
      await input.press('Enter');
    }
  }

  /**
   * Fills a future date in the passport expiry date field inside the passenger info section.
   * @param {string} dateValue - Date in "DD MMM YYYY" format. Defaults to a future date.
   * @param {number} timeout
   */
  async fillPassportExpiryDate(dateValue = '15 Jan 2030', timeout = 10000) {
    const input = this.page.locator(SELECTORS.PASSENGER_INFO_EXPIRY_DATE_INPUT).first();
    await input.waitFor({ state: 'visible', timeout });
    await input.click();
    await input.fill(dateValue);
    await input.press('Enter');
  }

  /**
   * Returns the Optional Services title locator (flight-optional-services.vue).
   * @returns {import('@playwright/test').Locator}
   */
  getOptionalServicesTitleLocator() {
    return this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_TITLE).first();
  }

  /**
   * Opens the optional services extras panel by clicking the Edit/Add button scoped to the flight-optional-services section.
   */
  async clickEditOptionalServicesButton() {
    const btn = this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_EDIT_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Returns the locator for the message text inside the expanded optional services content.
   * @returns {import('@playwright/test').Locator}
   */
  getOptionalServicesMessageLocator() {
    return this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_MESSAGE).first();
  }

  /**
   * Returns the locator for an optional service option whose title contains the given text.
   * @param {string} optionText - Substring to match within the option title (e.g. "Golf Bag")
   * @returns {import('@playwright/test').Locator}
   */
  getOptionalServicesOptionByText(optionText) {
    return this.page
      .locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_OPTION_TITLE)
      .filter({ hasText: optionText })
      .first();
  }

  /**
   * Returns the locator for all selectable (non-disabled) optional service checkboxes
   * inside the expanded optional services panel.
   * @returns {import('@playwright/test').Locator}
   */
  getOptionalServicesCheckboxes() {
    return this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_OPTION_CHECKBOX);
  }

  /**
   * Clicks a random selectable optional service checkbox in the expanded optional services panel.
   * @returns {Promise<number>} The index of the option that was clicked
   */
  async selectRandomOptionalService() {
    const checkboxes = this.getOptionalServicesCheckboxes();
    await checkboxes.first().waitFor({ state: 'visible', timeout: 15000 });

    const count = await checkboxes.count();
    if (count === 0) {
      throw new Error('No selectable optional service checkboxes found');
    }

    const randomIndex = Math.floor(Math.random() * count);
    await checkboxes.nth(randomIndex).click();
    return randomIndex;
  }

  /**
   * Selects the optional service whose row contains the given text.
   * Matching is case-insensitive, so the supplier's raw service name
   * ("PRIORITY FAST SECURITY LANE") matches the label as the app renders it.
   * @param {string} optionText - Substring of the service name (e.g. "Priority fast security lane")
   * @param {number} [timeout=15000] - Max wait for the options to render
   * @returns {Promise<string>} The option text that was selected
   */
  async selectOptionalServiceByText(optionText, timeout = 15000) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error('optionText must be a non-empty string');
    }
    return this.selectOneOfOptionalServices([optionText], timeout);
  }

  /**
   * Selects ONE of the given optional services, chosen at random, so consecutive runs
   * exercise different services instead of always the same one.
   * The candidates are tried in random order and the first one actually present and
   * selectable wins — a service missing from this particular offer is skipped rather
   * than failing the run, and only an offer carrying none of them is an error.
   * @param {string[]} optionTexts - Candidate service names (substring match, case-insensitive)
   * @param {number} [timeout=15000] - Max wait for the options to render
   * @returns {Promise<string>} The candidate that was selected
   */
  async selectOneOfOptionalServices(optionTexts, timeout = 15000) {
    if (!Array.isArray(optionTexts) || optionTexts.length === 0) {
      throw new Error('optionTexts must be a non-empty array of service names');
    }

    const rows = this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_OPTION_ROW);
    await rows.first().waitFor({ state: 'visible', timeout });

    const shuffled = [...optionTexts].sort(() => Math.random() - 0.5);
    for (const optionText of shuffled) {
      const checkbox = rows
        .filter({ hasText: optionText })
        .first()
        .locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_ROW_CHECKBOX);
      if ((await checkbox.count()) > 0) {
        await checkbox.first().click();
        return optionText;
      }
    }

    const available = await this.page
      .locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_OPTION_TITLE)
      .allInnerTexts();
    throw new Error(
      `No selectable optional service matching any of ${optionTexts.map((t) => `"${t}"`).join(', ')}. ` +
        `Available options: ${available.map((title) => `"${title.trim()}"`).join(', ')}`
    );
  }

  /**
   * Gets the optional services green success icon locator.
   * Used to verify the optional service selection was successfully saved.
   * @returns {Locator} Playwright locator for the optional services success icon
   */
  getOptionalServicesGreenIcon() {
    return this.page.locator(SELECTORS.FLIGHT_OPTIONAL_SERVICES_SUCCESS_ICON).first();
  }

  // --- Ancillary Services (flight-ancillary-services.vue) ---

  getAncillaryServicesEditButtonLocator() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_EDIT_BUTTON).first();
  }

  async clickEditAncillaryServicesButton(timeout = 15000) {
    const btn = this.getAncillaryServicesEditButtonLocator();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
  }

  getAncillaryServicesCarrierNameLocator() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_CARRIER_NAME).first();
  }

  async openAncillaryServicesDropdown(timeout = 15000) {
    const trigger = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SELECT_TRIGGER).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.click();
    const panel = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL).last();
    await panel.waitFor({ state: 'visible', timeout });
  }

  async getAncillaryServiceOptionTexts(timeout = 10000) {
    const options = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_OPTION);
    await options.first().waitFor({ state: 'visible', timeout });
    return options.allTextContents();
  }

  async selectAncillaryServiceOptionByText(text, timeout = 10000) {
    const option = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_OPTION, { hasText: text }).first();
    await option.waitFor({ state: 'visible', timeout });
    await option.click();
  }

  async openAncillaryServicesDropdownBySegment(segmentIndex, timeout = 15000) {
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }
    // Ensure any previously open dropdown is closed before opening a new one
    const existingPanel = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL);
    const panelVisible = await existingPanel.last().isVisible().catch(() => false);
    if (panelVisible) {
      await this.page.keyboard.press('Escape');
      await existingPanel.last().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    const segment = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });
    const trigger = segment.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT_SELECT_TRIGGER).first();
    await trigger.click();
    const panel = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL).last();
    await panel.waitFor({ state: 'visible', timeout });
  }

  async getAncillaryServicesSelectedTextBySegment(segmentIndex, timeout = 10000) {
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }
    const segment = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });
    const wrapper = segment.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT_SELECT_TRIGGER).first();
    const text = await wrapper.innerText().catch(() => '');
    return text.trim();
  }

  getAncillaryServicesSuccessIcon() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SUCCESS_ICON).first();
  }

  /**
   * Returns the locator for the ancillary options edit/add button (visibility test before expand).
   */
  getAncillaryOptionsEditButtonLocator() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_OPTIONS_EDIT_BUTTON).first();
  }

  /**
   * Returns the locator for the "Ancillary Options" card title. Visible whenever the
   * flight-ancillary-options section is present in the DOM AND the parent extras collapse is open.
   */
  getAncillaryOptionsCardTitleLocator() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_OPTIONS_CARD_TITLE).first();
  }

  /**
   * Clicks the edit/add button for the ancillary options section to expand it.
   * @param {number} [timeout=15000] - Per-action timeout in ms
   */
  async clickEditAncillaryOptionsButton(timeout = 15000) {
    const btn = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_OPTIONS_EDIT_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
  }

  /**
   * Opens the ancillary options dropdown by clicking its select trigger and waits for the panel.
   * @param {number} [timeout=15000] - Per-action timeout in ms
   */
  async openAncillaryOptionsDropdown(timeout = 15000) {
    const trigger = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_OPTIONS_SELECT_TRIGGER).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.click();
    await this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Selects the first option in the currently visible Element-Plus dropdown panel.
   * Assumes the dropdown is already open.
   * @param {number} [timeout=10000] - Per-action timeout in ms
   */
  async selectFirstAncillaryOption(timeout = 10000) {
    const firstOption = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_OPTION).first();
    await firstOption.waitFor({ state: 'visible', timeout });
    await firstOption.click();
  }

  /**
   * Returns the locator for the ancillary options green filled indicator (post-save).
   */
  getAncillaryOptionsFilledIndicator() {
    return this.page.locator(SELECTORS.FLIGHT_ANCILLARY_OPTIONS_FILLED_INDICATOR).first();
  }

  /**
   * Clicks an ancillary-services traveler tab by 1-based index as shown in the UI.
   * Used for multi-pax bookings where each traveler has their own tab.
   *
   * @param {number} tabNumber - 1-based tab position
   * @param {number} [timeout=15000] - Per-action timeout in ms
   */
  async clickAncillaryServicesTravelerTabByIndex(tabNumber, timeout = 15000) {
    if (!Number.isInteger(tabNumber) || tabNumber < 1) {
      throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
    }

    const tab = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_TRAVELER_TAB).nth(tabNumber - 1);
    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Opens the ancillary-services dropdown for the given segment inside the
   * currently active traveler tab. Index 0 = outbound, 1 = inbound.
   *
   * @param {number} segmentIndex - 0-based segment index
   * @param {number} [timeout=15000] - Per-action timeout in ms
   */
  async openAncillaryServicesDropdownBySegmentForActiveTraveler(segmentIndex, timeout = 15000) {
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }
    const existingPanel = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL);
    const panelVisible = await existingPanel.last().isVisible().catch(() => false);
    if (panelVisible) {
      await this.page.keyboard.press('Escape');
      await existingPanel.last().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    const segment = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_VISIBLE_SEGMENT).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });
    const trigger = segment.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT_SELECT_TRIGGER).first();
    await trigger.click();
    const panel = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_DROPDOWN_PANEL).last();
    await panel.waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the currently selected ancillary-service option text for the given
   * segment inside the active traveler tab.
   *
   * @param {number} segmentIndex - 0-based segment index
   * @param {number} [timeout=10000] - Per-action timeout in ms
   * @returns {Promise<string>}
   */
  async getAncillaryServicesSelectedTextBySegmentForActiveTraveler(segmentIndex, timeout = 10000) {
    if (typeof segmentIndex !== 'number' || segmentIndex < 0) {
      throw new Error(`segmentIndex must be a non-negative number, got: ${segmentIndex}`);
    }
    const segment = this.page.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_VISIBLE_SEGMENT).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout });
    const wrapper = segment.locator(SELECTORS.FLIGHT_ANCILLARY_SERVICES_SEGMENT_SELECT_TRIGGER).first();
    const text = await wrapper.innerText().catch(() => '');
    return text.trim();
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
   * Reads the mandatory-seat error text shown in the seat map drawer when not
   * all travelers have a seat assigned (e.g. "Airline requires seat reservation
   * for all passengers").
   * @param {number} timeout
   * @returns {Promise<string>} The error text
   */
  async getMandatorySeatErrorText(timeout = 15000) {
    const errorElement = this.page.locator(SELECTORS.MANDATORY_SEAT_ERROR).first();
    await errorElement.waitFor({ state: 'visible', timeout });
    return (await errorElement.innerText()).trim();
  }

  /**
   * Reads the seat status text for a given traveler (1-based) in the seating
   * extras panel — used to verify "Pending confirmation" after seat selection.
   * @param {number} travelerIndex - 1-based traveler index
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async getSeatStatusForTraveler(travelerIndex, timeout = 15000) {
    if (!Number.isInteger(travelerIndex) || travelerIndex < 1) {
      throw new Error(`travelerIndex must be an integer >= 1, got: ${travelerIndex}`);
    }
    const statusElement = this.page
      .locator(SELECTORS.SEAT_STATUS_TEXT)
      .nth(travelerIndex - 1);
    await statusElement.waitFor({ state: 'visible', timeout });
    return (await statusElement.innerText()).trim();
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
   * Clicks the 'Save And Close' button in the seat map drawer and waits for the drawer
   * to close. The drawer stays open behind a loading mask while the seats are saved and
   * the quotes reload, so returning on the bare click leaves the next action racing that
   * overlay (flight-deck.ts → handleSeatsSelection emits reloadQuotes + closeDrawer).
   * @param {number} timeout - Max wait time for the drawer to close in ms (default: 30000)
   */
  async saveAndCloseSeatMapDrawer(timeout = 30000) {
    const btn = this.page.locator(SELECTORS.SEAT_MAP_SAVE_CLOSE_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();

    await this.page
      .locator(SELECTORS.SEAT_MAP_DRAWER)
      .first()
      .waitFor({ state: 'hidden', timeout });
  }

  /**
   * Hovers over a preferred + extra legroom seat that has a price symbol in its inner span.
   * Uses Playwright's hover to trigger the Element Plus tooltip.
   * @returns {Promise<boolean>} true if a seat was hovered, false if none found
   */
  async hoverPreferredExtraLegroomSeat() {
    const seats = this.page.locator(SELECTORS.PREFERRED_EXTRA_LEGROOM_SEAT);
    const count = await seats.count();

    for (let i = 0; i < count; i++) {
      const seat = seats.nth(i);
      const spanText = await seat.locator('span').first().textContent().catch(() => '');
      if (/[$€£]/.test(spanText)) {
        await seat.scrollIntoViewIfNeeded();
        await seat.hover();
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the text content of the currently visible seat tooltip.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} The full tooltip text
   */
  async getVisibleSeatTooltipText({ timeout = 10000 } = {}) {
    const tooltip = this.page.locator(SELECTORS.SEAT_TOOLTIP_VISIBLE).first();
    await tooltip.waitFor({ state: 'visible', timeout });
    return (await tooltip.innerText()).trim();
  }

  /**
   * Gets the cart grand total price from the trip summary sidebar.
   * Uses the .price-total .amount selector from trip-summary.vue.
   *
   * Note: trip-summary.vue drops Expired/Cancelled/Ticketed flight, car and hotel quotes
   * from `quotesToDisplay`, and renders nothing at all when that list is empty. So once a
   * trip is fully ticketed the sidebar — and this total — no longer exists. Callers that
   * read the total after booking should pass a short timeout and treat a rejection as
   * "no sidebar" rather than a failure.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Max wait for the total to become visible
   * @returns {Promise<number|null>} The total price as a numeric value
   */
  async getCartTotalPrice({ timeout = 15000 } = {}) {
    const totalEl = this.page.locator(SELECTORS.CART_TOTAL_PRICE).first();
    await totalEl.waitFor({ state: 'visible', timeout });
    const text = (await totalEl.innerText()).trim();
    if (!text) return null;
    return parseAmountText(text, 'cart total price');
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
   * Waits for the timed quote badge to be visible in the cart.
   * The badge appears on quotes with a limited time window (e.g. NDC IB).
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Max wait time in ms
   */
  async waitForTimedQuoteBadge({ timeout = 30000 } = {}) {
    await this.page
      .locator(SELECTORS.TIMED_QUOTE_BADGE)
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Hovers the timed quote badge (the countdown clock) to reveal its tooltip.
   */
  async hoverTimedQuoteBadge() {
    await this.page.locator(SELECTORS.TIMED_QUOTE_BADGE).first().hover();
  }

  /**
   * Reads the live countdown rendered inside the timed quote badge — the countdown clock itself,
   * which needs no hover (the tooltip states the static hold window instead).
   *
   * The raw text is returned rather than a parsed time so the caller can tell a running countdown
   * ("59:47") from the expired state ("Expired"): app-timed-quote.vue renders both through the
   * same span, so their text is the only thing that distinguishes them.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - Max wait time in ms for the badge to appear
   * @returns {Promise<string>} The badge countdown text with whitespace normalized
   */
  async getTimedQuoteBadgeCountdownText({ timeout = 30000 } = {}) {
    const countdown = this.page.locator(SELECTORS.TIMED_QUOTE_BADGE_COUNTDOWN).first();
    await countdown.waitFor({ state: 'visible', timeout });
    const text = await countdown.textContent();
    return (text ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Reads the timed quote tooltip message revealed by hovering the badge.
   *
   * The message is assembled from three i18n parts around a bold countdown span
   * (app-timed-quote.vue), so the raw text content carries the template's newlines and
   * indentation. Whitespace is collapsed to a single space so the result compares against
   * the message as a reader sees it.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Max wait time in ms for the tooltip to appear
   * @returns {Promise<string>} The tooltip message with whitespace normalized
   */
  async getTimedQuoteTooltipMessage({ timeout = 15000 } = {}) {
    const message = this.page.locator(SELECTORS.TIMED_QUOTE_TOOLTIP_MESSAGE).first();
    await message.waitFor({ state: 'visible', timeout });
    const text = await message.textContent();
    return (text ?? '').replace(/\s+/g, ' ').trim();
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
   * Selects a delivery method by its queue name.
   *
   * Each radio's label is the backend's `deliveryMethod.queueName`
   * (uk-rail-delivery-method.vue's v-for over deliveryMethodsToShow), so the option is matched on
   * that text rather than on a position: the queues are corporation configuration and their order
   * is not guaranteed. Matching is a case-insensitive substring, because the default option's
   * label also carries a " (Default)" suffix and a TOD option appends its station name.
   *
   * @param {string} queueName - Queue name or a distinctive part of it, e.g. "eTicket Queue"
   * @returns {Promise<string>} The full label of the option that was selected
   */
  async selectDeliveryMethodByName(queueName) {
    const options = this.page.locator(SELECTORS.DELIVERY_METHOD_OPTION);
    await options.first().waitFor({ state: 'visible', timeout: 15000 });

    const count = await options.count();
    const labels = [];

    for (let i = 0; i < count; i += 1) {
      const option = options.nth(i);
      const label = ((await option.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      labels.push(label);

      if (label.toLowerCase().includes(queueName.toLowerCase())) {
        // Click the radio input, not the row: the row's label contains the TOD station picker,
        // and clicking that opens the picker instead of selecting the option.
        await option.locator('.el-radio__inner').first().click();
        return label;
      }
    }

    throw new Error(
      `[CartPage.selectDeliveryMethodByName] No delivery method matches "${queueName}". ` +
        `Options offered for this quote: ${JSON.stringify(labels)}`
    );
  }

  /**
   * Waits for the green success icon to appear next to delivery method.
   * Indicates that the delivery method has been successfully saved.
   */
  async waitForDeliveryMethodGreenIcon() {
    await this.page.locator(SELECTORS.GREEN_ICON_DELIVERY_METHOD).waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Waits for the expanded delivery method panel to finish loading its queues and TOD stations.
   * @param {number} timeout - Maximum wait time in milliseconds
   */
  async waitForDeliveryMethodLoaded({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.DELIVERY_METHOD_LOADING_SKELETON).waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForDeliveryMethodLoaded] The delivery method panel skeleton was still showing after ${timeout}ms. ` +
        `The loadDeliveryMethods call for this quote most likely never resolved. Original: ${err.message}`,
      );
    }
  }

  /**
   * Reads the station shown in a delivery method option's station picker.
   * Matches the option row by a substring of its queue name, so a trailing "(Default)" suffix
   * does not have to be spelled out by the caller.
   * @param {string} queueName - Delivery method queue name, e.g. "Atriis - Ticket on Departure (Collect at Station)"
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<string>} The station label currently selected in that option
   */
  async getDeliveryMethodOptionStation(queueName, { timeout = 15000 } = {}) {
    if (typeof queueName !== 'string' || queueName.trim() === '') {
      throw new Error(
        `[CartPage.getDeliveryMethodOptionStation] "queueName" must be a non-empty string, got: ${JSON.stringify(queueName)}`,
      );
    }

    const stationValue = this.page
      .locator(SELECTORS.DELIVERY_METHOD_OPTION)
      .filter({ hasText: queueName })
      .first()
      .locator(SELECTORS.DELIVERY_METHOD_OPTION_STATION_VALUE)
      .first();

    try {
      await stationValue.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getDeliveryMethodOptionStation] No station picker became visible for the delivery method option ` +
        `containing "${queueName}" within ${timeout}ms. Either that queue is not offered for this quote, or it is ` +
        `not a Ticket on Departure queue (only TOD queues render a station picker). Original: ${err.message}`,
      );
    }

    return (await stationValue.textContent() ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Reads the origin and destination stations of a UK rail (Evolvi) quote leg in the cart.
   * @param {object} [options] - Read options
   * @param {number} [options.legIndex] - Zero-based leg index; 0 is the outbound leg
   * @param {number} [options.timeout] - Maximum wait time in milliseconds
   * @returns {Promise<{origin: string, destination: string}>} The leg's route stations
   */
  async getUkRailRoute({ legIndex = 0, timeout = 30000 } = {}) {
    const routeRow = this.page.locator(SELECTORS.UK_RAIL_SEGMENT_ROUTE).nth(legIndex);

    try {
      await routeRow.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getUkRailRoute] The route row of UK rail quote leg ${legIndex} was not visible within ${timeout}ms. ` +
        `The rail quote most likely never rendered in the cart, or the quote has fewer legs than that. ` +
        `Original: ${err.message}`,
      );
    }

    const stations = routeRow.locator(SELECTORS.UK_RAIL_SEGMENT_ROUTE_STATION);
    const stationCount = await stations.count();
    if (stationCount < 2) {
      throw new Error(
        `[CartPage.getUkRailRoute] Expected the route row of UK rail quote leg ${legIndex} to hold an origin and a ` +
        `destination station, but found ${stationCount} station node(s). The uk-rail-segment-info markup has ` +
        `most likely changed.`,
      );
    }

    const readStation = async (index) => ((await stations.nth(index).textContent()) ?? '').replace(/\s+/g, ' ').trim();
    return { origin: await readStation(0), destination: await readStation(1) };
  }

  /**
   * Reads the ticket type printed in the footer of one UK rail (Evolvi) quote leg in the cart.
   * @param {object} [options] - Read options
   * @param {number} [options.legIndex] - Zero-based leg index; 0 is the outbound leg
   * @param {number} [options.timeout] - Maximum wait time in milliseconds
   * @returns {Promise<string>} The ticket type as rendered, whitespace-normalised
   */
  async getUkRailTicketType({ legIndex = 0, timeout = 30000 } = {}) {
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(
        `[CartPage.getUkRailTicketType] "legIndex" must be a non-negative integer, got: ${legIndex}`,
      );
    }

    const footer = this.page.locator(SELECTORS.UK_RAIL_SEGMENT_FOOTER).nth(legIndex);
    try {
      await footer.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getUkRailTicketType] The footer row of UK rail quote leg ${legIndex} was not visible within ` +
        `${timeout}ms. The rail quote most likely never rendered in the cart, or the quote has fewer legs than ` +
        `that. Original: ${err.message}`,
      );
    }

    const value = footer.locator(SELECTORS.UK_RAIL_SEGMENT_TICKET_TYPE).first();
    try {
      await value.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getUkRailTicketType] The footer of UK rail quote leg ${legIndex} shows no "Ticket type:" value. ` +
        `The footer reads: "${(await footer.innerText()).replace(/\s+/g, ' ').trim()}". The label wording or the ` +
        `uk-rail-segment-info footer markup has most likely changed. Original: ${err.message}`,
      );
    }

    return ((await value.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Gets the special request extra container (hotel or car variant), whichever is rendered.
   * @returns {import('playwright').Locator}
   */
  getSpecialRequestContainer() {
    return this.page.locator(SELECTORS.SPECIAL_REQUEST_CONTAINER).first();
  }

  /**
   * Opens the special request extra so its textarea is editable.
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<import('playwright').Locator>} The opened container
   */
  async openSpecialRequestExtra(timeout) {
    const container = this.getSpecialRequestContainer();
    await container.waitFor({ state: 'visible', timeout });
    const opener = container.locator(SELECTORS.SPECIAL_REQUEST_CLICKABLE).last();
    await opener.waitFor({ state: 'visible', timeout });
    await opener.click();
    return container;
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
    const container = await this.openSpecialRequestExtra(timeout);
    const textarea = container.locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
    await textarea.waitFor({ state: 'visible', timeout });
    await textarea.fill(text);
    await container.locator(SELECTORS.SPECIAL_REQUEST_SAVE_BTN).click();
    await this.page.locator(SELECTORS.SPECIAL_REQUEST_SUCCESS).first().waitFor({ state: 'visible', timeout });
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
    const container = await this.openSpecialRequestExtra(timeout);
    const textarea = container.locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
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
    const textarea = this.getSpecialRequestContainer().locator(SELECTORS.SPECIAL_REQUEST_TEXTAREA);
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
   * Returns the trimmed text of every payment method option visible in the currently
   * open Premier Inn extras dropdown, in DOM order.
   * Traverses each item's ancestor chain to skip options inside poppers that are
   * display:none (closed dropdowns), so only the open dropdown's options are returned.
   * @returns {Promise<string[]>} Visible option texts (empty if the dropdown is closed)
   */
  async getPremierInnPaymentOptions() {
    return await this.page.evaluate((selector) => {
      const texts = [];
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
        if (visible) texts.push(item.textContent.replace(/\s+/g, ' ').trim());
      }
      return texts;
    }, SELECTORS.DROPDOWN_OPTION);
  }

  /**
   * Counts payment method options in the Premier Inn extras dropdown after it is opened.
   * @returns {Promise<number>} Number of options in the currently open dropdown
   */
  async getPremierInnPaymentOptionCount() {
    return (await this.getPremierInnPaymentOptions()).length;
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
    return this.page.locator(SELECTORS.LOCATION_ADDRESS_TEXT).nth(index);
  }

  getCityCenterAddressOnCartByIndex(index) {
    return this.page.locator(SELECTORS.CITY_CENTER_ADDRESS).nth(index);
  }

  async getLocationAddressTextByIndex(index, { timeout = 30000 } = {}) {
    const el = this.page.locator(SELECTORS.LOCATION_ADDRESS_TEXT).nth(index);
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async openLocationDetailsTooltipByIndex(index, { timeout = 15000 } = {}) {
    const btn = this.page.locator(SELECTORS.LOCATION_DETAILS_BTN).nth(index);
    await btn.waitFor({ state: "visible", timeout });
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    await this.page.locator(SELECTORS.CAR_LOCATION_DETAILS_TOOLTIP).first().waitFor({ state: "visible", timeout });
  }

  async getAnyAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_ANY_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async getPickupAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_PICKUP_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async getDropoffAddressTextFromTooltip({ timeout = 10000 } = {}) {
    const el = this.page.locator(SELECTORS.TOOLTIP_DROPOFF_ADDRESS).first();
    await el.waitFor({ state: "visible", timeout });
    return (await el.innerText()).trim();
  }

  async closeLocationDetailsTooltip(index = 0) {
    const btn = this.page.locator(SELECTORS.LOCATION_DETAILS_BTN).nth(index);
    await btn.click({ force: true });
    await this.page.locator(SELECTORS.CAR_LOCATION_DETAILS_TOOLTIP).first()
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
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
   * Clicks the Car button in the "Add more services" product carousel and waits for the
   * edit-search drawer to open (the car search form renders in the drawer, not on a new route).
   * @param {number} [timeout=10000]
   */
  async clickAddCarFromCarousel({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_CAR_CAROUSEL_BUTTON);
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
      await this.page.locator(SELECTORS.ADD_HOTEL_SEARCH_DRAWER).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickAddCarFromCarousel] Could not open the car search drawer from the cart product ` +
        `carousel (button: ${SELECTORS.ADD_CAR_CAROUSEL_BUTTON}, drawer: ${SELECTORS.ADD_HOTEL_SEARCH_DRAWER}). ` +
        `Likely causes: the Car tile is not available for this user (product not accessible), it is ` +
        `hidden behind the carousel's "more" overflow dropdown, or the drawer did not render within ` +
        `${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Hovers the Rail tile in the "Add more services" product carousel to open its supplier dropdown,
   * then clicks the requested supplier and waits for the edit-search drawer to render.
   *
   * Two steps because the Rail tile is an el-dropdown trigger rather than a button that acts on
   * click — see SELECTORS.ADD_RAIL_CAROUSEL_BUTTON.
   *
   * @param {string|RegExp} railTypeText - Supplier item text, e.g. /EU Rail/ for EU Rails
   * @param {number} [timeout=10000]
   */
  async selectRailTypeFromCarousel(railTypeText, { timeout = 10000 } = {}) {
    if (!railTypeText) {
      throw new Error('[CartPage.selectRailTypeFromCarousel] "railTypeText" is required.');
    }

    const tile = this.page.locator(SELECTORS.ADD_RAIL_CAROUSEL_BUTTON).first();
    try {
      await tile.waitFor({ state: 'visible', timeout });
      await tile.hover();

      const item = this.page
        .locator(SELECTORS.RAIL_TYPE_DROPDOWN_ITEM, { hasText: railTypeText })
        .first();
      await item.waitFor({ state: 'visible', timeout });
      await item.click();

      await this.page.locator(SELECTORS.ADD_HOTEL_SEARCH_DRAWER).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.selectRailTypeFromCarousel] Could not open the rail search drawer for ` +
        `"${railTypeText}" from the cart product carousel (tile: ${SELECTORS.ADD_RAIL_CAROUSEL_BUTTON}, ` +
        `item: ${SELECTORS.RAIL_TYPE_DROPDOWN_ITEM}, drawer: ${SELECTORS.ADD_HOTEL_SEARCH_DRAWER}). ` +
        `Likely causes: the Rail tile is not available for this user, this rail supplier is not in ` +
        `the user's accessible products (so the dropdown never lists it), the hover did not open the ` +
        `dropdown, or the drawer did not render within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  // ===== CAR CROSS-SELL SUGGESTION (trip overview) =====

  /**
   * The car-rental cross-sell suggestion card on the trip overview, scoped by its car product icon.
   * @returns {import('@playwright/test').Locator}
   */
  getCarCrossSellSuggestion() {
    return this.page.locator(SELECTORS.CROSS_SELL_CAR_SUGGESTION).first();
  }

  /**
   * Title of the car cross-sell suggestion (e.g. "Add car rental in Manchester").
   * @returns {import('@playwright/test').Locator}
   */
  getCarCrossSellSuggestionTitle() {
    return this.getCarCrossSellSuggestion()
      .locator(SELECTORS.CROSS_SELL_SUGGESTION_TITLE)
      .first();
  }

  /**
   * Clicks the car cross-sell suggestion's action to open the pre-filled car search drawer.
   * @param {number} [timeout=15000]
   */
  async clickCarCrossSellSuggestionAction(timeout = 15000) {
    const action = this.getCarCrossSellSuggestion()
      .locator(SELECTORS.CROSS_SELL_SUGGESTION_ACTION)
      .first();
    await action.waitFor({ state: 'visible', timeout });
    await action.click();
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
   * Clicks the Parking button in the "Add more services" product carousel.
   * Navigates to the parking search page.
   * @param {number} [timeout=10000]
   */
  async clickAddParkingFromCarousel({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_PARKING_CAROUSEL_BUTTON);
    await btn.waitFor({ state: 'visible', timeout });
    await btn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Clicks the "Manual quote" button in the "Add more services" product carousel.
   * Navigates to the manual-quote page (separate route from the trip search index).
   * @param {number} [timeout=10000]
   */
  async clickAddManualQuoteFromCarousel({ timeout = 10000 } = {}) {
    const btn = this.page.locator(SELECTORS.ADD_MANUAL_QUOTE_CAROUSEL_BUTTON);
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
      await this.page
        .locator(SELECTORS.MANUAL_QUOTE_PAGE_CONTAINER)
        .waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[CartPage.clickAddManualQuoteFromCarousel] Could not navigate to the manual quote page from the cart product carousel ` +
        `(button selector: ${SELECTORS.ADD_MANUAL_QUOTE_CAROUSEL_BUTTON}). ` +
        `Likely causes: the "Manual quote" button is not present for this user (no permission / isCanAddManualQuote=false), ` +
        `it is hidden inside the "more" overflow dropdown, or the manual-quote-page failed to load within 30s. ` +
        `Original: ${err.message}`
      );
    }
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
   * Gets all visible PNR codes rendered inside quote cards in the cart, regardless of
   * product type (flight, car, etc.) — `.quote-payment-card` is the shared wrapper class
   * every quote-card variant renders (car-quote-card.vue, flight-quote-card.vue, ...).
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>}
   */
  async getVisibleQuotePnrCodes({ timeout = 15000 } = {}) {
    // `:visible` excludes hidden responsive-layout duplicates of the same quote card
    // (the app renders both a mobile and desktop copy; only one is ever displayed).
    const quoteCards = this.page.locator(`${SELECTORS.QUOTE_PAYMENT_CARD}:visible`);
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
   * Gets the numeric trip ID shown below the trip title in the cart info bar (e.g. "12345").
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getTripIdText({ timeout = 30000 } = {}) {
    const el = this.page.locator(SELECTORS.TRIP_ID_DISPLAY).first();
    try {
      await el.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(`[CartPage.getTripIdText] Trip ID element not visible in cart info bar. Original: ${err.message}`);
    }
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
   * Waits for the first element matching `selector` to be visible and returns its trimmed text.
   * Wraps Playwright timeouts with a WHAT/WHERE/WHY message so a missing trip-overview element
   * is diagnosable. Shared by the trip-overview quote getters below.
   * @param {string} selector
   * @param {string} description - human-readable name of what is being read (for the error)
   * @param {number} timeout
   * @returns {Promise<string>}
   */
  async _readTripOverviewText(selector, description, timeout) {
    const el = this.page.locator(selector).first();
    try {
      await el.waitFor({ state: 'visible', timeout });
      return (await el.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[CartPage._readTripOverviewText] Could not read ${description} (selector "${selector}") within ${timeout}ms. ` +
        `The relevant quote may not be in the trip overview yet, or the page has not finished rendering. Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the flight quote card title from the trip overview (e.g. "Flight to Budapest").
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getFlightQuoteTitleText({ timeout = 10000 } = {}) {
    return this._readTripOverviewText(SELECTORS.FLIGHT_QUOTE_TITLE, 'the flight quote title', timeout);
  }

  /**
   * Gets the car quote card title from the trip overview (e.g. "Car rental in ... Hungary").
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getCarQuoteTitleText({ timeout = 10000 } = {}) {
    return this._readTripOverviewText(SELECTORS.CAR_QUOTE_TITLE, 'the car quote title', timeout);
  }

  /**
   * Gets the outbound flight arrival time from the flight quote card (e.g. "14:30").
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getFlightQuoteOutboundArrivalTime({ timeout = 15000 } = {}) {
    return this._readTripOverviewText(
      SELECTORS.FLIGHT_QUOTE_OUTBOUND_ARRIVAL_TIME,
      'the outbound flight arrival time (the flight quote may not be a round trip)',
      timeout,
    );
  }

  /**
   * Gets the return flight departure time from the flight quote card (e.g. "10:15").
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getFlightQuoteReturnDepartureTime({ timeout = 15000 } = {}) {
    return this._readTripOverviewText(
      SELECTORS.FLIGHT_QUOTE_RETURN_DEPARTURE_TIME,
      'the return flight departure time (the flight quote may not include a return segment)',
      timeout,
    );
  }

  /**
   * Gets the car quote pickup/drop-off date·time label from the trip overview,
   * e.g. "03 Jul 2026 · 14:30 - 05 Jul 2026 · 10:15".
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<string>}
   */
  async getCarQuotePickupDropoffText({ timeout = 15000 } = {}) {
    return this._readTripOverviewText(SELECTORS.CAR_QUOTE_DATE_RANGE, 'the car pickup/drop-off date·time label', timeout);
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
   * Counts the flight quote cards currently rendered in the cart.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<number>}
   */
  async getFlightQuoteCardCount({ timeout = 15000 } = {}) {
    const quoteCards = this.page.locator(SELECTORS.FLIGHT_QUOTE_CARD);
    await quoteCards.first().waitFor({ state: 'visible', timeout });

    return quoteCards.count();
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
   * Clicks the More Details trigger on any cart item (hotel, flight, or car). Hotel/flight open
   * the shared drawer (`[aria-label='More details']`); car opens its own inline drawer (see
   * CAR_MORE_DETAILS_DRAWER). The underlying DOM uses two different classes — `.more-details`
   * for hotels/cars and `.more-details-btn` for flights.
   *
   * Cars render the trigger as a wrapper `<div class="more-details">` around an `<a>` link
   * (car-quote-card.vue) — a center-click on the wider div can land on empty space beside the
   * link and silently no-op, so the inner `<a>` is clicked directly when present.
   */
  async clickMoreDetailsInCart() {
    const moreDetails = this.page.locator(SELECTORS.MORE_DETAILS_BUTTON_ANY).first();
    try {
      await moreDetails.waitFor({ state: 'visible', timeout: 15000 });
      const innerLink = moreDetails.locator(SELECTORS.MORE_DETAILS_INNER_LINK);
      if (await innerLink.count() > 0) {
        await innerLink.first().click({ timeout: 10000 });
      } else {
        await moreDetails.click({ timeout: 10000 });
      }
    } catch (err) {
      throw new Error(
        `[CartPage.clickMoreDetailsInCart] Could not click a "More details" trigger in the cart ` +
        `(selector: ${SELECTORS.MORE_DETAILS_BUTTON_ANY}). The cart may still be loading or no hotel/flight/car item is present. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the More Details trigger on the LAST car quote card in the trip overview — i.e. the
   * most recently added car. Use when two or more cars are in the same trip and the generic
   * `clickMoreDetailsInCart` (which always opens the FIRST match) would open the wrong one.
   * Cars scored identical pick-up/drop-off dates are indistinguishable by text, so this relies
   * on DOM order instead.
   */
  async clickMoreDetailsForLastCarInCart() {
    const moreDetails = this.page.locator(SELECTORS.MORE_DETAILS_CAR_BUTTON).last();
    try {
      await moreDetails.waitFor({ state: 'visible', timeout: 15000 });
      const innerLink = moreDetails.locator(SELECTORS.MORE_DETAILS_INNER_LINK);
      if (await innerLink.count() > 0) {
        await innerLink.first().click({ timeout: 10000 });
      } else {
        await moreDetails.click({ timeout: 10000 });
      }
    } catch (err) {
      throw new Error(
        `[CartPage.clickMoreDetailsForLastCarInCart] Could not click the "More details" trigger on the last ` +
        `car quote card (selector: ${SELECTORS.MORE_DETAILS_CAR_BUTTON}). The cart may still be loading or no ` +
        `car item is present. Original: ${err.message}`,
      );
    }
  }

  /**
   * Clicks the More Details trigger within a specific quote card identified by its text content.
   * @param {string} cardText - Partial text to identify the quote card (e.g. "Flight to", "Test Hotel", "Car Rental")
   */
  async clickMoreDetailsForQuoteByText(cardText) {
    const card = this.page.locator(SELECTORS.QUOTE_PAYMENT_CARD, { hasText: cardText }).first();
    const moreDetailsContainer = card.locator(SELECTORS.MORE_DETAILS_BUTTON_ANY).first();
    try {
      await card.waitFor({ state: 'visible', timeout: 15000 });
      await moreDetailsContainer.waitFor({ state: 'visible', timeout: 10000 });
      // Car quote uses a wrapper div with an <a> inside — click the link, not the div
      const innerLink = moreDetailsContainer.locator(SELECTORS.MORE_DETAILS_INNER_LINK);
      if (await innerLink.count() > 0) {
        await innerLink.first().click({ timeout: 10000 });
      } else {
        await moreDetailsContainer.click({ timeout: 10000 });
      }
    } catch (err) {
      throw new Error(
        `[CartPage.clickMoreDetailsForQuoteByText] Could not click "More details" on the quote card containing "${cardText}". ` +
        `The card may not be visible, or it does not have a More Details link/button. ` +
        `Original: ${err.message}`,
      );
    }
  }

  /**
   * Returns the full text of whichever drawer is currently visible (flight, hotel, or car).
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>}
   */
  async getAnyVisibleDrawerText({ timeout = 15000 } = {}) {
    const drawer = this.page.locator(SELECTORS.ANY_VISIBLE_DRAWER).first();
    try {
      await drawer.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getAnyVisibleDrawerText] No visible drawer found within ${timeout}ms. ` +
        `Ensure "More Details" was clicked before calling this method. Original: ${err.message}`,
      );
    }
    const skeletons = drawer.locator(SELECTORS.MORE_DETAILS_DRAWER_SKELETON);
    try {
      await skeletons.first().waitFor({ state: 'detached', timeout: 10000 });
    } catch {
      // No skeletons or already loaded
    }
    return drawer.innerText();
  }

  /**
   * Closes whichever drawer is currently visible by pressing Escape.
   */
  async closeAnyVisibleDrawer() {
    const drawer = this.page.locator(SELECTORS.ANY_VISIBLE_DRAWER).first();
    try {
      await drawer.waitFor({ state: 'visible', timeout: 5000 });
      await this.page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.closeAnyVisibleDrawer] Failed to close the open drawer — ` +
        `it may not have been open or Escape did not dismiss it. Original: ${err.message}`,
      );
    }
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
   * Reads the total price displayed in the flight cart "More details" drawer.
   * Uses text-anchored matching (drawer DOM has no .app-footer wrapper).
   * The drawer must already be open (via clickFlightDetailsButton).
   * @param {object} options
   * @param {number} options.timeout - Maximum wait time (default: 15000ms)
   * @returns {Promise<number>} The total price as a numeric value
   */
  async getFlightCartMoreDetailsTotalPrice({ timeout = 15000 } = {}) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_CART_MORE_DETAILS_DRAWER).first();
    await drawer.waitFor({ state: 'visible', timeout });
    const priceEl = drawer.getByText(SELECTORS.FLIGHT_CART_MORE_DETAILS_PRICE_TEXT).last();
    await priceEl.waitFor({ state: 'visible', timeout });
    const text = await priceEl.innerText();
    // FLIGHT_CART_MORE_DETAILS_PRICE_TEXT matches $-prefixed USD values, where commas are
    // thousands separators (e.g. "$1,234.56"). Strip them; keep the dot as decimal.
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
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
   * Locator for the daily-rate text under a car cart line item's price (before opening
   * More Details). Only rendered when the quote's numberOfDays > 1.
   * @param {boolean} [last=false] - When true, targets the LAST (most recently added) car quote
   *   card instead of the first — use when two or more cars are in the same trip.
   * @returns {import('playwright').Locator}
   */
  getCarCartCardDailyRate(last = false) {
    const locator = this.page.locator(SELECTORS.CAR_CART_CARD_DAILY_RATE);
    return last ? locator.last() : locator.first();
  }

  /**
   * Waits for the daily-rate text to appear under a car cart line item's price.
   * @param {number} [timeout=15000]
   * @param {boolean} [last=false] - See getCarCartCardDailyRate
   * @throws {Error} If the daily rate never becomes visible
   */
  async waitForCarCartCardDailyRateVisible(timeout = 15000, last = false) {
    try {
      await this.getCarCartCardDailyRate(last).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCarCartCardDailyRateVisible] The daily-rate text never appeared under ` +
        `the car cart line item's price within ${timeout}ms (selector: ${SELECTORS.CAR_CART_CARD_DAILY_RATE}). ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the car's own "More details" drawer (car-quote-card.vue) to be open and its
   * price-breakdown rows to be rendered.
   * @param {number} [timeout=15000]
   * @throws {Error} If the drawer or its price rows never become visible
   */
  async waitForCarMoreDetailsPriceRowsVisible(timeout = 15000) {
    try {
      const drawer = this.page.locator(SELECTORS.CAR_MORE_DETAILS_DRAWER).first();
      await drawer.waitFor({ state: 'visible', timeout });
      await drawer.locator(SELECTORS.CAR_MORE_DETAILS_PRICE_ITEMS).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCarMoreDetailsPriceRowsVisible] The car More Details drawer or its price ` +
        `breakdown rows never appeared within ${timeout}ms (drawer: ${SELECTORS.CAR_MORE_DETAILS_DRAWER}, ` +
        `rows: ${SELECTORS.CAR_MORE_DETAILS_PRICE_ITEMS}). Original: ${err.message}`
      );
    }
  }

  /**
   * Locator for a price-breakdown row's label (first <p>) inside the car More Details drawer.
   * @param {number} rowIndex - 0 = Price Per day, 1 = Subtotal
   * @returns {import('playwright').Locator}
   */
  getCarMoreDetailsPriceRowLabel(rowIndex) {
    return this.page
      .locator(SELECTORS.CAR_MORE_DETAILS_DRAWER)
      .locator(SELECTORS.CAR_MORE_DETAILS_PRICE_ITEMS)
      .nth(rowIndex)
      .locator('p')
      .nth(0);
  }

  /**
   * Locator for a price-breakdown row's value (second <p>) inside the car More Details drawer.
   * @param {number} rowIndex - 0 = Price Per day, 1 = Subtotal
   * @returns {import('playwright').Locator}
   */
  getCarMoreDetailsPriceRowValue(rowIndex) {
    return this.page
      .locator(SELECTORS.CAR_MORE_DETAILS_DRAWER)
      .locator(SELECTORS.CAR_MORE_DETAILS_PRICE_ITEMS)
      .nth(rowIndex)
      .locator('p')
      .nth(1);
  }

  /**
   * Waits for the open More Details drawer to be visible and returns the count of
   * fare-rules buttons rendered inside it. Manual quotes should render 0; real
   * flight quotes typically render 1.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=10000] - Max wait for the drawer
   * @returns {Promise<number>} Count of fare-rules buttons inside the drawer
   */
  async getFareRulesButtonCountInMoreDetailsDrawer({ timeout = 10000 } = {}) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_CART_MORE_DETAILS_DRAWER).first();
    try {
      await drawer.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getFareRulesButtonCountInMoreDetailsDrawer] More Details drawer ` +
        `(selector: ${SELECTORS.FLIGHT_CART_MORE_DETAILS_DRAWER}) was not visible within ${timeout}ms — ` +
        `it must be opened (e.g. via Cart.openMoreDetailsInCart) before this check. Original: ${err.message}`,
      );
    }
    // The drawer renders el-skeleton placeholders while its body content loads.
    // Counting before they detach would return 0 for the wrong reason (content
    // not rendered yet) and produce a false-negative assertion. Wait for the
    // skeletons to disappear before reading the real content.
    const skeletons = drawer.locator(SELECTORS.MORE_DETAILS_DRAWER_SKELETON);
    try {
      await skeletons.first().waitFor({ state: 'detached', timeout });
    } catch {
      // No skeletons present (already loaded or drawer doesn't use them) — fall through.
    }
    return this.page.locator(SELECTORS.FARE_RULES_BUTTON_IN_MORE_DETAILS_DRAWER).count();
  }

  /**
   * Returns the full visible text content of the hotel More Details drawer.
   * The drawer must already be open.
   * @param {object} [options]
   * @param {number} [options.timeout=15000] - Max wait for the drawer
   * @returns {Promise<string>} Drawer inner text
   */
  async getMoreDetailsDrawerText({ timeout = 15000 } = {}) {
    const drawer = this.page.locator(SELECTORS.MORE_DETAILS_DRAWER_CONTAINER).first();
    await drawer.waitFor({ state: 'visible', timeout });
    // Drawer renders el-skeleton placeholders while content loads. Wait for
    // them to disappear before reading the text, otherwise we'll capture
    // empty skeletons instead of the real content.
    const skeletons = drawer.locator(SELECTORS.MORE_DETAILS_DRAWER_SKELETON);
    try {
      await skeletons.first().waitFor({ state: 'detached', timeout });
    } catch {
      // No skeletons present (already loaded) or different placeholder — fall through.
    }
    return drawer.innerText();
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

  /**
   * Reads the UK Rail (Evolvi) split-ticket state out of the cart's quote card: whether the SplitTix
   * glyph is displayed on the ticket-type row, and the row's text.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<{iconVisible: boolean, text: string}>}
   */
  async getUkRailSplitTicketInfoInCart({ timeout = 30000 } = {}) {
    const segment = this.page.locator(SELECTORS.UK_RAIL_SPLIT_TICKET_SEGMENT).first();
    try {
      await segment.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getUkRailSplitTicketInfoInCart] No UK Rail quote card segment is displayed in the cart ` +
          `(selector: ${SELECTORS.UK_RAIL_SPLIT_TICKET_SEGMENT}). Original: ${err.message}`
      );
    }

    const icon = segment.locator(SELECTORS.UK_RAIL_SPLIT_TICKET_ICON).first();
    const iconVisible = await icon
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    return {
      iconVisible,
      text: this.normalizeSharePreviewText(await segment.innerText()),
    };
  }

  /**
   * Reads the same split-ticket state out of the open More details drawer.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<{iconVisible: boolean, text: string}>}
   */
  async getUkRailSplitTicketInfoInMoreDetails({ timeout = 15000 } = {}) {
    const text = await this.getMoreDetailsDrawerText({ timeout });
    const icon = this.page
      .locator(SELECTORS.MORE_DETAILS_DRAWER_CONTAINER)
      .first()
      .locator(SELECTORS.UK_RAIL_SPLIT_TICKET_ICON)
      .first();
    const iconVisible = await icon
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    return { iconVisible, text: this.normalizeSharePreviewText(text) };
  }

  /**
   * Reads the Eticket reference off the BOOKED UK rail (Evolvi) quote in the trip overview.
   *
   * The #booking-confirm-info slot only renders once the quote carries an orderItemNumber, so the
   * row is waited for rather than read straight away — completing the booking navigates back to the
   * trip overview and the quote card re-renders with the supplier's references.
   *
   * @param {{timeout?: number}} [options]
   * @returns {Promise<string>} The Eticket reference, whitespace-normalised
   */
  async getUkRailEticketNumberFromTripOverview({ timeout = 60_000 } = {}) {
    const row = this.page.locator(SELECTORS.UK_RAIL_ETICKET_ROW).first();
    try {
      await row.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.getUkRailEticketNumberFromTripOverview] No Eticket row appeared on the booked UK rail ` +
          `quote (selector: ${SELECTORS.UK_RAIL_ETICKET_ROW}) within ${timeout}ms. The booking may not have ` +
          `completed, or the quote card has no order reference yet. Original: ${err.message}`
      );
    }

    const normalize = (text) => (text ?? '').replace(/\s+/g, ' ').trim();
    const raw = normalize(await row.locator(SELECTORS.UK_RAIL_ETICKET_VALUE).first().textContent());

    // Staging renders the label INSIDE the value node ("Eticket ref: AGB25HFVT6J") where
    // uk-rail-quote-card.vue has it as a bare sibling text node, so a label prefix is cut here
    // rather than assumed absent. Only the bare reference is returned: it is compared against the
    // itinerary email, which is generated by the mail service and words its own label
    // independently — matching label-and-all would pass only while the two happen to agree.
    const value = raw.replace(/^[^:]*:\s*/, '');

    // A reference is a single token. Anything else means the read picked up a wider node than the
    // value span, which is exactly how the label-included read went unnoticed the first time.
    if (!value || /\s/.test(value)) {
      throw new Error(
        `[CartPage.getUkRailEticketNumberFromTripOverview] Could not read a bare Eticket reference from ` +
          `the value span (selector: ${SELECTORS.UK_RAIL_ETICKET_VALUE}). Read "${raw}", reduced to ` +
          `"${value}". Row text: "${normalize(await row.textContent())}"`
      );
    }
    return value;
  }

  /**
   * Reads the split-ticket state out of the share itinerary email preview.
   *
   * The preview is backend-generated HTML inside the `.email-content-container` iframe, so the glyph
   * cannot be found by a Vue class the way it can in the app: it is looked for as an <img> whose src
   * or alt names the split ticket. The returned `imageSources` list is what makes a missing glyph
   * diagnosable rather than just false.
   *
   * @returns {Promise<{iconPresent: boolean, text: string, imageSources: string[]}>}
   */
  async getUkRailSplitTicketInfoInSharePreview() {
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) {
      throw new Error(
        '[CartPage.getUkRailSplitTicketInfoInSharePreview] Share itinerary email preview iframe had no ' +
          'srcdoc content. The preview may not have finished rendering, or the share dialog is not open.'
      );
    }

    const imageSources = [...srcdoc.matchAll(/<img[^>]*>/gi)].map((match) => match[0]);
    const iconPresent = imageSources.some((tag) => /split/i.test(tag));

    return {
      iconPresent,
      text: await this.getSharePreviewTextContent(),
      imageSources: imageSources.map((tag) => {
        const src = /src=["']([^"']+)["']/i.exec(tag);
        return src ? src[1] : tag;
      }),
    };
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
   * Reads every hyperlink out of the share email preview.
   *
   * The preview is backend-generated email HTML injected as the iframe's srcdoc
   * (app-share-quotes.vue -> :srcdoc="emailContent"), so the anchors are parsed from that
   * raw HTML rather than the live iframe DOM: the email is a long table document and the
   * links sit far below the fold, where a DOM read would need scrolling inside the frame.
   *
   * Uses the same parser as the mailbox reader, so preview links and delivered-mail links are
   * directly comparable.
   *
   * @returns {Promise<Array<{text: string, href: string}>>} Link text (tags stripped) and href
   */
  async getSharePreviewLinks() {
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) {
      throw new Error(
        '[CartPage.getSharePreviewLinks] Share email preview iframe had no srcdoc content. The ' +
          'preview may not have finished rendering, or the share dialog is not open.'
      );
    }

    return extractHtmlLinks(srcdoc);
  }

  /**
   * Clicks a hyperlink inside the share email preview iframe, matched on its exact href.
   *
   * The href comes from getSharePreviewLinks(), which parses the iframe's srcdoc — so the anchor is
   * re-found in the LIVE frame here by comparing hrefs across every <a> it renders, rather than
   * through a CSS attribute selector (email hrefs carry query strings and quotes that would have to
   * be escaped) or a structural path (the email template's table nesting changes between releases).
   * Playwright scrolls the anchor into view inside the frame, which matters: the ticket links sit far
   * below the preview's fold.
   *
   * @param {string} href - The absolute href to click, as returned by getSharePreviewLinks()
   * @returns {Promise<void>}
   */
  async clickSharePreviewLinkByHref(href) {
    if (typeof href !== 'string' || !href.trim()) {
      throw new Error(`[CartPage.clickSharePreviewLinkByHref] "href" must be a non-empty string, got: ${typeof href}`);
    }

    const frame = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first().contentFrame();
    const anchors = frame.locator('a');
    await anchors.first().waitFor({ state: 'attached', timeout: 20_000 });

    const hrefs = await anchors.evaluateAll((elements) => elements.map((element) => element.getAttribute('href') || ''));
    const index = hrefs.indexOf(href);
    if (index === -1) {
      throw new Error(
        `[CartPage.clickSharePreviewLinkByHref] No anchor in the share email preview points to "${href}". ` +
          `The preview may have re-rendered since the links were read. Hrefs found: ${JSON.stringify(hrefs.filter(Boolean))}`
      );
    }

    await anchors.nth(index).click();
  }

  /**
   * Adds an external (non-corporate) email address as a recipient in the open share dialog.
   *
   * The "Send to" field is a user-autocomplete mounted with 'allow-external-email'
   * (user-autocomplete.ts -> querySearch): when the typed text matches no corporate user and
   * is a valid address, the component synthesises a single suggestion. Typing alone does not
   * add a recipient — the suggestion has to be clicked.
   *
   * @param {string} email - The address to add
   * @returns {Promise<void>}
   */
  async addExternalShareRecipient(email) {
    const chips = this.page.locator(SELECTORS.SHARE_RECIPIENT_CHIPS).filter({ visible: true });
    const chipsBefore = await chips.count();

    const input = this.page.locator(SELECTORS.SHARE_RECIPIENT_INPUT).filter({ visible: true }).first();
    await input.waitFor({ state: 'visible', timeout: 30_000 });
    await input.click();
    // el-autocomplete fetches suggestions from a debounced input event. fill() sets the value
    // in one shot, which the debounce can swallow and leave the popper closed, so the address
    // is typed out instead.
    await input.pressSequentially(email, { delay: 30 });

    // Held to the typed address, not just to "an option": every keystroke re-queries the server,
    // so the popper spends most of the typing showing corporate users that partially match the
    // prefix. Clicking whichever option happens to be first would add the wrong recipient and
    // still grow the chip count — a pass for the wrong reason. hasText is a case-insensitive
    // substring match, which is what the option's own sub-line renders.
    const suggestion = this.page
      .locator(SELECTORS.SHARE_RECIPIENT_SUGGESTION)
      .filter({ visible: true })
      .filter({ hasText: email })
      .first();
    try {
      await suggestion.waitFor({ state: 'visible', timeout: 20_000 });
    } catch (err) {
      throw new Error(
        `[CartPage.addExternalShareRecipient] No suggestion was offered for "${email}". The ` +
          'external-email option only appears when the address matches no corporate user and ' +
          `passes the component's email validation. Original: ${err.message}`
      );
    }
    await suggestion.click();

    // The chip is a trip-traveler-tag whose label is the address; long addresses are truncated
    // in it, so the recipient is confirmed by the chip count growing rather than by chip text.
    await expect
      .poll(async () => chips.count(), { timeout: 15_000, message: `Recipient "${email}" was not added to the share dialog` })
      .toBe(chipsBefore + 1);
  }

  /**
   * Checks whether the trip number rendered in the share email preview is a hyperlink.
   *
   * The preview is backend-generated HTML shown inside the `.email-content-container`
   * iframe, and its structure changes over time, so this does not rely on a fixed
   * structural path. Instead it locates the trip-number value in the rendered preview
   * and reports whether that value is wrapped in an anchor (`<a>`) — i.e. rendered as a
   * clickable link rather than plain text. The same check works for both the price-offer
   * (quote) and itinerary templates.
   *
   * @param {string} tripNumber - The trip number to look for in the preview
   * @returns {Promise<{isHyperlink: boolean, snippet: string}>} Whether it is a hyperlink and an HTML snippet for diagnostics
   */
  async isTripNumberHyperlinkInSharePreview(tripNumber) {
    if (!tripNumber || typeof tripNumber !== 'string') {
      throw new Error(
        `[CartPage.isTripNumberHyperlinkInSharePreview] tripNumber must be a non-empty string, got: ${typeof tripNumber}`
      );
    }

    // Ensure the preview iframe has finished rendering its srcdoc before querying it.
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) {
      throw new Error(
        '[CartPage.isTripNumberHyperlinkInSharePreview] Share email preview iframe had no srcdoc content. ' +
          'The preview may not have finished rendering, or the share dialog is not open.'
      );
    }

    const frame = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first().contentFrame();

    // The trip number must actually appear in the preview, otherwise there is nothing to assert.
    const visibleCount = await frame.getByText(tripNumber).count().catch(() => 0);
    if (visibleCount === 0 && !srcdoc.includes(tripNumber)) {
      throw new Error(
        `[CartPage.isTripNumberHyperlinkInSharePreview] Trip number "${tripNumber}" was not found in the share email preview. ` +
          'It may be shown in a different format, or the wrong trip number was passed.'
      );
    }

    // It is a hyperlink if any anchor in the preview contains the trip number as its text.
    const anchorWithTripNumber = frame.locator('a', { hasText: tripNumber });
    const anchorCount = await anchorWithTripNumber.count().catch(() => 0);
    const snippet =
      anchorCount > 0
        ? (await anchorWithTripNumber
            .first()
            .evaluate((node) => (node.outerHTML || '').slice(0, 200))
            .catch(() => '')) || ''
        : '';

    return { isHyperlink: anchorCount > 0, snippet };
  }

  /**
   * Extracts the flight offer total price shown in the share email preview.
   *
   * The price-offer email renders each offer's total inside a blue price box
   * (bgcolor="#1C73FF"). Reads that box from the live iframe DOM (falling back to
   * parsing the raw srcdoc HTML for the same box), then returns the largest
   * monetary amount found — the headline offer total. Returning the total is what
   * lets a caller detect the "price duplicated for 2 travellers" regression: a
   * doubled total is the largest number in the box and will not match the cart total.
   *
   * @returns {Promise<number>} The flight offer total price shown in the preview
   */
  async getSharePreviewFlightOfferPrice() {
    const srcdoc = await this._waitForShareIframeSrcdoc();
    if (srcdoc.trim().length === 0) {
      throw new Error(
        '[CartPage.getSharePreviewFlightOfferPrice] Share email preview iframe had no srcdoc content. ' +
          'The preview may not have finished rendering, or the share dialog is not open.'
      );
    }

    // Prefer the live iframe DOM (respects rendered text); fall back to parsing the
    // raw srcdoc HTML for the same blue price box.
    let boxText = '';
    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    const box = iframeLocator.contentFrame().locator(SELECTORS.SHARE_EMAIL_PRICE_OFFER_BOX).first();
    if (await box.count().catch(() => 0)) {
      boxText = (await box.textContent({ timeout: 8000 }).catch(() => '')) ?? '';
    }

    if (this.normalizeSharePreviewText(boxText).length === 0) {
      const boxMatch = srcdoc.match(/bgcolor=["']#1C73FF["'][\s\S]*?<\/table>/i);
      boxText = boxMatch ? boxMatch[0].replace(/<[^>]+>/g, ' ') : '';
    }

    const normalized = this.normalizeSharePreviewText(boxText);

    // Extract every number-like token, then keep the ones that parse to a real amount.
    const parsed = (normalized.match(/\d[\d.,]*/g) || [])
      .map((raw) => {
        try {
          return { raw, value: parseAmountText(raw, 'share preview flight offer price') };
        } catch {
          return null;
        }
      })
      .filter((p) => p && !Number.isNaN(p.value));

    if (parsed.length === 0) {
      throw new Error(
        `[CartPage.getSharePreviewFlightOfferPrice] No monetary amount found in the share email price box. ` +
          `Box text: "${normalized.slice(0, 300)}"`
      );
    }

    // Prefer decimal-bearing tokens (real prices like "1,234.56") over bare integers
    // (flight numbers, counts) that can also appear in the price box.
    const decimalPriced = parsed.filter((p) => /[.,]\d{2}(?!\d)/.test(p.raw));
    const pool = decimalPriced.length ? decimalPriced : parsed;
    return Math.max(...pool.map((p) => p.value));
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
   * Extracts masked frequent flyer number tokens (e.g. "***3150") from the share
   * email/itinerary preview text. The preview masks frequent flyer numbers as
   * asterisks followed by the last few alphanumeric characters, one token per
   * passenger row in the "Frequent Flyer" column.
   * @returns {Promise<string[]>} Masked frequent flyer tokens found in the preview
   */
  async getSharePreviewFrequentFlyerValues({ timeout = 30000 } = {}) {
    const deadline = Date.now() + timeout;
    const pattern = /\*{2,4}[A-Za-z0-9]{2,8}/g;

    await this._waitForShareIframeSrcdoc(timeout);
    let text = await this.getSharePreviewTextContent();
    let hasColumn = text.includes('Frequent Flyer');
    let matches = hasColumn ? (text.match(pattern) || []) : [];
    while (matches.length === 0 && Date.now() < deadline) {
      await this.scrollSharePreviewDown();
      await this.page.waitForTimeout(1000);
      text = await this.getSharePreviewTextContent();
      hasColumn = text.includes('Frequent Flyer');
      matches = hasColumn ? (text.match(pattern) || []) : [];
    }

    // Without a "Frequent Flyer" column present, any masked-token matches would be
    // unrelated fields (e.g. masked payment/ticket references) — don't report those.
    return hasColumn ? matches : [];
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
    // The CookieHub (ch2) consent banner can overlay the button and intercept the
    // click's pointer events; dismiss it first (best-effort, never throws).
    await this.dismissCookieBannerIfPresent();
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
   * Reads the first train company of the route from the EU rail (Benerail) quote card in the cart /
   * trip overview — the same eu-rail-route-details.vue block shown on the results card, so the
   * carrier the traveller picked can be re-verified once the quote is in the cart.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>} The carrier name, e.g. "InterCity Express"
   */
  async getFirstEuRailQuoteRouteCarrierName({ timeout = 30000 } = {}) {
    const carrierName = this.page.locator(SELECTORS.EU_RAIL_QUOTE_ROUTE_CARRIER_NAME).first();
    await carrierName.waitFor({ state: 'visible', timeout });
    return ((await carrierName.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Reads the travel class of one leg of the EU rail (Benerail) quote card in the cart, so the
   * class the traveller picked per leg can be re-verified once the quote is in the cart — a round
   * trip can legitimately mix classes (e.g. a 2nd class outbound with a 1st class return).
   * @param {number} segmentIndex - Zero-based leg index: 0 = outbound, 1 = return.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>} The leg's travel class, e.g. "1st Class"
   */
  async getEuRailQuoteSegmentClass(segmentIndex, { timeout = 30000 } = {}) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(
        `[CartPage.getEuRailQuoteSegmentClass] "segmentIndex" must be a non-negative integer, got: ${segmentIndex}`,
      );
    }

    const segmentCount = await this.page.locator(SELECTORS.EU_RAIL_QUOTE_SEGMENT).count();
    if (segmentIndex >= segmentCount) {
      throw new Error(
        `[CartPage.getEuRailQuoteSegmentClass] Requested leg index ${segmentIndex} but the rail quote ` +
        `card in the cart renders only ${segmentCount} leg(s). A one-way search produces a single ` +
        `segment — index 1 requires a round trip.`,
      );
    }

    const railClass = this.page
      .locator(SELECTORS.EU_RAIL_QUOTE_SEGMENT)
      .nth(segmentIndex)
      .locator(SELECTORS.EU_RAIL_QUOTE_SEGMENT_CLASS)
      .first();

    try {
      await railClass.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.getEuRailQuoteSegmentClass] The travel class of rail quote leg ${segmentIndex} did ` +
        `not become visible within ${timeout}ms. Either the quote card has not finished rendering, or ` +
        `this supplier's segment carries no class (eu-rail-quote-card.vue only prints getClass(segment) ` +
        `when the segment has one). Original: ${error.message}`,
      );
    }

    return ((await railClass.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Locator for the open mobile-barcode dialog of the booked rail quote.
   *
   * el-dialog is appended to <body>, and the trip overview keeps other dialogs mounted but hidden, so
   * the dialog is resolved by the barcode image only it contains and filtered to the visible one
   * rather than by position (an unscoped .first() would land on a stale hidden dialog).
   *
   * @returns {import('@playwright/test').Locator}
   */
  getEuRailMobileBarcodeDialog() {
    return this.page
      .locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_DIALOG)
      .filter({ visible: true })
      .filter({ has: this.page.locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_IMAGE) });
  }

  /**
   * Reports whether the "Mobile Barcode" button is rendered on the booked rail quote card.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<boolean>} True if the button is visible within the timeout
   */
  async isEuRailMobileBarcodeButtonVisible({ timeout = 30000 } = {}) {
    const button = this.page.locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the "Mobile Barcode" button on the booked rail quote card.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   */
  async clickEuRailMobileBarcodeButton({ timeout = 30000 } = {}) {
    const button = this.page.locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout });
    await button.click();
  }

  /**
   * Waits for the mobile-barcode dialog to be open.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   */
  async waitForEuRailMobileBarcodeDialog({ timeout = 30000 } = {}) {
    await this.getEuRailMobileBarcodeDialog().first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Reads the state of the barcode (QR) image shown in the open mobile-barcode dialog.
   *
   * The src is an external supplier URL rendered through app-img.vue, which silently swaps in its
   * bundled noImg.svg placeholder (alt "Image unavailable") when that URL fails to load — so a
   * visibility check alone would pass on a broken barcode. `loaded` reports whether the browser
   * actually decoded a bitmap, and is polled because the request is still in flight when the dialog
   * first becomes visible.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<{count: number, src: string, alt: string, loaded: boolean, naturalWidth: number}>}
   */
  async getEuRailMobileBarcodeImageState({ timeout = 30000 } = {}) {
    const images = this.getEuRailMobileBarcodeDialog().first().locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_IMAGE);
    const image = images.first();
    await image.waitFor({ state: 'visible', timeout });

    const readState = () =>
      image.evaluate((img) => ({
        src: img.getAttribute('src') ?? '',
        alt: img.getAttribute('alt') ?? '',
        loaded: img.complete && img.naturalWidth > 0,
        naturalWidth: img.naturalWidth,
      }));

    let state = await readState();
    const deadline = Date.now() + timeout;
    while (!state.loaded && Date.now() < deadline) {
      await this.page.waitForTimeout(500);
      state = await readState();
    }

    return { count: await images.count(), ...state };
  }

  /**
   * Closes the mobile-barcode dialog and waits for it to go away.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async closeEuRailMobileBarcodeDialog({ timeout = 15000 } = {}) {
    const dialog = this.getEuRailMobileBarcodeDialog().first();
    const closeButton = dialog.locator(SELECTORS.EU_RAIL_MOBILE_BARCODE_DIALOG_CLOSE).first();
    await closeButton.waitFor({ state: 'visible', timeout });
    await closeButton.click();
    // The dialog locator only matches while the dialog is visible, so once it closes the locator
    // resolves to nothing — which Playwright also treats as 'hidden'.
    await dialog.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Clicks the Fare Rules button for a rail quote-card segment (0 = outbound, 1 = return) in the
   * trip overview. Works whether the quote is active or cancelled — validates AB#79184, which
   * removed the cancelled-state disabled attribute on this button.
   * @param {number} segmentIndex - Zero-based segment/leg index.
   */
  async clickRailFareRulesButton(segmentIndex = 0) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(`[CartPage.clickRailFareRulesButton] "segmentIndex" must be a non-negative integer, got: ${segmentIndex}`);
    }
    const button = this.page.getByRole('button', { name: 'Fare Rules' }).nth(segmentIndex);
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  }

  /**
   * Reads the text content of the open rail Fare Rules dialog body.
   * @returns {Promise<string>}
   */
  async getRailFareRulesDialogText() {
    const body = this.page.locator(SELECTORS.RAIL_FARE_RULES_DIALOG_BODY).first();
    await body.waitFor({ state: 'visible', timeout: 15000 });
    return body.innerText();
  }

  /**
   * Closes the rail Fare Rules dialog and confirms it actually closed. Unlike the generic
   * closeTermsModal() — whose close-button selector is unscoped and can match an unrelated
   * dialog's close button elsewhere in the DOM, leaving this one open — this scopes the close
   * button to this dialog (`.el-dialog.app-dialog`) and waits for its body to detach/hide,
   * so a silently-failed close surfaces here instead of breaking the next segment's check.
   */
  async closeRailFareRulesDialog() {
    const body = this.page.locator(SELECTORS.RAIL_FARE_RULES_DIALOG_BODY).first();
    const closeButton = this.page.locator(SELECTORS.RAIL_FARE_RULES_DIALOG_CLOSE_BUTTON).first();

    await closeButton.waitFor({ state: 'visible', timeout: 10000 });
    await closeButton.click();

    try {
      await body.waitFor({ state: 'hidden', timeout: 10000 });
    } catch (error) {
      throw new Error(
        `[CartPage.closeRailFareRulesDialog] The Fare Rules dialog (${SELECTORS.RAIL_FARE_RULES_DIALOG_BODY}) ` +
          `was still visible ${10000}ms after clicking its close button (${SELECTORS.RAIL_FARE_RULES_DIALOG_CLOSE_BUTTON}). ` +
          `Original: ${error.message}`,
      );
    }
  }

  /**
   * Clicks the "Fare rules" link of a UK rail (Evolvi) quote-card segment (0 = first journey), in
   * the cart or in the trip overview after booking — uk-rail-quote-card.vue renders the same card
   * in both.
   * @param {number} segmentIndex - Zero-based segment/journey index.
   * @param {number} [timeout=30000]
   */
  async clickUkRailFareRulesButton(segmentIndex = 0, timeout = 30000) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(
        `[CartPage.clickUkRailFareRulesButton] "segmentIndex" must be a non-negative integer, got: ${segmentIndex}`,
      );
    }
    const button = this.page.locator(SELECTORS.UK_RAIL_QUOTE_FARE_RULES_BUTTON).nth(segmentIndex);
    try {
      await button.waitFor({ state: 'visible', timeout });
    } catch (err) {
      const buttonCount = await this.page
        .locator(SELECTORS.UK_RAIL_QUOTE_FARE_RULES_BUTTON)
        .count()
        .catch(() => -1);
      throw new Error(
        `[CartPage.clickUkRailFareRulesButton] No "Fare rules" link at segment index ${segmentIndex} ` +
          `on the UK rail quote card (selector: ${SELECTORS.UK_RAIL_QUOTE_FARE_RULES_BUTTON}, links ` +
          `found: ${buttonCount}). The quote may not be an Evolvi rail quote, or its card is not on ` +
          `screen yet. Original: ${err.message}`,
      );
    }
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

  /**
   * Reads the "Vendor Message" label and the value rendered next to it in the share email
   * preview iframe. Works for both the share quote and the share itinerary email templates
   * (see SHARE_EMAIL_VENDOR_MESSAGE_LABEL_TEXT for why the label is located by text).
   * @param {object} [options]
   * @param {number} [options.timeout=20000] - How long to keep scrolling the preview looking for the label
   * @returns {Promise<{label: string, content: string}|null>} The label and its value, or null if the label never appeared
   */
  async getVendorMessageFromSharePreview({ timeout = 20_000 } = {}) {
    return this.getLabeledContentFromSharePreview(SELECTORS.SHARE_EMAIL_VENDOR_MESSAGE_LABEL_TEXT, { timeout });
  }

  /**
   * Reads an arbitrary label and the value rendered next to it in the share email preview
   * iframe (e.g. "Vendor Message", or a fare rule category like "Conditions of Cancellation
   * and Exchange"). Works for both the share quote and the share itinerary email templates
   * (see SHARE_EMAIL_LABELED_CONTENT_CANDIDATES for why the label is located by text).
   * @param {string} labelText - The exact (case-insensitive) label text to locate
   * @param {object} [options]
   * @param {number} [options.timeout=20000] - How long to keep scrolling the preview looking for the label
   * @returns {Promise<{label: string, content: string}|null>} The label and its value, or null if the label never appeared
   */
  async getLabeledContentFromSharePreview(labelText, { timeout = 20_000 } = {}) {
    if (!labelText || typeof labelText !== 'string') {
      throw new Error(`[CartPage.getLabeledContentFromSharePreview] "labelText" must be a non-empty string, got: ${typeof labelText}`);
    }
    if (!Number.isFinite(timeout) || timeout <= 0) {
      throw new Error(`[CartPage.getLabeledContentFromSharePreview] "timeout" must be a positive number, got: ${timeout}`);
    }

    const deadline = Date.now() + timeout;
    try {
      await this._waitForShareIframeSrcdoc(timeout);
    } catch (err) {
      throw new Error(
        `[CartPage.getLabeledContentFromSharePreview] The share email preview iframe never rendered any content ` +
          `within ${timeout}ms. The share dialog may not be open, or the preview failed to load. Original: ${err.message}`
      );
    }

    const body = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first().contentFrame().locator('body');
    if (!(await body.count().catch(() => 0))) {
      throw new Error(
        `[CartPage.getLabeledContentFromSharePreview] The share email preview iframe has no body to read. ` +
          `The preview iframe is present but its document did not load.`
      );
    }

    while (true) {
      const found = await body.evaluate(
        (root, { labelText, candidateSelector }) => {
          const normalize = (value) => (value ?? '').replace(/\s+/g, ' ').trim();
          const wanted = labelText.toLowerCase();

          // Prefer the deepest (fewest descendants) element that starts with the label, so the
          // enclosing rows and tables that also contain the label text are not mistaken for it.
          const labelEl = Array.from(root.querySelectorAll(candidateSelector))
            .filter((element) => normalize(element.textContent).toLowerCase().startsWith(wanted))
            .sort((a, b) => b.querySelectorAll('*').length - a.querySelectorAll('*').length)
            .pop();
          if (!labelEl) return null;

          const label = normalize(labelEl.textContent);
          let content = normalize(labelEl.nextElementSibling?.textContent);
          if (!content) {
            const parentText = normalize(labelEl.parentElement?.textContent);
            // The label and its value can share one row/cell ("Vendor Message: some text") or
            // sit in two separate sibling rows (a fare rule category row followed by its own
            // rule-text row, with nothing else in the label's row). Only trust the same-parent
            // slice when it actually left something behind; an empty slice means the label's
            // row/cell held nothing else, so the value must be in the next sibling instead.
            const sameParentValue = parentText.toLowerCase().startsWith(wanted)
              ? normalize(parentText.slice(label.length))
              : '';
            content = sameParentValue || normalize(labelEl.parentElement?.nextElementSibling?.textContent);
          }
          return { label, content };
        },
        {
          labelText,
          candidateSelector: SELECTORS.SHARE_EMAIL_LABELED_CONTENT_CANDIDATES,
        }
      );
      if (found) return found;
      if (Date.now() >= deadline) return null;

      // The preview iframe re-renders its srcdoc while the dialog settles (and again when the
      // summary/detailed view switches), so a single read can land on the previous document.
      // Scroll-and-retry until the deadline, the same way sharePreviewContainsText does; the
      // fixed pause is the retry interval, not a wait for a known element.
      await this.scrollSharePreviewDown();
      await this.page.waitForTimeout(1000);
    }
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

  /**
   * Extracts the refundability status of the cancellation and change policies
   * from the currently rendered share email (price offer) preview. Works for
   * both the summary render (condensed "Cancellation Anytime / Non-Refundable")
   * and the detailed/body render (a "Cancellation fee" breakdown with a per-leg
   * refundability value) — the refundability status is the term shown in both
   * views, so it is the value that must match between them. Statuses are
   * de-duplicated (a round trip lists one value per leg in the detailed view).
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<{ cancellation: string[], changes: string[] }>} de-duped, sorted refundability statuses per policy
   */
  async getSharePreviewOfferChangeTerms({ timeout = 30000 } = {}) {
    const srcDoc = await this._waitForShareIframeSrcdoc(timeout);
    if (!srcDoc || srcDoc.trim().length === 0) {
      throw new Error(
        '[CartPage.getSharePreviewOfferChangeTerms] Share email preview iframe had no srcdoc content. ' +
          'The preview likely did not finish rendering. Ensure the share dialog is open and the preview has loaded.'
      );
    }

    const iframeLocator = this.page.locator(SELECTORS.SHARE_EMAIL_IFRAME).first();
    return await iframeLocator.evaluate((iframe) => {
      const html = iframe.getAttribute('srcdoc') || '';
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const REFUND = /(?:(?:non|partially|fully)[-\s]*)?refundable/gi;

      // The policy label ("Cancellation" / "Changes") is embedded in the term
      // text itself, not in a separate label cell, and the two views lay the
      // policy out differently. Anchor on the innermost element that names the
      // policy, climb to the block that also carries its refundability line,
      // then pull the refundability status(es) out of that isolated block.
      const refundStatusFor = (labelPattern) => {
        const matches = Array.from(doc.querySelectorAll('*'))
          .filter((el) => labelPattern.test(el.textContent || ''));
        if (!matches.length) return [];
        matches.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
        let node = matches[0];
        for (let hops = 0; hops < 5 && node.parentElement; hops++) {
          if (/refundable/i.test(node.textContent || '')) break;
          node = node.parentElement;
        }
        const found = (node.textContent || '').match(REFUND) || [];
        const normalized = found.map((s) => s.toLowerCase().replace(/[-\s]+/g, '-'));
        return Array.from(new Set(normalized)).sort();
      };

      return {
        cancellation: refundStatusFor(/\bcancellation\b/i),
        changes: refundStatusFor(/\bchanges?\b/i),
      };
    });
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
    const clickableVisible = await clickable.first().isVisible().catch(() => false);
    if (clickableVisible) {
      await clickable.first().click();
      return;
    }

    const addButton = this.page.locator(SELECTORS.LOYALTY_ADD_BUTTON).first();
    await addButton.waitFor({ state: 'visible', timeout: 15000 });
    await addButton.click();
  }

  /**
   * Expands the HOTEL loyalty-number extras section and waits for its card to render.
   * Scoped to `.quote-extras--loyalty-number` so it cannot open a sibling quote card's extras.
   * @param {number} [timeout=15000]
   */
  async clickHotelLoyaltyExtrasExpand({ timeout = 15000 } = {}) {
    const expander = this.page.locator(SELECTORS.HOTEL_LOYALTY_EXPAND).first();
    try {
      await expander.waitFor({ state: 'visible', timeout });
      await expander.click();
      await this.page.locator(SELECTORS.LOYALTY_CARD).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickHotelLoyaltyExtrasExpand] Could not expand the hotel loyalty-number extras ` +
        `(expander: ${SELECTORS.HOTEL_LOYALTY_EXPAND}, card: ${SELECTORS.LOYALTY_CARD}). ` +
        `Likely causes: the trip has no hotel quote, the hotel supplier does not expose a loyalty ` +
        `section, or the quote card had not finished rendering within ${timeout}ms. ` +
        `Original: ${err.message}`
      );
    }
  }

  // ===== CAR DRIVER LOYALTY EXTRAS (car-driver-loyalty.vue) =====

  /**
   * Expands the car driver loyalty extras section and waits for its loyalty input to render.
   * @param {number} [timeout=15000]
   */
  async clickCarDriverLoyaltyExpand({ timeout = 15000 } = {}) {
    const expander = this.page.locator(SELECTORS.CAR_DRIVER_LOYALTY_EXPAND).first();
    try {
      await expander.waitFor({ state: 'visible', timeout });
      await expander.click();
      await this.page
        .locator(SELECTORS.CAR_DRIVER_LOYALTY_INPUT)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarDriverLoyaltyExpand] Could not expand the car driver loyalty extras ` +
        `(expander: ${SELECTORS.CAR_DRIVER_LOYALTY_EXPAND}, input: ${SELECTORS.CAR_DRIVER_LOYALTY_INPUT}). ` +
        `Likely causes: the trip has no car quote, or the panel's data load (carService.getDriverId) ` +
        `left the skeleton in place beyond ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Fills the Loyalty ID input in the car driver loyalty panel.
   * @param {string} loyaltyNumber - Loyalty number to type
   * @param {number} [timeout=10000]
   */
  async fillCarDriverLoyaltyNumber(loyaltyNumber, timeout = 10000) {
    if (!loyaltyNumber || typeof loyaltyNumber !== 'string') {
      throw new Error(
        `[CartPage.fillCarDriverLoyaltyNumber] "loyaltyNumber" must be a non-empty string, got: ` +
        `${typeof loyaltyNumber} (${JSON.stringify(loyaltyNumber)})`
      );
    }
    const input = this.page.locator(SELECTORS.CAR_DRIVER_LOYALTY_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      await input.fill(loyaltyNumber);
    } catch (err) {
      throw new Error(
        `[CartPage.fillCarDriverLoyaltyNumber] Could not fill the car Loyalty ID input with ` +
        `"${loyaltyNumber}" (selector: ${SELECTORS.CAR_DRIVER_LOYALTY_INPUT}). Likely causes: the ` +
        `panel is not expanded, or the input is disabled because the "Use existing" toggle is on. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Selects a driver by visible name from the car driver loyalty panel's Driver dropdown.
   * The dropdown is a non-filterable el-select of trip passengers, so this opens it and clicks
   * the option matching the name rather than typing into a filter.
   * @param {string} driverName - Full driver name as shown in the dropdown (e.g. "Rafael Dinmark")
   * @param {number} [timeout=10000]
   */
  async selectCarDriverByName(driverName, timeout = 10000) {
    if (!driverName || typeof driverName !== 'string') {
      throw new Error(
        `[CartPage.selectCarDriverByName] "driverName" must be a non-empty string, got: ` +
        `${typeof driverName} (${JSON.stringify(driverName)})`
      );
    }
    const select = this.page.locator(SELECTORS.CAR_DRIVER_LOYALTY_DRIVER_SELECT).first();
    const option = this.page.locator('.el-select-dropdown__item').filter({ hasText: driverName }).first();
    try {
      await select.waitFor({ state: 'visible', timeout });
      await select.click();
      await option.waitFor({ state: 'visible', timeout });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.selectCarDriverByName] Could not select driver "${driverName}" from the Driver ` +
        `dropdown (select: ${SELECTORS.CAR_DRIVER_LOYALTY_DRIVER_SELECT}). Likely causes: the panel is ` +
        `not expanded, the quote does not require a driver so the field never rendered, or no trip ` +
        `passenger is named "${driverName}". Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "Use Existing" toggle in the car driver loyalty panel. Only rendered when the
   * quote already carries a membershipId, and starts ON (disabling the Loyalty ID input), so
   * this is used to switch it off before typing a new number.
   * @param {number} [timeout=10000]
   */
  async clickCarDriverLoyaltyUseExistingToggle(timeout = 10000) {
    const toggle = this.page.locator(SELECTORS.CAR_DRIVER_LOYALTY_USE_EXISTING_TOGGLE).first();
    try {
      await toggle.waitFor({ state: 'visible', timeout });
      await toggle.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarDriverLoyaltyUseExistingToggle] Could not click the "Use Existing" toggle ` +
        `(selector: ${SELECTORS.CAR_DRIVER_LOYALTY_USE_EXISTING_TOGGLE}). Likely causes: the panel is ` +
        `not expanded, or the toggle never rendered because the quote has no existing membershipId. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks Save in the car driver loyalty panel.
   * @param {number} [timeout=10000]
   */
  async clickCarDriverLoyaltySaveButton(timeout = 10000) {
    const btn = this.page.locator(SELECTORS.CAR_DRIVER_LOYALTY_SAVE_BUTTON).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarDriverLoyaltySaveButton] Could not click Save in the car driver loyalty ` +
        `panel (selector: ${SELECTORS.CAR_DRIVER_LOYALTY_SAVE_BUTTON}). Likely causes: the panel is ` +
        `not expanded, or a required Driver has not been selected so the button never rendered. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the success indicator on the car driver loyalty section after saving.
   * @param {number} [timeout=30000]
   */
  async waitForCarDriverLoyaltySuccessIcon(timeout = 30000) {
    try {
      await this.page
        .locator(SELECTORS.CAR_DRIVER_LOYALTY_SUCCESS_ICON)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCarDriverLoyaltySuccessIcon] The car driver loyalty section did not show ` +
        `its success indicator within ${timeout}ms (selector: ${SELECTORS.CAR_DRIVER_LOYALTY_SUCCESS_ICON}). ` +
        `Likely causes: carService.saveLoyaltyId returned an error (check for a red alert toast), or ` +
        `the loyalty number was rejected as invalid. Original: ${err.message}`
      );
    }
  }

  // ===== CAR BILLBACK EXTRAS (car-billback.vue) =====

  /**
   * Expands the car billback extras section and waits for its corporate billing number input to
   * render. The panel loads its data on open (`carService.getBillback`) behind an el-skeleton, so
   * waiting for the input — not just the card — is what proves the panel is usable.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async clickCarBillbackExpand({ timeout = 15000 } = {}) {
    const expander = this.page.locator(SELECTORS.CAR_BILLBACK_EXPAND).first();
    try {
      await expander.waitFor({ state: 'visible', timeout });
      await expander.click();
      await this.page
        .locator(SELECTORS.CAR_BILLBACK_BILLING_NUMBER_INPUT)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarBillbackExpand] Could not expand the car billback extras ` +
        `(expander: ${SELECTORS.CAR_BILLBACK_EXPAND}, input: ${SELECTORS.CAR_BILLBACK_BILLING_NUMBER_INPUT}). ` +
        `Likely causes: the trip has no car quote, the quote has no CarBillback validation so the ` +
        `section is never rendered, or the panel's data load (carService.getBillback) left the ` +
        `skeleton in place beyond ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the current value of the "Corporate billing number" input in the car billback panel.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} The trimmed input value ('' while the value is still loading)
   */
  async getCarBillbackBillingNumber({ timeout = 10000 } = {}) {
    const input = this.page.locator(SELECTORS.CAR_BILLBACK_BILLING_NUMBER_INPUT).first();
    try {
      await input.waitFor({ state: 'visible', timeout });
      return ((await input.inputValue()) || '').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getCarBillbackBillingNumber] Could not read the corporate billing number input ` +
        `(selector: ${SELECTORS.CAR_BILLBACK_BILLING_NUMBER_INPUT}). Likely cause: the car billback ` +
        `panel is not expanded. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the label text of the "Apply to this quote" checkbox in the car billback panel.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} Whitespace-collapsed label text
   */
  async getCarBillbackApplyCheckboxLabel({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CAR_BILLBACK_APPLY_CHECKBOX_LABEL).first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      return ((await label.textContent()) || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getCarBillbackApplyCheckboxLabel] Could not read the billback checkbox label ` +
        `(selector: ${SELECTORS.CAR_BILLBACK_APPLY_CHECKBOX_LABEL}). Likely cause: the car billback ` +
        `panel is not expanded. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "Apply to this quote" checkbox in the car billback panel. This TOGGLES the current
   * state — the caller owns asserting the resulting state.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   */
  async clickCarBillbackApplyCheckbox({ timeout = 10000 } = {}) {
    const inner = this.page.locator(SELECTORS.CAR_BILLBACK_APPLY_CHECKBOX_INNER).first();
    try {
      await inner.waitFor({ state: 'visible', timeout });
      await inner.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarBillbackApplyCheckbox] Could not click the "Apply to this quote" checkbox ` +
        `(selector: ${SELECTORS.CAR_BILLBACK_APPLY_CHECKBOX_INNER}). Likely causes: the car billback ` +
        `panel is not expanded, or the panel is in read-only mode (.is-read-only). ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the payment-method label of the car quote card ("Pre paid" or "Pay On Departure").
   * That column renders unconditionally on a loaded car quote card, so this read doubles as the
   * readiness gate a negative assertion needs: it must resolve BEFORE the absence of the
   * optional-payment alert can be trusted. Unlike getCarOptionalPaymentMessage this THROWS on
   * timeout — no anchor means the card never rendered, and "no alert" would be meaningless.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>} Whitespace-collapsed payment-method label
   */
  async getCarQuotePaymentMethodLabel({ timeout = 30000 } = {}) {
    const paymentMethod = this.page.locator(SELECTORS.CAR_QUOTE_CARD_PAYMENT_METHOD).first();
    try {
      await paymentMethod.waitFor({ state: 'visible', timeout });
      return ((await paymentMethod.textContent()) || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getCarQuotePaymentMethodLabel] The car quote card's payment-method column never ` +
        `rendered within ${timeout}ms (selector: ${SELECTORS.CAR_QUOTE_CARD_PAYMENT_METHOD}). Likely ` +
        `causes: the trip holds no car quote, the cart page has not finished loading, or the quote ` +
        `card is still in its isLoading state. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the optional-payment alert text shown on the car quote card. Returns '' when the alert is
   * not rendered — the caller decides whether its absence is a failure, so this must not throw on a
   * missing element (the negative scenario asserts it is absent).
   * @param {object} [options]
   * @param {number} [options.timeout=5000] - Kept short so a polling caller gets several attempts
   * @returns {Promise<string>} Whitespace-collapsed alert text, or '' if the alert is not displayed
   */
  async getCarOptionalPaymentMessage({ timeout = 5000 } = {}) {
    const message = this.page.locator(SELECTORS.CAR_OPTIONAL_FOP_MESSAGE).first();
    try {
      await message.waitFor({ state: 'visible', timeout });
    } catch {
      return '';
    }

    try {
      return ((await message.textContent()) || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getCarOptionalPaymentMessage] The optional-payment alert became visible but its ` +
        `text could not be read (selector: ${SELECTORS.CAR_OPTIONAL_FOP_MESSAGE}). Likely cause: the ` +
        `quote card re-rendered between the visibility wait and the read. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the car quote card's links row ("All-inclusive rate" / "More details") to render.
   * This is the render gate for the negative all-inclusive assertion — it THROWS on timeout,
   * because with no row there are no card links at all and "no all-inclusive link" would be
   * meaningless.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<void>}
   */
  async waitForCarQuoteMoreDetailsRow({ timeout = 30000 } = {}) {
    const row = this.page.locator(SELECTORS.CAR_QUOTE_MORE_DETAILS_ROW).first();
    try {
      await row.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCarQuoteMoreDetailsRow] The car quote card's links row never rendered ` +
        `within ${timeout}ms (selector: ${SELECTORS.CAR_QUOTE_MORE_DETAILS_ROW}). Likely causes: the ` +
        `trip holds no car quote, the cart page has not finished loading, or the quote card is still ` +
        `in its isLoading state. Original: ${err.message}`
      );
    }
  }

  /**
   * Counts the visible "All-inclusive rate" links anywhere on the page. Returns 0 when the link is
   * not rendered — the caller decides whether that is a failure, so this must not throw on a
   * missing element (the negative scenario asserts it is absent).
   * @returns {Promise<number>} Number of visible "All-inclusive rate" links on the page
   */
  async getAllInclusiveRateLinkCount() {
    return this.page.locator(SELECTORS.ALL_INCLUSIVE_RATE_LINK).count();
  }

  // ===== SUNNYCARS ADD LOCATION EXTRAS (car-sunnycars-add-location.vue) =====

  /**
   * Expands the SunnyCars "Add location" extras section and waits for its pick-up/drop-off selects
   * to render. The panel loads its locations on open (`carService.getLocation`) behind an
   * el-skeleton, so waiting for `.inputs` — not just the card — is what proves the panel is usable.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async clickCarAddLocationExpand({ timeout = 15000 } = {}) {
    const expander = this.page.locator(SELECTORS.CAR_ADD_LOCATION_EXPAND).first();
    try {
      await expander.waitFor({ state: 'visible', timeout });
      await expander.click();
      await this.page.locator(SELECTORS.CAR_ADD_LOCATION_INPUTS).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickCarAddLocationExpand] Could not expand the SunnyCars "Add location" extras ` +
        `(expander: ${SELECTORS.CAR_ADD_LOCATION_EXPAND}, inputs: ${SELECTORS.CAR_ADD_LOCATION_INPUTS}). ` +
        `Likely causes: the trip has no SunnyCars car quote, the quote has no CarSunnyAddLocation ` +
        `validation so the section is never rendered, or the panel's data load ` +
        `(carService.getLocation) left the skeleton in place beyond ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens the pick-up location dropdown in the SunnyCars "Add location" panel and waits for at
   * least one option to render.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async openCarAddLocationPickupDropdown({ timeout = 15000 } = {}) {
    await this._openCarAddLocationDropdown(SELECTORS.CAR_ADD_LOCATION_PICKUP_SELECT, 'pick-up', { timeout });
  }

  /**
   * Opens the drop-off location dropdown in the SunnyCars "Add location" panel and waits for at
   * least one option to render.
   *
   * The drop-off select is disabled until a pick-up location is chosen, and choosing one refetches
   * the drop-off list (`carService.getDropOffLocations`), so this first waits for the select to
   * leave the `is-disabled` state — clicking it earlier is a silent no-op.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async openCarAddLocationDropoffDropdown({ timeout = 15000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT_ENABLED)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.openCarAddLocationDropoffDropdown] The drop-off location select never became enabled ` +
        `(selector: ${SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT_ENABLED}). It stays disabled until a pick-up ` +
        `location is selected, and the drop-off list is refetched from the server after that ` +
        `(carService.getDropOffLocations) — so either no pick-up location was selected first, or that ` +
        `request did not return within ${timeout}ms. Original: ${err.message}`
      );
    }

    await this._openCarAddLocationDropdown(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT, 'drop-off', { timeout });
  }

  /**
   * Resolves the option selector for ONE "Add location" field, scoped to that field's own popper.
   *
   * Both selects render their options into body-level poppers that share the `app-select-popper`
   * class, and both poppers stay mounted once used — so a document-wide option selector silently
   * resolves to whichever popper comes first in the DOM (the pick-up one). Element-Plus links a
   * select to its popper through `aria-describedby` on `.el-select__wrapper`; that attribute is the
   * only per-field anchor available, so the id is read at runtime and used to scope the options.
   *
   * @param {string} selectSelector - One of the CAR_ADD_LOCATION_*_SELECT selectors
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} Selector matching only that field's visible options
   */
  async _getCarAddLocationOptionSelector(selectSelector, fieldLabel, { timeout = 15000 } = {}) {
    const wrapperSelector = `${selectSelector}${SELECTORS.CAR_ADD_LOCATION_SELECT_WRAPPER_SUFFIX}`;
    let popperId;
    try {
      // The attribute is added when the select first builds its popper, so poll rather than read
      // once — a select that has never been opened has no `aria-describedby` yet.
      const handle = await this.page.waitForFunction(
        (selector) => document.querySelector(selector)?.getAttribute('aria-describedby') || null,
        wrapperSelector,
        { timeout }
      );
      popperId = await handle.jsonValue();
      await handle.dispose();
    } catch (err) {
      throw new Error(
        `[CartPage._getCarAddLocationOptionSelector] Could not resolve the ${fieldLabel} location ` +
        `dropdown's popper id (wrapper: ${wrapperSelector}). Likely causes: the "Add location" panel ` +
        `is not expanded, or the select never opened so Element-Plus never linked it to a popper. ` +
        `Original: ${err.message}`
      );
    }

    return `[id="${popperId}"] ${SELECTORS.CAR_ADD_LOCATION_DROPDOWN_ITEM}`;
  }

  /**
   * Shared open-and-wait for the two "Add location" app-selects.
   * @param {string} selectSelector
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async _openCarAddLocationDropdown(selectSelector, fieldLabel, { timeout = 15000 } = {}) {
    const select = this.page.locator(selectSelector).first();
    try {
      await select.waitFor({ state: 'visible', timeout });
      await select.click();
    } catch (err) {
      throw new Error(
        `[CartPage._openCarAddLocationDropdown] Could not click the ${fieldLabel} location select ` +
        `(selector: ${selectSelector}). Likely causes: the "Add location" panel is not expanded, or ` +
        `the select is still disabled. Original: ${err.message}`
      );
    }

    const optionSelector = await this._getCarAddLocationOptionSelector(selectSelector, fieldLabel, { timeout });
    try {
      await this.page.locator(optionSelector).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage._openCarAddLocationDropdown] Could not open the ${fieldLabel} location dropdown ` +
        `(select: ${selectSelector}, options: ${optionSelector}). Likely causes: the click did not ` +
        `open the popper, or the supplier returned no ${fieldLabel} locations for this quote so it ` +
        `opened empty. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the label text of every option in one "Add location" dropdown, which must be open.
   * @param {string} selectSelector - The field whose options to read (CAR_ADD_LOCATION_*_SELECT)
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string[]>} Whitespace-collapsed option labels, in DOM order
   */
  async _getCarAddLocationDropdownOptionTexts(selectSelector, fieldLabel, { timeout = 15000 } = {}) {
    const optionSelector = await this._getCarAddLocationOptionSelector(selectSelector, fieldLabel, { timeout });
    const options = this.page.locator(optionSelector);
    try {
      await options.first().waitFor({ state: 'visible', timeout });
      const texts = await options.allTextContents();
      return texts.map((text) => (text || '').replace(/\s+/g, ' ').trim());
    } catch (err) {
      throw new Error(
        `[CartPage._getCarAddLocationDropdownOptionTexts] Could not read the ${fieldLabel} location ` +
        `dropdown's options (selector: ${optionSelector}). Likely cause: the dropdown is not open — ` +
        `it closes as soon as an option is picked. Original: ${err.message}`
      );
    }
  }

  /**
   * Reports whether ONE "Add location" dropdown currently shows its options on screen.
   * Used to decide whether that dropdown still needs opening — the popper can close on its own when
   * the panel re-renders, and reopening is cheaper than failing the step. Never reports the *other*
   * field's open popper as this one's. Resolving the popper costs up to 2s for a select that has
   * never been opened (no `aria-describedby` yet); that case answers false rather than throwing.
   * @param {string} selectSelector - The field to check (CAR_ADD_LOCATION_*_SELECT)
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @returns {Promise<boolean>}
   */
  async _isCarAddLocationDropdownOpen(selectSelector, fieldLabel) {
    // A select that was never opened has no popper at all — that is "closed", not an error.
    const optionSelector = await this._getCarAddLocationOptionSelector(selectSelector, fieldLabel, { timeout: 2000 })
      .catch(() => null);
    if (!optionSelector) return false;

    return this.page.locator(optionSelector).first().isVisible().catch(() => false);
  }

  /**
   * Clicks the first option in ONE "Add location" dropdown, which must be open.
   * @param {string} selectSelector - The field to pick from (CAR_ADD_LOCATION_*_SELECT)
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The whitespace-collapsed label of the option that was clicked
   */
  async _clickFirstCarAddLocationDropdownOption(selectSelector, fieldLabel, { timeout = 15000 } = {}) {
    const optionSelector = await this._getCarAddLocationOptionSelector(selectSelector, fieldLabel, { timeout });
    const option = this.page.locator(optionSelector).first();
    try {
      await option.waitFor({ state: 'visible', timeout });
      const label = ((await option.textContent()) || '').replace(/\s+/g, ' ').trim();
      // dispatchEvent, not click(): a real click first scrolls the option into view, and that scroll
      // makes the body-level popper reposition and close before the click lands — the option ends up
      // reported as unstable, then invisible, for the full timeout. Dispatching the event hits the
      // el-option's own @click handler directly, with no scrolling or hit-testing.
      await option.dispatchEvent('click');
      return label;
    } catch (err) {
      throw new Error(
        `[CartPage._clickFirstCarAddLocationDropdownOption] Could not select the first ${fieldLabel} ` +
        `location option (selector: ${optionSelector}). Likely cause: the dropdown is not open, or ` +
        `it rendered with no options. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the first option in the open pick-up location dropdown.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The label of the option that was clicked
   */
  async clickFirstCarAddLocationPickupOption({ timeout = 15000 } = {}) {
    return this._clickFirstCarAddLocationDropdownOption(SELECTORS.CAR_ADD_LOCATION_PICKUP_SELECT, 'pick-up', { timeout });
  }

  /**
   * Clicks the first option in the open drop-off location dropdown.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string>} The label of the option that was clicked
   */
  async clickFirstCarAddLocationDropoffOption({ timeout = 15000 } = {}) {
    return this._clickFirstCarAddLocationDropdownOption(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT, 'drop-off', { timeout });
  }

  /**
   * Reads every option label in the open drop-off location dropdown.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<string[]>}
   */
  async getCarAddLocationDropoffOptionTexts({ timeout = 15000 } = {}) {
    return this._getCarAddLocationDropdownOptionTexts(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT, 'drop-off', { timeout });
  }

  /**
   * Reports whether the drop-off location dropdown is currently showing its options.
   * @returns {Promise<boolean>}
   */
  async isCarAddLocationDropoffDropdownOpen() {
    return this._isCarAddLocationDropdownOpen(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECT, 'drop-off');
  }

  /**
   * Reads the selected value text of the pick-up location select.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} Whitespace-collapsed text ('' while nothing is selected)
   */
  async getCarAddLocationPickupSelectedText({ timeout = 10000 } = {}) {
    return this._getCarAddLocationSelectedText(SELECTORS.CAR_ADD_LOCATION_PICKUP_SELECTED_TEXT, 'pick-up', { timeout });
  }

  /**
   * Reads the selected value text of the drop-off location select.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} Whitespace-collapsed text ('' while nothing is selected)
   */
  async getCarAddLocationDropoffSelectedText({ timeout = 10000 } = {}) {
    return this._getCarAddLocationSelectedText(SELECTORS.CAR_ADD_LOCATION_DROPOFF_SELECTED_TEXT, 'drop-off', { timeout });
  }

  /**
   * Shared selected-value read for the two "Add location" app-selects.
   * @param {string} textSelector
   * @param {string} fieldLabel - Human name of the field, for the error message
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>}
   */
  async _getCarAddLocationSelectedText(textSelector, fieldLabel, { timeout = 10000 } = {}) {
    const value = this.page.locator(textSelector).first();
    try {
      await value.waitFor({ state: 'visible', timeout });
      return ((await value.textContent()) || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage._getCarAddLocationSelectedText] Could not read the selected ${fieldLabel} location ` +
        `(selector: ${textSelector}). Likely cause: the "Add location" panel is not expanded. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the green success icon on the collapsed SunnyCars "Add location" row.
   * Unlike the flight extras, the car quote card has no outer extras collapse, so no reopen cycle
   * is needed — the icon appears on its own once the save request comes back and the panel closes.
   * @param {object} [options]
   * @param {number} [options.timeout=20000]
   */
  async waitForCarAddLocationGreenIcon({ timeout = 20000 } = {}) {
    const icon = this.page.locator(SELECTORS.CAR_ADD_LOCATION_SUCCESS_ICON).first();
    try {
      await icon.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCarAddLocationGreenIcon] The "Add location" green success icon never became ` +
        `visible (selector: ${SELECTORS.CAR_ADD_LOCATION_SUCCESS_ICON}). Likely causes: the panel is ` +
        `still open because the save did not go through (the icon only renders on the collapsed row), ` +
        `or the CarSunnyAddLocation validation did not turn OK so extras-layout kept showing the ` +
        `red/yellow state icon instead. Original: ${err.message}`
      );
    }
  }

  async clickLoyaltyAddButton() {
    const addButton = this.page.locator(SELECTORS.LOYALTY_ADD_BUTTON).first();
    await addButton.waitFor({ state: 'visible', timeout: 15000 });
    await addButton.click();
    // Wait for the input field to appear after clicking Add
    const input = this.page.locator(SELECTORS.LOYALTY_NUMBER_INPUT).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
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
   * Clicks the "Existing" radio button in the loyalty number section.
   */
  async selectExistingLoyaltyRadio() {
    try {
      const radio = this.page.locator(SELECTORS.LOYALTY_EXISTING_RADIO);
      await radio.waitFor({ state: 'visible', timeout: 10000 });
      await radio.click();
    } catch (err) {
      throw new Error(
        `[CartPage.selectExistingLoyaltyRadio] Could not click the "Existing" radio button (selector: ${SELECTORS.LOYALTY_EXISTING_RADIO}). ` +
        `The radio may be disabled because no loyalty numbers exist in the traveler profile. Original: ${err.message}`
      );
    }
  }

  /**
   * Selects an existing loyalty option from the dropdown by matching text.
   * @param {string} loyaltyText - Text to match in the dropdown (e.g. "6C - 456789")
   */
  async selectExistingLoyaltyOption(loyaltyText) {
    try {
      const dropdown = this.page.locator(SELECTORS.LOYALTY_EXISTING_DROPDOWN);
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click();
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: loyaltyText }).first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.selectExistingLoyaltyOption] Could not select loyalty option "${loyaltyText}" from the existing loyalty dropdown. ` +
        `The dropdown may not have opened or the option doesn't exist in the traveler profile. Original: ${err.message}`
      );
    }
  }

  async selectFirstExistingLoyaltyOption() {
    try {
      const dropdown = this.page.locator(SELECTORS.LOYALTY_EXISTING_DROPDOWN);
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click();
      const option = this.page.locator(SELECTORS.DROPDOWN_OPTION).first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
    } catch (err) {
      throw new Error(
        `[CartPage.selectFirstExistingLoyaltyOption] Could not select the first loyalty option from the existing loyalty dropdown. ` +
        `The dropdown may not have opened or no options are available in the traveler profile. Original: ${err.message}`
      );
    }
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
   * Scrolls to the loyalty section and waits for the green success icon to appear.
   * Used for pre-populated scenarios where loyalty is fetched from API after room is added.
   */
  async waitForLoyaltyPrepopulatedIcon() {
    const section = this.page.locator(SELECTORS.LOYALTY_SECTION);
    try {
      await section.scrollIntoViewIfNeeded();
    } catch (err) {
      throw new Error(
        `[CartPage.waitForLoyaltyPrepopulatedIcon] Could not scroll to loyalty section (selector: ${SELECTORS.LOYALTY_SECTION}). ` +
        `The cart page may not have loaded the extras sections yet. Original: ${err.message}`
      );
    }
    try {
      await this.page.locator(SELECTORS.LOYALTY_SUCCESS_ICON)
        .waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForLoyaltyPrepopulatedIcon] Green success icon not visible in loyalty section within 60s ` +
        `(selector: ${SELECTORS.LOYALTY_SUCCESS_ICON}). The loyalty number may not have been pre-populated by the ` +
        `master chain — check that the traveler has loyalty numbers configured for this hotel chain. Original: ${err.message}`
      );
    }
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
  // EU RAIL LOYALTY PROGRAM (loyalty-program.vue)
  // ========================================

  /**
   * Clicks a tab by its visible label inside the EU Rail loyalty program section
   * (e.g. "Use Existing" or "Enter New").
   * @param {string} tabLabel - Visible tab label text
   */
  async clickEuRailLoyaltyTab(tabLabel) {
    if (!tabLabel || typeof tabLabel !== 'string') throw new Error('tabLabel must be a non-empty string');
    const tab = this.page.locator(SELECTORS.EURAIL_LOYALTY_TAB).filter({ hasText: tabLabel }).first();
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
  }

  /**
   * Returns whether the EU Rail loyalty program panel is currently expanded (its tabs are rendered).
   * @param {object} [options]
   * @param {number} [options.timeout=0] Time to allow the tabs to appear before answering false.
   * @returns {Promise<boolean>}
   */
  async isEuRailLoyaltyPanelOpen({ timeout = 0 } = {}) {
    const tab = this.page.locator(SELECTORS.EURAIL_LOYALTY_TAB).first();
    if (!timeout) return tab.isVisible();
    return tab.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false);
  }

  /**
   * Expands the EU RAIL loyalty-program extras section via its own expander and waits for the
   * "Use Existing"/"Enter New" tabs to render.
   * @param {number} [timeout=15000]
   */
  async clickEuRailLoyaltyExtrasExpand({ timeout = 15000 } = {}) {
    const expander = this.page.locator(SELECTORS.EURAIL_LOYALTY_EXPAND).first();
    try {
      await expander.waitFor({ state: 'visible', timeout });
      await expander.click();
      await this.page.locator(SELECTORS.EURAIL_LOYALTY_TAB).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.clickEuRailLoyaltyExtrasExpand] Could not expand the EU Rail loyalty-program extras ` +
        `(expander: ${SELECTORS.EURAIL_LOYALTY_EXPAND}, tabs: ${SELECTORS.EURAIL_LOYALTY_TAB}). ` +
        `Likely causes: the trip has no EU Rail quote, or the quote card had not finished rendering ` +
        `within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Opens the "Use Existing" dropdown (app-select) in the EU Rail loyalty program section.
   */
  async openEuRailExistingLoyaltyDropdown() {
    const select = this.page.locator(SELECTORS.EURAIL_LOYALTY_EXISTING_SELECT);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
  }

  /**
   * Returns the list of visible option labels from the currently open EU Rail loyalty dropdown.
   * @returns {Promise<string[]>}
   */
  async getEuRailLoyaltyDropdownOptionTexts() {
    const options = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM);
    await options.first().waitFor({ state: 'visible', timeout: 10000 });
    return options.allTextContents();
  }

  /**
   * Selects the first option from the currently open EU Rail existing-loyalty dropdown.
   */
  async selectFirstEuRailLoyaltyOption() {
    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
   * Selects an option from the currently open EU Rail existing-loyalty dropdown by visible label text.
   * @param {string} optionText - Text to match in the dropdown option (e.g. a vendor/program name)
   */
  async selectEuRailLoyaltyOption(optionText) {
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    // force: true — see selectFirstEuRailLoyaltyVendor() above re: hover-tracking instability
    await option.click({ force: true });
  }

  /**
   * Gets the current value shown in the EU Rail card number input
   * (shared by both "Use Existing" pre-fill and "Enter New" tabs).
   * @returns {Promise<string>}
   */
  async getEuRailLoyaltyNumberInputValue() {
    const input = this.page.locator(SELECTORS.EURAIL_LOYALTY_NUMBER_INPUT);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    return input.inputValue();
  }

  /**
   * Fills the EU Rail loyalty card number input.
   * @param {string} cardNumber - Card number to enter
   */
  async fillEuRailLoyaltyNumber(cardNumber) {
    if (typeof cardNumber !== 'string') throw new Error('cardNumber must be a string, got: ' + typeof cardNumber);
    const input = this.page.locator(SELECTORS.EURAIL_LOYALTY_NUMBER_INPUT);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(cardNumber);
  }

  /**
   * Selects a vendor/loyalty program from the "Enter New" tab vendor dropdown by visible label text.
   * @param {string} vendorText - Text to match in the dropdown option
   */
  async selectEuRailLoyaltyVendor(vendorText) {
    if (!vendorText || typeof vendorText !== 'string') throw new Error('vendorText must be a non-empty string');
    const select = this.page.locator(SELECTORS.EURAIL_LOYALTY_VENDOR_SELECT);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).filter({ hasText: vendorText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    // force: true — see selectFirstEuRailLoyaltyVendor() below re: hover-tracking instability.
    // Without it the option reports "not stable" indefinitely and the popper eventually closes,
    // leaving every remaining retry to fail as "not visible" until the click times out.
    await option.click({ force: true });
  }

  /**
   * Selects the first vendor/loyalty program from the "Enter New" tab vendor dropdown.
   * @returns {Promise<string>} The text of the selected vendor option
   */
  async selectFirstEuRailLoyaltyVendor() {
    const select = this.page.locator(SELECTORS.EURAIL_LOYALTY_VENDOR_SELECT);
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await option.textContent()).trim();
    // force: true — Element UI's hover-tracking class on this option keeps re-triggering on
    // Playwright's own actionability re-checks, making the element permanently report as "not
    // stable" (never a real animation, just a hover-highlight loop); force bypasses that check.
    await option.click({ force: true });
    return text;
  }

  /**
   * Selects the loyalty program at the given zero-based position from whichever EU Rail loyalty
   * dropdown is currently visible — the "Enter New" tab's vendor dropdown, or the "Use Existing"
   * tab's stored-program dropdown — so the same step works regardless of which tab is active.
   * @param {number} index - Zero-based position of the option to select
   * @returns {Promise<string>} The text of the selected option
   */
  async selectEuRailLoyaltyVendorByIndex(index) {
    if (typeof index !== 'number' || index < 0) throw new Error('index must be a non-negative number');
    const vendorSelect = this.page.locator(SELECTORS.EURAIL_LOYALTY_VENDOR_SELECT);
    const existingSelect = this.page.locator(SELECTORS.EURAIL_LOYALTY_EXISTING_SELECT);
    const select = (await vendorSelect.isVisible()) ? vendorSelect : existingSelect;
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).nth(index);
    await option.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await option.textContent()).trim();
    // force: true — see selectFirstEuRailLoyaltyVendor() above re: hover-tracking instability
    await option.click({ force: true });
    return text;
  }

  /**
   * Selects the loyalty program whose text contains the given substring, from whichever EU Rail
   * loyalty dropdown is currently visible — the "Enter New" tab's vendor dropdown, or the "Use
   * Existing" tab's stored-program dropdown — so the same step works regardless of active tab.
   * @param {string} optionText - Substring to match (case-insensitive) in the dropdown option
   * @returns {Promise<string>} The text of the selected option
   */
  async selectEuRailLoyaltyVendorByText(optionText) {
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const vendorSelect = this.page.locator(SELECTORS.EURAIL_LOYALTY_VENDOR_SELECT);
    const existingSelect = this.page.locator(SELECTORS.EURAIL_LOYALTY_EXISTING_SELECT);
    const select = (await vendorSelect.isVisible()) ? vendorSelect : existingSelect;
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.click();
    // Scope to the most-recently-opened popper (.last()) rather than a flat, page-wide item
    // list: a select opened earlier in the same scenario can leave its popper matching
    // ":visible" for a moment while it fades out, and a global item list would then mix its
    // stale options in ahead of this select's freshly-opened ones (see EURAIL_LOYALTY_DROPDOWN_PANEL).
    const dropdown = this.page.locator(SELECTORS.EURAIL_LOYALTY_DROPDOWN_PANEL).last();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    const option = dropdown.locator(SELECTORS.DROPDOWN_OPTION).filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await option.textContent()).trim();
    // force: true — see selectFirstEuRailLoyaltyVendor() above re: hover-tracking instability
    await option.click({ force: true });
    return text;
  }

  /**
   * Clicks the Save button in the EU Rail loyalty program section.
   * Role-based (not CSS class) because the deployed button markup does not
   * reliably expose a stable class (verified against the live app).
   */
  async clickEuRailLoyaltySaveButton() {
    const btn = this.page
      .locator(SELECTORS.EURAIL_LOYALTY_SECTION)
      .getByRole('button', { name: 'Save', exact: true });
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  /**
   * Gets the validation message text shown under the EU Rail loyalty card number input.
   * @returns {Promise<string>}
   */
  async getEuRailLoyaltyValidationMessageText() {
    const msg = this.page.locator(SELECTORS.EURAIL_LOYALTY_VALIDATION_MSG);
    await msg.waitFor({ state: 'visible', timeout: 10000 });
    return (await msg.textContent()).trim();
  }

  /**
   * Checks whether the EU Rail loyalty card number validation message is visible.
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isEuRailLoyaltyValidationMessageVisible(timeout = 5000) {
    try {
      await this.page.locator(SELECTORS.EURAIL_LOYALTY_VALIDATION_MSG).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
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
   * Reads the hotel supplier confirmation number VALUE from the cart booking-confirm section
   * (hotel-quote-card.vue → <span class="confirmation-number">). Reuses EHOTEL_CONFIRMATION_NUMBER to
   * scope to the "Confirmation Number:" <p> — so the separate Pincode <p> (whose span reuses the same
   * class) is not read — then returns the bare value from its inner value span. Falls back to the <p>
   * text with the "Confirmation Number:" label prefix stripped when the value span is absent.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>} The trimmed confirmation number value (no label, no pincode)
   */
  async getSupplierConfirmationNumberFromCart({ timeout = 30000 } = {}) {
    try {
      const confirmationParagraph = this.page.locator(SELECTORS.EHOTEL_CONFIRMATION_NUMBER).first();
      await confirmationParagraph.waitFor({ state: 'visible', timeout });

      // Bare value lives in the inner <span class="confirmation-number">, avoiding the label text and
      // the separate Pincode span (which reuses the same class in a different <p>).
      const valueSpan = confirmationParagraph.locator(SELECTORS.EHOTEL_CONFIRMATION_NUMBER_VALUE).first();
      if ((await valueSpan.count()) > 0) {
        return ((await valueSpan.textContent()) ?? '').trim();
      }

      // Fallback: no value span — read the whole <p> and strip the "Confirmation Number:" label prefix.
      const paragraphText = ((await confirmationParagraph.textContent()) ?? '').trim();
      return paragraphText.replace(/^\s*Confirmation Number:\s*/i, '').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getSupplierConfirmationNumberFromCart] Could not read the hotel supplier confirmation number ` +
        `(selector: ${SELECTORS.EHOTEL_CONFIRMATION_NUMBER}) from the cart booking-confirm section within ${timeout}ms. ` +
        `The booking may not be confirmed yet, or the supplier returned no confirmation number. Original: ${err.message}`
      );
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
   * Returns the visible text of the open flight details drawer body, for callers that must
   * compare wording rather than wait on a known string.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getFlightDetailsDrawerText({ timeout = 15000 } = {}) {
    const body = this.page.locator(SELECTORS.FLIGHT_DETAILS_DRAWER_BODY).first();
    await body.waitFor({ state: 'visible', timeout });
    return body.innerText();
  }

  /**
   * Scrolls the flight details drawer body to the bottom so the return-leg
   * section is brought into view.
   * @param {{ timeout?: number }} options
   */
  async scrollFlightDetailsDrawerToBottom({ timeout = 15000 } = {}) {
    const body = this.page.locator(SELECTORS.FLIGHT_DETAILS_DRAWER_BODY).first();
    await body.waitFor({ state: 'visible', timeout });
    await body.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  }

  /**
   * Waits for a cabin/brand text to be visible inside the open flight details
   * drawer, at the given zero-based occurrence (0 = outbound leg, 1 = return leg).
   * @param {string} expectedText - e.g. "Premium Economy (P)"
   * @param {number} occurrenceIndex - Zero-based index of the occurrence
   * @param {{ timeout?: number }} options
   */
  async waitForCabinTextInFlightDetailsDrawer(expectedText, occurrenceIndex = 0, { timeout = 15000 } = {}) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string, got: ' + expectedText);
    }
    if (!Number.isInteger(occurrenceIndex) || occurrenceIndex < 0) {
      throw new Error(`occurrenceIndex must be a non-negative integer, got: ${occurrenceIndex}`);
    }
    const target = this.page.locator(SELECTORS.FLIGHT_DETAILS_DRAWER_CABIN_TEXT(expectedText)).nth(occurrenceIndex);
    await target.waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for a baggage advisory text to be visible inside the open flight
   * details drawer body. Uses a text-based selector scoped to the drawer body
   * to avoid brittle positional selectors.
   *
   * @param {string} expectedText - Baggage descriptor (e.g. "1 x hold bag (15kg)")
   * @param {{ timeout?: number }} options
   */
  async waitForBaggageTextInFlightDetailsDrawer(expectedText, { timeout = 15000 } = {}) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string, got: ' + expectedText);
    }
    const target = this.page.locator(SELECTORS.FLIGHT_DETAILS_DRAWER_BAGGAGE_TEXT(expectedText)).first();
    await target.waitFor({ state: 'visible', timeout });
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

  // ===== QUOTE SUMMARY PRODUCT ICON =====

  /**
   * Checks if the flight product icon is visible in the cart trip-summary sidebar.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isFlightQuoteSummaryIconVisible(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.FLIGHT_QUOTE_SUMMARY_ICON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the hotel product icon is visible in the cart trip-summary sidebar.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isHotelQuoteSummaryIconVisible(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.HOTEL_QUOTE_SUMMARY_ICON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the rail quote's line in the cart trip-summary sidebar shows a "Seating" price
   * row. Waits for the rail line itself first, so a `false` here means "the rail quote is on
   * screen and carries no seating price" rather than "the sidebar had not rendered yet".
   * @param {number} [timeout=30000] - Max wait for the rail quote line to render
   * @param {number} [seatPriceTimeout=5000] - How long to give the seating row to appear
   * @returns {Promise<boolean>}
   */
  async isRailQuoteSummarySeatPriceVisible(timeout = 30000, seatPriceTimeout = 5000) {
    const railQuoteLine = this.page.locator(SELECTORS.RAIL_QUOTE_SUMMARY_ITEM).first();
    await railQuoteLine.waitFor({ state: 'visible', timeout });
    await railQuoteLine.scrollIntoViewIfNeeded();

    try {
      await this.page
        .locator(SELECTORS.RAIL_QUOTE_SUMMARY_SEAT_PRICE)
        .first()
        .waitFor({ state: 'visible', timeout: seatPriceTimeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads the "Seating" row's text from the rail quote's cart trip-summary line, e.g.
   * "Seating €9.80" — used to report what was actually displayed when it should not have been.
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getRailQuoteSummarySeatPriceText(timeout = 10000) {
    const seatPriceRow = this.page.locator(SELECTORS.RAIL_QUOTE_SUMMARY_SEAT_PRICE).first();
    await seatPriceRow.waitFor({ state: 'visible', timeout });
    return (await seatPriceRow.innerText()).replace(/\s+/g, ' ').trim();
  }

  // ===== RAIL SEATING EXTRAS (eu-rail-seats.vue) =====

  /**
   * Clicks the rail seating extras row's Add/Edit/View trigger to expand the panel.
   * @param {number} [timeout=10000] - Max wait for the trigger to render
   * @returns {Promise<string>} The trigger's label, so callers can report which state it was in
   */
  async clickRailSeatingExtrasOpenButton(timeout = 10000) {
    const openButton = this.page.locator(SELECTORS.RAIL_SEATING_EXTRAS_OPEN_BUTTON).first();

    try {
      await openButton.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.clickRailSeatingExtrasOpenButton] The rail seating extras row's Add/Edit/View ` +
        `trigger did not appear within ${timeout}ms. The Seating section only renders for suppliers ` +
        `offering seats (eu-rail-seats.vue requires isPaidSeatsAvailable / isBeneMooveRail / ` +
        `isDistribusion), so the quote in the cart may not offer seat selection at all. ` +
        `Original: ${error.message}`,
      );
    }

    const label = (await openButton.innerText()).replace(/\s+/g, ' ').trim();
    await openButton.scrollIntoViewIfNeeded();
    await openButton.click();
    return label;
  }

  /**
   * Waits for the expanded rail seating panel to be ready to read — the card visible and the
   * loading skeleton gone, so a seat row that has not loaded yet is never mistaken for absent.
   * @param {number} [timeout=30000] - Max wait for the panel and its seat data
   * @returns {Promise<void>}
   */
  async waitForRailSeatingExtrasCard(timeout = 30000) {
    try {
      await this.page
        .locator(SELECTORS.RAIL_SEATING_EXTRAS_CARD)
        .first()
        .waitFor({ state: 'visible', timeout });
      await this.page
        .locator(SELECTORS.RAIL_SEATING_LOADING_SKELETON)
        .first()
        .waitFor({ state: 'hidden', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.waitForRailSeatingExtrasCard] The rail seating panel did not finish opening ` +
        `within ${timeout}ms. Either the click did not expand the section or euRailService.getSeats ` +
        `never resolved, leaving the loading skeleton in place. Original: ${error.message}`,
      );
    }
  }

  /**
   * Counts the journey-leg segments rendered inside the expanded rail seating panel.
   * @returns {Promise<number>}
   */
  async getRailSeatingSegmentCount() {
    return this.page.locator(SELECTORS.RAIL_SEATING_SEGMENT).count();
  }

  /**
   * Returns the segment locator for one journey leg, validating the index against what is on
   * screen so an out-of-range leg reports the real segment count instead of timing out later.
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @returns {Promise<import('playwright').Locator>}
   */
  async getRailSeatingSegmentLocator(segmentIndex) {
    if (!Number.isInteger(segmentIndex) || segmentIndex < 0) {
      throw new Error(
        `[CartPage.getRailSeatingSegmentLocator] "segmentIndex" must be a non-negative integer, got: ` +
        `${typeof segmentIndex} (${segmentIndex})`,
      );
    }

    const segmentCount = await this.getRailSeatingSegmentCount();
    if (segmentCount === 0) {
      throw new Error(
        `[CartPage.getRailSeatingSegmentLocator] Requested journey-leg segment ${segmentIndex} but the ` +
        `rail seating panel shows no legs at all, so it is not open yet — waitForRailSeatingExtrasCard ` +
        `must succeed first.`,
      );
    }
    if (segmentIndex >= segmentCount) {
      throw new Error(
        `[CartPage.getRailSeatingSegmentLocator] Requested journey-leg segment ${segmentIndex} but the ` +
        `rail seating panel renders only ${segmentCount}. A one-way journey has a single leg.`,
      );
    }

    return this.page.locator(SELECTORS.RAIL_SEATING_SEGMENT).nth(segmentIndex);
  }

  /**
   * Reads a journey leg's heading text (segment.header) from the rail seating panel.
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getRailSeatingSegmentCaption(segmentIndex, timeout = 10000) {
    const segment = await this.getRailSeatingSegmentLocator(segmentIndex);
    const caption = segment.locator(SELECTORS.RAIL_SEATING_SEGMENT_CAPTION).first();

    try {
      await caption.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.getRailSeatingSegmentCaption] Journey-leg segment ${segmentIndex} has no leg ` +
        `heading after ${timeout}ms, so the seating panel is not laid out as expected. ` +
        `Original: ${error.message}`,
      );
    }

    return (await caption.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Clicks the first selectable seat checkbox within one journey leg.
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {number} [timeout=10000]
   * @returns {Promise<void>}
   */
  async clickRailSeatingSeatCheckbox(segmentIndex, timeout = 10000) {
    const segment = await this.getRailSeatingSegmentLocator(segmentIndex);
    const checkbox = segment.locator(SELECTORS.RAIL_SEATING_SEAT_CHECKBOX).first();

    try {
      await checkbox.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.clickRailSeatingSeatCheckbox] Journey-leg segment ${segmentIndex} offers no ` +
        `selectable seat checkbox after ${timeout}ms. eu-rail-seats.vue only renders one when the ` +
        `seat is paid and carries a possibleReservation — this leg may show "Seats not offered" or ` +
        `an automatically-assigned seat instead. Original: ${error.message}`,
      );
    }

    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }

  /**
   * Reports whether the first seat checkbox in one journey leg is currently ticked.
   * Element Plus puts `is-checked` on the `.el-checkbox` root.
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @returns {Promise<boolean>}
   */
  async isRailSeatingSeatCheckboxChecked(segmentIndex) {
    const segment = await this.getRailSeatingSegmentLocator(segmentIndex);
    const checkbox = segment.locator(SELECTORS.RAIL_SEATING_SEAT_CHECKBOX).first();
    const classes = (await checkbox.getAttribute('class')) || '';
    return classes.includes('is-checked');
  }

  /**
   * Reads a seat's display-currency price text from one journey leg, e.g. "€9.80".
   * @param {number} segmentIndex - 0 = outbound, 1 = inbound
   * @param {number} [timeout=10000]
   * @returns {Promise<string>}
   */
  async getRailSeatingSeatDisplayPriceText(segmentIndex, timeout = 10000) {
    const segment = await this.getRailSeatingSegmentLocator(segmentIndex);
    const displayPrice = segment.locator(SELECTORS.RAIL_SEATING_SEAT_DISPLAY_PRICE).first();

    try {
      await displayPrice.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.getRailSeatingSeatDisplayPriceText] No seat price is displayed for journey-leg ` +
        `segment ${segmentIndex} after ${timeout}ms, so this leg's seat is not a priced, selectable ` +
        `one. Original: ${error.message}`,
      );
    }

    return (await displayPrice.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Clicks the "Continue without reserving seats" checkbox in the rail seating panel.
   * @param {number} [timeout=10000]
   * @returns {Promise<void>}
   */
  async clickRailSeatingContinueWithoutSeatsCheckbox(timeout = 10000) {
    const checkbox = this.page.locator(SELECTORS.RAIL_SEATING_NO_SEATS_CHECKBOX).first();

    try {
      await checkbox.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.clickRailSeatingContinueWithoutSeatsCheckbox] The "Continue without reserving ` +
        `seats" checkbox did not appear within ${timeout}ms. eu-rail-seats.vue renders it only when ` +
        `isPaidSeatsAvailable is true, so this quote may not offer paid seats. ` +
        `Original: ${error.message}`,
      );
    }

    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }

  /**
   * Reports whether "Continue without reserving seats" is currently ticked.
   * @returns {Promise<boolean>}
   */
  async isRailSeatingContinueWithoutSeatsChecked() {
    const checkbox = this.page.locator(SELECTORS.RAIL_SEATING_NO_SEATS_CHECKBOX).first();
    const classes = (await checkbox.getAttribute('class')) || '';
    return classes.includes('is-checked');
  }

  /**
   * Reports whether the rail seating panel's own Save button is enabled. eu-rail-seats.vue disables
   * it whenever nothing is selected and paid seats are available (canSaveMooveSeats), which is the
   * difference between a save that failed and a save that was never possible.
   * @param {number} [timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isRailSeatingSaveButtonEnabled(timeout = 10000) {
    const saveButton = this.page.locator(SELECTORS.RAIL_SEATING_SAVE_BUTTON).first();

    try {
      await saveButton.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.isRailSeatingSaveButtonEnabled] The rail seating panel's Save button is not ` +
        `visible after ${timeout}ms — the panel is either closed or offers no saveable seats ` +
        `(eu-rail-seats.vue renders Save only when hasAnySeats). Original: ${error.message}`,
      );
    }

    return saveButton.isEnabled();
  }

  // ===== UK RAIL (EVOLVI) SEAT RESERVATION EXTRAS (uk-rail-seats.vue) =====

  /**
   * Clicks the UK Rail "Seating" extras row's Add/Edit/View trigger to expand the seat panel.
   * @param {number} [timeout=10000] - Max wait for the trigger to render
   * @returns {Promise<string>} The trigger's label, so callers can report which state it was in
   */
  async clickUkRailSeatsExtrasOpenButton(timeout = 10000) {
    const openButton = this.page.locator(SELECTORS.UK_RAIL_SEATS_EXTRAS_OPEN_BUTTON).first();

    try {
      await openButton.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.clickUkRailSeatsExtrasOpenButton] The UK Rail Seating extras row's Add/Edit/View ` +
        `trigger did not appear within ${timeout}ms. uk-rail-seats.vue only renders for an Evolvi ` +
        `quote, and only while the quote is still pending, so either the cart holds no UK Rail quote ` +
        `or it is already past the stage where extras can be edited. Original: ${error.message}`,
      );
    }

    const label = (await openButton.innerText()).replace(/\s+/g, ' ').trim();
    await openButton.scrollIntoViewIfNeeded();
    await openButton.click();
    return label;
  }

  /**
   * Waits for the expanded UK Rail seat panel to be ready to read — the card visible and the
   * loading skeleton gone, so a seat-type radio that has not loaded yet is never mistaken for
   * an option the supplier did not offer.
   * @param {number} [timeout=30000] - Max wait for the panel and its seat data
   * @returns {Promise<void>}
   */
  async waitForUkRailSeatsExtrasCard(timeout = 30000) {
    try {
      await this.page
        .locator(SELECTORS.UK_RAIL_SEATS_EXTRAS_CARD)
        .first()
        .waitFor({ state: 'visible', timeout });
      await this.page
        .locator(SELECTORS.UK_RAIL_SEATS_LOADING_SKELETON)
        .first()
        .waitFor({ state: 'hidden', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.waitForUkRailSeatsExtrasCard] The UK Rail seat panel did not finish opening within ` +
        `${timeout}ms. Either the click did not expand the Seating section or the seat-map load never ` +
        `resolved, leaving the el-skeleton in place. Original: ${error.message}`,
      );
    }
  }

  /**
   * Reads the labels of every seat-type radio the UK Rail seat panel is offering.
   * Used to report what WAS available when a requested option is missing — which for
   * "Specific Seat" is a data condition (berth-only leg, or more than one passenger), not a bug.
   * @returns {Promise<string[]>}
   */
  async getUkRailSeatOptionLabels() {
    const radios = this.page.locator(SELECTORS.UK_RAIL_SEATS_TYPE_RADIO);
    const labels = await radios.allInnerTexts();
    return labels.map((label) => label.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /**
   * Clicks one seat-type radio in the UK Rail seat panel by its rendered label.
   * @param {string} optionLabel - e.g. "Specific Seat", "Seat", "Berth", "No Seat"
   * @param {number} [timeout=10000]
   * @returns {Promise<void>}
   */
  async clickUkRailSeatOption(optionLabel, timeout = 10000) {
    const radio = this.page
      .locator(SELECTORS.UK_RAIL_SEATS_TYPE_RADIO)
      .filter({ hasText: optionLabel })
      .first();

    try {
      await radio.waitFor({ state: 'visible', timeout });
    } catch (error) {
      const offered = await this.getUkRailSeatOptionLabels();
      throw new Error(
        `[CartPage.clickUkRailSeatOption] No "${optionLabel}" seat-type radio appeared in the UK Rail ` +
        `seat panel within ${timeout}ms. Offered instead: ${offered.length ? offered.map((l) => `"${l}"`).join(', ') : 'none'}. ` +
        `uk-rail-seats.vue renders "Specific Seat" only when the leg has no berth and the trip has a ` +
        `single passenger, so an extra traveler on the trip removes it. Original: ${error.message}`,
      );
    }

    await radio.scrollIntoViewIfNeeded();
    await radio.click();
  }

  /**
   * Reports whether a seat-type radio is currently selected.
   * @param {string} optionLabel - Radio label, as rendered
   * @returns {Promise<boolean>}
   */
  async isUkRailSeatOptionChecked(optionLabel) {
    const radio = this.page
      .locator(SELECTORS.UK_RAIL_SEATS_TYPE_RADIO)
      .filter({ hasText: optionLabel })
      .first();
    const classes = (await radio.getAttribute('class')) || '';
    return classes.includes('is-checked');
  }

  /**
   * Opens one of the Specific Seat app-selects (Coach / Seat / Direction) and picks its first
   * offered option, returning the label that was chosen.
   *
   * Picking the FIRST option is deliberate: which coach the supplier offers varies per service,
   * so the test cannot name one — what matters is that a real option gets bound (test 62143).
   *
   * @param {string} fieldLabel - The field's rendered label, e.g. "Coach"
   * @param {number} [timeout=10000]
   * @returns {Promise<string>} The selected option's label
   */
  async selectFirstUkRailSeatFieldOption(fieldLabel, timeout = 10000) {
    const select = this.page.locator(SELECTORS.UK_RAIL_SEATS_FIELD_SELECT(fieldLabel)).first();

    try {
      await select.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.selectFirstUkRailSeatFieldOption] The "${fieldLabel}" dropdown is not visible in the ` +
        `UK Rail seat panel within ${timeout}ms. The Coach/Seat/Direction fields only render while the ` +
        `Specific Seat radio is the selected seat type, so that radio was probably never clicked. ` +
        `Original: ${error.message}`,
      );
    }

    await select.scrollIntoViewIfNeeded();
    await select.click();

    const option = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM).first();
    try {
      await option.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.selectFirstUkRailSeatFieldOption] The "${fieldLabel}" dropdown opened but offered no ` +
        `options within ${timeout}ms. uk-rail-seats.ts builds these from the seat-map response's ` +
        `dropDowns, so the supplier returned an empty list for this field. Original: ${error.message}`,
      );
    }

    const optionLabel = (await option.innerText()).replace(/\s+/g, ' ').trim();
    await option.click();
    await option.waitFor({ state: 'hidden', timeout });
    return optionLabel;
  }

  /**
   * Fills the Leading Traveller telephone field in the UK Rail seat panel.
   * @param {string} phoneNumber - Digits only; the field is an el-input type="number"
   * @param {number} [timeout=10000]
   * @returns {Promise<void>}
   */
  async fillUkRailSeatsTelephone(phoneNumber, timeout = 10000) {
    const input = this.page.locator(SELECTORS.UK_RAIL_SEATS_TELEPHONE_INPUT).first();

    try {
      await input.waitFor({ state: 'visible', timeout });
    } catch (error) {
      throw new Error(
        `[CartPage.fillUkRailSeatsTelephone] The Leading Traveller telephone field is not visible in the ` +
        `UK Rail seat panel within ${timeout}ms. uk-rail-seats.vue renders that whole block only when the ` +
        `seat-map response carries a leadTraveler, so the panel may still be loading. ` +
        `Original: ${error.message}`,
      );
    }

    await input.scrollIntoViewIfNeeded();
    await input.fill(phoneNumber);
    // el-input commits on input, but the number field only pushes its value up on blur —
    // without this the model can still be empty when Save builds the request body.
    await input.blur();
  }

  /**
   * Reads back the Leading Traveller telephone field's value.
   * @returns {Promise<string>}
   */
  async getUkRailSeatsTelephoneValue() {
    return this.page.locator(SELECTORS.UK_RAIL_SEATS_TELEPHONE_INPUT).first().inputValue();
  }

  /**
   * Reads the whole UK Rail block inside the open More details drawer as plain text.
   *
   * The reserved coach/seat arrives as a supplier-built HTML string that uk-rail-journey-details
   * renders with `v-html` (`station.seatsString`), so there is no element or class of its own to
   * target — the text has to be read and matched. Returns the drawer's text with whitespace
   * collapsed so a multi-line `v-html` block matches as one string.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<string>}
   */
  async getUkRailMoreDetailsText(timeout = 15000) {
    const drawer = this.page.locator(SELECTORS.MORE_DETAILS_DRAWER_CONTAINER).first();

    try {
      await drawer.waitFor({ state: 'visible', timeout });
      await this.page
        .locator(SELECTORS.MORE_DETAILS_DRAWER_SKELETON)
        .first()
        .waitFor({ state: 'hidden', timeout })
        .catch(() => {});
    } catch (error) {
      throw new Error(
        `[CartPage.getUkRailMoreDetailsText] The More details drawer was not visible within ` +
        `${timeout}ms, so the reserved seat details cannot be read. Expected ` +
        `"I click more details in cart" to have opened it first. Original: ${error.message}`,
      );
    }

    return (await drawer.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Reports whether the UK Rail seat panel is still expanded. uk-rail-seats.ts closes the panel
   * only on a successful save and returns early (leaving it open) when its validation rejects, so
   * this separates "Save was blocked" from "Save was never clicked".
   * @returns {Promise<boolean>}
   */
  async isUkRailSeatsPanelOpen() {
    return this.page.locator(SELECTORS.UK_RAIL_SEATS_EXTRAS_CARD).first().isVisible();
  }

  /**
   * Arms a one-shot wait for the POST that saves the UK Rail seat reservation. Call this BEFORE
   * clicking Save, then await the returned promise — the request body is the only place the coach
   * actually sent to the supplier can be read (test 62143).
   *
   * The default budget spans opening the panel through to the Save click, because it is armed when
   * the panel opens: everything in between (picking a coach, filling the telephone) happens while
   * this is already waiting.
   *
   * @param {number} [timeout=120000]
   * @returns {Promise<import('@playwright/test').Request>}
   */
  waitForUkRailSeatsSaveRequest(timeout = 120000) {
    return getNetworkInterceptor(this.page).waitForRequest(
      { urlIncludes: UK_RAIL_SEATS_API_PATH, method: 'POST' },
      { timeout },
    );
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

  /**
   * Returns the per-passenger yellow (pending) seat status icon locator inside the
   * expanded seating panel. Only rendered while the panel is open and after its seat
   * data has been re-fetched — see reopenSeatingExtrasPanel.
   * @returns {import('playwright').Locator}
   */
  getSeatingPendingStatusIconLocator() {
    return this.page.locator(SELECTORS.SEATING_PAX_YELLOW_STATUS_ICON).first();
  }

  /**
   * Returns the section-level pending (yellow `schedule`) indicator locator on the collapsed
   * seating summary row. Rendered by extras-layout.vue only while the panel is collapsed.
   * @returns {import('playwright').Locator}
   */
  getSeatingExtrasPendingStatusIconLocator() {
    return this.page.locator(SELECTORS.SEATING_EXTRAS_PENDING_STATUS_ICON);
  }

  /**
   * Reads every section-level state icon rendered on the collapsed seating summary row,
   * plus the row's own text. Used to build an actionable failure message when the row
   * carries an unexpected status indicator.
   * @returns {Promise<{icons: Array<{classes: string, text: string}>, rows: string[]}>}
   */
  async getSeatingExtrasRowState() {
    const icons = await this.page
      .locator(SELECTORS.SEATING_EXTRAS_STATUS_ICON)
      .evaluateAll((elements) => elements.map((element) => ({
        classes: element.className,
        text: (element.textContent || '').trim(),
      })));

    const rows = await this.page
      .locator(SELECTORS.SEATING_EXTRAS_COLLAPSED_ROW)
      .evaluateAll((elements) => elements.map(
        (element) => (element.innerText || '').trim().replace(/\s+/g, ' '),
      ));

    return { icons, rows };
  }

  /**
   * Collapses the seating extras panel if it is expanded, then waits for the collapsed
   * summary row. Only the collapsed row carries the Edit button (extras-layout.vue
   * renders it under `v-if="!isOpen"`), so this is the prerequisite for re-opening the
   * panel. Idempotent: safe to call whether the panel is open or already closed.
   * @param {number} timeout - Max wait time for the collapsed row in ms (default: 15000)
   * @returns {Promise<void>}
   */
  async ensureSeatingExtrasCollapsed(timeout = 15000) {
    const collapsedRow = this.page.locator(SELECTORS.SEATING_EXTRAS_COLLAPSED_ROW).first();
    const closeButton = this.page.locator(SELECTORS.SEATING_EXTRAS_CLOSE_BUTTON).first();

    // Polled rather than a single click: saving seats reloads the quote, which remounts the
    // seating panel (often already collapsed) mid-click. A one-shot click either races the
    // reload's loading overlay or hits a detached button. Each attempt is therefore allowed
    // to fail — the poll's own assertion below is what reports a genuine failure.
    await expect.poll(
      async () => {
        if (await collapsedRow.isVisible().catch(() => false)) {
          return true;
        }

        if (await closeButton.isVisible().catch(() => false)) {
          await closeButton.click({ timeout: 2000 }).catch(() => {});
        }

        return false;
      },
      {
        timeout,
        message:
          `Seating extras panel never collapsed (${SELECTORS.SEATING_EXTRAS_COLLAPSED_ROW} stayed hidden) — ` +
          `its status indicator only renders on the collapsed summary row`,
      },
    ).toBe(true);
  }

  /**
   * Closes and re-opens the seating extras panel so its saved-seat data is re-fetched.
   * flight-seating.vue loads the selected seats only on the panel's first open
   * (`isOpenChanged` → `isFirstOpen`), so a panel left open across a seat save still shows
   * the pre-save state — the seat status icons appear only after re-opening it.
   * @param {number} phaseTimeout - Max wait time in ms applied to each phase separately —
   *   collapsing the panel, then rendering its seat rows (default: 15000 each)
   * @returns {Promise<void>}
   */
  async reopenSeatingExtrasPanel(phaseTimeout = 15000) {
    await this.ensureSeatingExtrasCollapsed(phaseTimeout);
    await this.clickEditSeatingExtrasButton();

    await this.page
      .locator(SELECTORS.SEATING_PAX_SEAT_ROW)
      .first()
      .waitFor({ state: 'visible', timeout: phaseTimeout });
  }

  /**
   * Reads the rendered state of the expanded seating panel — the per-passenger status
   * icons and the seat row text. Used to build an actionable failure message when an
   * expected seat status indicator is missing.
   * @returns {Promise<{icons: Array<{classes: string, text: string}>, rows: string[]}>}
   */
  async getSeatingPanelStatusState() {
    const icons = await this.page
      .locator(SELECTORS.SEATING_PAX_STATUS_ICON)
      .evaluateAll((elements) => elements.map((element) => ({
        classes: element.className,
        text: (element.textContent || '').trim(),
      })));

    const rows = await this.page
      .locator(SELECTORS.SEATING_PAX_SEAT_ROW)
      .evaluateAll((elements) => elements.map(
        (element) => (element.innerText || '').trim().replace(/\s+/g, ' '),
      ));

    return { icons, rows };
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

  /**
   * Gets the traveler-name element (trip-traveler-tag.vue) in the cart page's Travellers section
   * matching the given name.
   * @param {string} travelerName - Traveler's full or partial name as displayed, e.g. "Pedro"
   * @returns {Locator}
   */
  getTravelerNameLocator(travelerName) {
    return this.page.locator(SELECTORS.TRAVELER_NAME).filter({ hasText: travelerName }).first();
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
   * Clicks the Save button inside the flight frequent flyer extras panel.
   * Assumes the FQTV panel is already open.
   * @param {number} [timeout=10000] - Timeout for waiting for the button to be visible
   * @returns {Promise<void>}
   */
  async clickFqtvSaveButton(timeout = 10000) {
    const saveButton = this.page.locator(SELECTORS.FQTV_SAVE_BUTTON).first();
    await saveButton.waitFor({ state: 'visible', timeout });
    await saveButton.click();
  }

  /**
   * Returns the help/validation message locator inside the flight frequent flyer panel.
   * Used to assert required-field validation errors.
   * @returns {import('playwright').Locator}
   */
  getFqtvHelpTextLocator() {
    return this.page.locator(SELECTORS.FQTV_HELP_TEXT).first();
  }

  /**
   * Clicks the Hand Luggage row action to open the hand luggage extras panel.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async clickHandLuggageClickable(timeout = 15000) {
    const clickable = this.page.locator(SELECTORS.HAND_LUGGAGE_CLICKABLE).first();
    await clickable.waitFor({ state: 'visible', timeout });
    await clickable.click();
  }

  /**
   * Waits for the hand luggage extras panel to render its card title after opening.
   * @param {number} [timeout=15000] - Timeout for waiting
   * @returns {Promise<void>}
   */
  async waitForHandLuggageContent(timeout = 15000) {
    await this.page.locator(SELECTORS.HAND_LUGGAGE_CARD_TITLE).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Returns the hand luggage green success icon locator.
   * @returns {import('playwright').Locator}
   */
  getHandLuggageSuccessIconLocator() {
    return this.page.locator(SELECTORS.HAND_LUGGAGE_SUCCESS_ICON).first();
  }

  /**
   * Opens the hand luggage el-select dropdown and clicks the first option whose label contains a price
   * (i.e., the first paid option). Free or zero-price options are skipped.
   * @param {number} [timeout=15000] - Timeout for waiting on the dropdown to open
   * @returns {Promise<string>} The text of the selected option
   */
  async selectFirstPaidHandLuggageOption(timeout = 15000) {
    const selectWrapper = this.page.locator(SELECTORS.HAND_LUGGAGE_SELECT_WRAPPER).first();
    await selectWrapper.waitFor({ state: 'visible', timeout });
    await selectWrapper.click();

    const dropdownItems = this.page.locator(SELECTORS.EL_SELECT_VISIBLE_DROPDOWN_ITEM);
    await dropdownItems.first().waitFor({ state: 'visible', timeout });

    const paidOption = dropdownItems.filter({ hasText: /[1-9]\d*([.,]\d+)?\s*(€|\$|£|USD|EUR|GBP)|(€|\$|£|USD|EUR|GBP)\s*[1-9]\d*/i }).first();
    await paidOption.waitFor({ state: 'visible', timeout });
    const optionText = (await paidOption.innerText()).trim();
    await paidOption.click();
    return optionText;
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

  async clickCopyTripOption() {
    const option = this.page.locator(SELECTORS.COPY_TRIP_OPTION, { hasText: 'Copy trip' }).first();
    await option.waitFor({ state: 'visible', timeout: 15000 });
    await option.click();
  }

  async waitForCopyTripDialog() {
    await this.page.locator(SELECTORS.COPY_TRIP_DIALOG).waitFor({ state: 'visible', timeout: 20000 });
  }

  async clickConfirmCopyTripButton() {
    const button = this.page.locator(SELECTORS.COPY_TRIP_CONFIRM_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  }

  getCopyTripCannotCopyIndicator() {
    return this.page.locator(SELECTORS.COPY_TRIP_CANNOT_COPY_INDICATOR).first();
  }

  /**
   * Reads the intro paragraph of the copy-trip dialog
   * (e.g. "The following items will be copied to a new trip").
   * @param {number} [timeout=20000]
   * @returns {Promise<string>}
   */
  async getCopyTripDialogMessageText(timeout = 20000) {
    const message = this.page.locator(SELECTORS.COPY_TRIP_DIALOG_MESSAGE).first();
    try {
      await message.waitFor({ state: 'visible', timeout });
      return (await message.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getCopyTripDialogMessageText] Could not read the copy-trip dialog intro message ` +
        `(selector: ${SELECTORS.COPY_TRIP_DIALOG_MESSAGE}). Likely causes: the dialog is not open, or ` +
        `it is still showing its loading mask while /copyTrip resolves. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the status label of every quote row listed in the copy-trip dialog, in row order.
   * @param {number} [timeout=20000]
   * @returns {Promise<string[]>}
   */
  async getCopyTripDialogQuoteStatuses(timeout = 20000) {
    const rows = this.page.locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW);
    try {
      await rows.first().waitFor({ state: 'visible', timeout });
      const rowCount = await rows.count();
      const statuses = [];
      for (let i = 0; i < rowCount; i++) {
        const label = rows.nth(i).locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_STATUS).first();
        // An ineligible row renders a "can not be copied" warning instead of a status label, so
        // record an empty string rather than failing the read — the DSL assertion reports it.
        const text = ((await label.innerText().catch(() => '')) || '').trim();
        statuses.push(text);
      }
      return statuses;
    } catch (err) {
      throw new Error(
        `[CartPage.getCopyTripDialogQuoteStatuses] Could not read the quote rows in the copy-trip ` +
        `dialog (rows: ${SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW}, status: ${SELECTORS.COPY_TRIP_DIALOG_QUOTE_STATUS}). ` +
        `Likely causes: the dialog is not open, or the trip's quotes had not loaded within ${timeout}ms. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * The copy-trip dialog row for the quote whose name contains the given text. Matched by product
   * name, never by index: which row a product occupies depends on what else is in the trip.
   *
   * @param {string} quoteName - Text the row's product name must contain (e.g. "EU Rail")
   * @returns {import('@playwright/test').Locator}
   */
  getCopyTripDialogQuoteRowByName(quoteName) {
    if (!quoteName || typeof quoteName !== 'string') {
      throw new Error(
        `[CartPage.getCopyTripDialogQuoteRowByName] "quoteName" must be a non-empty string, got: ` +
        `${typeof quoteName} (${JSON.stringify(quoteName)})`
      );
    }
    return this.page
      .locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW, { hasText: quoteName })
      .first();
  }

  /**
   * Reads the product names of every quote row in the copy-trip dialog, in row order. Used to report
   * what the dialog actually listed when a row lookup misses.
   * @param {number} [timeout=20000]
   * @returns {Promise<string[]>}
   */
  async getCopyTripDialogQuoteNames(timeout = 20000) {
    const rows = this.page.locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW);
    await rows.first().waitFor({ state: 'visible', timeout });

    const names = [];
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const name = rows.nth(i).locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_NAME).first();
      names.push(((await name.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim());
    }
    return names;
  }

  /**
   * Reads the "can not be copied" warning on one named quote row of the copy-trip dialog.
   * Throws if that row shows no warning — i.e. the quote IS eligible for copy.
   *
   * @param {string} quoteName - Text the row's product name must contain
   * @param {number} [timeout=20000]
   * @returns {Promise<string>}
   */
  async getCopyTripDialogQuoteWarningText(quoteName, timeout = 20000) {
    const row = this.getCopyTripDialogQuoteRowByName(quoteName);
    const warning = row.locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_WARNING).first();
    try {
      await warning.waitFor({ state: 'visible', timeout });
      return (await warning.innerText()).trim();
    } catch (err) {
      const listed = await this.getCopyTripDialogQuoteNames().catch(() => []);
      throw new Error(
        `[CartPage.getCopyTripDialogQuoteWarningText] The copy-trip dialog row for "${quoteName}" showed ` +
        `no "can not be copied" warning (row: ${SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW}, warning: ` +
        `${SELECTORS.COPY_TRIP_DIALOG_QUOTE_WARNING}). Either that quote IS eligible for copy, or no row ` +
        `matched that name — the dialog listed: [${listed.join(' | ')}]. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the status label on one named quote row of the copy-trip dialog (e.g. "Pending booking").
   * A row that cannot be copied renders a warning instead of a status label, so this throws for it.
   *
   * @param {string} quoteName - Text the row's product name must contain
   * @param {number} [timeout=20000]
   * @returns {Promise<string>}
   */
  async getCopyTripDialogQuoteStatusByName(quoteName, timeout = 20000) {
    const row = this.getCopyTripDialogQuoteRowByName(quoteName);
    const label = row.locator(SELECTORS.COPY_TRIP_DIALOG_QUOTE_STATUS).first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      return (await label.innerText()).trim();
    } catch (err) {
      const listed = await this.getCopyTripDialogQuoteNames().catch(() => []);
      throw new Error(
        `[CartPage.getCopyTripDialogQuoteStatusByName] The copy-trip dialog row for "${quoteName}" showed ` +
        `no status label (row: ${SELECTORS.COPY_TRIP_DIALOG_QUOTE_ROW}, status: ` +
        `${SELECTORS.COPY_TRIP_DIALOG_QUOTE_STATUS}). A quote that cannot be copied renders the ` +
        `"can not be copied" warning instead of a status, so this usually means that quote is not ` +
        `eligible for copy. The dialog listed: [${listed.join(' | ')}]. Original: ${err.message}`
      );
    }
  }

  /**
   * The EU rail quote card in the cart. Returned as a locator (not awaited) so callers can assert
   * either presence or absence.
   * @returns {import('@playwright/test').Locator}
   */
  getEuRailQuoteCard() {
    return this.page.locator(SELECTORS.EU_RAIL_QUOTE_CARD);
  }

  /**
   * Counts the visible EU Rail (Benerail) journey segments in the cart's rail quote card — one
   * "Fare Rules" button renders per journey/leg (see clickRailFareRulesButton). Used to assert
   * both outbound and inbound legs made it into the cart (AB#81914 regression: selecting an
   * outbound alternative via Earlier/Later dropped the outbound leg from the cart).
   * @param {{ timeout?: number }} options
   * @returns {Promise<number>}
   */
  async getVisibleRailQuoteSegmentCount({ timeout = 15000 } = {}) {
    const fareRulesButtons = this.getEuRailQuoteCard().getByRole('button', { name: 'Fare Rules' });
    await fareRulesButtons.first().waitFor({ state: 'visible', timeout });
    return fareRulesButtons.count();
  }

  // ===== Agent "Suggested items" section =====

  /**
   * The heading of the agent "Suggested items" section. Heading-anchored because the
   * "Additional items" section shares the same container class.
   * @returns {import('@playwright/test').Locator}
   */
  getSuggestedItemsHeading() {
    return this.page.locator(SELECTORS.SUGGESTED_ITEMS_HEADING).first();
  }

  /**
   * All agent suggestion items (`.suggested-quote` wrappers). Returned as a locator so callers
   * can count or assert presence.
   * @returns {import('@playwright/test').Locator}
   */
  getSuggestedQuoteItems() {
    return this.page.locator(SELECTORS.SUGGESTED_QUOTE_ITEM);
  }

  /**
   * Clicks the "Add to trip" button on the agent-suggested car quote card.
   */
  async clickSuggestedCarQuoteAddButton() {
    const button = this.page.locator(SELECTORS.SUGGESTED_CAR_ADD_BUTTON).first();
    try {
      await button.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});
      await button.waitFor({ state: 'visible', timeout: 20000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.clickSuggestedCarQuoteAddButton] Could not click the suggested car quote's ` +
        `"Add to trip" button (${SELECTORS.SUGGESTED_CAR_ADD_BUTTON}). The agent may not have ` +
        `suggested a car, or the suggestion was already added to the trip. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the flight quote card's price-state label — "To pay" for a live cart quote (see
   * SELECTORS.FLIGHT_QUOTE_TO_PAY_LABEL for the other states it can render).
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getFlightQuoteToPayLabelText(timeout = 30000) {
    const label = this.page.locator(SELECTORS.FLIGHT_QUOTE_TO_PAY_LABEL).first();
    try {
      await label.waitFor({ state: 'visible', timeout });
      return (await label.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getFlightQuoteToPayLabelText] Could not read the flight quote's price-state label ` +
        `(selector: ${SELECTORS.FLIGHT_QUOTE_TO_PAY_LABEL}). Likely causes: the trip has no flight ` +
        `quote, or the quote is already ticketed/finalizing (the label is not rendered in those ` +
        `states). Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the price rendered next to the flight quote's "To pay" label.
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getFlightQuoteToPayPriceText(timeout = 30000) {
    const price = this.page.locator(SELECTORS.FLIGHT_QUOTE_TO_PAY_PRICE).first();
    try {
      await price.waitFor({ state: 'visible', timeout });
      return (await price.innerText()).replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getFlightQuoteToPayPriceText] Could not read the flight quote's total price ` +
        `(selector: ${SELECTORS.FLIGHT_QUOTE_TO_PAY_PRICE}). Likely causes: the trip has no flight ` +
        `quote, or its price had not rendered within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the car type/class title from the first car quote card in the cart
   * (e.g. "Compact 4 doors").
   * @param {number} [timeout=30000]
   * @returns {Promise<string>}
   */
  async getFirstCarTypeText(timeout = 30000) {
    const title = this.page.locator(SELECTORS.CAR_QUOTE_CARD_TYPE_TITLE).first();
    try {
      await title.waitFor({ state: 'visible', timeout });
      return (await title.innerText()).replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getFirstCarTypeText] Could not read the car type from the cart's car quote card ` +
        `(selector: ${SELECTORS.CAR_QUOTE_CARD_TYPE_TITLE}). Likely causes: the trip has no car quote, ` +
        `or the quote card had not rendered within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  async clickCopyTripCancelButton() {
    const button = this.page.locator(SELECTORS.COPY_TRIP_CANCEL_BUTTON).first();
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
  }

  getFirstTicketDetailsSection() {
    return this.page.locator(SELECTORS.TICKET_DETAILS_SECTION).first();
  }

  /**
   * The "Journey Details" button (rail quote card) inside the first ticket details section.
   * `.first()`: a round-trip rail quote renders one of these per leg inside the same section, so an
   * unqualified match is a strict-mode violation. Callers use this button as a "the quote card has
   * rendered" gate, which the first leg's button answers on its own.
   */
  getJourneyDetailsButtonInFirstTicketDetails() {
    return this.getFirstTicketDetailsSection().getByRole('button', { name: 'Journey Details' }).first();
  }

  // ========================================
  // PAYMENT TERMS - CARS & HOTELS
  // ========================================

  /**
   * Clicks the payment terms link to open the rental period/terms modal.
   * @returns {Promise<void>}
   */
  async clickPaymentTermsLink() {
    const candidates = this.page.locator(SELECTORS.PAYMENT_TERMS_LINK);
    await candidates.first().waitFor({ state: 'attached', timeout: 15000 });

    const count = await candidates.count();
    for (let i = 0; i < count; i++) {
      const candidate = candidates.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        return;
      }
    }

    throw new Error('Unable to find a visible Terms & Conditions trigger to click.');
  }

  /**
   * Checks if the rental period terms modal is visible.
   * @returns {Promise<boolean>}
   */
  async isTermsModalVisible() {
    const modal = this.page.locator(SELECTORS.RENTAL_PERIOD_TERMS_MODAL).first();
    try {
      await modal.waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes the rental period terms modal by clicking the close button.
   * @returns {Promise<void>}
   */
  async closeTermsModal() {
    const closeButton = this.page.locator(SELECTORS.TERMS_MODAL_CLOSE_BUTTON).first();
    try {
      await closeButton.waitFor({ state: 'visible', timeout: 10000 });
      await closeButton.click();
      await this.page.waitForTimeout(300);
    } catch {
      // If close button not found, try pressing Escape
      await this.page.press('body', 'Escape');
    }
  }

  /**
   * Gets the car Terms & Conditions dialog content locator (fare rules + location details tabs).
   * @returns {import('playwright').Locator}
   */
  getCarTermsDialogContent() {
    return this.page.locator(SELECTORS.CAR_TERMS_DIALOG_CONTENT).first();
  }

  /**
   * Clicks the "Vendor and location details" tab inside the car Terms & Conditions dialog.
   * @returns {Promise<void>}
   */
  async clickCarTermsLocationDetailsTab() {
    const tab = this.page.locator(SELECTORS.CAR_TERMS_LOCATION_DETAILS_TAB).first();
    await tab.waitFor({ state: 'visible', timeout: 15000 });
    await tab.click();
    await this.page.locator(SELECTORS.CAR_TERMS_LOCATION_DETAILS_PANE).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Gets the full text content of a car Terms & Conditions tab pane, for cross-context
   * (results/cart/after-booking) text comparison.
   *
   * @param {'fareRules'|'locationDetails'} paneName
   * @returns {Promise<string>} Trimmed text content of the pane.
   */
  async extractCarTermsPaneContent(paneName) {
    const selector = paneName === 'locationDetails'
      ? SELECTORS.CAR_TERMS_LOCATION_DETAILS_PANE
      : SELECTORS.CAR_TERMS_FARE_RULES_PANE;

    const pane = this.page.locator(selector).first();
    await pane.waitFor({ state: 'visible', timeout: 15000 });
    const text = await pane.innerText();
    return (text || '').trim();
  }

  /**
   * Extracts all content from a terms modal section heading until the next h5 (or end of modal).
   * Finds the h5 with the given heading text, then collects all text from that h5 through the next h5.
   * 
   * @param {string} headingText - The h5 heading text to find (e.g., "Rental period")
   * @returns {Promise<string>} All text content from the section, joined by newlines
   */
  async extractTermsModalSectionContent(headingText) {
    if (!headingText || typeof headingText !== 'string') {
      throw new Error('headingText must be a non-empty string');
    }

    // Wait for the target h5 heading to be visible (this ensures modal is open and content is rendered)
    const headingLocator = this.page.locator('h5').filter({ hasText: new RegExp(headingText, 'i') }).first();
    
    try {
      await headingLocator.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      throw new Error(`Heading "${headingText}" not found in terms modal within 15s`);
    }

    // Extract section content from h5 heading until next h5
    const content = await this.page.evaluate((targetHeading) => {
      // Find the h5 with matching text (case-insensitive)
      const headings = Array.from(document.querySelectorAll('h5'));
      const heading = headings.find(h => h.textContent.toLowerCase().includes(targetHeading.toLowerCase()));
      
      if (!heading) return '';

      const lines = [];
      let currentElement = heading;
      let foundEnd = false;

      // Traverse siblings: collect content until next h5
      while (currentElement && !foundEnd) {
        // Add the element's own text if it has any
        const text = currentElement.textContent?.trim();
        if (text) {
          lines.push(text);
        }

        // Move to next sibling
        currentElement = currentElement.nextElementSibling;

        // Stop if we hit another h5
        if (currentElement?.tagName === 'H5') {
          foundEnd = true;
          break;
        }

        // Stop if we hit the end of the modal or a major boundary
        if (!currentElement || currentElement.classList?.contains('modal') || currentElement.classList?.contains('dialog')) {
          break;
        }
      }

      return lines.join('\n');
    }, headingText);

    return content || '';
  }

  // ===== QUOTE EXTRAS - ATTACH FILES =====

  async clickExtrasCollapse() {
    const header = this.page.locator(SELECTORS.EXTRAS_COLLAPSE_HEADER).first();
    try {
      await header.waitFor({ state: "visible", timeout: 10000 });
      await header.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickExtrasCollapse] Could not click the "Extras" collapse header ` +
        `(selector: ${SELECTORS.EXTRAS_COLLAPSE_HEADER}). The extras section was not visible within 10s — ` +
        `likely the quote card is not expanded or the quote type does not support extras. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickAttachFilesViewBtn() {
    const btn = this.page.locator(SELECTORS.ATTACH_FILES_VIEW_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 10000 });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickAttachFilesViewBtn] Could not click the "View"/"Add" button on the attach files extra ` +
        `(selector: ${SELECTORS.ATTACH_FILES_VIEW_BTN}). The button was not visible within 10s — ` +
        `likely the Extras section is not expanded or the user does not have file upload permissions. ` +
        `Original: ${err.message}`
      );
    }
  }

  async uploadAttachFile(filePath) {
    const input = this.page.locator(SELECTORS.ATTACH_FILES_UPLOAD_INPUT);
    try {
      await input.setInputFiles(filePath);
    } catch (err) {
      throw new Error(
        `[CartPage.uploadAttachFile] Could not upload file "${filePath}" ` +
        `(selector: ${SELECTORS.ATTACH_FILES_UPLOAD_INPUT}). The file input was not found — ` +
        `likely the attach files card is not open. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickAttachFilesSaveBtn() {
    const btn = this.page.locator(SELECTORS.ATTACH_FILES_SAVE_BTN).first();
    try {
      await btn.waitFor({ state: "visible", timeout: 10000 });
      await btn.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickAttachFilesSaveBtn] Could not click the "Save" button on attach files ` +
        `(selector: ${SELECTORS.ATTACH_FILES_SAVE_BTN}). The button was not visible or disabled within 10s — ` +
        `likely no file was selected or the upload is still in progress. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForAttachFileItemVisible(timeout = 20000) {
    try {
      await this.page.locator(SELECTORS.ATTACH_FILES_FILE_ITEM).first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForAttachFileItemVisible] No file item appeared in the attach files list within ${timeout}ms ` +
        `(selector: ${SELECTORS.ATTACH_FILES_FILE_ITEM}). The file upload may have failed or the save did not complete. ` +
        `Original: ${err.message}`
      );
    }
  }

  async isFileNameVisibleInAttachFiles(fileName, timeout = 15000) {
    try {
      const fileNameLocator = this.page.locator(SELECTORS.ATTACH_FILES_FILE_NAME, { hasText: fileName });
      await fileNameLocator.first().waitFor({ state: "visible", timeout });
      return true;
    } catch (err) {
      throw new Error(
        `[CartPage.isFileNameVisibleInAttachFiles] File "${fileName}" was not found in the attach files list within ${timeout}ms ` +
        `(selector: ${SELECTORS.ATTACH_FILES_FILE_NAME} with text "${fileName}"). ` +
        `The upload may have failed, the save did not complete, or the file name does not match. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickRelatedFilesTab(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.RELATED_FILES_TAB).waitFor({ state: 'visible', timeout });
      await this.page.locator(SELECTORS.RELATED_FILES_TAB).click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickRelatedFilesTab] Could not click the Related Files tab within ${timeout}ms ` +
        `(selector: ${SELECTORS.RELATED_FILES_TAB}). The tab may not be visible on this cart page. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForRelatedFileItemVisible(timeout = 20000) {
    try {
      await this.page.locator(SELECTORS.RELATED_FILES_FILE_ITEM).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForRelatedFileItemVisible] No file item appeared in the Related Files panel within ${timeout}ms ` +
        `(selector: ${SELECTORS.RELATED_FILES_FILE_ITEM}). The upload may have failed or the save did not complete. ` +
        `Original: ${err.message}`
      );
    }
  }

  async isRelatedFileNameVisible(fileName, timeout = 15000) {
    try {
      const locator = this.page.locator(SELECTORS.RELATED_FILES_FILE_NAME, { hasText: fileName });
      await locator.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch (err) {
      throw new Error(
        `[CartPage.isRelatedFileNameVisible] File "${fileName}" was not found in the Related Files panel within ${timeout}ms ` +
        `(selector: ${SELECTORS.RELATED_FILES_FILE_NAME} with text "${fileName}"). ` +
        `The upload may have failed or the file name does not match. ` +
        `Original: ${err.message}`
      );
    }
  }

  async clickRelatedFileByName(fileName, timeout = 10000) {
    try {
      const fileLink = this.page.locator(SELECTORS.RELATED_FILES_FILE_NAME, { hasText: fileName }).first();
      await fileLink.waitFor({ state: 'visible', timeout });
      await fileLink.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickRelatedFileByName] Could not click the related file link for "${fileName}" within ${timeout}ms ` +
        `(selector: ${SELECTORS.RELATED_FILES_FILE_NAME} with text "${fileName}"). ` +
        `The file may not be visible in the list or the name does not match exactly. ` +
        `Original: ${err.message}`
      );
    }
  }

  async waitForIncludeInItineraryEmailVisible(timeout = 15000) {
    try {
      await this.page.locator(SELECTORS.RELATED_FILES_ITINERARY_EMAIL_LABEL).first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForIncludeInItineraryEmailVisible] The "include in itinerary email" checkbox label was not visible ` +
        `within ${timeout}ms (selector: ${SELECTORS.RELATED_FILES_ITINERARY_EMAIL_LABEL}). ` +
        `Note this checkbox only renders next to an uploaded file, so a file must be present in the Related Files pane. ` +
        `Original: ${err.message}`
      );
    }
  }

  async uploadRelatedFilesFileInput(filePath) {
    try {
      await this.page.locator(SELECTORS.RELATED_FILES_UPLOAD_INPUT).setInputFiles(filePath);
    } catch (err) {
      throw new Error(
        `[CartPage.uploadRelatedFilesFileInput] Could not set files on the Related Files upload input ` +
        `(selector: ${SELECTORS.RELATED_FILES_UPLOAD_INPUT}). The input may not be available in the DOM. ` +
        `Original: ${err.message}`
      );
    }
  }

  waitForUploadApiResponse(timeout = 30000) {
    return getNetworkInterceptor(this.page).waitForResponse(
      { urlIncludes: config.tripFilesUploadApiPath, method: 'POST' },
      { timeout }
    );
  }

  waitForDownloadRequest(timeout = 10000) {
    return getNetworkInterceptor(this.page).waitForRequest(
      { urlIncludes: config.tripFilesDownloadApiPath },
      { timeout }
    );
  }

  async getQuoteCardPriceByText(cardText, { timeout = 15000 } = {}) {
    try {
      const card = this.page.locator(SELECTORS.QUOTE_PAYMENT_CARD, { hasText: cardText }).first();
      await card.waitFor({ state: 'visible', timeout });
      const priceEl = card.locator(SELECTORS.QUOTE_CARD_PRICE_AMOUNT).first();
      await priceEl.waitFor({ state: 'visible', timeout: 5000 });
      const text = await priceEl.innerText();
      return text.trim();
    } catch (err) {
      throw new Error(
        `[CartPage.getQuoteCardPriceByText] Could not find a visible quote card containing "${cardText}" ` +
        `or its price element within ${timeout}ms. ` +
        `Likely causes: the quote card is not yet rendered, the text doesn't match what's displayed, ` +
        `or the page hasn't navigated to the trip overview yet. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Dismisses the cookie consent banner if it is currently visible.
   * Never throws — the banner is environment-dependent.
   * @returns {Promise<boolean>} true if a banner was found and dismissed
   */
  async dismissCookieBannerIfPresent() {
    try {
      const button = this.page.locator(SELECTORS.COOKIE_ALLOW_ALL_BUTTON).first();
      await button.waitFor({ state: 'visible', timeout: 3000 });
      await button.click();
      await button.waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hovers the trip actions icon and waits for the dropdown to open, retrying
   * up to maxAttempts times. Dismisses any cookie consent banner before each
   * attempt. The el-dropdown is disabled (isLoading=true) during brief
   * backend-polling windows on In Progress trips, so a single hover may
   * silently fail.
   *
   * @param {{ maxAttempts?: number, retryDelayMs?: number }} options
   */
  async hoverTripActionsDropdownIconWithRetry({ maxAttempts = 5, retryDelayMs = 1500 } = {}) {
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.dismissCookieBannerIfPresent();
        const icon = this.page.locator(SELECTORS.TRIP_ACTIONS_DROPDOWN_ICON).first();
        await icon.waitFor({ state: 'visible', timeout: 10000 });
        await icon.hover();
        await this.page
          .locator(SELECTORS.CANCEL_TRIP_OPTION, { hasText: 'Cancel trip' })
          .waitFor({ state: 'visible', timeout: 3000 });
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < maxAttempts) await this.page.waitForTimeout(retryDelayMs);
      }
    }
    throw new Error(
      `[CartPage.hoverTripActionsDropdownIconWithRetry] Trip actions dropdown did not open after ${maxAttempts} attempts. ` +
      `The el-dropdown may be disabled (isLoading=true on an In Progress trip) or "Cancel trip" is absent. ` +
      `Last error: ${lastErr.message}`
    );
  }

  /**
   * Waits until a trip-actions dropdown option with the given text is visible.
   * @param {string} optionText
   */
  async waitForTripActionMenuOptionText(optionText) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[CartPage.waitForTripActionMenuOptionText] "optionText" must be a non-empty string, got: ${typeof optionText} (${JSON.stringify(optionText)})`
      );
    }
    await this.page
      .locator(SELECTORS.TRIP_ACTION_MENU_OPTION, { hasText: optionText })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Hovers the info icon inside the "Cancel trip" dropdown item.
   * Requires the trip-actions dropdown to already be open.
   */
  async hoverCancelTripInfoIcon() {
    const icon = this.page.locator(SELECTORS.CANCEL_TRIP_INFO_ICON).first();
    await icon.waitFor({ state: 'visible', timeout: 10000 });
    await icon.hover();
  }

  /**
   * Waits for an Element Plus light tooltip containing expectedText to appear.
   * @param {string} expectedText
   * @param {{ timeout?: number }} options
   */
  async waitForTooltipWithText(expectedText, { timeout = 10000 } = {}) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[CartPage.waitForTooltipWithText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }
    await this.page
      .locator('.el-popper.is-light', { hasText: expectedText })
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits until an item-actions dropdown option with the given text is visible.
   * @param {string} optionText
   */
  async waitForItemActionMenuOptionText(optionText) {
    if (!optionText || typeof optionText !== 'string') {
      throw new Error(
        `[CartPage.waitForItemActionMenuOptionText] "optionText" must be a non-empty string, got: ${typeof optionText} (${JSON.stringify(optionText)})`
      );
    }
    await this.page
      .locator(SELECTORS.ACTIVE_QUOTE_CANCEL_OPTION, { hasText: optionText })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Hovers the actions icon of the item at the given 0-based index.
   * Returns false (without throwing) if the index is out of range — allows
   * negative-validation steps to continue when the trip has fewer items than expected.
   * @param {number} itemIndex
   * @returns {Promise<boolean>} true if hovered, false if index is out of range
   */
  async hoverItemActionsDropdownByIndex(itemIndex) {
    if (typeof itemIndex !== 'number' || !Number.isInteger(itemIndex) || itemIndex < 0) {
      throw new Error(
        `[CartPage.hoverItemActionsDropdownByIndex] "itemIndex" must be a non-negative integer, got: ${typeof itemIndex} (${JSON.stringify(itemIndex)})`
      );
    }
    const icons = this.page.locator(SELECTORS.ACTIVE_QUOTE_ACTIONS_DROPDOWN_ICON);
    const count = await icons.count();
    if (itemIndex >= count) {
      return false;
    }
    const icon = icons.nth(itemIndex);
    await icon.waitFor({ state: 'visible', timeout: 15000 });
    await icon.hover();
    await this.page.waitForTimeout(1000); // El-dropdown animation delay — menu items are not yet interactive immediately after hover
    return true;
  }

  /**
   * Clicks the "Cancel item" option in the currently open item-actions dropdown.
   * Targets the inner span (not the li) so the click is allowed even when the
   * parent li has aria-disabled="true" (In Progress quote). This matches the
   * original Testim test behaviour: click registers but El Plus ignores it on
   * disabled items.
   * @returns {Promise<void>}
   */
  async clickVisibleCancelItemOption() {
    // Use the inner span.mr-2 so Playwright's actionability check sees a non-disabled element
    const span = this.page
      .locator('.el-dropdown-menu__item:has(span.mr-2) span.mr-2', { hasText: 'Cancel item' })
      .first();
    await span.waitFor({ state: 'visible', timeout: 15000 });
    // force:true skips actionability checks; El Plus dropdown ignores the click if the
    // parent li carries is-disabled/aria-disabled (negative-validation use-case)
    await span.click({ force: true });
  }

  /**
   * Sets up a listener for the next /api/v3/quotes?tripId=... GET response.
   * Must be called BEFORE the action that triggers the cart to load/refresh.
   * Returns an unresolved Promise that resolves when the response arrives.
   *
   * @returns {Promise<import('@playwright/test').Response>}
   */
  captureQuotesApiResponse() {
    return getNetworkInterceptor(this.page).waitForResponse({
      urlIncludes: [config.quotesApiPath, 'tripId'],
      method: 'GET',
    });
  }

  // ===== Additional items section =====

  /**
   * Gets the cart's "Additional items" section heading locator.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getAdditionalItemsSectionHeading() {
    return this.page.locator(SELECTORS.ADDITIONAL_ITEMS_HEADING).first();
  }

  // ===== Compensation / Climate Contribution =====

  /**
   * Gets the compensation quote card locator (compensation-quote-card.vue).
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCompensationQuoteCard() {
    return this.page.locator(SELECTORS.COMPENSATION_QUOTE_CARD).first();
  }

  /**
   * Gets the compensation quote card's title locator, filtered to the expected text.
   *
   * @param {string} expectedTitle - Title to match, e.g. "Climate Contribution"
   * @returns {import('@playwright/test').Locator}
   */
  getCompensationQuoteTitle(expectedTitle) {
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[CartPage.getCompensationQuoteTitle] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${expectedTitle})`
      );
    }
    return this.page.locator(SELECTORS.COMPENSATION_QUOTE_TITLE, { hasText: expectedTitle }).first();
  }

  /**
   * Scrolls the compensation quote card into view.
   *
   * Used from both ends of the compensation flow — the on-demand tile in the cart's Additional
   * items section, and the real quote card on the post-booking trip overview. Either way the card
   * sits below the flight card and its Extras section, so it starts outside the viewport.
   * Playwright auto-scrolls for actions but NOT for `toBeVisible()`, and the page renders lower
   * sections lazily — so an assertion can run before the card has rendered at all.
   *
   * Best-effort by design: this only improves the odds that the card is rendered. The caller's
   * assertion remains the gate and produces the meaningful failure message, so a scroll failure
   * here (e.g. the card genuinely does not exist) is logged rather than thrown.
   */
  async scrollCompensationQuoteIntoView() {
    await this.page
      .locator(SELECTORS.COMPENSATION_QUOTE_CARD)
      .first()
      .scrollIntoViewIfNeeded({ timeout: 15000 })
      .catch(() => {});
  }

  /**
   * Gets the compensation card's "Add to trip" button locator.
   * Present only for the on-demand product tile; absent once the compensation is a real quote.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCompensationAddToTripButton() {
    return this.page.locator(SELECTORS.COMPENSATION_ADD_TO_TRIP_BUTTON);
  }

  /**
   * Clicks the "Add to trip" button on the on-demand compensation tile.
   */
  async clickCompensationAddToTripButton() {
    const button = this.page.locator(SELECTORS.COMPENSATION_ADD_TO_TRIP_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCompensationAddToTripButton] Could not click the compensation "Add to trip" button ` +
        `(selector: ${SELECTORS.COMPENSATION_ADD_TO_TRIP_BUTTON}). compensation-quote-card.vue renders it behind ` +
        `v-if="!isRealQuote", so it is absent when the compensation is already part of the trip (added ` +
        `automatically, or added earlier in this scenario), and the whole tile is absent when the company has no ` +
        `on-demand compensation configured. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the on-demand compensation tile's "Add to trip" button to disappear.
   *
   * Adding the compensation fires an async quote reload; once it lands, `isCompensationChosen`
   * turns true and the tile is removed. That detach is the settle signal that separates "the
   * click was registered" from "the trip actually has the compensation now".
   */
  async waitForCompensationAddToTripButtonToDetach() {
    try {
      await this.page
        .locator(SELECTORS.COMPENSATION_ADD_TO_TRIP_BUTTON)
        .first()
        .waitFor({ state: 'detached', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCompensationAddToTripButtonToDetach] The compensation "Add to trip" button was still ` +
        `rendered 30s after it was clicked, so the compensation was never added to the trip. The Squake ` +
        `add-compensation call may have failed, or the cart never reloaded its quotes. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the Terms & Conditions link on the compensation quote card.
   */
  async clickCompensationTermsLink() {
    const link = this.page.locator(SELECTORS.COMPENSATION_TERMS_LINK).first();
    try {
      await link.waitFor({ state: 'visible', timeout: 15000 });
      await link.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCompensationTermsLink] Could not click the compensation Terms & Conditions link ` +
        `(selector: ${SELECTORS.COMPENSATION_TERMS_LINK}). The compensation quote may not be a real quote yet ` +
        `(the terms link only renders inside base-quote-card for a booked/priced compensation), or the card has not loaded. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the compensation terms dialog body paragraph locator.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCompensationTermsDialogBody() {
    return this.page.locator(SELECTORS.COMPENSATION_TERMS_DIALOG_BODY).first();
  }

  /**
   * Closes the compensation terms dialog via its header close button.
   */
  async closeCompensationTermsDialog() {
    const closeButton = this.page.locator(SELECTORS.COMPENSATION_TERMS_DIALOG_CLOSE).first();
    try {
      await closeButton.waitFor({ state: 'visible', timeout: 10000 });
      await closeButton.click();
      await this.page
        .locator(SELECTORS.COMPENSATION_TERMS_DIALOG)
        .first()
        .waitFor({ state: 'hidden', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.closeCompensationTermsDialog] Could not close the compensation terms dialog ` +
        `(selector: ${SELECTORS.COMPENSATION_TERMS_DIALOG_CLOSE}). The dialog may never have opened, or it ` +
        `stayed open after the close click. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "Related Items" button on the compensation quote card.
   */
  async clickCompensationRelatedItemsButton() {
    const button = this.page.locator(SELECTORS.COMPENSATION_RELATED_ITEMS_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickCompensationRelatedItemsButton] Could not click the compensation "Related Items" button ` +
        `(selector: ${SELECTORS.COMPENSATION_RELATED_ITEMS_BUTTON}). The button only renders in the ` +
        `ticket-related-quotes slot of a real compensation quote. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the compensation related-quotes dialog body to be visible.
   */
  async waitForCompensationRelatedQuotesVisible() {
    try {
      await this.page
        .locator(SELECTORS.COMPENSATION_RELATED_QUOTES)
        .first()
        .waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[CartPage.waitForCompensationRelatedQuotesVisible] The compensation related-items dialog did not open ` +
        `(selector: ${SELECTORS.COMPENSATION_RELATED_QUOTES}). Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the quote-title locators listed inside the compensation related-quotes dialog.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getCompensationRelatedQuoteTitles() {
    return this.page.locator(SELECTORS.COMPENSATION_RELATED_QUOTES_TITLE);
  }

  /**
   * Closes the compensation related-quotes dialog via its header close button.
   */
  async closeCompensationRelatedQuotesDialog() {
    const closeButton = this.page.locator(SELECTORS.COMPENSATION_RELATED_QUOTES_DIALOG_CLOSE).first();
    try {
      await closeButton.waitFor({ state: 'visible', timeout: 10000 });
      await closeButton.click();
      await this.page
        .locator(SELECTORS.COMPENSATION_RELATED_QUOTES)
        .first()
        .waitFor({ state: 'hidden', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.closeCompensationRelatedQuotesDialog] Could not close the compensation related-items dialog ` +
        `(selector: ${SELECTORS.COMPENSATION_RELATED_QUOTES_DIALOG_CLOSE}). Original: ${err.message}`
      );
    }
  }

  // ===== Manual approval controls (approvals dialog) =====

  /**
   * Clicks "Modify" in the approvals dialog, entering modify-approval mode.
   */
  async clickApprovalsModifyButton() {
    const button = this.page.locator(SELECTORS.APPROVALS_DIALOG_MODIFY_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickApprovalsModifyButton] Could not click "Modify" in the approvals dialog ` +
        `(selector: ${SELECTORS.APPROVALS_DIALOG_MODIFY_BUTTON}). The button only renders when ` +
        `isModifyApprovalAllowed is true — the logged-in user may lack approval-modify rights. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks "Skip all" in the approvals dialog footer. Only rendered in modify mode.
   */
  async clickApprovalsSkipAllButton() {
    const button = this.page.locator(SELECTORS.APPROVALS_DIALOG_SKIP_ALL_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickApprovalsSkipAllButton] Could not click "Skip all" in the approvals dialog footer ` +
        `(selector: ${SELECTORS.APPROVALS_DIALOG_SKIP_ALL_BUTTON}). It renders only while isModifyApprovalMode ` +
        `is active and an approval step is still pending — check that "Modify" was clicked first. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks "Save" in the approvals dialog, committing the skipped steps.
   */
  async clickApprovalsSaveButton() {
    const button = this.page.locator(SELECTORS.APPROVALS_DIALOG_SAVE_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await button.click();
    } catch (err) {
      throw new Error(
        `[CartPage.clickApprovalsSaveButton] Could not click "Save" in the approvals dialog ` +
        `(selector: ${SELECTORS.APPROVALS_DIALOG_SAVE_BUTTON}). The button is disabled until an approval ` +
        `step is actually changed (isSaveDisabled), so "Skip all" may not have registered. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the approvals dialog status-description locator.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getApprovalsStatusDescription() {
    return this.page.locator(SELECTORS.APPROVALS_DIALOG_STATUS_DESC).first();
  }

  /**
   * Closes the approvals dialog via its header close button.
   */
  async closeApprovalsDialog() {
    const closeButton = this.page.locator(SELECTORS.APPROVALS_DIALOG_CLOSE_BUTTON).first();
    try {
      await closeButton.waitFor({ state: 'visible', timeout: 10000 });
      await closeButton.click();
      await this.page
        .locator(SELECTORS.APPROVALS_DIALOG)
        .first()
        .waitFor({ state: 'hidden', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[CartPage.closeApprovalsDialog] Could not close the approvals dialog ` +
        `(selector: ${SELECTORS.APPROVALS_DIALOG_CLOSE_BUTTON}). Original: ${err.message}`
      );
    }
  }

  /**
   * Gets the flight quote card's title locator.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getFlightQuoteTitle() {
    return this.page.locator(SELECTORS.FLIGHT_QUOTE_TITLE).first();
  }

  /**
   * Gets the quote-name locators shown in the trip-cancellation confirmation dialog.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getTripCancellationQuoteNames() {
    return this.page.locator(SELECTORS.TRIP_CANCELLATION_QUOTE_NAME);
  }

  /**
   * Gets the status badge locator for one product's quote card.
   *
   * @param {'flight'|'compensation'} product
   * @returns {import('@playwright/test').Locator}
   */
  getQuoteStatusLabelForProduct(product) {
    const selectorByProduct = {
      flight: SELECTORS.FLIGHT_QUOTE_STATUS_LABEL,
      compensation: SELECTORS.COMPENSATION_QUOTE_STATUS_LABEL,
    };
    const selector = selectorByProduct[product];
    if (!selector) {
      throw new Error(
        `[CartPage.getQuoteStatusLabelForProduct] "product" must be one of ${Object.keys(selectorByProduct).join(', ')}, got: ${typeof product} (${product})`
      );
    }
    return this.page.locator(selector).first();
  }

}

// Export CartPage and SELECTORS for use in tests and DSL
module.exports = {
  CartPage,
  SELECTORS,
  CANCELLATION_CONFIRMED_TEXT,
};
