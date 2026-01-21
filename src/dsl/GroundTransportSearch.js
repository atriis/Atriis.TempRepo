const GroundTransportSearchPage = require('@pages/GroundTransportSearchPage');
const SearchPage = require('@pages/SearchPage');
const { selectDatesByNthAvailable } = require('@utils/calendar.helper');
const { resolveRoute } = require('@utils/route.helper');
const { SEARCH_DEFAULTS } = require('@utils/search.constants');
const groundTransportRoutes = require('@data/groundtransport.json');
const { pressTab } = require('@utils/dom');
const { SELECTORS: SEARCH_SELECTORS } = require('@pages/SearchPage');

/**
 * GroundTransportSearch DSL
 *
 * Describes how users search for ground transportation.
 */
const GroundTransportSearch = {

  async fillInPickUpField(page, from) {
    await page.locator(SEARCH_SELECTORS.PICK_UP_PLACEHOLDER).first().fill(from);
    await page.waitForTimeout(1000);
    await pressTab(page);
  },

  async fillInDropOffField(page, to) {
    await page.locator(SEARCH_SELECTORS.DROP_OFF_PLACEHOLDER).first().fill(to);
    await page.waitForTimeout(1000);
    await pressTab(page);
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
