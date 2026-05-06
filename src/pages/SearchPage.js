const {
  typeIntoNthAvailableInput,
  pressTab,
} = require("@utils/dom");

/**
 * Page Object for search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Traveler interaction
  ADD_TRAVELER_BUTTON: ".btn.btn--default.btn--size-default.btn--round.add-btn",
  ADD_ME_BUTTON: ".imt-btn",
  STAR_ICON: ".star-icon",
  REMOVE_TRAVELER_BUTTON: ".btn--default .material-symbols-outlined",

  // Search and guest management
  SEARCH_BUTTON: "button.search-btn",

  // Guest information form
  FIRST_NAME_INPUT: "[placeholder='First Name']",
  LAST_NAME_INPUT: "[placeholder='Last Name']",
  MIDDLE_NAME_INPUT: ".edit-traveler [placeholder='Middle Name']",
  GENDER_DROPDOWN: "div.el-select__selected-item:has-text('Please select gender')",
  GENDER_OPTION_MALE: "role=option[name='Male']",
  DATE_OF_BIRTH_INPUT: "[placeholder='DD/MM/YYYY']",
  EMAIL_INPUT: "[placeholder='Enter email address']",
  PHONE_NUMBER_PLACEHOLDERS: [
    "[placeholder='Enter phone number']",
    "[placeholder='[City code]-[3 numbers prefix]-[4 digits]']",
  ],
  PHONE_TYPE_DROPDOWN: ".contact-info-container [name='phone-type'] .el-select__wrapper",
  PHONE_TYPE_OPTION: ".el-select-dropdown:visible .el-select-dropdown__item",
  
  // Trip types
  TRIP_TYPE_RADIO_LABELS:
    ":is(.search-options-wrapper, .eu-rail-search-inputs, .amtrak-search-inputs, .uk-rail-search) > :nth-child(1) [role='radiogroup'] .el-radio__label",

  // Calendar (date picker)
  DATE_PICKER_PANEL: ".el-picker-panel:visible",
  DATE_PICKER_CALENDAR_NEXT_ARROW:
    "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  DATE_PICKER_MONTH_TABLE: "table.el-date-table",
  DATE_PICKER_AVAILABLE_DAY_CELL: "td.available .el-date-table-cell__text",
  DATE_PICKER_TODAY_AVAILABLE_DAY_CELL: "td.available.today .el-date-table-cell__text",
  DATE_RANGE_HEADER_LABEL: ".el-date-range-picker__header div",
  DATE_PICKER_HEADER_LABEL: ".el-date-picker__header-label",

  // Traveler search
  TRAVELER_NAME_FIELD:
    "[placeholder='Search by name, user group, username or email']",
  FIRST_TRAVELER_OPTION: "[id*='item-0']",
  TRIP_TRAVELER_TAG: ".trip-traveler-tag",
  SELECTED_TRAVELER_NAME: '.trip-traveler-tag .traveler-name.black',
  EDIT_TRAVELER_MODAL: '.el-dialog.app-dialog',
  EDIT_TRAVELER_MODAL_CLOSE_BUTTON: '.el-dialog__headerbtn',
  EDIT_TRAVELER_DIALOG: '.edit-traveler',
  ADD_GUEST_TRAVELER_BUTTON: '.edit-traveler .add-guest-btn',
  // Edit traveler dialog — primary traveler checkbox
  PRIMARY_TRAVELER_CHECKBOX: '.edit-traveler .el-checkbox',
  // Edit traveler dialog — autocomplete input for searching traveler
  EDIT_TRAVELER_NAME_FIELD: ".edit-traveler [placeholder='Search by name, user group, username or email']",
  EDIT_TRAVELER_OPTION: '.user-autocomplete-popper li',

  // Edit Search
  EDIT_SEARCH_DRAWER: '.atrs-edit-search-drawer',
  EDIT_SEARCH_DRAWER_CLOSE_BTN: '.atrs-edit-search-drawer .close-btn',
  SEARCH_TITLE: '.locations.is-flex.is-align-items-center',

  // Multi-city
  MULTI_CITY_SECTION: 'section.multi-city',
  MULTI_CITY_LINE: '.multi-city-line',
  MULTI_CITY_AIRPORT_AUTOCOMPLETE: '.airport-autocomplete',
  MULTI_CITY_DATEPICKER_INPUT: '.flight-date-picker input',
  ADD_FLIGHT_ROW_BUTTON: '.add-flight-btn',

  // Tabs
  GENERAL_RAIL_TAB: "#tab-rails",

  // Autocomplete
  AUTOCOMPLETE_LIST:
    ".el-scrollbar__view.el-autocomplete-suggestion__list li[id*='item-0']:visible",

  // Precise positional selectors for editing pre-filled airport fields
  // inside the edit-search drawer.
  EDIT_AIRPORT_AUTOCOMPLETE: '.airport-autocomplete input',

  // Location inputs (fallbacks for different suppliers)
  FROM_PLACEHOLDER: [
    "input[placeholder='From... Station or Location' i]",
    "input[placeholder='From... Departure' i]",
    "input[placeholder*='From' i]",
  ],
  TO_PLACEHOLDER: [
    "input[placeholder='To... Station or Location' i]",
    "input[placeholder='To... Destination' i]",
    "input[placeholder*='To' i]",
  ],
  OR_PLACEHOLDER: [
    "input[placeholder='Enter station or location' i]",
    "input[placeholder='Airport, City or Address' i]",
    "input[placeholder*='or' i]",
  ],
  PICK_UP_PLACEHOLDER: "input[placeholder*='Pick-up']",
  DROP_OFF_PLACEHOLDER: "input[placeholder*='Drop-off']",
  DEPARTURE_PLACEHOLDER: "input[placeholder*='Depart']",
  RETURN_PLACEHOLDER: "input[placeholder*='Return']",
  PICK_UP_DATE_INPUT: "[placeholder='Pick-up Date']", //Same locator used for Cars and GroundScope/Transferz
};

/**
 * SearchPage
 *
 * This Page Object handles:
 * - traveler selection
 * - guest details
 * - origin/destination inputs
 * - date selection
 *
 * It does NOT contain business logic.
 * Business flows live in DSL files.
 */
