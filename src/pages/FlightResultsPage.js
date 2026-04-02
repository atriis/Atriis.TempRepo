const { waitForText } = require("@utils/wait");
const { extractNumber } = require("@utils/dom");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Page Object for flight results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Flight selection
  CHANGE_FLIGHT_BUTTON: '.change-flight-btn-wrapper',
  CHANGE_FLIGHT_TEXT: 'Change flight',
  COMPARISON_TABLE: '.ticket-layout-container .el-table__body-wrapper',
  COMPARISON_ROW: '.ticket-layout-container .el-table__body-wrapper tbody tr',
  COMPARISON_STOP_TYPE: '.stop-type',
  COMPARISON_PRICE_CELL: '.cell-price',
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
  PRICING_OPTIONS_HEADER: '.main-info-wrapper .options-header h4',
  PRICING_OPTIONS_ADD_TO_TRIP_BUTTON: '.add-btn',
  PRICING_OPTIONS_SHARE_QUOTE_BUTTON: '.share-btn:not(.add-btn)',
  PRICING_OPTIONS_SHARE_QUOTE_FOOTER_BUTTON: '.summary-and-actions .share-btn',
  PRICING_OPTIONS_CLOSE_MODAL: '[aria-label="Close this dialog"]',
  PRICING_OPTIONS_OVERLAY: '.el-overlay:has(.app-drawer.flight-details-drawer)',
  PRICING_OPTIONS_OVERLAY_HEADING_TEXT: 'Pricing Options',
  PRICING_OPTIONS_BAGGAGE_CLASS: '.leg-details .baggage span',
  PRICING_OPTIONS_FARE_COMPONENT_TEXT: 'text=Fare component',
  GREEN_CIRCLE_ICON_PRICING_OPTIONS: 'span.material-symbols-outlined.green',
  CONFLICT_MODAL_PROCEED: '.conflicting-quotes-dialog .btn:has-text("Proceed")',
  TRIP_OVERVIEW_TITLE: '.payments-title',

  // Fare rules note
  FARE_RULES_NOTE: '.note',

  // Fare rules leg tabs inside the drawer
  FARE_RULES_LEG_TAB: '.fare-rules-tabs .el-tabs__item',

  // Flight preview segment date text (format: "EEE, dd MMM" e.g. "Thu, 11 Dec")
  FLIGHT_DATE: '.flight-date',
  // Flight preview card
  FLIGHT_PREVIEW: '.flight-list .flight-preview',
  FLIGHT_PREVIEW_SEGMENT: '.flight-info-container',
  FLIGHT_LOCATION_CODE: '.loc-code',

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

  // Marine Fare icon (flight-preview.vue / flight-by-schedule-pricing-option.vue)
  // Uses anchor material icon + "Marine fare" text — no data-testid available
  MARINE_FARE_ANCHOR_ICON: 'span.material-symbols-outlined:has-text("anchor")',
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
   * Waits for flight results to be loaded by checking for result actions.
   * Works in both normal mode (Add to trip/Select) and share mode (Pricing Options).
   * 
   * @param {number} timeout - Max wait time in ms (default: 60000)
   */
  async waitForFlightResults(timeout = 60000) {
    // Wait for either pricing options button OR action buttons to appear
    // This works in both share mode and regular mode
    await Promise.race([
      this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).first().waitFor({ state: 'visible', timeout }),
      this.page.locator(SELECTORS.RESULTS_BUTTON).first().waitFor({ state: 'visible', timeout })
    ]);
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

  // ===== PRICING OPTIONS MODAL =====

  /**
   * Waits for the pricing options button to be visible.
   *
   * @param {number} index - Zero-based index of the pricing options button (default: 0)
   */
  async waitForPricingOptionsButton(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_BUTTON).nth(index).waitFor({ state: "visible" });
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
      .waitFor({ state: 'visible', timeout: 60000 });
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
    return extractNumber(overlay, SELECTORS.PRICING_OPTIONS_AMOUNT_VALUE, index);
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
    await this.page.locator(SELECTORS.CONFLICT_MODAL_PROCEED).first().click();
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

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded', { timeout: 45000 }).catch(() => {}),
      addButton.click({ timeout: 30000 }),
    ]);

    let outcome = await this.waitForBySchedulePricingAddToTripOutcome();

    if (outcome === 'conflict') {
      await this.page.locator(SELECTORS.CONFLICT_MODAL_PROCEED).first().click();
      outcome = await this.waitForBySchedulePricingAddToTripOutcome(60000);
    }

    if (outcome === 'cart') {
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      return;
    }

    if (attempt === 1 && outcome === 'pricing') {
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
  async isAncillariesTextVisible(timeout = 10000) {
    try {
      const text = this.page.getByText(SELECTORS.ANCILLARIES_INCLUDED_MESSAGE);
      await text.first().waitFor({ state: 'visible', timeout });
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
  async isMarineFareIconVisibleInPricingOptions(timeout = 15000) {
    try {
      const overlay = this.getPricingOptionsOverlay();
      const locator = overlay.locator(SELECTORS.MARINE_FARE_ANCHOR_ICON).first();
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

}
module.exports = FlightResultsPage;
