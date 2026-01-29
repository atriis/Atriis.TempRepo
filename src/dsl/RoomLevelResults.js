const RoomLevelResultsPage = require('@pages/RoomLevelResultsPage');
const { ResultsPage } = require('@pages/ResultsPage');
const { CartPage } = require('@pages/CartPage');

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
    const cartPage = new CartPage(page);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.scrollToFirstAddToTripButton();
    await resultsPage.waitForAddToTripText();

    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal
    await resultsPage.handleConflictQuoteModalIfVisible();

    //Making sure hotel is refundable
    await cartPage.waitForHotelRefundableText();
  },
};

module.exports = RoomLevelResults;