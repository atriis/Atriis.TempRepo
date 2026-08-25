const { escapeRegex } = require("@utils/text");
const { pressTab } = require("@utils/dom");
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

  // ---- Ground transport edit-search drawer ----
  // trip-edit-search.vue mounts groundService-search-inputs.vue with showAllInputs=false, so the
  // drawer form is a trimmed copy of the search-page form. Everything below is scoped to
  // SEARCH_SELECTORS.EDIT_SEARCH_DRAWER by the page methods, never used bare.
  //
  // Airline: the only el-select inside .locations-container (both location fields are
  // autocompletes), which is why this does not depend on the newer .airline wrapper class.
  // Element Plus prints the CHOSEN option's label inside .el-select__placeholder and flags the
  // element .is-transparent while it is still showing the placeholder, so :not(.is-transparent)
  // matches only once a carrier has actually been filled in.
  EDIT_SEARCH_AIRLINE_VALUE:
    ".locations-container .el-select .el-select__placeholder:not(.is-transparent)",
  // .space-below is applied to the vehicle/traveller/luggage row ONLY when showAllInputs is false,
  // so it is the drawer's own row: child 1 Vehicle Type, child 2 Traveller, child 3 Luggage.
  EDIT_SEARCH_VEHICLE_TYPE_WRAPPER: ".space-below > :nth-child(1)",
  EDIT_SEARCH_TRAVELLER_WRAPPER: ".space-below > :nth-child(2)",
  // Open an el-select by its wrapper, never by the inner input[role='combobox']: Element Plus only
  // renders that input visible for a `filterable` select. Vehicle Type is filterable, Traveller is
  // not, so its combobox input stays hidden and clicking it times out.
  SELECT_WRAPPER: ".el-select__wrapper",
  // The combobox input is only ever read from, never clicked (see SELECT_WRAPPER): its
  // aria-controls names the popper this particular select owns.
  SELECT_COMBOBOX_INPUT: "input[role='combobox']",
  SELECT_OPTION: ".el-select-dropdown__item",
  // Fallback for when aria-controls is missing. Every el-select teleports its dropdown to <body>
  // AND leaves the previously opened one mounted, so ":visible" can still resolve to the dropdown
  // of the field selected a moment ago — prefer the aria-controls scope wherever possible.
  VISIBLE_SELECT_OPTION: ".el-select-dropdown:visible .el-select-dropdown__item",
  // trip-search-control.vue renders the drawer's submit button as app-btn.search-btn size=large.
  EDIT_SEARCH_SUBMIT_BUTTON: ".trip-search-control .search-btn",
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

  // ===== Ground transport edit-search drawer =====

  /**
   * Gets the ground transport edit-search drawer.
   * @returns {import('@playwright/test').Locator}
   */
  getEditSearchDrawer() {
    return this.page.locator(SEARCH_SELECTORS.EDIT_SEARCH_DRAWER).last();
  }

  /** Waits until the drawer's pick-up field is on screen. */
  async waitForEditSearchDrawerReady(timeout = 30000) {
    await this.getEditSearchDrawer()
      .locator(SEARCH_SELECTORS.PICK_UP_PLACEHOLDER)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  /**
   * Reads the drawer's prepopulated pick-up location.
   * @returns {Promise<string>}
   */
  async getEditSearchPickupValue() {
    return this.getEditSearchDrawer()
      .locator(SEARCH_SELECTORS.PICK_UP_PLACEHOLDER)
      .first()
      .inputValue();
  }

  /**
   * Reads the carrier currently selected in the drawer's Airline field.
   * @returns {Promise<string>} The carrier name, or "" while the field is still empty
   */
  async getEditSearchAirlineValue() {
    const airline = this.getEditSearchDrawer()
      .locator(SELECTORS.EDIT_SEARCH_AIRLINE_VALUE)
      .first();

    if (await airline.count() === 0) {
      return "";
    }

    return (await airline.innerText()).trim();
  }

  /**
   * Types a drop-off address in the drawer and commits the first autocomplete suggestion.
   * @param {string} dropOffLocation
   */
  async fillEditSearchDropOffField(dropOffLocation) {
    const dropOffInput = this.getEditSearchDrawer()
      .locator(SEARCH_SELECTORS.DROP_OFF_PLACEHOLDER)
      .first();

    await dropOffInput.waitFor({ state: "visible", timeout: 15000 });
    await dropOffInput.click();
    await dropOffInput.fill("");
    await dropOffInput.pressSequentially(dropOffLocation, { delay: 100 });

    const firstSuggestion = this.page.locator(SEARCH_SELECTORS.AUTOCOMPLETE_LIST).first();
    await firstSuggestion.waitFor({ state: "visible", timeout: 15000 });
    await firstSuggestion.click();
  }

  /**
   * Selects a vehicle type in the drawer's trimmed vehicle/traveller row.
   * @param {string} vehicleType
   */
  async selectEditSearchVehicleType(vehicleType) {
    await this.#selectFromDrawerRow(
      SELECTORS.EDIT_SEARCH_VEHICLE_TYPE_WRAPPER,
      vehicleType,
      "vehicle type",
    );
  }

  /**
   * Selects the traveller count in the drawer's trimmed vehicle/traveller row.
   *
   * The traveller options are derived from the selected vehicle's capacity, so the vehicle type
   * has to be chosen first or this dropdown renders empty.
   *
   * @param {number|string} travellerNumber
   */
  async selectEditSearchTravellerNumber(travellerNumber) {
    await this.#selectFromDrawerRow(
      SELECTORS.EDIT_SEARCH_TRAVELLER_WRAPPER,
      String(travellerNumber),
      "traveller count",
    );
  }

  /** Submits the drawer's search form. */
  async clickEditSearchSubmitButton() {
    const submitButton = this.getEditSearchDrawer()
      .locator(SELECTORS.EDIT_SEARCH_SUBMIT_BUTTON)
      .first();

    await submitButton.waitFor({ state: "visible", timeout: 15000 });
    await submitButton.click();
  }

  /**
   * Opens one el-select in the drawer's vehicle/traveller row and picks an option by its label.
   *
   * @param {string} wrapperSelector - Drawer-relative selector for the field's wrapper
   * @param {string} optionLabel - Exact option label to select
   * @param {string} fieldName - Field name used in the error message
   */
  async #selectFromDrawerRow(wrapperSelector, optionLabel, fieldName) {
    const field = this.getEditSearchDrawer()
      .locator(`${wrapperSelector} ${SELECTORS.SELECT_WRAPPER}`)
      .first();

    await field.waitFor({ state: "visible", timeout: 15000 });
    await field.click();

    // Read the options from THIS select's own popper. The previously opened dropdown stays
    // mounted and visible, so a ":visible" lookup can resolve against the wrong field's options
    // and report "no such option" while this field is still rendering its own.
    const popperId = await field
      .locator(SELECTORS.SELECT_COMBOBOX_INPUT)
      .first()
      .getAttribute("aria-controls");

    const options = popperId
      ? this.page.locator(`[id="${popperId}"] ${SELECTORS.SELECT_OPTION}`)
      : this.page.locator(SELECTORS.VISIBLE_SELECT_OPTION);

    const option = options
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`, "i") })
      .first();

    try {
      await option.waitFor({ state: "visible", timeout: 15000 });
    } catch (error) {
      const rendered = (await options.allInnerTexts()).map((text) => `"${text.trim()}"`);
      throw new Error(
        `[GroundTransportSearchPage] The drawer's ${fieldName} dropdown never offered the option `
        + `"${optionLabel}". Available: ${rendered.join(", ") || "(none)"}. `
        + `Original: ${error.message}`,
      );
    }

    await option.click();
  }
}
module.exports = GroundTransportSearchPage;
