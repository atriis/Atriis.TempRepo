const { expect } = require("@playwright/test");
const { waitForText } = require("@utils/wait");
const { extractNumber, parseAmountText } = require("@utils/dom");
const { escapeRegExp } = require("@utils/text");
const { getNetworkInterceptor } = require("@utils/networkInterceptor");
const config = require("@config/config");

function parseDurationToMinutes(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('value must be a non-empty string');
  }

  const matches = [...value.matchAll(/(\d+)\s*([dhm])/gi)];
  if (!matches.length) {
    throw new Error(`Could not parse duration text: ${value}`);
  }

  return matches.reduce((total, [, amountText, unit]) => {
    const amount = Number.parseInt(amountText, 10);

    if (unit.toLowerCase() === 'd') {
      return total + (amount * 24 * 60);
    }

    if (unit.toLowerCase() === 'h') {
      return total + (amount * 60);
    }

    return total + amount;
  }, 0);
}

function parseDurationRange(rangeText) {
  if (!rangeText || typeof rangeText !== 'string') {
    throw new Error('rangeText must be a non-empty string');
  }

  const [startText, endText] = rangeText.split(/\s+-\s+/);
  if (!startText || !endText) {
    throw new Error(`Could not parse duration range text: ${rangeText}`);
  }

  return {
    startMinutes: parseDurationToMinutes(startText),
    endMinutes: parseDurationToMinutes(endText),
  };
}

