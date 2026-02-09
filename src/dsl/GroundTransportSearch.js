const GroundTransportSearchPage = require("@pages/GroundTransportSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const groundTransportRoutes = require("@data/groundtransport.json");

/**
 * GroundTransportSearch DSL
 *
 * Describes how users search for ground transportation.
 */

const GroundTransportSearch = {
  /**
   * Searches for ground transport from an airport to a specific address.
   *
   * Steps:
   * 1. Navigates to Ground Transport tab
   * 2. Selects "From Airport" option
   * 3. Fills pickup location
   * 4. Selects "To Specific Address" option
   * 5. Fills drop-off location
   * 6. Selects pickup date
   * 7. Selects vehicle type and traveller count
   * 8. Executes search
   *
   * @param {Object} page - Playwright page instance
   * @param {string|Object} routeInput - Route name or route object with from/to
   * @param {Object} options - Optional search parameters
   * @param {string} options.vehicleType - Vehicle type filter
   * @param {number} options.travellerNumber - Number of travellers
   * @param {number} options.pickupIndex - Calendar index for pickup date
   */
  async searchGroundTransportFromAirportToSpecificAddress(
    page,
    routeInput = groundTransportRoutes.defaultRoute,
    {
      vehicleType = groundTransportRoutes.vehicleTypes.all,
      travellerNumber = 1,
      pickupIndex = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_INDEX,
    } = {},
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      groundTransportRoutes.routes,
      "groundtransport",
    );

    const groundTransportSearchPage = new GroundTransportSearchPage(page);
    const searchPage = new SearchPage(page);

    await groundTransportSearchPage.clickGroundTransportTab();
    await groundTransportSearchPage.clickFromAirport();
    await groundTransportSearchPage.fillInPickUpField(from);
    await groundTransportSearchPage.clickToSpecificAddress();
    await groundTransportSearchPage.fillInDropOffField(to);
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // Select vehicle type (mandatory field)
    await groundTransportSearchPage.selectVehicleType(vehicleType);

    // Select traveller number (mandatory field)
    await groundTransportSearchPage.selectTravellerNumber(travellerNumber);

    await searchPage.clickSearchButton();
  },
};

module.exports = GroundTransportSearch;
