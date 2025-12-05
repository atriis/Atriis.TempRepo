// Centralized selectors for easy maintenance
const SELECTORS = {
  CAR_TAB: '#tab-car',
  PICKUP_DATE_INPUT: "[placeholder='Pick-up Date']",
  DROPOFF_DATE_INPUT: "[placeholder='Drop-off Date']",
  PICKUP_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DROPOFF_NEXT_ARROW: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  DROPOFF_DIFFERENT_LOCATION_CHECKBOX: ".car-form .el-checkbox__inner",
  RENTAL_AGENCY_DROPDOWN_FIELD: "//span[normalize-space()='Rental agency']/parent::div[contains(@class,'el-select__placeholder')]/preceding-sibling::div[contains(@class,'el-select__input-wrapper')]//input", //Had to use XPath due to complex structure
  RENTAL_AGENCY_DROPDOWN_OPTION: (agencyName) => `li.el-select-dropdown__item span:text("${agencyName}")`
};

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks on the car tab to switch to car booking mode
  async clickCarTab() {
    console.log('Clicking car tab...');
    await this.page.click(SELECTORS.CAR_TAB);
    console.log('Car tab clicked successfully');
  }

  // Clicks 'Drop-off at a different location' checkbox
  async clickDropoffDifferentLocationCheckbox() {
    console.log('Clicking drop-off at a different location checkbox...');
    await this.page.click(SELECTORS.DROPOFF_DIFFERENT_LOCATION_CHECKBOX);
    console.log('Drop-off at a different location checkbox clicked successfully');
  }

  // Clicks on the pickup date field to open the date picker calendar
  async clickPickupDateField() {
    console.log('Clicking pickup date field...');
    await this.page.click(SELECTORS.PICKUP_DATE_INPUT);
    console.log('Pickup date field clicked successfully');
  }

  // Navigates forward in the second (dropoff) calendar by clicking next month arrow
  // Targets the second calendar specifically when both pickup and dropoff calendars are visible
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    console.log(`Clicking second calendar next arrow ${times} times...`);
    const secondNextArrow = this.page.locator(SELECTORS.DROPOFF_NEXT_ARROW).nth(1);
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
    await this.page.click(SELECTORS.DROPOFF_DATE_INPUT);
    console.log('Dropoff date field clicked successfully');
  }

  // Type Rental Agency name in the dropdown field
  async typeRentalAgencyName(agencyName) {
  await this.page.waitForTimeout(500); // Ensure field is ready
  console.log(`Typing rental agency name: ${agencyName}`);
  await this.page.type(SELECTORS.RENTAL_AGENCY_DROPDOWN_FIELD, agencyName);
  console.log(`Rental agency name "${agencyName}" typed successfully`);
}
  
  // Clicks Rental Agency dropdown option by text
  async clickRentalAgencyDropdownOption(agencyName) {
  console.log(`Selecting rental agency: ${agencyName}`);
  await this.page.locator(SELECTORS.RENTAL_AGENCY_DROPDOWN_OPTION(agencyName)).click();
  console.log(`Rental agency "${agencyName}" selected successfully`);
}
}

module.exports = CarSearchPage;