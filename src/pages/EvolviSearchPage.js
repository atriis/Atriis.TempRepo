const { SELECTORS: SEARCH_SELECTORS } = require('./SearchPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ONE_WAY_BUTTON: ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  RETURN_BUTTON: ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  SPLIT_TICKET_CHECKBOX: "label[data-track='evolvi-search-split-ticket'] .el-checkbox__inner"
};

class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Selects Evolvi search option from the rail dropdown
   * Clicks rail tab first, then selects 'UK Rail' option from the dropdown
   */
  async selectEvolviSearch() {
    console.log('Selecting Evolvi search...');
    await this.page.click(SEARCH_SELECTORS.GENERAL_RAIL_TAB);
    await this.page.waitForTimeout(1000); // Ensure dropdown is displayed
    await this.page.getByRole('option', { name: 'UK Rail' }).click();
    console.log('Evolvi search selected successfully');
  }

  /**
   * Selects the "One way" trip option for rail booking
   */
  async selectOneWayTrip() {
    console.log('Selecting one-way trip...');
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
    console.log('One-way trip selected successfully');
  }

  /**
   * Selects the "Round trip" trip option for rail booking
   */
  async selectRoundTrip() {
    console.log('Selecting round trip...');
    await this.page.click(SELECTORS.RETURN_BUTTON);
    console.log('Round trip selected successfully');
  }

  /**
   * Toggles the split ticket checkbox
   */
  async toggleSplitTicketCheckbox() {
    console.log('Toggling split ticket checkbox...');
    await this.page.click(SELECTORS.SPLIT_TICKET_CHECKBOX);
    console.log('Split ticket checkbox toggled successfully');
  }
}

module.exports = EvolviSearchPage;
module.exports.SELECTORS = SELECTORS;