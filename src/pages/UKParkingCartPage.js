/**
 * Page Object for the UK parking "Trip overview" cart extras: Contact Information
 * and Delivery/Pickup sections (parking-contact-information.vue, parking-delivery-pickup.vue).
 * Contains only UI-level interactions.
 */

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

  /** Saves the Contact Information extra, collapsing it back. */
  async saveContactInformation() {
    await this.page.locator(SELECTORS.CONTACT_INFO_SAVE_BUTTON).click();
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

  /** Saves the Delivery/Pickup extra, collapsing it back. */
  async saveDeliveryPickup() {
    await this.page.locator(SELECTORS.DELIVERY_PICKUP_SAVE_BUTTON).click();
  }
}

module.exports = UKParkingCartPage;
