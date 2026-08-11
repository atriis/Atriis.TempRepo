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
}

module.exports = {
  BenerailSearchPage,
  SELECTORS,
};
