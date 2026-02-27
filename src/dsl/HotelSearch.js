const { getPageObject } = require("@utils/pageObjectCache");
const HotelSearchPage = require("@pages/HotelSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
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
    await searchPage.waitAndClickSearchButton();

    return { searched: true, where, nights, rooms };
  },

  /**
   * Searches for a hotel by number of nights.
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

    await hotelSearchPage.clickHotelTab();
    await hotelSearchPage.waitForBookAndStayAtYourHotelText();

    await hotelSearchPage.typeHotelDestination(where);

    // Calendar flow
    await hotelSearchPage.clickCheckInField();
    await searchPage.clickCalendarNextArrow();

    // Check-in + check-out selection
    await selectDatesByNthAvailable(page, {
      startIndex: 0,
      endIndex: nights,
    });

    await searchPage.waitAndClickSearchButton();

    return { searched: true, where, nights };
  },
};

module.exports = HotelSearch;
