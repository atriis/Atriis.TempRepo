const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const { generateRandomGuestData } = require("@utils/data/generateRandomGuestData.js");
const logger = require("@utils/logger").child("Search");

/**
 * Search (Domain DSL)
 *
 * Business actions for the traveler section.
 * Keeps tests readable by hiding UI form details.
 */
const Search = {
  /**
   * Set the logged-in user as the traveler.
   * Returns whether the star icon is visible (indicates success).
   */
  async addMeAsTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForAddMeButton();
    await searchPage.clickAddMe();
    await searchPage.waitForTravelerTagVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return { added: true, starIconVisible: true, selectedTravelerCount };
  },

  /**
   * Clicks the "Add me" button but does NOT wait for the traveler tag to appear.
   * Use this when clicking "Add me" is expected to trigger a profile popup
   * (e.g. when mandatory fields are missing) rather than adding a tag.
   */
  async clickAddMeButton(page) {
    if (!page) {
      throw new Error('[Search.clickAddMeButton] "page" is required.');
    }

    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.waitForAddMeButton();
      await searchPage.clickAddMe();
    } catch (err) {
      throw new Error(
        `[Search.clickAddMeButton] Failed to find or click the "Add me" button: ${err.message}. ` +
        `Ensure the traveler selector section is visible on the current page.`
      );
    }

    logger.info('[Search.clickAddMeButton] "Add me" button clicked');
  },

  /**
   * Types a traveler name into the autocomplete field and selects the first option,
   * but does NOT wait for the traveler tag or star icon.
   * Use when adding a traveler with missing mandatory fields is expected to trigger
   * the profile popup rather than completing the add.
   */
  async selectTravelerFromAutocomplete(page, name) {
    if (!page) {
      throw new Error('[Search.selectTravelerFromAutocomplete] "page" is required.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error(
        `[Search.selectTravelerFromAutocomplete] "name" must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`
      );
    }

    logger.debug(`[Search.selectTravelerFromAutocomplete] Clicking Add traveller, typing "${name}" and selecting from autocomplete`);
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddTravelerButton();
      await searchPage.fillInTravelerName(name);
      await searchPage.selectFirstTravelerNameOption();
    } catch (err) {
      throw new Error(
        `[Search.selectTravelerFromAutocomplete] Failed to add traveler "${name}" from autocomplete: ${err.message}. ` +
        `Ensure the "Add traveller" button is visible and the autocomplete returned results for "${name}".`
      );
    }

    logger.info(`[Search.selectTravelerFromAutocomplete] Selected "${name}" from autocomplete`);
  },

  /**
   * Removes the logged-in traveler from the trip.
   * Returns whether the Add Me button becomes visible again.
   */
  async removeTraveler(page) {
    if (!page) {
      throw new Error('page is required');
    }

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForTravelerTagVisible();
    await searchPage.clickRemoveTravelerButton();
    await searchPage.waitForAddMeButton();

    return { removed: true };
  },

  /**
   * Set a specific existing traveler by searching their name.
   * Returns whether the star icon is visible (indicates success).
   */
  async fillInTravelerNameAndSave(page, name) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.fillInTravelerName(name);
    await searchPage.selectFirstTravelerNameOption();
    
    const starIconVisible = await searchPage.isStarIconVisible();
    return { selected: true, starIconVisible };
  },

  /**
   * Add a traveler by name (second traveler slot).
   */
  async addTravelerByName(page, name) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!name || typeof name !== 'string') {
      throw new Error('name must be a non-empty string');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickAddTravelerButton();
    const result = await Search.fillInTravelerNameAndSave(page, name);
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      ...result,
      selectedTravelerCount,
    };
  },

  /**
   * Add a new guest traveler using random test data.
   * Returns the generated data and star icon visibility status.
   *
   * @param {import('playwright').Page} page
   * @param {string} [phoneType] - Optional visible phone-type label
   *   (e.g. "Cellular phone"). Required for users whose corporate profile
   *   does not pre-populate a default phone type, where leaving it blank
   *   fails form validation and prevents the add-guest dialog from closing.
   */
  async addRandomGuest(page, phoneType = null) {
    if (!page) {
      throw new Error('page is required');
    }
    if (phoneType !== null && (typeof phoneType !== 'string' || phoneType.length === 0)) {
      throw new Error('phoneType, when provided, must be a non-empty string');
    }

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    if (phoneType) {
      await searchPage.selectPhoneType(phoneType);
    }
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone, phoneType },
    };
  },

  /**
   * Waits for at least `minCount` traveller names to be displayed on the search form. Use before
   * re-running a search after adding a traveller: the Search button stays enabled from the prior
   * search, so clicking it too early searches without the new (randomly named) traveller. Pass the
   * total expected traveller count (e.g. 2 for self + one guest) so the wait gates on the NEW one.
   *
   * @param {Object} page - Playwright page instance
   * @param {number} [minCount=1] - Total number of named travellers expected before searching.
   * @returns {Promise<void>}
   */
  async waitForTravelerNameDisplayed(page, minCount = 1) {
    if (!page) throw new Error('page is required');
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitForTravelerNamesDisplayed(minCount);
  },

  /**
   * Validates that the search title contains specific text.
   * @param {Object} page - Playwright page instance
   * @param {string} text - Expected text in search title
   * @throws {Error} If page or text are missing
   */
  async validateSearchTitleContains(page, text) {
    if (!page) {
      throw new Error('page is required');
    }
    
    if (!text || typeof text !== 'string') {
      throw new Error('text must be a non-empty string');
    }
    
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.validateSearchTitleContains(text);
  },

  /**
   * Add a traveler by name and set them as primary.
   * @param {import('playwright').Page} page
   * @param {string} name - traveler name to search for
   */
  async addTravelerAsPrimaryByName(page, name) {
    if (!page) throw new Error('page is required');
    if (!name || typeof name !== 'string') throw new Error('name must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.clickAddTravelerButton();
    // Wait for the edit-traveler panel to appear
    await page.locator('.edit-traveler').waitFor({ state: 'visible', timeout: 10000 });
    await searchPage.checkPrimaryTravelerCheckbox();
    // Fill the autocomplete inside the edit-traveler panel (scoped)
    await searchPage.fillInEditTravelerName(name);
    await searchPage.selectEditTravelerOption();
    // Wait for the traveler to be selected
    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return { selected: true, starIconVisible, selectedTravelerCount };
  },

  /**
   * Adds a random guest traveler with a specific first and last name.
   * All other data (DOB, email, phone) is randomly generated.
   * @param {Object} page - Playwright page instance
   * @param {string} firstName - Guest's first name
   * @param {string} lastName - Guest's last name
   * @returns {{ added: boolean, starIconVisible: boolean, guestData: Object }}
   */
  async addRandomGuestWithName(page, firstName, lastName) {
    if (!page) throw new Error('page is required');
    if (!firstName || typeof firstName !== 'string') throw new Error('firstName must be a non-empty string');
    if (!lastName || typeof lastName !== 'string') throw new Error('lastName must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);
    const { dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },

  /**
   * Adds a guest traveler with a specific first/last name and user group.
   * Selects "Users Group" in the copy-settings section, then picks the given group
   * before filling in personal details and submitting.
   *
   * @param {import('playwright').Page} page
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} userGroupName - Visible label of the user group (e.g. "Adis Ababa")
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number}>}
   */
  async addGuestWithUserGroup(page, firstName, lastName, userGroupName) {
    if (!page) throw new Error('[Search.addGuestWithUserGroup] "page" is required.');
    if (!firstName || typeof firstName !== 'string') throw new Error('[Search.addGuestWithUserGroup] "firstName" must be a non-empty string');
    if (!lastName || typeof lastName !== 'string') throw new Error('[Search.addGuestWithUserGroup] "lastName" must be a non-empty string');
    if (!userGroupName || typeof userGroupName !== 'string') throw new Error('[Search.addGuestWithUserGroup] "userGroupName" must be a non-empty string');

    logger.debug(`[Search.addGuestWithUserGroup] Adding guest ${firstName} ${lastName} with user group "${userGroupName}"`);

    const searchPage = getPageObject(page, SearchPage);
    const { dateOfBirth, email, phone } = generateRandomGuestData();

    try {
      await searchPage.clickAddTravelerButton();
      await searchPage.clickAddGuestTravelerButton();
      await searchPage.selectCopySettingsFromUsersGroup();
      await searchPage.selectUserGroupByName(userGroupName);
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderMale();
      await searchPage.fillInRandomDateOfBirth(dateOfBirth);
      await searchPage.fillInRandomEmail(email);
      await searchPage.fillInRandomPhone(phone);
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(`[Search.addGuestWithUserGroup] Failed to add guest "${firstName} ${lastName}" with user group "${userGroupName}": ${err.message}`);
    }

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return { added: true, starIconVisible, selectedTravelerCount };
  },

  /**
   * Adds a random guest traveler, NOT as the primary traveler, whose settings are
   * copied from a named user group. Unchecks the "Use as primary traveller" checkbox
   * first (checked by default) so the booker stays primary and the approval flow is
   * driven by the booker's user group, then selects "Users Group", picks the given
   * group by name, and fills auto-generated personal/contact details before
   * submitting. Used by approval-flow tests (test 37327).
   *
   * The primary checkbox must be unchecked BEFORE opening the guest form: the guest
   * form inherits isPrimary from the edit-traveler dialog, and the checkbox is no
   * longer rendered once guest mode is active.
   *
   * @param {import('playwright').Page} page
   * @param {string} userGroupName - Visible label of the user group (e.g. "Jalisco")
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object}>}
   */
  async addRandomGuestCopyingSettingsFromUserGroup(page, userGroupName) {
    if (!page) throw new Error('[Search.addRandomGuestCopyingSettingsFromUserGroup] "page" is required.');
    if (!userGroupName || typeof userGroupName !== 'string') {
      throw new Error('[Search.addRandomGuestCopyingSettingsFromUserGroup] "userGroupName" must be a non-empty string');
    }

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    try {
      await searchPage.clickAddTravelerButton();
      await searchPage.uncheckPrimaryTravelerCheckbox();
      await searchPage.clickAddGuestTravelerButton();
      await searchPage.selectCopySettingsFromUsersGroup();
      await searchPage.selectUserGroupByName(userGroupName);
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderMale();
      await searchPage.fillInRandomDateOfBirth(dateOfBirth);
      await searchPage.fillInRandomEmail(email);
      await searchPage.fillInRandomPhone(phone);
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(`[Search.addRandomGuestCopyingSettingsFromUserGroup] Failed to add random guest copying settings from user group "${userGroupName}": ${err.message}`);
    }

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },

  /**
   * Adds a random guest traveler whose first name is padded with leading and
   * trailing spaces. Used to verify that the booking flow trims whitespace
   * from names before sending them to the supplier (e.g. Fusion ProcessTerms).
   *
   * @param {Object} page - Playwright page instance
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object}>}
   */
  async addRandomGuestWithSpacesInFirstName(page) {
    if (!page) throw new Error('page is required');

    const { firstName, lastName } = generateRandomGuestData();
    const paddedFirstName = ` ${firstName} `;
    return Search.addRandomGuestWithName(page, paddedFirstName, lastName);
  },

  /**
   * Adds a random guest traveler and fills the middle-name input with the
   * provided value. First/last name, DOB, email and phone are auto-generated.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} middleName - Middle name to fill in the guest form
   * @returns {Promise<{added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object}>}
   */
  async addRandomGuestWithMiddleName(page, middleName) {
    if (!page) throw new Error('page is required');
    if (!middleName || typeof middleName !== 'string') {
      throw new Error('middleName must be a non-empty string, got: ' + middleName);
    }

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    await searchPage.clickAddTravelerButton();
    await searchPage.clickAddGuestTravelerButton();
    await searchPage.fillInRandomFirstName(firstName);
    await searchPage.fillInGuestMiddleName(middleName);
    await searchPage.fillInRandomLastName(lastName);
    await searchPage.selectGenderMale();
    await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    await searchPage.fillInRandomEmail(email);
    await searchPage.fillInRandomPhone(phone);
    await searchPage.clickAddGuestButton();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, middleName, lastName, dateOfBirth, email, phone },
    };
  },

  async openAddGuestTravelerForm(page) {
    if (!page) throw new Error('[Search.openAddGuestTravelerForm] "page" is required.');

    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddTravelerButton();
    } catch (err) {
      throw new Error(`[Search.openAddGuestTravelerForm] Failed to open traveler drawer: ${err.message}`);
    }

    try {
      await searchPage.clickAddGuestTravelerButton();
    } catch (err) {
      throw new Error(`[Search.openAddGuestTravelerForm] Failed to click "Add guest traveler" button: ${err.message}`);
    }
  },

  async openGuestDobPicker(page) {
    if (!page) throw new Error('[Search.openGuestDobPicker] "page" is required.');

    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickDobInput();
    } catch (err) {
      throw new Error(`[Search.openGuestDobPicker] Failed to open DOB date picker: ${err.message}`);
    }
  },

  async verifyDobYearRestriction(page, minAge) {
    if (!page) throw new Error('[Search.verifyDobYearRestriction] "page" is required.');
    if (!Number.isInteger(minAge) || minAge < 1) {
      throw new Error(`[Search.verifyDobYearRestriction] "minAge" must be a positive integer, got: ${minAge}`);
    }

    const searchPage = getPageObject(page, SearchPage);
    const displayedYear = await searchPage.getDobPickerYear();
    const expectedYear = new Date().getFullYear() - minAge;

    if (displayedYear !== expectedYear) {
      throw new Error(
        `[Search.verifyDobYearRestriction] DOB picker year restriction failed. ` +
        `Expected year ${expectedYear} (current year - ${minAge}), but picker displays ${displayedYear}. ` +
        `The date picker may not be restricting travelers under ${minAge}.`
      );
    }

    return { displayedYear, expectedYear };
  },

  async verifyDobPickerStillOpen(page) {
    if (!page) throw new Error('[Search.verifyDobPickerStillOpen] "page" is required.');

    const searchPage = getPageObject(page, SearchPage);
    await searchPage.isDobPickerPanelBodyVisible();
  },

  /**
   * Verifies that the add-traveler icon button is visible on the new-trip search page.
   * @param {import('playwright').Page} page
   */
  async verifyTravelerIconDisplayed(page) {
    if (!page) throw new Error('[Search.verifyTravelerIconDisplayed] "page" is required.');

    logger.debug('[Search.verifyTravelerIconDisplayed] Checking traveler icon button visibility');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.waitForAddTravelerIconVisible();
    } catch (err) {
      throw new Error(`[Search.verifyTravelerIconDisplayed] Traveler icon not displayed on search page: ${err.message}`);
    }
  },

  /**
   * Clicks the add-traveler button and waits for the edit-traveler dialog to open.
   * @param {import('playwright').Page} page
   */
  async clickAddTraveler(page) {
    if (!page) throw new Error('[Search.clickAddTraveler] "page" is required.');

    logger.debug('[Search.clickAddTraveler] Clicking add-traveler button');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddTravelerButton();
    } catch (err) {
      throw new Error(`[Search.clickAddTraveler] Failed to open add-traveler dialog: ${err.message}`);
    }
  },

  /**
   * Selects the copy-settings radio in the guest form by type name.
   * Currently supports "Users Group" (second radio).
   * @param {import('playwright').Page} page
   * @param {string} settingsType - Visible label of the radio option (e.g. "Users Group")
   */
  async selectGuestCopySettings(page, settingsType) {
    if (!page) throw new Error('[Search.selectGuestCopySettings] "page" is required.');
    if (!settingsType || typeof settingsType !== 'string') throw new Error('[Search.selectGuestCopySettings] "settingsType" must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);

    if (settingsType === 'Users Group') {
      try {
        await searchPage.selectCopySettingsFromUsersGroup();
      } catch (err) {
        throw new Error(`[Search.selectGuestCopySettings] Failed to select "Users Group" copy settings: ${err.message}`);
      }
    } else {
      throw new Error(`[Search.selectGuestCopySettings] Unsupported settings type "${settingsType}". Supported: "Users Group"`);
    }
  },

  /**
   * Fills in guest personal details (first name, last name, gender, email) without DOB or phone.
   * Use this when the scenario requires partial submission to test field validation.
   * @param {import('playwright').Page} page
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} gender - Visible option label (e.g. "Female", "Male")
   * @param {string} email
   */
  async fillGuestDetails(page, firstName, lastName, gender, email) {
    if (!page) throw new Error('[Search.fillGuestDetails] "page" is required.');
    if (!firstName || typeof firstName !== 'string') throw new Error('[Search.fillGuestDetails] "firstName" must be a non-empty string');
    if (!lastName || typeof lastName !== 'string') throw new Error('[Search.fillGuestDetails] "lastName" must be a non-empty string');
    if (!gender || typeof gender !== 'string') throw new Error('[Search.fillGuestDetails] "gender" must be a non-empty string');
    if (!email || typeof email !== 'string') throw new Error('[Search.fillGuestDetails] "email" must be a non-empty string');

    logger.debug('[Search.fillGuestDetails] Filling guest details', { firstName, lastName, gender, email });

    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderByName(gender);
      await searchPage.fillInRandomEmail(email);
    } catch (err) {
      throw new Error(`[Search.fillGuestDetails] Failed to fill guest details: ${err.message}`);
    }
  },

  /**
   * Clicks the "Add guest" button without waiting for the modal to close.
   * Triggers form validation so mandatory-field errors become visible.
   * @param {import('playwright').Page} page
   */
  async attemptAddGuestTraveler(page) {
    if (!page) throw new Error('[Search.attemptAddGuestTraveler] "page" is required.');

    logger.debug('[Search.attemptAddGuestTraveler] Clicking Add guest to trigger validation');

    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddGuestButtonWithoutWaiting();
    } catch (err) {
      throw new Error(`[Search.attemptAddGuestTraveler] Failed to click Add guest button: ${err.message}`);
    }
  },

  /**
   * Asserts that the user-group select field is flagged as mandatory (is-danger).
   * Fails if the validation error is not visible after attempting to submit.
   * @param {import('playwright').Page} page
   */
  async verifyUserGroupMandatory(page) {
    if (!page) throw new Error('[Search.verifyUserGroupMandatory] "page" is required.');

    logger.debug('[Search.verifyUserGroupMandatory] Checking user group mandatory state');

    const searchPage = getPageObject(page, SearchPage);
    const isMandatory = await searchPage.isUserGroupFieldMandatory();

    if (!isMandatory) {
      throw new Error('[Search.verifyUserGroupMandatory] User group field is not flagged as mandatory (is-danger class not found). Ensure "Users Group" copy settings is selected and the form was submitted without choosing a group.');
    }
  },

  /**
   * Selects a passenger (traveler) type in the open guest form.
   * @param {import('playwright').Page} page
   * @param {string} passengerType - Passenger type as shown in the UI (e.g. "Child", "Senior", "Lap Infant")
   */
  async selectGuestPassengerType(page, passengerType) {
    if (!page) throw new Error('[Search.selectGuestPassengerType] "page" is required.');
    if (!passengerType || typeof passengerType !== 'string') {
      throw new Error(`[Search.selectGuestPassengerType] "passengerType" must be a non-empty string, got: ${typeof passengerType}`);
    }

    logger.debug('[Search.selectGuestPassengerType] Selecting guest passenger type', { passengerType });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.selectGuestPassengerType(passengerType);
    } catch (err) {
      throw new Error(`[Search.selectGuestPassengerType] Failed to select passenger type "${passengerType}" in the guest form: ${err.message}`);
    }
  },

  /**
   * Fills the guest first name and last name in the open guest form.
   * @param {import('playwright').Page} page
   * @param {string} firstName
   * @param {string} lastName
   */
  async fillGuestName(page, firstName, lastName) {
    if (!page) throw new Error('[Search.fillGuestName] "page" is required.');
    if (!firstName || typeof firstName !== 'string') {
      throw new Error(`[Search.fillGuestName] "firstName" must be a non-empty string, got: ${typeof firstName}`);
    }
    if (!lastName || typeof lastName !== 'string') {
      throw new Error(`[Search.fillGuestName] "lastName" must be a non-empty string, got: ${typeof lastName}`);
    }

    logger.debug('[Search.fillGuestName] Filling guest name', { firstName, lastName });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
    } catch (err) {
      throw new Error(`[Search.fillGuestName] Failed to fill guest name "${firstName} ${lastName}": ${err.message}`);
    }
  },

  /**
   * Fills the guest date of birth in the open guest form.
   * @param {import('playwright').Page} page
   * @param {string} dateOfBirth - Date in DD/MM/YYYY format
   */
  async fillGuestDateOfBirth(page, dateOfBirth) {
    if (!page) throw new Error('[Search.fillGuestDateOfBirth] "page" is required.');
    if (!dateOfBirth || typeof dateOfBirth !== 'string') {
      throw new Error(`[Search.fillGuestDateOfBirth] "dateOfBirth" must be a non-empty string, got: ${typeof dateOfBirth}`);
    }

    logger.debug('[Search.fillGuestDateOfBirth] Filling guest date of birth', { dateOfBirth });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.fillInRandomDateOfBirth(dateOfBirth);
    } catch (err) {
      throw new Error(`[Search.fillGuestDateOfBirth] Failed to fill guest date of birth "${dateOfBirth}": ${err.message}`);
    }
  },

  /**
   * Fills the guest email in the open guest form.
   * @param {import('playwright').Page} page
   * @param {string} email
   */
  async fillGuestEmail(page, email) {
    if (!page) throw new Error('[Search.fillGuestEmail] "page" is required.');
    if (!email || typeof email !== 'string') {
      throw new Error(`[Search.fillGuestEmail] "email" must be a non-empty string, got: ${typeof email}`);
    }

    logger.debug('[Search.fillGuestEmail] Filling guest email', { email });
    const searchPage = getPageObject(page, SearchPage);

    try {
      // Clicking the email field first dismisses the DOB calendar that overlays it (and the
      // fields below), so the fill and the subsequent gender selection are not blocked.
      await searchPage.clickGuestEmailField();
      await searchPage.fillInRandomEmail(email);
    } catch (err) {
      throw new Error(`[Search.fillGuestEmail] Failed to fill guest email "${email}": ${err.message}`);
    }
  },

  /**
   * Clicks the guest email field, which also blurs the date-of-birth field and triggers
   * the guest form's validation so required-field errors become visible.
   * @param {import('playwright').Page} page
   */
  async clickGuestEmailField(page) {
    if (!page) throw new Error('[Search.clickGuestEmailField] "page" is required.');

    logger.debug('[Search.clickGuestEmailField] Clicking guest email field, then triggering form validation');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickGuestEmailField();
      // The guest form only surfaces required-field errors after a submit attempt (the form sets
      // markFields on submit — clicking a field does not). Attempt to add the guest to trigger
      // validation; the form is invalid (email empty), so the modal stays open with the
      // required-email error visible for the assertion that follows.
      await searchPage.clickAddGuestButtonWithoutWaiting();
    } catch (err) {
      throw new Error(`[Search.clickGuestEmailField] Failed to click the guest email field and trigger validation: ${err.message}`);
    }
  },

  /**
   * Selects the guest gender in the open guest form.
   * @param {import('playwright').Page} page
   * @param {string} gender - Gender option label as shown in the UI (e.g. "Male", "Female")
   */
  async selectGuestGender(page, gender) {
    if (!page) throw new Error('[Search.selectGuestGender] "page" is required.');
    if (!gender || typeof gender !== 'string') {
      throw new Error(`[Search.selectGuestGender] "gender" must be a non-empty string, got: ${typeof gender}`);
    }

    logger.debug('[Search.selectGuestGender] Selecting guest gender', { gender });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.selectGenderByName(gender);
    } catch (err) {
      throw new Error(`[Search.selectGuestGender] Failed to select guest gender "${gender}": ${err.message}`);
    }
  },

  /**
   * Reads the validation error text shown under the guest email field.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The error message text
   */
  async getGuestEmailFieldError(page) {
    if (!page) throw new Error('[Search.getGuestEmailFieldError] "page" is required.');

    logger.debug('[Search.getGuestEmailFieldError] Reading guest email field error');
    const searchPage = getPageObject(page, SearchPage);

    try {
      return await searchPage.getGuestEmailFieldError();
    } catch (err) {
      throw new Error(`[Search.getGuestEmailFieldError] Failed to read the guest email field error: ${err.message}`);
    }
  },

  /**
   * Submits the guest form by clicking the "Add guest" button and waits for the modal to close.
   * @param {import('playwright').Page} page
   */
  async confirmAddGuest(page) {
    if (!page) throw new Error('[Search.confirmAddGuest] "page" is required.');

    logger.debug('[Search.confirmAddGuest] Clicking "Add guest" to submit the guest form');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(`[Search.confirmAddGuest] Failed to submit the guest form via "Add guest": ${err.message}`);
    }
  },

  /**
   * Reads the non-adult passenger-type tag text shown on the added guest chip.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The tag text (e.g. "Child", "Lap Infant")
   */
  async getPassengerTypeTag(page) {
    if (!page) throw new Error('[Search.getPassengerTypeTag] "page" is required.');

    logger.debug('[Search.getPassengerTypeTag] Reading passenger-type tag text');
    const searchPage = getPageObject(page, SearchPage);

    try {
      return await searchPage.getPassengerTypeTagText();
    } catch (err) {
      throw new Error(`[Search.getPassengerTypeTag] Failed to read the passenger-type tag: ${err.message}`);
    }
  },

  /**
   * Returns whether the given message is displayed on the search page.
   * @param {import('playwright').Page} page
   * @param {string} message - Message text to look for
   * @returns {Promise<boolean>}
   */
  async isSearchMessageDisplayed(page, message) {
    if (!page) throw new Error('[Search.isSearchMessageDisplayed] "page" is required.');
    if (!message || typeof message !== 'string') {
      throw new Error(`[Search.isSearchMessageDisplayed] "message" must be a non-empty string, got: ${typeof message}`);
    }

    logger.debug('[Search.isSearchMessageDisplayed] Checking search message visibility', { message });
    const searchPage = getPageObject(page, SearchPage);

    try {
      return await searchPage.isValidationMessageVisible(message);
    } catch (err) {
      throw new Error(`[Search.isSearchMessageDisplayed] Failed to check whether the message "${message}" is displayed: ${err.message}`);
    }
  },

  /**
   * Clicks the request assistance ("Travel request") icon/button on the search page.
   * @param {import('playwright').Page} page
   */
  async clickRequestAssistanceIcon(page) {
    if (!page) throw new Error('[Search.clickRequestAssistanceIcon] "page" is required.');

    logger.debug('[Search.clickRequestAssistanceIcon] Clicking the request assistance icon');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickTravelRequestButton();
    } catch (err) {
      throw new Error(`[Search.clickRequestAssistanceIcon] Failed to click the request assistance icon: ${err.message}`);
    }
  },

  /**
   * Reads the travelers section title on the request-assistance page.
   * @param {import('playwright').Page} page
   * @returns {Promise<string>} The section title text
   */
  async getTravelersSectionTitle(page) {
    if (!page) throw new Error('[Search.getTravelersSectionTitle] "page" is required.');

    logger.debug('[Search.getTravelersSectionTitle] Reading travelers section title');
    const searchPage = getPageObject(page, SearchPage);

    try {
      return await searchPage.getRequestAssistanceTravelersTitle();
    } catch (err) {
      throw new Error(`[Search.getTravelersSectionTitle] Failed to read the travelers section title: ${err.message}`);
    }
  },

  /**
   * Verifies that a traveler checkbox with the given label text is visible
   * in the edit-traveler dialog.
   * @param {import('playwright').Page} page
   * @param {string} labelText - Expected checkbox label text
   */
  async verifyTravelerCheckboxVisible(page, labelText) {
    if (!page) throw new Error('[Search.verifyTravelerCheckboxVisible] "page" is required.');
    if (!labelText || typeof labelText !== 'string') {
      throw new Error(`[Search.verifyTravelerCheckboxVisible] "labelText" must be a non-empty string, got: ${typeof labelText} (${JSON.stringify(labelText)})`);
    }

    logger.debug('[Search.verifyTravelerCheckboxVisible] Verifying traveler checkbox visibility', { labelText });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.isCheckboxWithLabelVisible(labelText);
    } catch (err) {
      throw new Error(`[Search.verifyTravelerCheckboxVisible] Checkbox "${labelText}" not visible in edit-traveler dialog: ${err.message}`);
    }
  },

  /**
   * Waits until the named traveler's chip is visible in the travelers list.
   * The chip uses .traveler-name.black to indicate a confirmed named traveler.
   * @param {import('playwright').Page} page
   * @param {string} name - Full name to look for (e.g. "Gadi Cohen")
   */
  async verifyTravelerNameVisible(page, name) {
    if (!page) throw new Error('[Search.verifyTravelerNameVisible] "page" is required.');
    if (!name || typeof name !== 'string') {
      throw new Error(`[Search.verifyTravelerNameVisible] "name" must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`);
    }

    logger.info('[Search.verifyTravelerNameVisible] Verifying traveler name is visible in travelers list', { name });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.waitForTravelerNameVisible(name);
    } catch (err) {
      throw new Error(`[Search.verifyTravelerNameVisible] Traveler "${name}" not visible in the travelers list: ${err.message}`);
    }
  },

  /**
   * Asserts that the star icon is visible in the travelers section.
   * @param {import('playwright').Page} page
   */
  async assertStarIconVisible(page) {
    if (!page) throw new Error('[Search.assertStarIconVisible] "page" is required.');

    logger.debug('[Search.assertStarIconVisible] Checking star icon visibility');
    const searchPage = getPageObject(page, SearchPage);

    const isVisible = await searchPage.isStarIconVisible();
    if (!isVisible) {
      throw new Error(
        '[Search.assertStarIconVisible] Star icon is not visible in the travelers section. ' +
        'The traveler may not have been preselected as expected.'
      );
    }
  },

  /**
   * Verifies that both add-traveler controls are hidden, asserting that adding more travelers is not possible.
   * Expected when the DisableBookForMultiPax permission is active and a traveler is already selected.
   * @param {import('playwright').Page} page
   */
  async verifyCannotAddMoreTravelers(page) {
    if (!page) throw new Error('[Search.verifyCannotAddMoreTravelers] "page" is required.');

    logger.debug('[Search.verifyCannotAddMoreTravelers] Verifying add-traveler controls are hidden');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.assertAddTravelerButtonNotVisible();
    } catch (err) {
      throw new Error(`[Search.verifyCannotAddMoreTravelers] Adding more travelers should not be possible: ${err.message}`);
    }
  },

  /**
   * Adds an empty traveler slot by clicking the add-traveler button and closing
   * the modal without selecting anyone. The slot is preserved in the store because
   * numberOfPassengers was incremented before the modal opened.
   * @param {import('playwright').Page} page
   */
  async addEmptyTravelerSlot(page) {
    if (!page) throw new Error('[Search.addEmptyTravelerSlot] "page" is required.');

    logger.info('[Search.addEmptyTravelerSlot] Adding empty traveler slot');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.clickAddEmptyTravelerSlot();
    } catch (err) {
      throw new Error(`[Search.addEmptyTravelerSlot] Failed to add empty traveler slot: ${err.message}`);
    }
  },

  /**
   * Verifies that only the empty traveler slot is highlighted in red (.is-danger) while
   * named traveler slots are not. Must be called right after a search has been submitted
   * with an empty traveler slot present.
   * @param {import('playwright').Page} page
   */
  async verifyOnlyEmptyTravelerSlotIsRed(page) {
    if (!page) throw new Error('[Search.verifyOnlyEmptyTravelerSlotIsRed] "page" is required.');

    logger.info('[Search.verifyOnlyEmptyTravelerSlotIsRed] Verifying only empty traveler slot is highlighted');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.verifyOnlyEmptyTravelerSlotIsRed();
    } catch (err) {
      throw new Error(`[Search.verifyOnlyEmptyTravelerSlotIsRed] ${err.message}`);
    }
  },
};

module.exports = Search;
