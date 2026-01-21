const { SELECTORS: SEARCH_SELECTORS } = require('@pages/SearchPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ONE_WAY_BUTTON:
    ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  RETURN_BUTTON:
    ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  SPLIT_TICKET_CHECKBOX:
    "label[data-track='evolvi-search-split-ticket'] .el-checkbox__inner"
};

/**
 * EvolviSearchPage
 *
 * Low-level UI interactions for UK Rail (Evolvi) search.
 * No logging, no business logic.
 */
class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches the Rail provider to UK Rail (Evolvi) */
  async selectEvolviSearch() {
    await this.page.click(SEARCH_SELECTORS.GENERAL_RAIL_TAB);
    await this.page.waitForTimeout(1000); // keep existing stability wait
    await this.page.getByRole('option', { name: 'UK Rail' }).click();
  }

  /** Selects the "One way" trip option */
  async selectOneWayTrip() {
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
  }

  /** Selects the "Round trip" trip option */
  async selectRoundTrip() {
    await this.page.click(SELECTORS.RETURN_BUTTON);
  }

  /** Toggles the "Request Split Ticket" checkbox */
  async toggleSplitTicketCheckbox() {
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
  }
}

module.exports = EvolviSearchPage;
module.exports.SELECTORS = SELECTORS;