const { getPageObject } = require("@utils/pageObjectCache");
const GroundTransportSearchPage = require("@pages/GroundTransportSearchPage");
const { SearchPage } = require("@pages/SearchPage");
const { selectDatesByNthAvailable } = require("@utils/calendar.helper");
const { resolveRoute } = require("@utils/route.helper");
const { SEARCH_DEFAULTS } = require("@utils/search.constants");
const { CartPage } = require("@pages/CartPage");
const logger = require("@utils/logger").child("GroundTransportSearch-DSL");
const groundTransportRoutes = require("@data/groundtransport.json");

/**
 * GroundTransportSearch DSL
 *
 * Describes how users search for ground transportation.
 */

const GroundTransportSearch = {
  async searchGroundTransport(
    page,
    {
      fromMode = "airport",
      toMode = "specificAddress",
      from,
      to,
      vehicleType = groundTransportRoutes.vehicleTypes.all,
      travellerNumber = 1,
      pickupIndex = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_INDEX,
    } = {},
  ) {
    if (!page) {
      throw new Error('page is required');
    }

    if (!from || typeof from !== 'string') {
      throw new Error('from must be a non-empty string');
    }

    if (!to || typeof to !== 'string') {
      throw new Error('to must be a non-empty string');
    }

    if (travellerNumber < 1) {
      throw new Error(`travellerNumber must be >= 1, got ${travellerNumber}`);
    }

    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }

    const groundTransportSearchPage = getPageObject(page, GroundTransportSearchPage);
    const searchPage = getPageObject(page, SearchPage);

    await groundTransportSearchPage.clickGroundTransportTab();

    if (fromMode === "airport") {
      await groundTransportSearchPage.clickFromAirport();
    } else if (fromMode === "specificAddress") {
      await groundTransportSearchPage.clickFromSpecificAddress();
    } else {
      throw new Error(`fromMode must be "airport" or "specificAddress", got ${fromMode}`);
    }

    await groundTransportSearchPage.fillInPickUpField(from);

    if (toMode === "airport") {
      await groundTransportSearchPage.clickToAirport();
    } else if (toMode === "specificAddress") {
      await groundTransportSearchPage.clickToSpecificAddress();
    } else {
      throw new Error(`toMode must be "airport" or "specificAddress", got ${toMode}`);
    }

    await groundTransportSearchPage.fillInDropOffField(to);
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    await groundTransportSearchPage.selectVehicleType(vehicleType);
    await groundTransportSearchPage.selectTravellerNumber(travellerNumber);
    await searchPage.clickSearchButton();
  },

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
   * @param {number} options.travellerNumber - Number of travellers (>= 1)
   * @param {number} options.pickupIndex - Calendar index for pickup date (>= 0)
   * @throws {Error} If travellerNumber < 1 or pickupIndex < 0
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

    await this.searchGroundTransport(page, {
      fromMode: "airport",
      toMode: "specificAddress",
      from,
      to,
      vehicleType,
      travellerNumber,
      pickupIndex,
    });
  },

  /**
   * Opens the ground transport search drawer from a cart cross-sell suggestion.
   *
   * The cart offers a transfer for the destination of an already-booked product; taking that
   * offer opens the edit-search drawer with the pick-up airport and the flight's carrier already
   * filled in from the booked flight.
   *
   * @param {import('playwright').Page} page
   * @param {string} suggestionTitle - The suggestion card's sentence
   */
  async searchFromCartSuggestion(page, suggestionTitle) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!suggestionTitle || typeof suggestionTitle !== "string") {
      throw new Error(`suggestionTitle must be a non-empty string, got: ${typeof suggestionTitle}`);
    }

    logger.info("Opening the ground transport search drawer from a cart suggestion", { suggestionTitle });

    const cartPage = getPageObject(page, CartPage);
    const groundTransportSearchPage = getPageObject(page, GroundTransportSearchPage);

    await cartPage.clickCrossSellSuggestionByTitle(suggestionTitle);
    await groundTransportSearchPage.waitForEditSearchDrawerReady();

    return { opened: true, suggestionTitle };
  },

  /**
   * Reads the pick-up location prefilled in the search drawer.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>}
   */
  async readSearchDrawerPickupLocation(page) {
    if (!page) {
      throw new Error("page is required");
    }

    return getPageObject(page, GroundTransportSearchPage).getEditSearchPickupValue();
  },

  /**
   * Reads the carrier prefilled in the search drawer's Airline field.
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The carrier name, or "" while the field is still empty
   */
  async readSearchDrawerAirline(page) {
    if (!page) {
      throw new Error("page is required");
    }

    return getPageObject(page, GroundTransportSearchPage).getEditSearchAirlineValue();
  },

  /**
   * Completes the prefilled search drawer and submits it.
   *
   * Vehicle type is set before the traveller count on purpose: the traveller options are built
   * from the selected vehicle's capacity, so the traveller dropdown is empty until a vehicle
   * type has been chosen.
   *
   * @param {import('playwright').Page} page
   * @param {Object} options
   * @param {string} options.dropOffLocation - Drop-off address to search for
   * @param {string} options.vehicleType - Vehicle type option label
   * @param {number} options.travellerNumber - Number of travellers (>= 1)
   */
  async completeSearchDrawerAndSearch(page, { dropOffLocation, vehicleType, travellerNumber } = {}) {
    if (!page) {
      throw new Error("page is required");
    }

    if (!dropOffLocation || typeof dropOffLocation !== "string") {
      throw new Error(`dropOffLocation must be a non-empty string, got: ${typeof dropOffLocation}`);
    }

    if (!vehicleType || typeof vehicleType !== "string") {
      throw new Error(`vehicleType must be a non-empty string, got: ${typeof vehicleType}`);
    }

    if (!Number.isInteger(travellerNumber) || travellerNumber < 1) {
      throw new Error(`travellerNumber must be an integer >= 1, got: ${travellerNumber}`);
    }

    logger.info("Completing the prefilled ground transport search drawer", {
      dropOffLocation,
      vehicleType,
      travellerNumber,
    });

    const groundTransportSearchPage = getPageObject(page, GroundTransportSearchPage);

    await groundTransportSearchPage.fillEditSearchDropOffField(dropOffLocation);
    await groundTransportSearchPage.selectEditSearchVehicleType(vehicleType);
    await groundTransportSearchPage.selectEditSearchTravellerNumber(travellerNumber);
    await groundTransportSearchPage.clickEditSearchSubmitButton();

    return { searched: true, dropOffLocation, vehicleType, travellerNumber };
  },
};

module.exports = GroundTransportSearch;
