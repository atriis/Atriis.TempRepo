const GroundTransportSearchPage = require('@pages/GroundTransportSearchPage');
const { SearchPage, SELECTORS: SEARCH_SELECTORS } = require('@pages/SearchPage');
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');
const { resolveRoute } = require('@utils/route.helper');
const { SEARCH_DEFAULTS } = require('@utils/search.constants');
const groundTransportRoutes = require('@data/groundtransport.json');
const { pressTab } = require('@utils/dom');

/**
 * GroundTransportSearch DSL
 *
 * Describes how users search for ground transportation.
 */

const GroundTransportSearch = {
  /**
   * Fills the pick-up location field and commits the value.
   *
   * Types into the pick-up field and presses TAB to trigger
   * blur/validation logic. Waits until the field loses focus
   * to ensure the input was applied.
   */
  async fillInPickUpField(page, from) {
    const pickUpInput = page
      .locator(SEARCH_SELECTORS.PICK_UP_PLACEHOLDER)
      .first();

    await pickUpInput.fill(from);

    // Commit value
    await pressTab(page);

    // Ensure the field lost focus (input applied)
    await expect(pickUpInput).not.toBeFocused();
  },

  /**
   * Fills the drop-off location field and commits the value.
   *
   * Types into the drop-off field and presses TAB to trigger
   * blur/validation logic. Waits until the field loses focus
   * to ensure the input was applied.
   */
  async fillInDropOffField(page, to) {
    const dropOffInput = page
      .locator(SEARCH_SELECTORS.DROP_OFF_PLACEHOLDER)
      .first();

    await dropOffInput.fill(to);

    // Commit value
    await pressTab(page);

    // Ensure the field lost focus (input applied)
    await expect(dropOffInput).not.toBeFocused();
  },

  async searchGroundTransportFromAirportToSpecificAddress(
    page,
    routeInput = groundTransportRoutes.defaultRoute,
    { 
      vehicleType = groundTransportRoutes.vehicleTypes.all,
      travellerNumber = 1,
      pickupIndex = SEARCH_DEFAULTS.GROUND_TRANSPORT.PICKUP_INDEX 
    } = {}
  ) {
    const { from, to } = resolveRoute(
      routeInput,
      groundTransportRoutes.routes,
      "groundtransport"
    );
    
    const groundTransportSearchPage = new GroundTransportSearchPage(page);
    const searchPage = new SearchPage(page);

    await groundTransportSearchPage.clickGroundTransportTab();
    await groundTransportSearchPage.clickFromAirport();
    await this.fillInPickUpField(page, from);
    await groundTransportSearchPage.clickToSpecificAddress();
    await this.fillInDropOffField(page, to);
    await searchPage.clickPickupDateField();
    await searchPage.clickCalendarNextArrow();
    await selectDatesByNthAvailable(page, {
      startIndex: pickupIndex,
      endIndex: null
    });
    
    // Select vehicle type (mandatory field)
    await groundTransportSearchPage.selectVehicleType(vehicleType);

    // Select traveller number (mandatory field)
    await groundTransportSearchPage.selectTravellerNumber(travellerNumber);
    
    await searchPage.clickSearchButton();
  }
};

module.exports = GroundTransportSearch;
