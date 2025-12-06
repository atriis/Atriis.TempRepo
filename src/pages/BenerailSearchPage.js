
const SearchPage = require('./SearchPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ONE_WAY_BUTTON: ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON: ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label"
};

class BenerailSearchPage {
  constructor(page) {
    this.page = page;
  }

  // Selects Benerail search option from the rail dropdown
  // Clicks rail tab first, then selects 'EU Rail' option from the dropdown
  async selectBenerailSearch() {
    console.log('Selecting Benerail search...');
    const searchPage = new SearchPage(this.page);
    await searchPage.clickRailTab();
    await this.page.getByRole('option', { name: 'EU Rail' }).click();
    console.log('Benerail search selected successfully');
  }

  // Selects the "One way" trip option for rail booking
  async selectOneWayTrip() {
    console.log('Selecting one-way trip...');
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
    console.log('One-way trip selected successfully');
  }

  // Selects the "Round trip" trip option for rail booking
  async selectRoundTrip() {
    console.log('Selecting round trip...');
    await this.page.click(SELECTORS.ROUND_TRIP_BUTTON);
    console.log('Round trip selected successfully');
  }
}

module.exports = BenerailSearchPage;
