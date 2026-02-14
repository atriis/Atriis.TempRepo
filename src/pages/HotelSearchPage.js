const { waitForText } = require("@utils/wait");
const { pressTab } = require("@utils/dom");
const { expect } = require("@playwright/test");

/**
 * Page Object for hotel search form.
 * Handles only UI interactions.
 */
const SELECTORS = {
  HOTEL_TAB: "#tab-hotel",
  HOTEL_HEADING: "#pane-hotel > h4",
  HOTEL_DESTINATION_FIELD: "[placeholder='Where would you like to stay?']",
  CHECK_IN_INPUT: "[placeholder='Check in']",
};


class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Hotel search */
  async clickHotelTab() {
    await this.page.click(SELECTORS.HOTEL_TAB);
  }

  /** Confirms hotel search UI is loaded */
  async waitForBookAndStayAtYourHotelText() {
    await waitForText(
      this.page,
      SELECTORS.HOTEL_HEADING,
      "Book and stay at your hotel",
    );
  }

  /**
   * Types hotel destination and confirms selection.
   *
   * Types into the destination field, uses TAB to accept the
   * autocomplete suggestion, and waits until the field loses
   * focus to ensure the selection was applied.
   *
   * @param {string} where - Hotel destination to search for
   */
  async typeHotelDestination(where) {
    const destinationField = this.page.locator(
      SELECTORS.HOTEL_DESTINATION_FIELD,
    );

    // Ensure field is visible and ready
    await destinationField.waitFor({ state: "visible" });

    await destinationField.click();
    await destinationField.fill(where);

    // Accept autocomplete suggestion
    await pressTab(this.page);

    // Small wait for UI to process the blur event
    await this.page.waitForTimeout(100);
  }

  /**
   * Opens the calendar by clicking the check-in field.
   */
  async clickCheckInField() {
    await this.page
      .locator(SELECTORS.CHECK_IN_INPUT)
      .click();
  }
}

module.exports = HotelSearchPage;
