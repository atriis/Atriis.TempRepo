// Centralized selectors for easy maintenance
const SELECTORS = {
  carTab: '#tab-car',
  carPickupInput: "[placeholder='Airport, City or Address']",
  pickupDateInput: "[placeholder='Pick-up Date']",
  dropoffDateInput: "[placeholder='Drop-off Date']",
  pickupNextArrow: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  dropoffNextArrow: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  dropoffDifferentLocationCheckbox: ".car-form .el-checkbox__inner",
  rentalAgencyDropdownField: ".car-search-inputs .el-select__selection",
  rentalAgencyDropdownOption: (agencyName) => `li.el-select-dropdown__item span:text("${agencyName}")`
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

  // Clicks 'Drop-off at a different location' checkbox
  async clickDropoffDifferentLocationCheckbox() {
    console.log('Clicking drop-off at a different location checkbox...');
    await this.page.click(SELECTORS.dropoffDifferentLocationCheckbox);
    console.log('Drop-off at a different location checkbox clicked successfully');
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

  // Type Rental Agency name in the dropdown field
  async typeRentalAgencyName(agencyName) {
  await this.page.waitForTimeout(500); // Ensure field is ready
  console.log(`Typing rental agency name: ${agencyName}`);
  await this.page.type(SELECTORS.rentalAgencyDropdownField, agencyName);
  console.log(`Rental agency name "${agencyName}" typed successfully`);
}
  
  // Clicks Rental Agency dropdown option by text
  async clickRentalAgencyDropdownOption(agencyName) {
  console.log(`Selecting rental agency: ${agencyName}`);
  await this.page.locator(SELECTORS.rentalAgencyDropdownOption(agencyName)).click();
  console.log(`Rental agency "${agencyName}" selected successfully`);
}
}

module.exports = CarSearchPage;