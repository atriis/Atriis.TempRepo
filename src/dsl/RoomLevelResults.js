const RoomLevelResultsPage = require('../pages/RoomLevelResultsPage');
const Cart = require('./Cart');

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

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await roomLevelResultsPage.waitForAddToTripText();

    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();

    await roomLevelResultsPage.clickAddToTripTextFirstRoom();

    // Handle optional conflict modal
    await Cart.clickProceedConflictQuoteModal(page);

    return { added: true };
  },
};

module.exports = RoomLevelResults;