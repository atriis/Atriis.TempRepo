const { waitForText } = require("@utils/wait");
const { extractNumber } = require("@utils/dom");

/**
 * Page Object for flight results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Flight selection
  CHANGE_FLIGHT_BUTTON: '.change-flight-btn-wrapper',
  SEARCH_FLIGHT_FILTER: '[placeholder="Search flight"]',
  
  // Pricing options modal
  PRICING_OPTIONS_BUTTON: '.btn.pricing-options',
  PRICING_OPTIONS_DRAWER: '.el-drawer__body',
  PRICING_OPTIONS_CARD: '.leg-pricing-option',
  PRICING_OPTIONS_SELECT_BUTTON: '.select-btn', 
  PRICING_OPTIONS_AMOUNT_VALUE: '.leg-pricing-option .amount',
  PRICING_OPTIONS_ADD_TO_TRIP_BUTTON: '.add-btn',
  PRICING_OPTIONS_SHARE_QUOTE_BUTTON: '.share-btn:not(.add-btn)',
  PRICING_OPTIONS_CLOSE_MODAL: '[aria-label="Close this dialog"]',
  GREEN_CIRCLE_ICON_PRICING_OPTIONS: 'span.material-symbols-outlined.green',
  PRICING_OPTIONS_OVERLAY: '.el-overlay:has(.app-drawer.flight-details-drawer)',
  PRICING_OPTIONS_BAGGAGE_CLASS: '.leg-details .baggage span',

  //Fare rules note
  FARE_RULES_NOTE: '.note',

  // Fare rules leg tabs inside the drawer
  FARE_RULES_LEG_TAB: '.fare-rules-tabs .el-tabs__item',
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
      .filter({ hasText: 'Pricing Options' })
      .first();
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getFareRulesButton() {
    return this.page.getByRole('button', { name: 'Fare rules' });
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getSeatsButton() {
    return this.page.getByRole('button', { name: 'Seats' });
  }

  /**
   * Gets the "Fare rules" button element.
   * @returns {import('@playwright/test').Locator}
   */
  getFlightDetailsButton() {
    return this.page.getByRole('button', { name: 'Flight details' });
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
      .getByRole('button', { name: 'Select to share' })
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
      .getByRole('button', { name: 'Select' })
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
      "Change flight"
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
      this.page.locator('.btn.btn--primary').first().waitFor({ state: 'visible', timeout })
    ]);
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
      .getByRole('button', { name: 'Select to share' })
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
      .getByRole('button', { name: 'Select' })
      .nth(index)
      .waitFor({ state: 'visible', timeout: 60000 });
  }

  /**
   * Waits for the select button to change its text to "Unselect" after being clicked.
   *
   * @param {number} index - Zero-based index of the button (default: 0)
   */
  async waitForPricingOptionsUnselectButton(index = 0) {
    await this.page.locator(SELECTORS.PRICING_OPTIONS_SELECT_BUTTON).nth(index).filter({ hasText: "Unselect" }).waitFor({ state: "visible" });
  }

  /**
   * Clicks the share quote button within the pricing options dialog footer.
   * The "+Share" button is in the app-footer area at the bottom of the drawer.
   */
  async clickPricingOptionsShareQuoteButton() {
    // The +Share button is in the footer area of the pricing options drawer
    const overlay = this.getPricingOptionsOverlay();
    const shareButton = overlay.locator('.summary-and-actions .share-btn');
    
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
   * Waits for the "Fare rules" button to be visible.
   *
   * @param {number} index - Zero-based index of the fare rules button (default: 0)
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFareRulesButton(index = 0, timeout = 30000) {
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
   * Waits for the flight details headline to be visible.
   * The headline follows the pattern "Origin - Destination".
   *
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForFlightDetailsHeadline(timeout = 30000) {
    await this.page.getByRole('heading', {
      level: 3,
      name: / - /,
    }).first().waitFor({
      state: 'visible',
      timeout,
    });
  }

async clickAddToTripButtonPricingOptionsModal() {
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
  
  // Wait for modal to close after adding to trip
  await this.getPricingOptionsOverlay().waitFor({ state: 'hidden', timeout: 30000 });
  
  // Wait for any page updates to complete (API calls, DOM updates, potential navigation)
  await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
    // Fallback: if networkidle times out, wait for load state
    return this.page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
  });
  
  // Additional stabilization for slow environments
  await this.page.waitForTimeout(2000);
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
    return this.page.getByText('Flight duration', { exact: false }).first();
  }

  // Dynamic title: e.g., "Depart from London", "Depart from Madrid"
  getFlightDurationFromLocationTitle(location) {
    return this.page.getByText(location, { exact: false }).first();
  }

}
module.exports = FlightResultsPage;
