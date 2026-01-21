const { waitForText } = require('@utils/wait');

/**
 * Page Object for hotel search form.
 * Handles only UI interactions.
 */
const SELECTORS = {
  HOTEL_TAB: '#tab-hotel',
  HOTEL_HEADING: '#pane-hotel > h4',
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
      "Book and stay at your hotel"
    );
  }

  /**
   * Types hotel destination and confirms selection.
   * Uses Tab to accept autocomplete suggestion.
   */
  async typeHotelDestination(where) {
    await this.page.waitForSelector(
      SELECTORS.HOTEL_DESTINATION_FIELD,
      { state: 'visible', timeout: 5000 }
    );

    await this.page.click(SELECTORS.HOTEL_DESTINATION_FIELD);
    await this.page.fill(SELECTORS.HOTEL_DESTINATION_FIELD, where);
    await this.page.keyboard.press('Tab');

    // Allow autocomplete resolution
    await this.page.waitForTimeout(5000);
  }

  /** Opens the calendar by clicking check-in field */
  async clickCheckInField() {
    await this.page.click(SELECTORS.CHECK_IN_INPUT);
  }
}

module.exports = HotelSearchPage;