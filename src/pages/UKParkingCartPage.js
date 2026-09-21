/**
 * Page Object for the UK parking "Trip overview" cart extras: Contact Information
 * and Delivery/Pickup sections (parking-contact-information.vue, parking-delivery-pickup.vue).
 * Contains only UI-level interactions.
 */

const { getNetworkInterceptor } = require("@utils/networkInterceptor");

// The two parking extras each POST their own endpoint, and both then emit `validationChanged`,
// which sends trip-cart.ts back for a fresh GET /tripValidations before the cart CTA becomes
// genuinely clickable (parking-contact-information.ts / parking-delivery-pickup.ts).
const CONTACT_INFO_SAVE_API_PATH = '/SaveParkingDetails';
const DELIVERY_PICKUP_SAVE_API_PATH = '/SavePickupDropOffPopup';
const TRIP_VALIDATIONS_API_PATH = '/tripValidations';

const SELECTORS = {
  // Contact Information (contact + vehicle details)
  CONTACT_INFO_CARD_TITLE: '.contact-information .card-title',
  CONTACT_INFO_EXPAND_TRIGGER: '.contact-information .is-clickable',
  CONTACT_INFO_SAVE_BUTTON: '.contact-information .no-border',
  PHONE_NUMBER_INPUT: '.contact-information [type="number"]',
  CAR_MANUFACTURER_INPUT: '.contact-information [placeholder="Volkswagen"]',
  VEHICLE_MODEL_INPUT: '.contact-information [placeholder="Golf"]',
  CAR_REGISTRATION_INPUT: '.contact-information [placeholder="BD51 SMR"]',
  CAR_COLOUR_INPUT: '.contact-information [placeholder="Silver"]',

  // Delivery / Pickup (destination + outbound/return flight details)
  DELIVERY_PICKUP_CARD_TITLE: '.delivery-pickup .card-title',
  DELIVERY_PICKUP_EXPAND_TRIGGER: '.delivery-pickup .is-clickable',
  DELIVERY_PICKUP_SAVE_BUTTON: '.delivery-pickup .no-border',
  // Outbound and return flight-number/terminal fields share identical placeholders
  // (both "Enter flight number" / both "Enter terminal"), so the sibling .field divs'
  // position (nth-of-type, counting only <div> siblings within .inputs) is the only
  // way to distinguish outbound (2nd/3rd) from return (4th/5th).
  OUTBOUND_FLIGHT_NUM_INPUT: '.delivery-pickup .inputs > div:nth-of-type(2) input',
  OUTBOUND_TERMINAL_INPUT: '.delivery-pickup .inputs > div:nth-of-type(3) input',
  RETURN_FLIGHT_NUM_INPUT: '.delivery-pickup .inputs > div:nth-of-type(4) input',
  RETURN_TERMINAL_INPUT: '.delivery-pickup .inputs > div:nth-of-type(5) input',
};

class UKParkingCartPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the Trip overview's Contact Information and Delivery/Pickup extras to render.
   * @param {number} timeout - Max wait time in ms (default: 30000)
   */
  async waitForTripOverviewReady(timeout = 30000) {
    await this.page.locator(SELECTORS.CONTACT_INFO_CARD_TITLE).first().waitFor({ state: 'visible', timeout });
    await this.page.locator(SELECTORS.DELIVERY_PICKUP_CARD_TITLE).first().waitFor({ state: 'visible', timeout });
  }

  /** Expands the collapsed Contact Information extra. */
  async expandContactInformation() {
    await this.page.locator(SELECTORS.CONTACT_INFO_EXPAND_TRIGGER).first().click();
  }

  /** Fills the mobile/cell phone number field. */
  async fillPhoneNumber(mobile) {
    await this.page.locator(SELECTORS.PHONE_NUMBER_INPUT).fill(mobile);
  }

  /** Fills the car manufacturer field. */
  async fillCarManufacturer(carMake) {
    await this.page.locator(SELECTORS.CAR_MANUFACTURER_INPUT).fill(carMake);
  }

  /** Fills the vehicle model field. */
  async fillVehicleModel(model) {
    await this.page.locator(SELECTORS.VEHICLE_MODEL_INPUT).fill(model);
  }

  /** Fills the car registration field. */
  async fillCarRegistration(registration) {
    await this.page.locator(SELECTORS.CAR_REGISTRATION_INPUT).fill(registration);
  }

  /** Fills the car colour field. */
  async fillCarColour(colour) {
    await this.page.locator(SELECTORS.CAR_COLOUR_INPUT).fill(colour);
  }

  /** Saves the Contact Information extra and waits for the cart to finish re-validating. */
  async saveContactInformation() {
    await this.saveExtraAndWaitForRevalidation(
      SELECTORS.CONTACT_INFO_SAVE_BUTTON,
      CONTACT_INFO_SAVE_API_PATH,
      'Contact Information',
    );
  }

  /** Expands the collapsed Delivery/Pickup extra. */
  async expandDeliveryPickup() {
    await this.page.locator(SELECTORS.DELIVERY_PICKUP_EXPAND_TRIGGER).first().click();
  }

  /** Fills the outbound flight number field. */
  async fillOutboundFlightNumber(flightNumber) {
    await this.page.locator(SELECTORS.OUTBOUND_FLIGHT_NUM_INPUT).fill(flightNumber);
  }

  /** Fills the outbound terminal field. */
  async fillOutboundTerminal(terminal) {
    await this.page.locator(SELECTORS.OUTBOUND_TERMINAL_INPUT).fill(terminal);
  }

  /** Fills the return flight number field. */
  async fillReturnFlightNumber(flightNumber) {
    await this.page.locator(SELECTORS.RETURN_FLIGHT_NUM_INPUT).fill(flightNumber);
  }

  /** Fills the return terminal field. */
  async fillReturnTerminal(terminal) {
    await this.page.locator(SELECTORS.RETURN_TERMINAL_INPUT).fill(terminal);
  }

  /** Saves the Delivery/Pickup extra and waits for the cart to finish re-validating. */
  async saveDeliveryPickup() {
    await this.saveExtraAndWaitForRevalidation(
      SELECTORS.DELIVERY_PICKUP_SAVE_BUTTON,
      DELIVERY_PICKUP_SAVE_API_PATH,
      'Delivery/Pickup',
    );
  }

  /**
   * Clicks one extra's Save button and holds until the cart has re-read its trip validations.
   *
   * Saving is NOT finished when the panel collapses: the component closes itself and fires the
   * "Saved" toast as soon as its own POST resolves, then emits `validationChanged`, which sends
   * trip-cart.ts back for a fresh GET /tripValidations. A "Proceed to Checkout" click inside that
   * window runs validateRequiredInfo() against the stale validations, so the app answers with
   * "In order to proceed, please add all required information", sets markDisabledBtn and swallows
   * the click — then clears the message a moment later once the new validations land. The run is
   * left sitting on the cart with nothing to retry against, which is how test 19197 failed.
   *
   * Both waits are armed BEFORE the click because either response can land first.
   *
   * @param {string} saveButtonSelector - The extra's Save button
   * @param {string} saveApiPath - The extra's own save endpoint
   * @param {string} label - Extra name, used in the thrown error
   */
  async saveExtraAndWaitForRevalidation(saveButtonSelector, saveApiPath, label) {
    const interceptor = getNetworkInterceptor(this.page);
    const savePromise = interceptor.waitForResponse(
      { urlIncludes: saveApiPath, method: 'POST', caseInsensitive: true },
      { timeout: 30000 },
    );
    const validationsPromise = interceptor.waitForResponse(
      { urlIncludes: TRIP_VALIDATIONS_API_PATH, method: 'GET', caseInsensitive: true },
      { timeout: 30000 },
    );

    await this.page.locator(saveButtonSelector).click();

    try {
      await savePromise;
      await validationsPromise;
    } catch (error) {
      throw new Error(
        `[UKParkingCartPage.saveExtraAndWaitForRevalidation] Saving the ${label} extra never ` +
        `completed: expected a POST ${saveApiPath} followed by the cart's GET ` +
        `${TRIP_VALIDATIONS_API_PATH} re-fetch within 30000ms. Either the Save click did not reach ` +
        `a pending quote (both components only POST while the quote is Pending booking), or a ` +
        `required field was left empty so the form marked itself instead of saving. ` +
        `Original: ${error.message}`,
      );
    }
  }
}

module.exports = UKParkingCartPage;
