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

    // Making sure hotel is refundable
    const { expect } = require('@playwright/test');
    const labelText = await cartPage.getHotelRefundableText();
    expect(labelText).toMatch(/Refundable/i);
    expect(labelText).not.toMatch(/Non\s*Refundable/i);
  },
};

module.exports = RoomLevelResults;
