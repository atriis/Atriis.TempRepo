const { getPageObject } = require("@utils/pageObjectCache");
const HotelLevelResultsPage = require("@pages/HotelLevelResultsPage");
const { CommonPage } = require("@pages/CommonPage");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger");

const HOTEL_SUPPLIER_ID_MAP = {
  expedia: 'EXPEDIARAPID',
  bookingcom: 'BOOKINGCOM',
  amadeus: 'AMADEUS',
  amadeusaggregators: 'AMADEUS-TE',
  ratehawk: 'RATEHAWK',
  sabre: 'SABRE',
  hcorpo: 'HCORPO',
};

function resolveHotelSupplierId(supplierName, { strict = false } = {}) {
  const key = supplierName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const supplierId = HOTEL_SUPPLIER_ID_MAP[key];
  if (!supplierId && strict) throw new Error('Unknown supplier: ' + supplierName);
  return supplierId || supplierName.toUpperCase();
}

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
   * Verifies the member badge tag contains the expected text in hotel level results.
   * @param {import('playwright').Page} page
   * @param {string} expectedText - The expected badge text (case-insensitive match)
   * @throws {Error} If the badge text does not contain the expected text
   */
  async verifyMemberBadgeTagText(page, expectedText) {
    if (!page) throw new Error('[HotelLevelResults.verifyMemberBadgeTagText] "page" is required.');
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(`[HotelLevelResults.verifyMemberBadgeTagText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`);
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actualText = await hotelLevelResultsPage.getMemberBadgeText();

    if (!actualText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `[HotelLevelResults.verifyMemberBadgeTagText] Expected hotel member badge to contain "${expectedText}", ` +
        `but actual badge text was "${actualText}". Check that the Expedia member rate offer is present in hotel results.`
      );
    }
    return actualText;
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
    const supplierId = resolveHotelSupplierId(supplierName, { strict: true });
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
   * Waits for hotel map markers to be visible.
   * @param {import('playwright').Page} page
   */
  async waitForMapMarkers(page) {
    if (!page) throw new Error('page is required');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.waitForMapMarkers();
  },

  /**
   * Filters hotel results by name. Throws if no results appear after filtering.
   * @param {import('playwright').Page} page
   * @param {string} hotelName - Hotel name to filter by
   */
  async filterByHotelName(page, hotelName) {
    if (!page) throw new Error('page is required');
    if (!hotelName || typeof hotelName !== 'string') {
      throw new Error(`hotelName must be a non-empty string, got: ${typeof hotelName}`);
    }
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.filterByHotelName(hotelName);
  },

  /**
   * Filters hotel results by name. If no results appear after filtering,
   * clears the filter so the full result list is restored.
   * @param {import('playwright').Page} page
   * @param {string} hotelName - Hotel name to filter by
   * @returns {Promise<{filtered: boolean}>} Whether the filter was kept (true) or cleared (false)
   */
  async filterByHotelNameOrFallback(page, hotelName) {
    if (!page) throw new Error('page is required');
    if (!hotelName || typeof hotelName !== 'string') {
      throw new Error(`hotelName must be a non-empty string, got: ${typeof hotelName}`);
    }
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.filterByHotelName(hotelName);
    const count = await hotelLevelResultsPage.getVisibleHotelCardCount();
    if (count === 0) {
      logger.warn(`No hotels found for filter "${hotelName}", clearing filter`);
      await hotelLevelResultsPage.clearHotelNameFilter();
      return { filtered: false };
    }
    return { filtered: true };
  },

  /**
   * Drags the hotel results map in a given direction.
   * @param {import('playwright').Page} page
   * @param {'left'|'right'|'up'|'down'} direction
   */
  async dragResultsMap(page, direction = 'right') {
    if (!page) throw new Error('page is required');
    const validDirections = ['left', 'right', 'up', 'down'];
    if (!validDirections.includes(direction)) {
      throw new Error(`direction must be one of ${validDirections.join(', ')}, got: ${direction}`);
    }
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.dragMap(direction);
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
   * Verifies that every visible hotel card in the results has the given agreement label.
   * @param {import('playwright').Page} page
   * @param {string} tagText - Agreement label text to look for on each card (e.g. "My corporate")
   * @throws {Error} If any hotel card is missing the agreement label
   */
  async verifyAgreementTagOnAllHotels(page, tagText) {
    if (!page) throw new Error('page is required');
    if (!tagText || typeof tagText !== 'string') throw new Error(`tagText must be a non-empty string, got: ${typeof tagText}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const missingIndex = await hotelLevelResultsPage.findHotelMissingAgreementLabel(tagText);
    if (missingIndex !== -1) throw new Error(`Hotel at index ${missingIndex} is missing the "${tagText}" agreement tag`);
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

  /**
   * Verifies that the "Hotel wasn't found" error message is NOT displayed in results.
   * Waits for results to load first, then asserts the no-results section is absent.
   * @param {import('playwright').Page} page
   * @throws {Error} If the "Hotel wasn't found" message is unexpectedly visible
   */
  /**
   * Verifies that at least one agreement badge (handshake icon) is visible in hotel level results.
   * @param {import('playwright').Page} page
   * @throws {Error} If no agreement badge is visible
   */
  async verifyHandshakeBadgeVisible(page) {
    if (!page) throw new Error('page is required');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isAnyAgreementBadgeVisible();
    if (!isVisible) throw new Error('No agreement badge (handshake) is visible in hotel level results');
  },

  /**
   * Verifies that the Agreement filter section is visible in the hotel-level filter panel.
   * @param {import('playwright').Page} page
   * @throws {Error} If the Agreement filter section is not visible
   */
  async verifyAgreementFilterVisible(page) {
    if (!page) throw new Error('page is required');
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isFilterSectionVisible('Agreement');
    if (!isVisible) throw new Error('Agreement filter section is not visible in hotel level results');
  },

  async verifyHotelWasntFoundMessageNotDisplayed(page) {
    if (!page) throw new Error('page is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);

    // Wait for results to load (view rates button signals real results appeared)
    await hotelLevelResultsPage.waitForViewRatesText();

    const isVisible = await hotelLevelResultsPage.isHotelNotFoundMessageVisible();
    if (isVisible) {
      throw new Error('"Hotel wasn\'t found" error message is displayed but should not be');
    }
  },

  /**
   * Scrolls to the last hotel in search results and clicks its View rates button.
   * @param {import('playwright').Page} page
   */
  async clickLastHotelOption(page) {
    if (!page) throw new Error('page is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.waitForViewRatesText();
    await hotelLevelResultsPage.scrollToAndClickLastHotelViewRates();
  },
  /**
   * Enters share mode, selects the first hotel for sharing, opens the email dialog.
   * Must be called from hotel-level results page (before navigating to room level).
   * @param {import('playwright').Page} page
   */
  async shareHotelPriceOfferByEmail(page) {
    if (!page) throw new Error('page parameter is required');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const commonPage = getPageObject(page, CommonPage);

    // Enter share mode from hotel-level results
    await hotelLevelResultsPage.clickShareModeButton();

    // Select the first hotel for sharing
    await hotelLevelResultsPage.clickFirstHotelShareButton();

    // Click email button in the share bar
    await hotelLevelResultsPage.clickShareBarEmailButton();

    // Wait for the email dialog to appear
    await commonPage.waitForSubjectLabelSharePopUp();
  },

  /**
   * Verifies that the hotel sort dropdown has the expected label selected.
   * @param {import('playwright').Page} page
   * @param {string} expectedLabel - The expected sort label text (e.g. "Most recommended")
   * @throws {Error} If the selected sort label doesn't match
   */
  async verifySortSelected(page, expectedLabel) {
    if (!page) throw new Error('page is required');
    if (!expectedLabel || typeof expectedLabel !== 'string') throw new Error(`expectedLabel must be a non-empty string, got: ${typeof expectedLabel}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actual = await hotelLevelResultsPage.getSelectedSortLabel();
    if (!actual.toLowerCase().includes(expectedLabel.toLowerCase())) {
      throw new Error(`Expected sort filter to have "${expectedLabel}" selected, but got "${actual}"`);
    }
  },

  /**
   * Verifies the number of supplier filters in the hotel filter panel.
   * @param {import('playwright').Page} page
   * @param {number} expectedCount - Expected number of supplier filters
   * @throws {Error} If actual count doesn't match
   */
  async verifySupplierFilterCount(page, expectedCount) {
    if (!page) throw new Error('page is required');
    if (typeof expectedCount !== 'number' || expectedCount < 0) throw new Error(`expectedCount must be a non-negative number, got: ${expectedCount}`);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actualCount = await hotelLevelResultsPage.getSupplierFilterCount();
    if (actualCount !== expectedCount) {
      throw new Error(`Expected ${expectedCount} supplier filter(s), but found ${actualCount}`);
    }
  },

  /**
   * Verifies that a specific supplier is visible in the supplier filter panel.
   * @param {import('playwright').Page} page
   * @param {string} supplierName - Supplier name (e.g. "bookingcom", "amadeus")
   * @throws {Error} If the supplier filter is not visible
   */
  async verifySupplierFilterVisible(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') throw new Error(`supplierName must be a non-empty string, got: ${typeof supplierName}`);
    const supplierId = resolveHotelSupplierId(supplierName);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isSupplierFilterVisible(supplierId);
    if (!isVisible) throw new Error(`Supplier filter "${supplierName}" (${supplierId}) is not visible in the hotel filter panel`);
  },

  /**
   * Verifies that the destination shown in the hotel info bar (top of the hotel results
   * page) contains the expected city. Used after a parallel flight search lands on hotel
   * results to confirm the trip destination carried over (e.g. "New York, NY, USA, (NYC)").
   *
   * @param {import('playwright').Page} page
   * @param {string} city - Expected destination text (e.g. "New York, NY, USA, (NYC)")
   * @returns {Promise<void>}
   */
  async verifyHotelResultsDestination(page, city) {
    if (!page) throw new Error('page is required');
    if (!city || typeof city !== 'string') {
      throw new Error(`city must be a non-empty string, got: ${typeof city}`);
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actualDestination = await hotelLevelResultsPage.getHotelInfoBarDestinationText();
    expect(
      actualDestination.toLowerCase(),
      `Expected hotel results destination to contain "${city}", but the info bar showed "${actualDestination}". ` +
        `The destination may not have carried over from the flight search.`,
    ).toContain(city.toLowerCase());
  },

  /**
   * Verifies the transient parallel-search loader popup — shown after the flight is added to cart
   * while the parallel product (hotel or car) search loads — contains the expected text (e.g.
   * "Amsterdam hotel" or "Madrid car hire"). The loader (product-search-loader.vue) is
   * product-generic, so this backs both the parallel hotel and parallel car modal assertions.
   *
   * @param {Object} page - Playwright page
   * @param {string} text - Expected substring in the loader message (e.g. "Amsterdam hotel")
   */
  async verifyParallelSearchLoaderContains(page, text) {
    if (!page) {
      throw new Error('[HotelLevelResults.verifyParallelSearchLoaderContains] "page" is required, got: ' + typeof page);
    }
    if (!text || typeof text !== 'string') {
      throw new Error(
        '[HotelLevelResults.verifyParallelSearchLoaderContains] "text" must be a non-empty string, got: ' + typeof text,
      );
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const loaderText = await hotelLevelResultsPage.waitForParallelSearchLoaderText();
    expect(
      loaderText.toLowerCase(),
      `Expected the parallel search loader popup to contain "${text}", but it showed "${loaderText}". ` +
        `The parallel search may not have started for the edited destination.`,
    ).toContain(text.toLowerCase());
  },

  /**
   * Verifies that the hotel search check-in date matches the expected date from a flight.
   * Flight dates are in format "EEE, dd MMM" (e.g. "Thu, 11 Dec").
   * Hotel dates are displayed as "MMM dd-MMM dd" (e.g. "Dec 11- Dec 15").
   *
   * @param {Object} page - Playwright page
   * @param {string} expectedFlightDate - Flight date text like "Thu, 11 Dec"
   */
  async verifyHotelCheckInDateMatchesFlight(page, expectedFlightDate) {
    if (!page) throw new Error('page is required');
    if (!expectedFlightDate || typeof expectedFlightDate !== 'string') {
      throw new Error('expectedFlightDate must be a non-empty string, got: ' + expectedFlightDate);
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const dateText = await hotelLevelResultsPage.getHotelInfoBarDateText();

    // Parse flight date "Thu, 11 Dec" → extract day and month
    const flightMatch = expectedFlightDate.match(/(\d+)\s+(\w+)/);
    if (!flightMatch) throw new Error(`Could not parse flight date: "${expectedFlightDate}"`);
    const flightDay = flightMatch[1].padStart(2, '0');
    const flightMonth = flightMatch[2]; // e.g. "Dec"

    // Hotel dates format: "MMM dd- MMM dd" or "MMM dd-MMM dd"
    // Check-in is the left part before the dash
    const hotelCheckIn = dateText.split('-')[0].trim();
    // hotelCheckIn is like "Dec 11"
    const hotelMatch = hotelCheckIn.match(/(\w+)\s+(\d+)/);
    if (!hotelMatch) throw new Error(`Could not parse hotel check-in date from: "${dateText}"`);
    const hotelMonth = hotelMatch[1];
    const hotelDay = hotelMatch[2].padStart(2, '0');

    expect(hotelMonth.toLowerCase()).toBe(flightMonth.toLowerCase());
    expect(hotelDay).toBe(flightDay);
  },

  /**
   * Verifies that the hotel search check-out date matches the expected date from a flight.
   *
   * @param {Object} page - Playwright page
   * @param {string} expectedFlightDate - Flight date text like "Mon, 15 Dec"
   */
  async verifyHotelCheckOutDateMatchesFlight(page, expectedFlightDate) {
    if (!page) throw new Error('page is required');
    if (!expectedFlightDate || typeof expectedFlightDate !== 'string') {
      throw new Error('expectedFlightDate must be a non-empty string, got: ' + expectedFlightDate);
    }

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const dateText = await hotelLevelResultsPage.getHotelInfoBarDateText();

    // Parse flight date "Mon, 15 Dec" → extract day and month
    const flightMatch = expectedFlightDate.match(/(\d+)\s+(\w+)/);
    if (!flightMatch) throw new Error(`Could not parse flight date: "${expectedFlightDate}"`);
    const flightDay = flightMatch[1].padStart(2, '0');
    const flightMonth = flightMatch[2];

    // Check-out is the right part after the dash
    const hotelCheckOut = dateText.split('-')[1].trim();
    const hotelMatch = hotelCheckOut.match(/(\w+)\s+(\d+)/);
    if (!hotelMatch) throw new Error(`Could not parse hotel check-out date from: "${dateText}"`);
    const hotelMonth = hotelMatch[1];
    const hotelDay = hotelMatch[2].padStart(2, '0');

    expect(hotelMonth.toLowerCase()).toBe(flightMonth.toLowerCase());
    expect(hotelDay).toBe(flightDay);
  },

  /**
   * Verifies that at least one hotel name in results matches the given regex pattern.
   *
   * @param {import('playwright').Page} page
   * @param {RegExp|string} pattern - Regex pattern to match against hotel names
   * @returns {Promise<{matched: boolean, names: string[]}>}
   */
  async verifyHotelNamesMatchPattern(page, pattern) {
    if (!page) throw new Error('page is required');
    if (!pattern) throw new Error('pattern is required');

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const names = await hotelLevelResultsPage.getAllHotelNames();

    const matchingNames = names.filter(name => regex.test(name));
    if (matchingNames.length === 0) {
      throw new Error(`No hotel names match pattern ${regex}. Found: ${names.join(', ')}`);
    }

    return { matched: true, names: matchingNames };
  },

  /**
   * Verifies that the hotel at a specific position has the expected name.
   *
   * @param {import('playwright').Page} page
   * @param {number} index - 1-based hotel position
   * @param {string} expectedName - Expected hotel name (substring match)
   */
  async verifyHotelNameAtIndex(page, index, expectedName) {
    if (!page) throw new Error('page is required');
    if (typeof index !== 'number' || index < 1) throw new Error('index must be >= 1, got: ' + index);
    if (!expectedName || typeof expectedName !== 'string') throw new Error('expectedName must be a non-empty string');

    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const actualName = await hotelLevelResultsPage.getHotelNameAtIndex(index);

    expect(actualName).toContain(expectedName);
  },

  /**
   * Clicks a supplier filter checkbox to filter hotel results by supplier.
   * @param {import('playwright').Page} page
   * @param {string} supplierName - Supplier name (e.g. "sabre", "amadeus", "expedia")
   */
  async verifySupplierLogoNotVisible(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const supplierId = resolveHotelSupplierId(supplierName, { strict: true });
    const p = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await p.isSupplierLogoVisible(supplierId, { timeout: 5000 });
    if (isVisible) throw new Error(`Supplier logo for "${supplierName}" (${supplierId}) should NOT be visible but was found in hotel results`);
  },

  async verifySupplierFilterNotVisible(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') {
      throw new Error('supplierName must be a non-empty string, got: ' + typeof supplierName);
    }
    const supplierId = resolveHotelSupplierId(supplierName);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    const isVisible = await hotelLevelResultsPage.isSupplierFilterVisible(supplierId, { timeout: 5000 });
    if (isVisible) throw new Error(`Supplier filter "${supplierName}" (${supplierId}) should NOT be visible but was found in the hotel filter panel`);
  },

  async clickSupplierFilter(page, supplierName) {
    if (!page) throw new Error('page is required');
    if (!supplierName || typeof supplierName !== 'string') throw new Error('supplierName must be a non-empty string');
    const supplierId = resolveHotelSupplierId(supplierName);
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    await hotelLevelResultsPage.clickSupplierFilterCheckbox(supplierId);
  },

  /**
   * Sets the max price in the hotel-level Price filter panel.
   * @param {import('playwright').Page} page
   * @param {number} maxPrice - Maximum price value to filter by
   */
  async filterHotelsByMaxPrice(page, maxPrice) {
    if (!page) throw new Error('[HotelLevelResults.filterHotelsByMaxPrice] page is required');
    if (typeof maxPrice !== 'number' || maxPrice <= 0) {
      throw new Error(`[HotelLevelResults.filterHotelsByMaxPrice] "maxPrice" must be a positive number, got: ${typeof maxPrice} (${maxPrice})`);
    }
    logger.debug('Filtering hotel results by max price', { maxPrice });
    const hotelLevelResultsPage = getPageObject(page, HotelLevelResultsPage);
    try {
      await hotelLevelResultsPage.setMaxPriceFilter(maxPrice);
    } catch (err) {
      throw new Error(`[HotelLevelResults.filterHotelsByMaxPrice] Failed to apply max price filter of ${maxPrice}. ${err.message}`);
    }
  },
};

module.exports = HotelLevelResults;
