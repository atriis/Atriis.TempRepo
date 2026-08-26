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
      // Checked-luggage count to send with the search. null leaves the form's own default in
      // place (2, seeded by ground-transport.store.ts) — only pass a number when the scenario
      // cares which value reaches CheckedLuggageCount in the quote request.
      luggage = null,
      pickupIndex = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_INDEX,
      // "HH:mm" to change the pick-up time away from the form's own default (10:00, seeded by
      // ground-transport.store.ts); null leaves that default in place.
      pickupTime = null,
      // false fills the form but stops short of submitting it, so a test can read the values it
      // just entered before the search navigates away.
      clickSearch = true,
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

    // Number.isInteger rather than a bare "< 1": a Gherkin {string} that is not a number at all
    // converts to NaN, and every comparison against NaN is false, so a plain range check waves it
    // through and the traveller dropdown then fails on the unfindable option "NaN".
    if (!Number.isInteger(travellerNumber) || travellerNumber < 1) {
      throw new Error(`travellerNumber must be an integer >= 1, got ${travellerNumber}`);
    }

    if (pickupIndex < 0) {
      throw new Error(`pickupIndex must be >= 0, got ${pickupIndex}`);
    }

    if (luggage !== null && (!Number.isInteger(luggage) || luggage < 0)) {
      throw new Error(`luggage must be an integer >= 0 or null, got ${luggage}`);
    }

    if (pickupTime !== null && !/^\d{2}:\d{2}$/.test(String(pickupTime))) {
      throw new Error(`pickupTime must be a zero-padded "HH:mm" string or null, got: ${pickupTime}`);
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
    await groundTransportSearchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null,
    });

    // The time is set straight after the date so both pick-up fields are committed before the
    // vehicle/traveller row steals focus.
    if (pickupTime) {
      const [pickupHour, pickupMinute] = String(pickupTime).split(":");
      logger.debug("Changing the ground transport pick-up time", { pickupTime });
      await groundTransportSearchPage.setPickupTime(pickupHour, pickupMinute);
    }

    await groundTransportSearchPage.selectVehicleType(vehicleType);
    await groundTransportSearchPage.selectTravellerNumber(travellerNumber);

    // Luggage last: the traveller options are rebuilt from the chosen vehicle's capacity, so
    // touching the vehicle/traveller pair after the luggage count would be the only ordering
    // that could reset it.
    if (luggage !== null) {
      logger.debug("Setting the ground transport checked-luggage count", { luggage });
      await groundTransportSearchPage.selectLuggageNumber(luggage);
    }

    if (clickSearch) {
      await searchPage.clickSearchButton();
    }
  },

  /**
   * Fills an airport-to-airport ground transport search with a pick-up time that differs from the
   * form's own default, and stops before submitting it.
   *
   * Leaving the form filled but unsubmitted is the point: the entered pick-up date and time have
   * to be read off the screen (readSearchPickupDateAndTime) before the search navigates away, so
   * they can later be compared with what the cart shows.
   *
   * @param {import('playwright').Page} page
   * @param {string} from - Pick-up airport
   * @param {string} to - Drop-off airport
   * @returns {Promise<{filled: boolean, from: string, to: string, pickupTime: string}>}
   */
  async fillAirportToAirportSearchWithChangedPickupTime(page, from, to) {
    const pickupTime = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_TIME;

    await this.searchGroundTransport(page, {
      fromMode: "airport",
      toMode: "airport",
      from,
      to,
      pickupTime,
      clickSearch: false,
    });

    return { filled: true, from, to, pickupTime };
  },

  /**
   * Searches airport-to-specific-address with a pick-up time that differs from the form's own
   * default, and submits it.
   *
   * The manual test case searches with a non-default pick-up time
   * (SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_TIME, 14:30, against the 10:00 that
   * ground-transport.store.ts seeds); what the caller asserts afterwards does not depend on it.
   *
   * @param {import('playwright').Page} page
   * @param {string} from - Pick-up airport
   * @param {string} to - Drop-off address
   * @returns {Promise<{from: string, to: string, pickupTime: string}>}
   */
  async searchAirportToSpecificAddressWithChangedPickupTime(page, from, to) {
    const pickupTime = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_TIME;

    await this.searchGroundTransportFromAirportToSpecificAddress(page, { from, to }, { pickupTime });

    return { from, to, pickupTime };
  },

  /**
   * Reads the pick-up date and time currently committed in the ground transport search form.
   *
   * Used by tests that have to prove the searched values survive into the cart, so it is called
   * while the filled form is still on screen (before the search is submitted).
   *
   * @param {import('playwright').Page} page
   * @returns {Promise<{date: string, time: string}>} Both as the form renders them — the date
   *   carries no year (app-datepicker's 'ddd, DD MMM' format)
   */
  async readSearchPickupDateAndTime(page) {
    if (!page) {
      throw new Error("page is required");
    }

    const groundTransportSearchPage = getPageObject(page, GroundTransportSearchPage);
    const date = await groundTransportSearchPage.getPickupDateValue();
    const time = await groundTransportSearchPage.getPickupTimeValue();

    if (!date || !time) {
      throw new Error(
        "[GroundTransportSearch.readSearchPickupDateAndTime] The ground transport search form's "
        + `pick-up date/time is still empty (date: "${date}", time: "${time}"). The date was `
        + "probably never picked from the calendar, so there is nothing to compare the cart with.",
      );
    }

    logger.info("Read the ground transport pick-up date and time from the search form", { date, time });

    return { date, time };
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
   * @param {string|null} options.pickupTime - "HH:mm" to change the pick-up time away from the
   *   form's own default; null leaves that default in place
   * @throws {Error} If travellerNumber < 1 or pickupIndex < 0
   */
  async searchGroundTransportFromAirportToSpecificAddress(
    page,
    routeInput = groundTransportRoutes.defaultRoute,
    {
      vehicleType = groundTransportRoutes.vehicleTypes.all,
      travellerNumber = 1,
      pickupIndex = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_INDEX,
      pickupTime = null,
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
      pickupTime,
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
