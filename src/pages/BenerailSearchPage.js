const { SELECTORS: SEARCH_SELECTORS } = require("@pages/SearchPage");

/**
 * Page Object for the Benerail (EU Rail) search form.
 * Contains only UI-level interactions specific to Benerail — shared search actions
 * (trip type, from/to fields, tab, submit) remain on SearchPage.
 */

const SELECTORS = {
  // Rail (eu-rail-search-inputs.vue) date fields, scoped to the Rail form's own root class.
  // The unscoped DEPARTURE_PLACEHOLDER/RETURN_PLACEHOLDER selectors used by SearchPage's own
  // clickDepartureDateField()/clickReturnDateField() can resolve to another mounted-but-hidden
  // product's hidden field (e.g. Flight's "Depart Date") depending on DOM order, so Benerail
  // flows must click these scoped fields instead.
  RAIL_DEPARTURE_DATE_INPUT: ".eu-rail-search-inputs [placeholder='Departure']",
  RAIL_RETURN_DATE_INPUT: ".eu-rail-search-inputs [placeholder='Return']",
  // NumberOfStops app-select (eu-rail-search-inputs.vue's "airline_stops"-icon field, values
  // "Direct Only"/"Max 1 Change"/"Max 2 Change"/"Direct and Indirect" — models/consts.ts). No
  // `name` prop is passed to this app-select instance, so it can't be targeted by name like
  // SearchPage's TRAVELER_TYPE_SELECT — it's the first (and only) app-select in .stops-cards-container.
  NUMBER_OF_STOPS_SELECT: ".eu-rail-search-inputs .stops-cards-container .app-select .el-select",

  // Redesigned time-picker (app-timepicker, shared with Cars — see CarSearchPage's own copy of
  // this trigger/option set). The `.rail-time-picker` class on eu-rail-search-inputs.vue's
  // <app-timepicker> lands on its root section, so this uniquely scopes to the rail departure
  // time field without needing a placeholder (one-way search only renders a single journey row).
  RAIL_TIME_INPUT: ".rail-time-picker input.app-timepicker-input",
  // app-timepicker teleports its el-dropdown to <body> with this popper class.
  TIME_SELECTOR_POPPER: ".time-selector-popper:visible",
  // Hours/minutes el-selects inside the time popper (time-selection-box.vue) — present in both
  // 24h and 12h display modes; the AM/PM toggle only renders in 12h mode.
  TIME_HOURS_TRIGGER: ".section-time-select .app-column:nth-child(1) .el-select__wrapper",
  TIME_MINUTES_TRIGGER: ".section-time-select .app-column:nth-child(2) .el-select__wrapper",
  // Element-Plus teleports every select dropdown to <body>; :visible filters to the one actually open.
  VISIBLE_TIME_OPTION: ".el-select-dropdown__item:visible",
  // AM/PM toggle (time-selection-box.vue `.section-buttons .section-ampm p.time-part`) — only
  // rendered when the picker is in 12h mode.
  TIME_AMPM_BUTTON: ".section-ampm .time-part",

  // "Via" row (eu-rail-search-inputs.vue) — checkbox reveals the via-station autocomplete once checked.
  VIA_CHECKBOX: ".eu-rail-search-inputs .via-row .el-checkbox__inner",
  VIA_STATION_INPUT: ".eu-rail-search-inputs .via-autocomplete input",
};

class BenerailSearchPage {
  constructor(page) {
    this.page = page;
  }

  getDatePickerPanel() {
    return this.page.locator(SEARCH_SELECTORS.DATE_PICKER_PANEL);
  }

  /**
   * Opens the Benerail (EU Rail) departure date calendar.
   *
   * Scoped to `.eu-rail-search-inputs` — see SELECTORS.RAIL_DEPARTURE_DATE_INPUT for why the
   * unscoped field can't be used here.
   */
  async clickRailDepartureDateField() {
    const field = this.page.locator(SELECTORS.RAIL_DEPARTURE_DATE_INPUT).first();
    await field.waitFor({ state: "visible", timeout: 10000 });
    await field.click();
    await this.getDatePickerPanel().first().waitFor({ state: "visible" });
  }

  /**
   * Opens the Benerail (EU Rail) return date calendar. See clickRailDepartureDateField for why
   * this must be scoped to `.eu-rail-search-inputs` rather than the unscoped RETURN_PLACEHOLDER.
   */
  async clickRailReturnDateField() {
    const field = this.page.locator(SELECTORS.RAIL_RETURN_DATE_INPUT).first();
    await field.waitFor({ state: "visible", timeout: 10000 });
    await field.click();
    await this.getDatePickerPanel().first().waitFor({ state: "visible" });
  }

