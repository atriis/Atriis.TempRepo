// pages/HotelSearchPage.js
const { waitForText } = require('../utils/wait');

class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  async clickHotelTab() {
    await this.page.click("#tab-hotel > div");
    console.log('Clicked on Hotel tab');
  }

  async waitForBookAndStayAtYourHotelText() {
    await waitForText(
      this.page,
      "#pane-hotel > h4",
      "Book and stay at your hotel"
    );
    console.log('Book and stay at your hotel text is visible');
  }

  async typeHotelDestination(where) {
    console.log(`Typing hotel destination: ${where}`);
    
    // Wait for the hotel page to be fully loaded first
    await this.page.waitForTimeout(2000);
    
    await this.page.waitForSelector("[placeholder*='Where']", { timeout: 5000, state: 'visible' });
    await this.page.click("[placeholder*='Where']"); // Focus the field first
    await this.page.fill("[placeholder*='Where']", where);
    console.log(`Successfully typed destination`);

    };
    

async tabOutFromHotelAutocomplete() {
  console.log('Tabbing out of hotel autocomplete field...');

  // Ensure the field is focused before tabbing
  await this.page.focus("[placeholder='Where would you like to stay?']");

  await this.page.keyboard.press('Tab');
  await this.page.waitForTimeout(1000);
}

  async clickCheckInField() {
    await this.page.click("[placeholder='Check in']");
    console.log('Clicked on Check in field');
  }

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

async selectDefaultCheckInDate() {
  const monthTable = this.page.locator('table.el-date-table').first();

  const days = monthTable.locator(
    'td.available > div.el-date-table-cell > span.el-date-table-cell__text'
  );

  await days.first().click();
  console.log('Selected check-in date (day 1)');
}

async selectDefaultCheckOutDate() {
  const monthTable = this.page.locator('table.el-date-table').first();

  const days = monthTable.locator(
    'td.available > div.el-date-table-cell > span.el-date-table-cell__text'
  );

  await days.nth(1).click();
  console.log('Selected check-out date (day 2)');
}
}

module.exports = HotelSearchPage;