/**
 * Page Object for flight results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Flight selection
  PRODUCT_LOADER: '.app-product-loader',
  // The loader slideshow shown while a search runs. Scoped to the product loader and matched by
  // stable class (not a positional :nth-child) so reordering loader content can't silently break it.
  SEARCH_SLIDESHOW: '.app-product-loader .slideshow',
  RESULTS_CONTAINER_SKELETON: '.results-container-skeleton',
  FILTER_CONTAINER_SKELETON: '.flight-filter-container-skeleton',
  CHANGE_FLIGHT_BUTTON: '.change-flight-btn-wrapper',
  CHANGE_FLIGHT_TEXT: 'Change flight',
  FLIGHT_STEPPER: '.flight-stepper',
  FLIGHT_STEPPER_PAGE_CONTAINER: '.flight-stepper .page-container',
  FLIGHT_STEPPER_PAGE_TITLE: '.page-title',
  FLIGHT_STEPPER_ACTIVE_CONTAINER: '.flight-stepper .page-container:has(.page-number.isActive)',
  COMPARISON_TOGGLE: '.comparison-btn span',
  COMPARISON_TABLE: '.ticket-layout-container .el-table__body-wrapper',
  COMPARISON_ROW: '.ticket-layout-container .el-table__body-wrapper tbody tr',
  COMPARISON_STOP_TYPE: '.stop-type',
  COMPARISON_PRICE_CELL: '.cell-price',
  // Carrier logos are the column headers of the comparison table (flight-comparison.vue), each an
  // <img class="carrier-logo"> (app-img). Matching `img.carrier-logo` excludes the empty stop-type
  // column header (a <div class="carrier-logo">). Each logo is wrapped in an el-tooltip whose content
  // is the carrier name, so a specific carrier is found by hovering the logo and reading the tooltip.
  COMPARISON_CARRIER_LOGO: '.ticket-layout-container img.carrier-logo',
  STOPS_FILTER: '.stops-filter',
  STOPS_FILTER_CONTAINER: '.stops-filter .filter-container',

  // Clear-all-filters link rendered by the carriers checkbox group (showClearAll) in flight-filter.vue.
  // Clicking it resets all applied flight-result filters.
  CLEAR_ALL_FILTERS_BTN: '.clear-all-btn',

  // Quick-sort bar (flight-list-sort.vue). Each sort option (Best / Cheapest / Quickest) renders as a
  // radio button that displays its resulting top price in a `.price` element.
  QUICK_SORT_RADIO_BUTTON: '.flight-list-sort .quick-sort .el-radio-button',
  QUICK_SORT_OPTION_PRICE: '.price',
  // State-modifier class Element Plus stamps on the selected el-radio-button of the quick-sort
  // group. The flight store defaults `filterBy.sortBy` to 'best', so on a freshly loaded results
  // page this is the "Best" option.
  QUICK_SORT_ACTIVE_BUTTON: '.flight-list-sort .quick-sort .el-radio-button.is-active',
  // Each quick-sort option renders three <p> elements inside its inner wrapper: the label, the
  // price (`.price`) and the average duration. The first one carries the option label.
  QUICK_SORT_OPTION_LABEL: '.el-radio-button__inner p',

  // Carriers checkbox filter (flight-filter.vue → .carriers-filter). Element Plus marks a checked
  // checkbox with the `is-checked` class on its `.el-checkbox__input`.
  CARRIERS_FILTER_CHECKBOX_LABEL: '.carriers-filter label.el-checkbox',
  // Every app-checkbox-group.vue filter row renders the option name and, when a results map is
  // supplied, a trailing value in `p.option-count`. For the carriers ("Preferred airlines") group
  // that value is NOT a count: flight.service.ts `_getLowestPriceMapData()` builds
  // resultMap[resultsIndex].carriers through getFormattedAbbreviatedPrice, so the row shows the
  // LOWEST price for that carrier, abbreviated ("$1.2K", "EUR 450"). Read it as text -- parsing the
  // digits out of an abbreviated price loses the magnitude.
  FILTER_OPTION_PRICE: '.option-count',
  FILTER_OPTION_NAME: '.el-checkbox__label p.filter-title',
  CHECKBOX_CHECKED_INPUT: '.el-checkbox__input.is-checked',
  // State-modifier class Element Plus stamps on a checked el-checkbox label/input.
  CHECKBOX_CHECKED_CLASS: 'is-checked',
  // The visible clickable box of an el-checkbox (distinct from the `.el-checkbox__input` wrapper).
  CHECKBOX_VISIBLE_BOX: '.el-checkbox__inner',

  // Airport filter
  AIRPORTS_FILTER_CONTAINER: '.filter-container',
  AIRPORTS_FILTER_HEADER: 'h4',
  FILTER_CHECKBOX_LABEL: 'label.el-checkbox',
  FILTER_CHECKBOX_INNER: '.el-checkbox__input',
  AIRPORT_OPTION_TEXT: '.airports-content',
  FILTER_VIEW_MORE_CONTAINER: '.view-txt-link',
  FILTER_VIEW_MORE_LABEL: '.view-more-btn',
  FILTER_VIEW_MORE_BUTTON: 'button',
  BY_SCHEDULE_PRICING_PAGE: '.flight-by-schedule-pricing',
  BY_SCHEDULE_ADD_TO_TRIP_BUTTON: '.flight-by-schedule-pricing .add-btn',
  SEARCH_FLIGHT_FILTER: '[placeholder="Search flight"]',
  RESULTS_BUTTON: '.btn.btn--primary',
  RESULTS_ADD_TO_TRIP_BUTTON: '.btn.btn--primary:has-text("Add to trip")',
  RESULTS_SELECT_BUTTON: '.btn.btn--primary:has-text("Select")',
  RESULTS_SHARE_BUTTON: '.btn.btn--primary:has-text("Share")',
  // Class selector preferred over getByRole because <app-btn isLinkStyle> may render as <a>, not <button>.
  FARE_RULES_BUTTON: '.fare-rules-btn',
  FARE_RULES_BUTTON_NAME: 'Fare rules',
  // Element Plus drawer transition classes are present only while animating.
  DRAWER_TRANSITION: '.el-overlay .el-drawer-fade-enter-active, .el-overlay .el-drawer-fade-leave-active',
  FLIGHT_DETAILS_SKELETON: '.flight-details-skeleton',
  // Visible cart flight drawers (More details / Price breakdown) over the cart page.
  OPEN_CART_FLIGHT_DRAWER: '.el-overlay:visible .app-drawer.flight-details-drawer, .el-overlay:visible .app-drawer.flight-price-breakdown-drawer',
  SEATS_BUTTON_NAME: 'Seats',
  FLIGHT_DETAILS_BUTTON_NAME: 'Flight details',
  FLIGHT_DETAILS_HEADLINE_PATTERN: / - /,
  FLIGHT_DURATION_TITLE_TEXT: 'Flight duration',
  SEAT_MAP_CONTAINER: '.deck-wrapper',
  SEAT_MAP_UNAVAILABLE_STATE: '.flight-deck .no-results',
  SEAT_PREVIEW_ONLY_MESSAGE: 'text=Preview only. Seat selection available at checkout.',
  // Results-page seat preview drawer host — same el-drawer component the cart uses
  // (flight-quote-card.vue: el-drawer.app-drawer.flight-details-drawer.seats).
  SEAT_MAP_DRAWER: '.app-drawer.flight-details-drawer.seats',

  // Pricing options modal
  PRICING_OPTIONS_BUTTON: '.btn.pricing-options',
  PRICING_OPTIONS_DRAWER: '.el-drawer__body',
  PRICING_OPTIONS_CARD: '.leg-pricing-option',
  PRICING_OPTIONS_CARD_PRICE: '.price-wrapper .price', // main displayed per-pax price within a card (scope under PRICING_OPTIONS_CARD)
  PRICING_OPTIONS_ITEM: '.leg-pricing-option',
  PRICING_OPTIONS_SELECT_BUTTON: '.select-btn',
  PRICING_OPTIONS_SELECT_BUTTON_NAME: 'Select',
  PRICING_OPTIONS_SELECT_TO_SHARE_BUTTON_NAME: 'Select to share',
  PRICING_OPTIONS_UNSELECT_BUTTON_TEXT: 'Unselect',
  PRICING_OPTIONS_AMOUNT_VALUE: '.leg-pricing-option .amount',
  PRICING_OPTIONS_PER_TRAVELLER_INDICATOR: '.leg-pricing-option .trip-type span',
  PRICING_OPTIONS_HEADER: '.main-info-wrapper .options-header h4',
  PRICING_OPTIONS_ADD_TO_TRIP_BUTTON: '.add-btn',
  PRICING_OPTIONS_SHARE_QUOTE_BUTTON: '.share-btn:not(.add-btn)',
  PRICING_OPTIONS_SHARE_QUOTE_FOOTER_BUTTON: '.summary-and-actions .share-btn',
  PRICING_OPTIONS_CLOSE_MODAL: '[aria-label="Close this dialog"]',
  PRICING_OPTIONS_OVERLAY: '.el-overlay:has(.app-drawer.flight-details-drawer)',
  PRICING_OPTIONS_OVERLAY_HEADING_TEXT: 'Pricing Options',
  PRICING_OPTIONS_TAB: '.pricing-options-tabs .el-tabs__item',
  PRICING_OPTIONS_CABIN_CLASS_TABS: '.cabin-class-tabs .el-tabs__item',
  PRICING_OPTIONS_CABIN_CLASS: '.leg-pricing-option .sub-class',
  PRICING_OPTIONS_BAGGAGE_CLASS: '.leg-details .baggage span',
  PRICING_OPTIONS_FARE_COMPONENT_TEXT: 'text=Fare component',
  OOP_INDICATOR_IN_PRICING_OPTION: '.app-out-of-policy',
  GREEN_CIRCLE_ICON_PRICING_OPTIONS: 'span.material-symbols-outlined.green',
  CONFLICT_MODAL_PROCEED: '.conflicting-quotes-dialog .btn:has-text("Proceed")',
  TRIP_OVERVIEW_TITLE: '.payments-title',

  // New Flight Flow (flight-selection component with brand cards)
  // .flight-brand-card is the stable CSS class; data-testid may not be present in all builds
  NEW_FLOW_BRAND_CARD: '.flight-brand-card',
  NEW_FLOW_BRAND_CARD_FARE: '.card.fare-card',
  NEW_FLOW_BRAND_LEG: '.flight-brand-leg',
  NEW_FLOW_LEG_HEADER_NAME: '.flight-brand-leg-header .header-name',
  NEW_FLOW_ADD_TO_CART_BUTTON: '[data-testid="flight.flight-selection.add-to-cart-btn"]',
  NEW_FLOW_SELECT_BUTTON: '[data-testid="flight.flight-selection.select-btn"]',
  // Footer primary action button ("Add to cart" by-price / "Select" by-schedule).
  // The flight-selection data-testids above are NOT present on the deployed build, so
  // target the single primary button in the footer's actions-section structurally
  // (the "Reset" button is btn--default, not primary). :visible guards against the
  // hidden mobile-dialog copy of the flight-selection component.
  NEW_FLOW_FOOTER_ACTION_BUTTON: '.flight-selection .selection-actions .actions-section button.btn--primary:visible',
  NEW_FLOW_BRAND_CARD_STARTING_FROM_LABEL: '.starting-from-label',
  NEW_FLOW_BRAND_CARD_PRICE: '[data-testid="flight.flight-selection.brand-card.price"]',
  NEW_FLOW_BRAND_CARD_PRICE_DELTA: '[data-testid="flight.flight-selection.brand-card.price-delta"]',
  NEW_FLOW_BRAND_CARD_PRICE_DELTA_PREFIX: '.price-delta-prefix',
  NEW_FLOW_BRAND_CARD_FEATURE_TEXT: '.features-text',
  NEW_FLOW_BRAND_CARD_SELECTED: '.card.fare-card.is-selected',
  // Staging strips data-testid in its build, so target the stable component class instead.
  NEW_FLOW_CHANGE_AND_CANCELLATION_WARNING: '.mixed-rules-warning',
  NEW_FLOW_NFF_CLOSE_BTN: '.flight-results-select-brand button.p-2',
  // Cabin-class tabs above a leg's brand cards (flight-brand-leg-tabs.vue). One tab per cabin
  // class the leg actually offers, labelled with the class name (Economy / Premium / Business).
  // Rendered as a button group on desktop; the narrow-screen build swaps in a dropdown instead.
  // The component puts data-testid on the tab CONTAINER only, not on the individual buttons,
  // so the button class is the most specific stable hook available.
  // DISTINCT from PRICING_OPTIONS_CABIN_CLASS_TABS, which belongs to the classic drawer.
  NEW_FLOW_LEG_CABIN_CLASS_TAB: '.flight-brand-leg-tabs .button-group-item',
  NEW_FLOW_LEG_CABIN_CLASS_TAB_ACTIVE_CLASS: 'active',

  // Classic Pricing Options drawer (pricing-options.vue) — leg-by-leg "Select fare" flow.
  // This renders for non-New-Flight-Flow accounts and is DISTINCT from the NFF brand
  // cards above (.flight-brand-leg / .flight-brand-card). Each leg tab exposes fare
  // cards (leg-pricing-option) with a "Select" button; the footer holds "Add to trip".
  PRICING_OPTIONS_LEG_SELECT_BTN: '.pricing-options .leg-pricing-option .select-btn',
  PRICING_OPTIONS_LEG_CARD: '.pricing-options .leg-pricing-option',
  PRICING_OPTIONS_LEG_CARD_BRAND_NAME: '.brand-name',
  PRICING_OPTIONS_TAB: '.pricing-options .pricing-options-tabs .el-tabs__item',
  PRICING_OPTIONS_TAB_ACTIVE_CLASS: 'is-active',
  PRICING_OPTIONS_TAB_SELECTED_ICON: '.material-symbols-outlined.green',
  PRICING_OPTIONS_ADD_TO_TRIP_BTN: '.pricing-options .app-footer .add-btn',
  // Footer total price per traveller (flight-selection.vue .selection-actions)
  NEW_FLOW_FOOTER_PRICE_SECTION: '.selection-actions .price-section',
  NEW_FLOW_FOOTER_PRICE_AMOUNT: '.selection-actions .price-section .amount',
  NEW_FLOW_FOOTER_TOTAL_PER_TRAVELLER_LABEL: 'Total per traveller',

  // Fare rules note
  FARE_RULES_NOTE: '.note',
  FARE_RULES_MAIN_HEADLINE: '.fare-rules .main-headline',
  // Fare rules drawer body. Only the active leg tab's content is rendered, so innerText
  // on this container returns the rules of whichever leg tab is currently selected.
  FARE_RULES_CONTAINER: '.fare-rules',

  // Fare rules leg tabs inside the drawer
  FARE_RULES_LEG_TAB: '.fare-rules-tabs .el-tabs__item',

  // Flight preview segment date text (format: "EEE, dd MMM" e.g. "Thu, 11 Dec")
  FLIGHT_DATE: '.flight-date',
  // Flight preview card
  FLIGHT_PREVIEW: '.flight-list .flight-preview',
  FLIGHT_PREVIEW_SEGMENT: '.flight-info-container',
  // "Select flight" primary button inside a result card (same button class as ResultsPage.getSelectButton);
  // scope to the card first, then filter by the button text.
  SELECT_FLIGHT_BUTTON: '.btn.btn--primary',
  SELECT_FLIGHT_BUTTON_TEXT: 'Select',
  RESULT_SEGMENT_CARRIER_NAME: '.carrier-container .carrier-name',
  RESULT_SEGMENT_FLIGHT_NUMBER_TEXT: '.carrier-container .carrier-name + p',
  FLIGHT_TIME: '.flight-time',
  FLIGHT_LOCATION_CODE: '.loc-code',
  MARKED_FLIGHT_LOCATION_CODE: '.loc-code.marked, .loc-code.markedEdge',
  FIRST_FLIGHT_RESULT_PRICE_WRAPPER: '.flight-list .flight-preview .price-wrapper',
  FIRST_FLIGHT_RESULT_AMOUNT: '.flight-list .flight-preview .price-wrapper .amount',
  OFFICE_HOURS_INFO_ICON: 'button.add-to-trip .app-tooltip__content',
  OFFICE_HOURS_TOOLTIP_TITLE: '.app-tooltip.hours-limitation-description .app-tooltip__title',
  RESULTS_CO2_TOOLTIP_TRIGGER: '.flight-list .flight-preview .co2-emissions-label .info-icon',
  FLIGHT_DETAILS_DRAWER: "[aria-label='Flight details']",
  FLIGHT_DETAILS_TOTAL_PRICE_AMOUNT: "[aria-label='Flight details'] .policy-and-price .price-wrapper .amount",
  FLIGHT_DETAILS_CO2_TOOLTIP_TRIGGER: "[aria-label='Flight details'] .co2-emissions-label .info-icon",
  CO2_TOOLTIP_DESCRIPTION: '.co2-emissions-tooltip .emission-description-bold',
  CO2_TOOLTIP_CLOSE_BUTTON: '.co2-emissions-tooltip .header .material-symbols-outlined',
  LIMIT_LAYOVER_DURATION_FILTER_CONTAINER: '.view-txt-link',
  LIMIT_LAYOVER_DURATION_FILTER_LABEL: 'Limit Layover Duration',
  TIME_SLIDER_SECTION: '.app-time-slider',
  TIME_SLIDER_RANGE_LABEL: '.time-label',
  TIME_SLIDER_RUNWAY: '.time-slider .el-slider__runway',
  TIME_SLIDER_HANDLE: '.time-slider .el-slider__button-wrapper',

  // Codeshare / Operated by
  FLIGHT_OPERATOR: '.flight-operator',
  FLIGHT_OPERATOR_IN_DRAWER: '.app-drawer.flight-details-drawer .flight-operator',
  OPERATED_BY_TEXT: 'Operated by',

  // Branded fares
  BRANDED_FARES_DRAWER: "[aria-label='Branded fares']",
  BRANDED_FARES_DRAWER_CLOSE: "[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']",
  BRAND_NAME: '.brand-name',
  ANCILLARIES_INCLUDED_TEXT: '.included .service-title',
  ANCILLARIES_INCLUDED_MESSAGE: 'The following ancillaries are included in this brand.',
  BRAND_NAME_BUTTON_IN_DETAILS: '.flight-details-bottom-bar .text-background button',
  BRAND_NAME_IN_PRICING_OPTIONS: '.leg-pricing-option .brand-name',
  // Branded fares unavailable message — rendered as <h6> inside the drawer when
  // both noBrandResults and noBrandFeatures are true (branded-fares.vue line 23,
  // i18n key flight.brandedFaresUnavailable)
  BRANDED_FARES_UNAVAILABLE_MESSAGE: "[aria-label='Branded fares'] h6:has-text('Brand information is currently unavailable')",

  // Carrier name in flight details drawer
  CARRIER_NAME_IN_DETAILS: '.flight-details-top-bar .carrier-name',
  // Carrier name in flight results list
  CARRIER_NAME_IN_RESULTS: '.flight-list .flight-preview .carrier-name',

  // EU Rail options banner (eu-rail-options.vue — appears in flight results when rail is available)
  EU_RAIL_OPTIONS_BANNER: '.eu-rail-options',
  // "Rail Options" CTA inside the EU Rail banner (eu-rail-options.vue — opens Benerail results in a new tab)
  EU_RAIL_OPTIONS_BUTTON: '.eu-rail-options .rails-btn',

  // Separated Tickets tag (flight-selection.vue / flight-preview.vue — shown when split rules apply)
  // Uses text-based selector since the tag is wrapped in el-tooltip which can interfere with CSS-class visibility checks
  SEPARATED_TICKETS_TAG: 'p.separated-tickets-tag',
  SEPARATED_TICKETS_TEXT: 'Separated Tickets',
  AGREEMENT_ICON: '.agreement-icon',
  INSTANT_PURCHASE_LABEL: '.instant-purchase',

  // Unused ticket eligibility tag on a flight result card (flight-preview.vue). No data-testid,
  // so matched by the translated label text ($t('flight.unusedTicketsAvailable')).
  UNUSED_TICKET_TAG_TEXT: 'Unused ticket available',

  // Marine Fare icon (flight-preview.vue / flight-by-schedule-pricing-option.vue)
  // Uses anchor material icon + "Marine fare" text — no data-testid available
  MARINE_FARE_ANCHOR_ICON: 'span.material-symbols-outlined:has-text("anchor")',

  // Advisory icons in flight preview segment (flight-preview-segment.vue)
  // Orange material icons for train/bus transportation advisories
  ADVISORY_ICON_ORANGE: '.flight-info-container span.material-symbols-outlined.orange',

  // Stopover indicator icon (EDIFACT/GDS flights marketed as non-stop that have hidden stops)
  // Tooltip-trigger material icons — hover each to find "Stop over" tooltip
  STOPOVER_TOOLTIP_TRIGGER_ICON: '.el-tooltip__trigger .material-symbols-outlined, .el-tooltip__trigger.material-symbols-outlined',

  // Flight details drawer — connection advisory message (flight-details.vue)
  // Works in both results drawer ([aria-label='Flight details']) and cart drawer ([aria-label='More details'])
  FLIGHT_DETAILS_CONNECTION_MSG: '.connection-msg',
  FLIGHT_DETAILS_TRANSPORT_ICON: '.connection-msg .material-symbols-outlined',
  FLIGHT_DETAILS_MATERIAL_ICON: '.material-symbols-outlined',
  // Flight details drawer — visible drawer container (results or cart)
  FLIGHT_DETAILS_VISIBLE_DRAWER: ".app-drawer.flight-details-drawer, [aria-label='More details']",
  // Flight details — segment top bar with carrier and equipment info
  FLIGHT_DETAILS_TOP_BAR: '.flight-details-top-bar',
  FLIGHT_DETAILS_AIRCRAFT_NAME: '.aircraft-name',
  // NDC direct rate label in flight info top bar
  FLIGHT_INFO_TOP_BAR_LABEL: '.flight-info-top-bar .is-align-items-center > :nth-child(2)',
  // "NDC direct rate" label text ($t('flight.ndcDirectRate')) — rendered only on NDC content in
  // flight-preview.vue and leg-pricing-option.vue. Its absence marks EDIFACT/GDS content.
  NDC_DIRECT_RATE_LABEL_TEXT: 'NDC direct rate',

  // Element Plus tooltip (rendered outside component tree)
  EL_POPPER_VISIBLE: '.el-popper:visible',

  // Results page breadcrumb — first item links back to the trip search page
  RESULTS_BREADCRUMB_SEARCH_LINK: '.results-breadscrumbs li:first-child a',

  // Flight info bar (flight-info-bar.vue) at the top of results — origin/destination render as
  // "CityName (Code)" on desktop. First `.ellipsis-txt` in `.origin-info` is the origin, last is
  // the destination.
  FLIGHT_INFO_BAR_LOCATION: '.flight-info-bar .origin-info p.ellipsis-txt',

  // Sort by dropdown (extended sort options in flight-list-sort component)
  SORT_BY_BUTTON: '.flight-list-sort .sort-by-wrapper',
  SORT_DROPDOWN_ITEM: (label) => `.el-dropdown-menu__item:has-text("${label}")`,

  // "Best" sort explanation info icon (flight-list-sort.vue) — the only `.tooltip-img` inside the
  // quick-sort bar, rendered next to the "Best" sort option. Hovering it surfaces the Element Plus
  // tooltip that explains how the "Best" ranking is calculated. Scoped to `.quick-sort` so it does
  // not collide with the in-policy `.tooltip-img` that lives in the actions bar of the same section.
  BEST_SORT_TOOLTIP_TRIGGER: '.flight-list-sort .quick-sort .tooltip-img',
};

class FlightResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the pricing options drawer overlay.
   * Filters for the overlay containing "Pricing Options" heading to avoid strict mode violations.
   */
  getPricingOptionsOverlay() {
    return this.page
      .locator(SELECTORS.PRICING_OPTIONS_OVERLAY)
      .filter({ hasText: SELECTORS.PRICING_OPTIONS_OVERLAY_HEADING_TEXT })
      .first();
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getFareRulesButton() {
    return this.page.locator(SELECTORS.FARE_RULES_BUTTON);
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getSeatsButton() {
    return this.page.getByRole('button', { name: SELECTORS.SEATS_BUTTON_NAME });
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getFlightDetailsButton() {
    return this.page.getByRole('button', { name: SELECTORS.FLIGHT_DETAILS_BUTTON_NAME });
  }

  /**
   * Gets the fare rules note element shown in the drawer.
   * @returns {import('@playwright/test').Locator}
   */
  getFareRulesNote() {
    return this.page.locator(SELECTORS.FARE_RULES_NOTE);
  }

  /**
   * Gets the fare rules headline that contains the fare basis.
   * @returns {import('@playwright/test').Locator}
   */
  getFareRulesMainHeadline() {
    return this.page.locator(SELECTORS.FARE_RULES_MAIN_HEADLINE).first();
  }

  /**
   * Gets the green circle icon in the pricing options modal.
   * This icon indicates a successful selection.
   * @param {number} index - Zero-based index of the icon (default: 0)
   * @returns {import('@playwright/test').Locator}
   */
  getGreenIconInPricingOptions(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    return overlay.locator(SELECTORS.GREEN_CIRCLE_ICON_PRICING_OPTIONS).nth(index);
  }

  /**
   * Clicks the "Select to share" button within the pricing options drawer.
   * Uses getByRole for reliable button targeting inside the drawer overlay.
   * 
   * @param {number} [index=0] - Index of the pricing option (default: 0 for first option)
   */
  async clickSelectToShareButton(index = 0) {
    // Target the button directly inside the pricing options overlay
    const overlay = this.getPricingOptionsOverlay();
    const selectButton = overlay
      .getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_TO_SHARE_BUTTON_NAME })
      .nth(index);
    
    await selectButton.waitFor({ state: 'visible', timeout: 10000 });
    await selectButton.click();
    
    // Wait for the UI to update after selection
    await this.page.waitForTimeout(1000);
  }

    /**
   * Clicks the "Select to share" button within the pricing options drawer.
   * Uses getByRole for reliable button targeting inside the drawer overlay.
   * 
   * @param {number} [index=0] - Index of the pricing option (default: 0 for first option)
   */
  async clickSelectButtonInPricingOptionsModal(index = 0) {
    // Target the button directly inside the pricing options overlay.
    // exact:true so "Select" does not also match the "Unselect" state.
    const overlay = this.getPricingOptionsOverlay();
    const selectButton = overlay
      .getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_BUTTON_NAME, exact: true })
      .nth(index);

    await selectButton.waitFor({ state: 'visible', timeout: 10000 });

    // Confirming a fare marks its leg tab with a green "check_circle" (isStepSelected).
    // This is the one post-selection signal that holds for every flow:
    //   - one-way / last leg: the fare also flips to "Unselect" on the visible tab.
    //   - multi-leg, non-last leg: selecting advances the wizard to the NEXT leg's
    //     tab (goToNextLeg), so no "Unselect" is ever visible on the active tab —
    //     but the just-selected leg's tab still gets its green check.
    // Waiting for the count of selected-leg checks to grow confirms the selection
    // registered (including the slower multipax price recalculation) in all cases,
    // and prevents a flaky click on a still-disabled button.
    const selectedLegChecks = overlay.locator(
      `${SELECTORS.PRICING_OPTIONS_TAB} ${SELECTORS.GREEN_CIRCLE_ICON_PRICING_OPTIONS}`,
    );
    const selectedBefore = await selectedLegChecks.count();

    await selectButton.click();

    await selectedLegChecks.nth(selectedBefore).waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Waits for the share quote button to be enabled.
   * This is used after selecting a pricing option to ensure the share button becomes clickable.
   */
  async waitForShareQuoteButtonEnabled() {
    // Wait for the share button to be enabled (not disabled)
    await this.page.locator(SELECTORS.PRICING_OPTIONS_SHARE_QUOTE_BUTTON)
      .first()
      .waitFor({ state: 'attached', timeout: 5000 });
    
    // Small delay to allow for state update
    await this.page.waitForTimeout(1000);
  }


  // ===== FLIGHT SELECTION =====

  /**
   * Waits for the Change Flight button to appear.
   *
   * Used when user needs to modify their flight selection.
   */
  async waitForChangeFlightButton() {
    await waitForText(
      this.page,
      SELECTORS.CHANGE_FLIGHT_BUTTON,
      SELECTORS.CHANGE_FLIGHT_TEXT
    );
  }

  /**
   * Clicks a segment in the by-schedule flight stepper.
   *
   * @param {number} segmentNumber - UI-visible segment number (1-based)
   */
  async clickByScheduleFlightSegment(segmentNumber) {
    if (!Number.isInteger(segmentNumber) || segmentNumber < 1) {
      throw new Error(`segmentNumber must be an integer >= 1, got: ${segmentNumber}`);
    }

    const segment = this.page
      .locator(SELECTORS.FLIGHT_STEPPER_PAGE_CONTAINER)
      .nth(segmentNumber - 1);

    await segment.waitFor({ state: 'visible', timeout: 15000 });
    await segment.locator(SELECTORS.FLIGHT_STEPPER_PAGE_TITLE).first().click({ timeout: 10000 });
  }

  /**
   * Returns the route title of the currently active leg in the by-schedule
   * flight stepper (e.g. "GLA to AMS").
   *
   * @returns {Promise<string>} Trimmed title text of the active leg
   */
  async getActiveByScheduleLegTitle() {
    const active = this.page.locator(SELECTORS.FLIGHT_STEPPER_ACTIVE_CONTAINER).first();
    await active.waitFor({ state: 'visible', timeout: 30000 });
    const title = await active.locator(SELECTORS.FLIGHT_STEPPER_PAGE_TITLE).first().textContent({ timeout: 10000 });
    return (title ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Reads the origin shown in the flight info bar at the top of the results page.
   * Desktop renders "CityName (Code)" (e.g. "London (LON)"); the first `.ellipsis-txt` in the
   * `.origin-info` block is the origin.
   * @returns {Promise<string>} Trimmed origin text (whitespace collapsed)
   */
  async getFlightInfoBarOriginText() {
    const origin = this.page.locator(SELECTORS.FLIGHT_INFO_BAR_LOCATION).first();
    try {
      await origin.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getFlightInfoBarOriginText] Origin not visible in the flight info bar ` +
        `(selector: ${SELECTORS.FLIGHT_INFO_BAR_LOCATION}). The flight results page may not have loaded, ` +
        `or the info bar is not rendered in this flow. Original: ${err.message}`
      );
    }
    return ((await origin.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Reads the destination shown in the flight info bar at the top of the results page.
   * Desktop renders "CityName (Code)" (e.g. "Amsterdam (AMS)"); the last `.ellipsis-txt` in the
   * `.origin-info` block is the destination.
   * @returns {Promise<string>} Trimmed destination text (whitespace collapsed)
   */
  async getFlightInfoBarDestinationText() {
    const destination = this.page.locator(SELECTORS.FLIGHT_INFO_BAR_LOCATION).last();
    try {
      await destination.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getFlightInfoBarDestinationText] Destination not visible in the flight info bar ` +
        `(selector: ${SELECTORS.FLIGHT_INFO_BAR_LOCATION}). The flight results page may not have loaded, ` +
        `or the info bar is not rendered in this flow. Original: ${err.message}`
      );
    }
    return ((await destination.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Types text in the search flight filter field.
   * Waits for the filter to be visible before typing.
   *
   * @param {string} text - The text to type in the search filter.
   */
  async typeInSearchFlightFilter(text) {
    // Wait for filter to be visible
    await this.page.locator(SELECTORS.SEARCH_FLIGHT_FILTER).waitFor({ state: 'visible', timeout: 60000 });
    
    // Clear any existing text and type new filter
    await this.page.fill(SELECTORS.SEARCH_FLIGHT_FILTER, text);
  }

  /**
   * Waits for actual flight result cards to be visible.
   * 
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForFlightResults(timeout = 60000) {
    await this.page.locator(SELECTORS.FLIGHT_PREVIEW).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Hovers over the first visible add-to-trip button in flight results.
   * Supports disabled buttons that surface an Element Plus tooltip.
   *
   * @param {{ timeout?: number }} options
   */
  async hoverFirstAddToTripButtonInResults({ timeout = 10000 } = {}) {
    const button = this.page.locator(SELECTORS.FLIGHT_PREVIEW).first()
      .locator(SELECTORS.RESULTS_ADD_TO_TRIP_BUTTON)
      .first();

    await button.waitFor({ state: 'visible', timeout });
    await button.hover({ force: true });
  }

  /**
   * Returns every "Add to trip" button in the flight results list, one per result card.
   * Scoped to FLIGHT_PREVIEW so the pricing-options / by-schedule buttons never leak in.
   *
   * @returns {import('@playwright/test').Locator} Locator resolving to all result "Add to trip" buttons
   */
  getAddToTripButtonsInResults() {
    return this.page
      .locator(SELECTORS.FLIGHT_PREVIEW)
      .locator(SELECTORS.RESULTS_ADD_TO_TRIP_BUTTON);
  }

  /**
   * Waits for the first fare card to render in the open Pricing Options drawer.
   *
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForPricingOptionCards(timeout = 60000) {
    try {
      await this.getPricingOptionsOverlay()
        .locator(SELECTORS.PRICING_OPTIONS_CARD)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.waitForPricingOptionCards] No pricing-option fare card became visible in the ` +
        `Pricing Options drawer within ${timeout}ms. The drawer likely never opened, or the fare list is empty. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the "Select" button of every fare card in the open Pricing Options drawer.
   * Scoping through the card (not the raw button selector) keeps the results-list buttons out.
   *
   * @returns {import('@playwright/test').Locator} Locator resolving to all fare-card "Select" buttons
   */
  getPricingOptionSelectButtons() {
    return this.getPricingOptionsOverlay()
      .locator(SELECTORS.PRICING_OPTIONS_CARD)
      .locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON);
  }

  /**
   * Gets the visible Element Plus tooltip text.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getVisibleTooltipText({ timeout = 10000 } = {}) {
    const tooltip = this.page.locator(SELECTORS.EL_POPPER_VISIBLE).first();
    await tooltip.waitFor({ state: 'visible', timeout });
    return (await tooltip.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  /**
   * Hovers the "Best" sort explanation info icon in the quick-sort bar so its Element Plus
   * tooltip becomes visible. Pair with getVisibleTooltipText() to read the explanation text.
   *
   * @param {{ timeout?: number }} [options]
   * @returns {Promise<void>}
   */
  async hoverBestSortTooltip({ timeout = 30000 } = {}) {
    const trigger = this.page.locator(SELECTORS.BEST_SORT_TOOLTIP_TRIGGER).first();
    try {
      await trigger.waitFor({ state: 'visible', timeout });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.hover({ force: true });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.hoverBestSortTooltip] Could not hover the "Best" sort explanation info icon ` +
        `(selector: ${SELECTORS.BEST_SORT_TOOLTIP_TRIGGER}) within ${timeout}ms. The quick-sort bar may not ` +
        `have rendered yet, or the "Best" sort option that carries the tooltip is absent. Original: ${err.message}`
      );
    }
  }

  /**
   * Hovers over the office-hours restriction info icon shown on restricted results.
   *
   * @param {{ timeout?: number }} options
   */
  async hoverOfficeHoursRestrictionInfoIcon({ timeout = 30000 } = {}) {
    const trigger = this.page.locator(SELECTORS.OFFICE_HOURS_INFO_ICON).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.hover();
  }

  /**
   * Gets the office-hours restriction tooltip title.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getOfficeHoursRestrictionTooltipTitle({ timeout = 10000 } = {}) {
    const title = this.page.locator(SELECTORS.OFFICE_HOURS_TOOLTIP_TITLE).first();
    await title.waitFor({ state: 'visible', timeout });
    return (await title.textContent())?.trim() ?? '';
  }

  /**
   * Opens the CO2 tooltip from the first visible flight result.
   *
   * @param {{ timeout?: number }} options
   */
  async openResultsCO2Tooltip({ timeout = 10000 } = {}) {
    const trigger = this.page.locator(SELECTORS.RESULTS_CO2_TOOLTIP_TRIGGER).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.click();
  }

  /**
   * Opens the CO2 tooltip inside the Flight Details drawer.
   *
   * @param {{ timeout?: number }} options
   */
  async openFlightDetailsCO2Tooltip({ timeout = 10000 } = {}) {
    const trigger = this.page.locator(SELECTORS.FLIGHT_DETAILS_CO2_TOOLTIP_TRIGGER).first();
    await trigger.waitFor({ state: 'visible', timeout });
    await trigger.click();
  }

  /**
   * Gets the visible CO2 tooltip description text.
   *
   * @param {{ timeout?: number }} options
   * @returns {Promise<string>}
   */
  async getCO2TooltipDescription({ timeout = 10000 } = {}) {
    const description = this.page.locator(SELECTORS.CO2_TOOLTIP_DESCRIPTION).first();
    await description.waitFor({ state: 'visible', timeout });
    return (await description.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  /**
   * Closes the visible CO2 tooltip.
   *
   * @param {{ timeout?: number }} options
   */
  async closeCO2Tooltip({ timeout = 10000 } = {}) {
    const closeButton = this.page.locator(SELECTORS.CO2_TOOLTIP_CLOSE_BUTTON).first();
    await closeButton.waitFor({ state: 'visible', timeout });
    await closeButton.click();
  }

  /**
   * Returns whether the flight results product loader is currently visible.
   *
   * @param {number} timeout - Max wait time in ms to detect visibility (default: 3000)
   * @returns {Promise<boolean>}
   */
  async isResultsLoaderVisible(timeout = 3000) {
    try {
      await this.page.locator(SELECTORS.PRODUCT_LOADER).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns whether the search loading screen (loader slideshow message) is currently visible.
   *
   * The slideshow appears immediately after a flight search is submitted and disappears
   * once results render, so callers should check it right after submitting the search.
   *
   * @param {number} timeout - Max wait time in ms to detect visibility (default: 5000)
   * @returns {Promise<boolean>}
   */
  async isSearchSlideshowVisible(timeout = 5000) {
    try {
      await this.page.locator(SELECTORS.SEARCH_SLIDESHOW).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the flight results product loader to be hidden.
   *
   * @param {number} timeout - Max wait time in ms (default: 120000)
   */
  async waitForResultsLoaderToFinish(timeout = 120000) {
    await this.page.locator(SELECTORS.PRODUCT_LOADER).first().waitFor({ state: 'hidden', timeout });
  }

  async isResultsSkeletonVisible(timeout = 3000) {
    try {
      await this.page.locator(SELECTORS.RESULTS_CONTAINER_SKELETON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async waitForResultsSkeletonToFinish(timeout = 120000) {
    await this.page.locator(SELECTORS.RESULTS_CONTAINER_SKELETON).first().waitFor({ state: 'hidden', timeout });
    await this.page.locator(SELECTORS.FILTER_CONTAINER_SKELETON).first().waitFor({ state: 'hidden', timeout });
  }

  /**
   * Gets the airport codes marked/highlighted in the first visible flight result.
   *
   * @returns {Promise<string[]>}
   */
  async getMarkedLocationCodesInFirstFlightResult() {
    await this.waitForFlightResults();

    const firstResult = this.page.locator(SELECTORS.FLIGHT_PREVIEW).first();
    await firstResult.waitFor({ state: 'visible', timeout: 30000 });

    const markedCodes = firstResult.locator(SELECTORS.MARKED_FLIGHT_LOCATION_CODE);
    await markedCodes.first().waitFor({ state: 'visible', timeout: 30000 });

    const codes = await markedCodes.allTextContents();

    return codes.map((code) => code.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  /**
   * Gets the normalized price-wrapper text from the first visible flight result.
   *
   * @returns {Promise<string>}
   */
  async getFirstFlightResultPriceText() {
    await this.waitForFlightResults();

    const priceWrapper = this.page.locator(SELECTORS.FIRST_FLIGHT_RESULT_PRICE_WRAPPER).first();
    await priceWrapper.waitFor({ state: 'visible', timeout: 30000 });

    const text = await priceWrapper.textContent();

    return text?.replace(/\s+/g, ' ').trim() ?? '';
  }

  async getFirstFlightResultPriceValue() {
    await this.waitForFlightResults();

    const price = this.page.locator(SELECTORS.FIRST_FLIGHT_RESULT_AMOUNT).first();
    await price.waitFor({ state: 'visible', timeout: 30000 });

    return await extractNumber(this.page, SELECTORS.FIRST_FLIGHT_RESULT_AMOUNT, 0);
  }

  async getFirstFlightResultDisplayAndOriginalPriceValues() {
    const { displayPrice, originalPrice } = await this.getFirstFlightResultDisplayAndOriginalPriceData();

    return { displayPrice, originalPrice };
  }

  async getFirstFlightResultDisplayPriceData() {
    await this.waitForFlightResults();

    const displayAmount = this.page.locator(SELECTORS.FIRST_FLIGHT_RESULT_AMOUNT).first();

    await displayAmount.waitFor({ state: 'visible', timeout: 30000 });

    const displayPriceText = await displayAmount.textContent();

    return {
      displayPriceText,
      displayPrice: parseAmountText(displayPriceText, 'first flight result display price'),
    };
  }

  async getFirstFlightResultDisplayAndOriginalPriceData() {
    await this.waitForFlightResults();

    const priceWrapper = this.page.locator(SELECTORS.FIRST_FLIGHT_RESULT_PRICE_WRAPPER).first();
    const amounts = priceWrapper.locator('.amount');

    await amounts.first().waitFor({ state: 'visible', timeout: 30000 });

    const amountCount = await amounts.count();
    if (amountCount < 2) {
      throw new Error(`Expected first flight result to show display and original prices, got ${amountCount} amount element(s)`);
    }

    const displayPriceText = await amounts.nth(0).textContent();
    const originalPriceText = await amounts.nth(1).textContent();

    return {
      displayPriceText,
      originalPriceText,
      displayPrice: parseAmountText(displayPriceText, 'first flight result display price'),
      originalPrice: parseAmountText(originalPriceText, 'first flight result original price'),
    };
  }

  /**
   * Waits for the comparison toggle button to be visible.
   *
   * @param {number} timeout
   */
  async waitForComparisonToggle(timeout = 60000) {
    await this.page.locator(SELECTORS.COMPARISON_TOGGLE).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Clicks the comparison toggle button.
   */
  async clickComparisonToggle() {
    await this.waitForComparisonToggle();
    await this.page.locator(SELECTORS.COMPARISON_TOGGLE).first().click();
  }

  /**
   * Waits for the comparison toggle to display an exact label.
   *
   * @param {string} expectedText
   * @param {number} timeout
   */
  async waitForComparisonToggleText(expectedText, timeout = 30000) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }

    await this.waitForComparisonToggle(timeout);
    await waitForText(this.page, SELECTORS.COMPARISON_TOGGLE, expectedText, timeout);
  }

  /**
   * Gets the current comparison toggle label.
   *
   * @returns {Promise<string>}
   */
  async getComparisonToggleText() {
    await this.waitForComparisonToggle();
    const toggleText = await this.page.locator(SELECTORS.COMPARISON_TOGGLE).first().textContent();

    return toggleText.replace(/[\r\n]+/g, '').trim();
  }

  /**
   * Waits for the flight comparison table to be visible.
   *
   * @param {number} timeout
   */
  async waitForComparisonTable(timeout = 60000) {
    await this.page.locator(SELECTORS.COMPARISON_TABLE).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Gets the comparison-table row for a stop label such as "Non Stop" or "1 Stop".
   *
   * @param {string} stopLabel
   * @returns {import('@playwright/test').Locator}
   */
  getComparisonRow(stopLabel) {
    if (!stopLabel || typeof stopLabel !== 'string') {
      throw new Error('stopLabel must be a non-empty string');
    }

    return this.page
      .locator(SELECTORS.COMPARISON_ROW)
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(stopLabel)}\\s*`, 'i') })
      .first();
  }

  /**
   * Counts visible price cells in a comparison-table stop row.
   *
   * @param {string} stopLabel
   * @returns {Promise<number>}
   */
  async getComparisonPriceCount(stopLabel) {
    await this.waitForComparisonTable();
    const row = this.getComparisonRow(stopLabel);
    await row.waitFor({ state: 'visible', timeout: 30000 });
    return await row.locator(SELECTORS.COMPARISON_PRICE_CELL).count();
  }

  /**
   * Clicks the "Clear all" filters link that resets every applied flight-result filter.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async clickClearAllFilters(timeout = 30000) {
    const clearAllButton = this.page.locator(SELECTORS.CLEAR_ALL_FILTERS_BTN).first();
    await clearAllButton.waitFor({ state: 'visible', timeout });
    await clearAllButton.click({ timeout });
  }

  /**
   * Reads the numeric price shown on a quick-sort option (Best / Cheapest / Quickest).
   * The quick-sort bar advertises, for each sort option, the price of the top result once
   * that sort is applied, so this is used to assert the first result reflects the sort.
   *
   * @param {string} sortLabel - Sort option label as shown in the UI (e.g. "Best", "Cheapest")
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<number|null>} The parsed price value for the sort option
   */
  async getQuickSortOptionPrice(sortLabel, timeout = 30000) {
    if (!sortLabel || typeof sortLabel !== 'string') {
      throw new Error(`sortLabel must be a non-empty string, got: ${typeof sortLabel}`);
    }

    const sortButton = this.page
      .locator(SELECTORS.QUICK_SORT_RADIO_BUTTON)
      .filter({ hasText: new RegExp(`\\b${escapeRegExp(sortLabel)}\\b`, 'i') })
      .first();

    await sortButton.waitFor({ state: 'visible', timeout });

    const priceElement = sortButton.locator(SELECTORS.QUICK_SORT_OPTION_PRICE).first();
    await priceElement.waitFor({ state: 'visible', timeout });

    return extractNumber(sortButton, SELECTORS.QUICK_SORT_OPTION_PRICE, 0);
  }

  /**
   * Reads the label of the quick-sort option that is currently selected. Element Plus marks the
   * selected el-radio-button with `is-active`, so this reports which sort the results are actually
   * ordered by without clicking anything -- used to assert the default sort on a freshly loaded
   * results page.
   *
   * Covers the three labelled options (Best / Cheapest / Quickest) only. The trailing extended
   * "Sort by" radio button renders a `.extended-sort-container` instead of the label/price/duration
   * paragraphs, so it carries no matching label element; read `SORT_BY_BUTTON` for that one.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<string>} The active sort option label, trimmed
   */
  async getActiveQuickSortLabel(timeout = 30000) {
    const activeButton = this.page.locator(SELECTORS.QUICK_SORT_ACTIVE_BUTTON).first();
    await activeButton.waitFor({ state: 'visible', timeout });

    const label = activeButton.locator(SELECTORS.QUICK_SORT_OPTION_LABEL).first();
    await label.waitFor({ state: 'visible', timeout });

    return (await label.textContent()).trim();
  }

  /**
   * Selects a carrier by clicking its logo (column header) in the comparison table.
   * Carrier logos carry no readable text, so each logo is hovered to reveal its el-tooltip
   * and the one whose tooltip matches the carrier name is clicked. Clicking a comparison-table
   * carrier logo filters results to that carrier and re-sorts them by cheapest.
   *
   * @param {string} carrierName - Carrier name as shown in the logo tooltip (e.g. "Air Europa")
   * @param {number} timeout - Max wait time in ms for the comparison table (default: 30000)
   */
  async clickComparisonCarrierLogo(carrierName, timeout = 30000) {
    if (!carrierName || typeof carrierName !== 'string') {
      throw new Error(`carrierName must be a non-empty string, got: ${typeof carrierName}`);
    }

    await this.waitForComparisonTable(timeout);

    const logos = this.page.locator(SELECTORS.COMPARISON_CARRIER_LOGO);
    await logos.first().waitFor({ state: 'visible', timeout });

    const logoCount = await logos.count();
    for (let i = 0; i < logoCount; i++) {
      const logo = logos.nth(i);
      if (!(await logo.isVisible())) {
        continue;
      }

      await logo.hover();

      // The first (stop-type) column header has no tooltip, so a short wait that times out
      // simply means "not this logo" and we move on to the next carrier column.
      const tooltip = this.page
        .locator(SELECTORS.EL_POPPER_VISIBLE)
        .filter({ hasText: carrierName })
        .first();
      const matched = await tooltip
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => true)
        .catch(() => false);

      if (matched) {
        await logo.click();
        return;
      }
    }

    throw new Error(
      `[FlightResultsPage.clickComparisonCarrierLogo] Could not find a comparison-table carrier logo ` +
      `with tooltip "${carrierName}". Verify the carrier appears as a column in the comparison table for this search.`
    );
  }

  /**
   * Reads one row of the "Preferred airlines" results filter (`.carriers-filter`) by its 1-based
   * position, returning the airline name and the lowest-price text shown on that row.
   *
   * The panel is rendered once and re-fed per displayed leg -- flight-filter.vue passes
   * `resultMap[resultsIndex].carriers` as the row values -- so the same position reads the current
   * leg's prices with no leg argument needed. app-checkbox-group.vue slices the group to
   * CHECKBOX_DISPLAY_COUNT (5) rows until "View more" is clicked, so positions 1-5 are readable
   * as-is; a position beyond the rendered rows throws rather than returning an empty value.
   *
   * @param {number} position - 1-based row position in the Preferred airlines filter
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<{airline: string, price: string}>} Row airline name and price text as shown
   */
  async getPreferredAirlinesFilterOptionByPosition(position, timeout = 30000) {
    if (!Number.isInteger(position) || position < 1) {
      throw new Error(
        `[FlightResultsPage.getPreferredAirlinesFilterOptionByPosition] "position" must be an integer >= 1, got: ${position}`
      );
    }

    const rows = this.page.locator(SELECTORS.CARRIERS_FILTER_CHECKBOX_LABEL);

    try {
      await rows.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getPreferredAirlinesFilterOptionByPosition] The "Preferred airlines" filter ` +
        `(${SELECTORS.CARRIERS_FILTER_CHECKBOX_LABEL}) rendered no rows within ${timeout}ms. The results ` +
        `filters are probably still loading, or this result set has no carriers to filter by. ` +
        `Original: ${err.message}`
      );
    }

    const renderedCount = await rows.count();
    if (position > renderedCount) {
      throw new Error(
        `[FlightResultsPage.getPreferredAirlinesFilterOptionByPosition] Requested row ${position} but the ` +
        `"Preferred airlines" filter renders only ${renderedCount} row(s). app-checkbox-group.vue shows at ` +
        `most 5 rows before "View more", so ask for a position within the visible rows or expand the group first.`
      );
    }

    const row = rows.nth(position - 1);
    await row.scrollIntoViewIfNeeded({ timeout });

    const priceElement = row.locator(SELECTORS.FILTER_OPTION_PRICE).first();
    try {
      await priceElement.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getPreferredAirlinesFilterOptionByPosition] Row ${position} of the ` +
        `"Preferred airlines" filter shows no price element (${SELECTORS.FILTER_OPTION_PRICE}) within ` +
        `${timeout}ms. app-checkbox-group.vue only renders it when a results map is supplied, so the ` +
        `filter was likely re-fed with no carrier price data for the displayed leg. Original: ${err.message}`
      );
    }

    const price = (await priceElement.textContent() || '').replace(/\s+/g, ' ').trim();
    if (!price) {
      throw new Error(
        `[FlightResultsPage.getPreferredAirlinesFilterOptionByPosition] Row ${position} of the ` +
        `"Preferred airlines" filter has an empty price. The row rendered before its price value ` +
        `arrived from resultMap[resultsIndex].carriers.`
      );
    }

    // The name is diagnostic only (it labels the row in the comparison error), so a row that
    // renders a carrier logo instead of a name reports an empty name rather than failing the read.
    const nameElement = row.locator(SELECTORS.FILTER_OPTION_NAME).first();
    const airline = (await nameElement.count())
      ? (await nameElement.textContent() || '').replace(/\s+/g, ' ').trim()
      : '';

    return { airline, price };
  }

  /**
   * Returns whether the carriers-filter checkbox for the given airline is checked.
   * Element Plus marks a checked checkbox with the `is-checked` class on its input wrapper.
   *
   * @param {string} airlineName - Airline label text (e.g. "Air Europa")
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isAirlineCheckboxChecked(airlineName, timeout = 15000) {
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error(`airlineName must be a non-empty string, got: ${typeof airlineName}`);
    }

    const checkboxLabel = this.page
      .locator(SELECTORS.CARRIERS_FILTER_CHECKBOX_LABEL, {
        has: this.page.locator(`p:text-is('${airlineName}')`),
      })
      .first();

    await checkboxLabel.waitFor({ state: 'visible', timeout });

    return checkboxLabel
      .locator(SELECTORS.CHECKBOX_CHECKED_INPUT)
      .waitFor({ state: 'attached', timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Returns whether the carriers-filter checkbox for the given airline has reached the
   * unchecked state (its `is-checked` input has left the DOM). Used to confirm that clearing
   * filters actually reset a previously-applied carrier filter.
   *
   * @param {string} airlineName - Airline label text (e.g. "Air Europa")
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isAirlineCheckboxUnchecked(airlineName, timeout = 15000) {
    if (!airlineName || typeof airlineName !== 'string') {
      throw new Error(`airlineName must be a non-empty string, got: ${typeof airlineName}`);
    }

    const checkboxLabel = this.page
      .locator(SELECTORS.CARRIERS_FILTER_CHECKBOX_LABEL, {
        has: this.page.locator(`p:text-is('${airlineName}')`),
      })
      .first();

    await checkboxLabel.waitFor({ state: 'visible', timeout });

    return checkboxLabel
      .locator(SELECTORS.CHECKBOX_CHECKED_INPUT)
      .waitFor({ state: 'detached', timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Checks if the stops filter container is visible.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isStopsFilterVisible(timeout = 15000) {
    try {
      const locator = this.page.locator(SELECTORS.STOPS_FILTER_CONTAINER).first();
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ticks the "No stops" filter checkbox. The Element Plus el-checkbox wraps a nested <label> that
   * swallows a label click, so click the visible box (.el-checkbox__inner) once, then wait for the
   * is-checked state.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async applyNoStopsFilter(timeout = 30000) {
    const group = this.page.locator(SELECTORS.STOPS_FILTER).first();
    await group.waitFor({ state: 'visible', timeout });
    const label = group
      .locator(SELECTORS.FILTER_CHECKBOX_LABEL)
      .filter({ hasText: /no\s*stops?/i })
      .first();
    await label.waitFor({ state: 'visible', timeout });
    await label.scrollIntoViewIfNeeded();

    const alreadyChecked = ((await label.getAttribute('class')) || '').includes(SELECTORS.CHECKBOX_CHECKED_CLASS);
    if (!alreadyChecked) {
      await label.locator(SELECTORS.CHECKBOX_VISIBLE_BOX).first().click({ force: true });
    }
    // Anchor the wait to the checked state Element Plus stamps on the label (no arbitrary sleep);
    // this throws on timeout if the click did not toggle the filter on.
    await group
      .locator(`${SELECTORS.FILTER_CHECKBOX_LABEL}.${SELECTORS.CHECKBOX_CHECKED_CLASS}`)
      .filter({ hasText: /no\s*stops?/i })
      .first()
      .waitFor({ state: 'attached', timeout });
  }

  // ===== PRICING OPTIONS MODAL =====

  /**
   * Waits for the pricing options button to be visible.
   *
   * @param {number} index - Zero-based index of the pricing options button (default: 0)
   */
  async waitForPricingOptionsButton(index = 0, timeout = 60000) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).nth(index).waitFor({ state: "visible", timeout });
  }

  /**
   * Gets the results-list "Pricing Options" button locator, for state assertions.
   *
   * @param {number} index - Zero-based index of the pricing options button (default: 0)
   * @returns {import('@playwright/test').Locator} Locator for that result's "Pricing Options" button
   */
  getPricingOptionsButton(index = 0) {
    return this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).nth(index);
  }

  async isPricingOptionsButtonVisible(timeout = 5000) {
    try {
      await this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the pricing options button to open the pricing options dialog.
   *
   * @param {number} index - Zero-based index of the pricing options button (default: 0)
   */
  async clickPricingOptionsButton(index = 0) {
    // Scroll into view and click with retry logic
    const button = this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).nth(index);
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 10000 });
  }

  /**
   * Returns the count of "Pricing Options" buttons in the results list, used to bound iteration across results.
   * @returns {Promise<number>}
   */
  async getPricingOptionsButtonCount() {
    return this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).count();
  }

  /**
   * Clicks a pricing option item/row to select it.
   * This selects the pricing tier (e.g., Basic, Standard, Premium).
   *
   * @param {number} index - Zero-based index of the pricing option (default: 0)
   */
  async clickPricingOptionItem(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_ITEM).nth(index).click();
  }

  /**
   * Waits for the pricing options Select button to be visible.
   *
   * @param {number} index - Zero-based index of the select button (default: 0)
   */
  async waitForPricingOptionsSelectButton(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).nth(index).waitFor({ state: "visible" });
  }

  /**
   * Clicks the select button within the pricing options dialog to confirm selection.
   *
   * @param {number} index - Zero-based index of the select button (default: 0)
   */
  async clickPricingOptionsSelectButton(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).nth(index).click();
  }

  /**
   * Returns the first pricing-option card inside the pricing-options modal whose
   * visible text contains the given substring. Used to locate a fare row by its
   * baggage / brand label (e.g. "1PC", "2PC Luggage").
   *
   * @param {string} cardText - Substring to match inside the card.
   * @returns {import('@playwright/test').Locator}
   */
  getPricingOptionCardByText(cardText) {
    const overlay = this.getPricingOptionsOverlay();
    return overlay
      .locator(SELECTORS.PRICING_OPTIONS_CARD)
      .filter({ hasText: cardText })
      .first();
  }

  /**
   * Returns the out-of-policy indicator locator scoped inside the first pricing-option
   * card whose visible text contains the given substring.
   *
   * @param {string} cardText - Substring identifying the target card.
   * @returns {import('@playwright/test').Locator}
   */
  getOOPIndicatorInPricingOptionByText(cardText) {
    return this.getPricingOptionCardByText(cardText)
      .locator(SELECTORS.OOP_INDICATOR_IN_PRICING_OPTION);
  }

  /**
   * Waits for and clicks the Select button inside the first pricing-option card
   * whose visible text contains the given substring.
   *
   * @param {string} cardText - Substring identifying the target card.
   */
  async clickSelectButtonInPricingOptionByText(cardText) {
    const card = this.getPricingOptionCardByText(cardText);
    await card.waitFor({ state: 'visible', timeout: 30000 });
    const selectButton = card.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON);
    await selectButton.waitFor({ state: 'visible', timeout: 15000 });
    await selectButton.click();
    // NOTE: small buffer for el-tabs to switch to the next leg after Select click —
    // the leg-pricing-option emits goToNextLeg async and there is no DOM signal we can reliably await
    await this.page.waitForTimeout(1000);
  }

  /**
   * Returns the displayed per-pax price of each pricing-option card on the current leg, in order.
   * Reads the main price only, not the leg-to-leg diff shown on later legs. Unparseable prices are null.
   * @returns {Promise<Array<number|null>>}
   */
  async getPricingOptionCardPrices() {
    const overlay = this.getPricingOptionsOverlay();
    const cards = overlay.locator(SELECTORS.PRICING_OPTIONS_CARD);
    await cards.first().waitFor({ state: 'visible', timeout: 120000 });

    const count = await cards.count();
    const prices = [];
    for (let i = 0; i < count; i += 1) {
      const priceText = (await cards.nth(i).locator(SELECTORS.PRICING_OPTIONS_CARD_PRICE).first().innerText().catch(() => '')).trim();
      let value = null;
      try {
        value = priceText ? parseAmountText(priceText, 'pricing option card price') : null;
      } catch {
        value = null;
      }
      prices.push(value);
    }
    return prices;
  }

  /**
   * Waits for the select button with "Select to share" text to be visible.
   * This is the initial state before selecting an option.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async waitForSelectToShareButton(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay
      .getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_TO_SHARE_BUTTON_NAME })
      .nth(index)
      .waitFor({ state: 'visible' });
  }

    /**
   * Waits for the select button with "Select to share" text to be visible.
   * This is the initial state before selecting an option.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async waitForSelectButtonInPricingOptionsModal(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay
      .getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_BUTTON_NAME })
      .nth(index)
      .waitFor({ state: 'visible', timeout: 120000 });
  }

  async isPricingOptionsPerTravellerLabelVisible(timeout = 30000) {
    const overlay = this.getPricingOptionsOverlay();
    const label = overlay.locator(SELECTORS.PRICING_OPTIONS_PER_TRAVELLER_INDICATOR).first();

    try {
      await label.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the select button to change its text to "Unselect" after being clicked.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async waitForPricingOptionsUnselectButton(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).nth(index).filter({ hasText: SELECTORS.PRICING_OPTIONS_UNSELECT_BUTTON_TEXT }).waitFor({ state: "visible" });
  }

  /**
   * Clicks the share quote button within the pricing options dialog footer.
   * The "+Share" button is in the app-footer area at the bottom of the drawer.
   */
  async clickPricingOptionsShareQuoteButton() {
    // The +Share button is in the footer area of the pricing options drawer
    const overlay = this.getPricingOptionsOverlay();
    const shareButton = overlay.locator(SELECTORS.PRICING_OPTIONS_SHARE_QUOTE_FOOTER_BUTTON);
    
    // Wait for share button to be enabled (not disabled)
    await shareButton.waitFor({ state: 'visible', timeout: 10000 });
    await shareButton.click();
  }

  /**
   * Clicks the X button to close the pricing options modal.
   *
   * @param {number} index - Zero-based index of the close button (default: 2)
   */
  // TODO: Locator needs to be created
  async clickXToClosePricingOptionsModal(index = 2) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_CLOSE_MODAL).nth(index).click();
  }

  /**
   * Waits for the pricing-options drawer overlay to be hidden.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   */
  async waitForPricingOptionsOverlayHidden(timeout = 15000) {
    await this.getPricingOptionsOverlay().waitFor({ state: 'hidden', timeout });
  }

  // TODO: Locator needs to be created
  async clickXToCloseFlightDetailsModal(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_CLOSE_MODAL).nth(index).click();
  }

  /**
   * Extracts the total price from the nth pricing option card in the drawer.
   *
   * Indexes by CARD, not by `.amount` node: once a fare is selected on one leg,
   * every card renders a second `.amount` for the "+ $X" combination delta, so a
   * flat nth() over `.amount` would read card 0's delta as "index 1".
   *
   * @param {number} index - Zero-based pricing option card index (default: 0)
   * @returns {Promise<number|null>} The card's total price, or null if not found
   */
  async getAmountPriceValuePricingOptions(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout: 60000 });
    const card = overlay.locator(SELECTORS.PRICING_OPTIONS_ITEM).nth(index);
    await card.locator('.amount').first().waitFor({ state: 'visible', timeout: 120000 });
    return extractNumber(card, '.amount', 0);
  }

  /**
   * Returns the cabin class text shown on the nth pricing option card,
   * e.g. "Cabin Business". Used to detect rendering bugs where the brand
   * description is missing and the value would otherwise be "undefined".
   *
   * @param {number} index - Zero-based pricing option index (default: 0)
   * @returns {Promise<string>} Trimmed cabin class label text
   */
  async getPricingOptionsCabinClassText(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout: 60000 });
    const cabin = overlay.locator(SELECTORS.PRICING_OPTIONS_CABIN_CLASS).nth(index);
    await cabin.waitFor({ state: 'visible', timeout: 30000 });
    const text = await cabin.textContent();
    return (text || '').trim();
  }

  /**
   * Gets all pricing option amounts as numbers, in display order.
   *
   * @returns {Promise<number[]>}
   */
  async getAllPricingOptionAmounts() {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout: 30000 });

    const cards = overlay.locator(SELECTORS.PRICING_OPTIONS_ITEM);
    await cards.first().waitFor({ state: 'visible', timeout: 30000 });

    // Wait for the price inside the first card to be visible before iterating,
    // preventing partial reads when cards render before their prices load.
    await cards.first().locator('.amount').first().waitFor({ state: 'visible', timeout: 30000 });

    const count = await cards.count();
    const amounts = [];

    // Take only the first .amount per card (display price), ignoring the bracketed original price
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).locator('.amount').first().textContent();
      const value = text ? Number(text.replace(/[^0-9.]/g, '')) : null;
      if (value !== null && !isNaN(value) && value > 0) {
        amounts.push(value);
      }
    }

    return amounts;
  }

  /**
   * Gets all original-price texts shown in the pricing options drawer.
   *
   * @returns {Promise<string[]>}
   */
  async getPricingOptionsOriginalPriceTexts() {
    const overlay = this.getPricingOptionsOverlay();
    const amountValues = overlay.locator(SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE);

    await overlay.waitFor({ state: 'visible', timeout: 30000 });
    await amountValues.first().waitFor({ state: 'visible', timeout: 30000 });

    const texts = await amountValues.allTextContents();

    return texts.map((text) => text.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }

  async getFirstPricingOptionDisplayAndOriginalPriceValues() {
    const { displayPrice, originalPrice } = await this.getFirstPricingOptionDisplayAndOriginalPriceData();

    return { displayPrice, originalPrice };
  }

  async getFirstPricingOptionDisplayAndOriginalPriceData() {
    const overlay = this.getPricingOptionsOverlay();
    const firstPricingOption = overlay.locator(SELECTORS.PRICING_OPTIONS_ITEM).first();
    const amounts = firstPricingOption.locator('.amount');

    await overlay.waitFor({ state: 'visible', timeout: 30000 });
    await amounts.first().waitFor({ state: 'visible', timeout: 30000 });

    const amountCount = await amounts.count();
    if (amountCount < 2) {
      throw new Error(`Expected first pricing option to show display and original prices, got ${amountCount} amount element(s)`);
    }

    const displayPriceText = await amounts.nth(0).textContent();
    const originalPriceText = await amounts.nth(1).textContent();

    return {
      displayPriceText,
      originalPriceText,
      displayPrice: parseAmountText(displayPriceText, 'first pricing option display price'),
      originalPrice: parseAmountText(originalPriceText, 'first pricing option original price'),
    };
  }

  /**
   * Reads the pricing options header text shown above the fare cards.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<string>} Header text
   */
  async getPricingOptionsHeaderText(timeout = 30000) {
    const overlay = this.getPricingOptionsOverlay();
    const header = overlay.locator(SELECTORS.PRICING_OPTIONS_HEADER).first();

    await header.waitFor({ state: 'visible', timeout });

    return (await header.textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  }

  getPricingOptionsTab(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    return overlay.locator(SELECTORS.PRICING_OPTIONS_TAB).nth(index);
  }

  async getPricingOptionsTabCount() {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout: 30000 });
    return await overlay.locator(SELECTORS.PRICING_OPTIONS_TAB).count();
  }

  async waitForPricingOptionsTabCount(expectedMinimum = 1, timeout = 30000) {
    if (typeof expectedMinimum !== 'number' || expectedMinimum < 1) {
      throw new Error(`expectedMinimum must be >= 1, got: ${expectedMinimum}`);
    }

    await expect.poll(
      async () => await this.getPricingOptionsTabCount(),
      { timeout },
    ).toBeGreaterThanOrEqual(expectedMinimum);
  }

  async waitForPricingOptionsTabRouteText(index, expectedRoute, timeout = 30000) {
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got: ${index}`);
    }

    if (!expectedRoute || typeof expectedRoute !== 'string') {
      throw new Error('expectedRoute must be a non-empty string');
    }
    const tab = this.getPricingOptionsTab(index);
    await expect(tab).toContainText(expectedRoute, { timeout });
  }

  async waitForPricingOptionsTabGreenIcon(index, timeout = 30000) {
    if (typeof index !== 'number' || index < 0) {
      throw new Error(`index must be >= 0, got: ${index}`);
    }
    const tab = this.getPricingOptionsTab(index);
    await expect(tab).toContainText('check_circle', { timeout });
  }

  /**
   * Clicks a cabin-class tab (Economy / Premium Eco / Business / First) at the
   * top of the pricing options modal. Matches the tab label by substring, so
   * passing "Premium" matches "Premium Eco" or "Premium Economy".
   *
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async clickPricingOptionsCabinClassTabByName(cabinName, timeout = 30000) {
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error('cabinName must be a non-empty string, got: ' + cabinName);
    }
    const overlay = this.getPricingOptionsOverlay();
    const tab = overlay.locator(SELECTORS.PRICING_OPTIONS_CABIN_CLASS_TABS).filter({ hasText: cabinName }).first();
    await tab.waitFor({ state: 'visible', timeout });
    await tab.click();
  }

  /**
   * Reads computed CSS color of the fare component text inside pricing options.
   *
   * @param {number} index - Zero-based index of fare component label (default: 0)
   * @returns {Promise<string>} CSS color value (for example, "rgb(0, 0, 0)")
   */
  async getFareComponentTextColorInPricingOptions(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    const fareComponentLabels = overlay.locator(SELECTORS.PRICING_OPTIONS_FARE_COMPONENT_TEXT);
    const fareComponentLabelCount = await fareComponentLabels.count();

    const target = fareComponentLabelCount > index
      ? fareComponentLabels.nth(index)
      : overlay.locator(SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE).nth(index);

    await target.waitFor({ state: 'visible', timeout: 30000 });

    return target.evaluate((element) => window.getComputedStyle(element).color);
  }

  /**
   * Waits for the "Fare rules" button to be visible.
   *
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 60000, accounts for NDC search loading)
   */
  async waitForFareRulesButton(index = 0, timeout = 60000) {
    await this.getFareRulesButton()
      .nth(index)
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for any open drawer to finish its open/close transition and for
   * inner loading skeletons to disappear. Without this, clicks inside the
   * drawer (e.g. Fare rules) can be intercepted by `.el-drawer__body` or
   * `.flight-details-skeleton` mid-animation.
   *
   * @param {number} timeout - Max wait time in ms (default: 15000)
   */
  async waitForDrawerToSettle(timeout = 15000) {
    await this.page
      .locator(SELECTORS.DRAWER_TRANSITION)
      .first()
      .waitFor({ state: 'detached', timeout })
      .catch(() => {});

    await this.page
      .locator(SELECTORS.FLIGHT_DETAILS_SKELETON)
      .first()
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
  }

  /**
   * Returns a locator for any visible cart flight drawer (More details or
   * Price breakdown). When present, the outer cart fare-rules button is
   * obscured and clicks must be scoped inside this overlay.
   *
   * @returns {import('@playwright/test').Locator}
   */
  getOpenCartFlightDrawer() {
    return this.page.locator(SELECTORS.OPEN_CART_FLIGHT_DRAWER);
  }

  /**
   * Returns true if a cart flight drawer (More details or Price breakdown)
   * is currently open over the cart.
   *
   * @returns {Promise<boolean>}
   */
  async isAnyCartFlightDrawerOpen() {
    return (await this.getOpenCartFlightDrawer().count()) > 0;
  }

  /**
   * Clicks the "Fare rules" button inside the currently open cart flight
   * drawer (More details or Price breakdown).
   *
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitAndClickFareRulesButtonInOpenCartDrawer(timeout = 60000) {
    const button = this.getOpenCartFlightDrawer()
      .locator(SELECTORS.FARE_RULES_BUTTON)
      .first();
    await button.waitFor({ state: 'visible', timeout });
    await button.scrollIntoViewIfNeeded().catch(() => {});
    await button.click();
  }

  /**
   * Waits for then clicks a Fare rules button scoped to the pricing options
   * overlay, so background buttons blocked by the overlay are excluded.
   *
   * @param {number} index - Zero-based index within the overlay (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitAndClickFareRulesButtonInPricingOptions(index = 0, timeout = 60000) {
    const button = this.getPricingOptionsOverlay()
      .locator(SELECTORS.FARE_RULES_BUTTON)
      .nth(index);
    await button.waitFor({ state: 'visible', timeout });
    await this.waitForDrawerToSettle();
    await button.click();
  }

  /**
   * Clicks the "Fare rules" button inside the flight details drawer.
   * Uses the flight details drawer aria-label instead of the pricing options overlay.
   *
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitAndClickFareRulesButtonInFlightDetails(timeout = 60000) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_DRAWER);
    const button = drawer
      .locator(SELECTORS.FARE_RULES_BUTTON)
      .first();
    await button.waitFor({ state: 'visible', timeout });
    await this.waitForDrawerToSettle();
    await button.click();
  }

  /**
   * Clicks the "Fare rules" button.
   *
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   */
  async clickFareRulesButton(index = 0) {
    await this.getFareRulesButton()
      .nth(index)
      .click();
  }

  /**
   * Waits for the fare rules note to become visible.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFareRulesNote(timeout = 30000) {
    await this.getFareRulesNote().waitFor({
      state: 'visible',
      timeout,
    });
  }

  /**
   * Waits for the fare rules headline to become visible.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFareRulesMainHeadline(timeout = 30000) {
    await this.getFareRulesMainHeadline().waitFor({
      state: 'visible',
      timeout,
    });
  }

  /**
   * Gets the fare rules headline text.
   *
   * @returns {Promise<string>}
   */
  async getFareRulesMainHeadlineText() {
    const headline = this.getFareRulesMainHeadline();
    return (await headline.textContent()).trim();
  }

  /**
   * Gets the visible text of the fare rules drawer for the active leg tab.
   *
   * @returns {Promise<string>}
   */
  async getFareRulesDrawerText() {
    return await this.page.locator(SELECTORS.FARE_RULES_CONTAINER).first().innerText();
  }

  /**
   * Gets a leg tab inside the fare rules drawer by zero-based index.
   *
   * @param {number} index - Zero-based index of the leg tab
   * @returns {import('@playwright/test').Locator}
   */
  getFareRulesLegTab(index = 0) {
    return this.page.locator(SELECTORS.FARE_RULES_LEG_TAB).nth(index);
  }

  /**
   * Waits for a fare rules leg tab to be visible.
   *
   * @param {number} index - Zero-based index of the leg tab
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFareRulesLegTab(index = 0, timeout = 30000) {
    await this.getFareRulesLegTab(index).waitFor({ state: 'visible', timeout });
  }

  /**
   * Clicks a leg tab inside the fare rules drawer.
   *
   * @param {number} index - Zero-based index of the leg tab
   */
  async clickFareRulesLegTab(index = 0) {
    await this.getFareRulesLegTab(index).click();
  }

  // ===== FLIGHT DETAILS INTERACTIONS =====

  /**
   * Waits for the Flight Details button to be visible.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFlightDetailsButton(index = 0, timeout = 30000) {
    await this.getFlightDetailsButton()
      .nth(index)
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Waits for the Seats button to be visible.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForSeatsButton(index = 0, timeout = 30000) {
    await this.getSeatsButton()
      .nth(index)
      .waitFor({ state: 'visible', timeout });
  }

  /**
   * Clicks the Flight Details button to open the flight details view.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async clickFlightDetailsButton(index = 0) {
    await this.getFlightDetailsButton()
      .nth(index)
      .click();
  }

  /**
   * Clicks the Seats button to open the seat preview drawer from results.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async clickSeatsButton(index = 0) {
    await this.getSeatsButton()
      .nth(index)
      .click();
  }

  /**
   * Waits for the flight details headline to be visible.
   * The headline follows the pattern "Origin - Destination".
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFlightDetailsHeadline(timeout = 30000) {
    await this.page.getByRole('heading', {
      level: 3,
      name: SELECTORS.FLIGHT_DETAILS_HEADLINE_PATTERN,
    }).first().waitFor({
      state: 'visible',
      timeout,
    });
  }

  async getFlightDetailsTotalPrice(timeout = 30000) {
    const totalPrice = this.page.locator(SELECTORS.FLIGHT_DETAILS_TOTAL_PRICE_AMOUNT).first();
    await totalPrice.waitFor({ state: 'visible', timeout });

    return await extractNumber(this.page, SELECTORS.FLIGHT_DETAILS_TOTAL_PRICE_AMOUNT, 0);
  }

  /**
   * Waits for the results seat preview drawer to show either a rendered seat map
   * or the empty-state panel when no map is available.
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
   * Reports whether the results seat drawer is showing a rendered seat map.
   * `waitForSeatMapOrUnavailableState` must have settled first — this is a
   * point-in-time read, not a wait.
   * @returns {Promise<boolean>}
   */
  async isSeatMapDisplayed() {
    return await this.page.locator(SELECTORS.SEAT_MAP_CONTAINER).first().isVisible();
  }

  /**
   * Reports whether the results seat drawer is showing the "Seating map is not
   * available at the moment" empty state instead of a seat map.
   * @returns {Promise<boolean>}
   */
  async isSeatMapUnavailableStateVisible() {
    return await this.page.locator(SELECTORS.SEAT_MAP_UNAVAILABLE_STATE).first().isVisible();
  }

  /**
   * Closes the results seat preview drawer via Escape and waits for it to detach.
   * The drawer is destroy-on-close, so the next open renders fresh content for
   * whichever leg is active rather than reusing the previous leg's map.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   */
  async closeSeatMapDrawer(timeout = 10000) {
    const drawer = this.page.locator(SELECTORS.SEAT_MAP_DRAWER).first();
    try {
      await drawer.waitFor({ state: 'visible', timeout: 5000 });
      await this.page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.closeSeatMapDrawer] Failed to close the results seat drawer ` +
        `(selector: ${SELECTORS.SEAT_MAP_DRAWER}). It may not have been open, or Escape did ` +
        `not dismiss it. Original: ${err.message}`,
      );
    }
  }

  /**
   * Gets the preview-only message shown in the results seat drawer.
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<string>}
   */
  async getSeatPreviewOnlyMessage(timeout = 30000) {
    const message = this.page.locator(SELECTORS.SEAT_PREVIEW_ONLY_MESSAGE).first();
    await message.waitFor({ state: 'visible', timeout });
    return (await message.textContent()).trim();
  }

