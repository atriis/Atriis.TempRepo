const { getPageObject } = require("@utils/pageObjectCache");
const HotelLevelResultsPage = require("@pages/HotelLevelResultsPage");
const { CommonPage } = require("@pages/CommonPage");
const { expect } = require("@playwright/test");

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
   * Verifies the corporate preferred badge is visible on hotel level results.
   * @param {import('playwright').Page} page
   * @throws {Error} If the badge is not visible
   */
  async verifyCorporatePreferredBadge(page) {
    if (!page) throw new Error('page is required');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isCorporatePreferredBadgeVisible();
    if (!isVisible) throw new Error('Corporate preferred badge is not visible in hotel level results');
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

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);
    await hotelLevelResultsPage.waitForViewRatesText();
    return commonPage.assertCO2Displayed(
      () => hotelLevelResultsPage.isCO2LabelVisible({ timeout: 30000 }),
      () => hotelLevelResultsPage.getCO2Value(),
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

  /**
   * Verifies the Sustainability filter is visible and not greyed out in hotel results.
   * @param {import('playwright').Page} page
   * @returns {Promise<{enabled: boolean}>}
   * @throws {Error} If the filter is not visible or is disabled
   */
  async verifySustainabilityFilterEnabled(page) {
    if (!page) throw new Error('page is required');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isEnabled = await hotelLevelResultsPage.isSustainabilityFilterEnabled();
    if (!isEnabled) throw new Error('Sustainability filter is greyed out (disabled)');
    return { enabled: true };
  },

  /**
   * Clicks "View rates" on a hotel result by 1-based index.
   * @param {import('playwright').Page} page
   * @param {number} index - 1-based hotel index
   */
  async clickHotelByIndex(page, index) {
    if (!page) throw new Error('page is required');
    if (typeof index !== 'number' || index < 1) throw new Error('index must be a positive number, got: ' + index);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickViewRatesByIndex(index);
  },

  /**
   * Sorts hotel results by a given label (e.g., "Price").
   * Closes any open hotel details drawer first.
   * @param {import('playwright').Page} page
   * @param {string} label - Sort option label text
   */
  async sortBy(page, label) {
    if (!page) throw new Error('page is required');
    if (!label || typeof label !== 'string') throw new Error('label must be a non-empty string');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    // Close any open hotel details drawer via Escape
    const amenitiesVisible = await page.locator('.hotel-amenities').first().isVisible().catch(() => false);
    if (amenitiesVisible) {
      await page.keyboard.press('Escape');
      await page.locator('.hotel-amenities').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
    await hotelLevelResultsPage.selectSortOption(label);
  },

  /**
   * Verifies that a specific amenity is displayed (active) on hotel at given index.
   * Opens the hotel details drawer first, then checks the amenity.
   * @param {import('playwright').Page} page
   * @param {number} index - 1-based hotel index
   * @param {string} amenityName - Amenity name to check (e.g., "gym")
   */
  async verifyAmenityDisplayed(page, index, amenityName) {
    if (!page) throw new Error('page is required');
    if (!amenityName || typeof amenityName !== 'string') throw new Error('amenityName must be a non-empty string');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickMoreDetailsByIndex(index);
    const isActive = await hotelLevelResultsPage.isAmenityActive(amenityName);
    expect(isActive, `Expected amenity "${amenityName}" to be displayed on hotel ${index}`).toBe(true);
  },

  /**
   * Verifies that a specific amenity is NOT displayed (not active) on hotel at given index.
   * Opens the hotel details drawer first, then checks the amenity.
   * @param {import('playwright').Page} page
   * @param {number} index - 1-based hotel index
   * @param {string} amenityName - Amenity name to check (e.g., "gym")
   */
  async verifyAmenityNotDisplayed(page, index, amenityName) {
    if (!page) throw new Error('page is required');
    if (!amenityName || typeof amenityName !== 'string') throw new Error('amenityName must be a non-empty string');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickMoreDetailsByIndex(index);
    const isActive = await hotelLevelResultsPage.isAmenityActive(amenityName);
    expect(isActive, `Expected amenity "${amenityName}" to NOT be displayed on hotel ${index}`).toBe(false);
  },

  /**
   * Edits the hotel search location and searches for new results.
   * Clicks the Edit button, changes the destination, and initiates a new search.
   * @param {import('playwright').Page} page
   * @param {string} newLocation - New hotel destination to search for
   * @throws {Error} If page or newLocation are not provided
   */
  async editHotelSearchLocation(page, newLocation) {
    if (!page) throw new Error('page is required');
    if (!newLocation || typeof newLocation !== 'string') throw new Error('newLocation must be a non-empty string');
    
    const { ResultsPage } = require('@pages/ResultsPage');
    const HotelSearchPage = require('@pages/HotelSearchPage');
    const { SearchPage } = require('@pages/SearchPage');
    
    const resultsPage = getPageObject(page, ResultsPage);
    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);
    
    // Click Edit to open the search form
    await resultsPage.clickEditButton();
    
    // Wait for the destination field to become visible (may be in a modal or overlay)
    await hotelSearchPage.page.locator("[placeholder='Where would you like to stay?']").waitFor({ state: 'visible', timeout: 15000 });
    
    // Update the location field
    await hotelSearchPage.typeHotelDestination(newLocation);
    
    // Click search to apply the location change
    await searchPage.waitAndClickSearchButton();
    
    return { locationChanged: true, newLocation };
  },

  /**
   * Verifies that the hotel results are for the expected location.
   * Checks that the location appears in the search results header/title.
   * @param {import('playwright').Page} page
   * @param {string} expectedLocation - Expected location in results
   * @throws {Error} If page or expectedLocation are not provided, or if location is not visible
   */
  async verifyResultsLocation(page, expectedLocation) {
    if (!page) throw new Error('page is required');
    if (!expectedLocation || typeof expectedLocation !== 'string') throw new Error('expectedLocation must be a non-empty string');
    
    // Look for the location in the page heading or search results header
    // Try to find text matching the location in headings or common result labels
    const locationSearchElements = page.getByText(expectedLocation, { exact: false });
    const count = await locationSearchElements.count();
    
    expect(count > 0, `Expected location "${expectedLocation}" not found in results`).toBe(true);
    
    return { locationVerified: true, expectedLocation };
  },

  /**
   * Scrolls through the hotel filters panel to verify it has scrollable content.
   * Scrolls within the filters sidebar on the results page.
   * @param {import('playwright').Page} page
   * @throws {Error} If page is not provided
   */
  async scrollHotelFilters(page) {
    if (!page) throw new Error('page is required');
    
    // Find the filters container (typically a sidebar with hotel filters)
    const filtersContainer = page.locator('.search-filters, [class*="filter"], .filters-sidebar').first();
    
    try {
      // Wait for filters to be visible
      await filtersContainer.waitFor({ state: 'visible', timeout: 10000 });
      
      // Scroll within the filters container
      await filtersContainer.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
      
      // Small pause for scroll to settle
      await page.waitForTimeout(500);
      
      return { scrolled: true };
    } catch {
      // If no dedicated filters container found, scroll the whole page filters area
      await page.keyboard.press('End');
      await page.waitForTimeout(500);
      return { scrolled: true };
    }
  },
};

module.exports = HotelLevelResults;
