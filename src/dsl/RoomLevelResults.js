const { getPageObject } = require("@utils/pageObjectCache");
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
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);
    const cartPage = getPageObject(page, CartPage);

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

  async addFirstHotelRoomLevelToCart(page) {
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();
    await resultsPage.scrollToFirstAddToTripButton();
    await resultsPage.waitForAddToTripText();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal (uses DSL for consistency)
    await Results.clickProceedConflictQuoteModal(page);
  },

  /**
   * Extracts the cancellation policy text from the first room in room level results.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The cancellation policy text
   */
  async extractCancellationPolicy(page) {
    if (!page) {
      throw new Error('page is required');
    }
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    return roomLevelResultsPage.getCancellationPolicy();
  },
};

module.exports = RoomLevelResults;