async clickAddToTripButtonPricingOptionsModal() {
  if (await this.isBySchedulePricingPageVisible()) {
    await this.clickAddToTripButtonBySchedulePricingPage();
    return;
  }

  const addButton = this.page.locator(SELECTORS.PRICING_OPTIONS_ADD_TO_TRIP_BUTTON);

  // Wait for button to be enabled (not disabled)
  await addButton.waitFor({ state: 'attached', timeout: 30000 });

  // Additional wait for the disabled attribute to be removed
  await this.page.waitForTimeout(1500);
  
  // Click the button and wait for navigation if it occurs
  await Promise.all([
    this.page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
    addButton.click({ timeout: 30000 })
  ]);
  
  // Race: wait for either the modal to close or a "Conflicting Quotes" dialog to appear
  const overlayHidden = this.getPricingOptionsOverlay()
    .waitFor({ state: 'hidden', timeout: 60000 })
    .then(() => 'hidden')
    .catch(() => null);
  const conflictDialog = this.page
    .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
    .first()
    .waitFor({ state: 'visible', timeout: 60000 })
    .then(() => 'conflict')
    .catch(() => null);

  const result = await Promise.race([overlayHidden, conflictDialog]);

  if (result === 'conflict') {
    await this.page.locator(SELECTORS.CONFLICT_MODAL_PROCEED).first().click({ force: true });
    // After clicking Proceed, wait for overlay to close
    await this.getPricingOptionsOverlay().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  }
  
  // Wait for any page updates to complete (API calls, DOM updates, potential navigation)
  await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    return this.page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  });
  
  // Additional stabilization for slow environments
  await this.page.waitForTimeout(2000);
}

