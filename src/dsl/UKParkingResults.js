const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingResultsPage = require("@pages/UKParkingResultsPage");

/**
 * UKParkingResults DSL
 *
 * Provides business-level methods for the UK Parking search results page.
 * All business logic for the UK Parking results/filter flow should be placed here.
 */
const UKParkingResults = {
  /**
   * Selects the first available filter option in the parking results filter sidebar.
   *
   * @param {Object} page - Playwright page instance
   * @throws {Error} If page is not provided
   */
  async selectFirstFilterOption(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const ukParkingResultsPage = getPageObject(page, UKParkingResultsPage);
    await ukParkingResultsPage.selectFirstFilterOption();
  },
};

module.exports = UKParkingResults;
