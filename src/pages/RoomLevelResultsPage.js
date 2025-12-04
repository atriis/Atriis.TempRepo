const { waitForText } = require('../utils/wait');
const { scrollToElement } = require('../utils/dom');

// Centralized selectors for easy maintenance
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

  // Waits for the "View hotel on map" button to become visible
  async waitForViewHotelOnMapText() {
    console.log('Waiting for "View hotel on map" button...');
    await this.page.locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: 'View hotel on map' }).waitFor({ state: 'visible' });
    console.log("Map button is now visible");
  }

  // Waits for the "Add to trip" button to appear and scrolls to ensure visibility
  // Combines scrolling and text verification for stable element interaction
  async waitForAddToTripText() {
    console.log("Waiting for 'Add to trip' button...");
    await scrollToElement(this.page, SELECTORS.ADD_TO_TRIP_BUTTON);
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, "Add to trip");
    console.log("'Add to trip' button found");
  }

  // Clicks the refundable filter checkbox to show only refundable room rates
  async clickRefundableCheckbox() {
    console.log('Clicking refundable checkbox...');
    const root = this.page.locator(SELECTORS.REFUNDABLE_CHECKBOX_LABEL, {
      has: this.page.locator("p.filter-title[title='Refundable']")
    });
    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: 'visible' });
    await inner.click();

    // Wait until it becomes checked
    await this.page.waitForFunction(el => el.checked, await input.elementHandle());
    console.log('Refundable checkbox clicked successfully');
  }

  // Verifies that the "Refundable" tag is visible on room listings
  // Confirms that the refundable filter has been applied successfully
  async verifyRefundableTagIsVisible() {
    console.log("Checking for refundable tag...");
    const locator = this.page.locator(SELECTORS.REFUNDABLE_TAG).first();
    await locator.waitFor({ state: "visible" });
    console.log("Refundable tag is visible.");
  }

  // Clicks the "Add to trip" button for the first room in the results
  // Combines scrolling, text verification, and selection for the first available room
  async clickAddToTripTextFirstRoom() {
    console.log("Clicking first 'Add to trip' button...");
    await scrollToElement(this.page, SELECTORS.ADD_TO_TRIP_BUTTON);
    await waitForText(this.page, SELECTORS.ADD_TO_TRIP_BUTTON, "Add to trip");
    await this.page.locator(SELECTORS.ADD_TO_TRIP_BUTTON).first().click();
    console.log("First 'Add to trip' clicked");
  }
}

module.exports = RoomLevelResultsPage;