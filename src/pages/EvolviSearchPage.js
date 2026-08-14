const { normalizeText } = require("@utils/text");

/**
 * Page Object for evolvi search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  SPLIT_TICKET_CHECKBOX:
    "label[data-track='evolvi-search-split-ticket'] .el-checkbox__inner",
  // evolvi-search-inputs.vue's trip-type radio group. UK Rail's three options are Return / One Way
  // / Open Return — there is no "Round Trip" here, and matching on the rendered label could not
  // separate "Return" from "Open Return" anyway (both are localized via $t('ukRail.*')), so this
  // goes through the radio's stable data-track attribute instead.
  RETURN_TRIP_TYPE_RADIO: "label[data-track='evolvi-search-return']",
  // Traveller-count select in evolvi-search-inputs.vue's `.extra-details-container`: the FIRST
  // .app-column there holds it, the second holds one rail-card select per traveller. Neither
  // app-select passes a `name`, so position inside that container is the only stable handle.
  // `:visible` keeps the other products' search forms — mounted but hidden while the Rail tab is
  // active — from being matched first by DOM order.
  TRAVELERS_COUNT_SELECT:
    ".uk-rail-search:visible .extra-details-container > .app-column:first-child .el-select",
  // Option rows of the open traveller-count select. app-select renders through el-select/el-option,
  // so each option is `<li class="el-select-dropdown__item"><span>3 Traveller</span></li>` inside the
  // shared `.app-select-popper`. Only one popper is open at a time, so `:visible` on the popper
  // isolates this one from the rail-card and time-type poppers that linger hidden in the DOM;
  // `:visible` on the item too because an app-select popper can hold hidden/responsive duplicate
  // options (see SearchPage.verifyOnlyGuestPassengerType) and the count of options is asserted on.
  TRAVELERS_COUNT_OPTION:
    ".app-select-popper:visible .el-select-dropdown__item:visible",
};

class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Toggles the "Request Split Ticket" checkbox */
  async toggleSplitTicketCheckbox() {
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
  }

  /**
   * Selects the "Return" trip type — UK Rail's name for a round trip. Clicked explicitly even
   * though evolvi-search-inputs.ts already defaults railInfo.tripType to 'return', so the search
   * does not silently depend on that default staying put.
   *
   * @param {number} [timeout=30000]
   */
  async selectReturnTripType(timeout = 30000) {
    const returnRadio = this.page.locator(SELECTORS.RETURN_TRIP_TYPE_RADIO);
    await returnRadio.waitFor({ state: "visible", timeout });
    await returnRadio.click();
  }

  /**
   * Opens the traveller-count select in the UK Rail search form and waits for its options to render.
   *
   * @param {number} [timeout=30000]
   */
  async openTravelersCountDropdown(timeout = 30000) {
    const select = this.page.locator(SELECTORS.TRAVELERS_COUNT_SELECT).first();
    await select.waitFor({ state: "visible", timeout });
    await select.click();
    await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Reads the label of every option the open traveller-count select currently offers
   * (e.g. ["3 Traveller", "4 Traveller", "5 Traveller"]).
   *
   * @returns {Promise<string[]>} Option labels in the order they are rendered
   */
  async getTravelersCountOptionLabels() {
    const labels = await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .allTextContents();
    return labels.map((label) => normalizeText(label)).filter(Boolean);
  }

  /**
   * Closes the traveller-count select without changing the selection, so a later step is not left
   * clicking through an open popper.
   *
   * @param {number} [timeout=10000]
   */
  async closeTravelersCountDropdown(timeout = 10000) {
    await this.page.keyboard.press("Escape");
    await this.page
      .locator(SELECTORS.TRAVELERS_COUNT_OPTION)
      .first()
      .waitFor({ state: "hidden", timeout })
      .catch(() => {});
  }
}

module.exports = {
  EvolviSearchPage,
  SELECTORS,
};