async confirmBySchedulePricingSelection() {
  const overlay = this.getPricingOptionsOverlay();
  // The bottom "Select" confirmation button is the last "Select" button in the overlay
  // (after the per-fare Select buttons for Standard, Flex, etc.)
  const confirmButton = overlay.getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_BUTTON_NAME }).last();
  await confirmButton.waitFor({ state: 'visible', timeout: 30000 });
  await confirmButton.scrollIntoViewIfNeeded();
  await confirmButton.click({ timeout: 15000 });

  try {
    await overlay.waitFor({ state: 'hidden', timeout: 30000 });
  } catch (error) {
    await this.page.screenshot({
      path: 'test-results/screenshots/confirm-by-schedule-pricing-selection-overlay-timeout.png',
      fullPage: true
    }).catch(() => undefined);

    throw new Error(`Pricing options overlay did not close after confirming selection: ${error.message}`);
  }

  await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  try {
    await overlay.waitFor({ state: 'hidden', timeout: 30000 });
  } catch (err) {
    throw new Error(
      `Pricing options overlay did not close within 30s after clicking the confirm "Select" button. ` +
      `The page is likely stuck on the pricing options modal. Original error: ${err.message}`
    );
  }

  // networkidle is best-effort: some long-polling/analytics requests legitimately keep
  // the network busy. Fall back to 'load' and surface a warning instead of failing here.
  try {
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  } catch {
    await this.page.waitForLoadState('load', { timeout: 15000 });
  }
  await this.page.waitForTimeout(2000);
}

