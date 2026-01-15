/**
 * Page Object for room-level hotel results.
 */
const SELECTORS = {
  VIEW_HOTEL_ON_MAP_BUTTON: "button.map-btn.is-paddingless",
  REFUNDABLE_CHECKBOX_LABEL: "label.el-checkbox",
  REFUNDABLE_CHECKBOX_INNER: ".el-checkbox__inner",
  REFUNDABLE_CHECKBOX_INPUT: "input.el-checkbox__original",
  REFUNDABLE_TAG: "div.refundable:has-text('Refundable')"
};

class RoomLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  /** Confirms room results page is loaded */
  async waitForViewHotelOnMapText() {
    await this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: 'View hotel on map' })
      .waitFor({ state: 'visible' });
  }

  /**
   * Enables the "Refundable" filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickRefundableCheckbox() {
    const root = this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator("p.filter-title[title='Refundable']") }
    );

    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: 'visible' });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle()
    );
  }

  /** Verifies refundable tag appears on room cards */
  async verifyRefundableTagIsVisible() {
    await this.page
      .locator(SELECTORS.REFUNDABLE_TAG)
      .first()
      .waitFor({ state: 'visible' });
  }
}

module.exports = RoomLevelResultsPage;