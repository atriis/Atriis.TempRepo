const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  hotelTab: '#tab-hotel',
  hotelHeading: '#pane-hotel > h4',
  hotelDestinationInput: "[placeholder*='Where']",
  hotelAutocompleteInput: "[placeholder='Where would you like to stay?']",
  checkInInput: "[placeholder='Check in']",
};

class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the hotel tab to switch to hotel booking mode
  async clickHotelTab() {
    console.log('Clicking on Hotel tab...');
    await this.page.click(SELECTORS.hotelTab);
    console.log('Clicked on Hotel tab');
  }

  // Waits for the hotel booking section heading to appear
  // Confirms that the hotel tab interface has loaded properly
  async waitForBookAndStayAtYourHotelText() {
    console.log('Waiting for Book and stay at your hotel text...');
    await waitForText(this.page, SELECTORS.hotelHeading, "Book and stay at your hotel");
    console.log('Book and stay at your hotel text is visible');
  }

  // Types the hotel destination in the search form
  async typeHotelDestination(where) {
    console.log(`Typing hotel destination: ${where}`);
    await this.page.waitForTimeout(2000); // Ensure option is displayed
    await this.page.waitForSelector(SELECTORS.hotelDestinationInput, { timeout: 5000, state: 'visible' });
    await this.page.click(SELECTORS.hotelDestinationInput); // Focus the field first
    await this.page.fill(SELECTORS.hotelDestinationInput, where);
    console.log(`Successfully typed destination: ${where}`);
  }

  // Tabs out of the hotel destination autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromHotelAutocomplete() {
    console.log('Tabbing out of hotel autocomplete field...');
    await this.page.focus(SELECTORS.hotelAutocompleteInput);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
    console.log('Tabbed out of hotel autocomplete field successfully');
  }

  // Clicks on the check-in date field to open the date picker calendar
  async clickCheckInField() {
    console.log('Clicking on Check in field...');
    await this.page.click(SELECTORS.checkInInput);
    console.log('Clicked on Check in field');
  }
}

module.exports = HotelSearchPage;