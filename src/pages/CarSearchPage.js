// Centralized selectors for easy maintenance
const SELECTORS = {
  carTab: '#tab-car',
  carPickupInput: "[placeholder='Airport, City or Address']",
  pickupDateInput: "[placeholder='Pick-up Date']",
  dropoffDateInput: "[placeholder='Drop-off Date']",
  pickupNextArrow: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  dropoffNextArrow: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
};

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the car tab to switch to car booking mode
  async clickCarTab() {
    console.log('Clicking car tab...');
    await this.page.click(SELECTORS.carTab);
    console.log('Car tab clicked successfully');
  }

  // Types the pickup location in the car search form
  async typeCarPickupPlace(place) {
    console.log(`Typing car pickup location: ${place}`);
    await this.page.type(SELECTORS.carPickupInput, place);
    console.log('Car pickup location typed successfully');
  }

  // Tabs out of the car pickup location autocomplete field to dismiss suggestions
  // Ensures proper focus handling and allows autocomplete dropdown to close
  async tabOutFromCarAutocomplete() {
    console.log('Tabbing out of car autocomplete field...');
    await this.page.focus(SELECTORS.carPickupInput);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(1000);
    console.log('Tabbed out of car autocomplete field successfully');
  }

  // Clicks on the pickup date field to open the date picker calendar
  async clickPickupDateField() {
    console.log('Clicking pickup date field...');
    await this.page.click(SELECTORS.pickupDateInput);
    console.log('Pickup date field clicked successfully');
  }

  // Navigates forward in the second (dropoff) calendar by clicking next month arrow
  // Targets the second calendar specifically when both pickup and dropoff calendars are visible
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    console.log(`Clicking second calendar next arrow ${times} times...`);
    const secondNextArrow = this.page.locator(SELECTORS.dropoffNextArrow).nth(1);
    await secondNextArrow.waitFor({ state: 'visible' });
    for (let i = 0; i < times; i++) {
      await secondNextArrow.click();
      await this.page.waitForTimeout(300);
    }
    console.log('Clicked second calendar next arrow', times, 'times');
  }

  // Clicks on the dropoff date field to open the date picker calendar
  async clickDropoffDateField() {
    console.log('Clicking dropoff date field...');
    await this.page.click(SELECTORS.dropoffDateInput);
    console.log('Dropoff date field clicked successfully');
  }
}

module.exports = CarSearchPage;