class SearchPage {
  constructor(page) {
    this.page = page;
  }

  getEditSearchDrawer() {
    return this.page.locator(SELECTORS.EDIT_SEARCH_DRAWER).last();
  }

  async waitForEditSearchDrawerVisible(timeout = 10000) {
    await this.page.locator(SELECTORS.EDIT_SEARCH_DRAWER).waitFor({ state: 'visible', timeout });
  }

  async closeEditSearchDrawer() {
    await this.page.locator(SELECTORS.EDIT_SEARCH_DRAWER_CLOSE_BTN).first().click();
  }

  /**
   * Gets an airport input inside the visible edit-search drawer.
   *
   * @param {number} index - Zero-based airport input index in the drawer
   * @returns {import('@playwright/test').Locator}
   */
  getEditAirportInput(index) {
    return this.getEditSearchDrawer()
      .locator(SELECTORS.EDIT_AIRPORT_AUTOCOMPLETE)
      .nth(index);
  }

  getEditSearchButton() {
    return this.getEditSearchDrawer().locator(SELECTORS.SEARCH_BUTTON).first();
  }

  /**
   * Gets the date picker panel element.
   * @returns {import('@playwright/test').Locator}
   */
  getDatePickerPanel() {
    return this.page.locator(SELECTORS.DATE_PICKER_PANEL);
  }

  getEditTravelerModal() {
    return this.page.locator(SELECTORS.EDIT_TRAVELER_MODAL).last();
  }

