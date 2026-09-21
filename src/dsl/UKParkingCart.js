const { getPageObject } = require("@utils/pageObjectCache");
const UKParkingCartPage = require("@pages/UKParkingCartPage");
const logger = require("@utils/logger").child("UKParkingCart-DSL");

/**
 * Registration value a scenario passes to ask for a freshly generated plate instead of a literal.
 *
 * The UK parking supplier de-duplicates incoming bookings and answers a repeat with "We are unable
 * to process this booking as it appears similar to a recent request", which fails the run at Book &
 * Finalize. The car registration is part of that signature, so a scenario that books with a
 * hardcoded plate passes once and then collides with its own previous run forever.
 */
const UNIQUE_REGISTRATION_TOKEN = 'unique';

/**
 * Builds a plate in the standard UK format the field itself advertises (placeholder "BD51 SMR"):
 * two letters, two digits, a space, three letters. ~1.2 billion combinations, which is far more
 * than enough to keep consecutive runs from repeating one another.
 *
 * @returns {string} e.g. "KP73 XMV"
 */
function generateUKCarRegistration() {
  const letters = 'ABCDEFGHJKLMNOPRSTUVWXYZ'; // I and Q are not used on UK plates
  const pick = (source) => source[Math.floor(Math.random() * source.length)];
  const letter = () => pick(letters);
  const digit = () => pick('0123456789');

  return `${letter()}${letter()}${digit()}${digit()} ${letter()}${letter()}${letter()}`;
}

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
   * @param {string} details.registration - Car registration, or the literal "unique" to have a
   *   fresh plate generated for this run (see UNIQUE_REGISTRATION_TOKEN — required by any scenario
   *   that goes on to book, because the supplier rejects a repeated request)
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

    const carRegistration = registration.trim().toLowerCase() === UNIQUE_REGISTRATION_TOKEN
      ? generateUKCarRegistration()
      : registration;
    if (carRegistration !== registration) {
      logger.info('Generated a unique car registration for this run', { carRegistration });
    }

    await ukParkingCartPage.waitForTripOverviewReady();

    await ukParkingCartPage.expandContactInformation();
    await ukParkingCartPage.fillPhoneNumber(mobile);
    await ukParkingCartPage.fillCarManufacturer(carMake);
    await ukParkingCartPage.fillVehicleModel(model);
    await ukParkingCartPage.fillCarRegistration(carRegistration);
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
