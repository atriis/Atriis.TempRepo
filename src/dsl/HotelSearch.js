const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const HotelSearchPage = require("@pages/HotelSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { CommonPage } = require("@pages/CommonPage");
const { ResultsPage } = require("@pages/ResultsPage");
const { selectDatesByNthAvailable, selectDatesByNthAvailableFromNextVisibleMonth, advanceCalendarUntilMonthVisible, clickDayInVisibleMonth } = require("@utils/calendar.helper");
const { resolveLocation } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const hotelLocations = require("@data/hotels.json");

/** Results URL a submitted hotel search lands on. */
const HOTEL_RESULTS_URL = /\/products\/hotels\/results/;

/** Any popup that GATES a submitted search (reference fields, trip purpose, conflicting items). */
const GATING_DIALOG = '.el-dialog:visible';

/**
 * Clicks Search and confirms the click actually submitted, re-clicking if it did not.
 *
 * A Search click that lands while the Element Plus date popper is closing or the traveller chips
 * re-render is silently SWALLOWED: the button reports itself enabled, nothing submits, and the run
 * sits on a fully filled-in search form. `waitAndClickSearchButton` only proves the button was
 * enabled, so the swallow surfaces several steps later as an unrelated-looking failure ("the
 * reference fields popup never opened"). Same shape as EvolviSearch.clickSearchUntilSubmitted.
 *
 * A submitted search produces exactly one of two observable outcomes: a gating popup opens over the
 * form, or the page reaches the hotel results URL. Waiting for either costs a correctly-submitted
 * search nothing — it returns as soon as the outcome appears.
 *
 * @param {import('playwright').Page} page
 * @param {import('@pages/SearchPage').SearchPage} searchPage
 * @param {object} [options]
 * @param {number} [options.attempts=3] - How many times to click before giving up.
 * @param {number} [options.timeout=15000] - How long to wait for an outcome after each click.
 * @returns {Promise<void>}
 * @throws {Error} If no click produced a popup or the results URL.
 */
async function clickSearchUntilSubmitted(page, searchPage, { attempts = 3, timeout = 15000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await searchPage.waitAndClickSearchButton();

    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (HOTEL_RESULTS_URL.test(page.url())) return;
      if (await page.locator(GATING_DIALOG).first().isVisible().catch(() => false)) return;
      await page.waitForTimeout(250);
    }
  }

  throw new Error(
    `Hotel search was never submitted: clicked Search ${attempts} times and the page neither opened ` +
    `a popup nor reached the results URL (still on ${page.url()}). The click is being swallowed.`
  );
}

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
   * ADO 77842 — same as searchHotelByNights but selects near-term ("close") dates:
   * check-in CLOSE_CHECKIN_OFFSET_DAYS (43) days from today and check-out check-in + nights
   * (so "1 night" → 44 days from today). Some supplier fixtures (e.g. the GoGlobal
   * price-change hotels) only surface for near-term stays, so this variant targets a specific
   * close date rather than a month-ahead nth-available day. Does NOT modify searchHotelByNights.
   *
   * @param {import('playwright').Page} page
   * @param {string|object} whereInput - Destination string or object with { where, nights }
   * @param {object} [options]
   * @param {number} [options.nights] - Number of nights (when whereInput is a string)
   * @returns {Promise<{searched: boolean, where: string, nights: number, checkInDate: string, checkOutDate: string}>}
   */
  async searchHotelByCloseDates(
    page,
    whereInput = hotelLocations.defaultLocation,
    options = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    let where, nights;
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

    // Check-in 43 days from today; check-out check-in + nights (1 night → 44 days out).
    const CLOSE_CHECKIN_OFFSET_DAYS = 43;
    const today = new Date();
    const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + CLOSE_CHECKIN_OFFSET_DAYS);
    const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + CLOSE_CHECKIN_OFFSET_DAYS + nights);

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();
    await hotelSearchPage.typeHotelDestination(where);

    // Calendar flow — advance to and click the specific close-in dates.
    await hotelSearchPage.clickCheckInField();
    const checkInTableIndex = await advanceCalendarUntilMonthVisible(page, checkIn);
    await clickDayInVisibleMonth(page, checkIn, checkInTableIndex);
    const checkOutTableIndex = await advanceCalendarUntilMonthVisible(page, checkOut);
    await clickDayInVisibleMonth(page, checkOut, checkOutTableIndex);

    const checkInDate = await hotelSearchPage.getCheckInDateValue();
    const checkOutDate = await hotelSearchPage.getCheckOutDateValue();

    await searchPage.waitAndClickSearchButton();

    // Handle the optional "Proceed" confirmation modal, racing it against navigation.
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
   * @param {string|object} whereInput - Destination or { where, nights, rooms }
   * @param {object} [options]
   * @param {number} [options.nights] - Number of nights
   * @param {number} [options.rooms] - Number of rooms to select before typing the destination.
   *   Omit for the single-room default (the form's own default is left untouched).
   * @returns {Promise<{where: string, nights: number, rooms: number|null}>}
   */
  async initiateHotelSearch(page, whereInput, options = {}) {
    // Same form-fill as fillHotelSearchWithoutSearching, then click Search (but don't wait for the
    // results URL — a post-search popup may need handling first). Delegating keeps the two in sync.
    const result = await this.fillHotelSearchWithoutSearching(page, whereInput, options);
    const searchPage = getPageObject(page, SearchPage);
    await clickSearchUntilSubmitted(page, searchPage);
    return result;
  },

  /**
   * Fills the hotel search form (destination + check-in/check-out dates) but does NOT click the
   * Search button. Use when the search parameters must be carried into another flow — e.g. opening
   * the request-assistance form, which pre-populates its hotel item from the unsubmitted search.
   * Contrast with `initiateHotelSearch`, which clicks Search (without waiting for results).
   *
   * @param {import('playwright').Page} page
   * @param {string|object} whereInput - Destination or { where, nights, rooms }
   * @param {object} [options]
   * @param {number} [options.nights] - Number of nights
   * @param {number} [options.rooms] - Number of rooms to select before typing the destination.
   *   Omit for the single-room default (the form's own default is left untouched).
   * @returns {Promise<{where: string, nights: number, rooms: number|null, checkInDate: string, checkOutDate: string}>}
   */
  async fillHotelSearchWithoutSearching(page, whereInput, options = {}) {
    if (!page) throw new Error('[HotelSearch.fillHotelSearchWithoutSearching] "page" is required.');

    let where, nights, rooms;
    if (typeof whereInput === 'object' && whereInput !== null && (whereInput.where || whereInput.destination)) {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = whereInput.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
      rooms = whereInput.rooms ?? options.rooms ?? null;
    } else {
      where = resolveLocation(whereInput, ['where', 'destination'], hotelLocations);
      nights = options.nights || SEARCH_DEFAULTS.HOTEL.NIGHTS;
      rooms = options.rooms ?? null;
    }
    if (nights < 1) throw new Error(`[HotelSearch.fillHotelSearchWithoutSearching] "nights" must be >= 1, got: ${nights}`);
    if (rooms !== null && (typeof rooms !== 'number' || !Number.isInteger(rooms) || rooms < 1)) {
      throw new Error(`[HotelSearch.fillHotelSearchWithoutSearching] "rooms" must be an integer >= 1 when provided, got: ${typeof rooms} (${rooms})`);
    }

    const hotelSearchPage = getPageObject(page, HotelSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    try {
      await hotelSearchPage.clickHotelTab();
      await hotelSearchPage.waitForBookAndStayAtYourHotelText();
      // Rooms first, matching searchHotelMultiRoom: the rooms dropdown popper overlays the
      // destination autocomplete, so picking the count after typing can swallow the suggestion click.
      if (rooms !== null) {
        await hotelSearchPage.openRoomsDropdown();
        await hotelSearchPage.selectRoomCount(rooms);
      }
      await hotelSearchPage.typeHotelDestination(where);
      await hotelSearchPage.clickCheckInField();
      await searchPage.clickCalendarNextArrow();
      await selectDatesByNthAvailable(page, { startIndex: 0, endIndex: nights });
      const checkInDate = await hotelSearchPage.getCheckInDateValue();
      const checkOutDate = await hotelSearchPage.getCheckOutDateValue();
      // Intentionally NO search click — the caller carries these params into the next flow.
      return { where, nights, rooms, checkInDate, checkOutDate };
    } catch (err) {
      throw new Error(
        `[HotelSearch.fillHotelSearchWithoutSearching] Could not fill the hotel search for "${where}" (${nights} night(s)` +
        `${rooms !== null ? `, ${rooms} room(s)` : ''}) without searching. The hotel tab, rooms dropdown, destination ` +
        `autocomplete, or calendar may not have been ready. Original: ${err.message}`
      );
    }
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
