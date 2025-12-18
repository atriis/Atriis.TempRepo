const SearchPage = require('./SearchPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ONE_WAY_BUTTON:
    ".amtrak-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON:
    ".amtrak-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label"
};

/**
 * AmtrakSearchPage
 *
 * Low-level UI interactions specific to Amtrak rail search.
 * This class is intentionally quiet:
 * - no logging
 * - no business decisions
 */
class AmtrakSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Switches the Rail search to Amtrak.
   *
   * Flow:
   * - Opens the Rail tab
   * - Selects "Amtrak" from the provider dropdown
   */
  async selectAmtrakSearch() {
    const searchPage = new SearchPage(this.page);

    await searchPage.clickRailTab();
    await this.page.getByRole('option', { name: 'Amtrak' }).click();
  }

  /** Selects the "One way" trip option */
  async selectOneWayTrip() {
    await this.page.click(SELECTORS.ONE_WAY_BUTTON);
  }

  /** Selects the "Round trip" trip option */
  async selectRoundTrip() {
    await this.page.click(SELECTORS.ROUND_TRIP_BUTTON);
  }
}

module.exports = AmtrakSearchPage;