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

  /** Confirms room results page is loaded */
  async waitForViewHotelOnMapText() {
    await this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: "View hotel on map" })
      .waitFor({ state: "visible" });
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
}

module.exports = RoomLevelResultsPage;
