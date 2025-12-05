const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
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

  // Clicks on the hotel tab to switch to hotel booking mode
  async clickHotelTab() {
    console.log('Clicking on Hotel tab...');
    await this.page.click(SELECTORS.HOTEL_TAB);
    console.log('Clicked on Hotel tab');
  }

  // Waits for the hotel booking section heading to appear
  // Confirms that the hotel tab interface has loaded properly
  async waitForBookAndStayAtYourHotelText() {
    console.log('Waiting for Book and stay at your hotel text...');
    await waitForText(this.page, SELECTORS.HOTEL_HEADING, "Book and stay at your hotel");
    console.log('Book and stay at your hotel text is visible');
  }

  // Types the hotel destination in the search form
  async typeHotelDestination(where) {
    console.log(`Typing hotel destination: ${where}`);
    await this.page.waitForTimeout(2000); // Ensure option is displayed
    await this.page.waitForSelector(SELECTORS.HOTEL_DESTINATION_FIELD, { timeout: 5000, state: 'visible' });
    await this.page.click(SELECTORS.HOTEL_DESTINATION_FIELD); // Focus the field first
    await this.page.fill(SELECTORS.HOTEL_DESTINATION_FIELD, where);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(5000);
    console.log(`Successfully typed destination: ${where}`);
  }

  // Clicks on the check-in date field to open the date picker calendar
  async clickCheckInField() {
    console.log('Clicking on Check in field...');
    await this.page.click(SELECTORS.CHECK_IN_INPUT);
    console.log('Clicked on Check in field');
  }
}

module.exports = HotelSearchPage;