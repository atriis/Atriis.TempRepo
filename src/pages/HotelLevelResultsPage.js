const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

/**
 * Page Object for hotel level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MEMBER_BADGE: ".expedia-membership-badge-container, .booking-com-membership-badge-container",
  CORPORATE_PREFERRED_BADGE: ".badge-wrapper .app-badge",  // Badge shown when hotel.tags includes 'preferred'
  FIRST_HOTEL_PRICE_AMOUNT: '.hotel-preview .hotel-price .amount',
  VIEW_ON_MAP_BUTTON: '.view-map-btn',
  MAP_CONTAINER: '.map-container',
  MAP_MARKER: '.hotel-map-marker .hotel-price, .hotel-map-marker .hotel-dot',
  SELECTED_MAP_PREVIEW: '.map-container .hotel-preview',
  SELECTED_MAP_PREVIEW_VIEW_RATES_BUTTON: '.map-container .hotel-preview .see-availability-btn',
  SEARCH_HOTEL_FILTER: '[placeholder="Search hotel"]',
  CO2_LABEL: ".hotel-info .eco-label",
  CO2_VALUE: ".hotel-info .eco-label .is-size-7",
  SUPPLIER_LOGO_IMG: (supplierId) => `.hotel-supplier-carousel img[alt*="${supplierId}"], .supplier-img img[alt*="${supplierId}"]`,
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
  // "Hotel wasn't found" no-results section
  HOTEL_NO_RESULTS: '.hotel-no-results',
  // Hotel details drawer amenities section
  HOTEL_AMENITIES: '.hotel-amenities',
  // More details button inside a hotel card
  MORE_DETAILS_BUTTON: '.more-details-btn',
  // Agreement badge (any) in hotel card
  AGREEMENT_BADGE: '.hotel-preview .ticket-agreement',
  // Last hotel item in hotel list (lazy-loaded sentinel element)
  LAST_HOTEL_VIEW_RATES_BUTTON: "[id='last-item'] .btn--primary",
  // Selected sort value in the hotel-list-sort dropdown
  SORT_SELECTED_ITEM: '.hotel-list-sort .sort .el-select .el-select__placeholder',
  // Share mode button in hotel-list-sort bar
  SHARE_MODE_BUTTON: '.share-btn-container .share-btn',
  // Individual hotel share button (visible only in share mode)
  HOTEL_SHARE_ADD_BUTTON: '.hotel-preview .share-btn.py-2',
  // Share bar email button (appears after selecting hotels to share)
  SHARE_BAR_EMAIL_BUTTON: '.share-bar .share-btn',
  // Supplier filter checkboxes in hotel filter panel
  SUPPLIER_FILTER_CHECKBOX: '.hotel-filter .suppliers-filter .el-checkbox',
  // Supplier filter checkbox by supplier name (img alt contains supplier ID)
  SUPPLIER_FILTER_ITEM: (supplierId) => `.hotel-filter .suppliers-filter .el-checkbox:has(img[alt*="${supplierId}"])`,
  // Hotel info bar date text (check-in and check-out displayed as "MMM dd-MMM dd")
  HOTEL_INFO_BAR_DATES: '.hotel-info-bar .date-room-wrapper p:first-of-type',
  // Hotel name text inside hotel cards
  HOTEL_NAME: '.hotel-preview .hotel-name h4',
  // Slider runway and thumb for the hotel-level Price filter panel
  HOTEL_PRICE_SLIDER_RUNWAY: '.hotel-filter .price-slider .el-slider__runway',
  HOTEL_PRICE_SLIDER_THUMB: '.hotel-filter .price-slider .el-slider__button-wrapper',
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

  /** Waits until the first "View rates" button is visible (180s timeout for slow GDS suppliers) */
  async waitForViewRatesText() {
    const viewRatesButton = this.getViewRatesButton();

    // Wait for results page to be ready before looking for buttons (map button signals results loaded)
    await this.waitForResultsPageReady();

    // Race the expected button against the "Hotel wasn't found" empty state so we throw a
    // descriptive error in CI instead of a generic 180s timeout when the supplier returns
    // zero hotels for the search criteria.
    const buttonPromise = viewRatesButton
      .waitFor({ state: 'attached', timeout: 180000 })
      .then(() => 'button');
    const noResultsPromise = this.page.locator(SELECTORS.HOTEL_NO_RESULTS)
      .waitFor({ state: 'visible', timeout: 180000 })
      .then(() => 'no-results');

    const winner = await Promise.race([buttonPromise, noResultsPromise]).catch(() => null);

    if (winner === 'no-results') {
      throw new Error(
        `No hotels found on results page. The "Hotel wasn't found" empty state was displayed ` +
        `instead of bookable hotels; expected "View rates" button never appeared. ` +
        `This is typically a data/availability issue (supplier returned zero hotels for the search criteria), ` +
        `not a test bug.`
      );
    }

    if (winner !== 'button') {
      // Neither resolved — surface the original Playwright timeout for diagnostics.
      await viewRatesButton.waitFor({ state: 'attached', timeout: 180000 });
    }

    await viewRatesButton.scrollIntoViewIfNeeded({ timeout: 180000 });
    await viewRatesButton.waitFor({ state: 'visible', timeout: 180000 });
  }

  async waitForResultsPageReady() {
    await this.page.waitForURL(/\/products\/hotels\/results/, { timeout: 180000 });
    await this.page.locator(SELECTORS.VIEW_ON_MAP_BUTTON).first().waitFor({ state: 'visible', timeout: 180000 });
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
      await badge.waitFor({ state: 'visible', timeout: 15000 });
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

  async getMemberBadgeText() {
    const badge = this.page.locator(SELECTORS.MEMBER_BADGE).first();
    try {
      await badge.waitFor({ state: "visible", timeout: 10000 });
      return (await badge.textContent())?.trim() ?? '';
    } catch (err) {
      throw new Error(
        `[HotelLevelResultsPage.getMemberBadgeText] Member badge not visible within 10s (selector: ${SELECTORS.MEMBER_BADGE}). ` +
        `The hotel results may not have member rate offers, or the page is still loading. Original: ${err.message}`
      );
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

  /**
   * Gets the first displayed hotel-level price from results.
   * @returns {Promise<number>} First hotel price as a number
   */
  async getFirstHotelLevelPrice() {
    const price = this.page.locator(SELECTORS.FIRST_HOTEL_PRICE_AMOUNT).first();
    await price.waitFor({ state: 'visible', timeout: 30000 });

    const priceText = (await price.textContent())?.trim() ?? '';
    const parsedPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    if (Number.isNaN(parsedPrice)) {
      throw new Error(`Could not parse hotel-level price from text: "${priceText}"`);
    }

    return parsedPrice;
  }

  async openMapView() {
    const viewOnMapButton = this.page.locator(SELECTORS.VIEW_ON_MAP_BUTTON).first();
    await viewOnMapButton.waitFor({ state: 'visible', timeout: 30000 });
    await viewOnMapButton.click();
    await this.page.locator(SELECTORS.MAP_CONTAINER).waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForMapMarkers({ timeout = 30000 } = {}) {
    await this.page.locator(SELECTORS.MAP_MARKER).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Drags the map in a given direction by performing a mouse drag gesture.
   * @param {'left'|'right'|'up'|'down'} direction
   * @param {number} [distance=300] - pixels to drag
   */
  async dragMap(direction = 'right', { distance = 300, timeout = 10000 } = {}) {
    const mapContainer = this.page.locator(SELECTORS.MAP_CONTAINER).first();
    await mapContainer.waitFor({ state: 'visible', timeout });
    const box = await mapContainer.boundingBox();
    if (!box) throw new Error('Map container not visible or has no bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const offsets = { left: [-distance, 0], right: [distance, 0], up: [0, -distance], down: [0, distance] };
    const [dx, dy] = offsets[direction] || offsets.right;
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down();
    await this.page.mouse.move(centerX + dx, centerY + dy, { steps: 10 });
    await this.page.mouse.up();
  }

  async selectFirstMapMarker() {
    const firstMarker = this.page.locator(SELECTORS.MAP_MARKER).first();
    await firstMarker.waitFor({ state: 'visible', timeout: 30000 });
    await firstMarker.click({ force: true });
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

  async clearHotelNameFilter() {
    await this.page.locator(SELECTORS.SEARCH_HOTEL_FILTER).clear();
  }

  async getVisibleHotelCardCount({ timeout = 5000 } = {}) {
    await this.page.waitForTimeout(timeout);
    return this.page.locator(SELECTORS.HOTEL_CARD).count();
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
    const amenitiesVisible = await this.page.locator(SELECTORS.HOTEL_AMENITIES).first().isVisible().catch(() => false);
    if (amenitiesVisible) {
      await this.page.keyboard.press('Escape');
      await this.page.locator(SELECTORS.HOTEL_AMENITIES).first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    const hotelCard = this.page.locator(SELECTORS.HOTEL_CARD).nth(index - 1);
    await hotelCard.waitFor({ state: 'visible', timeout: 30000 });
    await hotelCard.scrollIntoViewIfNeeded();
    const moreDetailsBtn = hotelCard.locator(SELECTORS.MORE_DETAILS_BUTTON).first();
    await moreDetailsBtn.waitFor({ state: 'visible', timeout: 15000 });
    await moreDetailsBtn.click();
    // Wait for the hotel details drawer with amenities to open and load
    await this.page.locator(SELECTORS.HOTEL_AMENITIES).first().waitFor({ state: 'visible', timeout: 15000 });
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
    await span.scrollIntoViewIfNeeded();
    // Use Playwright's hover() which reliably maintains the pointer-enter event for El-Plus
    await span.hover();
    // Wait for El-Plus tooltip portal to render (open-delay 200ms + render)
    const tooltipDesc = this.page.locator('.agreement-tooltip__description').first();
    try {
      await tooltipDesc.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Retry: move away and re-hover
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await span.hover();
      await tooltipDesc.waitFor({ state: 'visible', timeout: 5000 });
    }
    const descText = await tooltipDesc.textContent();
    if (!descText) throw new Error(`Agreement tooltip description not found in DOM after hovering over "${labelText}"`);
    return descText.trim();
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

  /**
   * Checks if any agreement badge (handshake icon) is visible in hotel level results.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isAnyAgreementBadgeVisible({ timeout = 10000 } = {}) {
    const badge = this.page.locator(SELECTORS.AGREEMENT_BADGE).first();
    try {
      await badge.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the "Hotel wasn't found" no-results section is visible.
   * @returns {Promise<boolean>} True if the no-results section is visible
   */
  async isHotelNotFoundMessageVisible() {
    try {
      await this.page.locator(SELECTORS.HOTEL_NO_RESULTS).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scrolls to the last hotel in the list and clicks its "View rates" button.
   * The last hotel uses id="last-item" as a sentinel element.
   */
  /**
   * Clicks the share mode button to enter share mode on hotel-level results.
   */
  async clickShareModeButton() {
    const btn = this.page.locator(SELECTORS.SHARE_MODE_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Clicks the share/add button on the first hotel card (in share mode).
   */
  async clickFirstHotelShareButton() {
    const btn = this.page.locator(SELECTORS.HOTEL_SHARE_ADD_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Clicks the email button in the share bar to open the share email dialog.
   */
  async clickShareBarEmailButton() {
    const btn = this.page.locator(SELECTORS.SHARE_BAR_EMAIL_BUTTON).first();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
  }

  /**
   * Gets the currently selected sort option label from the hotel list sort dropdown.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<string>} The selected sort label text
   */
  async getSelectedSortLabel({ timeout = 10000 } = {}) {
    const item = this.page.locator(SELECTORS.SORT_SELECTED_ITEM).first();
    await item.waitFor({ state: 'visible', timeout });
    return (await item.textContent()).trim();
  }

  /**
   * Counts the number of supplier filter checkboxes in the hotel filter panel.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<number>} The number of supplier checkboxes
   */
  async getSupplierFilterCount({ timeout = 15000 } = {}) {
    const checkboxes = this.page.locator(SELECTORS.SUPPLIER_FILTER_CHECKBOX);
    try {
      await checkboxes.first().waitFor({ state: 'visible', timeout });
    } catch {
      return 0;
    }
    return checkboxes.count();
  }

  /**
   * Checks if a specific supplier is visible in the supplier filter panel.
   * @param {string} supplierId - The supplier ID (e.g. "BOOKINGCOM", "AMADEUS")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isSupplierFilterVisible(supplierId, { timeout = 10000 } = {}) {
    if (!supplierId || typeof supplierId !== 'string') throw new Error('supplierId must be a non-empty string');
    const item = this.page.locator(SELECTORS.SUPPLIER_FILTER_ITEM(supplierId)).first();
    try {
      await item.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async scrollToAndClickLastHotelViewRates() {
    const lastHotelButton = this.page.locator(SELECTORS.LAST_HOTEL_VIEW_RATES_BUTTON);
    await lastHotelButton.waitFor({ state: 'attached', timeout: 60000 });
    await lastHotelButton.scrollIntoViewIfNeeded();
    await lastHotelButton.waitFor({ state: 'visible', timeout: 30000 });
    await lastHotelButton.click();
  }

  /**
   * Extracts the hotel search date text from the hotel info bar.
   * Returns the raw text like "Dec 11- Dec 15".
   * @returns {Promise<string>} The date text from the info bar
   */
  async getHotelInfoBarDateText() {
    const dateElement = this.page.locator(SELECTORS.HOTEL_INFO_BAR_DATES);
    await dateElement.waitFor({ state: 'visible', timeout: 30000 });
    return (await dateElement.textContent()).trim();
  }

  /**
   * Gets the hotel name at a specific 1-based index.
   * @param {number} index - 1-based hotel card index
   * @returns {Promise<string>} The hotel name text
   */
  async getHotelNameAtIndex(index) {
    if (typeof index !== 'number' || index < 1) {
      throw new Error('index must be >= 1, got: ' + index);
    }
    const name = this.page.locator(SELECTORS.HOTEL_NAME).nth(index - 1);
    await name.waitFor({ state: 'visible', timeout: 30000 });
    return (await name.textContent()).trim();
  }

  /**
   * Gets all visible hotel names from results.
   * @returns {Promise<string[]>} Array of hotel name strings
   */
  async getAllHotelNames() {
    const names = this.page.locator(SELECTORS.HOTEL_NAME);
    await names.first().waitFor({ state: 'visible', timeout: 30000 });
    const allNames = await names.allTextContents();
    return allNames.map(n => n.trim());
  }

  /**
   * Clicks a supplier filter checkbox by supplier ID.
   * @param {string} supplierId - The supplier ID to match in the checkbox img alt (e.g. "SABRE")
   */
  async clickSupplierFilterCheckbox(supplierId) {
    if (!supplierId || typeof supplierId !== 'string') throw new Error('supplierId must be a non-empty string');
    const checkbox = this.page.locator(SELECTORS.SUPPLIER_FILTER_ITEM(supplierId)).first();
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    await checkbox.click();
  }

  /**
   * Drags the max (right) handle of the hotel-level Price slider to the given price value.
   * Reads the slider min/max bounds from the Vuex store to calculate the correct pixel position.
   * @param {number} maxPrice - The maximum price value to drag to
   */
  async setMaxPriceFilter(maxPrice) {
    if (typeof maxPrice !== 'number' || maxPrice <= 0) {
      throw new Error(`[HotelLevelResultsPage.setMaxPriceFilter] "maxPrice" must be a positive number, got: ${typeof maxPrice} (${maxPrice})`);
    }
    const runway = this.page.locator(SELECTORS.HOTEL_PRICE_SLIDER_RUNWAY).first();
    try {
      await runway.waitFor({ state: 'visible', timeout: 15000 });

      const [sliderMin, sliderMax] = await this.page.evaluate(() => {
        const store = document.querySelector('#app').__vue_app__.config.globalProperties.$store;
        const { priceMinMax } = store.getters['hotelStore/hotelFilter'];
        return priceMinMax;
      });

      const runwayBox = await runway.boundingBox();
      const targetPercent = Math.min(1, Math.max(0, (maxPrice - sliderMin) / (sliderMax - sliderMin)));
      const targetX = runwayBox.x + runwayBox.width * targetPercent;
      const targetY = runwayBox.y + runwayBox.height / 2;

      // nth(1) is the max (right) thumb in range mode
      const maxThumb = this.page.locator(SELECTORS.HOTEL_PRICE_SLIDER_THUMB).nth(1);
      const thumbBox = await maxThumb.boundingBox();

      await this.page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(targetX, targetY, { steps: 20 });
      await this.page.mouse.up();
    } catch (err) {
      throw new Error(`[HotelLevelResultsPage.setMaxPriceFilter] Could not drag price slider to ${maxPrice}. Original: ${err.message}`);
    }
  }
}

module.exports = HotelLevelResultsPage;
