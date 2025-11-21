class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the car tab to switch to car booking mode
  async clickCarTab() {
    await this.page.click("#tab-car");
  }

  // Types the pickup location in the car search form
  async typeCarPickupPlace(place) {
    await this.page.type("[placeholder='Airport, City or Address']", place);
  }

  // Tabs out of the car pickup location autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromCarAutocomplete() {
    console.log('Tabbing out of car autocomplete field...');

    // Ensure the field is focused before tabbing
    await this.page.focus("[placeholder='Airport, City or Address']");

    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
  }

  // Clicks on the pickup date field to open the date picker calendar
  async clickPickupDateField() {
    await this.page.click("[placeholder='Pick-up Date']");
  }

  // Navigates forward in the pickup date calendar by clicking next month arrow (number of months to advance has 3 months as default)
  async clickPickupFirstCalendarNextMonthArrow(times = 3) {
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

  // Navigates forward in the second (dropoff) calendar by clicking next month arrow (number of months to advance has 1 month as default)
  // Targets the second calendar specifically when both pickup and dropoff calendars are visible
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    const secondNextArrow = this.page
      .locator(
        'span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label="Next Month"]'
      )
      .nth(1); // 0 = first calendar, 1 = second calendar

    await secondNextArrow.waitFor({ state: 'visible' });

    for (let i = 0; i < times; i++) {
      await secondNextArrow.click();
      await this.page.waitForTimeout(300);
    }

    console.log('Clicked second calendar next arrow', times, 'times');
  }

  // Selects the first available date in the pickup calendar
  // Assumes the date picker is already open and visible
  async selectDefaultPickupDate() {
    // Assumes the picker is already open
    const picker = this.page.locator('.el-picker-panel:visible').first();

    // First month table
    const monthTable = picker.locator('table.el-date-table').first();

    const days = monthTable.locator('td.available .el-date-table-cell__text');

    await days.first().waitFor({ state: 'visible' });
    await days.first().click();

    console.log('Selected default pickup date (first available)');
  }

  // Clicks on the dropoff date field to open the date picker calendar
  async clickDropoffDateField() {
    await this.page.click("[placeholder='Drop-off Date']");
  }

  // Selects a dropoff date that is 5 days after the pickup date (uses the 6th available day (index 5) to ensure proper rental duration)
  async selectDefaultDropoffDate() {
    const picker = this.page.locator('.el-picker-panel:visible').first();
    const monthTable = picker.locator('table.el-date-table').first();

    // Same list of available days
    const days = monthTable.locator('td.available .el-date-table-cell__text');

    // We want: pickup (index 0) + 5 days -> index 5
    const targetIndex = 5; // 0-based → 6th available day

    const count = await days.count();
    if (count <= targetIndex) {
      throw new Error(
        `Not enough available dates. Found only ${count} available day(s) in visible calendar; need at least ${
          targetIndex + 1
        }.`
      );
    }

    await days.nth(targetIndex).waitFor({ state: 'visible' });
    await days.nth(targetIndex).click();

    console.log('Selected default drop-off date (pickup + 5 days / 6th available)');
  }
}

module.exports = CarSearchPage;
