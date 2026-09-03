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

  // Per-traveler age category app-select on the search tab itself (eu-rail-search-inputs.vue's
  // travelers-ages-row, gated by v-if="!isEditingSearch"). The row renders the traveler-count
  // select first, then one age select per entry in PassengerRailInfos[] — with a single default
  // traveler and no guest added at search time, index 1 (0-based, via .nth()) is that traveler's
  // age select. No name/data-testid on the select itself, so it's targeted purely by container class.
  RAIL_TRAVELLER_AGE_SELECT: ".eu-rail-search-inputs .travelers-ages-row .field.app-column .el-select",

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

  // From-station field (eu-rail-autocomplete.vue), scoped like RAIL_DEPARTURE_DATE_INPUT above —
  // the unscoped FROM_PLACEHOLDER used by SearchPage.fillInFromField risks matching another
  // supplier's mounted-but-hidden "From... Station or Location" input (UK Rail/Amtrak render the
  // same placeholder text).
  RAIL_FROM_STATION_INPUT: ".eu-rail-search-inputs input[placeholder='From... Station or Location' i]",
  // To-station field — same scoping rationale as RAIL_FROM_STATION_INPUT.
  RAIL_TO_STATION_INPUT: ".eu-rail-search-inputs input[placeholder='To... Station or Location' i]",
  // Station autocomplete suggestion popper (eu-rail-autocomplete.vue's #autocomplete-result slot,
  // wrapping Element Plus's app-autocomplete with popperClass="boxed-autocomplete-popper"). Element
  // Plus mounts a NEW popper element per query rather than reusing one, so a just-closed popper
  // from the previous query can still match ":visible" while it's transitioning out — same
  // multi-popper hazard as TIME_SELECTOR_POPPER above — so callers must scope to `.last()`, not
  // aggregate text across every visible match, or a stale popper's rows leak into the new read.
  RAIL_STATION_AUTOCOMPLETE_POPPER: ".boxed-autocomplete-popper:visible",
  // The row text sits in a nested <p>, separate from the location_on icon's ligature text, so
  // reading this instead of the <li> itself avoids picking up the icon's text content.
  RAIL_STATION_AUTOCOMPLETE_SUGGESTION_TEXT: ".autocomplete-result-text p",
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

  /**
   * Selects an age category (e.g. "Youth (15-25)") for the default traveler on the Benerail
   * search form's travelers-ages-row. Targets index 1 of RAIL_TRAVELLER_AGE_SELECT — index 0 is
   * the traveler-count select, index 1 is the first (and, absent an added guest, only) passenger's
   * age select.
   * @param {string} ageLabel - Age category label, e.g. "Youth (15-25)"
   */
  async selectTravellerAge(ageLabel) {
    try {
      const select = this.page.locator(SELECTORS.RAIL_TRAVELLER_AGE_SELECT).nth(1);
      await select.waitFor({ state: "visible", timeout: 10000 });
      await select.click({ timeout: 10000 });

      const option = this.page
        .locator(SEARCH_SELECTORS.TRAVELER_TYPE_OPTION)
        .filter({ hasText: ageLabel })
        .first();
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[BenerailSearchPage.selectTravellerAge] Could not select "${ageLabel}" in the travellers ages ` +
        `dropdown (select: ${SELECTORS.RAIL_TRAVELLER_AGE_SELECT}). The Benerail search form may not be ` +
        `open or the age option is unavailable. Original: ${err.message}`
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

  // ===== STATION AUTOCOMPLETE (test 63183) =====

  /**
   * Types a query into the rail "From" station autocomplete field and returns the currently
   * visible suggestion-row texts — without selecting a suggestion. Used to validate what the
   * autocomplete surfaces for a given spelling variant (test 63183), not to commit a route field
   * (see SearchPage.fillInFromField for the committing variant used by real searches).
   *
   * Clears via real keyboard events (Ctrl+A + Backspace) rather than fill(''), matching
   * SearchPage.editAirportField — the Vue-bound autocomplete model does not reliably reset on a
   * programmatic fill.
   *
   * @param {string} query - Station name/spelling variant to type
   * @returns {Promise<string[]>} Trimmed suggestion row texts, in the order they render
   */
  async getStationAutocompleteSuggestionTexts(query) {
    if (typeof query !== "string" || !query.trim()) {
      throw new Error(`[BenerailSearchPage.getStationAutocompleteSuggestionTexts] "query" must be a non-empty string, got: ${JSON.stringify(query)}`);
    }

    const input = this.page.locator(SELECTORS.RAIL_FROM_STATION_INPUT).first();

    try {
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.focus();
      await input.press("Control+A");
      await input.press("Backspace");
      // Clearing existing text fires its own debounced search (usually empty results, closing the
      // popper) — settle that before typing the next query, or its late-arriving "no results" state
      // can overwrite the new query's just-rendered suggestions (matches SearchPage.editAirportField).
      await this.page.waitForTimeout(300);
      await input.pressSequentially(query, { delay: 50 });
      // Give the debounced search a moment to fire and the popper to start rendering before the
      // poll loop below starts reading it — checking immediately after the last keystroke can
      // catch the previous query's now-stale (or empty) popper before this one has loaded.
      await this.page.waitForTimeout(500);

      // Poll rather than a single fixed wait — how long the debounced search takes to render
      // varies with whether a suggestion popper was already open and populated from the previous
      // query (observed empirically: a fixed ~500ms wait flaked in exactly that case). A query with
      // genuinely no matches will legitimately exhaust this loop and return an empty array — that's
      // real data for the caller to assert on, not a page-object error.
      //
      // Element Plus mounts a new popper per query rather than reusing one, so `.last()` — not an
      // aggregate over every ":visible" popper — is what avoids reading stale rows off a previous
      // popper still transitioning out (see RAIL_STATION_AUTOCOMPLETE_POPPER).
      const deadline = Date.now() + 5000;
      let texts = [];
      do {
        const latestPopper = this.page.locator(SELECTORS.RAIL_STATION_AUTOCOMPLETE_POPPER).last();
        texts = (await latestPopper.locator(SELECTORS.RAIL_STATION_AUTOCOMPLETE_SUGGESTION_TEXT).allTextContents())
          .map((text) => text.trim())
          .filter(Boolean);
        if (texts.length > 0) break;
        await this.page.waitForTimeout(200);
      } while (Date.now() < deadline);

      return texts;
    } catch (err) {
      throw new Error(
        `[BenerailSearchPage.getStationAutocompleteSuggestionTexts] Could not read station ` +
        `autocomplete suggestions for "${query}" (input: ${SELECTORS.RAIL_FROM_STATION_INPUT}, ` +
        `suggestions: ${SELECTORS.RAIL_STATION_AUTOCOMPLETE_POPPER} ${SELECTORS.RAIL_STATION_AUTOCOMPLETE_SUGGESTION_TEXT}). Original: ${err.message}`
      );
    }
  }

  /**
   * Types into a rail From/To station field and commits the suggestion that best matches what was
   * typed — not just whichever renders first. A broader/parent entry can rank above the specific
   * one searched for (e.g. typing "Lyon Part Dieu" can list a bare "Lyon" city entry ahead of the
   * "Lyon Part Dieu" station itself), and blindly clicking the first suggestion silently commits the
   * wrong place — the field still "succeeds" (a value gets committed), but the search runs against a
   * different origin/destination than the caller asked for. Matching preference: exact text match,
   * then a suggestion that starts with the typed text, then one that merely contains it. Falls back
   * to the first suggestion when nothing matches at all — many existing routes in benerail.json are
   * typed as station codes (e.g. "FRPMO") that never appear in the suggestion's own display text, so
   * a text match is never expected to be found for them, and the app's own top-ranked suggestion for
   * that code remains correct there.
   *
   * Scoped to Benerail's own boxed-autocomplete-popper (RAIL_STATION_AUTOCOMPLETE_POPPER) — this
   * does not touch SearchPage's shared fillInFromField/fillInToField, which every other product
   * (flights, hotels, cars) also calls.
   *
   * @param {import('playwright').Locator} inputSelector - RAIL_FROM_STATION_INPUT or RAIL_TO_STATION_INPUT
   * @param {string} value - Station text to type
   * @param {string} caller - Calling method name, used in the thrown error message
   * @returns {Promise<void>}
   */
  async _fillRailStationFieldWithBestMatch(inputSelector, value, caller) {
    const input = this.page.locator(inputSelector).first();

    try {
      await input.waitFor({ state: "visible", timeout: 10000 });
      await input.click();
      // Real keyboard events, not fill() — the Vue-bound autocomplete model does not reliably fire
      // its debounced search on a programmatic fill (same reasoning as
      // getStationAutocompleteSuggestionTexts's own pressSequentially usage).
      await input.press("Control+A");
      await input.press("Backspace");
      await this.page.waitForTimeout(300);
      await input.pressSequentially(value, { delay: 50 });
    } catch (err) {
      throw new Error(`[${caller}] Could not focus/type "${value}" into the station field (${inputSelector}). Original: ${err.message}`);
    }

    const popper = this.page.locator(SELECTORS.RAIL_STATION_AUTOCOMPLETE_POPPER).last();
    try {
      await popper.waitFor({ state: "visible", timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[${caller}] Station autocomplete dropdown never rendered for "${value}" (selector ` +
        `${SELECTORS.RAIL_STATION_AUTOCOMPLETE_POPPER}) within 15000ms, so the field could not commit a ` +
        `suggestion. The field likely stays empty/invalid. Original: ${err.message}`
      );
    }

    const rows = popper.locator(SELECTORS.RAIL_STATION_AUTOCOMPLETE_SUGGESTION_TEXT);
    // Poll rather than a single read — the popper element can attach before its rows finish
    // rendering (same race documented on getStationAutocompleteSuggestionTexts).
    let rowCount = 0;
    const rowsDeadline = Date.now() + 5000;
    do {
      rowCount = await rows.count();
      if (rowCount > 0) break;
      await this.page.waitForTimeout(200);
    } while (Date.now() < rowsDeadline);
    if (rowCount === 0) {
      throw new Error(`[${caller}] Station autocomplete dropdown rendered but no suggestion rows were found for "${value}"`);
    }

    const normalizedSearch = String(value ?? "").trim().toLowerCase();
    let prefixMatchIndex = -1;
    let containsMatchIndex = -1;
    let chosenIndex = -1;

    for (let index = 0; index < rowCount; index += 1) {
      const rawText = (await rows.nth(index).textContent()) ?? "";
      const normalizedRow = rawText.replace(/\s+/g, " ").trim().toLowerCase();

      if (normalizedRow === normalizedSearch) {
        chosenIndex = index;
        break;
      }
      if (prefixMatchIndex === -1 && normalizedRow.startsWith(normalizedSearch)) {
        prefixMatchIndex = index;
      }
      if (containsMatchIndex === -1 && normalizedRow.includes(normalizedSearch)) {
        containsMatchIndex = index;
      }
    }

    if (chosenIndex === -1) {
      chosenIndex = prefixMatchIndex !== -1 ? prefixMatchIndex : (containsMatchIndex !== -1 ? containsMatchIndex : 0);
    }

    try {
      await rows.nth(chosenIndex).click({ timeout: 5000 });
    } catch (err) {
      throw new Error(`[${caller}] Could not click the matched station suggestion (row ${chosenIndex}) for "${value}". Original: ${err.message}`);
    }

    try {
      await this.page.waitForFunction(
        (el) => !!el && el.value.trim().length > 0,
        await input.elementHandle(),
        { timeout: 5000 },
      );
    } catch (err) {
      throw new Error(
        `[${caller}] The station field still reads empty after clicking a suggestion for "${value}". ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Fills the rail "From" station field and commits the best-matching suggestion.
   * @param {string} from
   */
  async fillFromStationWithBestMatch(from) {
    await this._fillRailStationFieldWithBestMatch(
      SELECTORS.RAIL_FROM_STATION_INPUT,
      from,
      "BenerailSearchPage.fillFromStationWithBestMatch",
    );
  }

  /**
   * Fills the rail "To" station field and commits the best-matching suggestion.
   * @param {string} to
   */
  async fillToStationWithBestMatch(to) {
    await this._fillRailStationFieldWithBestMatch(
      SELECTORS.RAIL_TO_STATION_INPUT,
      to,
      "BenerailSearchPage.fillToStationWithBestMatch",
    );
  }
}

module.exports = {
  BenerailSearchPage,
  SELECTORS,
};
