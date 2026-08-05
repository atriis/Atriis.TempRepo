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
}

module.exports = {
  BenerailSearchPage,
  SELECTORS,
};
