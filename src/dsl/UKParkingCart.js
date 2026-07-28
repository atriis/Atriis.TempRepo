const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingCartPage = require("@pages/UKParkingCartPage");

/**
 * UKParkingCart DSL
 *
 * Provides business-level methods for the UK Parking "Trip overview" cart extras
 * (Contact Information + Delivery/Pickup). All business logic for this flow should
 * be placed here.
 */
const UKParkingCart = {
  /**
   * Fills in the Trip overview Contact Information and Delivery/Pickup extras
   * required to complete a UK parking booking, then saves each section.
   *
   * @param {Object} page - Playwright page instance
   * @param {Object} details
   * @param {string} details.mobile - Contact mobile/cell phone number
   * @param {string} details.carMake - Car manufacturer
   * @param {string} details.model - Vehicle model
   * @param {string} details.registration - Car registration
   * @param {string} details.colour - Car colour
   * @param {string} details.outboundFlight - Outbound flight number
   * @param {string} details.terminal - Outbound terminal
   * @param {string} details.returnFlight - Return flight number
   * @param {string} details.returnTerminal - Return terminal
   */
  async fillTripOverviewDetails(page, details) {
    if (!page) throw new Error('page is required');

    const requiredFields = [
      'mobile', 'carMake', 'model', 'registration', 'colour',
      'outboundFlight', 'terminal', 'returnFlight', 'returnTerminal',
    ];
    for (const field of requiredFields) {
      const value = details?.[field];
      if (!value || typeof value !== 'string') {
        throw new Error(`details.${field} must be a non-empty string, got: ${typeof value}`);
      }
    }

    const { mobile, carMake, model, registration, colour, outboundFlight, terminal, returnFlight, returnTerminal } = details;
    const ukParkingCartPage = getPageObject(page, UKParkingCartPage);

    await ukParkingCartPage.waitForTripOverviewReady();

    await ukParkingCartPage.expandContactInformation();
    await ukParkingCartPage.fillPhoneNumber(mobile);
    await ukParkingCartPage.fillCarManufacturer(carMake);
    await ukParkingCartPage.fillVehicleModel(model);
    await ukParkingCartPage.fillCarRegistration(registration);
    await ukParkingCartPage.fillCarColour(colour);
    await ukParkingCartPage.saveContactInformation();

    await ukParkingCartPage.expandDeliveryPickup();
    await ukParkingCartPage.fillOutboundFlightNumber(outboundFlight);
    await ukParkingCartPage.fillOutboundTerminal(terminal);
    await ukParkingCartPage.fillReturnFlightNumber(returnFlight);
    await ukParkingCartPage.fillReturnTerminal(returnTerminal);
    await ukParkingCartPage.saveDeliveryPickup();
  },
};

module.exports = UKParkingCart;
