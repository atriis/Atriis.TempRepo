// Centralized selectors for easy maintenance
const SELECTORS = {
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

  /** Toggles the "Request Split Ticket" checkbox */
  async toggleSplitTicketCheckbox() {
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
  }
}

module.exports = {
  EvolviSearchPage,
  SELECTORS
};