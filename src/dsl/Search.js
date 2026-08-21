const { expect } = require("@playwright/test");
const { getPageObject } = require("@utils/pageObjectCache");
const { SearchPage } = require("@pages/SearchPage");
const { generateRandomGuestData } = require("@utils/data/generateRandomGuestData.js");
const logger = require("@utils/logger").child("Search");

// Builds a DD/MM/YYYY date of birth for an exact age (guest form's DOB input format), rather than
// generateRandomGuestData's random 25-60 range — used where a scenario needs every guest passenger
// to land in the same fare/age bracket regardless of when the test runs (test 62001).
function getFixedAgeDateOfBirth(age) {
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age);
  const day = String(dob.getDate()).padStart(2, '0');
  const month = String(dob.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${dob.getFullYear()}`;
}

// trip.store.ts addTraveler dispatches loadTrip (GET /tripinit) WITHOUT awaiting it — the response
// lands seconds after the add-traveler UI settles, commits setTrip (replacing trip.passengers),
// and extras-layout.ts's passengers watcher force-closes any open extras panel (e.g. rail
// passenger info). networkidle is not enough: there's a network-quiet gap before the delayed
// reload request even starts, so it resolves too early. Arm this BEFORE the add action fires,
// then await the returned settle() after — so callers only proceed once the reload has landed
// and the watcher-triggered re-render has settled (test 62001).
function armTripReloadSettle(page, timeout = 30000) {
  const responsePromise = page
    .waitForResponse((response) => response.url().includes('/tripinit'), { timeout })
    .catch(() => null);
  return async () => {
    await responsePromise;
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  };
}

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
    const settleTripReload = armTripReloadSettle(page);
    await searchPage.clickAddTravelerButton();
    const result = await Search.fillInTravelerNameAndSave(page, name);
    await settleTripReload();

    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    return {
      ...result,
      selectedTravelerCount,
    };
  },

  /**
   * Checks whether a traveler is available to add via the add-traveller autocomplete.
   *
   * Opens the add-traveller dialog, types the name, and reports whether a matching result is
   * offered. Used for negative validation: a traveller outside the booker's permitted user group
   * yields no result, so the calling step asserts this returns false.
   *
   * @param {import('playwright').Page} page
   * @param {string} name - Traveler name to search for
   * @returns {Promise<boolean>} true if a matching option is offered, false if not available
   */
  async isTravelerAvailableToAdd(page, name) {
    if (!page) {
      throw new Error('[Search.isTravelerAvailableToAdd] "page" is required.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error(
        `[Search.isTravelerAvailableToAdd] "name" must be a non-empty string, got: ${typeof name}`
      );
    }

    logger.debug(`[Search.isTravelerAvailableToAdd] Opening add-traveller dialog and searching for "${name}"`);
    const searchPage = getPageObject(page, SearchPage);

    try {
      // Let the previous add-traveller dialog finish closing before opening a fresh one, so the
      // shared close helper does not race the closing animation.
      await searchPage.waitForEditTravelerModalHidden();
      await searchPage.clickAddTravelerButton();
      await searchPage.fillInTravelerName(name);
      const available = await searchPage.hasVisibleTravelerOption(name);
      logger.info(`[Search.isTravelerAvailableToAdd] Traveler "${name}" available to add: ${available}`);
      return available;
    } catch (err) {
      throw new Error(
        `[Search.isTravelerAvailableToAdd] Failed to check whether traveler "${name}" is available to add. ` +
        `Ensure the "Add traveller" button is visible and the add-traveller dialog opened. Original: ${err.message}`
      );
    }
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
   * Adds a random guest through the empty traveler slot's own "Select traveller" placeholder
   * instead of the round add-traveler button.
   *
   * Use after removeTraveler(): the round add-btn appends a NEW slot, leaving the emptied
   * primary slot unfilled, whereas this fills the emptied slot so the guest becomes the trip's
   * primary traveler -- which is what content-driven-by-traveller tests need.
   *
   * Pass `userGroupName` to copy the guest's settings from a named user group. That is what
   * decides which content the guest is entitled to see, so entitlement tests must set it --
   * a guest with no user group inherits the booker's own (fully entitled) content instead.
   *
   * Note there is no primary-traveler checkbox to handle here: filling the only empty slot
   * makes the guest the trip's primary traveler by construction.
   *
   * @param {Object} page - Playwright page instance
   * @param {string} [label='Select traveller'] - The placeholder's visible label.
   * @param {string|null} [userGroupName=null] - User group to copy settings from, e.g. "evolvi".
   * @returns {Promise<Object>} added / starIconVisible / isPrimary / selectedTravelerCount / guestData
   */
  async addRandomGuestViaSelectTravelerSlot(page, label = 'Select traveller', userGroupName = null) {
    if (!page) {
      throw new Error('page is required');
    }
    if (!label || typeof label !== 'string') {
      throw new Error('label must be a non-empty string, got: ' + typeof label);
    }
    if (userGroupName !== null && (typeof userGroupName !== 'string' || userGroupName.length === 0)) {
      throw new Error('userGroupName, when provided, must be a non-empty string');
    }

    logger.debug(`[Search.addRandomGuestViaSelectTravelerSlot] Adding guest via the "${label}" slot`, { userGroupName });

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, email, phone } = generateRandomGuestData();

    try {
      await searchPage.clickSelectTravelerSlot(label);
      await searchPage.clickAddGuestTravelerButton();
      if (userGroupName) {
        await searchPage.selectCopySettingsFromUsersGroup();
        await searchPage.selectUserGroupByName(userGroupName);
      }
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderMale();
      await searchPage.fillInRandomDateOfBirth(dateOfBirth);
      await searchPage.fillInRandomEmail(email);
      await searchPage.fillInRandomPhone(phone);
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(
        `[Search.addRandomGuestViaSelectTravelerSlot] Failed to add a random guest via the "${label}" ` +
        `traveler slot${userGroupName ? ` copying settings from user group "${userGroupName}"` : ''}: ` +
        `${err.message}`
      );
    }

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();
    // Filling the only empty slot should make this guest the primary traveller, but read it back
    // from the guest's OWN tag rather than assuming it -- see isTravelerPrimaryByName.
    const isPrimary = await searchPage.isTravelerPrimaryByName(`${firstName} ${lastName}`);

    return {
      added: true,
      starIconVisible,
      isPrimary,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone, userGroupName },
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
   * Adds a random guest traveler with a specific email address.
   * All other data (name, DOB, phone) is randomly generated.
   * @param {Object} page - Playwright page instance
   * @param {string} email - Guest's email address
   * @returns {{ added: boolean, starIconVisible: boolean, guestData: Object }}
   */
  async addRandomGuestWithEmail(page, email) {
    if (!page) throw new Error('page is required');
    if (!email || typeof email !== 'string') throw new Error('email must be a non-empty string');

    const searchPage = getPageObject(page, SearchPage);
    const { firstName, lastName, dateOfBirth, phone } = generateRandomGuestData();

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
   * Adds a new guest traveler with a specific full name and a specific email address. Unlike
   * addRandomGuestWithName/addRandomGuestWithEmail (which fix one field and randomize the rest),
   * this fixes both — used when a scenario later asserts the exact email against a specific
   * passenger. Works identically whether the "Add Traveller" button is on the pre-search widget
   * or the cart page's own Travellers section: both render the same shared trip-travelers-list.vue
   * / trip-edit-traveler.vue components (confirmed against Atriis.App source — same classes,
   * same dialog markup). Date of birth is fixed to exactly 30 years old (not the random 25-60
   * range) so every guest passenger lands in the same fare/age bracket (test 62001).
   *
   * @param {import('playwright').Page} page
   * @param {string} fullName - Guest's full name, e.g. "Ellen Murphy" (split on whitespace into
   *   first name + last name; a middle name would be folded into the last name)
   * @param {string} email - Guest's email address
   * @returns {{ added: boolean, starIconVisible: boolean, guestData: Object }}
   */
  async addGuestWithNameAndEmail(page, fullName, email) {
    if (!page) throw new Error('[Search.addGuestWithNameAndEmail] "page" is required.');
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      throw new Error(`[Search.addGuestWithNameAndEmail] "fullName" must be a non-empty string, got: ${JSON.stringify(fullName)}`);
    }
    if (!email || typeof email !== 'string') {
      throw new Error(`[Search.addGuestWithNameAndEmail] "email" must be a non-empty string, got: ${typeof email}`);
    }

    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(' ');
    if (!lastName) {
      throw new Error(`[Search.addGuestWithNameAndEmail] "fullName" must include both a first and last name, got: "${fullName}"`);
    }

    const searchPage = getPageObject(page, SearchPage);
    const { phone } = generateRandomGuestData();
    const dateOfBirth = getFixedAgeDateOfBirth(30);

    // NOTE: if a prior traveler (e.g. added by name via the autocomplete) hasn't fully rendered yet,
    // trip-travelers-list.vue's addEmptyTraveler() can compute firstEmptyTravelerIdx off the
    // not-yet-committed travelers array, so clicking "Add Traveller" here targets the still-resolving
    // slot instead of creating a genuinely new one — silently overwriting the prior traveler instead
    // of adding this guest alongside them. Callers adding this guest right after another traveler
    // should wait for that traveler's name to be displayed first (see the existing "I wait for the
    // traveler name to be displayed" step / Search.waitForTravelerNameDisplayed) — this method can't
    // reliably detect "still resolving" itself, since sampling the count here risks reading the same
    // stale, not-yet-rendered state it would be trying to wait out.
    const settleTripReload = armTripReloadSettle(page);
    try {
      await searchPage.clickAddTravelerButton();
      await searchPage.clickAddGuestTravelerButton();
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderMale();
      await searchPage.fillInRandomDateOfBirth(dateOfBirth);
      await searchPage.fillInRandomEmail(email);
      await searchPage.fillInRandomPhone(phone);
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(
        `[Search.addGuestWithNameAndEmail] Failed to add guest traveler "${fullName}" with email "${email}". Original: ${err.message}`
      );
    }
    await settleTripReload();

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    logger.info('[Search.addGuestWithNameAndEmail] Added guest traveler', { fullName, email });

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth, email, phone },
    };
  },

  /**
   * Adds a guest traveler with a specific first/last name but NO date of birth. Used for
   * scenarios covering rail products (e.g. Benerail) that require the DOB to be entered
   * separately in the cart extras when a passenger's DOB isn't pre-configured (see test 33896).
   * Otherwise identical to addGuestWithNameAndEmail — same widget/dialog, own randomly
   * generated email/phone since the caller doesn't need to assert against them.
   *
   * @param {import('playwright').Page} page
   * @param {string} firstName
   * @param {string} lastName
   * @returns {{ added: boolean, starIconVisible: boolean, selectedTravelerCount: number, guestData: Object }}
   */
  async addGuestWithoutDateOfBirth(page, firstName, lastName) {
    if (!page) throw new Error('[Search.addGuestWithoutDateOfBirth] "page" is required.');
    if (!firstName || typeof firstName !== 'string') {
      throw new Error(`[Search.addGuestWithoutDateOfBirth] "firstName" must be a non-empty string, got: ${typeof firstName}`);
    }
    if (!lastName || typeof lastName !== 'string') {
      throw new Error(`[Search.addGuestWithoutDateOfBirth] "lastName" must be a non-empty string, got: ${typeof lastName}`);
    }

    const searchPage = getPageObject(page, SearchPage);
    const { email, phone } = generateRandomGuestData();

    try {
      await searchPage.clickAddTravelerButton();
      await searchPage.clickAddGuestTravelerButton();
      await searchPage.fillInRandomFirstName(firstName);
      await searchPage.fillInRandomLastName(lastName);
      await searchPage.selectGenderMale();
      await searchPage.fillInRandomEmail(email);
      await searchPage.fillInRandomPhone(phone);
      await searchPage.clickAddGuestButton();
    } catch (err) {
      throw new Error(
        `[Search.addGuestWithoutDateOfBirth] Failed to add guest traveler "${firstName} ${lastName}" without a date of birth. Original: ${err.message}`
      );
    }

    const starIconVisible = await searchPage.isStarIconVisible();
    const selectedTravelerCount = await searchPage.getSelectedTravelerCount();

    logger.info('[Search.addGuestWithoutDateOfBirth] Added guest traveler without date of birth', { firstName, lastName });

    return {
      added: true,
      starIconVisible,
      selectedTravelerCount,
      guestData: { firstName, lastName, dateOfBirth: null, email, phone },
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
   * Closes the open edit/guest-traveler dialog and confirms it is gone, so a following traveller
   * action cannot race the closing overlay.
   *
   * Deliberately stricter than SearchPage.closeVisibleEditTravelerModal, which returns silently when
   * the dialog is absent and swallows its own hidden-wait: here a missing dialog and a dialog that
   * refuses to close are both hard failures.
   * @param {import('playwright').Page} page
   */
  async closeEditTravelerDialog(page) {
    if (!page) throw new Error('[Search.closeEditTravelerDialog] "page" is required.');

    logger.debug('[Search.closeEditTravelerDialog] Closing the edit/guest-traveler dialog');
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.assertEditTravelerDialogVisible();
    } catch (err) {
      throw new Error(
        `[Search.closeEditTravelerDialog] Cannot close the guest-traveler dialog because it is not open. ` +
        `A preceding step should have opened it (e.g. "I open the add guest traveler form"). ` +
        `Original: ${err.message}`
      );
    }

    try {
      await searchPage.closeVisibleEditTravelerModal();
      await searchPage.assertEditTravelerModalHidden();
    } catch (err) {
      throw new Error(
        `[Search.closeEditTravelerDialog] The guest-traveler dialog did not close. ` +
        `The dialog header close button may be missing or the dialog is blocking dismissal. ` +
        `Original: ${err.message}`
      );
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
   * Verifies the open guest form offers exactly one traveller type matching the expected label.
   * @param {import('playwright').Page} page
   * @param {string} expectedType - Expected sole option label (partial match, e.g. "Adult (Ages 18+)")
   */
  async verifyOnlyGuestPassengerType(page, expectedType) {
    if (!page) throw new Error('[Search.verifyOnlyGuestPassengerType] "page" is required.');
    if (!expectedType || typeof expectedType !== 'string') {
      throw new Error(`[Search.verifyOnlyGuestPassengerType] "expectedType" must be a non-empty string, got: ${typeof expectedType}`);
    }

    logger.info('[Search.verifyOnlyGuestPassengerType] Verifying the guest form offers only one traveller type', { expectedType });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.verifyOnlyGuestPassengerType(expectedType);
    } catch (err) {
      throw new Error(`[Search.verifyOnlyGuestPassengerType] ${err.message}`);
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
   * Verifies the guest form's gender select prompts the user with the expected placeholder text
   * (i.e. no gender is pre-selected and the field tells the user to pick one).
   * @param {import('playwright').Page} page
   * @param {string} expectedPlaceholder - Exact placeholder text expected (e.g. "Please select gender")
   */
  async verifyGuestGenderPlaceholder(page, expectedPlaceholder) {
    if (!page) throw new Error('[Search.verifyGuestGenderPlaceholder] "page" is required.');
    if (!expectedPlaceholder || typeof expectedPlaceholder !== 'string') {
      throw new Error(
        `[Search.verifyGuestGenderPlaceholder] "expectedPlaceholder" must be a non-empty string, ` +
        `got: ${typeof expectedPlaceholder} (${JSON.stringify(expectedPlaceholder)})`
      );
    }

    logger.debug('[Search.verifyGuestGenderPlaceholder] Verifying guest gender placeholder text', { expectedPlaceholder });
    const searchPage = getPageObject(page, SearchPage);
    const expected = expectedPlaceholder.trim();
    let actualPlaceholder = '';

    try {
      // Poll: the guest form's selects mount and settle their labels a beat after the form opens,
      // so a single read can catch the field mid-render.
      await expect
        .poll(
          async () => {
            // Short inner timeout so the poll below can actually retry a mid-render read.
            actualPlaceholder = await searchPage.getGuestGenderPlaceholderText({ timeout: 3000 });
            return actualPlaceholder;
          },
          {
            timeout: 15000,
            message:
              `[Search.verifyGuestGenderPlaceholder] The gender field never displayed the expected ` +
              `placeholder "${expected}".`,
          }
        )
        .toBe(expected);
    } catch (err) {
      throw new Error(
        `[Search.verifyGuestGenderPlaceholder] Gender field placeholder mismatch in the guest form. ` +
        `Expected exactly "${expected}", last read "${actualPlaceholder}". ` +
        `Either a gender is pre-selected (so the prompt is not shown) or the prompt wording changed. ` +
        `Original: ${err.message}`
      );
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
  async verifyTravelerNameVisible(page, name, { timeout } = {}) {
    if (!page) throw new Error('[Search.verifyTravelerNameVisible] "page" is required.');
    if (!name || typeof name !== 'string') {
      throw new Error(`[Search.verifyTravelerNameVisible] "name" must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`);
    }
    if (timeout !== undefined && (typeof timeout !== 'number' || timeout <= 0)) {
      throw new Error(`[Search.verifyTravelerNameVisible] "timeout" must be a positive number of milliseconds, got: ${typeof timeout} (${JSON.stringify(timeout)})`);
    }

    logger.info('[Search.verifyTravelerNameVisible] Verifying traveler name is visible in travelers list', { name });
    const searchPage = getPageObject(page, SearchPage);

    try {
      await searchPage.waitForTravelerNameVisible(name, { timeout });
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

  /**
   * Submits the visible trip search form by clicking its Search button, waiting for the button
   * to be enabled first (search forms disable it until the required fields are filled).
   *
   * Product-agnostic and lives here rather than in FlightSearch: the button belongs to the shared
   * trip search form (SearchPage), and flight, shell and parking scenarios all submit through it.
   *
   * @param {Object} page - Playwright page instance
   * @returns {Promise<{searched: boolean}>}
   */
  async clickSearchButton(page) {
    if (!page) throw new Error('[Search.clickSearchButton] "page" is required.');

    logger.info('[Search.clickSearchButton] Submitting the trip search form');
    const searchPage = getPageObject(page, SearchPage);
    await searchPage.waitAndClickSearchButton();

    return { searched: true };
  },

  /**
   * Expands a collapsible section of the search form by its rendered title — e.g. "Advanced
   * search", which UK Rail hides its class/priority/split-ticket options behind. Already-expanded
   * sections are left open rather than toggled shut.
   *
   * @param {import('playwright').Page} page
   * @param {string} sectionTitle - The section title as rendered, e.g. "Advanced search"
   * @returns {Promise<{expanded: boolean, clicked: boolean}>}
   */
  async clickSearchFormSection(page, sectionTitle) {
    if (!page) throw new Error('[Search.clickSearchFormSection] "page" is required.');
    if (!sectionTitle || typeof sectionTitle !== 'string') {
      throw new Error(
        `[Search.clickSearchFormSection] "sectionTitle" must be a non-empty string, got: ${sectionTitle}`,
      );
    }

    logger.info('[Search.clickSearchFormSection] Expanding search form section', { sectionTitle });
    const searchPage = getPageObject(page, SearchPage);
    return searchPage.clickSearchFormCollapseSection(sectionTitle);
  },
};

module.exports = Search;
