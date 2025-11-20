// dsl/RoomLevelResults.js
const RoomLevelResultsPage = require('../pages/RoomLevelResultsPage');
const Cart = require('./Cart');

const RoomLevelResults = {
  async addRefundableHotelRoomLevelToCart(page) {
    console.log('Adding refundable hotel from room level to cart...');
    const roomLevelResultsPage = new RoomLevelResultsPage(page);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await roomLevelResultsPage.waitForAddToTripText();
    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();
    await roomLevelResultsPage.clickAddToTripTextFirstRoom();

    // This now waits up to 8s for 'Proceed', and safely no-ops if no modal
    await Cart.clickProceedConflictQuoteModal(page);

    console.log('Refundable hotel added to cart successfully');
    return { added: true };
  },
};

module.exports = RoomLevelResults;
