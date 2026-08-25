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
  // Scoped to the Ground Transport tab's own form: el-tabs keeps the other product panes mounted,
  // and the flight tab's traveller select reads "1 Traveller" too as soon as a traveller has been
  // added — an unscoped lookup matches both and fails Playwright's strict mode.
  TRAVELLER_DROPDOWN: ".ground-transport-search .el-select__wrapper:has-text(\"Traveller\")",
  TRAVELLER_DROPDOWN_OPTION:
    (travellerNumbers) => `li.el-select-dropdown__item span:text("${travellerNumbers}")`,
  // The luggage select is keyed on its own app-select prefix icon, not on the "0 Luggage"
  // placeholder: the placeholder is translated AND is swapped for the chosen number once a value
  // has been picked, while the material-symbol name printed inside .select-icon is neither. Scoped
  // to .ground-transport-search for the same reason as TRAVELLER_DROPDOWN above.
  LUGGAGE_DROPDOWN:
    ".ground-transport-search .app-select:has(.select-icon:text-is('luggage')) .el-select__wrapper",

  // ---- Pick-up date / time on the ground transport search form ----
  // groundService-search-inputs.vue renders exactly one app-datepicker and one app-timepicker
  // inside its .details-container. Both are scoped to the tab's own .ground-transport-search root
  // because the "Pick-up Date" placeholder is shared with the car search form, so an unscoped
  // lookup can resolve to another product's field.
  PICKUP_DATE_INPUT: ".ground-transport-search .details-container .app-datepicker input",
  PICKUP_TIME_INPUT: ".ground-transport-search .details-container input.app-timepicker-input",
  // app-timepicker teleports its el-dropdown to <body> with this popper class.
  TIME_SELECTOR_POPPER: ".time-selector-popper:visible",
  // Hours/minutes el-selects inside the popper (time-selection-box.vue, which names them) — both
  // display modes render them; the AM/PM toggle only exists in 12h mode (`isAmPm`, driven by the
  // user's units system).
  TIME_HOURS_TRIGGER: "[name='hours'] .el-select__wrapper",
  TIME_MINUTES_TRIGGER: "[name='minutes'] .el-select__wrapper",
  TIME_AMPM_BUTTON: ".section-ampm .time-part",
  // Element Plus teleports every select dropdown to <body>, so the hour/minute options are read
  // globally rather than from inside the popper; ":visible" filters to the open one.
  VISIBLE_TIME_OPTION: ".el-select-dropdown__item:visible",

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
   * Selects the checked-luggage count on the search form.
   *
   * The options run 0–20 (numOfLuggage in groundService-search-inputs.ts), so they overlap the
   * traveller options this dropdown is opened right after — hence the popper-scoped read in
   * #selectOptionFromField rather than a page-wide getByRole("option"), which would find the
   * still-mounted traveller dropdown's identical label.
   *
   * @param {number|string} luggageNumber
   */
  async selectLuggageNumber(luggageNumber) {
    const field = this.page.locator(SELECTORS.LUGGAGE_DROPDOWN).first();
    await this.#selectOptionFromField(field, String(luggageNumber), "luggage");
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

  // ===== Pick-up date / time (app-datepicker + app-timepicker) =====

  /**
   * Reads the committed pick-up date as the search form renders it.
   *
   * app-datepicker is mounted here with its default 'ddd, DD MMM' format, so the value carries no
   * year (e.g. "Tue, 25 Aug").
   *
   * @returns {Promise<string>} The date input's value, trimmed
   */
  async getPickupDateValue() {
    const dateInput = this.page.locator(SELECTORS.PICKUP_DATE_INPUT).first();

    try {
      await dateInput.waitFor({ state: "visible", timeout: 15000 });
      return (await dateInput.inputValue()).trim();
    } catch (error) {
      throw new Error(
        "[GroundTransportSearchPage.getPickupDateValue] Could not read the pick-up date field "
        + `(selector: ${SELECTORS.PICKUP_DATE_INPUT}). The Ground Transport search form is `
        + `probably not the open tab. Original: ${error.message}`,
      );
    }
  }

  /**
   * Reads the committed pick-up time as the search form renders it.
   *
   * @returns {Promise<string>} "HH:mm" for metric users, "hh:mm a" for imperial ones
   */
  async getPickupTimeValue() {
    const timeInput = this.page.locator(SELECTORS.PICKUP_TIME_INPUT).first();

    try {
      await timeInput.waitFor({ state: "visible", timeout: 15000 });
      return (await timeInput.inputValue()).trim();
    } catch (error) {
      throw new Error(
        "[GroundTransportSearchPage.getPickupTimeValue] Could not read the pick-up time field "
        + `(selector: ${SELECTORS.PICKUP_TIME_INPUT}). The Ground Transport search form is `
        + `probably not the open tab. Original: ${error.message}`,
      );
    }
  }

  /**
   * Sets the pick-up time to an explicit hour:minute through the time popper.
   *
   * The input is readonly (app-timepicker.vue), so the value can only be set from the popper's
   * two el-selects. 12h/AM-PM mode is detected by whether the meridiem toggle renders at all — it
   * never does for a 24h picker — and the meridiem is set BEFORE the hours dropdown is opened,
   * because the hour option list is rebuilt from it.
   *
   * @param {string} hour - Zero-padded 24h hour option text (e.g. "09", "14")
   * @param {string} minute - Zero-padded minute option text; a multiple of the picker's
   *   steps="00:15" (i.e. "00", "15", "30", "45")
   * @throws {Error} If the popper never opens or the value does not commit
   */
  async setPickupTime(hour, minute) {
    if (!/^\d{2}$/.test(String(hour))) {
      throw new Error(
        `[GroundTransportSearchPage.setPickupTime] "hour" must be a zero-padded 24h hour string, got: ${hour}`,
      );
    }

    if (!/^\d{2}$/.test(String(minute))) {
      throw new Error(`[GroundTransportSearchPage.setPickupTime] "minute" must be a zero-padded minute string, got: ${minute}`);
    }

    const hourNumber = Number(hour);
    const meridiem = hourNumber >= 12 ? "PM" : "AM";
    const hour12 = String(hourNumber % 12 === 0 ? 12 : hourNumber % 12).padStart(2, "0");
    const timeInput = this.page.locator(SELECTORS.PICKUP_TIME_INPUT).first();

    try {
      let popper = await this.#openTimePopper(timeInput, SELECTORS.TIME_HOURS_TRIGGER);

      const isAmPmMode = (await popper.locator(SELECTORS.TIME_AMPM_BUTTON).count()) > 0;

      if (isAmPmMode) {
        const meridiemButton = popper
          .locator(SELECTORS.TIME_AMPM_BUTTON, { hasText: new RegExp(`^\\s*${meridiem}\\s*$`) })
          .first();

        if (!((await meridiemButton.getAttribute("class")) || "").includes("active")) {
          await meridiemButton.click({ timeout: 5000 });
          await this.page.waitForTimeout(300);

          // Toggling the meridiem re-applies the currently selected hour/minute and can close the
          // popper outright, so it is reopened rather than assumed to still be there.
          popper = await this.#reopenTimePopperIfClosed(timeInput, SELECTORS.TIME_HOURS_TRIGGER);
        }
      }

      await popper.locator(SELECTORS.TIME_HOURS_TRIGGER).click({ timeout: 5000 });
      await this.page
        .locator(SELECTORS.VISIBLE_TIME_OPTION, {
          hasText: new RegExp(`^\\s*${isAmPmMode ? hour12 : hour}\\s*$`),
        })
        .first()
        .click({ timeout: 5000 });
      // Picking the hour can auto-close and re-render the popper; this lets that settle so the
      // "is it still open?" check below reads the popper's final state, not a mid-transition one.
      await this.page.waitForTimeout(400);

      popper = await this.#reopenTimePopperIfClosed(timeInput, SELECTORS.TIME_MINUTES_TRIGGER);
      await popper.locator(SELECTORS.TIME_MINUTES_TRIGGER).click({ timeout: 5000 });
      await this.page
        .locator(SELECTORS.VISIBLE_TIME_OPTION, { hasText: new RegExp(`^\\s*${minute}\\s*$`) })
        .first()
        .click({ timeout: 5000 });
      // app-timepicker emits its value on the NEXT tick after the minute click, so the popper
      // count and the input value below are both read after the component has applied it.
      await this.page.waitForTimeout(300);

      // The picker auto-closes on the minute pick for 24h users; 12h users have no in-form neutral
      // blur target, so a neutral corner click is used to commit the value.
      if ((await this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).count()) > 0) {
        await this.page.mouse.click(2, 2);
        await this.page.waitForTimeout(300);
      }

      const committedValue = (await timeInput.inputValue()).trim();
      const matches24h = committedValue.includes(String(hour));
      const matches12h = committedValue.includes(hour12) && new RegExp(meridiem, "i").test(committedValue);

      if (!committedValue || (!matches24h && !matches12h)) {
        throw new Error(`the pick-up time input reads "${committedValue}" after selecting ${hour}:${minute}`);
      }
    } catch (error) {
      throw new Error(
        `[GroundTransportSearchPage.setPickupTime] Could not set the pick-up time to ${hour}:${minute}. `
        + "The time popper (class: time-selector-popper) or its hours/minutes el-select was not "
        + `available, or the selection never committed. Original: ${error.message}`,
      );
    }
  }

  /**
   * Opens the pick-up time popper and returns it.
   *
   * app-timepicker teleports its own popper to <body> and a just-closed one can still be
   * transitioning out, so the LAST visible popper is the live one. The open is retried once
   * because the first click's popper can close mid-transition.
   *
   * @param {import('@playwright/test').Locator} timeInput - The readonly time input to click
   * @param {string} triggerSelector - A control expected inside the open popper
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async #openTimePopper(timeInput, triggerSelector) {
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt++) {
      await timeInput.click({ timeout: 10000 });
      // The el-dropdown is teleported and animated in; waiting for its transition to start means
      // ".last()" below picks the popper this click opened, not one still fading out.
      await this.page.waitForTimeout(400);

      const popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();

      try {
        await popper.waitFor({ state: "visible", timeout: 5000 });
        await popper.locator(triggerSelector).waitFor({ state: "visible", timeout: 5000 });
        return popper;
      } catch (error) {
        lastError = error;
        await this.page.waitForTimeout(400);
      }
    }

    throw new Error(
      "[GroundTransportSearchPage.#openTimePopper] The pick-up time popper never rendered "
      + `${triggerSelector} after two clicks on the time input. Original: ${lastError.message}`,
    );
  }

  /**
   * Returns the open time popper, reopening it first if a previous selection closed it.
   *
   * @param {import('@playwright/test').Locator} timeInput
   * @param {string} triggerSelector - A control expected inside the open popper
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async #reopenTimePopperIfClosed(timeInput, triggerSelector) {
    const popper = this.page.locator(SELECTORS.TIME_SELECTOR_POPPER).last();
    const isStillOpen = await popper
      .locator(triggerSelector)
      .isVisible()
      .catch(() => false);

    return isStillOpen ? popper : this.#openTimePopper(timeInput, triggerSelector);
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

    await this.#selectOptionFromField(field, optionLabel, `drawer's ${fieldName}`);
  }

  /**
   * Opens one el-select and picks an option by its exact label, reading the options from that
   * select's own popper.
   *
   * @param {import('@playwright/test').Locator} field - The select's .el-select__wrapper
   * @param {string} optionLabel - Exact option label to select
   * @param {string} fieldName - Field name used in the error message
   */
  async #selectOptionFromField(field, optionLabel, fieldName) {
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
        `[GroundTransportSearchPage] The ${fieldName} dropdown never offered the option `
        + `"${optionLabel}". Available: ${rendered.join(", ") || "(none)"}. `
        + `Original: ${error.message}`,
      );
    }

    await option.click();
  }
}
module.exports = GroundTransportSearchPage;
