const SearchPage = require('./SearchPage');

// Centralized selectors for easy maintenance
const SELECTORS = {
  ONE_WAY_BUTTON:
    ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  ROUND_TRIP_BUTTON:
    ".eu-rail-search-inputs > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label"
};

/**
 * BenerailSearchPage
 *
 * Low-level UI interactions for EU Rail (Benerail) searches.
 * This class is intentionally quiet and mechanical.
 */
class BenerailSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Switches the Rail provider to EU Rail (Benerail).
   * Flow:
   * - Open Rail tab
   * - Select "EU Rail" from provider dropdown
   */
  async selectBenerailSearch() {
    const searchPage = new SearchPage(this.page);
    await searchPage.clickRailTab();
    await this.page.getByRole('option', { name: 'EU Rail' }).click();
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

module.exports = BenerailSearchPage;