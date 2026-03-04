const { getPageObject } = require("@utils/pageObjectCache");
const HotelLevelResultsPage = require("@pages/HotelLevelResultsPage");
const { assertCO2Displayed } = require("@utils/co2Validation");

/**
 * HotelLevelResults DSL
 *
 * Business actions at the hotel list level.
 */
const HotelLevelResults = {
  /**
   * Selects the first hotel and navigates to room-level results.
   */
  async clickFirstHotelOption(page) {
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);

    await hotelLevelResultsPage.waitForViewRatesText();
    await hotelLevelResultsPage.clickFirstViewRatesButton();

    return { selected: true };
  },

  /**
   * Selects the first hotel WITH member rates and navigates to room-level results.
   */
  async clickFirstHotelWithMemberRate(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickFirstHotelWithMemberRate();

    return { selected: true };
  },

  /**
   * Verifies that member rates are displayed in hotel level results.
   * @param {import('playwright').Page} page
   * @returns {Promise<boolean>} True if member rates are visible
   * @throws {Error} If page parameter is not provided or member rates are not displayed
   */
  async verifyMemberRatesDisplayed(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isMemberBadgeVisible();
    
    if (!isVisible) {
      throw new Error('Member rate badge is not visible in hotel level results');
    }

    return isVisible;
  },

  /**
   * Verifies that CO2 emissions data is displayed in hotel level results.
   * Checks that the eco-label is visible and the CO2 value is a non-zero number.
   * @param {import('playwright').Page} page
   * @returns {Promise<{visible: boolean, value: string}>}
   * @throws {Error} If CO2 data is not displayed or value is zero
   */
  async verifyCO2InHotelLevel(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const p = getPageObject(page, HotelLevelResultsPage);
    await p.waitForViewRatesText();
    return assertCO2Displayed(
      () => p.isCO2LabelVisible({ timeout: 30000 }),
      () => p.getCO2Value(),
      'hotel level results',
    );
  },

  async verifySupplierLogo(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const SUPPLIER_ID_MAP = {
      expedia: 'EXPEDIARAPID',
      bookingcom: 'BOOKINGCOM',
      amadeus: 'AMADEUS',
      amadeusteldar: 'AMADEUS-TE',
      ratehawk: 'RATEHAWK',
      sabre: 'SABRE',
    };
    const key = supplierName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const supplierId = SUPPLIER_ID_MAP[key];
    if (!supplierId) {
      throw new Error('Unknown supplier: ' + supplierName);
    }
    const p = getPageObject(page, HotelLevelResultsPage);
    return p.isSupplierLogoVisible(supplierId);
  },
};

module.exports = HotelLevelResults;