  /**
   * Selects a "Number of Stops" option (e.g. "Direct Only") on the Benerail search form.
   * Opens the app-select and clicks the option matching the label exactly — option labels here
   * are fixed enum keys ("Direct Only", "Max 1 Change", "Max 2 Change", "Direct and Indirect"),
   * not free text, so an exact match is safe (unlike SearchPage.selectGuestPassengerType's
   * partial match against age-range-suffixed labels).
   * @param {string} label - Exact option label, e.g. "Direct Only"
   */
  async selectNumberOfStops(label) {
    try {
      const select = this.page.locator(SELECTORS.NUMBER_OF_STOPS_SELECT).first();
      await select.waitFor({ state: "visible", timeout: 10000 });
      await select.click({ timeout: 10000 });

      const option = this.page
        .locator(SEARCH_SELECTORS.TRAVELER_TYPE_OPTION)
        .filter({ hasText: label })
        .first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[BenerailSearchPage.selectNumberOfStops] Could not select "${label}" in the Number of Stops ` +
        `field (select: ${SELECTORS.NUMBER_OF_STOPS_SELECT}). The Benerail search form may not be open ` +
        `or the option is unavailable. Original: ${err.message}`
      );
    }
  }

  // ===== DEPARTURE TIME (redesigned app-timepicker) =====

  /**
   * Opens the departure time-picker's popper and returns the visible popper locator. A just-closed
   * popper can still be transitioning out when a new one opens, so target the LAST visible popper
   * (see CarSearchPage._openTimePopper, the same app-timepicker component). Retries the open once
   * in case the click's popper closes mid-transition.
   * @param {string} triggerSelector - selector for a control expected inside the open popper
   * @returns {Promise<import('playwright').Locator>}
   */
  async _openDepartureTimePopper(triggerSelector) {
    const input = this.page.locator(SELECTORS.RAIL_TIME_INPUT).first();
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
   * Sets the Benerail departure time-picker to an explicit hour:minute by selecting from the two
   * el-select dropdowns inside the time popper. The time input is readonly, so it can only be set
   * through the popper.
   *
   * Detects 12h/AM-PM mode by whether the picker's AM/PM toggle renders at all (rail's
   * `:isAmPm="!isUserUnitsMetric"` — never for a metric user). When present, the meridiem is set
   * before the hours dropdown is opened, then the 12h-labeled hour ("01"-"12") is clicked instead
   * of the 24h one. See CarSearchPage.setTimeFieldTo, the same underlying component, for why.
   *
   * @param {string} hour - hour option text, zero-padded 24h (e.g. "04", "16")
   * @param {string} minute - minute option text, zero-padded (e.g. "00", "45")
   * @throws {Error} If the popper or its hours/minutes el-select is not available, or the value
   *   does not commit
   */
  async setDepartureTimeTo(hour, minute) {
    const hourNum = parseInt(hour, 10);
    const meridiem = hourNum >= 12 ? "PM" : "AM";
    const hour12 = String(hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum).padStart(2, "0");

    try {
      const input = this.page.locator(SELECTORS.RAIL_TIME_INPUT).first();

      // --- Hour ---
      let popper = await this._openDepartureTimePopper(SELECTORS.TIME_HOURS_TRIGGER);

      const isAmPmMode = (await popper.locator(SELECTORS.TIME_AMPM_BUTTON).count()) > 0;
      let alreadyCommitted = false;
      if (isAmPmMode) {
        const meridiemButton = popper
          .locator(SELECTORS.TIME_AMPM_BUTTON, { hasText: new RegExp(`^\\s*${meridiem}\\s*$`) })
          .first();
        const isAlreadyActive = ((await meridiemButton.getAttribute("class")) || "").includes("active");
        if (!isAlreadyActive) {
          await meridiemButton.click({ timeout: 5000 });
          await this.page.waitForTimeout(300);

          const valueAfterMeridiem = (await input.inputValue()).trim();
          alreadyCommitted =
            valueAfterMeridiem.includes(hour12) &&
            valueAfterMeridiem.includes(minute) &&
            new RegExp(meridiem, "i").test(valueAfterMeridiem);

          if (!alreadyCommitted) {
            popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();
            const stillOpenAfterMeridiem = await popper
              .locator(SELECTORS.TIME_HOURS_TRIGGER)
              .isVisible()
              .catch(() => false);
            if (!stillOpenAfterMeridiem) {
              popper = await this._openDepartureTimePopper(SELECTORS.TIME_HOURS_TRIGGER);
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
          popper = await this._openDepartureTimePopper(SELECTORS.TIME_MINUTES_TRIGGER);
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
      const matches12h = value.includes(hour12) && new RegExp(meridiem, "i").test(value);
      if (!value || (!matches24h && !matches12h)) {
        throw new Error(`the departure time input reads "${value}" after selecting ${hour}:${minute}`);
      }
    } catch (err) {
      throw new Error(
        `[BenerailSearchPage.setDepartureTimeTo] Could not set the departure time to ${hour}:${minute}. ` +
        `The time picker popper (class: time-selector-popper) or its hours/minutes el-select was not ` +
        `available. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the committed value of the Benerail departure time input.
   * @returns {Promise<string>}
   */
  async getDepartureTimeValue() {
    return (await this.page.locator(SELECTORS.RAIL_TIME_INPUT).first().inputValue()).trim();
  }

  // ===== VIA STATION =====

  /**
   * Checks the "Via" checkbox on the Benerail search form, revealing the via-station autocomplete.
   * A no-op if the via-station input is already visible (checkbox already checked).
   */
  async enableViaStation() {
    const viaInput = this.page.locator(SELECTORS.VIA_STATION_INPUT).first();
    if (await viaInput.isVisible().catch(() => false)) {
      return;
    }

    try {
      await this.page.locator(SELECTORS.VIA_CHECKBOX).first().click({ timeout: 5000 });
      await viaInput.waitFor({ state: "visible", timeout: 5000 });
    } catch (err) {
      throw new Error(
        `[BenerailSearchPage.enableViaStation] Could not check the "Via" checkbox (selector: ` +
        `${SELECTORS.VIA_CHECKBOX}) or the via-station field did not appear. Original: ${err.message}`
      );
    }
  }
}

module.exports = {
  BenerailSearchPage,
  SELECTORS,
};