  async closeVisibleEditTravelerModal() {
    const modal = this.getEditTravelerModal();

    if ((await modal.count()) === 0) {
      return;
    }

    const isVisible = await modal.isVisible().catch(() => false);
    if (!isVisible) {
      return;
    }

    const closeButton = modal.locator(SELECTORS.EDIT_TRAVELER_MODAL_CLOSE_BUTTON).first();
    if ((await closeButton.count()) > 0 && await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true, timeout: 3000 });
    }

    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  // Opens traveler selection panel
  async clickAddTravelerButton({ retries = 1 } = {}) {
    await this.closeVisibleEditTravelerModal();

    for (let attempt = 0; attempt <= retries; attempt++) {
      await this.page.click(SELECTORS.ADD_TRAVELER_BUTTON);

      const modal = this.getEditTravelerModal();
      await modal.waitFor({ state: 'visible', timeout: 10000 });

      try {
        await modal.locator(SELECTORS.EDIT_TRAVELER_DIALOG).first().waitFor({ state: 'visible', timeout: 3000 });
        return;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        await this.closeVisibleEditTravelerModal();

        await this.page.waitForTimeout(300);
      }
    }
  }

  // Waits until the UI is ready to confirm traveler identity
  async waitForAddMeButton() {
    await this.page.waitForSelector(
      SELECTORS.ADD_ME_BUTTON,
      { state: "visible" },
    );
  }

  // Confirms that the logged-in user is the traveler
  async clickAddMe() {
    await this.page.click(SELECTORS.ADD_ME_BUTTON);
  }

  // Used as a stability indicator that the page is fully ready

  /**
   * Checks if the star icon is visible (indicates traveler selection).
   * @param {object} options - Configuration options
   * @param {number} options.timeout - Maximum wait time (default: 15000ms)
   * @returns {Promise<boolean>} True if star icon is visible
   */
  async isStarIconVisible({ timeout = 15000 } = {}) {
    const starIcon = this.page.locator(SELECTORS.STAR_ICON);
    try {
      await starIcon.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the traveler tag to be visible.
   * @returns {Promise<void>}
   */
  async waitForTravelerTagVisible() {
    await this.page.locator(SELECTORS.TRIP_TRAVELER_TAG).first().waitFor({ state: 'visible' });
  }

  /**
   * Gets the remove traveler button within the traveler tag.
   * @returns {import('@playwright/test').Locator}
   */
  getRemoveTravelerButton() {
    return this.page
      .locator(SELECTORS.TRIP_TRAVELER_TAG)
      .first()
      .locator(SELECTORS.REMOVE_TRAVELER_BUTTON)
      .first();
  }

  /**
   * Clicks the remove traveler button.
   * @returns {Promise<void>}
   */
  async clickRemoveTravelerButton() {
    const removeButton = this.getRemoveTravelerButton();
    await removeButton.waitFor({ state: 'visible' });
    await removeButton.click();
  }

  async getSelectedTravelerCount() {
    const selectedTravelerNames = this.page.locator(SELECTORS.SELECTED_TRAVELER_NAME);
    await selectedTravelerNames.first().waitFor({ state: 'visible', timeout: 10000 });

    return await selectedTravelerNames.count();
  }

  // Searches and selects an existing traveler
  async fillInTravelerName(name) {
    await this.page.fill(SELECTORS.TRAVELER_NAME_FIELD, name);
  }

  async selectFirstTravelerNameOption() {
    await this.page.click(SELECTORS.FIRST_TRAVELER_OPTION);
  }

  // Opens the guest modal to add a new traveler
  /**
   * Gets the "Add guest traveler" button that opens the guest form modal.
   * @returns {import('@playwright/test').Locator}
   */
  getAddGuestTravelerButton() {
    return this.page.locator(SELECTORS.ADD_GUEST_TRAVELER_BUTTON).first();
  }

  /**
   * Clicks the "Add guest traveler" button to open the guest form modal.
   */
  async clickAddGuestTravelerButton() {
    const dialog = this.page
      .locator(SELECTORS.EDIT_TRAVELER_MODAL)
      .last()
      .locator(SELECTORS.EDIT_TRAVELER_DIALOG)
      .first();
    await dialog.waitFor({ state: 'visible', timeout: 30000 });

    const button = this.getAddGuestTravelerButton();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.scrollIntoViewIfNeeded();

    try {
      await button.click({ timeout: 10000 });
    } catch {
      await button.click({ force: true, timeout: 10000 });
    }
  }

  /**
   * Gets the "Add guest" button that confirms and submits the guest form.
   * @returns {import('@playwright/test').Locator}
   */
  getAddGuestButton() {
    return this.page.getByRole('button', { name: 'Add guest' });
  }

  /**
   * Waits for the "Add guest" button to be visible.
   */
  async waitForAddGuestButton() {
    await this.getAddGuestButton().waitFor({ state: 'visible' });
  }

  /**
   * Clicks the "Add guest" button to submit the guest form and add the traveler.
   */
  async clickAddGuestButton() {
    const modal = this.getEditTravelerModal();

    await this.getAddGuestButton().click();
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  // Guest form fields
  async fillInRandomFirstName(firstName) {
    await this.page.fill(SELECTORS.FIRST_NAME_INPUT, firstName);
  }

  async fillInRandomLastName(lastName) {
    await this.page.fill(SELECTORS.LAST_NAME_INPUT, lastName);
  }

  async fillInGuestMiddleName(middleName) {
    const input = this.page.locator(SELECTORS.MIDDLE_NAME_INPUT);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(middleName);
    const actual = await input.inputValue();
    if (actual !== middleName) {
      throw new Error(`Middle name input did not retain value. Expected "${middleName}", got "${actual}"`);
    }
  }

  async selectGenderMale() {
    await this.page.locator(SELECTORS.GENDER_DROPDOWN).click();
    await this.page.getByRole("option", { name: "Male" }).first().click();
  }

  async fillInRandomDateOfBirth(dateOfBirth) {
    await this.page.fill(SELECTORS.DATE_OF_BIRTH_INPUT, dateOfBirth);
  }

  async fillInRandomEmail(email) {
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  /**
   * Fills the phone number field.
   * Tries multiple placeholder variations to support different supplier UIs.
   * @param {string} phoneNumber - Phone number to enter
   * @throws {Error} If no phone number input field is found
   */
  async fillInRandomPhone(phoneNumber) {
    for (const selector of SELECTORS.PHONE_NUMBER_PLACEHOLDERS) {
      const element = this.page.locator(selector);
      const count = await element.count();
      if (count > 0) {
        await element.first().fill(phoneNumber);
        return;
      }
    }
    throw new Error(
      `Phone number input not found. Tried selectors: ${SELECTORS.PHONE_NUMBER_PLACEHOLDERS.join(', ')}`
    );
  }

  /**
   * Selects a phone type option (Mobile / Home / Business / etc.) inside the
   * add-guest dialog's contact-info section.
   * @param {string} phoneType - Visible option label (e.g. "Cellular phone")
   */
  async selectPhoneType(phoneType) {
    const dropdown = this.page.locator(SELECTORS.PHONE_TYPE_DROPDOWN).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.click();
    const option = this.page
      .locator(SELECTORS.PHONE_TYPE_OPTION)
      .filter({ hasText: phoneType })
      .first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
 * Fills the "From" field.
 *
 * Uses a shared helper that supports multiple supplier UIs by targeting the
 * first available input that matches the "From" placeholder selector.
 * After typing, it commits the value by pressing TAB and waits until the field
 * loses focus to ensure the UI applied the input (blur/validation/autocomplete).
 *
 * @param {string} from - Origin text to type into the "From" field
 */
  async fillInFromField(from) {
    const fromInput = this.page
      .locator(SELECTORS.FROM_PLACEHOLDER)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      from,
      SELECTORS.FROM_PLACEHOLDER,
      0,
    );

    // Commit the value (blur the field)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
 * Fills the "To" field and confirms the first autocomplete suggestion.
 *
 * The method types into the "To" input, waits for the autocomplete list
 * to appear, and commits the first suggestion by pressing TAB.
 * It then waits until the field loses focus, ensuring the selection
 * has been applied by the UI before continuing.
 *
 * @param {string} to - Destination text to type into the "To" field
 */
  async fillInToField(to) {
    const toInput = this.page
      .locator(SELECTORS.TO_PLACEHOLDER)
      .first();

    await typeIntoNthAvailableInput(
      this.page,
      to,
      SELECTORS.TO_PLACEHOLDER,
      0,
    );

    const suggestions = this.page
      .locator(SELECTORS.AUTOCOMPLETE_LIST)
      .first();

    // Wait until autocomplete suggestions are shown
    await suggestions.waitFor({ state: "visible" });

    // Confirm first suggestion (triggers blur + selection)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
   * Waits for the FROM airport input to be visible — used to confirm the search
   * form is ready for editing (works for both fresh search and add-to-trip context).
   */
  async waitForFromFieldVisible() {
    const input = this.getEditAirportInput(0);
    await input.waitFor({ state: 'visible', timeout: 15000 });
  }

  async editAirportField(index, value) {
    if (!value || typeof value !== 'string') {
      throw new Error(`value must be a non-empty string, got: ${typeof value}`);
    }

    const normalizedValue = value.trim().toUpperCase();
    const input = this.getEditAirportInput(index);

    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.scrollIntoViewIfNeeded();
    await input.focus();
    await input.press('Control+A');
    await input.press('Backspace');
    await this.page.waitForTimeout(300);
    await input.pressSequentially(value, { delay: 100 });

    const firstSuggestion = this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).first();
    await firstSuggestion.waitFor({ state: 'visible', timeout: 15000 });
    await firstSuggestion.click();

    await this.page.waitForFunction(
      ([drawerSelector, inputSelector, inputIndex, expectedValue]) => {
        const drawers = document.querySelectorAll(drawerSelector);
        const drawer = drawers[drawers.length - 1];

        if (!drawer) {
          return false;
        }

        const input = drawer.querySelectorAll(inputSelector)[inputIndex];

        return !!input
          && typeof input.value === 'string'
          && input.value.toUpperCase().includes(expectedValue);
      },
      [SELECTORS.EDIT_SEARCH_DRAWER, SELECTORS.EDIT_AIRPORT_AUTOCOMPLETE, index, normalizedValue],
      { timeout: 10000 },
    );

    await this.page.waitForTimeout(300);
  }

  /**
   * Edits a pre-filled "From" field.
   *
   * Used when the search modal opens with an existing airport value already bound
   * (e.g. clicking "Add a flight" from the cart). The programmatic fill() bypasses
   * Vue's reactive airport binding and the old value re-renders. Instead, we use
   * real keyboard events (Ctrl+A + Backspace) to clear the Vue model, then
   * pressSequentially to trigger the autocomplete properly.
   *
   * @param {string} from - New origin airport code to type
   */
  async editFromField(from) {
    await this.editAirportField(0, from);
  }

  /**
   * Edits a pre-filled "To" field.
   *
   * Same technique as editFromField — uses real keyboard events to clear the
   * Vue-bound airport object before typing the new destination.
   *
   * @param {string} to - New destination airport code to type
   */
  async editToField(to) {
    await this.editAirportField(1, to);
  }

/**
 * Fills an "OR" location field.
 *
 * Used by Cars, Evolvi, and other products that support multiple locations.
 * The value is committed by pressing TAB, which triggers blur/validation logic
 * in the UI. The method waits until the field loses focus to ensure the input
 * has been fully applied before continuing.
 *
 * @param {string} or - Location text to type into the OR field
 * @param {number} occurrence - Which OR field to target (1-based index)
 */
  async fillInOrField(or, occurrence = 1) {
    const index = occurrence - 1;

    const orInput = this.page
      .locator(SELECTORS.OR_PLACEHOLDER)
      .nth(index);

    await typeIntoNthAvailableInput(
      this.page,
      or,
      SELECTORS.OR_PLACEHOLDER,
      index,
    );

    // Wait until autocomplete suggestions are shown before committing
    const suggestions = this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).first();
    await suggestions.waitFor({ state: "visible" });

    // Commit first suggestion (triggers blur + selection)
    await pressTab(this.page);

    // Small wait for UI to process the blur event and autocomplete selection
    await this.page.waitForTimeout(100);
  }

  /**
 * Opens the departure date calendar.
 *
 * Clicks the departure date field and waits until the date picker
 * panel is visible, ensuring the calendar is fully open and ready
 * for interaction.
 */
  async clickDepartureDateField() {
    await this.page
      .locator(SELECTORS.DEPARTURE_PLACEHOLDER)
      .nth(1)
      .click();

    // Wait until the date picker panel is visible
    await this.getDatePickerPanel().waitFor({ state: "visible" });
  }

  /**
 * Opens the return date calendar.
 *
 * Clicks the return date field and waits until the date picker
 * panel is visible, ensuring the calendar is fully open and ready
 * for interaction.
 */
  async clickReturnDateField() {
    await this.page
      .locator(SELECTORS.RETURN_PLACEHOLDER)
      .click();

    // Wait until the date picker panel is visible
    await this.getDatePickerPanel().waitFor({ state: "visible" });
  }

  /**
   * Reads the current departure date input value from the search form.
   * @returns {Promise<string>}
   */
  async getDepartureDateFieldValue() {
    const field = this.page
      .locator(SELECTORS.DEPARTURE_PLACEHOLDER)
      .nth(1);

    await field.waitFor({ state: 'visible', timeout: 10000 });
    return (await field.inputValue()).trim();
  }

  /**
   * Reads the current return date input value from the search form.
   * @returns {Promise<string>}
   */
  async getReturnDateFieldValue() {
    const field = this.page
      .locator(SELECTORS.RETURN_PLACEHOLDER)
      .first();

    await field.waitFor({ state: 'visible', timeout: 10000 });
    return (await field.inputValue()).trim();
  }

  /**
   * Advances the calendar by a number of months.
   * Default is 3 months ahead.
   */

  /**
   * Advances the calendar by a number of months (default: 3).
   * @param {number} monthsAhead
   */
  async clickCalendarNextArrow(monthsAhead = 3) {
    for (let i = 0; i < monthsAhead; i++) {
      const nextArrow = this.page.locator(SELECTORS.DATE_PICKER_CALENDAR_NEXT_ARROW).first();
      await nextArrow.waitFor({ state: "visible", timeout: 10000 });
      await nextArrow.scrollIntoViewIfNeeded().catch(() => {});

      try {
        await nextArrow.click({ timeout: 3000 });
      } catch (error) {
        if (!(error instanceof Error) || !/not stable|intercepts pointer events|timeout/i.test(error.message)) {
          throw error;
        }

        await nextArrow.click({ force: true, timeout: 3000 });
      }
    }
  }

  // Executes the search

  /**
   * Clicks the main search button.
   */
  async clickSearchButton() {
    await this.page.locator(SELECTORS.SEARCH_BUTTON).click();
  }

  /**
   * Waits for the search button to be enabled and then clicks it.
   * Useful for dynamic forms where the button may be disabled until all fields are filled.
   */
  async waitAndClickSearchButton() {
    const searchButton = this.page.locator(SELECTORS.SEARCH_BUTTON);
    await searchButton.waitFor({ state: "visible" });
    // Small delay to ensure form validation completes
    await this.page.waitForTimeout(500);
    await searchButton.click();
  }

  /**
   * Waits for the visible edit-search drawer Search button to be actionable and clicks it.
   */
  async waitAndClickEditSearchButton() {
    const searchButton = this.getEditSearchButton();
    await searchButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(500);

    try {
      await searchButton.click({ timeout: 10000 });
    } catch {
      await searchButton.click({ force: true, timeout: 10000 });
    }

    await this.getEditSearchDrawer().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }

  // Switches to rail search

  /**
   * Switches to the rail search tab.
   */
  async clickRailTab() {
    await this.page.click(SELECTORS.GENERAL_RAIL_TAB);
  }

  // "Pick-up Date" field (used by Cars and Ground Transport)

  /**
   * Clicks the pick-up date field (used by Cars and Ground Transport).
   */
  async clickPickupDateField() {
    await this.page.click(SELECTORS.PICK_UP_DATE_INPUT);
  }

  /**
 * Clicks a trip type radio button by label text (e.g., "One Way", "Round Trip").
 *
 * Waits until the trip type radio labels are visible before attempting
 * to locate and click the requested option.
 *
 * @param {string|RegExp} labelText
 */
  async clickTripType(labelText) {
    const labels = this.page.locator(SELECTORS.TRIP_TYPE_RADIO_LABELS);

    // Ensure trip type labels are present and visible before interacting
    // Extended timeout for CI/CD environments where page loads slower
    await labels.first().waitFor({ state: "visible", timeout: 60000 });

    // Fail fast if your base locator is wrong (helps debugging a lot)
    const count = await labels.count();
    if (count === 0) {
      throw new Error(
        `Trip type labels not found. Selector: ${SELECTORS.TRIP_TYPE_RADIO_LABELS}`,
      );
    }

    const target = labels.filter({ hasText: labelText }).first();
    const matches = await target.count();
    if (matches === 0) {
      throw new Error(
        `Trip type option "${labelText}" not found under selector: ${SELECTORS.TRIP_TYPE_RADIO_LABELS}`,
      );
    }

    await target.click();
  }

  /**
   * Selects the "One Way" trip type.
   */
  async selectOneWayTrip() {
    await this.clickTripType(/one way/i);
  }

  /**
   * Selects the "Round Trip" trip type.
   */
  async selectRoundTrip() {
    await this.clickTripType(/round trip/i);
  }

  /**
   * Selects the "Multi City" trip type.
   */
  async selectMultiCityTrip() {
    const labels = this.page.locator(SELECTORS.TRIP_TYPE_RADIO_LABELS);
    const target = labels.nth(2);
    await target.waitFor({ state: 'visible', timeout: 60000 });
    await target.click();
  }

  /**
   * Waits for the multi-city section to be visible after selecting multi-city trip type.
   */
  async waitForMultiCitySection() {
    await this.page.locator(SELECTORS.MULTI_CITY_SECTION).waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Clicks the "Add another flight" button to add a new leg in multi-city search.
   */
  async clickAddFlightRowButton() {
    await this.page.locator(SELECTORS.ADD_FLIGHT_ROW_BUTTON).click();
  }

  /**
   * Fills the From and To fields for a single multi-city leg.
   *
   * Scoped to the specific .multi-city-line row so that global nth-index lookups
   * are not needed. Works regardless of how many legs are visible.
   *
   * After Tab from the "To" autocomplete, Element Plus often auto-opens the
   * departure date picker for that row. Call openMultiCityDatePickerAtIndex
   * afterwards to use the already-open picker or open it if needed.
   *
   * @param {string} from - Origin airport code
   * @param {string} to - Destination airport code
   * @param {number} legIndex - Zero-based leg row index
   */
  async fillMultiCityLeg(from, to, legIndex) {
    const row = this.page.locator(SELECTORS.MULTI_CITY_LINE).nth(legIndex);

    // Use the row structure instead of localized placeholders.
    const airportInputs = row.locator(SELECTORS.MULTI_CITY_AIRPORT_AUTOCOMPLETE);

    // From field
    const fromInput = airportInputs.nth(0).locator('input').first();
    await fromInput.waitFor({ state: 'visible' });
    await fromInput.click();
    await fromInput.fill(from);
    await this.page.waitForTimeout(200);
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(150);

    // To field — Tab focus moves here, then click to ensure correct focus before fill
    const toInput = airportInputs.nth(1).locator('input').first();
    await toInput.waitFor({ state: 'visible' });
    await toInput.click();
    await toInput.fill(to);
    // Wait for autocomplete suggestions then commit with Tab
    await this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).first().waitFor({ state: 'visible' });
    await this.page.keyboard.press('Tab');
    // Tab moves focus to the date input, which may auto-open the picker
    await this.page.waitForTimeout(200);
  }

  /**
   * Ensures the date picker is open for a given multi-city leg.
   *
   * Element Plus auto-opens the date picker when Tab moves focus to the date
   * input. This method checks if it's already visible and only clicks to open
   * it if it's not — preventing the toggle-close that would happen if the
   * picker is already open.
   *
   * @param {number} legIndex - Zero-based leg row index
   */
  async openMultiCityDatePickerAtIndex(legIndex) {
    const panel = this.getDatePickerPanel();
    const alreadyOpen = await panel.isVisible();
    if (!alreadyOpen) {
      const row = this.page.locator(SELECTORS.MULTI_CITY_LINE).nth(legIndex);
      await row.locator(SELECTORS.MULTI_CITY_DATEPICKER_INPUT).click();
      await panel.waitFor({ state: 'visible', timeout: 10000 });
    }
    // Wait for panel animation to stabilize before interacting with month arrows
    await this.page.waitForTimeout(300);
  }

  /**
   * Clicks the "Travel request" button.
   */
  getTravelRequestButton() {
    return this.page.getByRole("button", { name: "Travel request" });
  }

  clickTravelRequestButton() {
    return this.getTravelRequestButton().click();
  }

  
  /**
   * Gets the search title locator.
   * @returns {Locator} Search title element
   */
  getSearchTitle() {
    return this.page.locator(SELECTORS.SEARCH_TITLE).first();
  }

  /**
   * Validates that the search title contains expected text.
   * @param {string} expectedText - Text expected in search title
   * @throws {Error} If expectedText is not provided
   */
  async validateSearchTitleContains(expectedText) {
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error('expectedText must be a non-empty string');
    }
    
    const titleElement = this.getSearchTitle();
    await titleElement.waitFor({ state: 'visible' });
    const actualText = await titleElement.innerText();
    
    if (!actualText.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(`Search title "${actualText}" does not contain "${expectedText}"`);
    }
  }

  /**
   * Checks the "Use as primary traveller" checkbox in the edit-traveler dialog.
   * The add-traveler dialog must already be open.
   */
  async checkPrimaryTravelerCheckbox() {
    const checkbox = this.page.locator(SELECTORS.PRIMARY_TRAVELER_CHECKBOX).first();
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.click();
  }

  /**
   * Fills the traveler name in the edit-traveler panel's autocomplete.
   * Scoped to the .edit-traveler section to avoid targeting the general traveler search.
   * @param {string} name - traveler name to search for
   */
  async fillInEditTravelerName(name) {
    const input = this.page.locator(SELECTORS.EDIT_TRAVELER_NAME_FIELD);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(name);
  }

  /**
   * Selects the first option from the edit-traveler autocomplete dropdown.
   */
  async selectEditTravelerOption() {
    const option = this.page.locator(SELECTORS.EDIT_TRAVELER_OPTION).first();
    await option.waitFor({ state: 'visible', timeout: 30000 });
    await option.click();
  }

}

/**
 * Exporting both:
 * - SearchPage class (default)
 * - SELECTORS (for reuse or debugging if needed)
 */
module.exports = {
  SearchPage,
  SELECTORS,
};
