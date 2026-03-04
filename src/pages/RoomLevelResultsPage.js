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
  NIGHTS_TEXT: ".price-txt .muliSemiBold.gray-2600",
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
   * Extracts the number of nights from the price details suffix in the first room.
   * Format usually: "1 Room · 3 Nights"
   * @returns {Promise<number>} The number of nights
   */
  async getNightsCount() {
    const locators = this.page.locator(SELECTORS.NIGHTS_TEXT);
    await locators.first().waitFor({ state: "visible", timeout: 10000 });
    const count = await locators.count();
    
    for (let i = 0; i < count; i++) {
        const text = await locators.nth(i).innerText();
        // Match "3 Nights" or "3 Night"
        const match = text.match(/(\d+)\s+Night/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }
    
    // Fallback error with more context
    const allTexts = [];
    for (let i = 0; i < count; i++) {
        allTexts.push(await locators.nth(i).innerText());
    }
    throw new Error(`Could not find night count in matching texts: [${allTexts.join(', ')}]`);
  }

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

  async isMemberBadgeVisible() {
    return await this.page.locator(SELECTORS.MEMBER_BADGE).first().isVisible();
  }

  async getPriceComparison() {
    const memberPriceText = await this.page.locator(SELECTORS.MEMBER_PRICE).first().innerText();
    const regularPriceText = await this.page.locator(SELECTORS.REGULAR_PRICE_BEFORE_DISCOUNT).first().innerText();
    return {
      memberPrice: parseFloat(memberPriceText.replace(/[^0-9.]/g, '')),
      regularPrice: parseFloat(regularPriceText.replace(/[^0-9.]/g, ''))
    };
  }

  async getCancellationPolicy() {
    return await this.page.locator(SELECTORS.FIRST_ROOM_CANCELLATION_POLICY).first().innerText();
  }

  async isCO2LabelVisible({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CO2_LABEL).first();
    try {
      await label.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getCO2Value() {
    const value = this.page.locator(SELECTORS.CO2_VALUE).first();
    await value.waitFor({ state: "visible", timeout: 10000 });
    return (await value.textContent()).trim();
  }
}

module.exports = RoomLevelResultsPage;