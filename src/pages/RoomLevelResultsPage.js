const { waitForText } = require('../utils/wait');
const { scrollToElement } = require('../utils/dom');

/**
 * Page Object for room-level hotel results.
 */
const SELECTORS = {
  VIEW_HOTEL_ON_MAP_BUTTON: "button.map-btn.is-paddingless",
  ADD_TO_TRIP_BUTTON: "button.add-to-trip-btn",
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

  /** Ensures Add to trip buttons are visible and clickable */
  async waitForAddToTripText() {
    await scrollToElement(this.page, SELECTORS.ADD_TO_TRIP_BUTTON);
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, "Add to trip");
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

  /** Adds the first available room to the trip */
  async clickAddToTripTextFirstRoom() {
    await scrollToElement(this.page, SELECTORS.ADD_TO_TRIP_BUTTON);
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, "Add to trip");
    await this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).first().click();
  }
}

module.exports = RoomLevelResultsPage;