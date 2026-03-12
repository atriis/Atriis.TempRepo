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
   * Extracts the first displayed hotel-level price from results.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>}
   */
  async extractHotelLevelPrice(page) {
    if (!page) {
      throw new Error('page parameter is required');
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.waitForViewRatesText();
    return hotelLevelResultsPage.getFirstHotelLevelPrice();
  },

  /**
   * Extracts the booking fee displayed at hotel level (first hotel card).
   * The booking fee in Premier Inn is reflected in the total price shown at hotel level.
   * @param {import('playwright').Page} page
   * @returns {Promise<number>} The booking fee as a number
   */
  async extractBookingFeeHotelLevel(page) {
    if (!page) throw new Error('page parameter is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.waitForViewRatesText();
    return hotelLevelResultsPage.getFirstHotelLevelPrice();
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
   * Opens the map view from hotel results.
   * @param {import('playwright').Page} page
   */
  async openResultsMapView(page) {
    if (!page) throw new Error('page is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.openMapView();

    return { mapOpened: true };
  },

  /**
   * Opens the first hotel preview from the map in a new browser tab.
   * @param {import('playwright').Page} page
   */
  async openFirstHotelFromMapPreviewInNewTab(page) {
    if (!page) throw new Error('page is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.selectFirstMapMarker();
    const popupPage = await hotelLevelResultsPage.clickSelectedMapPreviewAndWaitForNewTab();

    return popupPage;
  },

  /**
   * Verifies the newly opened tab is the hotel details page.
   * @param {import('playwright').Page} page
   * @param {import('playwright').Page} popupPage
   */
  async verifyHotelDetailsTabOpened(page, popupPage) {
    if (!page) throw new Error('page is required');
    if (!popupPage || typeof popupPage.url !== 'function') {
      throw new Error('popupPage must be a Playwright page, got: ' + typeof popupPage);
    }

    await popupPage.waitForLoadState('domcontentloaded', { timeout: 60000 });
    const popupUrl = popupPage.url();

    expect(popupUrl).toContain('/rooms');
    expect(popupUrl).not.toBe(page.url());

    return { popupUrl };
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

  /**
   * Verifies that the expected filter sections are visible in the hotel-level filter panel.
   * Filters: Agreement, Distance, Price, Stars, Payment, Amenities, Suppliers.
   * @param {import('playwright').Page} page
   * @throws {Error} If any expected filter section is not visible
   */
  async verifyHotelFilters(page) {
    if (!page) throw new Error('page is required');
    const expectedFilters = ['Agreement', 'Distance', 'Price', 'Stars', 'Payment', 'Amenities', 'Suppliers'];
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    for (const filter of expectedFilters) {
      const isVisible = await hotelLevelResultsPage.isFilterSectionVisible(filter);
      if (!isVisible) throw new Error(`Hotel filter section "${filter}" is not visible in hotel level results`);
    }
  },

  /**
   * Clicks a checkbox option in the hotel-level filter panel.
   * @param {import('playwright').Page} page
   * @param {string} filterName - Filter section title (e.g. "Agreement")
   * @param {string} optionText - Checkbox label to click (e.g. "Corp")
   */
  async applyHotelFilter(page, filterName, optionText) {
    if (!page) throw new Error('page is required');
    if (!filterName || typeof filterName !== 'string') throw new Error(`filterName must be a non-empty string, got: ${typeof filterName}`);
    if (!optionText || typeof optionText !== 'string') throw new Error(`optionText must be a non-empty string, got: ${typeof optionText}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickHotelFilterOption(filterName, optionText);
    // When only one agreement option exists the checkbox is auto-checked/disabled by the app.
    // Clicking it triggers no Vuex update, so we dispatch directly as a reliable fallback.
    await hotelLevelResultsPage.ensureHotelFilterApplied(filterName, optionText);
  },

  /**
   * Verifies that an active filter badge tag is visible in the hotel-filter summary bar.
   * @param {import('playwright').Page} page
   * @param {string} tagText - The badge text to look for (e.g. "My corporate")
   * @throws {Error} If the tag is not visible
   */
  async verifyHotelFilterTag(page, tagText) {
    if (!page) throw new Error('page is required');
    if (!tagText || typeof tagText !== 'string') throw new Error(`tagText must be a non-empty string, got: ${typeof tagText}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isFilterTagVisible(tagText);
    if (!isVisible) throw new Error(`Hotel filter tag "${tagText}" is not visible in the filter summary`);
  },

  /**
   * Verifies that an agreement label (e.g. "Corporate rate") is visible on the first hotel result.
   * @param {import('playwright').Page} page
   * @param {string} labelText - The agreement label text to look for (e.g. "Corporate rate")
   * @throws {Error} If the label is not visible
   */
  async verifyAgreementLabelForFirstHotel(page, labelText) {
    if (!page) throw new Error('page is required');
    if (!labelText || typeof labelText !== 'string') throw new Error(`labelText must be a non-empty string, got: ${typeof labelText}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isAgreementLabelVisibleInFirstHotel(labelText);
    if (!isVisible) throw new Error(`Agreement label "${labelText}" is not visible on the first hotel result`);
  },

  /**
   * Hovers over an agreement label on the first hotel result and verifies the tooltip contains expected text.
   * @param {import('playwright').Page} page
   * @param {string} labelText - The agreement label to hover over (e.g. "Corporate rate")
   * @param {string} tooltipText - Expected text in the tooltip (e.g. "PwC Rate")
   * @throws {Error} If the tooltip text does not contain expected value
   */
  async verifyAgreementResultsForCorporate(page, labelText, tooltipText) {
    if (!page) throw new Error('page is required');
    if (!labelText || typeof labelText !== 'string') throw new Error(`labelText must be a non-empty string, got: ${typeof labelText}`);
    if (!tooltipText || typeof tooltipText !== 'string') throw new Error(`tooltipText must be a non-empty string, got: ${typeof tooltipText}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actualTooltip = await hotelLevelResultsPage.hoverAgreementLabelAndGetTooltip(labelText);
    expect(actualTooltip.toLowerCase()).toContain(tooltipText.toLowerCase());
  },
};

module.exports = HotelLevelResults;
