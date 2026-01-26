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

  /**
   * Selects a vehicle type from the dropdown.
   *
   * The method waits for the vehicle type field to be visible,
   * opens the dropdown, filters by typing, waits for the matching
   * option to appear, and then selects it.
   *
   * @param {string} vehicleType - Vehicle type to select
   */
  async selectVehicleType(vehicleType) {
    const vehicleTypeField = this.page.locator(
      SELECTORS.VEHICLE_TYPE_FIELD
    );

    // Ensure the vehicle type field is visible and ready
    await vehicleTypeField.waitFor({ state: 'visible' });

    // Open dropdown
    await vehicleTypeField.click();

    // Type to filter options
    await vehicleTypeField.fill(vehicleType);

    const option = this.page
      .locator(SELECTORS.VEHICLE_TYPE_DROPDOWN_OPTION(vehicleType))
      .first();

    // Wait until the filtered option is visible
    await option.waitFor({ state: 'visible' });

    // Select the option
    await option.click();
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
