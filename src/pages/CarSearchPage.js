/**
 * Page Object for car search form.
 * Contains only UI-level interactions.
 */

const logger = require("@utils/logger").child("CarSearchPage");

const SELECTORS = {
  CAR_TAB: "#tab-car",
  DROPOFF_DATE_INPUT: "[placeholder='Drop-off Date']",
  PICKUP_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DROPOFF_NEXT_ARROW: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  DROPOFF_DIFFERENT_LOCATION_CHECKBOX: ".car-form .el-checkbox__inner",

  // XPath used due to complex dropdown structure
  RENTAL_AGENCY_DROPDOWN_FIELD:
    "//span[normalize-space()='Rental agency']/parent::div[contains(@class,'el-select__placeholder')]/preceding-sibling::div[contains(@class,'el-select__input-wrapper')]//input",

  RENTAL_AGENCY_DROPDOWN_OPTION:
    (agencyName) => `li.el-select-dropdown__item span:text("${agencyName}")`,
};

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Car search */
  async clickCarTab() {
    try {
      const carTab = this.page.locator(SELECTORS.CAR_TAB);
      await carTab.waitFor({ state: "visible", timeout: 3000 });
      await carTab.click();
    } catch (error) {
      logger.warn("Car tab not found or not clickable - may already be active", { error: error.message });
    }
  }

  /** Enables "Drop-off at a different location" option */
  async clickDropoffDifferentLocationCheckbox() {
    await this.page.click(SELECTORS.DROPOFF_DIFFERENT_LOCATION_CHECKBOX);
  }

  /**
   * Moves the second (drop-off) calendar forward.
   *
   * Used when pickup and drop-off calendars are shown together.
   * After each click, the method waits until the next-arrow is
   * visible again, ensuring the calendar finished updating
   * before continuing.
   *
   * @param {number} times - Number of months to advance (>= 1)
   * @throws {Error} If times is less than 1
   */
  async clickDropoffSecondCalendarNextMonthArrow(times = 1) {
    if (times < 1) {
      throw new Error(`times must be >= 1, got ${times}`);
    }
    const secondNextArrow = this.page
      .locator(SELECTORS.DROPOFF_NEXT_ARROW)
      .nth(1);

    // Ensure the arrow is initially visible
    await secondNextArrow.waitFor({ state: "visible" });

    for (let i = 0; i < times; i++) {
      await secondNextArrow.click();

      // Wait for the calendar to re-render and the arrow to be usable again
      await secondNextArrow.waitFor({ state: "visible" });
    }
  }

  /** Opens drop-off date calendar */
  async clickDropoffDateField() {
    await this.page.click(SELECTORS.DROPOFF_DATE_INPUT);
  }

  /**
   * Types the rental agency name into the dropdown field.
   *
   * Waits until the rental agency dropdown input is visible
   * to ensure the field is ready for interaction before typing.
   *
   * @param {string} agencyName - Rental agency name (required)
   * @throws {Error} If agencyName is not provided
   */
  async typeRentalAgencyName(agencyName) {
    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error('agencyName must be a non-empty string');
    }
    const rentalAgencyField = this.page.locator(
      SELECTORS.RENTAL_AGENCY_DROPDOWN_FIELD,
    );

    // Ensure the dropdown field is visible and ready
    await rentalAgencyField.waitFor({ state: "visible" });
    await rentalAgencyField.type(agencyName);
  }

  /**
   * Selects rental agency from dropdown.
   * @param {string} agencyName - Rental agency name (required)
   * @throws {Error} If agencyName is not provided
   */
  async clickRentalAgencyDropdownOption(agencyName) {
    if (!agencyName || typeof agencyName !== 'string') {
      throw new Error('agencyName must be a non-empty string');
    }
    await this.page
      .locator(SELECTORS.RENTAL_AGENCY_DROPDOWN_OPTION(agencyName))
      .click();
  }
}

module.exports = CarSearchPage;
