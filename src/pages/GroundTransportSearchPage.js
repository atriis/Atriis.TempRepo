const { pressTab } = require("@utils/dom");
const { expect } = require("@playwright/test");
const { SELECTORS: SEARCH_SELECTORS } = require("@pages/SearchPage");

/**
 * Page Object for ground transport search form.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  GROUND_TRANSPORT_TAB: "#tab-groundService",
  LOCATION_CONTAINER: "section.location-container",
  FROM_SPECIFIC_ADDRESS_TEXT: "From specific address",
  TO_SPECIFIC_ADDRESS_TEXT: "To specific address",
  FROM_AIRPORT_TEXT: "From airport",
  TO_AIRPORT_TEXT: "To airport",
  VEHICLE_TYPE_FIELD:  ".el-select__selection:has(.el-select__placeholder span:has-text(\"Vehicle Type\")) input[role=\"combobox\"]",
  VEHICLE_TYPE_DROPDOWN_OPTION: (vehicleType) => `li.el-select-dropdown__item span:text("${vehicleType}")`,
  TRAVELLER_DROPDOWN: ".el-select__wrapper:has-text(\"Traveller\")",
  TRAVELLER_DROPDOWN_OPTION:
    (travellerNumbers) => `li.el-select-dropdown__item span:text("${travellerNumbers}")`,
};

class GroundTransportSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "from" (pickup) location container.
   * @returns {import('@playwright/test').Locator}
   */
  getFromLocationContainer() {
    return this.page.locator(SELECTORS.LOCATION_CONTAINER).nth(0);
  }

  /**
   * Gets the "to" (dropoff) location container.
   * @returns {import('@playwright/test').Locator}
   */
  getToLocationContainer() {
    return this.page.locator(SELECTORS.LOCATION_CONTAINER).nth(1);
  }

  /** Switches UI to Ground Transport search */
  async clickGroundTransportTab() {
    await this.page.click(SELECTORS.GROUND_TRANSPORT_TAB);
  }

  /** Selects "From airport" option for pickup location */
  async clickFromAirport() {
    await this.getFromLocationContainer()
      .getByText(SELECTORS.FROM_AIRPORT_TEXT)
      .click();
  }

  /** Selects "From specific address" option for pickup location */
  async clickFromSpecificAddress() {
    await this.getFromLocationContainer()
      .getByText(SELECTORS.FROM_SPECIFIC_ADDRESS_TEXT)
      .click();
  }

  /** Selects "To airport" option for dropoff location */
  async clickToAirport() {
    await this.getToLocationContainer()
      .getByText(SELECTORS.TO_AIRPORT_TEXT)
      .click();
  }

  /** Selects "To specific address" option for dropoff location */
  async clickToSpecificAddress() {
    await this.getToLocationContainer()
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
      SELECTORS.VEHICLE_TYPE_FIELD,
    );

    // Ensure the vehicle type field is visible and ready
    await vehicleTypeField.waitFor({ state: "visible" });

    // Open dropdown
    await vehicleTypeField.click();

    // Type to filter options
    await vehicleTypeField.fill(vehicleType);

    const option = this.page
      .locator(SELECTORS.VEHICLE_TYPE_DROPDOWN_OPTION(vehicleType))
      .first();

    // Wait until the filtered option is visible
    await option.waitFor({ state: "visible" });

    // Select the option
    await option.click();
  }

  /** Selects traveller number from dropdown */
  async selectTravellerNumber(travellerNumbers) {
    await this.page.locator(SELECTORS.TRAVELLER_DROPDOWN).click();
    await this.page
      .getByRole("option", { name: String(travellerNumbers), exact: true })
      .click();
  }

  /**
   * Fills the pick-up location field and commits the value.
   *
   * Types into the pick-up field and presses TAB to trigger
   * blur/validation logic. Waits until the field loses focus
   * to ensure the input was applied.
   *
   * @param {string} from - Pick-up location text
   */
  async fillInPickUpField(from) {
    const pickUpInput = this.page
      .locator(SEARCH_SELECTORS.PICK_UP_PLACEHOLDER)
      .first();

    await pickUpInput.fill(from);

    // Commit value
    await pressTab(this.page);

    // Small wait for UI to process the blur event
    await this.page.waitForTimeout(100);
  }

  /**
   * Fills the drop-off location field and commits the value.
   *
   * Types into the drop-off field and presses TAB to trigger
   * blur/validation logic. Waits until the field loses focus
   * to ensure the input was applied.
   *
   * @param {string} to - Drop-off location text
   */
  async fillInDropOffField(to) {
    const dropOffInput = this.page
      .locator(SEARCH_SELECTORS.DROP_OFF_PLACEHOLDER)
      .first();

    await dropOffInput.fill(to);

    // Commit value
    await pressTab(this.page);

    // Small wait for UI to process the blur event
    await this.page.waitForTimeout(100);
  }
}

module.exports = GroundTransportSearchPage;
