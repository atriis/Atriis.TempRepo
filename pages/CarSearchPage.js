// Centralized selectors for easy maintenance
const SELECTORS = {
  carTab: '#tab-car',
  carPickupInput: "[placeholder='Airport, City or Address']",
  pickupDateInput: "[placeholder='Pick-up Date']",
  dropoffDateInput: "[placeholder='Drop-off Date']",
  pickupNextArrow: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  dropoffNextArrow: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  pickerPanel: ".el-picker-panel:visible",
  monthTable: "table.el-date-table",
  availableDayCell: "td.available .el-date-table-cell__text"
};

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the car tab to switch to car booking mode
  async clickCarTab() {
    await this.page.click(SELECTORS.carTab);
  }

  // Types the pickup location in the car search form
  async typeCarPickupPlace(place) {
    await this.page.type(SELECTORS.carPickupInput, place);
  }

  // Tabs out of the car pickup location autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromCarAutocomplete() {
    console.log('Tabbing out of car autocomplete field...');
    await this.page.focus(SELECTORS.carPickupInput);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
  }

  // Clicks on the pickup date field to open the date picker calendar
  async clickPickupDateField() {
    await this.page.click(SELECTORS.pickupDateInput);
  }

  // Navigates forward in the pickup date calendar by clicking next month arrow
  // Default: advances 3 months
  async clickPickupFirstCalendarNextMonthArrow(times = 3) {
    const nextArrow = this.page.locator(SELECTORS.pickupNextArrow);
    await nextArrow.waitFor({ state: 'visible' });
    for (let i = 0; i < times; i++) {
      await nextArrow.click();
      await this.page.waitForTimeout(300);
    }
    console.log('Clicked visible calendar next arrow', times, 'times');
  }

  // Navigates forward in the second (dropoff) calendar by clicking next month arrow
  // Targets the second calendar specifically when both pickup and dropoff calendars are visible
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    const secondNextArrow = this.page.locator(SELECTORS.dropoffNextArrow).nth(1);
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
    const picker = this.page.locator(SELECTORS.pickerPanel).first();
    const monthTable = picker.locator(SELECTORS.monthTable).first();
    const days = monthTable.locator(SELECTORS.availableDayCell);
    await days.first().waitFor({ state: 'visible' });
    await days.first().click();
    console.log('Selected default pickup date (first available)');
  }

  // Clicks on the dropoff date field to open the date picker calendar
  async clickDropoffDateField() {
    await this.page.click(SELECTORS.dropoffDateInput);
  }

  // Selects a dropoff date that is 5 days after the pickup date
  // Uses the 6th available day (index 5) to ensure proper rental duration
  async selectDefaultDropoffDate() {
    const picker = this.page.locator(SELECTORS.pickerPanel).first();
    const monthTable = picker.locator(SELECTORS.monthTable).first();
    const days = monthTable.locator(SELECTORS.availableDayCell);
    const targetIndex = 5;
    const count = await days.count();
    if (count <= targetIndex) {
      throw new Error(
        `Not enough available dates. Found only ${count} available day(s); need at least ${targetIndex + 1}.`
      );
    }
    await days.nth(targetIndex).waitFor({ state: 'visible' });
    await days.nth(targetIndex).click();
    console.log('Selected default drop-off date (pickup + 5 days / 6th available)');
  }
}

module.exports = CarSearchPage;