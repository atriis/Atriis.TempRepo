const { expect } = require("@playwright/test");
const { waitForText } = require("@utils/wait");
const { extractNumber, parseAmountText } = require("@utils/dom");
const { escapeRegExp } = require("@utils/text");

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
  RESULTS_CONTAINER_SKELETON: '.results-container-skeleton',
  FILTER_CONTAINER_SKELETON: '.flight-filter-container-skeleton',
  CHANGE_FLIGHT_BUTTON: '.change-flight-btn-wrapper',
  CHANGE_FLIGHT_TEXT: 'Change flight',
  FLIGHT_STEPPER: '.flight-stepper',
  FLIGHT_STEPPER_PAGE_CONTAINER: '.flight-stepper .page-container',
  FLIGHT_STEPPER_PAGE_TITLE: '.page-title',
  COMPARISON_TOGGLE: '.comparison-btn span',
  COMPARISON_TABLE: '.ticket-layout-container .el-table__body-wrapper',
  COMPARISON_ROW: '.ticket-layout-container .el-table__body-wrapper tbody tr',
  COMPARISON_STOP_TYPE: '.stop-type',
  COMPARISON_PRICE_CELL: '.cell-price',
  STOPS_FILTER_CONTAINER: '.stops-filter .filter-container',
  BY_SCHEDULE_PRICING_PAGE: '.flight-by-schedule-pricing',
  BY_SCHEDULE_ADD_TO_TRIP_BUTTON: '.flight-by-schedule-pricing .add-btn',
  SEARCH_FLIGHT_FILTER: '[placeholder="Search flight"]',
  RESULTS_BUTTON: '.btn.btn--primary',
  RESULTS_ADD_TO_TRIP_BUTTON: '.btn.btn--primary:has-text("Add to trip")',
  RESULTS_SELECT_BUTTON: '.btn.btn--primary:has-text("Select")',
  RESULTS_SHARE_BUTTON: '.btn.btn--primary:has-text("Share")',
  FARE_RULES_BUTTON_NAME: 'Fare rules',
  SEATS_BUTTON_NAME: 'Seats',
  FLIGHT_DETAILS_BUTTON_NAME: 'Flight details',
  FLIGHT_DETAILS_HEADLINE_PATTERN: / - /,
  FLIGHT_DURATION_TITLE_TEXT: 'Flight duration',
  SEAT_MAP_CONTAINER: '.deck-wrapper',
  SEAT_MAP_UNAVAILABLE_STATE: '.flight-deck .no-results',
  SEAT_PREVIEW_ONLY_MESSAGE: 'text=Preview only. Seat selection available at checkout.',

  // Pricing options modal
  PRICING_OPTIONS_BUTTON: '.btn.pricing-options',
  PRICING_OPTIONS_DRAWER: '.el-drawer__body',
  PRICING_OPTIONS_CARD: '.leg-pricing-option',
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
  PRICING_OPTIONS_CABIN_CLASS: '.leg-pricing-option .sub-class',
  PRICING_OPTIONS_BAGGAGE_CLASS: '.leg-details .baggage span',
  PRICING_OPTIONS_FARE_COMPONENT_TEXT: 'text=Fare component',
  GREEN_CIRCLE_ICON_PRICING_OPTIONS: 'span.material-symbols-outlined.green',
  CONFLICT_MODAL_PROCEED: '.conflicting-quotes-dialog .btn:has-text("Proceed")',
  TRIP_OVERVIEW_TITLE: '.payments-title',

  // Fare rules note
  FARE_RULES_NOTE: '.note',
  FARE_RULES_MAIN_HEADLINE: '.fare-rules .main-headline',

  // Fare rules leg tabs inside the drawer
  FARE_RULES_LEG_TAB: '.fare-rules-tabs .el-tabs__item',

  // Flight preview segment date text (format: "EEE, dd MMM" e.g. "Thu, 11 Dec")
  FLIGHT_DATE: '.flight-date',
  // Flight preview card
  FLIGHT_PREVIEW: '.flight-list .flight-preview',
  FLIGHT_PREVIEW_SEGMENT: '.flight-info-container',
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

  // Separated Tickets tag (flight-selection.vue / flight-preview.vue — shown when split rules apply)
  // Uses text-based selector since the tag is wrapped in el-tooltip which can interfere with CSS-class visibility checks
  SEPARATED_TICKETS_TAG: 'p.separated-tickets-tag',
  SEPARATED_TICKETS_TEXT: 'Separated Tickets',
  AGREEMENT_ICON: '.agreement-icon',

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

  // Element Plus tooltip (rendered outside component tree)
  EL_POPPER_VISIBLE: '.el-popper:visible',
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
    return this.page.getByRole('button', { name: SELECTORS.FARE_RULES_BUTTON_NAME });
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
    // Target the button directly inside the pricing options overlay
    const overlay = this.getPricingOptionsOverlay();
    const selectButton = overlay
      .getByRole('button', { name: SELECTORS.PRICING_OPTIONS_SELECT_BUTTON_NAME })
      .nth(index);
    
    await selectButton.waitFor({ state: 'visible', timeout: 10000 });
    await selectButton.click();
    
    // Wait for the UI to update after selection
    await this.page.waitForTimeout(1000);
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

  // ===== PRICING OPTIONS MODAL =====

  /**
   * Waits for the pricing options button to be visible.
   *
   * @param {number} index - Zero-based index of the pricing options button (default: 0)
   */
  async waitForPricingOptionsButton(index = 0, timeout = 60000) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).nth(index).waitFor({ state: "visible", timeout });
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

  // TODO: Locator needs to be created
  async clickXToCloseFlightDetailsModal(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_CLOSE_MODAL).nth(index).click();
  }

  /**
   * Extracts the price amount from the pricing options modal.
   *
   * @param {number} index - Zero-based index of the amount element (default: 0)
   * @returns {Promise<number|null>} The price value or null if not found
   */
  async getAmountPriceValuePricingOptions(index = 0) {
    const overlay = this.getPricingOptionsOverlay();
    await overlay.waitFor({ state: 'visible', timeout: 60000 });
    await overlay.locator(SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE).nth(index).waitFor({ state: 'visible', timeout: 120000 });
    return extractNumber(overlay, SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE, index);
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
   * Waits for then clicks a Fare rules button scoped to the pricing options
   * overlay, so background buttons blocked by the overlay are excluded.
   *
   * @param {number} index - Zero-based index within the overlay (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitAndClickFareRulesButtonInPricingOptions(index = 0, timeout = 60000) {
    const button = this.getPricingOptionsOverlay()
      .getByRole('button', { name: SELECTORS.FARE_RULES_BUTTON_NAME })
      .nth(index);
    await button.waitFor({ state: 'visible', timeout });
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
      .getByRole('button', { name: SELECTORS.FARE_RULES_BUTTON_NAME })
      .first();
    await button.waitFor({ state: 'visible', timeout });
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
   * Checks if the EU Rail options banner is visible in flight results.
   * @param {number} timeout - Max wait time in ms (default: 10000)
   * @returns {Promise<boolean>}
   */
  async isRailBannerVisible(timeout = 30000) {
    try {
      await this.page.locator(SELECTORS.EU_RAIL_OPTIONS_BANNER).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
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
   * @param {number} timeout - Max wait time in ms (default: 15000)
   * @returns {Promise<boolean>}
   */
  async isAgreementIndicatorVisibleInPricingOptions(timeout = 15000) {
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
}
module.exports = FlightResultsPage;
