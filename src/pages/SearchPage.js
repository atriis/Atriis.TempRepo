const {
  typeIntoNthAvailableInput,
  pressTab,
} = require("@utils/dom");
const { normalizeText } = require("@utils/text");

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
  FLIGHT_SEARCH_BUTTON_PRIMARY: "button.btn--primary.search-btn",

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

  // Guest form — passenger (traveler) type select. app-select renders name on the section wrapper;
  // options render in the shared app-select popper. Option labels carry age ranges
  // (e.g. "Child (Ages 2 - 11)"), so callers match by partial passenger-type text.
  TRAVELER_TYPE_SELECT: "section.app-select[name='traveler-Type'] .el-select",
  TRAVELER_TYPE_OPTION: ".app-select-popper:visible .el-select-dropdown__item",
  // Guest email field required-error: the .help message inside the same .control as the email input.
  GUEST_EMAIL_ERROR: ".control:has([placeholder='Enter email address']) .help",
  // Non-adult passenger-type tag text (rendered only when travelerType !== 0, so it targets the guest).
  PASSENGER_TYPE_TAG_TEXT: ".trip-traveler-tag .ptc-text-style",
  // Request-assistance page — "Who are the travellers?" section heading.
  REQUEST_ASSISTANCE_TRAVELERS_TITLE: ".travelers-container h6",

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
  DOB_PICKER_PANEL: '.datepicker-popper.hide-day:visible',
  DOB_PICKER_PANEL_BODY: '.datepicker-popper.hide-day:visible .el-picker-panel__body',

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
  CHECKBOX_LABEL: '.edit-traveler .el-checkbox .checkbox-label',
  // Edit traveler dialog — autocomplete input for searching traveler
  EDIT_TRAVELER_NAME_FIELD: ".edit-traveler [placeholder='Search by name, user group, username or email']",
  EDIT_TRAVELER_OPTION: '.user-autocomplete-popper li',

  // Guest form — copy settings from users group
  COPY_SETTINGS_USERS_GROUP_RADIO: ".copy-settings-container .el-radio:nth-child(2) .el-radio__inner",
  // Caret SVG inside the group-select — clicking this reliably opens filterable el-select
  GROUP_SELECT_CARET: ".copy-settings-container .group-select .el-select__caret",
  GROUP_SELECT_EL: ".copy-settings-container .group-select .el-select",
  GROUP_SELECT_DROPDOWN_ITEM: ".el-select-dropdown__item",
  // is-danger class applied by Vue validation when user group is required but not selected
  GROUP_SELECT_IS_DANGER: ".copy-settings-container .group-select.is-danger",

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
  MULTI_CITY_CABIN_CLASS_FIELD: '.class-input .app-select',
  MULTI_CITY_REMOVE_BTN: '.remove-btn .material-symbols-outlined',

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

  // Traveler slot validation state (.is-danger applied when search is attempted with an empty slot)
  TRAVELER_SLOT_DANGER: '.trip-traveler-tag.is-danger',
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

  /**
   * Waits for any open date picker panel to close. Element Plus single-date pickers
   * (per-leg advanced search fields) close on selection; use this before opening the
   * next leg's calendar so the two panels never overlap.
   *
   * @param {number} [timeout=5000]
   */
  async waitForDatePickerToClose(timeout = 5000) {
    await this.getDatePickerPanel()
      .waitFor({ state: 'hidden', timeout })
      .catch(() => {});
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

    // Poll until count stabilizes — after a guest modal closes, the new chip may not be rendered yet.
    let previous = -1;
    let current = await selectedTravelerNames.count();
    const deadline = Date.now() + 3000;
    while (previous !== current && Date.now() < deadline) {
      await this.page.waitForTimeout(200);
      previous = current;
      current = await selectedTravelerNames.count();
    }
    return current;
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

  /**
   * Selects "Users Group" in the copy-settings radio group of the guest form.
   */
  async selectCopySettingsFromUsersGroup() {
    try {
      await this.page.locator(SELECTORS.COPY_SETTINGS_USERS_GROUP_RADIO).click({ timeout: 10000 });
    } catch (err) {
      throw new Error(`[SearchPage.selectCopySettingsFromUsersGroup] Could not click "Users Group" radio (${SELECTORS.COPY_SETTINGS_USERS_GROUP_RADIO}). Original: ${err.message}`);
    }
  }

  /**
   * Selects a user group by name from the group-select dropdown in the guest form.
   * Uses the caret trigger to open the filterable el-select reliably.
   * @param {string} groupName - Visible text of the group option (e.g. "Post Adis Ababa")
   */
  async selectUserGroupByName(groupName) {
    // Wait for the group-select to appear after the "Users Group" radio is selected
    try {
      await this.page.locator(SELECTORS.GROUP_SELECT_EL).waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(`[SearchPage.selectUserGroupByName] Group-select did not appear (${SELECTORS.GROUP_SELECT_EL}). Ensure "Users Group" radio was selected first. Original: ${err.message}`);
    }
    // Click the caret to open the dropdown (more reliable than clicking the wrapper for filterable selects)
    try {
      await this.page.locator(SELECTORS.GROUP_SELECT_CARET).click({ timeout: 5000 });
    } catch {
      // Fallback: click the el-select container itself
      await this.page.locator(SELECTORS.GROUP_SELECT_EL).click({ timeout: 5000 });
    }
    try {
      const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const option = this.page.locator(SELECTORS.GROUP_SELECT_DROPDOWN_ITEM).filter({ hasText: new RegExp(escape(groupName), 'i') }).first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 5000 });
    } catch (err) {
      throw new Error(`[SearchPage.selectUserGroupByName] Could not select user group "${groupName}" from dropdown (${SELECTORS.GROUP_SELECT_DROPDOWN_ITEM}). Group may not exist or dropdown did not open. Original: ${err.message}`);
    }
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

  /**
   * Selects a gender option by its visible label in the guest form.
   * Reuses the GENDER_DROPDOWN selector (anchored to "Please select gender" placeholder)
   * so it reliably targets the gender field even when other selects are visible.
   * @param {string} genderName - Option label as shown in UI (e.g. "Female", "Male")
   */
  async selectGenderByName(genderName) {
    const dropdown = this.page.locator(SELECTORS.GENDER_DROPDOWN).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.click();
    const option = this.page.getByRole('option', { name: genderName }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
  }

  /**
   * Clicks the "Add guest" button to trigger form validation without waiting
   * for the modal to close. Use when testing mandatory-field enforcement.
   */
  async clickAddGuestButtonWithoutWaiting() {
    await this.getAddGuestButton().waitFor({ state: 'visible', timeout: 10000 });
    await this.getAddGuestButton().click({ timeout: 5000 });
  }

  /**
   * Returns true when the user-group select has the is-danger class applied,
   * indicating the field is flagged as required by the Vue validator.
   * @returns {Promise<boolean>}
   */
  async isUserGroupFieldMandatory() {
    return this.page.locator(SELECTORS.GROUP_SELECT_IS_DANGER).isVisible({ timeout: 5000 });
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
    await this.page.waitForFunction(
      (selector) => {
        const btn = document.querySelector(selector);
        return btn && !btn.disabled && !btn.classList.contains("is-disabled");
      },
      SELECTORS.SEARCH_BUTTON,
      { timeout: 10000 }
    );
    await searchButton.click();
  }

  /**
   * Waits for the primary search button (btn--primary.search-btn) to be enabled and clicks it.
   * Used when searching from the cart drawer — multiple .search-btn elements are present
   * (hotel, overview, flight) and the generic SEARCH_BUTTON selector would fail in strict mode.
   */
  async waitAndClickPrimarySearchButtonFromCart() {
    const searchButton = this.page.locator(SELECTORS.FLIGHT_SEARCH_BUTTON_PRIMARY);
    await searchButton.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForFunction(
      (selector) => {
        const btn = document.querySelector(selector);
        return btn && !btn.disabled && !btn.classList.contains("is-disabled");
      },
      SELECTORS.FLIGHT_SEARCH_BUTTON_PRIMARY,
      { timeout: 10000 }
    );
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
   * Waits for the pickup date field to be visible and interactive.
   * Used after closing the edit-search modal to confirm the date picker panel is ready
   * before attempting to interact with calendar controls.
   *
   * @param {Object} [options]
   * @param {number} [options.timeout=15000]
   */
  async waitForPickupDateFieldVisible({ timeout = 15000 } = {}) {
    await this.page.locator(SELECTORS.PICK_UP_DATE_INPUT).waitFor({ state: 'visible', timeout });
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
   * Selects a cabin class for a specific multi-city leg.
   *
   * @param {string} cabinClass - Cabin class label, e.g. "Business", "Economy"
   * @param {number} legIndex - Zero-based leg row index
   */
  async selectFlightClassForLeg(cabinClass, legIndex) {
    if (!cabinClass || typeof cabinClass !== 'string') {
      throw new Error(`[SearchPage.selectFlightClassForLeg] "cabinClass" must be a non-empty string, got: ${typeof cabinClass}`);
    }
    if (!Number.isInteger(legIndex) || legIndex < 0) {
      throw new Error(`[SearchPage.selectFlightClassForLeg] "legIndex" must be a non-negative integer, got: ${legIndex}`);
    }
    try {
      const row = this.page.locator(SELECTORS.MULTI_CITY_LINE).nth(legIndex);
      const classDropdown = row.locator(SELECTORS.MULTI_CITY_CABIN_CLASS_FIELD);
      await classDropdown.waitFor({ state: 'visible', timeout: 10000 });
      await classDropdown.click();
      await this.page.locator(`.el-select-dropdown__item:visible:has-text("${cabinClass}")`).click();
      await classDropdown.getByText(cabinClass, { exact: true }).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.selectFlightClassForLeg] Could not select cabin class "${cabinClass}" for leg ${legIndex}. ` +
        `The multi-city form may not be open or the cabin class option is unavailable. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the remove button for the last multi-city flight leg.
   * The first leg has no remove button — only legs at index > 0 can be removed.
   */
  async clickRemoveLastFlightLeg() {
    try {
      const lastRow = this.page.locator(SELECTORS.MULTI_CITY_LINE).last();
      const removeBtn = lastRow.locator(SELECTORS.MULTI_CITY_REMOVE_BTN);
      await removeBtn.waitFor({ state: 'visible', timeout: 10000 });
      await removeBtn.click();
    } catch (err) {
      throw new Error(
        `[SearchPage.clickRemoveLastFlightLeg] Could not click the remove button on the last flight leg. ` +
        `The multi-city form may have only one leg or the remove button is not visible. Original: ${err.message}`
      );
    }
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

  async clickDobInput() {
    try {
      const dobInput = this.page.locator(SELECTORS.DATE_OF_BIRTH_INPUT).first();
      await dobInput.waitFor({ state: 'visible', timeout: 10000 });
      await dobInput.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.clickDobInput] Could not click DOB input (selector: ${SELECTORS.DATE_OF_BIRTH_INPUT}). ` +
        `The add guest form may not be open or the field is not visible. Original: ${err.message}`
      );
    }
  }

  async getDobPickerYear() {
    try {
      const panel = this.page.locator(SELECTORS.DOB_PICKER_PANEL);
      await panel.waitFor({ state: 'visible', timeout: 10000 });
      const yearLabel = panel.locator('.el-date-picker__header-label').first();
      const yearText = await yearLabel.textContent({ timeout: 5000 });
      return parseInt(yearText.trim(), 10);
    } catch (err) {
      throw new Error(
        `[SearchPage.getDobPickerYear] Could not read year from DOB picker header. ` +
        `The date picker may not have opened or the hide-day panel is not visible. Original: ${err.message}`
      );
    }
  }

  async isDobPickerPanelBodyVisible() {
    try {
      const panelBody = this.page.locator(SELECTORS.DOB_PICKER_PANEL_BODY);
      await panelBody.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch (err) {
      throw new Error(
        `[SearchPage.isDobPickerPanelBodyVisible] The DOB picker panel body (hide-day mode) is not visible (selector: ${SELECTORS.DOB_PICKER_PANEL_BODY}). ` +
        `Expected the picker to remain open in month-selection mode. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the add-traveler icon button to be visible on the search/new-trip page.
   * @param {number} [timeout=10000]
   */
  async waitForAddTravelerIconVisible({ timeout = 10000 } = {}) {
    try {
      await this.page.locator(SELECTORS.ADD_TRAVELER_BUTTON).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[SearchPage.waitForAddTravelerIconVisible] Add-traveler icon button not visible (${SELECTORS.ADD_TRAVELER_BUTTON}). ` +
        `The new-trip search page may not have loaded yet. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the primary-traveler checkbox label to be visible and verifies its text.
   * @param {string} labelText - Expected label text on the checkbox
   */
  async isCheckboxWithLabelVisible(labelText) {
    const checkbox = this.page.locator(SELECTORS.PRIMARY_TRAVELER_CHECKBOX).first();
    try {
      await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.isCheckboxWithLabelVisible] Primary traveler checkbox not visible (${SELECTORS.PRIMARY_TRAVELER_CHECKBOX}). ` +
        `The edit-traveler dialog may not be open. Original: ${err.message}`
      );
    }

    const label = checkbox.locator('.checkbox-label').first();
    try {
      await label.waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.isCheckboxWithLabelVisible] Checkbox label not visible (${SELECTORS.CHECKBOX_LABEL}). Original: ${err.message}`
      );
    }

    const actualText = normalizeText(await label.innerText());
    if (!actualText.toLowerCase().includes(labelText.toLowerCase())) {
      throw new Error(
        `[SearchPage.isCheckboxWithLabelVisible] Checkbox label text mismatch. ` +
        `Expected to contain: "${labelText}", got: "${actualText}"`
      );
    }
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

  /**
   * Waits until a named traveler's chip is visible in the travelers list.
   * The named chip uses .traveler-name.black; the search is case-insensitive via hasText.
   * @param {string} name - Full name to look for (e.g. "Gadi Cohen")
   */
  async waitForTravelerNameVisible(name) {
    if (!name || typeof name !== 'string') {
      throw new Error(`[SearchPage.waitForTravelerNameVisible] "name" must be a non-empty string, got: ${typeof name}`);
    }
    const locator = this.page.locator(SELECTORS.SELECTED_TRAVELER_NAME).filter({ hasText: name });
    try {
      await locator.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.waitForTravelerNameVisible] Traveler name "${name}" not visible in the travelers list ` +
        `(selector: ${SELECTORS.SELECTED_TRAVELER_NAME}). Ensure the traveler was added successfully. Original: ${err.message}`
      );
    }
  }

  /**
   * Adds an empty traveler slot by clicking the add-traveler button and immediately
   * closing the modal without selecting anyone. The empty slot persists in the Vuex store
   * because numberOfPassengers is incremented by addEmptyTraveler() before the modal opens.
   * The slot is not visible on the search-page chip list immediately (the loading state
   * hides it briefly); it becomes visible in the cart-info-bar avatar list after navigation.
   */
  async clickAddEmptyTravelerSlot() {
    await this.clickAddTravelerButton();
    await this.closeVisibleEditTravelerModal();
  }

  /**
   * Verifies that only the empty traveler slot is highlighted in red (.is-danger on its
   * trip-traveler-tag) while named traveler slots are NOT highlighted.
   *
   * This checks the regression where all travelers' names were shown in red when one slot
   * was empty — only the unnamed slot should receive the .is-danger class.
   * Must be called immediately after a search has been submitted with an empty traveler slot
   * (the search is blocked and showTravelersErrorTooltip applies .is-danger for ~5s).
   */
  async verifyOnlyEmptyTravelerSlotIsRed() {
    const dangerSlots = this.page.locator(SELECTORS.TRAVELER_SLOT_DANGER);

    // The validation fires asynchronously after the search click — wait for it to appear.
    try {
      await dangerSlots.first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.verifyOnlyEmptyTravelerSlotIsRed] No traveler slot became highlighted in red ` +
        `(selector: ${SELECTORS.TRAVELER_SLOT_DANGER}) after the search was submitted. Expected the empty slot to be ` +
        `flagged via showTravelersErrorTooltip. The validation may not have fired or has already reset. Original: ${err.message}`
      );
    }

    // The .is-danger class is removed ~5s after the search click (errorTooltipVisible resets via
    // setTimeout). Capture every traveler tag's state in ONE DOM snapshot so all checks read from
    // the same instant — serial round-trips could straddle the reset and report a false regression.
    // A named slot is identified by a confirmed name node (.traveler-name.black); the empty slot has none.
    const tags = await this.page.locator(SELECTORS.TRIP_TRAVELER_TAG).evaluateAll((nodes) =>
      nodes.map((node) => ({
        isDanger: node.classList.contains('is-danger'),
        hasNamedTraveler: !!node.querySelector('.traveler-name.black'),
        text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
      }))
    );

    const dangerTags = tags.filter((t) => t.isDanger);
    if (dangerTags.length === 0) {
      throw new Error(
        `[SearchPage.verifyOnlyEmptyTravelerSlotIsRed] No traveler slot had .is-danger in the snapshot ` +
        `(selector: ${SELECTORS.TRAVELER_SLOT_DANGER}). Expected exactly 1 empty slot highlighted in red; ` +
        `the highlight may have reset before capture.`
      );
    }
    if (dangerTags.length > 1) {
      throw new Error(
        `[SearchPage.verifyOnlyEmptyTravelerSlotIsRed] ${dangerTags.length} traveler slots have .is-danger; expected exactly 1. ` +
        `This indicates the regression where named travelers are also highlighted in red.`
      );
    }

    // The single danger slot must be the EMPTY one — never a named traveler.
    if (dangerTags[0].hasNamedTraveler) {
      throw new Error(
        `[SearchPage.verifyOnlyEmptyTravelerSlotIsRed] A NAMED traveler slot "${dangerTags[0].text}" has the .is-danger class. ` +
        `Only the empty slot should be highlighted. This confirms the regression.`
      );
    }

    // At least one named traveler slot must remain un-highlighted.
    const namedUnhighlighted = tags.filter((t) => t.hasNamedTraveler && !t.isDanger);
    if (namedUnhighlighted.length === 0) {
      throw new Error(
        `[SearchPage.verifyOnlyEmptyTravelerSlotIsRed] No named traveler slots remained un-highlighted. ` +
        `Expected the named travelers (e.g. Shani Cohen, Gadi Cohen) to keep their normal styling.`
      );
    }
  }

  /**
   * Asserts that both add-traveler controls are hidden.
   * Used to verify the DisableBookForMultiPax permission is active.
   * Both buttons are conditionally rendered via v-if when that permission is set and a traveler is already added.
   * @param {{ timeout?: number }} options
   */
  async assertAddTravelerButtonNotVisible({ timeout = 5000 } = {}) {
    try {
      await this.page.locator(SELECTORS.TRIP_TRAVELER_TAG).first().waitFor({ state: 'visible', timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.assertAddTravelerButtonNotVisible] Traveler tag not visible (${SELECTORS.TRIP_TRAVELER_TAG}). ` +
        `The search page may not have loaded. Original: ${err.message}`
      );
    }

    try {
      await this.page.locator(SELECTORS.ADD_TRAVELER_BUTTON).waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[SearchPage.assertAddTravelerButtonNotVisible] Add-traveler button is still visible (${SELECTORS.ADD_TRAVELER_BUTTON}). ` +
        `Expected it to be hidden when DisableBookForMultiPax permission is active and a traveler is already selected. Original: ${err.message}`
      );
    }

    try {
      // Scoped to .travelers-list to avoid matching the .imt-btn in product-carousel-home-page.vue
      await this.page.locator(`.travelers-list ${SELECTORS.ADD_ME_BUTTON}`).waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[SearchPage.assertAddTravelerButtonNotVisible] "Add me" button is still visible (.travelers-list ${SELECTORS.ADD_ME_BUTTON}). ` +
        `Expected it to be hidden when DisableBookForMultiPax permission is active and a traveler is already selected. Original: ${err.message}`
      );
    }
  }

  /**
   * Checks whether a validation message with the given text is visible anywhere on the search page.
   *
   * The text is matched page-wide (every field, not scoped to one). The message renders synchronously
   * on an invalid submit; `timeout` is the window allowed for it to surface before concluding it is
   * absent, so a negative check (asserting it does NOT show) gives it a real chance to appear first.
   * EVERY matching element is checked for visibility — not just the first — because the message can
   * surface on more than one field (e.g. both date fields), some of which may be hidden.
   *
   * @param {string} message - The validation message text to look for
   * @param {{ timeout?: number }} options
   * @returns {Promise<boolean>} true if any matching element is visible
   */
  async isValidationMessageVisible(message, { timeout = 5000 } = {}) {
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[SearchPage.isValidationMessageVisible] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`,
      );
    }

    const matches = this.page.getByText(message, { exact: false });

    try {
      // Wait for the message to render at all; if nothing ever attaches, it is not displayed.
      await matches.first().waitFor({ state: 'attached', timeout });
    } catch {
      return false;
    }

    // Scan every occurrence — the message may appear on multiple fields, so checking only the first
    // could miss a visible one behind a hidden earlier match.
    const count = await matches.count();
    for (let i = 0; i < count; i++) {
      if (await matches.nth(i).isVisible()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Selects a passenger (traveler) type in the guest form by its display name.
   * Opens the traveler-type app-select and clicks the option whose label contains
   * the given type — option labels carry age ranges (e.g. "Child (Ages 2 - 11)"),
   * so the match is by partial text.
   * @param {string} passengerType - Passenger type as shown in the feature (e.g. "Child", "Lap Infant")
   */
  async selectGuestPassengerType(passengerType) {
    try {
      const select = this.page.locator(SELECTORS.TRAVELER_TYPE_SELECT).first();
      await select.waitFor({ state: 'visible', timeout: 10000 });
      await select.click({ timeout: 10000 });

      const option = this.page
        .locator(SELECTORS.TRAVELER_TYPE_OPTION)
        .filter({ hasText: passengerType })
        .first();
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.selectGuestPassengerType] Could not select passenger type "${passengerType}" ` +
        `(select: ${SELECTORS.TRAVELER_TYPE_SELECT}, option: ${SELECTORS.TRAVELER_TYPE_OPTION}). ` +
        `The add guest form may not be open or the passenger type is unavailable for this user. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the guest email field. After the date of birth is filled, the DOB calendar
   * stays open and overlays the centre of the email input, so the click targets the field's
   * left edge (outside the calendar). This real outside-click dismisses the date picker and
   * focuses the email field.
   */
  async clickGuestEmailField() {
    try {
      const email = this.page.locator(SELECTORS.EMAIL_INPUT).first();
      await email.waitFor({ state: 'visible', timeout: 10000 });
      await email.click({ position: { x: 10, y: 12 }, timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[SearchPage.clickGuestEmailField] Could not click the guest email field (${SELECTORS.EMAIL_INPUT}). ` +
        `The add guest form may not be open or the DOB calendar is still overlaying it. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the validation error text shown under the guest email field.
   * Waits for the error to render (it appears once the form is marked for validation).
   * @returns {Promise<string>}
   */
  async getGuestEmailFieldError() {
    try {
      const error = this.page.locator(SELECTORS.GUEST_EMAIL_ERROR).first();
      await error.waitFor({ state: 'visible', timeout: 10000 });
      return (await error.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[SearchPage.getGuestEmailFieldError] No validation error rendered under the guest email field ` +
        `(${SELECTORS.GUEST_EMAIL_ERROR}). Expected a required-field error after the form was validated. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the non-adult passenger-type tag text (e.g. "Child", "Lap Infant").
   * The .ptc-text-style span renders only for non-adult travelers, so it targets the guest chip.
   * @returns {Promise<string>}
   */
  async getPassengerTypeTagText() {
    try {
      const tag = this.page.locator(SELECTORS.PASSENGER_TYPE_TAG_TEXT).first();
      await tag.waitFor({ state: 'visible', timeout: 10000 });
      return (await tag.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[SearchPage.getPassengerTypeTagText] Passenger-type tag not visible (${SELECTORS.PASSENGER_TYPE_TAG_TEXT}). ` +
        `Expected the added guest to show a passenger-type tag. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the "Who are the travellers?" section heading on the request-assistance page.
   * @returns {Promise<string>}
   */
  async getRequestAssistanceTravelersTitle() {
    try {
      const title = this.page.locator(SELECTORS.REQUEST_ASSISTANCE_TRAVELERS_TITLE).first();
      await title.waitFor({ state: 'visible', timeout: 15000 });
      return (await title.innerText()).trim();
    } catch (err) {
      throw new Error(
        `[SearchPage.getRequestAssistanceTravelersTitle] Travelers section title not visible ` +
        `(${SELECTORS.REQUEST_ASSISTANCE_TRAVELERS_TITLE}). The request-assistance page may not have loaded. Original: ${err.message}`
      );
    }
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
