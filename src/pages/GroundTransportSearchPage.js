/**
 * Page Object for ground transport search form.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  GROUND_TRANSPORT_TAB: '#tab-groundService',
  LOCATION_CONTAINER: 'section.location-container',
  FROM_SPECIFIC_ADDRESS_TEXT: 'From specific address',
  TO_SPECIFIC_ADDRESS_TEXT: 'To specific address',
  FROM_AIRPORT_TEXT: 'From airport',
  TO_AIRPORT_TEXT: 'To airport',
  VEHICLE_TYPE_FIELD:  '.el-select__selection:has(.el-select__placeholder span:has-text("Vehicle Type")) input[role="combobox"]',
  VEHICLE_TYPE_DROPDOWN_OPTION: (vehicleType) => `li.el-select-dropdown__item span:text("${vehicleType}")`,
  TRAVELLER_DROPDOWN: '.el-select__wrapper:has-text("Traveller")',
  TRAVELLER_DROPDOWN_OPTION:
    (travellerNumbers) => `li.el-select-dropdown__item span:text("${travellerNumbers}")`
};

class GroundTransportSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Ground Transport search */
  async clickGroundTransportTab() {
    await this.page.click(SELECTORS.GROUND_TRANSPORT_TAB);
  }

  /** Selects "From airport" option for pickup location */
  async clickFromAirport() {
    await this.page
      .locator(SELECTORS.LOCATION_CONTAINER)
      .nth(0)
      .getByText(SELECTORS.FROM_AIRPORT_TEXT)
      .click();
  }

  /** Selects "From specific address" option for pickup location */
  async clickFromSpecificAddress() {
    await this.page
      .locator(SELECTORS.LOCATION_CONTAINER)
      .nth(0)
      .getByText(SELECTORS.FROM_SPECIFIC_ADDRESS_TEXT)
      .click();
  }

  /** Selects "To airport" option for dropoff location */
  async clickToAirport() {
    await this.page
      .locator(SELECTORS.LOCATION_CONTAINER)
      .nth(1)
      .getByText(SELECTORS.TO_AIRPORT_TEXT)
      .click();
  }

  /** Selects "To specific address" option for dropoff location */
  async clickToSpecificAddress() {
    await this.page
      .locator(SELECTORS.LOCATION_CONTAINER)
      .nth(1)
      .getByText(SELECTORS.TO_SPECIFIC_ADDRESS_TEXT)
      .click();
  }

  /** Selects vehicle type from dropdown */
  async selectVehicleType(vehicleType) {
    await this.page.waitForTimeout(500);
    // Click to open dropdown
    await this.page.click(SELECTORS.VEHICLE_TYPE_FIELD);
    await this.page.waitForTimeout(500);
    // Type to filter
    await this.page.fill(SELECTORS.VEHICLE_TYPE_FIELD, vehicleType);
    await this.page.waitForTimeout(500);
    // Click the option
    await this.page
      .locator(SELECTORS.VEHICLE_TYPE_DROPDOWN_OPTION(vehicleType))
      .first().click();
  }

  /** Selects traveller number from dropdown */
async selectTravellerNumber(travellerNumbers) {
  await this.page.locator(SELECTORS.TRAVELLER_DROPDOWN).click();
  await this.page
    .getByRole('option', { name: String(travellerNumbers), exact: true })
    .click();
}
}

module.exports = GroundTransportSearchPage;
