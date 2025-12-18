const { waitForText } = require('../utils/wait');

/**
 * Page Object for hotel-level search results.
 * Handles interactions at the property (hotel) list level.
 */
const SELECTORS = {
  VIEW_RATES_LINK: ".hotel-list > :nth-child(1) .extra-info a",
  VIEW_RATES_BUTTON: ".hotel-list > :nth-child(1) .btn--primary"
};

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits until hotel results are loaded.
   * "View rates" indicates the hotel list is ready.
   */
  async waitForViewRatesText() {
    await waitForText(
      this.page,
      SELECTORS.VIEW_RATES_LINK,
      "View rates"
    );
  }

  /**
   * Opens room-level results for the first hotel.
   */
  async clickViewRatesButtonFirstHotel() {
    await this.page.click(SELECTORS.VIEW_RATES_BUTTON);
  }
}

module.exports = HotelLevelResultsPage;