async isBySchedulePricingPageVisible(timeout = 3000) {
  const pricingPage = this.page.locator(SELECTORS.BY_SCHEDULE_PRICING_PAGE).first();

  try {
    await pricingPage.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

async waitForBySchedulePricingAddToTripOutcome(timeout = 45000) {
  const cartUrl = this.page
    .waitForURL(/\/cart(?:[/?#]|$)/, { timeout })
    .then(() => 'cart')
    .catch(() => null);
  const cartTitle = this.page
    .locator(SELECTORS.TRIP_OVERVIEW_TITLE)
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => 'cart')
    .catch(() => null);
  const conflictDialog = this.page
    .locator(SELECTORS.CONFLICT_MODAL_PROCEED)
    .first()
    .waitFor({ state: 'visible', timeout })
    .then(() => 'conflict')
    .catch(() => null);

  const outcome = await Promise.race([cartUrl, cartTitle, conflictDialog]);

  if (outcome) {
    return outcome;
  }

  return (await this.isBySchedulePricingPageVisible(1000)) ? 'pricing' : 'unknown';
}

async clickAddToTripButtonBySchedulePricingPage() {
  const addButton = this.page.locator(SELECTORS.BY_SCHEDULE_ADD_TO_TRIP_BUTTON).first();

  await addButton.waitFor({ state: 'visible', timeout: 30000 });
  await addButton.scrollIntoViewIfNeeded();

  // Pre-dismiss any conflict dialog that was left open by a prior action
  const preExistingConflict = this.page.locator(SELECTORS.CONFLICT_MODAL_PROCEED).first();
  const preConflictVisible = await preExistingConflict.isVisible().catch(() => false);
  if (preConflictVisible) {
    await preExistingConflict.click({ force: true });
    await this.page.waitForTimeout(1000);
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
      addButton.click({ timeout: 30000 }),
    ]);

    // Loop: dismiss all conflict dialogs that appear (app can chain multiple conflicts)
    let outcome = await this.waitForBySchedulePricingAddToTripOutcome();
    let conflictCount = 0;
    while (outcome === 'conflict' && conflictCount < 3) {
      conflictCount++;
      await this.page.locator(SELECTORS.CONFLICT_MODAL_PROCEED).first().click({ force: true });
      outcome = await this.waitForBySchedulePricingAddToTripOutcome(60000);
    }

    if (outcome === 'cart') {
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      return;
    }

    if (attempt === 1 && (outcome === 'pricing' || outcome === 'unknown')) {
      await addButton.waitFor({ state: 'visible', timeout: 10000 });
      continue;
    }

    throw new Error('Add to trip from by-schedule pricing did not navigate to cart');
  }
}

/**
 * Waits for the green circle icon to appear in the pricing options modal.
 * This icon indicates a successful selection.
 *
 * @param {number} index - Zero-based index of the icon (default: 0)
 * @param {number} timeout - Max wait time in ms (default: 30000)
 */
async waitForGreenIconPricingOptionsModal(index = 0, timeout = 30000) {
  const overlay = this.getPricingOptionsOverlay();
  await overlay
    .locator(SELECTORS.GREEN_CIRCLE_ICON_PRICING_OPTIONS)
    .nth(index)
    .waitFor({ state: 'visible', timeout });
}

async clickSelectForFareWithBaggagePricingOptions(baggageText) {
  // Find the pricing option card that contains the specified baggage text
  // Uses partial text matching to be flexible with label formats (e.g., "1 PC", "Luggage 1 PC")
  const card = this.page.locator(SELECTORS.PRICING_OPTIONS_CARD).filter({
    has: this.page.locator(SELECTORS.PRICING_OPTIONS_BAGGAGE_CLASS, {
      hasText: baggageText
    })
  }).first();

  // Wait for the card to be visible
  await card.waitFor({ state: 'visible', timeout: 30000 });
  
  // Find and click the select button within this card
  const selectButton = card.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON);
  await selectButton.waitFor({ state: 'visible', timeout: 15000 });
  await selectButton.click();
}

  /**
   * Reports whether the open pricing-options modal offers a fare with the given baggage allowance,
   * so a caller scanning results can act on a miss instead of failing on it.
   *
   * @param {string} baggageText - Baggage label substring (e.g. "0PC")
   * @param {number} [timeout=8000] - Render allowance before treating the fare as absent
   * @returns {Promise<boolean>}
   */
  async hasFareWithBaggageInPricingOptions(baggageText, timeout = 8000) {
    // Scoped to the drawer so a card from a previously scanned result cannot match
    const card = this.getPricingOptionsOverlay()
      .locator(SELECTORS.PRICING_OPTIONS_CARD)
      .filter({ has: this.page.locator(SELECTORS.PRICING_OPTIONS_BAGGAGE_CLASS, { hasText: baggageText }) })
      .first();

    try {
      await card.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Static title: "Flight duration"
  getFlightDurationTitle() {
    return this.page.getByText(SELECTORS.FLIGHT_DURATION_TITLE_TEXT, { exact: false }).first();
  }

  // Dynamic title: e.g., "Depart from London", "Depart from Madrid"
  getFlightDurationFromLocationTitle(location) {
    return this.page.getByText(location, { exact: false }).first();
  }

  getLimitLayoverDurationFilterContainer() {
    return this.page
      .locator(SELECTORS.LIMIT_LAYOVER_DURATION_FILTER_CONTAINER)
      .filter({ has: this.page.getByText(new RegExp(`^${escapeRegExp(SELECTORS.LIMIT_LAYOVER_DURATION_FILTER_LABEL)}$`, 'i')) })
      .first();
  }

  getLimitLayoverDurationExpandButton() {
    return this.getLimitLayoverDurationFilterContainer().locator('button').first();
  }

  getLimitLayoverDurationSliderSection() {
    return this.getLimitLayoverDurationFilterContainer().locator(SELECTORS.TIME_SLIDER_SECTION).first();
  }

  getLimitLayoverDurationRangeLabel() {
    return this.getLimitLayoverDurationSliderSection().locator(SELECTORS.TIME_SLIDER_RANGE_LABEL).first();
  }

  async expandLimitLayoverDurationFilter() {
    const container = this.getLimitLayoverDurationFilterContainer();
    const sliderSection = this.getLimitLayoverDurationSliderSection();

    await container.waitFor({ state: 'visible', timeout: 10000 });

    const isExpanded = await sliderSection.isVisible().catch(() => false);
    if (isExpanded) {
      return;
    }

    const expandButton = this.getLimitLayoverDurationExpandButton();
    await expandButton.scrollIntoViewIfNeeded();
    await expandButton.click();
    await sliderSection.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getLimitLayoverDurationFilterSummary() {
    await this.expandLimitLayoverDurationFilter();

    const rangeLabel = this.getLimitLayoverDurationRangeLabel();
    const rangeText = ((await rangeLabel.textContent()) || '').replace(/\s+/g, ' ').trim();

    if (!rangeText) {
      throw new Error('No visible Limit Layover Duration range label was found');
    }

    const { startMinutes, endMinutes } = parseDurationRange(rangeText);

    return { rangeText, startMinutes, endMinutes };
  }

  async adjustLimitLayoverDurationFilterFromMidpoint() {
    const summary = await this.getLimitLayoverDurationFilterSummary();
    const totalRangeMinutes = summary.endMinutes - summary.startMinutes;

    if (totalRangeMinutes <= 0) {
      throw new Error(`Limit Layover Duration range must be positive, got: ${summary.rangeText}`);
    }

    const targetStartMinutes = Math.floor(summary.startMinutes + (totalRangeMinutes / 2));
    const section = this.getLimitLayoverDurationSliderSection();
    const runway = section.locator(SELECTORS.TIME_SLIDER_RUNWAY).first();
    const lowerHandle = section.locator(SELECTORS.TIME_SLIDER_HANDLE).first();

    await section.scrollIntoViewIfNeeded();
    await runway.waitFor({ state: 'visible', timeout: 10000 });
    await lowerHandle.waitFor({ state: 'visible', timeout: 10000 });

    const runwayBox = await runway.boundingBox();
    const handleBox = await lowerHandle.boundingBox();

    if (!runwayBox || !handleBox) {
      throw new Error('Could not determine Limit Layover Duration slider geometry');
    }

    const currentX = handleBox.x + (handleBox.width / 2);
    const currentY = handleBox.y + (handleBox.height / 2);
    const targetX = runwayBox.x + (runwayBox.width * ((targetStartMinutes - summary.startMinutes) / totalRangeMinutes));

    await this.page.mouse.move(currentX, currentY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, currentY, { steps: 12 });
    await this.page.mouse.up();

    await this.page.waitForFunction(
      ([containerSelector, labelText, rangeSelector, previousRangeText]) => {
        const containers = Array.from(document.querySelectorAll(containerSelector));
        const container = containers.find((element) =>
          element.textContent.replace(/\s+/g, ' ').includes(labelText),
        );

        if (!container) {
          return false;
        }

        const rangeElement = container.querySelector(rangeSelector);
        if (!rangeElement) {
          return false;
        }

        return rangeElement.textContent.replace(/\s+/g, ' ').trim() !== previousRangeText;
      },
      [
        SELECTORS.LIMIT_LAYOVER_DURATION_FILTER_CONTAINER,
        SELECTORS.LIMIT_LAYOVER_DURATION_FILTER_LABEL,
        SELECTORS.TIME_SLIDER_RANGE_LABEL,
        summary.rangeText,
      ],
      { timeout: 15000 },
    );

    return {
      adjusted: true,
      originalRangeText: summary.rangeText,
      targetStartMinutes,
    };
  }

  /**
   * Extracts the arrival date text from a flight result preview card.
   * Returns the date in the format displayed in the UI (e.g., "Thu, 11 Dec").
   * @param {number} cardIndex - Zero-based index of the flight preview card (default: 0)
   * @returns {Promise<string>} The arrival date text
   */
  async getFlightArrivalDate(cardIndex = 0) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).nth(cardIndex);
    await card.waitFor({ state: 'visible', timeout: 60000 });
    // Arrival date is the second .flight-date element in the card
    const arrivalDate = card.locator(SELECTORS.FLIGHT_DATE).nth(1);
    return (await arrivalDate.textContent()).trim();
  }

  /**
   * Builds a locator for the carrier name of one leg of the FIRST flight result card.
   * Scopes card-first (first `.flight-list .flight-preview`), then the requested
   * `.flight-info-container` leg, then that leg's first `.carrier-container .carrier-name`.
   *
   * Returns the Locator without reading it, so the caller can assert with an auto-retrying
   * assertion that survives the results list re-rendering after a filter change.
   *
   * Note: when a single leg mixes carriers the app renders the i18n label "Multiple carriers"
   * in this node instead of an airline name.
   *
   * @param {number} legIndex - Zero-based leg index within the first result card (0 = outbound, 1 = inbound)
   * @returns {import('@playwright/test').Locator} Locator for that leg's carrier name node
   */
  getFirstResultLegCarrierNameLocator(legIndex = 0) {
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(
        `[FlightResultsPage.getFirstResultLegCarrierNameLocator] "legIndex" must be a non-negative integer, got: ${legIndex}`
      );
    }

    return this.page
      .locator(SELECTORS.FLIGHT_PREVIEW)
      .first()
      .locator(SELECTORS.FLIGHT_PREVIEW_SEGMENT)
      .nth(legIndex)
      .locator(SELECTORS.RESULT_SEGMENT_CARRIER_NAME)
      .first();
  }

  /**
   * Extracts the departure date text from a flight result preview card.
   * Returns the date in the format displayed in the UI (e.g., "Mon, 15 Dec").
   * @param {number} cardIndex - Zero-based index of the flight preview card (default: 0)
   * @returns {Promise<string>} The departure date text
   */
  async getFlightDepartureDate(cardIndex = 0) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).nth(cardIndex);
    await card.waitFor({ state: 'visible', timeout: 60000 });
    // Departure date is the first .flight-date element in the card
    const departureDate = card.locator(SELECTORS.FLIGHT_DATE).nth(0);
    return (await departureDate.textContent()).trim();
  }

  /**
   * Extracts the departure location code from a flight result preview segment.
   * In each segment, the first .loc-code element is the origin airport/city code.
   *
   * @param {number} cardIndex - Zero-based index of the flight preview card (default: 0)
   * @param {number} segmentIndex - Zero-based index of the segment within the card (default: 0)
   * @returns {Promise<string>} The departure location code text, for example "SEA"
   */
  async getFlightDepartureLocationCode(cardIndex = 0, segmentIndex = 0) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).nth(cardIndex);
    await card.waitFor({ state: 'visible', timeout: 60000 });

    const segment = card.locator(SELECTORS.FLIGHT_PREVIEW_SEGMENT).nth(segmentIndex);
    await segment.waitFor({ state: 'visible', timeout: 60000 });

    const departureLocationCode = segment.locator(SELECTORS.FLIGHT_LOCATION_CODE).nth(0);
    await departureLocationCode.waitFor({ state: 'visible', timeout: 60000 });

    return (await departureLocationCode.textContent())?.trim() ?? '';
  }

  /**
   * Extracts the arrival (destination) location code from a flight result card.
   * Returns the code from the last segment's second .loc-code element.
   *
   * @param {number} cardIndex - Zero-based index of the flight preview card (default: 0)
   * @returns {Promise<string>} The arrival location code text, for example "EWR"
   */
  async getFlightArrivalLocationCode(cardIndex = 0) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).nth(cardIndex);
    await card.waitFor({ state: 'visible', timeout: 60000 });

    const lastSegment = card.locator(SELECTORS.FLIGHT_PREVIEW_SEGMENT).last();
    await lastSegment.waitFor({ state: 'visible', timeout: 60000 });

    const arrivalLocationCode = lastSegment.locator(SELECTORS.FLIGHT_LOCATION_CODE).nth(1);
    await arrivalLocationCode.waitFor({ state: 'visible', timeout: 60000 });

    return (await arrivalLocationCode.textContent())?.trim() ?? '';
  }

  async selectAirportOptionByCode(airportCode, timeout = 60000) {
    if (!airportCode || typeof airportCode !== 'string') {
      throw new Error(`[FlightResultsPage.selectAirportOptionByCode] airportCode must be a non-empty string, got: ${typeof airportCode}`);
    }

    const normalizedCode = airportCode.trim().toUpperCase();
    const container = this.page
      .locator(SELECTORS.AIRPORTS_FILTER_CONTAINER)
      .filter({ has: this.page.locator(SELECTORS.AIRPORTS_FILTER_HEADER, { hasText: 'Airports' }) })
      .first();

    await container.waitFor({ state: 'visible', timeout });

    const getCheckbox = () => container
      .locator(SELECTORS.FILTER_CHECKBOX_LABEL)
      .filter({ has: this.page.locator(SELECTORS.AIRPORT_OPTION_TEXT, { hasText: new RegExp(`^${normalizedCode}\\s*-`) }) })
      .locator(SELECTORS.FILTER_CHECKBOX_INNER)
      .first();

    let checkbox = getCheckbox();

    if (!(await checkbox.isVisible())) {
      // Expand every collapsed section in the airports filter. Multiple sections can exist
      // (e.g. "Amsterdam Airports" and "New York Airports"), each with its own "View more" button.
      const viewMoreButtons = container
        .locator(SELECTORS.FILTER_VIEW_MORE_CONTAINER)
        .filter({ has: this.page.locator(SELECTORS.FILTER_VIEW_MORE_LABEL, { hasText: 'View more' }) });

      const count = await viewMoreButtons.count();
      for (let i = 0; i < count; i++) {
        const btn = viewMoreButtons.nth(i).locator(SELECTORS.FILTER_VIEW_MORE_BUTTON).first();
        if (await btn.isVisible()) {
          await container.waitFor({ state: 'visible', timeout });
          await container.scrollIntoViewIfNeeded();
          await btn.waitFor({ state: 'attached', timeout });
          await btn.scrollIntoViewIfNeeded();
          await btn.click();
        }
      }

      checkbox = getCheckbox();
    }

    try {
      await container.waitFor({ state: 'visible', timeout });
      await container.scrollIntoViewIfNeeded();
      await checkbox.waitFor({ state: 'attached', timeout });
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.waitFor({ state: 'visible', timeout });
      await checkbox.click();
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.selectAirportOptionByCode] Could not click checkbox for airport "${normalizedCode}" — ` +
        `option not visible in the airports filter. Verify the filter panel is loaded and "${normalizedCode}" ` +
        `is a valid destination airport for this result set. Original: ${err.message}`
      );
    }
  }

  /**
   * Extracts the inbound (return) departure date from a round-trip flight result card.
   * In a round-trip card, .flight-date elements are: outbound departure (0), outbound arrival (1),
   * inbound departure (2), inbound arrival (3).
   * @param {number} cardIndex - Zero-based index of the flight preview card (default: 0)
   * @returns {Promise<string>} The inbound departure date text
   */
  async getInboundFlightDepartureDate(cardIndex = 0) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).nth(cardIndex);
    await card.waitFor({ state: 'visible', timeout: 60000 });
    const departureDate = card.locator(SELECTORS.FLIGHT_DATE).nth(2);
    return (await departureDate.textContent()).trim();
  }

  /**
   * Reads the per-leg departure time of each result card.
   *
   * A card holds one .flight-info-container per leg (flight-preview.vue renders it
   * `v-for` over flightResult.segments), and inside a leg the first .flight-time is the
   * leg's departure (flights[0].depDate) while the second is its arrival. Only the leg
   * departure is constrained by the search time frame, so connection departures inside a
   * leg are deliberately not read.
   *
   * @param {Object} [options]
   * @param {number} [options.maxCards] - Cap on how many cards to read (default: 5)
   * @param {number} [options.timeout] - Max wait for the first card/leg to render
   * @returns {Promise<Array<{cardIndex: number, legIndex: number, time: string}>>}
   */
  async getResultsLegDepartureTimes({ maxCards = 5, timeout = 60000 } = {}) {
    const cards = this.page.locator(SELECTORS.FLIGHT_PREVIEW);
    await cards.first().waitFor({ state: 'visible', timeout });

    const cardCount = Math.min(await cards.count(), maxCards);
    const departures = [];

    for (let cardIndex = 0; cardIndex < cardCount; cardIndex += 1) {
      const legs = cards.nth(cardIndex).locator(SELECTORS.FLIGHT_PREVIEW_SEGMENT);
      await legs.first().waitFor({ state: 'visible', timeout });

      const legCount = await legs.count();
      for (let legIndex = 0; legIndex < legCount; legIndex += 1) {
        const departure = legs.nth(legIndex).locator(SELECTORS.FLIGHT_TIME).first();
        await departure.waitFor({ state: 'visible', timeout });
        departures.push({
          cardIndex,
          legIndex,
          time: ((await departure.innerText()) ?? '').replace(/\s+/g, ' ').trim(),
        });
      }
    }

    if (!departures.length) {
      throw new Error(
        '[FlightResultsPage.getResultsLegDepartureTimes] Could not read any leg departure time from the ' +
        `results cards (selectors: ${SELECTORS.FLIGHT_PREVIEW} > ${SELECTORS.FLIGHT_PREVIEW_SEGMENT} > ${SELECTORS.FLIGHT_TIME}).`
      );
    }

    return departures;
  }

  async getFirstResultFlightSegmentSummaries({ timeout = 60000 } = {}) {
    const card = this.page.locator(SELECTORS.FLIGHT_PREVIEW).first();
    await card.waitFor({ state: 'visible', timeout });

    const segments = card.locator(SELECTORS.FLIGHT_PREVIEW_SEGMENT);
    await segments.first().waitFor({ state: 'visible', timeout });

    const count = await segments.count();
    const summaries = [];

    for (let index = 0; index < count; index += 1) {
      const segment = segments.nth(index);
      const carrier = ((await segment.locator(SELECTORS.RESULT_SEGMENT_CARRIER_NAME).first().innerText()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const flightNumberText = ((await segment.locator(SELECTORS.RESULT_SEGMENT_FLIGHT_NUMBER_TEXT).first().innerText()) ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      const flightNumberMatch = flightNumberText.match(/\b[A-Z0-9]{2,3}\d{1,4}\b/);
      const times = segment.locator(SELECTORS.FLIGHT_TIME);

      await times.nth(1).waitFor({ state: 'visible', timeout });

      if (!flightNumberMatch) {
        throw new Error(`Could not extract a flight number from results text: "${flightNumberText}"`);
      }

      summaries.push({
        carrier,
        flightNumber: flightNumberMatch[0],
        departureTime: ((await times.nth(0).innerText()) ?? '').replace(/\s+/g, ' ').trim(),
        arrivalTime: ((await times.nth(1).innerText()) ?? '').replace(/\s+/g, ' ').trim(),
      });
    }

    if (!summaries.length) {
      throw new Error('Could not extract any flight segment details from the first result card');
    }

    return summaries;
  }

  // ===== CODESHARE / OPERATED BY =====

  /**
   * Checks if "Operated by" text is visible in the first flight result.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isFlightOperatorVisibleInResults(timeout = 10000) {
    try {
      const operator = this.page.locator(SELECTORS.FLIGHT_OPERATOR).first();
      await operator.waitFor({ state: 'visible', timeout });
      const text = await operator.textContent();
      return text.includes(SELECTORS.OPERATED_BY_TEXT);
    } catch {
      return false;
    }
  }

  /**
   * Checks if "Operated by" text is visible in the flight details drawer.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isFlightOperatorVisibleInDrawer(timeout = 10000) {
    try {
      const operator = this.page.locator(SELECTORS.FLIGHT_OPERATOR_IN_DRAWER).first();
      await operator.waitFor({ state: 'visible', timeout });
      const text = await operator.textContent();
      return text.includes(SELECTORS.OPERATED_BY_TEXT);
    } catch {
      return false;
    }
  }

  // ===== BRANDED FARES =====

  /**
   * Clicks the branded fares button inside the flight details drawer.
   * The button is within .flight-details section.
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async clickBrandedFaresButtonInDetails() {
    // The brand name (e.g. "MAINBASIC") is a clickable button in the flight-details-bottom-bar
    const btn = this.page.locator(SELECTORS.BRAND_NAME_BUTTON_IN_DETAILS).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Waits for the branded fares drawer to be visible.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   */
  async waitForBrandedFaresDrawer(timeout = 15000) {
    await this.page.locator(SELECTORS.BRANDED_FARES_DRAWER).waitFor({ state: 'visible', timeout });
  }

  /**
   * Checks if the ancillaries included text is visible in the branded fares drawer.
   * Looks for "The following ancillaries are included in this brand."
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isAncillariesTextVisible(timeout = 90000) {
    try {
      // Sabre branded fares: each tab pane contains this text, but only the ACTIVE pane is visible.
      // getByText().first() would match the first (hidden) tab pane — so use waitForFunction
      // to poll the DOM directly and verify the text is inside a visible element.
      await this.page.waitForFunction(
        () => {
          const drawer = document.querySelector('[aria-label="Branded fares"]');
          if (!drawer) return false;
          return [...drawer.querySelectorAll('*')].some(
            (el) =>
              el.childNodes.length <= 3 &&
              (el.textContent || '').includes('ancillaries are included in this brand') &&
              el.offsetWidth > 0 &&
              el.offsetHeight > 0 &&
              !el.closest('[aria-hidden="true"]') &&
              !el.closest('[style*="display: none"]')
          );
        },
        { timeout }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the "Brand information is currently unavailable." message is
   * visible inside the branded fares drawer.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isBrandInformationUnavailableVisible(timeout = 15000) {
    try {
      await this.page
        .locator(SELECTORS.BRANDED_FARES_UNAVAILABLE_MESSAGE)
        .waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Closes the branded fares drawer.
   */
  async closeBrandedFaresDrawer() {
    const closeBtn = this.page.locator(SELECTORS.BRANDED_FARES_DRAWER_CLOSE).first();
    await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await closeBtn.click();
    // Wait for drawer to fully close so the next open gets fresh content, not stale state
    await this.page.locator(SELECTORS.BRANDED_FARES_DRAWER).waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Clicks the brand name link in the pricing options drawer.
   * Waits for pricing option content to load first.
   */
  async clickBrandNameInPricingOptions() {
    const brandBtn = this.page.locator(SELECTORS.BRAND_NAME_IN_PRICING_OPTIONS).first();
    await brandBtn.waitFor({ state: 'visible', timeout: 60000 });
    await brandBtn.click();
  }

  /**
   * Gets all visible brand names from the pricing options drawer.
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<string[]>}
   */
  async getPricingOptionsBrandNames(timeout = 30000) {
    const overlay = this.getPricingOptionsOverlay();
    const brands = overlay.locator(SELECTORS.BRAND_NAME_IN_PRICING_OPTIONS);

    await brands.first().waitFor({ state: 'visible', timeout });

    return (await brands.allTextContents())
      .map((text) => text.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  /**
   * Checks if a brand name is visible in the branded fares section.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isBrandNameVisible(timeout = 10000) {
    try {
      await this.page.locator(SELECTORS.BRAND_NAME).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Selects the first flight result that is a separated-ticket itinerary — the first result card
   * carrying the "Separated Tickets" tag — by clicking its "Select flight" button. Needed when a
   * test requires a separated-ticket result specifically (the first result may be a single ticket).
   * @param {number} timeout - Max wait time in ms (default: 90000)
   */
  async clickSelectFlightForFirstSeparatedTicketResult(timeout = 90000) {
    // Match by the visible "Separated Tickets" text: on desktop the results-list tag renders as a
    // plain <p> WITHOUT the `separated-tickets-tag` class (that class is mobile-only in flight-preview.vue),
    // so a text filter is reliable across viewports.
    const card = this.page
      .locator(SELECTORS.FLIGHT_PREVIEW)
      .filter({ hasText: SELECTORS.SEPARATED_TICKETS_TEXT })
      .first();
    await card.waitFor({ state: 'visible', timeout });
    const selectButton = card
      .locator(SELECTORS.SELECT_FLIGHT_BUTTON)
      .filter({ hasText: SELECTORS.SELECT_FLIGHT_BUTTON_TEXT })
      .first();
    await selectButton.scrollIntoViewIfNeeded();
    await selectButton.click({ timeout: 10000 });
  }

  /**
   * Gets the carrier name text from the more details drawer.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<string>}
   */
  async getCarrierNameInDetails(timeout = 10000) {
    const el = this.page.locator(SELECTORS.CARRIER_NAME_IN_DETAILS).first();
    await el.waitFor({ state: 'visible', timeout });
    return (await el.textContent()).trim();
  }

  // ===== RAIL BANNER =====

  /**
   * Waits for the EU Rail options banner, racing it against the parallel EU-rail search that
   * gates it, so a search that came back with nothing fails in seconds and with the reason
   * instead of burning the whole banner timeout on something that can never render.
   *
   * The banner sits behind `v-if="euRailOptionsRes?.success && euRailOptionsRes?.results?.length"`
   * (flight-results.vue), and the search feeding it is dispatched ONCE, fire-and-forget, right
   * after the flight results commit (flight.store.ts -> searchEuRailOptions). A response whose
   * `success` is false, or that carries no results, commits `railsAnswer: null` and is never
   * retried - the banner is then unreachable for that search.
   *
   * Two independent miss signals are watched, because the response can land either during this
   * wait (caught on the wire, with full supplier detail) or before it was ever called (caught in
   * the app: the request has finished but the store holds no answer).
   *
   * @param {number} timeout - Max wait for the banner itself (default: 150000)
   * @param {number} railSearchTimeout - Max wait for the gating search response (default: 60000)
   * @returns {Promise<{visible: boolean, railSearch: object|null, appState: object|null}>}
   *   `railSearch` is the wire outcome when one was captured; `appState` is the app's own view of
   *   the search, read only when the banner did not appear.
   */
  async waitForRailBannerOrRailSearchMiss(timeout = 150000, railSearchTimeout = 60000) {
    let railSearch = null;

    const wireMiss = getNetworkInterceptor(this.page)
      .waitForResponse(
        {
          urlIncludes: config.flightEuRailSearchApiPath,
          method: 'POST',
          caseInsensitive: true,
        },
        { timeout: railSearchTimeout },
      )
      .then(async (response) => {
        railSearch = await this.readRailSearchOutcome(response);
        // Only a miss short-circuits the wait; when options came back the banner is about to
        // render, so let the banner wait keep the rest of its budget.
        return railSearch.hasRailOptions ? new Promise(() => {}) : { visible: false };
      })
      // Nothing captured on the wire: leave the banner wait to the other two signals.
      .catch(() => new Promise(() => {}));

    const bannerVisible = this.page
      .locator(SELECTORS.EU_RAIL_OPTIONS_BANNER)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => ({ visible: true }))
      .catch(() => ({ visible: false }));

    const stopPolling = { done: false };
    const { visible } = await Promise.race([
      bannerVisible,
      wireMiss,
      this.pollForRailSearchMiss(timeout, stopPolling),
    ]);
    stopPolling.done = true;

    const appState = visible ? null : await this.readEuRailSearchState();

    return { visible, railSearch, appState };
  }

  /**
   * Resolves once the app itself shows the gating rail search as settled with no answer to
   * render - the case the wire listener cannot catch, because the response landed before it was
   * armed. Stays pending otherwise, so it only ever ends the wait early on a real miss.
   *
   * @param {number} timeout - Stop polling after this long (ms)
   * @param {{done: boolean}} stop - Set `done` once the caller has its verdict, so the loop is
   *   not left polling a page the test has moved on from
   * @param {number} pollIntervalMs - Gap between polls (default: 2000)
   * @returns {Promise<{visible: boolean}>}
   */
  async pollForRailSearchMiss(timeout, stop, pollIntervalMs = 2000) {
    const deadline = Date.now() + timeout;

    while (!stop.done && Date.now() < deadline) {
      const state = await this.readEuRailSearchState();
      if (state.searchSettled && state.reachable && !state.hasAnswer) return { visible: false };
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    // Stopped, or out of budget: the banner wait expires on the same deadline and owns the verdict.
    return new Promise(() => {});
  }

  /**
   * Reads the app's own view of the gating EU-rail search: whether the request has finished
   * (from resource timing, which survives a response that landed before any listener) and what
   * the euRailStore holds for it (Vue 3 exposes the app instance on its mount element).
   *
   * A null `railsAnswer` is the app's "no usable rail options" state - both a failed and an
   * empty parallel rail search commit it - so it only means a miss once the request has settled.
   *
   * @param {number} settledForMs - How long the request must have been finished to count as
   *   settled, leaving the store a moment to commit its answer (default: 1000)
   * @returns {Promise<object>}
   */
  async readEuRailSearchState(settledForMs = 1000) {
    try {
      return await this.page.evaluate(
        ({ urlFragment, settledFor }) => {
          const lastRequest = performance
            .getEntriesByType('resource')
            .filter((entry) => entry.name.toLowerCase().includes(urlFragment.toLowerCase()))
            .pop();
          const searchSettled = Boolean(
            lastRequest?.responseEnd && performance.now() - lastRequest.responseEnd > settledFor,
          );

          const mount = document.querySelector('#app');
          const store = mount?.__vue_app__?.config?.globalProperties?.$store;
          if (!store) return { reachable: false, searchSettled };

          const answer = store.state?.euRailStore?.railsAnswer ?? null;
          if (!answer) return { reachable: true, searchSettled, hasAnswer: false };

          const results = Array.isArray(answer.results) ? answer.results : [];
          return {
            reachable: true,
            searchSettled,
            hasAnswer: true,
            success: answer.success,
            sourceSystem: answer.sourceSystem,
            resultsCount: results.length,
            railSegmentCounts: results.map((result) => (Array.isArray(result?.railSegments) ? result.railSegments.length : null)),
            origin: answer.railRequest?.Origin,
            destination: answer.railRequest?.Destination,
            departDate: answer.railRequest?.DepartDate,
            returnDate: answer.railRequest?.ReturnDate,
          };
        },
        { urlFragment: config.flightEuRailSearchApiPath, settledFor: settledForMs },
      );
    } catch (error) {
      return { reachable: false, searchSettled: false, error: error.message };
    }
  }

  /**
   * Summarises a parallel EU-rail search response into the fields that decide whether the
   * banner can render, plus the request context needed to tell a supplier miss (no trains
   * sold for that route/date) from a search that never asked for what the test expected.
   *
   * @param {import('@playwright/test').Response} response
   * @returns {Promise<object>}
   */
  async readRailSearchOutcome(response) {
    let body;
    try {
      body = await response.json();
    } catch (error) {
      return { status: response.status(), hasRailOptions: false, parseError: error.message };
    }

    const results = Array.isArray(body?.results) ? body.results : [];

    return {
      status: response.status(),
      // Mirrors the banner's own v-if in flight-results.vue.
      hasRailOptions: Boolean(body?.success && results.length),
      success: body?.success,
      sourceSystem: body?.sourceSystem,
      resultsCount: results.length,
      railSegmentCounts: results.map((result) => (Array.isArray(result?.railSegments) ? result.railSegments.length : null)),
      lowestFare: body?.lowestFare,
      distributorSummary: body?.distributorSummary,
      origin: body?.railRequest?.Origin,
      destination: body?.railRequest?.Destination,
      departDate: body?.railRequest?.DepartDate,
      returnDate: body?.railRequest?.ReturnDate,
    };
  }

  /**
   * Clicks the "Rail Options" CTA in the EU Rail banner. Navigation opens Benerail
   * results in a new browser tab (goToEuRailOptions() in flight-results.ts uses
   * utilService.openNewWindow(..., '_blank')), so this waits for and returns that tab.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<import('playwright').Page>}
   */
  async clickRailOptionsButtonAndWaitForNewTab(timeout = 15000) {
    const railOptionsButton = this.page.locator(SELECTORS.EU_RAIL_OPTIONS_BUTTON).first();
    await railOptionsButton.waitFor({ state: 'visible', timeout });

    const popupPromise = this.page.context().waitForEvent('page', { timeout });
    await railOptionsButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState('domcontentloaded', { timeout: 60000 });
    return popupPage;
  }

  /**
   * Checks if the Separated Tickets indicator is visible in flight results.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isSeparatedTicketsIndicatorVisible(timeout = 15000) {
    try {
      // Use text matching — more reliable than CSS class when el-tooltip wraps the trigger
      const locator = this.page.getByText(SELECTORS.SEPARATED_TICKETS_TEXT).first();
      await locator.waitFor({ state: 'attached', timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Checks if the agreement indicator is visible in the first flight result.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isAgreementIndicatorVisibleInFirstResult(timeout = 15000) {
    try {
      const firstResult = this.page.locator(SELECTORS.FLIGHT_PREVIEW).first();
      await firstResult.waitFor({ state: 'visible', timeout });

      const locator = firstResult.locator(SELECTORS.AGREEMENT_ICON).first();
      await locator.waitFor({ state: 'attached', timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Checks if the "Instant Purchase" label is visible in the first flight result.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isInstantPurchaseLabelVisibleInFirstResult(timeout = 15000) {
    try {
      const firstResult = this.page.locator(SELECTORS.FLIGHT_PREVIEW).first();
      await firstResult.waitFor({ state: 'visible', timeout });

      const locator = firstResult.locator(SELECTORS.INSTANT_PURCHASE_LABEL).first();
      await locator.waitFor({ state: 'attached', timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Gets the label text from a flight result's info top bar (e.g. "NDC direct rate").
   * @param {number} flightIndex - 1-based index of the flight result
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<string|null>} The label text or null if not found
   */
  async getFlightResultInfoLabel(flightIndex = 1, timeout = 15000) {
    if (typeof flightIndex !== 'number' || flightIndex < 1) {
      throw new Error(`flightIndex must be a positive number, got: ${flightIndex}`);
    }
    try {
      const selector = `.flight-list > :nth-child(${flightIndex}) ${SELECTORS.FLIGHT_INFO_TOP_BAR_LABEL}`;
      const locator = this.page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout });
      return (await locator.textContent()).trim();
    } catch {
      return null;
    }
  }

  /**
   * Clicks the pricing options button on the first flight result that displays
   * the given info label (e.g. "NDC direct rate").
   *
   * @param {string} label - Label text to match (e.g. "NDC direct rate")
   * @param {number} timeout - Max wait in ms
   */
  async clickPricingOptionsForFirstFlightWithLabel(label, timeout = 90000) {
    if (!label || typeof label !== 'string') {
      throw new Error('label must be a non-empty string');
    }
    const row = this.page
      .locator(SELECTORS.FLIGHT_PREVIEW)
      .filter({ has: this.page.locator(SELECTORS.FLIGHT_INFO_TOP_BAR_LABEL).filter({ hasText: label }) })
      .first();
    await row.waitFor({ state: 'visible', timeout });
    const btn = row.locator(SELECTORS.PRICING_OPTIONS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 10000 });
  }

  /**
   * Clicks the pricing options button on the first flight result that does NOT
   * display the given info label (e.g. skipping all "NDC direct rate" rows).
   *
   * @param {string} label - Label text to exclude (e.g. "NDC direct rate")
   * @param {number} timeout - Max wait in ms
   */
  async clickPricingOptionsForFirstFlightWithoutLabel(label, timeout = 90000) {
    if (!label || typeof label !== 'string') {
      throw new Error('label must be a non-empty string');
    }
    const row = this.page
      .locator(SELECTORS.FLIGHT_PREVIEW)
      .filter({ hasNot: this.page.locator(SELECTORS.FLIGHT_INFO_TOP_BAR_LABEL).filter({ hasText: label }) })
      .first();
    await row.waitFor({ state: 'visible', timeout });
    const btn = row.locator(SELECTORS.PRICING_OPTIONS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 10000 });
  }

  /**
   * Checks if the Marine Fare icon (anchor) is visible in flight results.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isMarineFareIconVisible(timeout = 15000) {
    try {
      const locator = this.page.locator(SELECTORS.MARINE_FARE_ANCHOR_ICON).first();
      await locator.waitFor({ state: 'attached', timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Checks if the Marine Fare icon (anchor) is visible in the pricing options modal.
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isMarineFareIconVisibleInPricingOptions(timeout = 30000) {
    try {
      const overlay = this.getPricingOptionsOverlay();
      await overlay.waitFor({ state: 'visible', timeout });

      // Wait for pricing content to fully load (amount indicates real data, not skeleton)
      const firstAmount = overlay.locator(SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE).first();
      await firstAmount.waitFor({ state: 'visible', timeout });

      const options = overlay.locator(SELECTORS.PRICING_OPTIONS_ITEM);
      await options.first().waitFor({ state: 'visible', timeout });

      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const icon = options.nth(i).locator(SELECTORS.MARINE_FARE_ANCHOR_ICON);
        const iconCount = await icon.count();
        if (iconCount > 0 && await icon.first().isVisible()) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Checks if the agreement indicator is visible in the first pricing option.
   * @param {number} timeout - Max wait time in ms (default: 120000)
   * @returns {Promise<boolean>}
   */
  async isAgreementIndicatorVisibleInPricingOptions(timeout = 120000) {
    try {
      const overlay = this.getPricingOptionsOverlay();
      await overlay.waitFor({ state: 'visible', timeout });

      const firstPricingOption = overlay.locator(SELECTORS.PRICING_OPTIONS_ITEM).first();
      await firstPricingOption.waitFor({ state: 'visible', timeout });

      const locator = firstPricingOption.locator(SELECTORS.AGREEMENT_ICON).first();
      await locator.waitFor({ state: 'attached', timeout });
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Gets all carrier name texts from the flight results list.
   * @param {{ timeout?: number }} options
   * @returns {Promise<string[]>} Array of carrier name strings
   */
  async getAllCarrierNamesInResults({ timeout = 10000 } = {}) {
    const firstCarrier = this.page.locator(SELECTORS.CARRIER_NAME_IN_RESULTS).first();
    await firstCarrier.waitFor({ state: 'visible', timeout });
    const elements = this.page.locator(SELECTORS.CARRIER_NAME_IN_RESULTS);
    const count = await elements.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).innerText();
      names.push(text.trim());
    }
    return names;
  }

  /**
   * Whether each flight result card shows the unused ticket eligibility tag.
   * @returns {Promise<boolean[]>} one entry per result card (true = tag present)
   */
  async getUnusedTicketTagStatusPerResult({ timeout = 30000 } = {}) {
    await this.waitForFlightResults(timeout);
    const cards = this.page.locator(SELECTORS.FLIGHT_PREVIEW);
    const count = await cards.count();
    const statuses = [];
    for (let i = 0; i < count; i++) {
      const tag = cards.nth(i).getByText(SELECTORS.UNUSED_TICKET_TAG_TEXT, { exact: false });
      statuses.push((await tag.count()) > 0);
    }
    return statuses;
  }

  // ===== ADVISORY ICONS =====

  /**
   * Hovers over the first orange advisory icon in flight results to trigger the tooltip.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   */
  async hoverAdvisoryIcon(timeout = 10000) {
    const icon = this.page.locator(SELECTORS.ADVISORY_ICON_ORANGE).first();
    await icon.waitFor({ state: 'visible', timeout });
    await icon.hover();
  }

  // ===== AGREEMENT ICON TOOLTIP IN PRICING OPTIONS (test 27016) =====

  /**
   * Hovers the agreement icon of the first pricing-options fare that carries one, and returns the
   * text of the Element Plus tooltip it opens.
   *
   * The fare rows are scanned for an agreement icon rather than assuming the first row has one —
   * only negotiated fares render the icon, and its position in the carousel is not fixed.
   *
   * @param {number} timeout - Max wait time in ms per step (default: 30000)
   * @returns {Promise<string>} The visible tooltip text
   */
  async hoverAgreementIconInFirstPricingOptionAndGetTooltipText(timeout = 30000) {
    const overlay = this.getPricingOptionsOverlay();

    let icon;
    try {
      await overlay.waitFor({ state: 'visible', timeout });

      // A visible amount proves the fares are real data, not the loading skeleton — without this the
      // icon scan below can run against placeholder rows and wrongly conclude no agreement exists.
      await overlay.locator(SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE).first().waitFor({ state: 'visible', timeout });

      const fareWithAgreement = overlay
        .locator(SELECTORS.PRICING_OPTIONS_ITEM)
        .filter({ has: this.page.locator(SELECTORS.AGREEMENT_ICON) })
        .first();
      await fareWithAgreement.waitFor({ state: 'visible', timeout });

      icon = fareWithAgreement.locator(SELECTORS.AGREEMENT_ICON).first();
      await icon.waitFor({ state: 'visible', timeout });
      await icon.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
      await icon.hover({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.hoverAgreementIconInFirstPricingOptionAndGetTooltipText] Could not hover an agreement ` +
        `icon in the pricing options drawer (fare selector: ${SELECTORS.PRICING_OPTIONS_ITEM}, ` +
        `icon: ${SELECTORS.AGREEMENT_ICON}). No fare in this itinerary carries an agreement, or the drawer ` +
        `did not open. Original: ${err.message}`
      );
    }

    try {
      const tooltip = this.page.locator(SELECTORS.EL_POPPER_VISIBLE).first();
      await tooltip.waitFor({ state: 'visible', timeout: 10000 });
      return ((await tooltip.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.hoverAgreementIconInFirstPricingOptionAndGetTooltipText] The agreement icon was ` +
        `hovered but no tooltip appeared (selector: ${SELECTORS.EL_POPPER_VISIBLE}). ` +
        `The agreement may have no tooltip text configured. Original: ${err.message}`
      );
    }
  }

  /**
   * Checks if a tooltip with the given text is visible after hovering an advisory icon.
   * Element Plus el-tooltip renders content in a .el-popper element.
   * @param {string} expectedText
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isAdvisoryTooltipVisible(expectedText, timeout = 10000) {
    const tooltip = this.page.locator(SELECTORS.EL_POPPER_VISIBLE).filter({ hasText: expectedText });
    try {
      await tooltip.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ===== STOPOVER INDICATOR =====

  /**
   * Checks whether the flight preview card for a given flight number contains a stopover indicator.
   * @param {string} flightNumber
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isStopoverIndicatorVisibleForFlight(flightNumber, timeout = 15000) {
    if (!flightNumber || typeof flightNumber !== 'string') {
      throw new Error('flightNumber must be a non-empty string, got: ' + typeof flightNumber);
    }
    try {
      const preview = this.page
        .locator(SELECTORS.FLIGHT_PREVIEW)
        .filter({ hasText: flightNumber })
        .first();
      await preview.waitFor({ state: 'visible', timeout });
      const icons = preview.locator(SELECTORS.STOPOVER_TOOLTIP_TRIGGER_ICON);
      const count = await icons.count();
      const perIconTimeout = Math.max(2000, Math.floor(timeout / Math.max(count, 1)));
      for (let i = 0; i < count; i++) {
        const icon = icons.nth(i);
        await icon.hover();
        const stopoverTooltip = this.page.locator(SELECTORS.EL_POPPER_VISIBLE).filter({ hasText: /stop over/i });
        try {
          await stopoverTooltip.first().waitFor({ state: 'visible', timeout: perIconTimeout });
          return true;
        } catch {
          // Tooltip didn't match, try next icon
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the visible flight details drawer contains a stopover indicator icon.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isStopoverIndicatorVisibleInDetails(timeout = 15000) {
    try {
      const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
      await drawer.waitFor({ state: 'visible', timeout });

      // Check for visible "Stop over" text in the drawer
      const stopoverText = drawer.locator('*').filter({ hasText: /stop over/i }).first();
      if (await stopoverText.isVisible().catch(() => false)) {
        return true;
      }

      // Fallback: check tooltip-trigger icons for "Stop over" tooltip
      const icons = drawer.locator(SELECTORS.STOPOVER_TOOLTIP_TRIGGER_ICON);
      const count = await icons.count();
      const perIconTimeout = Math.max(2000, Math.floor(timeout / Math.max(count, 1)));
      for (let i = 0; i < count; i++) {
        const icon = icons.nth(i);
        await icon.hover();
        const stopoverTooltip = this.page.locator(SELECTORS.EL_POPPER_VISIBLE).filter({ hasText: /stop over/i });
        try {
          await stopoverTooltip.first().waitFor({ state: 'visible', timeout: perIconTimeout });
          return true;
        } catch {
          // Tooltip didn't match, try next icon
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether stopover location text is visible in the flight details drawer.
   * Looks for any element containing "Stop over" as displayed content.
   */
  async getStopoverLocationTextInDetails(timeout = 15000) {
    const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
    await drawer.waitFor({ state: 'visible', timeout });
    const stopoverEl = drawer.locator(SELECTORS.FLIGHT_DETAILS_CONNECTION_MSG).filter({ hasText: /stop over/i }).first();
    try {
      await stopoverEl.waitFor({ state: 'visible', timeout });
      const text = await stopoverEl.textContent() || '';
      return text.trim().replace(/\s+/g, ' ');
    } catch {
      // Fallback: find the closest meaningful container holding "Stop over" text
      const fallback = drawer.locator('.connection-msg, .flight-stop-info, .segment-info, [class*="stop"]').filter({ hasText: /stop over/i }).first();
      await fallback.waitFor({ state: 'visible', timeout });
      const text = await fallback.textContent() || '';
      return text.trim().replace(/\s+/g, ' ');
    }
  }

  // ===== FLIGHT DETAILS — CONNECTION ADVISORY =====

  /**
   * Gets all connection advisory messages from the flight details drawer.
   * Each message contains "Connection: Change transportation" text and a transport icon.
   * @returns {Promise<Array<{text: string, icon: string}>>}
   */
  async getFlightDetailsConnectionAdvisories() {
    const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
    const messages = drawer.locator(SELECTORS.FLIGHT_DETAILS_CONNECTION_MSG);
    const count = await messages.count();
    const results = [];
    for (let i = 0; i < count; i++) {
      const msg = messages.nth(i);
      const text = (await msg.textContent()).trim().replace(/\s+/g, ' ');
      const iconEl = msg.locator(SELECTORS.FLIGHT_DETAILS_MATERIAL_ICON).first();
      const iconCount = await iconEl.count();
      const icon = iconCount > 0 ? (await iconEl.textContent()).trim() : '';
      results.push({ text, icon });
    }
    return results;
  }

  /**
   * Checks if the flight details drawer contains at least one connection advisory
   * with "Change transportation" text.
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async hasConnectionAdvisoryInDetails(timeout = 10000) {
    try {
      const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
      const msg = drawer.locator(SELECTORS.FLIGHT_DETAILS_CONNECTION_MSG).first();
      await msg.waitFor({ state: 'visible', timeout });
      const text = await msg.textContent();
      return text.includes('Change transportation') || text.includes('Change to');
    } catch {
      return false;
    }
  }

  /**
   * Gets per-segment equipment data from the flight details drawer.
   * Each segment has: transport icon (flight/directions_railway/directions_bus) and aircraft name text.
   * @returns {Promise<Array<{icon: string, name: string}>>}
   */
  async getFlightDetailsSegmentEquipment() {
    const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
    const topBars = drawer.locator(SELECTORS.FLIGHT_DETAILS_TOP_BAR);
    const count = await topBars.count();
    const segments = [];
    for (let i = 0; i < count; i++) {
      const bar = topBars.nth(i);
      const iconEl = bar.locator(SELECTORS.FLIGHT_DETAILS_MATERIAL_ICON).last();
      const icon = (await iconEl.textContent()).trim();
      const nameEl = bar.locator(SELECTORS.FLIGHT_DETAILS_AIRCRAFT_NAME);
      const nameCount = await nameEl.count();
      const name = nameCount > 0 ? (await nameEl.textContent()).trim() : '';
      segments.push({ icon, name });
    }
    return segments;
  }

  /**
   * Gets all transport icons from connection advisory messages in flight details.
   * These icons represent the equipment type of the NEXT segment after a transport change.
   * @returns {Promise<string[]>}
   */
  async getConnectionAdvisoryIcons() {
    const drawer = this.page.locator(SELECTORS.FLIGHT_DETAILS_VISIBLE_DRAWER).first();
    const messages = drawer.locator(SELECTORS.FLIGHT_DETAILS_CONNECTION_MSG);
    const count = await messages.count();
    const icons = [];
    for (let i = 0; i < count; i++) {
      const iconEl = messages.nth(i).locator(SELECTORS.FLIGHT_DETAILS_MATERIAL_ICON).first();
      const iconCount = await iconEl.count();
      if (iconCount > 0) {
        const text = (await iconEl.textContent()).trim();
        if (text) icons.push(text);
      }
    }
    return icons;
  }

  /**
   * Gets all flight time strings from the by-schedule stepper breadcrumb.
   * After the first segment is selected and confirmed, the stepper shows its
   * time (e.g. "09:00 AM - 10:08 AM") in the confirmed segment label.
   * Uses a DOM TreeWalker on the .flight-stepper container.
   *
   * @returns {Promise<string[]>} Deduplicated array of time strings
   */
  async getFlightTimesFromResultsPage() {
    // Wait for the stepper to be visible (confirmed segments show times)
    await this.page.locator(SELECTORS.FLIGHT_STEPPER).first().waitFor({ state: 'visible', timeout: 30000 });

    return this.page.evaluate((selector) => {
      const stepper = document.querySelector(selector);
      if (!stepper) return [];
      const timePattern = /\b\d{1,2}:\d{2}(?:\s*(?:AM|PM))?\b/gi;
      const walker = document.createTreeWalker(stepper, NodeFilter.SHOW_TEXT);
      const found = new Set();
      let node;
      while ((node = walker.nextNode())) {
        const matches = (node.textContent || '').match(timePattern);
        if (matches) matches.forEach((m) => found.add(m.trim()));
      }
      return [...found];
    }, SELECTORS.FLIGHT_STEPPER);
  }

  /**
   * Clicks the "Search" link in the flight results breadcrumb to navigate back
   * to the trip search page.
   */
  async clickBreadcrumbSearchLink() {
    const link = this.page.locator(SELECTORS.RESULTS_BREADCRUMB_SEARCH_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 30000 });
    await link.click();
  }

  // ===== NEW FLIGHT FLOW (flight-selection brand cards) =====

  /**
   * Waits for the brand cards within a specific leg to appear.
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   */
  async waitForNewFlightFlowBrandCards(legIndex = 0, timeout = 120000) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    try {
      await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.waitForNewFlightFlowBrandCards] Brand cards for leg ${legIndex} did not appear within ${timeout}ms. ` +
        `The flight-selection component may not have loaded or no pricing options are available for this leg. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the first brand card within a specific leg.
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @param {number} cardIndex - Zero-based index of the brand card to click (default: 0)
   */
  async clickNewFlightFlowBrandCard(legIndex = 0, cardIndex = 0) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    const card = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).nth(cardIndex);
    try {
      await card.waitFor({ state: 'visible', timeout: 30000 });
      await card.locator(SELECTORS.NEW_FLOW_BRAND_CARD_FARE).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickNewFlightFlowBrandCard] Could not click brand card at leg ${legIndex}, card ${cardIndex}. ` +
        `The card may not be visible or the pricing options may not have loaded. ` +
        `Original: ${err.message}`
      );
    }
    // Brief pause to allow the UI to animate the card selection and load the next leg
    await this.page.waitForTimeout(1000);
  }

  /**
   * Returns the cabin-class tab labels rendered above a leg's brand cards, in display order.
   * The tabs are derived from the cabin classes the leg actually offers, so a leg priced in a
   * single cabin renders none at all.
   *
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @param {number} timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<string[]>} Trimmed tab labels (e.g. ["Economy", "Premium", "Business"])
   */
  async getNewFlightFlowCabinClassTabNames(legIndex = 0, timeout = 30000) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    const tabs = leg.locator(SELECTORS.NEW_FLOW_LEG_CABIN_CLASS_TAB);

    try {
      await tabs.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getNewFlightFlowCabinClassTabNames] No cabin class tabs rendered for leg ${legIndex} within ${timeout}ms. ` +
        `The leg may offer only one cabin class (tabs render one per available class), or the brand cards may not have loaded. ` +
        `Original: ${err.message}`
      );
    }

    return (await tabs.allInnerTexts())
      .map((text) => text.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  /**
   * Clicks a cabin-class tab above a leg's brand cards. Matches the label by case-insensitive
   * substring, so "Premium" selects a tab labelled "Premium" or "Premium Economy".
   *
   * @param {string} cabinName - Cabin name or substring (e.g. "Premium")
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async clickNewFlightFlowCabinClassTab(cabinName, legIndex = 0, timeout = 30000) {
    if (!cabinName || typeof cabinName !== 'string') {
      throw new Error(
        `[FlightResultsPage.clickNewFlightFlowCabinClassTab] "cabinName" must be a non-empty string, got: ${typeof cabinName}`
      );
    }

    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    const tab = leg.locator(SELECTORS.NEW_FLOW_LEG_CABIN_CLASS_TAB)
      .filter({ hasText: new RegExp(escapeRegExp(cabinName), 'i') })
      .first();

    try {
      await tab.waitFor({ state: 'visible', timeout });
      await tab.click({ timeout });
      // Confirm the tab actually took, so callers never read the previous cabin class's cards.
      await expect(tab).toHaveClass(
        new RegExp(`\\b${SELECTORS.NEW_FLOW_LEG_CABIN_CLASS_TAB_ACTIVE_CLASS}\\b`),
        { timeout }
      );
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickNewFlightFlowCabinClassTab] Could not select the "${cabinName}" cabin class tab on leg ${legIndex}. ` +
        `The leg may not offer that cabin class, or the tab did not become active after the click. ` +
        `Original: ${err.message}`
      );
    }

    // The active-class check above confirms the tab state, but the brand cards animate in via a
    // Vue <transition>; a brief settle keeps callers from reading cards mid-swap.
    await this.page.waitForTimeout(1000);
  }

  // ===== CLASSIC PRICING OPTIONS DRAWER (pricing-options.vue) =====

  /**
   * Waits for the fare cards of the currently-active leg in the classic Pricing
   * Options drawer to appear (the "Select" buttons inside leg-pricing-option).
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForPricingOptionsDrawerLeg(timeout = 60000) {
    try {
      await this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_SELECT_BTN).first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.waitForPricingOptionsDrawerLeg] Pricing options fare cards did not appear within ${timeout}ms. ` +
        `The pricing-options drawer may not have opened or the leg's fares did not load. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the first fare's "Select" button in the currently-active leg tab of the
   * classic Pricing Options drawer. The drawer renders only the active leg's fares,
   * so the first "Select" button belongs to that leg.
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async selectFirstFareInCurrentPricingLeg(timeout = 60000) {
    const btn = this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_SELECT_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.selectFirstFareInCurrentPricingLeg] Could not click the first fare "Select" button ` +
        `in the pricing options drawer. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits until the given leg tab shows its selected (green check_circle) state,
   * confirming the fare selection registered before acting on the next leg.
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForPricingOptionsLegSelected(legIndex = 0, timeout = 60000) {
    const tab = this.page.locator(SELECTORS.PRICING_OPTIONS_TAB).nth(legIndex);
    try {
      await tab.locator(SELECTORS.PRICING_OPTIONS_TAB_SELECTED_ICON)
        .first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.waitForPricingOptionsLegSelected] Leg ${legIndex} did not show a selected (green check) ` +
        `state within ${timeout}ms. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits until the given leg tab is the active tab of the classic Pricing Options
   * drawer. Element Plus marks the active tab with `is-active`. Used to confirm the
   * drawer advanced to the next leg before reading that leg's fare cards.
   * @param {number} legIndex - Zero-based leg index (0=outbound, 1=inbound)
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForPricingOptionsActiveLeg(legIndex = 0, timeout = 60000) {
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`legIndex must be a non-negative integer, got: ${legIndex}`);
    }

    const tab = this.page.locator(SELECTORS.PRICING_OPTIONS_TAB).nth(legIndex);
    try {
      await expect(tab).toHaveClass(
        new RegExp(`\\b${SELECTORS.PRICING_OPTIONS_TAB_ACTIVE_CLASS}\\b`),
        { timeout },
      );
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.waitForPricingOptionsActiveLeg] Leg ${legIndex} did not become the active tab ` +
        `within ${timeout}ms. The drawer may not have advanced to that leg. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the number of fare cards rendered for the currently-active leg of the
   * classic Pricing Options drawer.
   * @param {number} timeout - Max wait time in ms (default: 60000)
   * @returns {Promise<number>}
   */
  async getPricingOptionsLegFareCardCount(timeout = 60000) {
    const cards = this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_CARD);
    try {
      await cards.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getPricingOptionsLegFareCardCount] No fare cards appeared in the pricing options ` +
        `drawer within ${timeout}ms. Original: ${err.message}`
      );
    }
    return cards.count();
  }

  /**
   * Returns the fare (brand) name of every fare card on the currently-active leg of the
   * classic Pricing Options drawer, in display order. Cards without a brand label yield null,
   * so the returned array stays index-aligned with the fare cards.
   * @param {number} timeout - Max wait time in ms (default: 60000)
   * @returns {Promise<Array<string|null>>}
   */
  async getPricingOptionsLegFareNames(timeout = 60000) {
    const cards = this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_CARD);
    await cards.first().waitFor({ state: 'visible', timeout });

    const count = await cards.count();
    const names = [];
    for (let i = 0; i < count; i += 1) {
      const nameEl = cards.nth(i).locator(SELECTORS.PRICING_OPTIONS_LEG_CARD_BRAND_NAME).first();
      const text = (await nameEl.count()) > 0 ? await nameEl.innerText().catch(() => '') : '';
      const normalized = text.replace(/\s+/g, ' ').trim();
      names.push(normalized || null);
    }
    return names;
  }

  /**
   * Counts the fare cards in the pricing options drawer by content type. NDC cards render the
   * "NDC direct rate" label (leg-pricing-option.vue, `v-if="option.isNDC"`); EDIFACT/GDS cards
   * render no content-type label at all, so the remainder is the EDIFACT count.
   *
   * @param {number} timeout - Max wait time in ms (default: 60000, accounts for NDC pricing load)
   * @returns {Promise<{total: number, ndc: number, edifact: number}>}
   */
  async getPricingOptionsContentTypeCounts(timeout = 60000) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout });

    const cards = overlay.locator(SELECTORS.PRICING_OPTIONS_CARD);
    await cards.first().waitFor({ state: 'visible', timeout });

    const total = await cards.count();
    const ndc = await cards.filter({ hasText: SELECTORS.NDC_DIRECT_RATE_LABEL_TEXT }).count();

    return { total, ndc, edifact: total - ndc };
  }

  /**
   * Returns the indices of the fare cards on the currently-active leg that can still be
   * selected — i.e. every card except one already chosen (its button reads "Unselect").
   * @param {number} timeout - Max wait time in ms (default: 60000)
   * @returns {Promise<number[]>}
   */
  async getSelectablePricingOptionsLegCardIndices(timeout = 60000) {
    const cards = this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_CARD);
    await cards.first().waitFor({ state: 'visible', timeout });

    const count = await cards.count();
    const indices = [];
    for (let i = 0; i < count; i += 1) {
      const btn = cards.nth(i).locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).first();
      if ((await btn.count()) === 0) continue;
      const label = (await btn.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (label.toLowerCase() === SELECTORS.PRICING_OPTIONS_UNSELECT_BUTTON_TEXT.toLowerCase()) continue;
      indices.push(i);
    }
    return indices;
  }

  /**
   * Clicks the "Select" button of the fare card at the given index on the currently-active
   * leg of the classic Pricing Options drawer. Scoping the click to the card (rather than
   * indexing the buttons) keeps the index aligned with the fare cards even when one card
   * already shows "Unselect".
   * @param {number} index - Zero-based fare card index
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async clickSelectButtonInPricingOptionsLegCard(index, timeout = 60000) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`index must be a non-negative integer, got: ${index}`);
    }

    const card = this.page.locator(SELECTORS.PRICING_OPTIONS_LEG_CARD).nth(index);
    const btn = card.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).first();
    try {
      await card.waitFor({ state: 'visible', timeout });
      await card.scrollIntoViewIfNeeded();
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      await btn.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickSelectButtonInPricingOptionsLegCard] Could not click the "Select" button on ` +
        `fare card ${index} in the pricing options drawer. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the "Add to trip" primary button in the classic Pricing Options drawer
   * footer, which adds the fares selected across all legs to the cart.
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async clickPricingOptionsAddToTrip(timeout = 60000) {
    const btn = this.page.locator(SELECTORS.PRICING_OPTIONS_ADD_TO_TRIP_BTN).first();
    try {
      await btn.waitFor({ state: 'visible', timeout });
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickPricingOptionsAddToTrip] Could not click "Add to trip" in the pricing options ` +
        `drawer footer. Original: ${err.message}`
      );
    }
  }

  /**
   * Returns the leg header name text for the inbound leg (index 1).
   * The heading appears as e.g., "London To Lisbon".
   * @param {number} legIndex - Zero-based index of the leg header (default: 1 for inbound)
   */
  async getNewFlightFlowLegHeaderName(legIndex = 1) {
    const header = this.page.locator(SELECTORS.NEW_FLOW_LEG_HEADER_NAME).nth(legIndex);
    try {
      await header.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getNewFlightFlowLegHeaderName] Leg header at index ${legIndex} not visible. ` +
        `The pricing options for this leg may not have loaded. ` +
        `Original: ${err.message}`
      );
    }
    return (await header.textContent()).trim();
  }

  /**
   * Clicks the primary action button ("Add to cart" by-price / "Select" by-schedule)
   * in the new flight flow footer.
   *
   * Two things made the original testid-based locator fail every run:
   *  1. The flight-selection data-testids (flight.flight-selection.*) are NOT present
   *     on the deployed build, so the testid selectors matched zero elements. The
   *     button IS reliably rendered as the single primary button in the footer's
   *     actions-section (the "Reset" button is btn--default), so we target it
   *     structurally via NEW_FLOW_FOOTER_ACTION_BUTTON.
   *  2. The footer re-prices/re-renders a moment AFTER the final leg's brand card is
   *     selected, so we waitFor the button instead of a point-in-time isVisible().
   */
  async clickNewFlightFlowAddToCartButton() {
    const button = this.page.locator(SELECTORS.NEW_FLOW_FOOTER_ACTION_BUTTON).first();

    try {
      await button.waitFor({ state: 'visible', timeout: 30000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickNewFlightFlowAddToCartButton] The flight-selection footer action button ("Add to cart"/"Select") did not become visible within 30s. ` +
        `Original: ${err.message}`
      );
    }

    try {
      // click() auto-waits for the button to become enabled (canProceed = all legs selected).
      await button.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickNewFlightFlowAddToCartButton] Could not click the footer action button. ` +
        `It may be disabled (not all legs selected). ` +
        `Original: ${err.message}`
      );
    }

    // Wait for navigation or cart update after adding to cart
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    // Additional settle time for cart page render after network idle
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verifies outbound brand cards (leg 0) show a full price element and no price-delta.
   * @param {number} legIndex - Zero-based leg index (default: 0 for outbound)
   */
  async verifyLegBrandCardsShowFullPriceWithoutDelta(legIndex = 0) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    try {
      await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first()
        .waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowFullPriceWithoutDelta] Brand cards for leg ${legIndex} not visible within 60s. ` +
        `Original: ${err.message}`
      );
    }
    // Use .price-info .amount — the h4.amount rendered by app-price, always present regardless of deployment state.
    const priceAmount = leg.locator(`${SELECTORS.NEW_FLOW_BRAND_CARD_FARE} .price-info .amount`).first();
    try {
      await priceAmount.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowFullPriceWithoutDelta] Price amount (.price-info .amount) not visible on leg ${legIndex}. ` +
        `Expected outbound brand cards to show a price. Original: ${err.message}`
      );
    }
    const hasDelta = await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA).isVisible().catch(() => false);
    if (hasDelta) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowFullPriceWithoutDelta] price-delta element is visible on leg ${legIndex} but should NOT be — outbound must show full price, not delta.`
      );
    }
  }

  /**
   * Kept for when the app-side totalLegs bug (segments.length vs trip-leg count) is resolved.
   * Verifies the "Starting from" label is visible on outbound brand cards.
   */
  async verifyLegBrandCardsShowStartingFrom(legIndex = 0) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    try {
      await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first()
        .waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowStartingFrom] Brand cards for leg ${legIndex} not visible within 60s. ` +
        `Original: ${err.message}`
      );
    }
    const label = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD_STARTING_FROM_LABEL).first();
    try {
      await label.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowStartingFrom] ".starting-from-label" not visible on leg ${legIndex}. ` +
        `Expected outbound brand cards to display "Starting from" pricing. Original: ${err.message}`
      );
    }
  }

  /**
   * Verifies that brand cards in the given leg show a price-delta element (subsequent-leg pricing).
   * @param {number} legIndex - Zero-based leg index (default: 1 for inbound)
   */
  async verifyLegBrandCardsShowDelta(legIndex = 1) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    try {
      await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first()
        .waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowDelta] Brand cards for leg ${legIndex} not visible. ` +
        `Original: ${err.message}`
      );
    }
    const deltaByTestId = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA).first();
    const deltaByPrefix = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA_PREFIX).first();
    const [hasTestId, hasPrefix] = await Promise.all([
      deltaByTestId.isVisible().catch(() => false),
      deltaByPrefix.isVisible().catch(() => false),
    ]);
    if (!hasTestId && !hasPrefix) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowDelta] Neither price-delta testid nor .price-delta-prefix "+" span found on leg ${legIndex}. ` +
        `Expected inbound brand cards to display incremental price delta after outbound selection.`
      );
    }
  }

  /**
   * Verifies that brand cards on the page show a price element but NO "Starting from" label and NO price-delta
   * (expected behaviour for one-way single-leg searches).
   */
  async verifyLegBrandCardsShowPriceOnly() {
    const firstCard = this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first();
    try {
      await firstCard.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowPriceOnly] No brand cards visible. Original: ${err.message}`
      );
    }
    const hasStartingFrom = await this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD_STARTING_FROM_LABEL).isVisible().catch(() => false);
    if (hasStartingFrom) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowPriceOnly] ".starting-from-label" is visible but should NOT be shown for a one-way single leg.`
      );
    }
    const hasDelta = await this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA).isVisible().catch(() => false);
    const hasDeltaPrefix = await this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA_PREFIX).isVisible().catch(() => false);
    if (hasDelta || hasDeltaPrefix) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowPriceOnly] delta element is visible but should NOT be shown for a one-way single leg.`
      );
    }
    // Price amount must be visible via .price-info .amount (always rendered).
    const priceAmount = this.page.locator(`${SELECTORS.NEW_FLOW_BRAND_CARD_FARE} .price-info .amount`).first();
    try {
      await priceAmount.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyLegBrandCardsShowPriceOnly] Price amount not visible in brand cards for one-way. Original: ${err.message}`
      );
    }
  }

  /**
   * Verifies the "Separated Tickets" badge is visible in the flight-selection (brand cards) view.
   */
  async verifySeparatedTicketsIndicationVisible() {
    const locator = this.page.locator(SELECTORS.SEPARATED_TICKETS_TAG).first();
    try {
      await locator.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifySeparatedTicketsIndicationVisible] ".separated-tickets-tag" not visible in brand cards view. ` +
        `Expected a "Separated Tickets" badge to be shown for this result. Original: ${err.message}`
      );
    }
  }

  /**
   * Verifies that no price-delta element is visible anywhere across all brand cards.
   * Complements verifyLegBrandCardsShowPriceOnly for one-way checks.
   */
  async verifyNoBrandCardDelta() {
    const hasDelta = await this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD_PRICE_DELTA).isVisible().catch(() => false);
    if (hasDelta) {
      throw new Error(
        `[FlightResultsPage.verifyNoBrandCardDelta] price-delta element is visible but should NOT be present for a one-way single-leg search.`
      );
    }
  }

  /**
   * Verifies the flight-selection footer shows a non-zero total price and the
   * "Total per traveller" label — confirming the price is per-traveller, not per-group.
   */
  async verifyFlightSelectionFooterTotalPerTraveller() {
    const priceSection = this.page.locator(SELECTORS.NEW_FLOW_FOOTER_PRICE_SECTION);
    try {
      await priceSection.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyFlightSelectionFooterTotalPerTraveller] Footer price section not visible. ` +
        `The flight-selection footer may not have rendered. Original: ${err.message}`
      );
    }
    const amount = this.page.locator(SELECTORS.NEW_FLOW_FOOTER_PRICE_AMOUNT);
    try {
      await amount.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.verifyFlightSelectionFooterTotalPerTraveller] Price amount not visible in footer price section. Original: ${err.message}`
      );
    }
    const label = priceSection.locator(`text=${SELECTORS.NEW_FLOW_FOOTER_TOTAL_PER_TRAVELLER_LABEL}`);
    const labelVisible = await label.isVisible().catch(() => false);
    if (!labelVisible) {
      throw new Error(
        `[FlightResultsPage.verifyFlightSelectionFooterTotalPerTraveller] "${SELECTORS.NEW_FLOW_FOOTER_TOTAL_PER_TRAVELLER_LABEL}" label not visible in footer. ` +
        `Expected footer to display per-traveller price label.`
      );
    }
  }

  /**
   * Selects a sort option from the "Sort by" extended dropdown in flight results.
   * Clicks the Sort by button to open the el-dropdown, then clicks the matching item.
   *
   * @param {string} label - Sort option label text (e.g. "Departure Earliest")
   * @param {{ timeout?: number }} options
   */
  async selectSortOption(label, { timeout = 15000 } = {}) {
    if (!label || typeof label !== 'string') {
      throw new Error(`[FlightResultsPage.selectSortOption] "label" must be a non-empty string, got: ${typeof label}`);
    }

    const sortButton = this.page.locator(SELECTORS.SORT_BY_BUTTON).first();
    try {
      await sortButton.waitFor({ state: 'visible', timeout });
      await sortButton.click();
    } catch (err) {
      throw new Error(`[FlightResultsPage.selectSortOption] Could not click "Sort by" button (${SELECTORS.SORT_BY_BUTTON}). Sort bar may not be visible. Original: ${err.message}`);
    }

    const item = this.page.locator(SELECTORS.SORT_DROPDOWN_ITEM(label)).first();
    try {
      await item.waitFor({ state: 'visible', timeout });
      await item.click();
    } catch (err) {
      throw new Error(`[FlightResultsPage.selectSortOption] Could not click sort option "${label}". Option not visible in dropdown — label may not exist. Original: ${err.message}`);
    }

    await this.waitForFlightResults(timeout);
  }

  async clickFirstNonAgreementBrandCard(legIndex = 0) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    const nonAgreementCard = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD)
      .filter({ hasNot: this.page.locator(SELECTORS.AGREEMENT_ICON) })
      .first();
    try {
      await nonAgreementCard.waitFor({ state: 'visible', timeout: 30000 });
      await nonAgreementCard.locator(SELECTORS.NEW_FLOW_BRAND_CARD_FARE).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.clickFirstNonAgreementBrandCard] No non-agreement brand card found in leg ${legIndex}. ` +
        `All visible cards may have agreement icons. Original: ${err.message}`
      );
    }
    await this.page.locator(SELECTORS.NEW_FLOW_FOOTER_PRICE_AMOUNT).waitFor({ state: 'visible', timeout: 15000 });
  }

  async getBrandCardFeatureTexts(fareName, timeout = 30000) {
    const allCards = this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD);
    try {
      await allCards.first().waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getBrandCardFeatureTexts] No brand cards visible. Original: ${err.message}`
      );
    }

    const count = await allCards.count();
    const foundBrandNames = [];

    for (let i = 0; i < count; i++) {
      const card = allCards.nth(i);
      const brandNameEl = card.locator(SELECTORS.BRAND_NAME);
      if ((await brandNameEl.count()) === 0) continue;
      const cardBrandName = (await brandNameEl.first().innerText()).trim();
      foundBrandNames.push(cardBrandName);
      if (cardBrandName === fareName) {
        return card.locator(SELECTORS.NEW_FLOW_BRAND_CARD_FEATURE_TEXT).allInnerTexts();
      }
    }

    throw new Error(
      `[FlightResultsPage.getBrandCardFeatureTexts] No brand card found with fare name "${fareName}". ` +
      `Available: [${foundBrandNames.map((n) => `"${n}"`).join(', ')}]`
    );
  }

  async getOutboundSelectedBrandName(timeout = 30000) {
    const outboundLeg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(0);
    const selectedCard = outboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD)
      .filter({ has: this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD_SELECTED) }).first();
    await selectedCard.waitFor({ state: 'visible', timeout });
    return (await selectedCard.locator(SELECTORS.BRAND_NAME).first().innerText()).trim();
  }

  async getOutboundBrandCardNames(timeout = 30000) {
    const outboundLeg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(0);
    await outboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first().waitFor({ state: 'visible', timeout });
    const cards = outboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD);
    const count = await cards.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const nameEl = cards.nth(i).locator(SELECTORS.BRAND_NAME);
      names.push((await nameEl.count()) > 0 ? (await nameEl.first().innerText()).trim() : null);
    }
    return names;
  }

  async getInboundBrandCardNames(timeout = 30000) {
    const inboundLeg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(1);
    await inboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first().waitFor({ state: 'visible', timeout });
    const cards = inboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD);
    const count = await cards.count();
    const names = [];
    for (let i = 0; i < count; i++) {
      const nameEl = cards.nth(i).locator(SELECTORS.BRAND_NAME);
      names.push((await nameEl.count()) > 0 ? (await nameEl.first().innerText()).trim() : null);
    }
    return names;
  }

  async clickInboundBrandCardAt(index, timeout = 30000) {
    const inboundLeg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(1);
    const card = inboundLeg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).nth(index);
    await card.locator(SELECTORS.NEW_FLOW_BRAND_CARD_FARE).first().click({ timeout });
    await this.page.locator(SELECTORS.NEW_FLOW_FOOTER_PRICE_AMOUNT).waitFor({ state: 'visible', timeout });
  }

  /**
   * Sets up a listener for the next FlightPricingSelection API response (the New Flight Flow
   * brand-selection pricing call that carries per-leg fare rules). Must be called BEFORE the
   * action that triggers it (entering the brand-cards view). Returns an unresolved Promise
   * that resolves when the response arrives.
   *
   * @returns {Promise<import('@playwright/test').Response>}
   */
  capturePricingSelectionApiResponse() {
    // The New Flight Flow may emit more than one FlightPricingSelection POST (e.g. an initial
    // pending/empty response before the priced one). Wait for the first response that actually
    // carries a non-empty results array so downstream parsing has data. The endpoint casing can
    // vary on the wire, so match the URL case-insensitively.
    return getNetworkInterceptor(this.page).waitForResponse({
      urlIncludes: config.flightPricingSelectionApiPath,
      method: 'POST',
      caseInsensitive: true,
      predicate: async (response) => {
        const body = await response.json();
        const results = body?.results ?? body?.Results;
        return Array.isArray(results) && results.length > 0;
      },
    });
  }

  /**
   * Reads every brand card across all legs in the new-flight-flow brand-selection view.
   * For each card it returns the leg index (0 = outbound, 1 = inbound, ...), the card index
   * within that leg, the brand name, and the raw feature-badge texts (the baggage / change /
   * refund / seat labels rendered under the brand name as `.features-text`).
   *
   * Consumers classify the feature texts into change/refund rules — this method only reads
   * the DOM, it holds no business logic.
   *
   * @param {number} [timeout] - Max wait for the first brand card to appear.
   * @returns {Promise<Array<{legIndex: number, cardIndex: number, brandName: string|null, featureTexts: string[]}>>}
   */
  async getPerLegBrandCardFeatureTexts(timeout = 30000) {
    const legs = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG);
    try {
      // Wait for any brand card anywhere in the view — after an outbound brand is selected the
      // outbound leg may collapse and only the inbound leg keeps rendering cards.
      await this.page.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[FlightResultsPage.getPerLegBrandCardFeatureTexts] No brand cards visible in the new-flight-flow view. Original: ${err.message}`
      );
    }

    const legCount = await legs.count();
    const cardsByLeg = [];

    for (let legIndex = 0; legIndex < legCount; legIndex++) {
      const cards = legs.nth(legIndex).locator(SELECTORS.NEW_FLOW_BRAND_CARD);
      const cardCount = await cards.count();

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
        const card = cards.nth(cardIndex);
        const nameEl = card.locator(SELECTORS.BRAND_NAME);
        const brandName = (await nameEl.count()) > 0
          ? (await nameEl.first().innerText()).trim()
          : null;
        const rawFeatureTexts = await card.locator(SELECTORS.NEW_FLOW_BRAND_CARD_FEATURE_TEXT).allInnerTexts();
        cardsByLeg.push({
          legIndex,
          cardIndex,
          brandName,
          featureTexts: rawFeatureTexts.map((t) => t.trim()).filter((t) => t.length > 0),
        });
      }
    }

    return cardsByLeg;
  }

  async isChangeAndCancellationWarningVisible() {
    try {
      // The warning uses v-if, so it is only in the DOM when showMixedRulesWarning=true.
      // Use 'attached' instead of 'visible' to avoid failing on overflow-clipped containers.
      await this.page.locator(SELECTORS.NEW_FLOW_CHANGE_AND_CANCELLATION_WARNING)
        .waitFor({ state: 'attached', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async closeNFFDrawer(timeout = 10000) {
    const closeBtn = this.page.locator(SELECTORS.NEW_FLOW_NFF_CLOSE_BTN).first();
    await closeBtn.click({ timeout });
    await this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).first().waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  async clickSelectFlightButtonAt(index, timeout = 15000) {
    const btn = this.page.locator(SELECTORS.RESULTS_SELECT_BUTTON).nth(index);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout });
  }

  async getChangeAndCancellationWarningText(timeout = 15000) {
    const locator = this.page.locator(SELECTORS.NEW_FLOW_CHANGE_AND_CANCELLATION_WARNING);
    try {
      await locator.waitFor({ state: 'attached', timeout });
    } catch {
      throw new Error(
        `[FlightResultsPage.getChangeAndCancellationWarningText] Warning element not found in DOM within ${timeout}ms.`
      );
    }
    return (await locator.innerText()).trim();
  }

  async waitForChangeAndCancellationWarningHidden(timeout = 5000) {
    const selector = SELECTORS.NEW_FLOW_CHANGE_AND_CANCELLATION_WARNING;
    try {
      await this.page.locator(selector).waitFor({ state: 'detached', timeout });
    } catch (err) {
      const text = await this.page.locator(selector).innerText().catch(() => '');
      throw new Error(
        `[FlightResultsPage.waitForChangeAndCancellationWarningHidden] Warning still visible after ${timeout}ms. Text: "${text.trim()}"`
      );
    }
  }

  async getAgreementIconCountInLegBrandCards(legIndex = 1, timeout = 30000) {
    const leg = this.page.locator(SELECTORS.NEW_FLOW_BRAND_LEG).nth(legIndex);
    await leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD).first().waitFor({ state: 'visible', timeout });
    const cards = leg.locator(SELECTORS.NEW_FLOW_BRAND_CARD);
    const cardCount = await cards.count();
    const agreementCardIndices = [];
    for (let i = 0; i < cardCount; i++) {
      const agreementIcon = cards.nth(i).locator(SELECTORS.AGREEMENT_ICON);
      const iconCount = await agreementIcon.count();
      if (iconCount > 0 && await agreementIcon.first().isVisible()) {
        agreementCardIndices.push(i);
      }
    }
    return { agreementCardIndices };
  }

  // Starts waiting for the flightSearch API response (call BEFORE triggering the search).
  // Matches the exact path so /flightSearchDefault is not picked up by mistake.
  // Read the body with readJson (from @utils/networkInterceptor).
  captureSearchApiResponse() {
    return getNetworkInterceptor(this.page).waitForResponse({
      pathnameEndsWith: config.flightSearchApiPath,
    });
  }
}
module.exports = FlightResultsPage;
