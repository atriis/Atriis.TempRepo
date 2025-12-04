const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  VIEW_RATES_LINK: ".hotel-list > :nth-child(1) .extra-info a",
  VIEW_RATES_BUTTON: ".hotel-list > :nth-child(1) .btn--primary"
};

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "View rates" link to appear on the first hotel in the search results
  // Ensures the hotel listing is fully loaded before proceeding with rate viewing
  async waitForViewRatesText() {
    await waitForText(this.page, SELECTORS.VIEW_RATES_LINK, "View rates");
  }

  // Clicks the "View rates" button for the first hotel in the search results
  // Navigates to the room-level results page to show available room types and rates
  async clickViewRatesButtonFirstHotel() {
    await this.page.click(SELECTORS.VIEW_RATES_BUTTON);
  }
}

module.exports = HotelLevelResultsPage;