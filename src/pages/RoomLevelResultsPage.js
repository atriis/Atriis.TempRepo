/**
 * Page Object for room level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  VIEW_HOTEL_ON_MAP_BUTTON: "button.map-btn.is-paddingless",
  REFUNDABLE_CHECKBOX_LABEL: "label.el-checkbox",
  REFUNDABLE_CHECKBOX_INNER: ".el-checkbox__inner",
  REFUNDABLE_CHECKBOX_INPUT: "input.el-checkbox__original",
  REFUNDABLE_TAG: "div.refundable:has-text('Refundable')",
  FIRST_ROOM_CANCELLATION_POLICY: ".room-list > :nth-child(2) .ticket-details p",
  MEMBER_BADGE: ".expedia-membership-badge-container",
  FIRST_ROOM_PRICE: ".room-list > :nth-child(2) .price-details-main",
  MEMBER_PRICE: ".price-txt h4.amount",
  REGULAR_PRICE_BEFORE_DISCOUNT: ".price-txt h6.amount-before-discount",
  CO2_LABEL: ".eco-label",
  CO2_VALUE: ".eco-label .is-size-7",
};

class RoomLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the refundable checkbox root container locator.
   * @returns {Locator} Playwright locator for the refundable checkbox container
   */
  getRefundableCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator("p.filter-title[title='Refundable']") },
    );
  }

  /**
   * Gets the refundable checkbox inner element locator.
   * @returns {Locator} Playwright locator for the checkbox inner element
   */
  getRefundableCheckboxInner() {
    return this.getRefundableCheckboxRoot().locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
  }

  /**
   * Gets the refundable checkbox input element locator.
   * @returns {Locator} Playwright locator for the checkbox input element
   */
  getRefundableCheckboxInput() {
    return this.getRefundableCheckboxRoot().locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);
  }

  // ===== UI INTERACTIONS =====

  /**
   * Confirms room results page is loaded.
   * Some providers do not show this element, so treat it as optional.
   * @returns {Promise<boolean>} True if visible within timeout, else false.
   */
  async waitForViewHotelOnMapText() {
    const viewOnMap = this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: "View hotel on map" });

    try {
      await viewOnMap.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enables the "Refundable" filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickRefundableCheckbox() {
    const inner = this.getRefundableCheckboxInner();
    const input = this.getRefundableCheckboxInput();

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /** Verifies refundable tag appears on room cards */
  async verifyRefundableTagIsVisible() {
    await this.page
      .locator(SELECTORS.REFUNDABLE_TAG)
      .first()
      .waitFor({ state: "visible" });
  }

  /**
   * Gets the cancellation policy text from the first room in the room list.
   * @returns {Promise<string>} The cancellation policy text
   */
  async getCancellationPolicy() {
    const locator = this.page.locator(SELECTORS.FIRST_ROOM_CANCELLATION_POLICY).first();
    await locator.waitFor({ state: "visible" });
    return locator.innerText();
  }

  /**
   * Verifies member rate badge is visible in room results
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
   * Gets the price values from the first room to compare member vs regular pricing.
   * Extracts both the discounted price and the original price before discount.
   * @returns {Promise<{memberPrice: number, regularPrice: number}>} Price comparison object
   */
  async getPriceComparison() {
    const priceContainer = this.page.locator(SELECTORS.FIRST_ROOM_PRICE).first();
    await priceContainer.waitFor({ state: "visible" });

    // Get the discounted (member) price
    const memberPriceLocator = priceContainer.locator(SELECTORS.MEMBER_PRICE).first();
    const memberPriceText = await memberPriceLocator.innerText();
    const memberPrice = parseFloat(memberPriceText.replace(/[^0-9.]/g, ''));

    // Get the regular price before discount (if shown)
    let regularPrice = memberPrice; // Default if no discount shown
    
    // Try to find the "before discount" price
    const beforeDiscountLocator = priceContainer.locator(SELECTORS.REGULAR_PRICE_BEFORE_DISCOUNT).first();
    try {
      const beforeDiscountText = await beforeDiscountLocator.innerText({ timeout: 2000 });
      regularPrice = parseFloat(beforeDiscountText.replace(/[^0-9.]/g, ''));
    } catch {
      // No before discount price found - member price and regular price are the same
    }

    return { memberPrice, regularPrice };
  }

  /**
   * Checks if CO2 eco-label is visible in room level results.
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
   * Gets the CO2 value text from the room level results.
   * @returns {Promise<string>} The CO2 numeric value text
   */
  async getCO2Value() {
    const value = this.page.locator(SELECTORS.CO2_VALUE).first();
    await value.waitFor({ state: "visible", timeout: 10000 });
    return (await value.textContent()).trim();
  }
}

module.exports = RoomLevelResultsPage;
