const logger = require("@utils/logger").child("CarSearchPage");

/**
 * Page Object for car search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  CAR_TAB: "#tab-car",
  DROPOFF_DATE_INPUT: "[placeholder='Drop-off Date']",
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  PICKUP_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DROPOFF_NEXT_ARROW: "span.el-date-picker__next-btn button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']",
  DATE_RANGE_HEADER_LABEL: ".el-date-range-picker__header div",
  DATE_PICKER_HEADER_LABEL: ".el-date-picker__header-label",
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

  getActiveDatePickerPanel() {
    return this.page.locator(SELECTORS.DATE_PICKER_PANEL).last();
  }

  async getDropoffSecondCalendarCurrentMonthLabel() {
    const panel = this.getActiveDatePickerPanel();
    await panel.waitFor({ state: "visible" });

    const rangeHeaders = panel.locator(SELECTORS.DATE_RANGE_HEADER_LABEL);
    const rangeHeaderCount = await rangeHeaders.count();

    if (rangeHeaderCount > 0) {
      const texts = (await rangeHeaders.allTextContents())
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (texts.length >= 2) {
        return texts[1];
      }

      if (texts.length === 1) {
        return texts[0];
      }
    }

    const singlePickerHeaders = panel.locator(SELECTORS.DATE_PICKER_HEADER_LABEL);

    if (await singlePickerHeaders.first().isVisible()) {
      const texts = (await singlePickerHeaders.allTextContents())
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (texts.length >= 2) {
        return texts[1];
      }

      if (texts.length === 1) {
        return texts[0];
      }
    }

    throw new Error("Could not read drop-off second calendar month label");
  }

  async waitForDropoffSecondCalendarMonthChange(previousLabel, timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const currentLabel = await this.getDropoffSecondCalendarCurrentMonthLabel();
      if (currentLabel !== previousLabel) {
        return currentLabel;
      }
      await this.page.waitForTimeout(100);
    }

    const currentLabel = await this.getDropoffSecondCalendarCurrentMonthLabel();
    throw new Error(
      `Drop-off second calendar month did not change. Before: "${previousLabel}", After: "${currentLabel}"`,
    );
  }

  /** Switches UI to Car search if needed */
  async clickCarTab() {
    try {
      const carTab = this.page.locator(SELECTORS.CAR_TAB);
      await carTab.waitFor({ state: "visible", timeout: 3000 });
      await carTab.click();
    } catch (error) {
      logger.warn("Car tab not found or not clickable - may already be active", { error: error.message });
    }
  }

  /**
   * Clicks "Drop-off at a different location" checkbox.
   * Enables the different drop-off location field in car search.
   */
  async clickDropoffDifferentLocationCheckbox() {
    await this.page.click(SELECTORS.DROPOFF_DIFFERENT_LOCATION_CHECKBOX);
  }

  /**
   * Opens drop-off date calendar.
   * This function is specific to Car search as it's the only product
   * that requires clicking to open the second calendar.
   */
  async clickDropoffDateField() {
    await this.page.click(SELECTORS.DROPOFF_DATE_INPUT);
  }

  /**
   * Moves the second (drop-off) calendar forward.
   * This function is specific to Car search as it's the only product
   * that requires clicking to interact with the second calendar.
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

    const maxRetriesPerMonthChange = 3;
    for (let i = 0; i < times; i++) {
      let monthAfter = null;
      let monthBeforeForSuccessLog = null;
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetriesPerMonthChange; attempt++) {
        const monthBefore = await this.getDropoffSecondCalendarCurrentMonthLabel();
        monthBeforeForSuccessLog = monthBefore;
        const secondNextArrow = this.getActiveDatePickerPanel()
          .locator(SELECTORS.DROPOFF_NEXT_ARROW)
          .first();

        await secondNextArrow.waitFor({ state: "visible" });

        try {
          await secondNextArrow.click({ timeout: 2000 });
        } catch {
          // Fallback for transient overlay/interception issues.
          await secondNextArrow.click({ force: true, timeout: 2000 });
        }

        await secondNextArrow.waitFor({ state: "visible" });

        try {
          monthAfter = await this.waitForDropoffSecondCalendarMonthChange(monthBefore);
          break;
        } catch (error) {
          lastError = error;
          if (attempt < maxRetriesPerMonthChange) {
            // Re-open calendar to recover from stale/stuck date picker state.
            await this.clickDropoffDateField();
            await this.getActiveDatePickerPanel().waitFor({ state: "visible" });
          }
        }
      }

      if (!monthAfter) {
        throw new Error(
          `Failed to move drop-off second calendar month after ${maxRetriesPerMonthChange} attempts. Last error: ${lastError?.message || "unknown error"}`,
        );
      }
    }
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
    if (!agencyName || typeof agencyName !== "string") {
      throw new Error("agencyName must be a non-empty string");
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
    if (!agencyName || typeof agencyName !== "string") {
      throw new Error("agencyName must be a non-empty string");
    }
    await this.page
      .locator(SELECTORS.RENTAL_AGENCY_DROPDOWN_OPTION(agencyName))
      .click();
  }
}

module.exports = CarSearchPage;
