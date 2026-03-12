const { getPageObject } = require("@utils/pageObjectCache");
const RoomLevelResultsPage = require("@pages/RoomLevelResultsPage");
const { CommonPage } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const Results = require("./Results");

/**
 * RoomLevelResults DSL
 *
 * Business actions at the room selection level.
 */
const RoomLevelResults = {

  /**
   * Verifies the count of nights displayed on the room level results.
   * @param {import('playwright').Page} page
   * @param {number} expectedNights - The expected number of nights
   */
  async verifyNightsCountInRoomLevel(page, expectedNights) {
    if (!page) throw new Error('page parameter is required');
    if (typeof expectedNights !== 'number') throw new Error(`expectedNights must be a number, got: ${typeof expectedNights}`);

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const actualNights = await roomLevelResultsPage.getNightsCount();

    if (actualNights !== expectedNights) {
       throw new Error(`Expected ${expectedNights} nights in room level results, but found ${actualNights}`);
    }
  },

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

  async extractRoomLevelPrice(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    return roomLevelResultsPage.getFirstRoomLevelPrice();
  },

  /**
   * Extracts the booking fee displayed at room level (first room card).
   * The booking fee in Premier Inn is reflected in the total price shown at room level.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The booking fee as a number
   */
  async extractBookingFeeRoomLevel(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.waitForViewHotelOnMapText();
    return roomLevelResultsPage.getFirstRoomLevelPrice();
  },

  /**
   * Compares booking fees from hotel level and room level within a tolerance.
   * @param {import('playwright').Page} page
   * @param {number} hotelFee - Booking fee extracted at hotel level
   * @param {number} roomFee - Booking fee extracted at room level
   * @throws {Error} If fees differ beyond tolerance
   */
  async compareBookingFees(page, hotelFee, roomFee) {
    if (!page) throw new Error('page parameter is required');
    if (typeof hotelFee !== 'number' || Number.isNaN(hotelFee)) {
      throw new Error(`hotelFee must be a number, got: ${typeof hotelFee}`);
    }
    if (typeof roomFee !== 'number' || Number.isNaN(roomFee)) {
      throw new Error(`roomFee must be a number, got: ${typeof roomFee}`);
    }

    const difference = Math.abs(hotelFee - roomFee);
    const tolerance = 0.01;

    if (difference > tolerance) {
      throw new Error(
        `Booking fee mismatch: hotel level shows ${hotelFee}, room level shows ${roomFee} (difference: ${difference}, tolerance: ${tolerance})`
      );
    }

    return { hotelFee, roomFee, difference };
  },

  async compareHotelAndRoomLevelPrices(page, hotelLevelPrice, roomLevelPrice) {
    if (!page) throw new Error('page parameter is required');
    if (typeof hotelLevelPrice !== 'number' || Number.isNaN(hotelLevelPrice)) {
      throw new Error(`hotelLevelPrice must be a number, got: ${typeof hotelLevelPrice}`);
    }
    if (typeof roomLevelPrice !== 'number' || Number.isNaN(roomLevelPrice)) {
      throw new Error(`roomLevelPrice must be a number, got: ${typeof roomLevelPrice}`);
    }

    const difference = Math.abs(hotelLevelPrice - roomLevelPrice);
    const tolerance = 0.01;

    if (difference > tolerance) {
      throw new Error(`Expected hotel-level price ${hotelLevelPrice} to match room-level price ${roomLevelPrice} within tolerance ${tolerance}`);
    }

    return { hotelLevelPrice, roomLevelPrice, difference };
  },

  async waitForViewHotelOnMapButtonInRoomLevelResults(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.waitForViewHotelOnMapButton();
  },

  async clickViewOnMap(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickViewHotelOnMapButton();
  },

  async verifyMapModalOpened(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.waitForHotelMapModal();
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
    return { memberPrice, regularPrice, hasDiscount };
  },

  async verifyCO2InRoomLevel(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    return commonPage.assertCO2Displayed(
      () => roomLevelResultsPage.isCO2LabelVisible({ timeout: 30000 }),
      () => roomLevelResultsPage.getCO2Value(),
      'room level results',
    );
  },

  async filterRoomsByWifi(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickWifiCheckbox();
  },

  async verifyWifiRoomsOnly(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.verifyAllRoomsHaveWifi();
  },

  async filterRoomsByBreakfast(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.clickBreakfastCheckbox();
  },

  async verifyBreakfastRoomsOnly(page) {
    if (!page) throw new Error('page parameter is required');
    const p = getPageObject(page, RoomLevelResultsPage);
    await p.verifyAllRoomsHaveBreakfast();
  },

  /**
   * Verifies the "Paid at hotel" tooltip is displayed correctly for Ratehawk rooms.
   * Clicks price details, hovers the info icon, and asserts tooltip text.
   * @param {import('playwright').Page} page
   */
  async verifyPaidAtHotelTooltip(page) {
    if (!page) throw new Error('page parameter is required');

    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);

    await roomLevelResultsPage.clickPriceDetailsButton();
    await roomLevelResultsPage.hoverPayAtHotelInfoIcon();
    const tooltipText = await roomLevelResultsPage.getPayAtHotelTooltipText();

    if (tooltipText !== 'Paid at the hotel') {
      throw new Error(`Expected tooltip "Paid at the hotel", got: "${tooltipText}"`);
    }
  },

  /**
   * Verifies that a specific supplier logo is visible in room level results.
   * @param {import('playwright').Page} page
   * @param {string} supplierName - Common name of the supplier (e.g. "Expedia", "hCorpo")
   * @returns {Promise<boolean>} True if logo is visible
   */
  async verifySupplierLogo(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const SUPPLIER_ID_MAP = {
      expedia: 'EXPEDIA',
      hcorpo: 'AMADEUS-HD',
      bookingcom: 'BOOKINGCOM',
      amadeus: 'AMADEUS',
      ratehawk: 'RATEHAWK',
    };
    const key = supplierName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const supplierId = SUPPLIER_ID_MAP[key];
    if (!supplierId) {
      throw new Error('Unknown supplier: ' + supplierName);
    }
    const p = getPageObject(page, RoomLevelResultsPage);
    return p.isSupplierLogoVisible(supplierId);
  },

  /**
   * Verifies that the expected filter sections are visible in the room-level filter panel.
   * Filters: Agreement, Price, Payment, Suppliers.
   * @param {import('playwright').Page} page
   * @throws {Error} If any expected filter section is not visible
   */
  async verifyRoomLevelFilters(page) {
    if (!page) throw new Error('page is required');
    const expectedFilters = ['Agreement', 'Price', 'Payment', 'Suppliers'];
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    for (const filter of expectedFilters) {
      const isVisible = await roomLevelResultsPage.isRoomFilterSectionVisible(filter);
      if (!isVisible) throw new Error(`Room filter section "${filter}" is not visible in room level results`);
    }
  },

  /**
   * Applies a filter in the room-level filter panel by clicking the specified option.
   * @param {import('playwright').Page} page
   * @param {string} filterName - Filter section title (e.g. "Agreement")
   * @param {string} optionText - Checkbox option label (e.g. "Corp")
   */
  async applyRoomFilter(page, filterName, optionText) {
    if (!page) throw new Error('page is required');
    if (!filterName || typeof filterName !== 'string') throw new Error('filterName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const roomLevelResultsPage = getPageObject(page, RoomLevelResultsPage);
    await roomLevelResultsPage.clickRoomFilterOption(filterName, optionText);
  },
};

module.exports = RoomLevelResults;
