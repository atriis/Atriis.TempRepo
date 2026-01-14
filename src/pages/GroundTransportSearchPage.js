const {
  typeIntoNthAvailableInput,
  pressTab
} = require('../utils/dom');
const { SELECTORS: SEARCH_SELECTORS } = require('./SearchPage');

/**
 * Page Object for ground transport search form.
 * Contains only UI-level interactions.
 */
const SELECTORS = {
  GROUND_TRANSPORT_TAB: '#tab-groundService',
  VEHICLE_TYPE: ".el-select__input-wrapper:has-text('Vehicle Type')",
  LOCATION_CONTAINER: 'section.location-container',
  FROM_SPECIFIC_ADDRESS_TEXT: 'From specific address',
  TO_SPECIFIC_ADDRESS_TEXT: 'To specific address',
  FROM_AIRPORT_TEXT: 'From airport',
  TO_AIRPORT_TEXT: 'To airport',
};

class GroundTransportSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Ground Transport search */
  async clickGroundTransportTab() {
    await this.page.click(SELECTORS.GROUND_TRANSPORT_TAB);
  }

  /** Opens vehicle type dropdown */
  async clickVehicleTypeDropdown() {
    await this.page.locator(SELECTORS.VEHICLE_TYPE).click();
  }

  /** Selects "From specific address" option for pickup location */
  async typeFromSpecificAddressPickup(fromSpecificAddress) {
    await typeIntoNthAvailableInput(
      this.page,
      fromSpecificAddress,
      SEARCH_SELECTORS.PICK_UP_PLACEHOLDER,
      0
    );
    await this.page.waitForTimeout(1000);
    await pressTab(this.page);
  }

  /** Selects "To specific address" option for dropoff location */
  async typeToSpecificAddressDropoff(toSpecificAddress) {
    await typeIntoNthAvailableInput(
      this.page,
      toSpecificAddress,
      SEARCH_SELECTORS.DROP_OFF_PLACEHOLDER,
      0
    );
    await this.page.waitForTimeout(1000);
    await pressTab(this.page);
  }
}

module.exports = GroundTransportSearchPage;
