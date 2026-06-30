const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const HotelSearchPage = require("@pages/HotelSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { CommonPage } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { selectDatesByNthAvailable, selectDatesByNthAvailableFromNextVisibleMonth } = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const hotelLocations = require("@data/hotels.json");

/**
 * HotelSearch DSL
 *
 * Describes how a user searches for a hotel stay.
 */
const HotelSearch = {
  /**
   * Searches for a hotel with a specific number of rooms selected before searching.
   * Handles the rooms dropdown selection before destination input.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} whereInput - Destination string or object with { where, nights, rooms }
   * @param {object} [options]
   * @param {number} [options.nights] - Number of nights
   * @param {number} [options.rooms=2] - Number of rooms to select
   * @returns {Promise<{searched: boolean, where: string, nights: number, rooms: number}>}
   */
  async searchHotelMultiRoom(page, whereInput = hotelLocations.defaultLocation, options = {}) {
    if (!page) throw new Error('page is required');

    let where, nights, rooms;
    if (typeof whereInput === 'object' && whereInput !== null) {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
      rooms = whereInput.rooms || 2;
    } else {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
      rooms = options.rooms || 2;
    }

    if (nights < 1) throw new Error(`"nights" must be >= 1. Got ${nights}`);
    if (typeof rooms !== 'number' || rooms < 1) throw new Error(`"rooms" must be >= 1, got: ${rooms}`);

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await hotelSearchPage.openRoomsDropdown();
    await hotelSearchPage.selectRoomCount(rooms);
    await hotelSearchPage.typeHotelDestination(where);
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: nights });
    const checkInDate = await hotelSearchPage.getCheckInDateValue();
    const checkOutDate = await hotelSearchPage.getCheckOutDateValue();
    await searchPage.waitAndClickSearchButton();
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

    return { searched: true, where, nights, rooms, checkInDate, checkOutDate }; 
  },

  /**
   * Searches for a hotel by number of nights.
   * Fills the search form, clicks Search, and waits for the results page URL to load.
   * Use this when no popup (e.g. trip purpose / reference fields) appears between
   * clicking Search and reaching results. See `initiateHotelSearch` for the alternative.
   */
  async searchHotelByNights(
    page,
    whereInput = hotelLocations.defaultLocation,
    options = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }
    
    let where, nights;

    // Legacy combined object support
    if (
      typeof whereInput === "object" &&
      whereInput !== null &&
      (whereInput.where || whereInput.destination) &&
      whereInput.nights !== undefined
    ) {
      where = resolveLocation(whereInput, ["where", "destination"], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    } else {
      where = resolveLocation(whereInput, ["where", "destination"], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    }

    if (nights < 1) {
      throw new Error(`"nights" must be >= 1. Got ${nights}`);
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    if (!options.fromDrawer) {
      await hotelSearchPage.clickHotelTab();
      await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    }

    await hotelSearchPage.typeHotelDestination(where);

    // Calendar flow
    const monthsAhead = options.monthsAhead || 3;
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow(monthsAhead);

    // Check-in + check-out selection
    await selectDatesByNthAvailable(page, {
      startIndex: 0,
      endIndex: nights,
    });
    const checkInDate = await hotelSearchPage.getCheckInDateValue();
    const checkOutDate = await hotelSearchPage.getCheckOutDateValue();

    if (options.fromDrawer) {
      await searchPage.waitAndClickPrimarySearchButtonFromCart();
    } else {
      await searchPage.waitAndClickSearchButton();
    }

    // Handle the "Proceed" confirmation modal that may appear before navigation
    // completes (e.g. conflicting trip items). Race it against the URL change so
    // tests without the modal are not delayed.
    const commonPage = getPageObject(page, CommonPage);
    await Promise.race([
      page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 }),
      commonPage.clickProceedButtonIfVisible(5000),
    ]);
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

    return { searched: true, where, nights, checkInDate, checkOutDate };
  },

  /**
   * Searches for a hotel, selecting dates from the next visible month
   * in the calendar without clicking the forward arrow.
   * @param {import('playwright').Page} page
   * @param {Object} whereInput - { where, nights, startDay? }
   * @param {number} [whereInput.startDay=1] - Day of month to check in (1-based)
   * @param {Object} [options]
   */
  async searchHotelByNightsNextVisibleMonth(
    page,
    whereInput = hotelLocations.defaultLocation,
    options = {},
  ) {
    if (!page) throw new Error('page is required');

    let where, nights;
    if (
      typeof whereInput === 'object' &&
      whereInput !== null &&
      (whereInput.where || whereInput.destination) &&
      whereInput.nights !== undefined
    ) {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    } else {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    }

    if (nights < 1) throw new Error(`"nights" must be >= 1. Got ${nights}`);

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    if (!options.fromDrawer) {
      await hotelSearchPage.clickHotelTab();
      await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    }

    const startDay = whereInput.startDay || options.startDay || 1;
    if (startDay < 1 || startDay > 28) throw new Error(`startDay must be between 1 and 28, got: ${startDay}`);
    const startIndex = startDay - 1;

    await hotelSearchPage.typeHotelDestination(where);
    await hotelSearchPage.clickCheckInField();

    // Select from the second visible month table (no arrow clicks)
    await selectDatesByNthAvailableFromNextVisibleMonth(page, {
      startIndex,
      endIndex: startIndex + nights,
    });
    const checkInDate = await hotelSearchPage.getCheckInDateValue();
    const checkOutDate = await hotelSearchPage.getCheckOutDateValue();

    await searchPage.waitAndClickSearchButton();

    const commonPage = getPageObject(page, CommonPage);
    await Promise.race([
      page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 }),
      commonPage.clickProceedButtonIfVisible(5000),
    ]);
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

    return { searched: true, where, nights, checkInDate, checkOutDate };
  },

  /**
   * Fills hotel search form and clicks the Search button, but does NOT wait
   * for navigation to the results page. Use this when a post-search popup
   * (e.g. trip purpose / reference fields) needs to be handled before results load.
   * After dismissing the popup, results will load normally.
   * Contrast with `searchHotelByNights`, which waits for the results URL immediately.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} whereInput - Destination or { where, nights }
   * @param {object} [options]
   * @param {number} [options.nights] - Number of nights
   * @returns {Promise<{where: string, nights: number}>}
   */
  async initiateHotelSearch(page, whereInput, options = {}) {
    if (!page) throw new Error('page is required');

    let where, nights;
    if (typeof whereInput === 'object' && whereInput !== null && (whereInput.where || whereInput.destination)) {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    } else {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await hotelSearchPage.typeHotelDestination(where);
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: nights });
    const checkInDate = await hotelSearchPage.getCheckInDateValue();
    const checkOutDate = await hotelSearchPage.getCheckOutDateValue();
    await searchPage.waitAndClickSearchButton();

    return { where, nights, checkInDate, checkOutDate };
  },

  /**
   * Waits for the hotel results page URL to load.
   * Use after `initiateHotelSearch` + any post-search popup handling.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async waitForHotelResults(page) {
    if (!page) throw new Error('page is required');
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
  },

  /**
   * Verifies the hotel destination field is pre-populated with the expected airport code.
   * Used to confirm the hotel search form inherits the flight destination when opened from the cart.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedAirport - Airport code to look for (e.g. "FRA")
   * @returns {Promise<void>}
   * @throws {Error} If the field is empty or does not contain the expected airport
   */
  async verifyHotelSearchPrePopulated(page, expectedAirport) {
    if (!page) throw new Error('page is required');
    if (!expectedAirport || typeof expectedAirport !== 'string') {
      throw new Error('expectedAirport must be a non-empty string, got: ' + typeof expectedAirport);
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const destinationValue = await hotelSearchPage.getHotelDestinationValue();

    if (!destinationValue) {
      throw new Error(`Hotel destination field is empty - expected it to be pre-populated with "${expectedAirport}"`);
    }

    expect(destinationValue).toBe(expectedAirport);
  },

  /**
   * Types text into the hotel search location field without selecting a suggestion.
   * Used to trigger the autocomplete dropdown for inspection.
   *
   * @param {import('playwright').Page} page
   * @param {string} text - Text to type in the location field
   */
  async typeInHotelSearchLocationField(page, text) {
    if (!page) throw new Error('page is required');
    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string, got: ' + typeof text);
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await hotelSearchPage.typeInHotelDestinationField(text);
  },

  /**
   * Verifies that a specific location appears as a suggestion in the hotel search autocomplete dropdown.
   *
   * @param {import('playwright').Page} page
   * @param {string} expectedSuggestion - Text expected to appear in a dropdown suggestion
   * @throws {Error} If the suggestion is not found in the dropdown
   */
  async verifyLocationSuggestionVisible(page, expectedSuggestion) {
    if (!page) throw new Error('page is required');
    if (!expectedSuggestion || typeof expectedSuggestion !== 'string') {
      throw new Error('expectedSuggestion must be a non-empty string, got: ' + typeof expectedSuggestion);
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const isVisible = await hotelSearchPage.isLocationSuggestionVisible(expectedSuggestion);
    expect(isVisible, `Expected "${expectedSuggestion}" to appear as a location suggestion in the dropdown`).toBe(true);
  },

  /**
   * Verifies the "Available properties only" checkbox is checked on the hotel search form.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async verifyAvailablePropertiesChecked(page) {
    if (!page) throw new Error('page is required');
    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const isChecked = await hotelSearchPage.isAvailablePropertiesChecked();
    expect(isChecked, 'Expected "Available properties only" checkbox to be checked').toBe(true);
  },

  /**
   * Opens the hotel search tab and verifies the "Available properties only" checkbox is checked.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async openHotelSearchAndVerifyAvailableProperties(page) {
    if (!page) throw new Error('page is required');
    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await this.verifyAvailablePropertiesChecked(page);
  },

  /**
   * Clicks the edit search button from results, verifies the "Available properties only"
   * checkbox is still checked, then closes the edit drawer.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async editHotelSearchAndVerifyAvailableProperties(page) {
    if (!page) throw new Error('page is required');
    const resultsPage = getPageObject(page, ResultsPage);

    await resultsPage.clickEditButton();
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForEditSearchDrawerVisible();
    await this.verifyAvailablePropertiesChecked(page);
    await searchPage.closeEditSearchDrawer();
  },

  /**
   * Opens the hotel search drawer from the cart product carousel and verifies
   * the "Available properties only" checkbox is still checked, then closes the drawer.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<void>}
   */
  async editHotelSearchFromCartAndVerifyAvailableProperties(page) {
    if (!page) throw new Error('page is required');
    const { CartPage } = require("@pages/CartPage");
    const cartPage = getPageObject(page, CartPage);

    await cartPage.clickAddHotelFromCarousel();
    await this.verifyAvailablePropertiesChecked(page);
    // Close the drawer by pressing Escape
    await page.keyboard.press('Escape');
  },

  /**
   * Searches for a hotel by selecting a Point of Interest from the POI modal.
   * Opens hotel tab → clicks bookmarks icon → selects first POI → sets dates → searches.
   *
   * @param {import('playwright').Page} page
   * @param {object} [options]
   * @param {number} [options.nights=3] - Number of nights
   * @returns {Promise<{searched: boolean, nights: number}>}
   */
  async searchHotelByPointOfInterest(page, options = {}) {
    if (!page) throw new Error('page is required');

    const nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
    if (nights < 1) throw new Error(`"nights" must be >= 1. Got ${nights}`);

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await hotelSearchPage.clickPoiBookmarksIcon();
    await hotelSearchPage.waitForPoiModal();
    await hotelSearchPage.clickFirstPoiItem();
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: nights });
    await searchPage.waitAndClickSearchButton();
    await page.waitForURL(/\/products\/hotels\/results/, { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });

    return { searched: true, nights };
  },
};

module.exports = HotelSearch;
