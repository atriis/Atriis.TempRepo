const { getPageObject } = require("@utils/pageObjectCache");
const RoomLevelResultsPage = require("@pages/RoomLevelResultsPage");
const { assertCO2Displayed } = require("@utils/co2Validation");
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
   * Filters to refundable rooms first, then adds the first one available.
   */
  async addRefundableHotelRoomLevelToCart(page) {
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const resultsPage = getPageObject(page, ResultsPage);

    await roomLevelResultsPage.waitForViewHotelOnMapText();

    // Filter to refundable rooms FIRST
    await roomLevelResultsPage.clickRefundableCheckbox();
    await roomLevelResultsPage.verifyRefundableTagIsVisible();

    // Now wait and scroll to the "Add to trip" button in the filtered list
    await resultsPage.waitForAddToTripText();
    await resultsPage.scrollToFirstAddToTripButton();

    await resultsPage.clickFirstAddToTripButton();

    // Handle optional conflict modal (uses DSL for consistency)
    await Results.clickProceedConflictQuoteModal(page);
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

  /**
   * Verifies that member rates are displayed in room level results.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if member rates are visible
   * @throws {Error} If page parameter is not provided or member rates are not displayed
   */
  async verifyMemberRatesDisplayed(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const isVisible = await roomLevelResultsPage.isMemberBadgeVisible();
    
    if (!isVisible) {
      throw new Error('Member rate badge is not visible in room level results');
    }

    return isVisible;
  },

  /**
   * Compares member rate price vs regular price and verifies discount exists.
   * @param {import('playwright').Page} page
   * @returns {Promise<{memberPrice: number, regularPrice: number, hasDiscount: boolean}>}
   * @throws {Error} If page parameter is not provided or member price is not lower
   */
  async compareMemberVsRegularPrice(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const { memberPrice, regularPrice } = await roomLevelResultsPage.getPriceComparison();

    const hasDiscount = memberPrice < regularPrice;
    
    if (!hasDiscount) {
      throw new Error(
        `Member price (${memberPrice}) is not lower than regular price (${regularPrice})`
      );
    }

    return { memberPrice, regularPrice, hasDiscount };
  },

  /**
   * Verifies that CO2 emissions data is displayed in room level results.
   * Checks that the eco-label is visible and the CO2 value is a non-zero number.
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, value: string}>}
   * @throws {Error} If CO2 data is not displayed or value is zero
   */
  async verifyCO2InRoomLevel(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const p = getPageObject(page, RoomLevelResultsPage);
    return assertCO2Displayed(
      () => p.isCO2LabelVisible(),
      () => p.getCO2Value(),
      'room level results',
    );
  },
};

module.exports = RoomLevelResults;
