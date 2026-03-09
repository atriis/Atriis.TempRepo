const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

/**
 * Page Object for hotel level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MEMBER_BADGE: ".expedia-membership-badge-container, .booking-com-membership-badge-container",
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

  /** Clicks the first available "View rates" button */
  async clickFirstViewRatesButton() {
    await this.getViewRatesButton().click();
  }

  /**
   * Verifies member rate badge is visible in hotel results
   * @returns {Promise<boolean>} True if member badge is visible
   */
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
}

module.exports = HotelLevelResultsPage;
