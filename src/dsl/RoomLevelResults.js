const RoomLevelResultsPage = require("@pages/RoomLevelResultsPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { CartPage } = require("@pages/CartPage");
const Results = require("./Results");

/**
 * RoomLevelResults DSL
 *
 * Business actions at the room selection level.
 */
const RoomLevelResults = {
  /**
   * Adds a refundable hotel room to the cart.
   * Returns the refundable label text for validation.
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

    // Handle optional conflict modal (uses DSL for consistency)
    await Results.clickProceedConflictQuoteModal(page);

    // Get refundable text for validation
    const labelText = await cartPage.getHotelRefundableText();
    return { added: true, labelText };
  },
};

module.exports = RoomLevelResults;
