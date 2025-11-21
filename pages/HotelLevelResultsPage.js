const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  viewRatesLink: ".hotel-list > :nth-child(1) .extra-info a",
  viewRatesButton: ".hotel-list > :nth-child(1) .btn--primary"
};

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "View rates" link to appear on the first hotel in the search results
  // Ensures the hotel listing is fully loaded before proceeding with rate viewing
  async waitForViewRatesText() {
    await waitForText(this.page, SELECTORS.viewRatesLink, "View rates");
  }

  // Clicks the "View rates" button for the first hotel in the search results
  // Navigates to the room-level results page to show available room types and rates
  async clickViewRatesButtonFirstHotel() {
    await this.page.click(SELECTORS.viewRatesButton);
  }
}

module.exports = HotelLevelResultsPage;