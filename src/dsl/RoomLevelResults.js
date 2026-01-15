const RoomLevelResultsPage = require('../pages/RoomLevelResultsPage');
const ResultsPage = require('../pages/ResultsPage');

/**
 * RoomLevelResults DSL
 *
 * Business actions at the room selection level.
 */
const RoomLevelResults = {
  /**
   * Adds a refundable hotel room to the cart.
   */
  async addRefundableHotelRoomLevelToCart(page) {
    const roomLevelResultsPage = new RoomLevelResultsPage(page);
    const resultsPage = new ResultsPage(page);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.scrollToFirstAddToTripButton();
    await resultsPage.waitForAddToTripText();

    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal
    await resultsPage.handleConflictQuoteModalIfVisible();

    return { added: true };
  },
};

module.exports = RoomLevelResults;