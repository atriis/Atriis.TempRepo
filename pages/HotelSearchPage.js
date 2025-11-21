const { waitForText } = require('../utils/wait');

class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the hotel tab to switch to hotel booking mode
  async clickHotelTab() {
    await this.page.click("#tab-hotel");
    console.log('Clicked on Hotel tab');
  }

  // Waits for the hotel booking section heading to appear
  // Confirms that the hotel tab interface has loaded properly
  async waitForBookAndStayAtYourHotelText() {
    await waitForText(
      this.page,
      "#pane-hotel > h4",
      "Book and stay at your hotel"
    );
    console.log('Book and stay at your hotel text is visible');
  }

  // Types the hotel destination in the search form
  async typeHotelDestination(where) {
    console.log(`Typing hotel destination: ${where}`);
    
    // Wait for the hotel page to be fully loaded first
    await this.page.waitForTimeout(2000);
    
    await this.page.waitForSelector("[placeholder*='Where']", { timeout: 5000, state: 'visible' });
    await this.page.click("[placeholder*='Where']"); // Focus the field first
    await this.page.fill("[placeholder*='Where']", where);
    console.log(`Successfully typed destination`);
  }

  // Tabs out of the hotel destination autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromHotelAutocomplete() {
    console.log('Tabbing out of hotel autocomplete field...');

    // Ensure the field is focused before tabbing
    await this.page.focus("[placeholder='Where would you like to stay?']");

    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
  }

  // Clicks on the check-in date field to open the date picker calendar
  async clickCheckInField() {
    await this.page.click("[placeholder='Check in']");
    console.log('Clicked on Check in field');
  }

// Navigates forward in the hotel date calendar by clicking next month arrow (number of months to advance has 3 months as default)
async clickCalendarNextArrow(times = 3) {
  const nextArrow = this.page.locator(
    'button.el-picker-panel__icon-btn.arrow-right[aria-label="Next Month"]:visible'
  );

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
  const picker = this.page.locator('.el-picker-panel:visible').first();

  // Scope to the first month table inside the visible picker
  const monthTable = picker.locator('table.el-date-table').first();

  const days = monthTable.locator(
    'td.available .el-date-table-cell__text'
  );

  await days.first().waitFor({ state: 'visible' });
  await days.first().click();

  console.log('Selected default check-in date (first available)');
}

// Selects the second available date as the check-out date
// Ensures one night stay duration for the hotel booking
async selectDefaultCheckOutDate() {
  const picker = this.page.locator('.el-picker-panel:visible').first();
  const monthTable = picker.locator('table.el-date-table').first();

  // Re-query after check-in (DOM might have changed)
  const days = monthTable.locator(
    'td.available .el-date-table-cell__text'
  );

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
