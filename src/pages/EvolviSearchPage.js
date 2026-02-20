/**
 * Page Object for evolvi search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  SPLIT_TICKET_CHECKBOX:
    "label[data-track='evolvi-search-split-ticket'] .el-checkbox__inner",
};

class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Toggles the "Request Split Ticket" checkbox */
  async toggleSplitTicketCheckbox() {
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
  }
}

module.exports = {
  EvolviSearchPage,
  SELECTORS,
};
