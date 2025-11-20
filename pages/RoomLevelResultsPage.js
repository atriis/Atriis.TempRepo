// pages/RoomLevelResultsPage.js
const { waitForText } = require('../utils/wait');
const { scrollToElement } = require('../utils/dom');

class RoomLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for "Check in" text in the main layout
async waitForViewHotelOnMapText() {
  await this.page.locator(
    'button.map-btn.is-paddingless',
    { hasText: 'View hotel on map' }
  ).waitFor({ state: 'visible' });

  console.log("Map button is now visible");
}

async waitForAddToTripText() {
  console.log("Waiting for 'Add to trip' button...");

  // 1. Scroll to the element
  await scrollToElement(this.page, "button.add-to-trip-btn");

  // 2. Wait for the exact text using your helper
  await waitForText(
    this.page,
    "button.add-to-trip-btn",
    "Add to trip"
  );

  console.log("'Add to trip' button found");
}

async clickRefundableCheckbox() {
  const root = this.page
    .locator('label.el-checkbox', {
      has: this.page.locator('p.filter-title[title="Refundable"]'),
    });

  const inner = root.locator('.el-checkbox__inner');
  const input = root.locator('input.el-checkbox__original');

  await inner.scrollIntoViewIfNeeded();
  await inner.waitFor({ state: 'visible' });
  await inner.click();

  // Optional: wait until it becomes checked
  await this.page.waitForFunction(el => el.checked, await input.elementHandle());
}

async verifyRefundableTagIsVisible() {
  console.log("Checking for refundable tag...");

  const locator = this.page.locator("div.refundable:has-text('Refundable')").first();

  await locator.waitFor({ state: "visible" });

  console.log("Refundable tag is visible.");
}

async clickAddToTripTextFirstRoom() {
  console.log("Clicking first 'Add to trip' button...");

  // 1. Scroll to the element
  await scrollToElement(this.page, "button.add-to-trip-btn");

  // 2. Wait for text using your helper
  await waitForText(
    this.page,
    "button.add-to-trip-btn",
    "Add to trip"
  );

  // 3. Click the first one
  await this.page.locator("button.add-to-trip-btn").first().click();

  console.log("First 'Add to trip' clicked");

}
}

module.exports = RoomLevelResultsPage;
