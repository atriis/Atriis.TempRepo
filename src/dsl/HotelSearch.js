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
   * Searches for a hotel by number of nights.
   */
  async searchHotelByNights(
    page,
    whereInput = hotelLocations.defaultLocation,
    options = {},
  ) {
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

    const hotelSearchPage = new HotelSearchPage(page);
    const searchPage = new SearchPage(page);

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

    await searchPage.clickSearchButton();

    return { searched: true, where, nights };
  },
};

module.exports = HotelSearch;
