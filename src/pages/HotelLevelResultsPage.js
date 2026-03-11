const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

/**
 * Page Object for hotel level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MEMBER_BADGE: ".expedia-membership-badge-container, .booking-com-membership-badge-container",
  CORPORATE_PREFERRED_BADGE: ".badge-wrapper .app-badge",  // Badge shown when hotel.tags includes 'preferred'
  VIEW_ON_MAP_BUTTON: '.view-map-btn',
  MAP_CONTAINER: '.map-container',
  MAP_MARKER: '.hotel-map-marker .hotel-price, .hotel-map-marker .hotel-dot',
  SELECTED_MAP_PREVIEW: '.map-container .hotel-preview',
  SELECTED_MAP_PREVIEW_VIEW_RATES_BUTTON: '.map-container .hotel-preview .see-availability-btn',
  SEARCH_HOTEL_FILTER: '[placeholder="Search hotel"]',
  CO2_LABEL: ".hotel-info .eco-label",
  CO2_VALUE: ".hotel-info .eco-label .is-size-7",
  SUPPLIER_LOGO_IMG: (supplierId) => `.hotel-supplier-carousel img[alt*="${supplierId}"]`,
  SUSTAINABILITY_FILTER_CHECKBOX: 'input.el-checkbox__original[value="ecoCertificated"]',
  // Sort dropdown in hotel list header
  SORT_SELECT: '.hotel-list-sort .sort .el-select',
  SORT_OPTION: (value) => `.el-select-dropdown__item:has-text("${value}")`,
  // Hotel card containers for index-based selection
  HOTEL_CARD: '.hotel-preview',
  VIEW_RATES_BUTTON: `${require("@pages/ResultsPage").SELECTORS.RESULTS_BUTTON}:has-text("View rates")`,
  // Hotel detail drawer amenities
  HOTEL_AMENITY_ACTIVE: '.hotel-amenities .grid div.black',
  HOTEL_AMENITY_ALL: '.hotel-amenities .grid div',
  // Hotel-level filter panel section titles (h4 used by all filter types)
  HOTEL_FILTER_SECTION_HEADING: (text) => `.hotel-filter h4:has-text("${text}")`,
  // Checkbox option inside a named hotel-level filter section
  HOTEL_FILTER_CHECKBOX: (filterName, optionText) =>
    `.hotel-filter .filter-container:has(h4:has-text("${filterName}")) label.el-checkbox:has-text("${optionText}")`,
  // Active filter badge tag in the hotel-filter summary bar
  HOTEL_FILTER_SUMMARY_TAG: (text) => `.hotel-filter-summary .el-tag:has-text("${text}")`,
  // Agreement label badge in hotel card (e.g. "Corporate rate", "Agency rate")
  AGREEMENT_LABEL: (text) => `.hotel-preview .ticket-agreement:has-text("${text}")`,
  // Agreement label span (exact text match) for El-Plus tooltip triggering via mouse.move
  AGREEMENT_LABEL_SPAN: (text) => `.hotel-preview .ticket-agreement span:text-is("${text}")`,
  // Tooltip content shown on hover over agreement label (Element Plus renders popper at body level)
  AGREEMENT_TOOLTIP_DESCRIPTION: '.el-popper.is-light .agreement-tooltip__description',
};

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "View rates" button locator.
   * @returns {Locator} Playwright locator for the first "View rates" button
   */
  getViewRatesButton() {
    return this.page
      .locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first();
  }

  /** Scrolls to the first "View rates" button */
  async scrollToFirstViewRatesButton() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists before trying to scroll to it
    await viewRatesButton.waitFor({ state: "attached" });

    await viewRatesButton.scrollIntoViewIfNeeded();
  }

  /** Waits until the first "View rates" button is visible (60s timeout for CI/CD) */
  async waitForViewRatesText() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists, then scroll it into view (60s timeout for slower CI environments)
    await viewRatesButton.waitFor({ state: "attached", timeout: 60000 });
    await viewRatesButton.scrollIntoViewIfNeeded({ timeout: 60000 });

    // Confirm it is visible and ready for interaction (60s timeout)
    await viewRatesButton.waitFor({ state: "visible", timeout: 60000 });
  }

  async waitForResultsPageReady() {
    await this.page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await this.page.locator(SELECTORS.VIEW_ON_MAP_BUTTON).first().waitFor({ state: 'visible', timeout: 60000 });
  }

  /** Clicks the first available "View rates" button */
  async clickFirstViewRatesButton() {
    await this.getViewRatesButton().click();
  }

  /**
   * Verifies member rate badge is visible in hotel results
   * @returns {Promise<boolean>} True if member badge is visible
   */
  /**
   * Checks if the corporate preferred badge is visible in hotel results.
   * @returns {Promise<boolean>} True if badge is visible
   */
  async isCorporatePreferredBadgeVisible() {
    const badge = this.page.locator(SELECTORS.CORPORATE_PREFERRED_BADGE).first();
    try {
      await badge.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async isMemberBadgeVisible() {
    const badge = this.page.locator(SELECTORS.MEMBER_BADGE).first();
    try {
      await badge.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks on the first hotel that displays a member rate badge
   * @throws {Error} If no hotel with member badge is found
   */
  async clickFirstHotelWithMemberRate() {
    // Find all hotel previews that have a member badge
    const hotelWithBadge = this.page.locator('.hotel-preview').filter({ has: this.page.locator(SELECTORS.MEMBER_BADGE) }).first();
    
    // Get the View Rates button within that hotel card
    const viewRatesButton = hotelWithBadge.locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`);
    
    await viewRatesButton.waitFor({ state: "visible", timeout: 10000 });
    await viewRatesButton.scrollIntoViewIfNeeded();
    await viewRatesButton.click();
  }

  /** Waits for View Rates text to be visible in results page */
  async waitForViewRatesTextInResultsPage() {
    await this.getViewRatesButton().waitFor({ state: "visible" });
  }

  async openMapView() {
    const viewOnMapButton = this.page.locator(SELECTORS.VIEW_ON_MAP_BUTTON).first();
    await viewOnMapButton.waitFor({ state: 'visible', timeout: 30000 });
    await viewOnMapButton.click();
    await this.page.locator(SELECTORS.MAP_CONTAINER).waitFor({ state: 'visible', timeout: 30000 });
  }

  async selectFirstMapMarker() {
    const firstMarker = this.page.locator(SELECTORS.MAP_MARKER).first();
    await firstMarker.waitFor({ state: 'visible', timeout: 30000 });
    await firstMarker.click();
    await this.page.locator(SELECTORS.SELECTED_MAP_PREVIEW).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickSelectedMapPreviewAndWaitForNewTab() {
    const viewRatesButton = this.page.locator(SELECTORS.SELECTED_MAP_PREVIEW_VIEW_RATES_BUTTON).first();
    await viewRatesButton.waitFor({ state: 'visible', timeout: 10000 });

    const popupPromise = this.page.context().waitForEvent('page', { timeout: 10000 });
    await viewRatesButton.click();

    const popupPage = await popupPromise;
    await popupPage.waitForLoadState('domcontentloaded', { timeout: 60000 });
    return popupPage;
  }

  async filterByHotelName(hotelName) {
    await this.page.locator(SELECTORS.SEARCH_HOTEL_FILTER).fill(hotelName);
  }

  /**
   * Checks if CO2 eco-label is visible in hotel level results.
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<boolean>} True if CO2 label is visible
   */
  async isCO2LabelVisible({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CO2_LABEL).first();
    try {
      await label.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the CO2 value text from the first hotel result.
   * @returns {Promise<string>} The CO2 numeric value text
   */
  async getCO2Value() {
    const value = this.page.locator(SELECTORS.CO2_VALUE).first();
    await value.waitFor({ state: "visible", timeout: 10000 });
    return (await value.textContent()).trim();
  }

  /**
   * Checks if the Sustainability filter is enabled (not greyed out).
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<boolean>} True if the filter is visible and not disabled
   */
  async isSustainabilityFilterEnabled({ timeout = 30000 } = {}) {
    const checkbox = this.page.locator(SELECTORS.SUSTAINABILITY_FILTER_CHECKBOX);
    await checkbox.waitFor({ state: 'attached', timeout });
    const filterLabel = checkbox.locator('xpath=ancestor::label[contains(@class,"el-checkbox")]');
    await filterLabel.waitFor({ state: 'visible', timeout });
    const classes = await filterLabel.getAttribute('class');
    return !classes.includes('is-disabled');
  }

  /**
   * Selects a sort option by label text in the hotel list sort dropdown.
   * @param {string} label - The sort option label (e.g., "Price", "Most recommended")
   */
  async selectSortOption(label, { timeout = 15000 } = {}) {
    if (!label || typeof label !== 'string') throw new Error('label must be a non-empty string');
    const sortSelect = this.page.locator(SELECTORS.SORT_SELECT).first();
    await sortSelect.waitFor({ state: 'visible', timeout });
    await sortSelect.click();
    const option = this.page.locator(SELECTORS.SORT_OPTION(label)).first();
    await option.waitFor({ state: 'visible', timeout });
    await option.click();
    // Wait for sort to take effect
    await this.page.waitForTimeout(1500);
  }

  /**
   * Checks if a supplier logo is visible in hotel level results.
   * Matches against the supplier ID embedded in the img alt attribute.
   *
   * @param {string} supplierId - Supplier ID as it appears in the SVG filename (e.g. "EXPEDIARAPID")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>} True if at least one matching supplier logo is visible
   */
  async isSupplierLogoVisible(supplierId, { timeout = 15000 } = {}) {
    if (!supplierId || typeof supplierId !== "string") {
      throw new Error(`supplierId must be a non-empty string, got: ${typeof supplierId}`);
    }
    const logo = this.page.locator(SELECTORS.SUPPLIER_LOGO_IMG(supplierId)).first();
    try {
      await logo.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the "View rates" button on a hotel card at a specific 1-based index.
   * @param {number} index - 1-based hotel card index
   */
  async clickViewRatesByIndex(index) {
    if (typeof index !== 'number' || index < 1) {
      throw new Error('index must be >= 1, got: ' + index);
    }
    const hotelCard = this.page.locator(SELECTORS.HOTEL_CARD).nth(index - 1);
    const viewRatesBtn = hotelCard.locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`);
    await viewRatesBtn.waitFor({ state: 'visible', timeout: 30000 });
    await viewRatesBtn.scrollIntoViewIfNeeded();
    await viewRatesBtn.click();
  }

  /**
   * Clicks the "More Details" link on a hotel card at a specific 1-based index to open the details drawer.
   * @param {number} index - 1-based hotel card index
   */
  async clickMoreDetailsByIndex(index) {
    if (typeof index !== 'number' || index < 1) {
      throw new Error('index must be >= 1, got: ' + index);
    }
    // Close any open hotel details drawer first via Escape key
    const amenitiesVisible = await this.page.locator('.hotel-amenities').first().isVisible().catch(() => false);
    if (amenitiesVisible) {
      await this.page.keyboard.press('Escape');
      await this.page.locator('.hotel-amenities').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    const hotelCard = this.page.locator(SELECTORS.HOTEL_CARD).nth(index - 1);
    await hotelCard.waitFor({ state: 'visible', timeout: 30000 });
    await hotelCard.scrollIntoViewIfNeeded();
    const moreDetailsBtn = hotelCard.locator('.more-details-btn').first();
    await moreDetailsBtn.waitFor({ state: 'visible', timeout: 15000 });
    await moreDetailsBtn.click();
    // Wait for the hotel details drawer with amenities to open and load
    await this.page.locator('.hotel-amenities').first().waitFor({ state: 'visible', timeout: 15000 });
    // Give the drawer content time to fully load before reading amenity state
    await this.page.waitForTimeout(1000);
  }

  /**
   * Checks if a specific amenity (by name) is active/present for the currently opened hotel details drawer.
   * Active amenities have the "black" class.
   * @param {string} amenityName - The amenity name to check (e.g., "Gym")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>} True if the amenity has the "black" class (is active)
   */
  async isAmenityActive(amenityName, { timeout = 15000 } = {}) {
    if (!amenityName || typeof amenityName !== 'string') {
      throw new Error('amenityName must be a non-empty string');
    }
    const amenity = this.page.locator(SELECTORS.HOTEL_AMENITY_ALL)
      .filter({ hasText: new RegExp(`^${amenityName}$`, 'i') })
      .first();
    try {
      await amenity.waitFor({ state: 'visible', timeout });
      const classes = await amenity.getAttribute('class');
      return classes ? classes.includes('black') : false;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether a filter section heading with the given text is visible in the hotel filter panel.
   * @param {string} text - Filter section title (e.g. "Agreement", "Price", "Suppliers")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isFilterSectionVisible(text, { timeout = 10000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');
    const heading = this.page.locator(SELECTORS.HOTEL_FILTER_SECTION_HEADING(text)).first();
    try {
      await heading.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks a checkbox option inside a named filter section in the hotel filter panel.
   * @param {string} filterName - Filter section title (e.g. "Agreement")
   * @param {string} optionText - Checkbox option label (e.g. "Corp")
   */
  async clickHotelFilterOption(filterName, optionText) {
    if (!filterName || typeof filterName !== 'string') throw new Error('filterName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const checkbox = this.page.locator(SELECTORS.HOTEL_FILTER_CHECKBOX(filterName, optionText)).first();
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    await checkbox.click();
  }

  /**   * Ensures a hotel-level filter is applied in the Vuex store.
   * When only one option exists for a filter, the app auto-checks and disables the checkbox
   * without updating the store. This method dispatches directly to the store as a fallback.
   * @param {string} filterName - Vuex filter key matched from the filter section title (e.g. "Agreement" → "agreement")
   * @param {string} optionText - Substring text of the option label (e.g. "Corp")
   */
  async ensureHotelFilterApplied(filterName, optionText) {
    // Read the checked value from the DOM and dispatch to Vuex if the store hasn't been updated
    await this.page.evaluate(({ filterName, optionText }) => {
      const app = document.querySelector('#app').__vue_app__;
      const store = app.config.globalProperties.$store;
      const storeKey = filterName.toLowerCase(); // e.g. "Agreement" → "agreement"
      const current = store.getters['hotelStore/hotelFilter'][storeKey];
      if (current && current.length > 0) return; // already set via UI click

      // Find the checked el-checkbox inside the filter section and read its value
      const filterContainer = document.querySelector(
        `.hotel-filter .filter-container`
      );
      if (!filterContainer) return;

      // Find the checkbox group and get the value of any checked item
      const checkboxes = document.querySelectorAll('.hotel-filter label.el-checkbox');
      for (const cb of checkboxes) {
        const text = cb.textContent || '';
        if (text.toLowerCase().includes(optionText.toLowerCase())) {
          // Read the value from the input element inside el-checkbox
          const input = cb.querySelector('input.el-checkbox__original');
          if (!input) continue;
          const val = input.value;
          const updatedFilter = { ...store.getters['hotelStore/hotelFilter'] };
          if (!updatedFilter[storeKey]) updatedFilter[storeKey] = [];
          if (!updatedFilter[storeKey].includes(val)) {
            updatedFilter[storeKey] = [...updatedFilter[storeKey], val];
          }
          store.dispatch({ type: 'hotelStore/filterHotels', filterBy: updatedFilter });
          return;
        }
      }
    }, { filterName, optionText });
  }

  /**
   * Checks if an agreement label (e.g. "Corporate rate") is visible in the first hotel result.
   * @param {string} labelText - Agreement label text
   * @returns {Promise<boolean>}
   */
  async isAgreementLabelVisibleInFirstHotel(labelText) {
    const label = this.page.locator(SELECTORS.AGREEMENT_LABEL(labelText)).first();
    try {
      await label.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hovers over an agreement label in the first hotel result and returns the tooltip description text.
   * @param {string} labelText - Agreement label text to hover over (e.g. "Corporate rate")
   * @returns {Promise<string>} The tooltip description text
   */
  async hoverAgreementLabelAndGetTooltip(labelText) {
    // Target the span with exact label text for precise El-Plus tooltip triggering
    const span = this.page.locator(SELECTORS.AGREEMENT_LABEL_SPAN(labelText)).first();
    await span.waitFor({ state: 'visible', timeout: 10000 });
    // Use explicit mouse coordinates - more reliable than element.hover() for El-Plus tooltips
    const box = await span.boundingBox();
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // Wait for El-Plus open-delay (200ms) + render time
    await this.page.waitForTimeout(1500);
    // Read tooltip text via DOM evaluate - handles portal elements teleported to body
    const descText = await this.page.evaluate(() => {
      const el = document.querySelector('.agreement-tooltip__description');
      return el ? el.textContent.trim() : null;
    });
    if (descText === null) throw new Error(`Agreement tooltip description not found in DOM after hovering over "${labelText}"`);
    return descText;
  }

  /**   * Checks if an active filter badge tag is visible in the hotel-filter summary bar.
   * @param {string} text - Tag text (e.g. "My corporate")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isFilterTagVisible(text, { timeout = 10000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');
    const tag = this.page.locator(SELECTORS.HOTEL_FILTER_SUMMARY_TAG(text)).first();
    try {
      await tag.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = HotelLevelResultsPage;
