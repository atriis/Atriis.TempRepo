const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  hotelTab: '#tab-hotel',
  hotelHeading: '#pane-hotel > h4',
  hotelDestinationInput: "[placeholder*='Where']",
  hotelAutocompleteInput: "[placeholder='Where would you like to stay?']",
  checkInInput: "[placeholder='Check in']",
  calendarNextArrow: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  pickerPanel: ".el-picker-panel:visible",
  monthTable: "table.el-date-table",
  availableDayCell: "td.available .el-date-table-cell__text"
};

class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the hotel tab to switch to hotel booking mode
  async clickHotelTab() {
    await this.page.click(SELECTORS.hotelTab);
    console.log('Clicked on Hotel tab');
  }

  // Waits for the hotel booking section heading to appear
  // Confirms that the hotel tab interface has loaded properly
  async waitForBookAndStayAtYourHotelText() {
    await waitForText(this.page, SELECTORS.hotelHeading, "Book and stay at your hotel");
    console.log('Book and stay at your hotel text is visible');
  }

  // Types the hotel destination in the search form
  async typeHotelDestination(where) {
    console.log(`Typing hotel destination: ${where}`);
    await this.page.waitForTimeout(2000); // Ensure page is fully loaded
    await this.page.waitForSelector(SELECTORS.hotelDestinationInput, { timeout: 5000, state: 'visible' });
    await this.page.click(SELECTORS.hotelDestinationInput); // Focus the field first
    await this.page.fill(SELECTORS.hotelDestinationInput, where);
    console.log(`Successfully typed destination`);
  }

  // Tabs out of the hotel destination autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromHotelAutocomplete() {
    console.log('Tabbing out of hotel autocomplete field...');
    await this.page.focus(SELECTORS.hotelAutocompleteInput);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
  }

  // Clicks on the check-in date field to open the date picker calendar
  async clickCheckInField() {
    await this.page.click(SELECTORS.checkInInput);
    console.log('Clicked on Check in field');
  }

  // Navigates forward in the hotel date calendar by clicking next month arrow
  // Default: advances 3 months
  async clickCalendarNextArrow(times = 3) {
    const nextArrow = this.page.locator(SELECTORS.calendarNextArrow);
    await nextArrow.waitFor({ state: 'visible' });
    for (let i = 0; i < times; i++) {
      await nextArrow.click();
      await this.page.waitForTimeout(300);
    }
    console.log('Clicked visible calendar next arrow', times, 'times');
  }

  // Selects the first available date in the check-in calendar
  // Assumes the date picker is already open from clicking the check-in field
  async selectDefaultCheckInDate() {
    const picker = this.page.locator(SELECTORS.pickerPanel).first();
    const monthTable = picker.locator(SELECTORS.monthTable).first();
    const days = monthTable.locator(SELECTORS.availableDayCell);
    await days.first().waitFor({ state: 'visible' });
    await days.first().click();
    console.log('Selected default check-in date (first available)');
  }

  // Selects the second available date as the check-out date
  // Ensures one-night stay duration for the hotel booking
  async selectDefaultCheckOutDate() {
    const picker = this.page.locator(SELECTORS.pickerPanel).first();
    const monthTable = picker.locator(SELECTORS.monthTable).first();
    const days = monthTable.locator(SELECTORS.availableDayCell);
    const count = await days.count();
    if (count < 2) {
      throw new Error(`Not enough available dates. Found only ${count} available day(s) in visible calendar.`);
    }
    await days.nth(1).waitFor({ state: 'visible' });
    await days.nth(1).click();
    console.log('Selected default check-out date (second available)');
  }
}

module.exports = HotelSearchPage;