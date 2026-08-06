const logger = require("@utils/logger").child("CarSearchPage");

/**
 * Page Object for car search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  CAR_TAB: "#tab-car",
  PICKUP_DATE_INPUT: "[placeholder='Pick-up Date']",
  DROPOFF_DATE_INPUT: "[placeholder='Drop-off Date']",
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  PICKUP_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DROPOFF_NEXT_ARROW: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DATE_RANGE_HEADER_LABEL: ".el-date-range-picker__header div",
  DATE_PICKER_HEADER_LABEL: ".el-date-picker__header-label",
  DROPOFF_DIFFERENT_LOCATION_CHECKBOX: ".car-form .el-checkbox__inner",
  // Label text of the "Drop-off at a different location" checkbox (car.dropDifferentLoc i18n key).
  // Present only in the car search form, so it doubles as the form's distinguishing marker.
  DROPOFF_DIFFERENT_LOCATION_LABEL: ".car-form .el-checkbox__label",

  // Car search form rendered inside the trip edit-search drawer (car-search-inputs.vue).
  // `.car-search-inputs` is the component's root <section>; used as the "form displayed" anchor.
  CAR_SEARCH_FORM: ".car-search-inputs",
  // Pre-filled pick-up location input. car-autocomplete passes uniqueClass="pick-up" through to the
  // rendered <input> (input-class), so the input carries the `pick-up` class and holds the
  // destination's display name as its value.
  CAR_SEARCH_FORM_DESTINATION_INPUT: ".car-search-inputs .pick-up input",
  // Shared Element Plus autocomplete suggestion list (same class car-autocomplete's underlying
  // app-autocomplete renders as every other product's location autocomplete).
  AUTOCOMPLETE_LIST:
    ".el-scrollbar__view.el-autocomplete-suggestion__list li[id*='item-0']:visible",

  // XPath used due to complex dropdown structure
  RENTAL_AGENCY_DROPDOWN_FIELD:
    "//span[normalize-space()='Rental agency']/parent::div[contains(@class,'el-select__placeholder')]/preceding-sibling::div[contains(@class,'el-select__input-wrapper')]//input",

  RENTAL_AGENCY_DROPDOWN_OPTION:
    (agencyName) => `li.el-select-dropdown__item span:text("${agencyName}")`,

  // Pick-up/drop-off TIME fields (app-timepicker). Present in both the standalone car search
  // form and the cart's edit-search drawer (car-search-inputs.vue is shared by both).
  PICKUP_TIME_INPUT: "input.app-timepicker-input[placeholder='Pick-up Time']",
  DROPOFF_TIME_INPUT: "input.app-timepicker-input[placeholder='Drop-off Time']",
  // app-timepicker teleports its el-dropdown to <body> with this popper class.
  TIME_SELECTOR_POPPER: ".time-selector-popper:visible",
  // Hours/minutes el-selects inside the time popper (time-selection-box.vue) — present in
  // both 24h and 12h display modes; the AM/PM toggle only renders in 12h mode.
  TIME_HOURS_TRIGGER: ".section-time-select .app-column:nth-child(1) .el-select__wrapper",
  TIME_MINUTES_TRIGGER: ".section-time-select .app-column:nth-child(2) .el-select__wrapper",
  // Element-Plus teleports every select dropdown to <body>; :visible filters to the one
  // actually open.
  VISIBLE_TIME_OPTION: ".el-select-dropdown__item:visible",
  // AM/PM toggle (time-selection-box.vue `.section-buttons .section-ampm p.time-part`) — only
  // rendered when the picker is in 12h mode. Scoped under the open popper by the caller.
  TIME_AMPM_BUTTON: ".section-ampm .time-part",
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
   *
   * Only moves on to the drop-off field once the pick-up date field is confirmed filled.
   * Vue commits a calendar selection to the pick-up input asynchronously, so clicking straight
   * into drop-off without this guard could open it while pick-up was still empty/uncommitted -
   * that stale state then flows into later comparisons (e.g. ensureDropoffAfterPickup treating
   * two empty strings as "same date") and was the source of the intermittent date failures.
   * @throws {Error} If the pick-up date field never settles to a non-empty value first
   */
  async clickDropoffDateField() {
    await this.getPickupDateFieldValue();

    // The pick-up date INPUT value settling (above) is one reactive chain; the drop-off
    // calendar's disabled-day boundary is a separate one (car-search-inputs.ts's `startDay`
    // computed, fed into app-datepicker's `disabled-date` prop) that re-renders the day cells
    // on its own Vue tick slightly after the input commits. Opening/selecting in the drop-off
    // calendar before that second render settles can make selectDatesByNthAvailable count a
    // stale set of available days - a brief settle wait avoids racing it.
    await this.page.waitForTimeout(300);

    await this.page.click(SELECTORS.DROPOFF_DATE_INPUT);
  }

  /**
   * Reads the current pick-up date input value from the search form.
   * Waits for the value to settle to non-empty before reading - Vue reactivity commits a
   * calendar selection to the input asynchronously, so reading immediately after
   * selectDatesByNthAvailable can otherwise observe a stale/empty value.
   * @throws {Error} If the field never settles to a non-empty value within the timeout
   */
  async getPickupDateFieldValue() {
    const field = this.page.locator(SELECTORS.PICKUP_DATE_INPUT).first();
    await field.waitFor({ state: "visible", timeout: 10000 });

    try {
      await this.waitForPickupDateNonEmpty({ timeout: 10000 });
    } catch (error) {
      throw new Error(
        `[CarSearchPage.getPickupDateFieldValue] Pick-up date field never settled to a non-empty ` +
          `value - the pick-up date selection likely did not commit. Original: ${error.message}`,
      );
    }

    return (await field.inputValue()).trim();
  }

  /**
   * Reads the current drop-off date input value from the search form.
   * Same settling wait as getPickupDateFieldValue - see there for why an immediate read can
   * observe a stale/empty value.
   * @throws {Error} If the field never settles to a non-empty value within the timeout
   */
  async getDropoffDateFieldValue() {
    const field = this.page.locator(SELECTORS.DROPOFF_DATE_INPUT).first();
    await field.waitFor({ state: "visible", timeout: 10000 });

    try {
      await this.waitForDropoffDateNonEmpty({ timeout: 10000 });
    } catch (error) {
      throw new Error(
        `[CarSearchPage.getDropoffDateFieldValue] Drop-off date field never settled to a non-empty ` +
          `value - the drop-off date selection likely did not commit. Original: ${error.message}`,
      );
    }

    return (await field.inputValue()).trim();
  }

  /**
   * Waits until the pickup date input has a non-empty value.
   * Vue reactivity updates the input's value asynchronously after a calendar selection —
   * calling inputValue() immediately after selectDatesByNthAvailable can still read the
   * old/empty value. This method polls until the update has settled.
   *
   * NOTE: Prefer waitForPickupDateChanged(previousValue) when you already know the old
   * value — it guarantees the NEW date has settled, not just that some date is present.
   *
   * @param {Object} [options]
   * @param {number} [options.timeout=5000]
   */
  async waitForPickupDateNonEmpty({ timeout = 5000 } = {}) {
    const selector = SELECTORS.PICKUP_DATE_INPUT;
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.value && el.value.trim().length > 0;
      },
      selector,
      { timeout }
    );
  }

  /**
   * Waits until the dropoff date input has a non-empty value.
   * Same Vue reactivity settling issue as pickup — see waitForPickupDateNonEmpty.
   *
   * NOTE: Prefer waitForDropoffDateChanged(previousValue) when you already know the old
   * value — it guarantees the NEW date has settled, not just that some date is present.
   *
   * @param {Object} [options]
   * @param {number} [options.timeout=5000]
   */
  async waitForDropoffDateNonEmpty({ timeout = 5000 } = {}) {
    const selector = SELECTORS.DROPOFF_DATE_INPUT;
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && el.value && el.value.trim().length > 0;
      },
      selector,
      { timeout }
    );
  }

  /**
   * Waits until the pickup date input value has CHANGED from a known previous value.
   *
   * The date input fields are never empty (they hold the previous search date while the
   * calendar is open). waitForPickupDateNonEmpty therefore passes immediately with the
   * OLD value, and a subsequent getPickupDateFieldValue() may still return that stale
   * value if Vue hasn't flushed the DOM update yet. This method avoids that race by
   * polling until the value is both non-empty AND different from previousValue.
   *
   * If timeout elapses without a change (e.g., the same month was re-selected),
   * the caller should treat the current value as the "new" value and let the
   * same-date check decide.
   *
   * @param {string} previousValue - The date string that was in the input before editing
   * @param {Object} [options]
   * @param {number} [options.timeout=5000]
   */
  async waitForPickupDateChanged(previousValue, { timeout = 5000 } = {}) {
    const selector = SELECTORS.PICKUP_DATE_INPUT;
    await this.page.waitForFunction(
      ({ sel, prev }) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const current = el.value ? el.value.trim() : '';
        return current.length > 0 && current !== prev;
      },
      { sel: selector, prev: previousValue },
      { timeout }
    );
  }

  /**
   * Waits until the dropoff date input value has CHANGED from a known previous value.
   * See waitForPickupDateChanged for the full explanation.
   *
   * @param {string} previousValue - The date string that was in the input before editing
   * @param {Object} [options]
   * @param {number} [options.timeout=5000]
   */
  async waitForDropoffDateChanged(previousValue, { timeout = 5000 } = {}) {
    const selector = SELECTORS.DROPOFF_DATE_INPUT;
    await this.page.waitForFunction(
      ({ sel, prev }) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const current = el.value ? el.value.trim() : '';
        return current.length > 0 && current !== prev;
      },
      { sel: selector, prev: previousValue },
      { timeout }
    );
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

  // ===== CAR SEARCH FORM IN CROSS-SELL / EDIT-SEARCH DRAWER =====

  /**
   * Car search form section rendered inside the trip edit-search drawer.
   * @returns {import('@playwright/test').Locator}
   */
  getCarSearchForm() {
    return this.page.locator(SELECTORS.CAR_SEARCH_FORM).first();
  }

  /**
   * "Drop-off at a different location" checkbox label — the marker that the car search
   * form (rather than another product's form) is displayed.
   * @returns {import('@playwright/test').Locator}
   */
  getDropoffDifferentLocationLabel() {
    return this.page
      .locator(SELECTORS.DROPOFF_DIFFERENT_LOCATION_LABEL)
      .filter({ hasText: "Drop-off at a different location" })
      .first();
  }

  /**
   * Replaces the car search form's pre-filled pick-up location with a new value.
   * Uses real keyboard events (Ctrl+A + Backspace) rather than fill() — the input's value is
   * Vue-bound to the previous search's location object, so a programmatic fill() would be
   * overwritten by that binding on the next render. Mirrors SearchPage.editAirportField's
   * clear-then-type-then-select-suggestion technique, scoped to the car-specific input class.
   * @param {string} value - New pick-up location to search
   * @throws {Error} If value is missing or the input/suggestion never settle
   */
  async setCarSearchFormDestination(value) {
    if (!value || typeof value !== "string") {
      throw new Error(`[CarSearchPage.setCarSearchFormDestination] "value" must be a non-empty string, got: ${typeof value}`);
    }

    const input = this.page.locator(SELECTORS.CAR_SEARCH_FORM_DESTINATION_INPUT).first();

    try {
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.scrollIntoViewIfNeeded();
      await input.focus();
      await input.press("Control+A");
      await input.press("Backspace");
      await this.page.waitForTimeout(300);
      await input.pressSequentially(value, { delay: 100 });

      const firstSuggestion = this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).first();
      await firstSuggestion.waitFor({ state: "visible", timeout: 15000 });
      await firstSuggestion.click();

      await this.page.waitForFunction(
        ([selector, expectedValue]) => {
          const el = document.querySelector(selector);
          return !!el && typeof el.value === "string" && el.value.trim().length > 0
            && el.value.toUpperCase().includes(expectedValue.toUpperCase());
        },
        [SELECTORS.CAR_SEARCH_FORM_DESTINATION_INPUT, value],
        { timeout: 10000 },
      );
    } catch (err) {
      throw new Error(
        `[CarSearchPage.setCarSearchFormDestination] Failed to replace the car search destination with "${value}". ` +
        `The pick-up input (${SELECTORS.CAR_SEARCH_FORM_DESTINATION_INPUT}) or its autocomplete suggestion list ` +
        `may not have rendered. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the pre-filled destination (pick-up location) value from the car search form.
   * The value is populated asynchronously from the cross-sell suggestion (Vue reactivity),
   * so this polls until the input settles to a non-empty value before reading.
   * @param {number} [timeout=15000]
   * @returns {Promise<string>}
   */
  async getCarSearchFormDestinationValue(timeout = 15000) {
    const selector = SELECTORS.CAR_SEARCH_FORM_DESTINATION_INPUT;
    const input = this.page.locator(selector).first();
    await input.waitFor({ state: "visible", timeout });
    await this.page
      .waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return el && el.value && el.value.trim().length > 0;
        },
        selector,
        { timeout },
      )
      .catch(() => {});
    return (await input.inputValue()).trim();
  }

  // ===== PICK-UP / DROP-OFF TIME (app-timepicker) =====

  /**
   * Opens a time-picker's popper and returns the visible popper locator. Each timepicker
   * teleports its own .time-selector-popper to <body>, and a just-closed one can still be
   * transitioning out when the next one opens - so target the LAST visible popper. Retries the
   * open once in case the click's popper closes mid-transition.
   * @param {import('playwright').Locator} input - the readonly time input to click
   * @param {string} triggerSelector - selector for a control expected inside the open popper
   * @returns {Promise<import('playwright').Locator>}
   */
  async _openTimePopper(input, triggerSelector) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      await input.click({ timeout: 10000 });
      await this.page.waitForTimeout(400);
      const popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();
      try {
        await popper.waitFor({ state: "visible", timeout: 5000 });
        await popper.locator(triggerSelector).waitFor({ state: "visible", timeout: 5000 });
        return popper;
      } catch (openErr) {
        if (attempt === 2) throw openErr;
        await this.page.waitForTimeout(400);
      }
    }
  }

  /**
   * Sets a pick-up/drop-off time-picker to an explicit hour:minute by selecting from the two
   * el-select dropdowns inside the time popper. The time input is readonly, so it can only be
   * set through the popper.
   *
   * Detects 12h/AM-PM mode (time-selection-box.vue `isAmPm`) by whether its AM/PM toggle renders
   * at all - it never does for a 24h picker. When present, the meridiem is set BEFORE the hours
   * dropdown is ever opened (the hour option list depends on it, and opening/closing that dropdown
   * around a later toggle click proved unreliable), then the 12h-labeled hour ("01"-"12") is
   * clicked instead of the 24h one. This is purely additive: a 24h picker never has an AM/PM
   * toggle, so existing 24h callers take the exact same path as before.
   *
   * For metric (24h) users the picker auto-closes once the minute is selected; a mouse click in
   * a neutral top-left corner is used as a fallback commit if the popper is still open after the
   * minute pick (covers 12h/AM-PM users, where no in-form neutral blur target exists).
   *
   * @param {'pickup'|'dropoff'} field - which time field to set
   * @param {string} hour - hour option text, zero-padded 24h (e.g. "08", "15", "22")
   * @param {string} minute - minute option text, zero-padded (e.g. "00", "15", "30", "45")
   * @throws {Error} If the popper or its hours/minutes el-select is not available, or the value
   *   does not commit
   */
  async setTimeFieldTo(field, hour, minute) {
    const inputSelector = field === "pickup" ? SELECTORS.PICKUP_TIME_INPUT : SELECTORS.DROPOFF_TIME_INPUT;

    const hourNum = parseInt(hour, 10);
    const meridiem = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = String(hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum).padStart(2, '0');

    try {
      const input = this.page.locator(inputSelector).first();

      // --- Hour ---
      let popper = await this._openTimePopper(input, SELECTORS.TIME_HOURS_TRIGGER);

      const isAmPmMode = (await popper.locator(SELECTORS.TIME_AMPM_BUTTON).count()) > 0;
      let alreadyCommitted = false;
      if (isAmPmMode) {
        const meridiemButton = popper
          .locator(SELECTORS.TIME_AMPM_BUTTON, { hasText: new RegExp(`^\\s*${meridiem}\\s*$`) })
          .first();
        const isAlreadyActive = ((await meridiemButton.getAttribute('class')) || '').includes('active');
        if (!isAlreadyActive) {
          await meridiemButton.click({ timeout: 5000 });
          await this.page.waitForTimeout(300);

          // Toggling AM/PM re-applies the currently-selected hour/minute under the new meridiem -
          // if those already match the target (e.g. it only differed from the form's own
          // pre-filled time by meridiem), the value is already committed and the popper is often
          // already closed, so selecting the hour/minute again would be both unnecessary and,
          // since there is nothing left open to select from, unreliable.
          const valueAfterMeridiem = (await input.inputValue()).trim();
          alreadyCommitted =
            valueAfterMeridiem.includes(hour12) &&
            valueAfterMeridiem.includes(minute) &&
            new RegExp(meridiem, 'i').test(valueAfterMeridiem);

          if (!alreadyCommitted) {
            // Toggling AM/PM can close the popper entirely; reopen it if so.
            popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();
            const stillOpenAfterMeridiem = await popper
              .locator(SELECTORS.TIME_HOURS_TRIGGER)
              .isVisible()
              .catch(() => false);
            if (!stillOpenAfterMeridiem) {
              popper = await this._openTimePopper(input, SELECTORS.TIME_HOURS_TRIGGER);
            }
          }
        }
      }

      if (!alreadyCommitted) {
        await popper.locator(SELECTORS.TIME_HOURS_TRIGGER).click({ timeout: 5000 });
        const targetHourText = isAmPmMode ? hour12 : hour;
        await this.page
          .locator(SELECTORS.VISIBLE_TIME_OPTION, { hasText: new RegExp(`^\\s*${targetHourText}\\s*$`) })
          .first()
          .click({ timeout: 5000 });
        await this.page.waitForTimeout(400);

        // --- Minute --- (popper may have auto-closed after the hour pick; reopen if needed)
        popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();
        const stillOpen = await popper
          .locator(SELECTORS.TIME_MINUTES_TRIGGER)
          .isVisible()
          .catch(() => false);
        if (!stillOpen) {
          popper = await this._openTimePopper(input, SELECTORS.TIME_MINUTES_TRIGGER);
        }
        await popper.locator(SELECTORS.TIME_MINUTES_TRIGGER).click({ timeout: 5000 });
        await this.page
          .locator(SELECTORS.VISIBLE_TIME_OPTION, { hasText: new RegExp(`^\\s*${minute}\\s*$`) })
          .first()
          .click({ timeout: 5000 });
        await this.page.waitForTimeout(300);

        // --- Commit fallback --- metric (24h) users auto-close on minute pick; if the popper is
        // still open (12h/AM-PM users), click a neutral corner to blur and commit.
        const poppersStillVisible = await this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).count();
        if (poppersStillVisible > 0) {
          await this.page.mouse.click(2, 2);
          await this.page.waitForTimeout(300);
        }
      }

      const value = (await input.inputValue()).trim();
      const matches24h = value.includes(hour);
      const matches12h = value.includes(hour12) && new RegExp(meridiem, 'i').test(value);
      if (!value || (!matches24h && !matches12h)) {
        throw new Error(`the ${field} time input reads "${value}" after selecting ${hour}:${minute}`);
      }
    } catch (err) {
      throw new Error(
        `[CarSearchPage.setTimeFieldTo] Could not set the ${field} time to ${hour}:${minute}. ` +
        `The time picker popper (class: time-selector-popper) or its hours/minutes el-select was ` +
        `not available. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the committed value of the pick-up or drop-off time input.
   * @param {'pickup'|'dropoff'} field
   * @returns {Promise<string>}
   */
  async getTimeFieldValue(field) {
    const inputSelector = field === "pickup" ? SELECTORS.PICKUP_TIME_INPUT : SELECTORS.DROPOFF_TIME_INPUT;
    return (await this.page.locator(inputSelector).first().inputValue()).trim();
  }
}

module.exports = CarSearchPage;
