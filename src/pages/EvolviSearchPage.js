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
}

module.exports = {
  EvolviSearchPage,
  SELECTORS,
};
