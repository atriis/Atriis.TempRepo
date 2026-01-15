/**
 * Page Object for car search form.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  CAR_TAB: '#tab-car',
  DROPOFF_DATE_INPUT: "[placeholder='Drop-off Date']",
  PICKUP_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DROPOFF_NEXT_ARROW: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  DROPOFF_DIFFERENT_LOCATION_CHECKBOX: ".car-form .el-checkbox__inner",

  // XPath used due to complex dropdown structure
  RENTAL_AGENCY_DROPDOWN_FIELD:
    "//span[normalize-space()='Rental agency']/parent::div[contains(@class,'el-select__placeholder')]/preceding-sibling::div[contains(@class,'el-select__input-wrapper')]//input",

  RENTAL_AGENCY_DROPDOWN_OPTION:
    (agencyName) => `li.el-select-dropdown__item span:text("${agencyName}")`
};

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Car search */
  async clickCarTab() {
    await this.page.click(SELECTORS.CAR_TAB);
  }

  /** Enables "Drop-off at a different location" option */
  async clickDropoffDifferentLocationCheckbox() {
    await this.page.click(SELECTORS.DROPOFF_DIFFERENT_LOCATION_CHECKBOX);
  }

  /**
   * Moves the second (drop-off) calendar forward.
   * Used when pickup and drop-off calendars are shown together.
   */
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    const secondNextArrow =
      this.page.locator(SELECTORS.DROPOFF_NEXT_ARROW).nth(1);

    await secondNextArrow.waitFor({ state: 'visible' });

    for (let i = 0; i < times; i++) {
      await secondNextArrow.click();
      await this.page.waitForTimeout(300);
    }
  }

  /** Opens drop-off date calendar */
  async clickDropoffDateField() {
    await this.page.click(SELECTORS.DROPOFF_DATE_INPUT);
  }

  /** Types rental agency name in dropdown */
  async typeRentalAgencyName(agencyName) {
    await this.page.waitForTimeout(500);
    await this.page.type(
      SELECTORS.RENTAL_AGENCY_DROPDOWN_FIELD,
      agencyName
    );
  }

  /** Selects rental agency from dropdown */
  async clickRentalAgencyDropdownOption(agencyName) {
    await this.page
      .locator(SELECTORS.RENTAL_AGENCY_DROPDOWN_OPTION(agencyName))
      .click();
  }
}

module.exports = CarSearchPage;