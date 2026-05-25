const { getPageObject } = require("@utils/pageObjectCache");
const ManualQuoteSearchPage = require("@pages/ManualQuoteSearchPage");
const FlightSearchPage = require("@pages/FlightSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const flightRoutes = require("@data/flights.json");
const { selectDatesByNthAvailable, selectDateAfterAdvancingMonths } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const logger = require("@utils/logger").child("ManualQuoteSearch-DSL");

/**
 * DSL for Manual Quote Search functionality.
 * Provides business-level methods for creating manual flight quotes.
 */
const ManualQuoteSearch = {
  /**
   * Performs a complete manual quote search for a flight.
   * Fills in route, dates, carrier details, and adds the quote to the trip.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} routeInput - Route identifier (e.g., "LHR-JFK")
   * @param {number} departureIndex - Index of departure date in calendar
   * @param {number} returnIndex - Index of return date in calendar
   */
  async searchAndAddFlightManualQuote(
    page,
    routeInput = flightRoutes.defaultRoute,
    departureIndex = SEARCH_DEFAULTS.FLIGHT.DEPARTURE_INDEX,
    returnIndex = SEARCH_DEFAULTS.FLIGHT.RETURN_INDEX,
  ) {
    const { from, to } = resolveRoute(routeInput, flightRoutes.routes, "flight");
    logger.info("Starting manual quote flight search", { from, to });

    const flightSearchPage = getPageObject(page, FlightSearchPage);
    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    // Navigate to the manual quote flight tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.waitForEnterAirportLocationPlaceholderVisible();
    await flightSearchPage.clickFlightTab();

    // Fill in route details
    await manualQuoteSearchPage.fillInDepartingFromField(from);
    await manualQuoteSearchPage.fillInArrivingToField(to);
    await manualQuoteSearchPage.typeFlightNumber("765");

    // Select departure date
    await manualQuoteSearchPage.clickDepartingDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: departureIndex,
      endIndex: null, // Single date selection for departure
    });

    // TODO: Add return date selection once a stable locator is available
    // Current RETURNING_DATE_INPUT selector matches multiple elements

    // Fill in carrier details
    await manualQuoteSearchPage.typeCarrierLocator("TP");
    await manualQuoteSearchPage.typeCarrierName("TAP Air Portugal (TP)");
    await manualQuoteSearchPage.clickCarrierDropdownOption("TAP Air Portugal (TP)");

    // Set default times (required by UI to enable submission)
    await manualQuoteSearchPage.clickStartTime();
    await manualQuoteSearchPage.clickEndTime();

    // Enter pricing and add quote to cart
    await manualQuoteSearchPage.typeBaseFare("10");
    await manualQuoteSearchPage.clickAddQuoteButton();
  },

  /**
   * Adds a hotel manual quote using the "Enter details manually" mode.
   * Fills the minimum required fields (hotel name, address, city, dates,
   * number of rooms, cancellation policy, confirmation, room description,
   * base fare) and submits the quote.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} city - City text used in the address autocomplete (e.g. "Portland")
   * @param {Object} [options]
   * @param {number} [options.numberOfRooms=4] - Number of rooms to select
   * @param {string} [options.hotelName="Test Hotel"]
   * @param {string} [options.address="123 Main St"]
   * @param {string} [options.confirmationNum="12345"]
   * @param {string} [options.roomDescription="Standard double"]
   * @param {string} [options.cancellationPolicy="48HRS Prior to Arrival"]
   * @param {string|number} [options.baseFare=100]
   * @param {number} [options.checkInIndex=2] - Nth available day in calendar for check-in
   * @param {number} [options.checkOutIndex=5] - Nth available day in calendar for check-out
   */
  async addHotelManualQuote(page, city, options = {}) {
    if (!page) throw new Error("page is required");
    if (typeof city !== "string" || !city.trim()) {
      throw new Error("city must be a non-empty string, got: " + typeof city);
    }
    if (options !== null && typeof options !== "object") {
      throw new Error("options must be an object, got: " + typeof options);
    }

    const {
      numberOfRooms = 4,
      hotelName = "Test Hotel",
      address = "123 Main St",
      confirmationNum = "12345",
      roomDescription = "Standard double",
      cancellationPolicy = "48HRS Prior to Arrival",
      baseFare = 10,
      checkInIndex = 2,
      checkOutIndex = 5,
    } = options;

    if (!Number.isInteger(numberOfRooms) || numberOfRooms < 1) {
      throw new Error(
        "options.numberOfRooms must be a positive integer, got: " + numberOfRooms,
      );
    }

    logger.info("Adding hotel manual quote", { city, numberOfRooms, hotelName });

    const manualQuoteSearchPage = getPageObject(page, ManualQuoteSearchPage);

    // Navigate to manual quote → Hotel sub-tab
    await manualQuoteSearchPage.clickManualQuoteTab();
    await manualQuoteSearchPage.clickHotelSubTab();
    await manualQuoteSearchPage.waitForHotelFormVisible();

    // Form defaults to "Search location" mode; switch to manual entry so the
    // hotel name / address / dates / rooms fields become visible.
    await manualQuoteSearchPage.selectHotelManualEntryMode();

    // Basic hotel info
    await manualQuoteSearchPage.typeHotelName(hotelName);
    await manualQuoteSearchPage.typeHotelAddress(address);
    await manualQuoteSearchPage.selectHotelCity(city);

    // Check-in / check-out dates. Advance 2 months ahead for each date to
    // avoid past/unavailable days and ensure stability.
    await manualQuoteSearchPage.clickHotelDateInput(0);
    await selectDateAfterAdvancingMonths(page, {
      monthsToAdvance: 2,
      dayIndex: checkInIndex,
    });
    await manualQuoteSearchPage.clickHotelDateInput(1);
    await selectDateAfterAdvancingMonths(page, {
      monthsToAdvance: 2,
      dayIndex: checkOutIndex,
    });

    // Number of rooms (label-scoped)
    await manualQuoteSearchPage.openHotelSelect("numberOfRooms");
    await manualQuoteSearchPage.clickDropdownOptionByText(`${numberOfRooms} Rooms`);

    // Cancellation policy (label-scoped)
    await manualQuoteSearchPage.openHotelSelect("cancellationPolicy");
    await manualQuoteSearchPage.clickDropdownOptionByText(cancellationPolicy);

    // Confirmation + room description
    await manualQuoteSearchPage.typeHotelConfirmationNumber(confirmationNum);
    await manualQuoteSearchPage.typeHotelRoomDescription(roomDescription);

    // Base fare + submit
    await manualQuoteSearchPage.typeHotelBaseFare(baseFare);
    await manualQuoteSearchPage.clickAddQuoteButton();

    return {
      added: true,
      city,
      numberOfRooms,
      hotelName,
      address,
      confirmationNum,
      roomDescription,
      cancellationPolicy,
      baseFare,
    };
  },
};

module.exports = ManualQuoteSearch;
