const { expect } = require("@playwright/test");
const { faker } = require("@faker-js/faker");
const { getPageObject } = require("@utils/pageObjectCache");
const ProfilePage = require("@pages/ProfilePage");
const LoginPage = require("@pages/LoginPage");
// Only for the trip page this DSL returns to after closing a profile tab — the profile itself never
// touches the search form. See closeTravelerProfileAndReturn. Destructured, unlike ProfilePage
// above: SearchPage.js exports { SearchPage, SELECTORS }, so the bare module object is not a
// constructor and getPageObject rejects it.
const { SearchPage } = require("@pages/SearchPage");
const logger = require("@utils/logger").child("Profile");
const {
  parseDateValue,
  datesMatch,
  advanceSinglePickerCalendarUntilMonthVisible,
  clickDayInVisibleMonth,
} = require("@utils/calendar.helper");

// PUT target of the Frequent Programs form's Save button (user.service.ts saveFrequentProgramInfo).
const FREQUENT_PROGRAMS_SAVE_ENDPOINT = "/userProfileFrequentProgramInfo";

const MANDATORY_DETAILS_DIALOG_TITLE = "Mandatory Details Are Missing";

/**
 * Flattens a mandate-fields warning popup's text for comparison. The dialog stacks its message
 * across several divs, so the raw innerText carries line breaks and padding that vary with the
 * viewport — normalising keeps a wording comparison from failing on layout alone.
 *
 * @param {string} value
 * @returns {string}
 */
const normaliseWarningText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

/**
 * Profile DSL
 *
 * High-level actions for user profile management.
 * Describes WHAT the user does in their profile.
 */
const Profile = {
  /**
   * Navigates to the user profile by opening the header avatar menu and clicking "My profile".
   * The profile opens in a new tab — returns the new page instance.
   */
  async navigateToProfile(page) {
    if (!page) {
      throw new Error('[Profile.navigateToProfile] "page" is required.');
    }

    logger.debug("[Profile.navigateToProfile] Opening the avatar menu and clicking \"My profile\"");

    const profilePage = getPageObject(page, ProfilePage);
    const loginPage = getPageObject(page, LoginPage);
    const context = page.context();

    if (!context) {
      throw new Error('[Profile.navigateToProfile] Page context is null — cannot detect new tab.');
    }

    // Cookie consent banner can overlay the avatar — dismiss it first
    await loginPage.acceptCookiesIfPresent(8000);

    // Profile opens in a new window — listen for it before clicking
    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.openProfileMenu();
      await profilePage.clickMyProfile();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToProfile] Failed to navigate to user profile: ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;
    const targetPage = newProfilePage || page;

    if (newProfilePage) {
      logger.info("[Profile.navigateToProfile] Profile opened in a new tab");
    } else {
      // Fallback: profile opened in same tab
      logger.info("[Profile.navigateToProfile] Profile opened in current tab (no new tab detected)");
    }

    await targetPage.waitForLoadState("domcontentloaded", { timeout: 30000 });

    // domcontentloaded only means the SPA shell is up. user-profile.vue renders its <el-tabs>
    // behind `v-if="userProfile"`, so until the profile request resolves there is no
    // `#tab-<name>` in the DOM at all — every tab-clicking step that follows would race that
    // fetch on its own short timeout. Gate here so the step's contract is "the profile page is
    // rendered", the same gate openTravelerProfileFromLastTravelerTag already uses.
    try {
      await getPageObject(targetPage, ProfilePage).waitForUserProfilePage();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToProfile] "My profile" was clicked but the profile page never rendered ` +
        `(opened in ${newProfilePage ? "a new tab" : "the same tab"}, url: ${targetPage.url()}). ` +
        `Original: ${err.message}`
      );
    }

    return targetPage;
  },

  /**
   * Opens the header avatar dropdown and leaves it open.
   *
   * navigateToProfile above opens the same menu, but immediately commits to "My profile".
   * This is the standalone half, for scenarios that go on to pick a different entry (e.g.
   * the permission-gated "Manage profiles") or that assert on what the menu offers. The
   * latter has to inspect the panel BEFORE anything closes it - app-profile-menu.ts calls
   * closeMenu() on every entry it renders, so navigateToProfile's open-and-immediately-click
   * flow gives no window to look inside.
   *
   * @param {import("playwright").Page} page
   * @returns {Promise<{ opened: true }>}
   */
  async openProfileMenu(page) {
    if (!page) {
      throw new Error('[Profile.openProfileMenu] "page" is required.');
    }

    logger.debug("[Profile.openProfileMenu] Clicking the header avatar to open the profile dropdown");

    const profilePage = getPageObject(page, ProfilePage);
    const loginPage = getPageObject(page, LoginPage);

    // Cookie consent banner can overlay the avatar — same guard navigateToProfile uses.
    await loginPage.acceptCookiesIfPresent(8000);

    await profilePage.openProfileMenu();
    await profilePage.waitForProfileMenuOpen();

    logger.info("[Profile.openProfileMenu] Profile dropdown is open");
    return { opened: true };
  },

  /**
   * Asserts an option IS listed in the open profile dropdown.
   *
   * @param {import("playwright").Page} page
   * @param {string} optionName - "My profile" | "Manage profiles" | "Log out"
   * @returns {Promise<{ optionName: string, visible: true }>}
   */
  async verifyProfileMenuOptionVisible(page, optionName) {
    if (!page) {
      throw new Error('[Profile.verifyProfileMenuOptionVisible] "page" is required.');
    }
    if (typeof optionName !== "string" || !optionName) {
      throw new Error(
        "[Profile.verifyProfileMenuOptionVisible] \"optionName\" must be a non-empty string, got: " +
        `${typeof optionName} (${JSON.stringify(optionName)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);

    // Proves the panel is open before reading it, so a passing assertion cannot be the side effect
    // of a menu that never rendered.
    await profilePage.waitForProfileMenuOpen();
    const visible = await profilePage.isProfileMenuOptionVisible(optionName);

    if (!visible) {
      throw new Error(
        `[Profile.verifyProfileMenuOptionVisible] "${optionName}" is not listed in the open profile dropdown, ` +
        "but every user should see it. Check app-profile-menu.vue still renders that entry unconditionally."
      );
    }

    logger.info(`[Profile.verifyProfileMenuOptionVisible] "${optionName}" is listed in the profile dropdown`);
    return { optionName, visible: true };
  },

  /**
   * Asserts an option is NOT listed in the open profile dropdown.
   *
   * This is the privilege gate under test for "Manage profiles": app-profile-menu.ts computes
   * canManageProfiles as isManageProfilesEnabled && canManageOtherProfiles(permissions), and the
   * entry is behind a v-if, so a user without the privilege has no such node at all.
   *
   * @param {import("playwright").Page} page
   * @param {string} optionName - "My profile" | "Manage profiles" | "Log out"
   * @returns {Promise<{ optionName: string, visible: false }>}
   */
  async verifyProfileMenuOptionNotVisible(page, optionName) {
    if (!page) {
      throw new Error('[Profile.verifyProfileMenuOptionNotVisible] "page" is required.');
    }
    if (typeof optionName !== "string" || !optionName) {
      throw new Error(
        "[Profile.verifyProfileMenuOptionNotVisible] \"optionName\" must be a non-empty string, got: " +
        `${typeof optionName} (${JSON.stringify(optionName)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);

    // Without this the assertion would also pass against a dropdown that failed to open, which
    // would prove nothing about the privilege.
    await profilePage.waitForProfileMenuOpen();
    const visible = await profilePage.isProfileMenuOptionVisible(optionName);

    if (visible) {
      throw new Error(
        `[Profile.verifyProfileMenuOptionNotVisible] "${optionName}" IS listed in the profile dropdown, but this ` +
        `user does not hold the privilege that unlocks it — another user's profile is reachable when it should ` +
        "not be. Confirm the account's privileges and that the Manage-profiles feature flag is on (an entry " +
        "hidden by the flag being off would hide it for a privileged user too, which is a different defect)."
      );
    }

    logger.info(`[Profile.verifyProfileMenuOptionNotVisible] "${optionName}" is correctly absent from the profile dropdown`);
    return { optionName, visible: false };
  },

  /**
   * Clicks an entry in the ALREADY-OPEN profile dropdown that opens a new tab, and returns that tab.
   *
   * Every entry that navigates ("My profile", "Manage profiles") goes through app-profile-menu.ts's
   * openInNewTab helper (utilService.openNewWindow), so this is the single owner of the
   * click-then-adopt-the-tab workflow for all of them. openInNewTab navigates IN PLACE on mobile
   * viewports, hence the same-tab fallback — the same one navigateToProfile applies.
   *
   * @param {import("playwright").Page} page
   * @param {string} optionName - "My profile" | "Manage profiles"
   * @param {object} [options]
   * @param {boolean} [options.requireNewTab=false] Fail instead of falling back to the current tab.
   *   For a desktop-viewport scenario the fallback can only mask a swallowed click or a blocked
   *   popup, and returning the ORIGINAL page makes the next step fail somewhere less obvious.
   * @returns {Promise<import("playwright").Page>} The page showing the opened destination.
   */
  async openProfileMenuOptionInNewTab(page, optionName, { requireNewTab = false } = {}) {
    if (!page) {
      throw new Error('[Profile.openProfileMenuOptionInNewTab] "page" is required.');
    }
    if (typeof optionName !== "string" || !optionName) {
      throw new Error(
        "[Profile.openProfileMenuOptionInNewTab] \"optionName\" must be a non-empty string, got: " +
        `${typeof optionName} (${JSON.stringify(optionName)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    const context = page.context();

    if (!context) {
      throw new Error("[Profile.openProfileMenuOptionInNewTab] Page context is null — cannot detect the new tab.");
    }

    logger.debug(`[Profile.openProfileMenuOptionInNewTab] Clicking "${optionName}" in the open profile dropdown`);

    // Subscribe before clicking: the tab can open faster than the click call resolves.
    const newPagePromise = context.waitForEvent("page", { timeout: 20000 }).catch(() => null);

    try {
      await profilePage.clickProfileMenuOption(optionName);
    } catch (err) {
      throw new Error(
        `[Profile.openProfileMenuOptionInNewTab] Failed to open "${optionName}" from the profile dropdown: ${err.message}`
      );
    }

    const newTab = await newPagePromise;

    if (newTab) {
      await newTab.waitForLoadState("domcontentloaded", { timeout: 30000 });
      await newTab.bringToFront().catch(() => {});
      logger.info(`[Profile.openProfileMenuOptionInNewTab] "${optionName}" opened in a new tab`);
      return newTab;
    }

    if (requireNewTab) {
      throw new Error(
        `[Profile.openProfileMenuOptionInNewTab] Clicking "${optionName}" opened no new tab within 20s. ` +
        "app-profile-menu.ts routes this entry through openInNewTab, so a new tab is expected at a desktop " +
        "viewport. The click may have been swallowed by the tooltip closing, or the browser context blocked " +
        "the popup."
      );
    }

    logger.info(`[Profile.openProfileMenuOptionInNewTab] "${optionName}" opened in the current tab (no new tab detected)`);
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    return page;
  },

  /**
   * Opens the Frequent Programs tab in the user profile.
   */
  async openFrequentProgramsTab(page) {
    if (!page) {
      throw new Error('[Profile.openFrequentProgramsTab] "page" is required.');
    }

    logger.debug("[Profile.openFrequentProgramsTab] Clicking Frequent Programs tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickFrequentProgramsTab();
      await profilePage.waitForFrequentProgramsForm();
    } catch (err) {
      throw new Error(
        `[Profile.openFrequentProgramsTab] Failed to open Frequent Programs tab: ${err.message}`
      );
    }
  },

  /**
   * Removes a FQTV entry by number: clicks delete, confirms the dialog, verifies removal.
   * If the entry doesn't exist (already removed), skips gracefully.
   */
  async removeFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.removeFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.removeFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.removeFqtvEntry] Removing FQTV entry "${fqtvNumber}"`);

    const profilePage = getPageObject(page, ProfilePage);

    // Check if the entry exists before attempting removal
    const entryExists = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (!entryExists) {
      logger.info(`[Profile.removeFqtvEntry] FQTV entry "${fqtvNumber}" not found — already removed, skipping`);
      return { skipped: true, reason: "entry not present" };
    }

    try {
      await profilePage.clickRemoveOnEntry(fqtvNumber);
      await profilePage.confirmDeleteDialog();
      // Wait for the entry to disappear from the DOM after deletion
      await profilePage.waitForEntryToDisappear(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.removeFqtvEntry] Failed to remove FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }

    return { skipped: false };
  },

  /**
   * Verifies that a FQTV entry is no longer visible in the profile.
   */
  async verifyFqtvEntryRemoved(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.verifyFqtvEntryRemoved] "page" is required.');
    }

    logger.debug(`[Profile.verifyFqtvEntryRemoved] Verifying FQTV entry "${fqtvNumber}" is removed`);

    const profilePage = getPageObject(page, ProfilePage);

    const isStillVisible = await profilePage.isFqtvEntryVisible(fqtvNumber);
    if (isStillVisible) {
      throw new Error(
        `[Profile.verifyFqtvEntryRemoved] FQTV entry "${fqtvNumber}" is still visible in the profile — ` +
        `deletion may not have been processed by the server.`
      );
    }
  },

  /**
   * Adds a new FQTV entry: clicks Add, selects first airline, fills number, saves.
   */
  async addFqtvEntry(page, fqtvNumber) {
    if (!page) {
      throw new Error('[Profile.addFqtvEntry] "page" is required.');
    }
    if (!fqtvNumber || typeof fqtvNumber !== "string") {
      throw new Error(
        `[Profile.addFqtvEntry] "fqtvNumber" must be a non-empty string, got: ${typeof fqtvNumber} (${JSON.stringify(fqtvNumber)})`
      );
    }

    logger.debug(`[Profile.addFqtvEntry] Adding FQTV entry "${fqtvNumber}" with first available airline`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddFrequentFlyer();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to click "Add Frequent Flyer" button: ${err.message}`
      );
    }

    try {
      await profilePage.selectFirstAirlineFromDropdown();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to select airline from dropdown for entry "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.fillFqtvNumber(fqtvNumber);
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to fill FQTV number "${fqtvNumber}": ${err.message}`
      );
    }

    try {
      await profilePage.clickSaveFrequentPrograms();
    } catch (err) {
      throw new Error(
        `[Profile.addFqtvEntry] Failed to save after adding FQTV entry "${fqtvNumber}": ${err.message}`
      );
    }
  },

  /**
   * Adds a BahnCard (Deutsche Bahn rail) loyalty program and saves the Frequent Programs form.
   * Assumes the Frequent Programs tab is already open.
   *
   * @param {Object} page
   * @param {Object} opts
   * @param {string} opts.cardType - a DbRailCardTypes label, e.g. "DB BahnCard 50"
   * @param {string} opts.programNumber - 16 digits starting with 7081 (app-side validation)
   * @param {string} opts.validUntil - expiration date, e.g. "20 Dec 2029"
   */
  async addBahnCardProgram(page, { cardType, programNumber, validUntil } = {}) {
    if (!page) throw new Error('[Profile.addBahnCardProgram] "page" is required.');
    for (const [name, value] of Object.entries({ cardType, programNumber, validUntil })) {
      if (!value || typeof value !== "string") {
        throw new Error(
          `[Profile.addBahnCardProgram] "${name}" must be a non-empty string, got: ${typeof value} (${JSON.stringify(value)})`
        );
      }
    }

    logger.debug(`[Profile.addBahnCardProgram] Adding "${cardType}" ${programNumber} valid until ${validUntil}`);

    const profilePage = getPageObject(page, ProfilePage);

    await profilePage.clickAddBahnCardProgram();
    await profilePage.selectBahnCardType(cardType);
    await profilePage.fillBahnCardNumber(programNumber);
    await this.setBahnCardValidUntil(page, validUntil);

    // The form's handleSubmit() returns silently when vuelidate marks the form invalid — no
    // request, no toast, no thrown click error. Gate on the PUT so a rejected form fails here,
    // with the on-screen validation text, instead of 30s later on the success-toast step.
    const savePut = page
      .waitForResponse(
        (response) =>
          response.url().includes(FREQUENT_PROGRAMS_SAVE_ENDPOINT) && response.request().method() === "PUT",
        { timeout: 20000 }
      )
      .catch(() => null);

    try {
      await profilePage.clickSaveFrequentPrograms();
    } catch (err) {
      throw new Error(
        `[Profile.addBahnCardProgram] Failed to save after adding BahnCard "${cardType}" (${programNumber}): ${err.message}`
      );
    }

    const saveResponse = await savePut;

    if (!saveResponse) {
      const validationMessages = await profilePage.getFrequentProgramsValidationMessages();
      throw new Error(
        `[Profile.addBahnCardProgram] Save was clicked but no PUT ${FREQUENT_PROGRAMS_SAVE_ENDPOINT} request was sent — ` +
        `the form rejected the BahnCard row before submitting. ` +
        (validationMessages.length
          ? `On-screen validation: ${validationMessages.map((m) => `"${m}"`).join(", ")}.`
          : `No validation message is displayed — check that the card type, number and "Valid until" reached the Vue model.`)
      );
    }

    if (!saveResponse.ok()) {
      throw new Error(
        `[Profile.addBahnCardProgram] Saving BahnCard "${cardType}" (${programNumber}) returned HTTP ${saveResponse.status()} ` +
        `from ${FREQUENT_PROGRAMS_SAVE_ENDPOINT}.`
      );
    }

    logger.info(`[Profile.addBahnCardProgram] Saved BahnCard "${cardType}" (${programNumber}) valid until ${validUntil}`);
  },

  /**
   * Sets the BahnCard "Valid until" date.
   *
   * The picker is `editable`, so typing is tried first — but app-datepicker runs its format
   * through localizePickerDateFormat(), which rewrites "DD MMM YYYY" to "MMM DD, YYYY" under the
   * en-US locale. A typed "20 Dec 2029" is then rejected, so the value is read back and the
   * calendar is driven instead when the typed text did not commit.
   */
  async setBahnCardValidUntil(page, validUntil) {
    const profilePage = getPageObject(page, ProfilePage);
    const targetDate = parseDateValue(validUntil);

    await profilePage.typeBahnCardValidUntil(validUntil);

    let committed = "";
    try {
      committed = await profilePage.getBahnCardValidUntilValue();
    } catch {
      committed = "";
    }

    if (committed && datesMatch(committed, targetDate)) {
      logger.debug(`[Profile.setBahnCardValidUntil] "${validUntil}" accepted as typed (field shows "${committed}")`);
      return;
    }

    logger.info(
      `[Profile.setBahnCardValidUntil] Typed date did not commit (field shows "${committed}") — falling back to the calendar`
    );

    try {
      await profilePage.openBahnCardValidUntilPicker();
      const monthTableIndex = await advanceSinglePickerCalendarUntilMonthVisible(page, targetDate);
      await clickDayInVisibleMonth(page, targetDate, monthTableIndex);
      await profilePage.closeDatePickerPanel();
    } catch (err) {
      throw new Error(
        `[Profile.setBahnCardValidUntil] Could not set "Valid until" to "${validUntil}" by typing or via the calendar: ${err.message}`
      );
    }

    const afterCalendar = await profilePage.getBahnCardValidUntilValue();
    if (!datesMatch(afterCalendar, targetDate)) {
      throw new Error(
        `[Profile.setBahnCardValidUntil] "Valid until" reads "${afterCalendar}" after selecting ${validUntil} from the calendar. ` +
        `The picker may have rejected the date (check disablePastDates / the corporation's date format).`
      );
    }
  },

  /**
   * Verifies a BahnCard program persisted: reloads the profile, reopens the Frequent Programs
   * tab and reads the row back from the server-rendered form. Re-reading the un-reloaded form
   * would only echo the values this test typed, which proves nothing about the save.
   */
  async verifyBahnCardProgramSaved(page, { cardType, programNumber, validUntil } = {}) {
    if (!page) throw new Error('[Profile.verifyBahnCardProgramSaved] "page" is required.');

    logger.debug(`[Profile.verifyBahnCardProgramSaved] Reloading the profile to re-read "${cardType}"`);

    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await this.openFrequentProgramsTab(page);

    const profilePage = getPageObject(page, ProfilePage);

    if (await profilePage.getBahnCardRowCount() === 0) {
      throw new Error(
        `[Profile.verifyBahnCardProgramSaved] No BahnCard row is present after reloading the profile — ` +
        `"${cardType}" (${programNumber}) was not persisted.`
      );
    }

    const savedType = await profilePage.getBahnCardTypeText();
    const savedNumber = await profilePage.getBahnCardNumberValue();
    const savedValidUntil = await profilePage.getBahnCardValidUntilValue();

    if (!savedType.includes(cardType)) {
      throw new Error(
        `[Profile.verifyBahnCardProgramSaved] Saved BahnCard type reads "${savedType}", expected "${cardType}".`
      );
    }

    if (savedNumber !== programNumber) {
      throw new Error(
        `[Profile.verifyBahnCardProgramSaved] Saved BahnCard number reads "${savedNumber}", expected "${programNumber}".`
      );
    }

    // Compared as dates, not strings: the profile's language decides whether the picker renders
    // "20 Dec 2029" or "Dec 20, 2029".
    if (!datesMatch(savedValidUntil, parseDateValue(validUntil))) {
      throw new Error(
        `[Profile.verifyBahnCardProgramSaved] Saved BahnCard expiration date reads "${savedValidUntil}", expected "${validUntil}".`
      );
    }

    logger.info(
      `[Profile.verifyBahnCardProgramSaved] "${cardType}" (${programNumber}) persisted with expiration date "${savedValidUntil}"`
    );
  },

  /**
   * Removes the BahnCard program row, confirms the delete dialog and verifies the row is gone.
   */
  async removeBahnCardProgram(page) {
    if (!page) throw new Error('[Profile.removeBahnCardProgram] "page" is required.');

    const profilePage = getPageObject(page, ProfilePage);

    const rowsBefore = await profilePage.getBahnCardRowCount();
    if (rowsBefore === 0) {
      throw new Error(
        '[Profile.removeBahnCardProgram] No BahnCard row to remove — the program may never have been saved.'
      );
    }

    logger.debug(`[Profile.removeBahnCardProgram] Removing the BahnCard row (${rowsBefore} present)`);

    try {
      await profilePage.clickRemoveOnBahnCardRow();
      await profilePage.confirmDeleteDialog();
    } catch (err) {
      throw new Error(`[Profile.removeBahnCardProgram] Failed to remove the BahnCard program: ${err.message}`);
    }

    await profilePage.waitForBahnCardRowCount(rowsBefore - 1);

    logger.info('[Profile.removeBahnCardProgram] BahnCard program removed');
  },

  /**
   * Opens the Contact Information tab in the user profile.
   */
  async openContactInformationTab(page) {
    if (!page) {
      throw new Error('[Profile.openContactInformationTab] "page" is required.');
    }

    logger.debug("[Profile.openContactInformationTab] Clicking Contact Information tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickContactInformationTab();
      await profilePage.waitForContactInfoForm();
    } catch (err) {
      throw new Error(
        `[Profile.openContactInformationTab] Failed to open Contact Information tab: ${err.message}`
      );
    }
  },

  /**
   * Verifies the business phone number fields display the expected values.
   */
  async verifyBusinessPhoneNumber(page, { countryCode, areaCode, number }) {
    if (!page) {
      throw new Error('[Profile.verifyBusinessPhoneNumber] "page" is required.');
    }
    if (typeof countryCode !== 'string' || typeof areaCode !== 'string' || typeof number !== 'string') {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] "countryCode", "areaCode", and "number" must all be strings, got: ` +
        `countryCode=${typeof countryCode}, areaCode=${typeof areaCode}, number=${typeof number}`
      );
    }

    logger.debug(`[Profile.verifyBusinessPhoneNumber] Expecting: +${countryCode} (${areaCode}) ${number}`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getBusinessPhoneValues();
    } catch (err) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Failed to read business phone values: ${err.message}`
      );
    }

    if (actual.countryCode !== countryCode) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Country code mismatch — expected "${countryCode}", got "${actual.countryCode}". ` +
        `The user's profile may have different phone data than expected.`
      );
    }
    if (actual.areaCode !== areaCode) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Area code mismatch — expected "${areaCode}", got "${actual.areaCode}".`
      );
    }
    if (actual.number !== number) {
      throw new Error(
        `[Profile.verifyBusinessPhoneNumber] Phone number mismatch — expected "${number}", got "${actual.number}".`
      );
    }

    return actual;
  },

  /**
   * Verifies the State dropdown field displays the expected value.
   */
  async verifyStateField(page, expectedValue) {
    if (!page) {
      throw new Error('[Profile.verifyStateField] "page" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyStateField] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyStateField] Expecting state field value: "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getStateFieldValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyStateField] Failed to read state field value: ${err.message}`
      );
    }

    if (actual !== expectedValue) {
      throw new Error(
        `[Profile.verifyStateField] State field value mismatch — expected "${expectedValue}", got "${actual}". ` +
        `This field only appears for countries that have states (e.g., US, Canada). Check the user's business address country.`
      );
    }

    return actual;
  },

  /**
   * Opens the Permissions tab in the user profile.
   */
  async openPermissionsTab(page) {
    if (!page) {
      throw new Error('[Profile.openPermissionsTab] "page" is required.');
    }

    logger.debug("[Profile.openPermissionsTab] Clicking Permissions tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPermissionsTab();
    } catch (err) {
      throw new Error(
        `[Profile.openPermissionsTab] Failed to open Permissions tab: ${err.message}`
      );
    }
  },

  /**
   * Opens a permissions section (e.g., "Who can I book for") within the permissions tab.
   */
  async openPermissionsSection(page, sectionName) {
    if (!page) {
      throw new Error('[Profile.openPermissionsSection] "page" is required.');
    }
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Profile.openPermissionsSection] "sectionName" must be a non-empty string, got: ${typeof sectionName} (${JSON.stringify(sectionName)})`
      );
    }

    logger.debug(`[Profile.openPermissionsSection] Opening section "${sectionName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPermissionsSection(sectionName);
    } catch (err) {
      throw new Error(
        `[Profile.openPermissionsSection] Failed to open section "${sectionName}": ${err.message}`
      );
    }
  },

  /**
   * Removes a user from the booking permissions list by clicking the trash icon and confirming.
   */
  async removeUserFromBookingPermissions(page) {
    if (!page) {
      throw new Error('[Profile.removeUserFromBookingPermissions] "page" is required.');
    }

    logger.debug("[Profile.removeUserFromBookingPermissions] Clicking trash icon on first arranger row");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickTrashIconOnFirstArranger();
    } catch (err) {
      throw new Error(
        `[Profile.removeUserFromBookingPermissions] Failed to click trash icon: ${err.message}`
      );
    }

    try {
      await profilePage.confirmRemoveUser();
    } catch (err) {
      throw new Error(
        `[Profile.removeUserFromBookingPermissions] Failed to confirm user removal: ${err.message}`
      );
    }

    // Wait for the table to update after removal
    await page.waitForTimeout(1500);
  },

  /**
   * Verifies that the user was removed by checking the table is empty or has fewer rows.
   */
  async verifyUserRemovedFromPermissions(page) {
    if (!page) {
      throw new Error('[Profile.verifyUserRemovedFromPermissions] "page" is required.');
    }

    logger.debug("[Profile.verifyUserRemovedFromPermissions] Checking table is empty");

    const profilePage = getPageObject(page, ProfilePage);

    const isEmpty = await profilePage.isArrangerTableEmpty();
    if (!isEmpty) {
      throw new Error(
        `[Profile.verifyUserRemovedFromPermissions] Arranger table is not empty after removal — ` +
        `the user may not have been removed, or the table did not refresh.`
      );
    }
  },

  /**
   * Adds a travel arranger by searching and selecting from the dropdown.
   */
  async addTravelArranger(page, arrangerName) {
    if (!page) {
      throw new Error('[Profile.addTravelArranger] "page" is required.');
    }
    if (!arrangerName || typeof arrangerName !== 'string') {
      throw new Error(
        `[Profile.addTravelArranger] "arrangerName" must be a non-empty string, got: ${typeof arrangerName} (${JSON.stringify(arrangerName)})`
      );
    }

    logger.debug(`[Profile.addTravelArranger] Searching and selecting "${arrangerName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillTravelArrangerSearch(arrangerName);
    } catch (err) {
      throw new Error(
        `[Profile.addTravelArranger] Failed to fill search for "${arrangerName}": ${err.message}`
      );
    }

    // Wait for search results to populate from the server
    await page.waitForTimeout(2500);

    try {
      await profilePage.selectTravelArrangerFromDropdown();
    } catch (err) {
      throw new Error(
        `[Profile.addTravelArranger] Failed to select "${arrangerName}" from dropdown results: ${err.message}`
      );
    }
  },

  /**
   * Verifies the selected travel arranger matches the expected name.
   */
  async verifyTravelArranger(page, expectedName) {
    if (!page) {
      throw new Error('[Profile.verifyTravelArranger] "page" is required.');
    }
    if (!expectedName || typeof expectedName !== 'string') {
      throw new Error(
        `[Profile.verifyTravelArranger] "expectedName" must be a non-empty string, got: ${typeof expectedName} (${JSON.stringify(expectedName)})`
      );
    }

    logger.debug(`[Profile.verifyTravelArranger] Expecting travel arranger: "${expectedName}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actual;
    try {
      actual = await profilePage.getTravelArrangerSelectedText();
    } catch (err) {
      throw new Error(
        `[Profile.verifyTravelArranger] Failed to read selected travel arranger text: ${err.message}`
      );
    }

    if (actual.toLowerCase() !== expectedName.toLowerCase()) {
      throw new Error(
        `[Profile.verifyTravelArranger] Travel arranger mismatch — expected "${expectedName}", got "${actual}". ` +
        `The search/selection may have picked the wrong user, or the dropdown did not populate.`
      );
    }

    return actual;
  },

  /**
   * Opens a traveler's profile from the trip page by clicking their name link.
   * Profile opens in a new tab — returns the new page instance.
   */
  async openTravelerProfile(page, travelerName) {
    if (!page) {
      throw new Error('[Profile.openTravelerProfile] "page" is required.');
    }
    if (!travelerName || typeof travelerName !== 'string') {
      throw new Error(
        `[Profile.openTravelerProfile] "travelerName" must be a non-empty string, got: ${typeof travelerName} (${JSON.stringify(travelerName)})`
      );
    }

    logger.debug(`[Profile.openTravelerProfile] Opening profile for traveler "${travelerName}"`);

    const profilePage = getPageObject(page, ProfilePage);
    const context = page.context();

    const newPagePromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.clickTravelerNameLink(travelerName);
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfile] Failed to click traveler name "${travelerName}": ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;

    if (newProfilePage) {
      logger.info(`[Profile.openTravelerProfile] Profile for "${travelerName}" opened in a new tab`);
      await newProfilePage.waitForLoadState("domcontentloaded", { timeout: 30000 });
      const newProfilePageObj = getPageObject(newProfilePage, ProfilePage);
      await newProfilePageObj.waitForPersonalDetailsForm();
      return newProfilePage;
    }

    // Fallback: profile opened in same tab
    logger.info(`[Profile.openTravelerProfile] Profile for "${travelerName}" opened in same tab`);
    await page.waitForLoadState("domcontentloaded", { timeout: 30000 });
    await profilePage.waitForPersonalDetailsForm();
    return page;
  },

  /**
   * Verifies the city field value in contact information matches expected (case-insensitive).
   */
  async verifyCityFieldValue(page, expectedValue) {
    if (!page) {
      throw new Error('[Profile.verifyCityFieldValue] "page" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyCityFieldValue] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyCityFieldValue] Expecting city to contain: "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualValue;
    try {
      actualValue = await profilePage.getCityInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCityFieldValue] Failed to read city field value: ${err.message}`
      );
    }

    if (!actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCityFieldValue] City field value "${actualValue}" does not contain expected "${expectedValue}". ` +
        `The city may not have been saved previously, or the wrong tab/section is displayed.`
      );
    }

    logger.info(`[Profile.verifyCityFieldValue] City field value "${actualValue}" contains expected "${expectedValue}"`);
  },

  /**
   * Clicks the Save button on the Contact Information form.
   */
  async saveContactInfo(page) {
    if (!page) {
      throw new Error('[Profile.saveContactInfo] "page" is required.');
    }

    logger.debug("[Profile.saveContactInfo] Clicking Save on Contact Information form");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveContactInfo();
    } catch (err) {
      throw new Error(
        `[Profile.saveContactInfo] Failed to save contact information: ${err.message}`
      );
    }

    logger.info("[Profile.saveContactInfo] Contact information saved");
  },

  /**
   * Edits the date of birth field by typing a valid adult date (30 years ago) directly into the input.
   * The datepicker uses 'DD MMM YYYY' format and the editable attribute allows direct text input.
   * Clicking the field first triggers resetFieldValueIfMasked to clear any masked value.
   * Returns the original DOB value for later verification.
   */
  async editDateOfBirth(page) {
    if (!page) {
      throw new Error('[Profile.editDateOfBirth] "page" is required.');
    }

    logger.debug("[Profile.editDateOfBirth] Reading current DOB, then editing");

    const profilePage = getPageObject(page, ProfilePage);

    let originalValue;
    try {
      originalValue = await profilePage.getDobInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.editDateOfBirth] Failed to read current DOB value: ${err.message}`
      );
    }

    // Build an adult DOB: 30 years before today in 'DD MMM YYYY' format
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const adultDob = new Date();
    adultDob.setFullYear(adultDob.getFullYear() - 30);
    const dobString = `${String(adultDob.getDate()).padStart(2, '0')} ${MONTHS[adultDob.getMonth()]} ${adultDob.getFullYear()}`;

    logger.debug(`[Profile.editDateOfBirth] Typing adult DOB: "${dobString}"`);

    try {
      await profilePage.typeDobValue(dobString);
    } catch (err) {
      throw new Error(
        `[Profile.editDateOfBirth] Failed to type DOB value: ${err.message}`
      );
    }

    // Brief wait for the input to reflect the typed date
    await page.waitForTimeout(500);

    return { originalValue };
  },

  /**
   * Verifies the DOB field value has changed from the original value.
   */
  async verifyDobUpdated(page, originalValue) {
    if (!page) {
      throw new Error('[Profile.verifyDobUpdated] "page" is required.');
    }

    logger.debug(`[Profile.verifyDobUpdated] Checking DOB has changed from "${originalValue}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let currentValue;
    try {
      currentValue = await profilePage.getDobInputValue();
    } catch (err) {
      throw new Error(
        `[Profile.verifyDobUpdated] Failed to read DOB input value after edit: ${err.message}`
      );
    }

    if (currentValue === originalValue) {
      throw new Error(
        `[Profile.verifyDobUpdated] DOB field value did not change — still "${currentValue}". ` +
        `The date selection may not have been saved, or the field is disabled for this user.`
      );
    }

    logger.info(`[Profile.verifyDobUpdated] DOB changed from "${originalValue}" to "${currentValue}"`);
    return { originalValue, currentValue };
  },

  /**
   * Opens the Form of Payment tab in the user profile.
   */
  async openFormOfPaymentTab(page) {
    if (!page) {
      throw new Error('[Profile.openFormOfPaymentTab] "page" is required.');
    }

    logger.debug("[Profile.openFormOfPaymentTab] Clicking Form of Payment tab");

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickFormOfPaymentTab();
      await profilePage.waitForFopSection();
    } catch (err) {
      throw new Error(
        `[Profile.openFormOfPaymentTab] Failed to open Form of Payment tab: ${err.message}`
      );
    }

    logger.info("[Profile.openFormOfPaymentTab] Form of Payment tab opened");
  },

  /**
   * Adds a new credit card to the profile with the specified details.
   */
  async addCreditCard(page, { city, cardholder, cardNumber = '4580458045804580', cardAlias = 'Test Card', cardType = 'Visa', expiryMonth = '12', expiryYear = '2029', address = '123 Test St', zipCode = '10001', country = 'UNITED STATES (US)', state = 'New York' } = {}) {
    if (!page) {
      throw new Error('[Profile.addCreditCard] "page" is required.');
    }
    if (!city || typeof city !== 'string') {
      throw new Error(
        `[Profile.addCreditCard] "city" must be a non-empty string, got: ${typeof city} (${JSON.stringify(city)})`
      );
    }
    if (!cardholder || typeof cardholder !== 'string') {
      throw new Error(
        `[Profile.addCreditCard] "cardholder" must be a non-empty string, got: ${typeof cardholder} (${JSON.stringify(cardholder)})`
      );
    }

    logger.debug(`[Profile.addCreditCard] Adding card with city="${city}", cardholder="${cardholder}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddNewCard();
      await profilePage.waitForFopForm();
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to open add card form: ${err.message}`);
    }

    try {
      await profilePage.fillCardDisplayName(cardAlias);
      await profilePage.selectCardType(cardType);
      await profilePage.fillCardHolderName(cardholder);
      await profilePage.insertCardNumber(cardNumber);
      await profilePage.selectExpiryMonth(expiryMonth);
      await profilePage.selectExpiryYear(expiryYear);
      await profilePage.fillBillingAddress(address);
      await profilePage.fillBillingCity(city);
      await profilePage.fillBillingZipCode(zipCode);
      await profilePage.selectBillingCountry(country);
      await profilePage.selectBillingState(state);
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to fill card details: ${err.message}`);
    }

    try {
      await profilePage.clickSaveFop();
    } catch (err) {
      throw new Error(`[Profile.addCreditCard] Failed to save credit card: ${err.message}`);
    }

    logger.info(`[Profile.addCreditCard] Credit card added with city="${city}", cardholder="${cardholder}"`);
  },

  /**
   * Verifies the card holder name is displayed in the card preview list.
   */
  async verifyCardHolderName(page, expectedName) {
    if (!page) {
      throw new Error('[Profile.verifyCardHolderName] "page" is required.');
    }
    if (!expectedName || typeof expectedName !== 'string') {
      throw new Error(
        `[Profile.verifyCardHolderName] "expectedName" must be a non-empty string, got: ${typeof expectedName} (${JSON.stringify(expectedName)})`
      );
    }

    logger.debug(`[Profile.verifyCardHolderName] Verifying card holder name "${expectedName}" is displayed`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualName;
    try {
      actualName = await profilePage.getCardHolderNameFromPreview();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCardHolderName] Failed to read card holder name from preview: ${err.message}`
      );
    }

    if (!actualName.toLowerCase().includes(expectedName.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCardHolderName] Card holder name "${actualName}" does not contain expected "${expectedName}". ` +
        `The card may not have been saved successfully or a different card is shown.`
      );
    }

    logger.info(`[Profile.verifyCardHolderName] Card holder name "${actualName}" matches expected "${expectedName}"`);
  },

  /**
   * Deletes the last credit card from the profile (clicks actions → delete → confirm).
   */
  async deleteCreditCard(page) {
    if (!page) {
      throw new Error('[Profile.deleteCreditCard] "page" is required.');
    }

    logger.debug("[Profile.deleteCreditCard] Deleting last credit card from profile");

    const profilePage = getPageObject(page, ProfilePage);

    const countBefore = await profilePage.getCardPreviewCount();

    try {
      await profilePage.clickDeleteOnLastCard();
      await profilePage.confirmRemoveFopCard();
      // Removal is async (BE delete + profile reload) — wait for the row to actually leave the DOM,
      // instead of relying on getCardPreviewCount's blind 1s timer. Mirrors the FQTV removeFqtvEntry flow.
      await profilePage.waitForCardCountToSettle(countBefore - 1);
    } catch (err) {
      throw new Error(`[Profile.deleteCreditCard] Failed to delete credit card: ${err.message}`);
    }

    logger.info(`[Profile.deleteCreditCard] Credit card deleted (was ${countBefore} cards)`);
    return { countBefore };
  },

  /**
   * Removes every existing credit card so the test starts from a clean state.
   * Leftover cards accumulate across runs, so this deletes the last card
   * repeatedly until none remain.
   */
  async deleteAllCreditCards(page) {
    if (!page) {
      throw new Error('[Profile.deleteAllCreditCards] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);

    let remaining = await profilePage.getCardPreviewCount();
    const initialCount = remaining;
    logger.debug(`[Profile.deleteAllCreditCards] Found ${remaining} existing card(s) to remove`);

    let attempts = 0;
    while (remaining > 0) {
      // safety cap — a real profile never holds this many cards
      if (attempts++ >= 20) {
        throw new Error(
          `[Profile.deleteAllCreditCards] Aborting after ${attempts} attempts — ${remaining} card(s) still present. ` +
          `A card is not deleting correctly.`
        );
      }

      try {
        await profilePage.clickDeleteOnLastCard();
        await profilePage.confirmRemoveFopCard();
        // Same async-removal gate as deleteCreditCard — wait for the row to leave the DOM before
        // re-counting, so a slow BE delete can't make the loop double-fire on a row mid-removal.
        await profilePage.waitForCardCountToSettle(remaining - 1);
      } catch (err) {
        throw new Error(`[Profile.deleteAllCreditCards] Failed to delete a card: ${err.message}`);
      }

      remaining = await profilePage.getCardPreviewCount();
    }

    logger.info("[Profile.deleteAllCreditCards] All existing credit cards removed — profile is clean");
    return { removed: initialCount };
  },

  /**
   * Verifies the credit card was removed (card count decreased or is zero).
   */
  async verifyCreditCardRemoved(page, countBefore) {
    if (!page) {
      throw new Error('[Profile.verifyCreditCardRemoved] "page" is required.');
    }

    logger.debug("[Profile.verifyCreditCardRemoved] Verifying card was removed");

    const profilePage = getPageObject(page, ProfilePage);

    const countAfter = await profilePage.getCardPreviewCount();

    if (countAfter >= (countBefore || 1)) {
      throw new Error(
        `[Profile.verifyCreditCardRemoved] Card was not removed — count before: ${countBefore}, count after: ${countAfter}. ` +
        `The delete operation may not have completed or the confirmation was not clicked.`
      );
    }

    logger.info(`[Profile.verifyCreditCardRemoved] Card removed (before: ${countBefore}, after: ${countAfter})`);
  },

  // --- Passports & Visas ---

  async navigateToPassportsFromTraveler(page) {
    if (!page) {
      throw new Error('[Profile.navigateToPassportsFromTraveler] "page" is required.');
    }

    logger.debug('[Profile.navigateToPassportsFromTraveler] Clicking traveler name and navigating to Passports & Visas tab');

    const profilePage = getPageObject(page, ProfilePage);
    const context = page.context();

    const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.clickFirstTravelerNameLink();
    } catch (err) {
      throw new Error(
        `[Profile.navigateToPassportsFromTraveler] Could not click traveler name link: ${err.message}`
      );
    }

    const newProfilePage = await newPagePromise;
    let targetPage = page;

    if (newProfilePage) {
      logger.info('[Profile.navigateToPassportsFromTraveler] Profile opened in a new tab');
      await newProfilePage.waitForLoadState('domcontentloaded', { timeout: 30000 });
      targetPage = newProfilePage;
    } else {
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    }

    const targetProfilePage = getPageObject(targetPage, ProfilePage);
    await targetProfilePage.waitForPersonalDetailsForm();
    await targetProfilePage.clickPassportsVisasTab();
    await targetProfilePage.waitForPassportVisaForm();

    logger.info('[Profile.navigateToPassportsFromTraveler] Passports & Visas tab is open');
    return targetPage;
  },

  async addVisa(page, { number, expiryYearsAhead = 3, country = 'United States' } = {}) {
    if (!page) {
      throw new Error('[Profile.addVisa] "page" is required.');
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.addVisa] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }
    if (!Number.isInteger(expiryYearsAhead) || expiryYearsAhead < 1) {
      throw new Error(
        `[Profile.addVisa] "expiryYearsAhead" must be a positive integer, got: ${expiryYearsAhead}`
      );
    }

    logger.debug(`[Profile.addVisa] Adding visa with number "${number}", expiry ${expiryYearsAhead} years ahead`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.ensurePassportExists();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to ensure a passport entry exists: ${err.message}`);
    }

    try {
      await profilePage.clickAddVisa();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to click "Add new visa": ${err.message}`);
    }

    try {
      await profilePage.selectVisaCountry(country);
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to select visa country "${country}": ${err.message}`);
    }

    try {
      await profilePage.openVisaDatePicker();
      await profilePage.clickNextYearArrow(expiryYearsAhead);
      await profilePage.selectFirstAvailableDay();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to set visa expiry date (${expiryYearsAhead} years ahead): ${err.message}`);
    }

    try {
      await profilePage.fillVisaNumber(number);
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to fill visa number "${number}": ${err.message}`);
    }

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.addVisa] Failed to save passport & visa form: ${err.message}`);
    }

    logger.info(`[Profile.addVisa] Visa added with number "${number}"`);
  },

  async deleteVisa(page) {
    if (!page) {
      throw new Error('[Profile.deleteVisa] "page" is required.');
    }

    logger.debug('[Profile.deleteVisa] Removing last visa entry');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickRemoveVisa();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to click remove on visa: ${err.message}`);
    }

    try {
      await profilePage.confirmRemovePassportVisa();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to confirm visa removal: ${err.message}`);
    }

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.deleteVisa] Failed to save after visa removal: ${err.message}`);
    }

    logger.info('[Profile.deleteVisa] Visa removed and form saved');
  },

  async openPassportsAndVisasTab(page) {
    if (!page) throw new Error('[Profile.openPassportsAndVisasTab] "page" is required.');

    logger.debug('[Profile.openPassportsAndVisasTab] Clicking Passports & Visas tab');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPassportsVisasTab();
      await profilePage.waitForPassportVisaForm();
    } catch (err) {
      throw new Error(`[Profile.openPassportsAndVisasTab] Failed to open Passports & Visas tab: ${err.message}`);
    }

    logger.info('[Profile.openPassportsAndVisasTab] Passports & Visas tab opened');
  },

  async enterKnownTravelerNumber(page, value) {
    if (!page) throw new Error('[Profile.enterKnownTravelerNumber] "page" is required.');
    if (!value || typeof value !== 'string') {
      throw new Error(
        `[Profile.enterKnownTravelerNumber] "value" must be a non-empty string, got: ${typeof value} (${JSON.stringify(value)})`
      );
    }

    logger.debug(`[Profile.enterKnownTravelerNumber] Filling known traveler number "${value}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillKnownTravelerNumber(value);
    } catch (err) {
      throw new Error(`[Profile.enterKnownTravelerNumber] Failed to enter known traveler number "${value}": ${err.message}`);
    }

    return { knownTravelerNumber: value };
  },

  async verifyKnownTravelerNumberSaved(page, expectedValue) {
    if (!page) throw new Error('[Profile.verifyKnownTravelerNumberSaved] "page" is required.');
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyKnownTravelerNumberSaved] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyKnownTravelerNumberSaved] Reloading profile to verify saved value "${expectedValue}"`);

    try {
      await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Page reload failed: ${err.message}`);
    }

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickPassportsVisasTab();
      await profilePage.waitForPassportVisaForm();
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Failed to reopen Passports & Visas tab after reload: ${err.message}`);
    }

    let actualValue;
    try {
      actualValue = await profilePage.getKnownTravelerNumberValue();
    } catch (err) {
      throw new Error(`[Profile.verifyKnownTravelerNumberSaved] Failed to read known traveler number after reload: ${err.message}`);
    }

    if (actualValue !== expectedValue) {
      throw new Error(
        `[Profile.verifyKnownTravelerNumberSaved] Known traveler number was NOT saved correctly. ` +
        `Expected: "${expectedValue}", Actual: "${actualValue}". ` +
        `The save may have not persisted the value or the wrong field was typed into.`
      );
    }

    logger.info(`[Profile.verifyKnownTravelerNumberSaved] Known traveler number "${actualValue}" confirmed saved`);
    return { savedValue: actualValue };
  },

  async resetKnownTravelerNumber(page) {
    if (!page) throw new Error('[Profile.resetKnownTravelerNumber] "page" is required.');

    logger.debug('[Profile.resetKnownTravelerNumber] Clearing known traveler number and saving');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clearKnownTravelerNumber();
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.resetKnownTravelerNumber] Failed to reset known traveler number: ${err.message}`);
    }

    logger.info('[Profile.resetKnownTravelerNumber] Known traveler number reset to empty and saved');
    return { savedValue: '' };
  },

  async savePassportsAndVisasChanges(page) {
    if (!page) throw new Error('[Profile.savePassportsAndVisasChanges] "page" is required.');

    logger.debug('[Profile.savePassportsAndVisasChanges] Clicking Save on Passports & Visas form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSavePassportsVisas();
    } catch (err) {
      throw new Error(`[Profile.savePassportsAndVisasChanges] Failed to save Passports & Visas form: ${err.message}`);
    }

    logger.info('[Profile.savePassportsAndVisasChanges] Passports & Visas changes saved');
  },

  /**
   * Sets the Time format on the Personal Details form of the user profile.
   *
   * Only selects the option — the caller still has to save the form (savePersonalDetails), because
   * the radio group is part of a form that persists on Save, not on change.
   *
   * Verifies the option came out checked before returning: an Element Plus radio whose group is
   * disabled (personal-details-form.vue binds :disabled="disableEdit") swallows the click without
   * complaining, which would otherwise surface much later as a Save that changed nothing.
   *
   * @param {import('playwright').Page} page
   * @param {string} timeFormat - The option as rendered, e.g. "12 Hours" / "24 Hours"
   * @returns {Promise<{timeFormat: string}>}
   */
  async setTimeFormat(page, timeFormat) {
    if (!page) throw new Error('[Profile.setTimeFormat] "page" is required.');
    if (!timeFormat || typeof timeFormat !== 'string') {
      throw new Error(
        `[Profile.setTimeFormat] "timeFormat" must be a non-empty string, got: ${JSON.stringify(timeFormat)}`
      );
    }

    logger.debug('[Profile.setTimeFormat] Selecting a Time format option', { timeFormat });

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.clickTimeFormatOption(timeFormat);

    if (!(await profilePage.isTimeFormatOptionChecked(timeFormat))) {
      throw new Error(
        `[Profile.setTimeFormat] The "${timeFormat}" Time format option did not become selected after ` +
        `being clicked. The radio group is most likely read-only for this user.`
      );
    }

    logger.info('[Profile.setTimeFormat] Time format selected', { timeFormat });
    return { timeFormat };
  },
  async savePersonalDetails(page) {
    if (!page) throw new Error('[Profile.savePersonalDetails] "page" is required.');

    logger.debug('[Profile.savePersonalDetails] Clicking Save on Personal Details form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSavePersonalDetails();
    } catch (err) {
      throw new Error(`[Profile.savePersonalDetails] Failed to save Personal Details: ${err.message}`);
    }

    logger.info('[Profile.savePersonalDetails] Personal Details saved');
  },

  async addBackupApprover(page, searchTerm) {
    if (!page) throw new Error('[Profile.addBackupApprover] "page" is required.');
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error(
        `[Profile.addBackupApprover] "searchTerm" must be a non-empty string, got: ${typeof searchTerm} (${JSON.stringify(searchTerm)})`
      );
    }

    logger.debug(`[Profile.addBackupApprover] Searching for backup approver with term "${searchTerm}"`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickBackupApproverDropdown();
      await profilePage.fillBackupApproverSearch(searchTerm);
      await profilePage.selectFirstDropdownOption();
    } catch (err) {
      throw new Error(`[Profile.addBackupApprover] Failed to add backup approver by searching "${searchTerm}": ${err.message}`);
    }

    logger.info(`[Profile.addBackupApprover] Backup approver selected with search term "${searchTerm}"`);
  },

  async removeBackupApprover(page) {
    if (!page) throw new Error('[Profile.removeBackupApprover] "page" is required.');

    logger.debug('[Profile.removeBackupApprover] Clearing backup approver selection');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clearBackupApprover();
    } catch (err) {
      throw new Error(`[Profile.removeBackupApprover] Failed to remove backup approver: ${err.message}`);
    }

    logger.info('[Profile.removeBackupApprover] Backup approver removed');
  },

  async verifyBackupApproverContains(page, text) {
    if (!page) throw new Error('[Profile.verifyBackupApproverContains] "page" is required.');
    if (!text || typeof text !== 'string') {
      throw new Error(
        `[Profile.verifyBackupApproverContains] "text" must be a non-empty string, got: ${typeof text} (${JSON.stringify(text)})`
      );
    }

    logger.debug(`[Profile.verifyBackupApproverContains] Checking backup approver field contains "${text}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getBackupApproverText();
    } catch (err) {
      throw new Error(`[Profile.verifyBackupApproverContains] Failed to read backup approver text: ${err.message}`);
    }

    if (!actualText || !actualText.toUpperCase().includes(text.toUpperCase())) {
      throw new Error(
        `[Profile.verifyBackupApproverContains] Backup approver field does not contain "${text}". ` +
        `Actual value: "${actualText}". The selection may not have been applied.`
      );
    }

    logger.info(`[Profile.verifyBackupApproverContains] Confirmed backup approver contains "${text}" (actual: "${actualText}")`);
    return { actualText };
  },

  async verifyBackupApproverPlaceholder(page, text) {
    if (!page) throw new Error('[Profile.verifyBackupApproverPlaceholder] "page" is required.');
    if (!text || typeof text !== 'string') {
      throw new Error(
        `[Profile.verifyBackupApproverPlaceholder] "text" must be a non-empty string, got: ${typeof text} (${JSON.stringify(text)})`
      );
    }

    logger.debug(`[Profile.verifyBackupApproverPlaceholder] Checking backup approver placeholder is "${text}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getBackupApproverText();
    } catch (err) {
      throw new Error(`[Profile.verifyBackupApproverPlaceholder] Failed to read backup approver text: ${err.message}`);
    }

    if (actualText !== text) {
      throw new Error(
        `[Profile.verifyBackupApproverPlaceholder] Backup approver field shows "${actualText}" but expected "${text}". ` +
        `The approver may not have been properly removed.`
      );
    }

    logger.info(`[Profile.verifyBackupApproverPlaceholder] Confirmed backup approver shows "${text}"`);
  },

  /**
   * Opens the traveler profile by clicking the first traveler name link on the trip page.
   * The profile opens in a new tab; this method returns the new page handle.
   */
  async openTravelerProfileFromName(page) {
    if (!page) throw new Error('[Profile.openTravelerProfileFromName] "page" is required.');

    logger.debug('[Profile.openTravelerProfileFromName] Clicking first traveler name link');

    const profilePage = getPageObject(page, ProfilePage);

    let newPage;
    try {
      const context = page.context();
      const [newTab] = await Promise.all([
        context.waitForEvent('page', { timeout: 15000 }),
        profilePage.clickFirstTravelerNameLink(),
      ]);
      newPage = newTab;
      await newPage.waitForLoadState('domcontentloaded', { timeout: 20000 });
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfileFromName] Failed to open traveler profile in new tab. ` +
        `The traveler name link may not be visible or no traveler was added to the trip. Original: ${err.message}`
      );
    }

    const newProfilePage = getPageObject(newPage, ProfilePage);

    try {
      await newProfilePage.waitForPersonalDetailsForm();
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfileFromName] Traveler profile tab opened but personal details form did not load: ${err.message}`
      );
    }

    logger.info('[Profile.openTravelerProfileFromName] Traveler profile opened in new tab');
    return newPage;
  },

  /**
   * Opens a traveller's profile by clicking the LAST traveller name tag on the trip/search page.
   *
   * Sibling of openTravelerProfileFromName (which targets the FIRST tag — normally the logged-in
   * booker): a scenario that adds a second traveller and then opens THAT traveller's profile must
   * click the last tag. Identifying the tag by position rather than by name is deliberate — the tag
   * renders "FirstName LastName" while feature files identify travellers by email, so there is no
   * name string to match on.
   *
   * The profile is NOT a dialog: trip-traveler-tag.vue window.open()s the /user/:userId route, so
   * this returns the new tab's page handle. Falls back to the same tab, which is what
   * utilService.openNewWindow does on mobile viewports.
   *
   * @param {import('playwright').Page} page - The trip/search page holding the traveller tags.
   * @returns {Promise<import('playwright').Page>} The page showing the traveller profile.
   */
  async openTravelerProfileFromLastTravelerTag(page) {
    if (!page) {
      throw new Error('[Profile.openTravelerProfileFromLastTravelerTag] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);

    logger.debug('[Profile.openTravelerProfileFromLastTravelerTag] Opening the last viewable traveller tag');

    const context = page.context();
    const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

    try {
      await profilePage.clickLastTravelerNameLink();
    } catch (err) {
      // Read the tag names only now: clickLastTravelerNameLink has already spent its own wait, so
      // this reflects the state at failure time. Reading them up-front would race the render and
      // report "none" for a traveller that simply had not painted yet.
      const tagNames = await profilePage.getFilledTravelerNameLinkTexts();
      throw new Error(
        `[Profile.openTravelerProfileFromLastTravelerTag] Failed to click the last traveller name tag. ` +
        `Viewable filled tags present at failure: ${tagNames.length ? JSON.stringify(tagNames) : 'none'}. ` +
        `With none, the traveller was never added to the trip (only empty "Select Traveller" slots), or ` +
        `the booker lacks the privilege to view that profile. Original: ${err.message}`
      );
    }

    const newTab = await newPagePromise;
    const targetPage = newTab || page;

    if (newTab) {
      await newTab.waitForLoadState('domcontentloaded', { timeout: 30000 });
    } else {
      // No new tab is only legitimate on the mobile branch of utilService.openNewWindow, which
      // router-pushes to /user/:userId in place. Any other URL means the click never navigated at
      // all — say so rather than blaming the profile load further down.
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      const currentUrl = page.url();

      if (!currentUrl.includes('/user/')) {
        throw new Error(
          `[Profile.openTravelerProfileFromLastTravelerTag] Clicking the traveller name did not navigate: ` +
          `no new tab opened and the current tab is still on ${currentUrl}. The click landed on something ` +
          `other than a viewable traveller name, or trip-traveler-tag.vue#goToUserApp returned early ` +
          `because the traveller has no corporateUserId.`
        );
      }

      logger.info(
        '[Profile.openTravelerProfileFromLastTravelerTag] No new tab opened — profile rendered in the same tab'
      );
    }

    const targetProfilePage = getPageObject(targetPage, ProfilePage);

    try {
      await targetProfilePage.waitForUserProfilePage();
    } catch (err) {
      throw new Error(
        `[Profile.openTravelerProfileFromLastTravelerTag] The traveller name was clicked but the profile ` +
        `page never rendered (opened in ${newTab ? 'a new tab' : 'the same tab'}, url: ${targetPage.url()}). ` +
        `The booker may lack permission to load that user, or the profile request may have failed. ` +
        `Original: ${err.message}`
      );
    }

    logger.info(
      `[Profile.openTravelerProfileFromLastTravelerTag] Traveller profile opened in ${newTab ? 'a new tab' : 'the same tab'}`
    );
    return targetPage;
  },

  /**
   * Asserts the standalone traveller profile page is open. The page counterpart of
   * verifyUserProfilePopupOpen — clicking a traveller name routes to /user/:userId instead of
   * raising the mandate-fields dialog, so there is no dialog title to key on.
   */
  async verifyTravelerProfilePageOpen(page) {
    if (!page) {
      throw new Error('[Profile.verifyTravelerProfilePageOpen] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForUserProfilePage();
    logger.info('[Profile.verifyTravelerProfilePageOpen] Standalone traveller profile page is open');
  },

  /**
   * Asserts the standalone profile page is open on the expected tab, and that it belongs to the
   * expected traveller.
   *
   * This is the landing check for a profile deep link — today the document-expiry warnings'
   * "Update Passport" / "Update Visa" / "Update Card" buttons (AB#65307), which resolve
   * /user/:userId?tab=<section> and let user-profile.ts turn that query into the active el-tab.
   * `expectedTab` is a dataTabMap value ("passportsAndVisas", "formOfPayment", ...), so one check
   * covers every document type rather than one method per tab.
   *
   * Three things are asserted, because each can fail on its own:
   *
   *  1. the URL carries `tab=<expectedTab>` — proves the link was built for the right section;
   *  2. that tab is the SELECTED one — proves the app honoured it rather than falling back to
   *     Personal Details (which is what happens when the query value is not in
   *     user-profile.ts#dataTabMap, or when outstanding mandate fields hijack the opening tab);
   *  3. the <h1> names `expectedOwnerName` when one is given — proves a booker's warning opened the
   *     TRAVELLER's profile and not the booker's own, which is the whole point of the multi-user
   *     case and the one thing the tab assertion cannot tell apart.
   *
   * Dialog counterpart: verifyUserProfilePopupActiveTab / verifyUserProfilePopupBelongsTo.
   *
   * @param {import('playwright').Page} page - the page the profile opened on
   * @param {string} expectedTab - dataTabMap value, e.g. "passportsAndVisas"
   * @param {string} [expectedOwnerName] - traveller name as shown in the profile heading; skipped when omitted
   * @returns {Promise<{ ownerName: string, activeTab: string, url: string }>}
   */
  async verifyUserProfileOpenOnTab(page, expectedTab, expectedOwnerName) {
    if (!page) {
      throw new Error('[Profile.verifyUserProfileOpenOnTab] "page" is required.');
    }
    if (!expectedTab || typeof expectedTab !== 'string') {
      throw new Error(
        `[Profile.verifyUserProfileOpenOnTab] "expectedTab" must be a non-empty string, got: ${typeof expectedTab} (${JSON.stringify(expectedTab)})`
      );
    }
    if (expectedOwnerName !== undefined && typeof expectedOwnerName !== 'string') {
      throw new Error(
        `[Profile.verifyUserProfileOpenOnTab] "expectedOwnerName" must be a string when given, got: ${typeof expectedOwnerName}`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForUserProfilePage();

    // Read as a query parameter rather than pattern-matched out of the URL: it is exact regardless
    // of parameter order, and keeps expectedTab out of a RegExp it would otherwise need escaping for.
    const url = page.url();
    const requestedTab = new URL(url).searchParams.get('tab');
    if (requestedTab !== expectedTab) {
      throw new Error(
        `[Profile.verifyUserProfileOpenOnTab] The profile opened on ${url}, whose "tab" query is ` +
        `${requestedTab === null ? 'absent' : `"${requestedTab}"`} rather than "${expectedTab}". The deep link was ` +
        `built for the wrong section (or without one), so the profile lands on Personal Details and the user still ` +
        `has to find the document themselves.`
      );
    }

    const activeTab = await profilePage.getActiveProfilePageTabName();
    if (activeTab !== expectedTab) {
      throw new Error(
        `[Profile.verifyUserProfileOpenOnTab] The profile at ${url} requested "${expectedTab}" but opened on ` +
        `"${activeTab || '(no tab selected)'}". user-profile.ts only honours a "tab" query whose value is in its ` +
        `dataTabMap, and outstanding mandate fields override the opening tab.`
      );
    }

    const ownerName = await profilePage.getUserProfilePageOwnerName();

    if (expectedOwnerName) {
      // Compared case-insensitively on collapsed whitespace: feature files name travellers the way a
      // tester types them ("pini atr"), while the heading renders the stored capitalisation.
      const normalise = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
      if (normalise(ownerName) !== normalise(expectedOwnerName)) {
        throw new Error(
          `[Profile.verifyUserProfileOpenOnTab] The profile that opened belongs to ` +
          `"${ownerName || '(no name rendered)'}" but "${expectedOwnerName}" was expected (${url}). The deep link's ` +
          `userId points at the wrong traveller — on a booker's trip that usually means the alert was attributed to ` +
          `the logged-in booker instead of the selected traveller.`
        );
      }
    }

    logger.info(
      `[Profile.verifyUserProfileOpenOnTab] Profile of "${ownerName}" is open on the "${activeTab}" tab (${url})`
    );
    return { ownerName, activeTab, url };
  },

  /**
   * Asserts the open traveller profile page is read-only — the outcome for a booker who may VIEW
   * another traveller's profile but not edit it. Checks two INDEPENDENT sources, deliberately:
   *
   *  1. Permission-driven: the `read-only-profile` class user-profile.vue adds from
   *     isUserCantEditProfile (route userId + permissions). user-profile.scss makes that class hide
   *     every button and set `pointer-events: none` on the forms, so the missing Save button and the
   *     inert Birth Date field below are consequences of this same class, not separate evidence.
   *  2. API-driven: the forms' own `disableEdit`, bound to `!userProfile.editDiabled` from the
   *     profile response — the only signal that does NOT come from the class. This is what makes the
   *     enabled-input count worth checking at all.
   *
   * Both are asserted because they can disagree: a profile the API reports as editable while the
   * permission class is applied would leave real, typeable fields behind a read-only-looking page.
   *
   * Birth Date is singled out rather than ignored: personal-details-form.vue omits the
   * :disabled="disableEdit" binding on its birth-date app-datepicker, so the input renders enabled
   * while remaining inert — the read-only .personal-details-form section swallows pointer events, so
   * the field cannot be clicked. Discounting it by name keeps every OTHER enabled control a hard
   * failure, and probing its interactivity turns "it is inert" from an assumption into an assertion.
   */
  async verifyTravelerProfilePageNotEditable(page) {
    if (!page) {
      throw new Error('[Profile.verifyTravelerProfilePageNotEditable] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);
    const { readOnlyClass, saveButtons, editableInputs, editableBirthDateInputs } =
      await profilePage.getUserProfilePageEditability();
    const unexpectedEditableInputs = editableInputs - editableBirthDateInputs;

    if (!readOnlyClass || saveButtons > 0 || unexpectedEditableInputs > 0) {
      // Only named here: identifying the controls costs a round-trip per attribute, and the
      // information is worthless unless the assertion is already failing.
      const editableInputDetails = await profilePage.describeEditableInputs();
      throw new Error(
        `[Profile.verifyTravelerProfilePageNotEditable] The traveller profile page is editable ` +
        `(read-only class: ${readOnlyClass}, visible Save buttons: ${saveButtons}, enabled inputs: ${editableInputs} ` +
        `of which ${editableBirthDateInputs} are the known-inert Birth Date field), but this privilege ` +
        `combination only permits VIEWING another traveller's profile. A booker holding just ` +
        `"Can view profile of other users" must not be able to change someone else's details — verify the ` +
        `privilege set on the booker and that the opened profile is not their own. ` +
        `Enabled inputs: ${editableInputDetails.length ? editableInputDetails.join(' | ') : 'none'}.`
      );
    }

    logger.debug(
      '[Profile.verifyTravelerProfilePageNotEditable] Structural signals are read-only; proving the Birth Date field is inert'
    );

    if (await profilePage.isDateOfBirthInputInteractive()) {
      throw new Error(
        '[Profile.verifyTravelerProfilePageNotEditable] The Birth Date field can receive clicks on a ' +
        'read-only profile. It renders without a `disabled` attribute (personal-details-form.vue omits ' +
        'the :disabled="disableEdit" binding its sibling fields have) and is relied on to be inert ' +
        'because the read-only form swallows pointer events — an interactive field means a booker ' +
        'holding only "Can view profile of other users" can open the picker and change another ' +
        "traveller's date of birth."
      );
    }

    logger.info('[Profile.verifyTravelerProfilePageNotEditable] Traveller profile page is read-only, as expected');
  },
  /**
   * Asserts the open standalone profile page belongs to the traveller whose FIRST NAME is given.
   *
   * The privilege scenarios that use this open one traveller's profile after another from the trip's
   * name tags, and every one of them can fail the same way: the tag routes to /user/:userId with the
   * BOOKER's id, so a profile loads, renders, and is even editable — just not the traveller's. That
   * is invisible to verifyTravelerProfilePageOpen, which only proves a profile page rendered.
   *
   * Keyed on the First Name INPUT rather than on the page heading, unlike verifyUserProfileOpenOnTab
   * which compares a full name against the <h1>: these travellers are identified by the term the
   * autocomplete was searched with ("View", "Edit"), and no scenario knows their surnames.
   *
   * Compared case-insensitively — the feature file names the traveller the way a tester types the
   * search term, while the field renders the stored capitalisation.
   *
   * @param {import('playwright').Page} page - the page the profile opened on
   * @param {string} expectedFirstName - first name as stored on the traveller's profile
   * @returns {Promise<{ firstName: string }>}
   */
  async verifyTravelerProfilePageBelongsTo(page, expectedFirstName) {
    if (!page) {
      throw new Error('[Profile.verifyTravelerProfilePageBelongsTo] "page" is required.');
    }
    if (!expectedFirstName || typeof expectedFirstName !== 'string') {
      throw new Error(
        `[Profile.verifyTravelerProfilePageBelongsTo] "expectedFirstName" must be a non-empty string, got: ` +
        `${typeof expectedFirstName} (${JSON.stringify(expectedFirstName)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForUserProfilePage();

    const firstName = await profilePage.getProfileFirstNameValue();

    if (firstName.toLowerCase() !== expectedFirstName.trim().toLowerCase()) {
      // The heading is read only to describe the failure — it names whoever DID open, which is the
      // one thing that makes "wrong traveller" distinguishable from "profile never loaded".
      const ownerName = await profilePage.getUserProfilePageOwnerName();
      throw new Error(
        `[Profile.verifyTravelerProfilePageBelongsTo] The profile that opened has first name ` +
        `"${firstName || '(no value rendered)'}" but "${expectedFirstName}" was expected ` +
        `(heading: "${ownerName || 'none'}", url: ${page.url()}). Clicking the traveller's name tag routed to ` +
        `the wrong /user/:userId — usually the booker's own id instead of the selected traveller's, which ` +
        `would let a privilege check pass against a profile the booker is always allowed to edit.`
      );
    }

    logger.info(`[Profile.verifyTravelerProfilePageBelongsTo] Profile of "${firstName}" is open (${page.url()})`);
    return { firstName };
  },

  /**
   * Types a fresh random value into the profile's Middle Name field and returns it, so the caller
   * can assert the same value survived the save.
   *
   * Middle Name is the field these privilege scenarios change because it is the only Personal
   * Details input that is neither mandatory nor identity-bearing — editing it proves the profile is
   * writable without risking a save the app would reject for reasons of its own.
   *
   * The value is alphabetic only: personal-details-form.vue validates middleName with
   * `isAlphaAndSpace`, so faker's person names would intermittently yield a hyphen or apostrophe and
   * fail the save for the wrong reason.
   *
   * Saving is left to the caller (savePersonalDetails) — the fill and the save are separate steps in
   * every scenario, which is what lets a read-only profile be caught at the fill.
   *
   * @param {import('playwright').Page} page - the page the profile is open on
   * @returns {Promise<{ value: string }>} the value typed, to be handed to verifyMiddleName
   */
  async enterRandomMiddleName(page) {
    if (!page) {
      throw new Error('[Profile.enterRandomMiddleName] "page" is required.');
    }

    const profilePage = getPageObject(page, ProfilePage);
    const value = faker.string.alpha({ length: 8, casing: 'lower' });

    logger.debug(`[Profile.enterRandomMiddleName] Typing middle name "${value}"`);
    await profilePage.fillMiddleName(value);

    logger.info(`[Profile.enterRandomMiddleName] Middle name set to "${value}"`);
    return { value };
  },

  /**
   * Asserts the profile's Middle Name field holds `expectedValue`.
   *
   * Run AFTER the save and its success notification: the toast only proves the request was accepted,
   * while re-reading the field is what proves the change was persisted and reflected back. A booker
   * whose privilege was ignored server-side gets the toast and the old value.
   *
   * @param {import('playwright').Page} page - the page the profile is open on
   * @param {string} expectedValue - the value enterRandomMiddleName returned
   * @returns {Promise<void>}
   */
  async verifyMiddleName(page, expectedValue) {
    if (!page) {
      throw new Error('[Profile.verifyMiddleName] "page" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyMiddleName] "expectedValue" must be a non-empty string, got: ` +
        `${typeof expectedValue} (${JSON.stringify(expectedValue)}). The step must pass the value the ` +
        `matching "I enter a random middle name in the traveler profile" step stored on the World.`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);

    await expect(
      profilePage.getMiddleNameLocator(),
      `Middle Name should read back as "${expectedValue}" — the Save was accepted (the success ` +
      `notification appeared) but the field still has to show the saved value. The old value here means ` +
      `the profile update was refused server-side despite the toast, which is exactly what a booker ` +
      `whose edit privilege is not honoured would see.`
    ).toHaveValue(expectedValue, { timeout: 15000 });

    logger.info(`[Profile.verifyMiddleName] Middle name reads back as "${expectedValue}"`);
  },

  /**
   * Asserts the required-field message under the profile popup's Gender select reads
   * `expectedMessage`.
   *
   * WHICH field is flagged is the whole point: the popup renders the identical wording under every
   * empty mandatory field, so a bare "a required error is shown" check passes just as happily for a
   * traveller missing something else. The message is passed in rather than hardcoded so the feature
   * file states what the traveller is expected to be refused for.
   *
   * No Save attempt is needed first — personal-details-form.vue renders the Gender message from
   * `v$.formData.gender.required && v$.formData.gender.$invalid` alone, unlike firstName/lastName,
   * which additionally wait on the form's markFields flag.
   *
   * @param {import('playwright').Page} page - the page holding the open profile popup
   * @param {string} expectedMessage - e.g. "This field is required"
   * @returns {Promise<void>}
   */
  async verifyGenderRequiredError(page, expectedMessage) {
    if (!page) {
      throw new Error('[Profile.verifyGenderRequiredError] "page" is required.');
    }
    if (!expectedMessage || typeof expectedMessage !== 'string') {
      throw new Error(
        `[Profile.verifyGenderRequiredError] "expectedMessage" must be a non-empty string, got: ` +
        `${typeof expectedMessage} (${JSON.stringify(expectedMessage)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);

    await expect(
      profilePage.getGenderRequiredErrorLocator(),
      `The Gender select should show "${expectedMessage}" — this traveller has no gender on file and the ` +
      `corporation mandates it, so the profile popup must refuse the add and name Gender as the missing ` +
      `field. Nothing under Gender means the mandate rule was not applied to it.`
    ).toHaveText(expectedMessage, { timeout: 15000 });

    logger.info(`[Profile.verifyGenderRequiredError] Gender shows "${expectedMessage}"`);
  },

  /**
   * Closes the traveller profile the trip's name tag opened and hands back the page the trip is on.
   *
   * Clicking a traveller name window.open()s /user/:userId, so a scenario that opens several profiles
   * in turn has to close each one: left open, the next "I click the traveler name" step would assert
   * against a stale tab, and the After hook would screenshot the profile rather than the trip.
   *
   * Both branches of openTravelerProfileFromLastTravelerTag are handled — on desktop the profile is a
   * separate tab and is closed, while on a mobile viewport utilService.openNewWindow router-pushes in
   * place, so there is nothing to close and the same tab is navigated back instead.
   *
   * Tab lifecycle is context-level rather than page-object work, so it sits here (as it does in
   * App.completeSsoLogin and Administration's linked-tab helpers) rather than in a page object.
   *
   * @param {import('playwright').Page} profileTab - the page the profile opened on
   * @param {import('playwright').Page} tripPage - the page the trip/search form is on
   * @returns {Promise<import('playwright').Page>} the page the caller should continue on
   */
  async closeTravelerProfileAndReturn(profileTab, tripPage) {
    if (!profileTab) {
      throw new Error('[Profile.closeTravelerProfileAndReturn] "profileTab" is required.');
    }
    if (!tripPage) {
      throw new Error(
        '[Profile.closeTravelerProfileAndReturn] "tripPage" is required — the step must pass the page the ' +
        'trip was on before the profile opened.'
      );
    }

    const openedInNewTab = profileTab !== tripPage;

    if (openedInNewTab) {
      if (tripPage.isClosed()) {
        throw new Error(
          '[Profile.closeTravelerProfileAndReturn] The trip page has already been closed, so there is ' +
          'nothing to return to. Closing the profile tab would leave the scenario with no page to ' +
          'continue on.'
        );
      }
      if (!profileTab.isClosed()) {
        await profileTab.close();
      }
    } else {
      // Same-tab (mobile) branch: the profile replaced the trip in place, so step back to it.
      await profileTab.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await tripPage.bringToFront();

    const searchPage = getPageObject(tripPage, SearchPage);
    await searchPage.waitForSearchControl();

    logger.info(
      `[Profile.closeTravelerProfileAndReturn] Profile ${openedInNewTab ? 'tab closed' : 'navigated back'}; ` +
      `continuing on the trip page (${tripPage.url()})`
    );
    return tripPage;
  },

  /**
   * Asserts the named traveller's tag on the search page offers no route to their profile.
   *
   * Three things are checked, because each can fail on its own and the first two would each be
   * satisfied by the wrong app behaviour:
   *
   *  1. the tag IS present — a tag missing entirely would pass a bare "nothing clickable" check
   *     while actually meaning the traveller never reached the trip;
   *  2. it carries no `is-clickable` class — trip-traveler-tag.vue binds that class to
   *     isUserCanViewProfile, so its absence is the affordance being withheld in the markup;
   *  3. clicking it opens nothing — no new tab, and the page stays off /user/. goToUserApp returns
   *     before utilService.openNewWindow on the same computed, and only the click proves the
   *     handler agrees with the class. A withheld class over a live handler would still leak the
   *     profile to anyone who clicks the name.
   *
   * @param {import('playwright').Page} page - the search page holding the traveller tags.
   * @param {string} name - the traveller name as rendered on the tag, e.g. "View Profile".
   */
  async verifyTravelerNameTagNotClickable(page, name) {
    if (!page) {
      throw new Error('[Profile.verifyTravelerNameTagNotClickable] "page" is required.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error(
        `[Profile.verifyTravelerNameTagNotClickable] "name" must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    const { present, clickable } = await profilePage.getTravelerNameTagState(name);

    if (!present) {
      const tagNames = await profilePage.getFilledTravelerNameLinkTexts();
      throw new Error(
        `[Profile.verifyTravelerNameTagNotClickable] No traveller tag named "${name}" is on the trip, so ` +
        `there is nothing to prove unreachable. Clickable tags present: ` +
        `${tagNames.length ? JSON.stringify(tagNames) : 'none'}. The traveller was never added, or the tag ` +
        `renders a different name than the one this step was given.`
      );
    }

    if (clickable) {
      throw new Error(
        `[Profile.verifyTravelerNameTagNotClickable] The traveller tag "${name}" is rendered as a link to ` +
        `their profile: it carries the is-clickable class, which trip-traveler-tag.vue only adds when ` +
        `isUserCanViewProfile is true — i.e. when the traveller IS the logged-in user, or the booker holds ` +
        `CanViewProfile / CanEditAndViewProfile. This booker is expected to hold neither, so verify the ` +
        `privilege set on the booker and that "${name}" is not their own profile.`
      );
    }

    const urlBefore = page.url();
    // 5s is generous rather than arbitrary: goToUserApp calls utilService.openNewWindow
    // synchronously inside the click handler, so a tab that was going to open has already been
    // created by the time the click resolves. The wait exists to give the 'page' event a chance to
    // surface, not to wait on the app deciding — and since this is proving a NEGATIVE, the timeout
    // is the passing path, so it is kept short enough not to tax every green run.
    const newPagePromise = page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);

    await profilePage.clickTravelerNameTag(name);

    const newTab = await newPagePromise;

    if (newTab) {
      const openedUrl = newTab.url();
      await newTab.close();
      throw new Error(
        `[Profile.verifyTravelerNameTagNotClickable] Clicking the traveller tag "${name}" opened a new tab ` +
        `on ${openedUrl}. The tag rendered without the is-clickable class, so it does not LOOK like a link, ` +
        `but goToUserApp still reached openNewWindow — the profile is reachable by anyone who clicks the ` +
        `name, regardless of privilege.`
      );
    }

    const urlAfter = page.url();

    if (urlAfter.includes('/user/')) {
      throw new Error(
        `[Profile.verifyTravelerNameTagNotClickable] Clicking the traveller tag "${name}" navigated the ` +
        `current tab to the profile route (${urlAfter}, was ${urlBefore}). Access to another traveller's ` +
        `profile is not prevented — it opened in place instead of in a new tab.`
      );
    }

    logger.info(
      `[Profile.verifyTravelerNameTagNotClickable] Traveller tag "${name}" is not a profile link, and clicking ` +
      `it opened nothing (still on ${urlAfter})`
    );
  },

  /**
   * Navigates to the Travel Preferences tab on the traveler profile page.
   */
  async openTravelPreferencesTab(page) {
    if (!page) throw new Error('[Profile.openTravelPreferencesTab] "page" is required.');

    logger.debug('[Profile.openTravelPreferencesTab] Clicking Travel Preferences tab');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickTravelPreferencesTab();
      await profilePage.waitForTravelPreferencesForm();
    } catch (err) {
      throw new Error(`[Profile.openTravelPreferencesTab] Failed to open Travel Preferences tab: ${err.message}`);
    }

    logger.info('[Profile.openTravelPreferencesTab] Travel Preferences tab opened');
  },

  /**
   * Selects the first available seat preference (Aisle) from the seat type dropdown.
   */
  async selectSeatPreference(page) {
    if (!page) throw new Error('[Profile.selectSeatPreference] "page" is required.');

    logger.debug('[Profile.selectSeatPreference] Selecting seat preference from dropdown');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSeatPreferenceDropdown();
      // Select "Aisle" — the first meaningful option (index 0 in the options array)
      await profilePage.selectSeatPreferenceOption('Aisle');
    } catch (err) {
      throw new Error(
        `[Profile.selectSeatPreference] Failed to select seat preference: ${err.message}`
      );
    }

    logger.info('[Profile.selectSeatPreference] Seat preference "Aisle" selected');
  },

  /**
   * Clicks the Save button on the Travel Preferences form and waits for the save to complete.
   */
  async saveTravelPreferences(page) {
    if (!page) throw new Error('[Profile.saveTravelPreferences] "page" is required.');

    logger.debug('[Profile.saveTravelPreferences] Clicking Save on Travel Preferences form');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveTravelPreferences();
    } catch (err) {
      throw new Error(
        `[Profile.saveTravelPreferences] Failed to save travel preferences: ${err.message}`
      );
    }

    logger.info('[Profile.saveTravelPreferences] Travel preferences saved');
  },

  /**
   * Verifies that the seat preference is saved (text is not the default "No preference" placeholder).
   */
  async verifySeatPreferenceSaved(page) {
    if (!page) throw new Error('[Profile.verifySeatPreferenceSaved] "page" is required.');

    logger.debug('[Profile.verifySeatPreferenceSaved] Verifying seat preference is saved');

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getSeatPreferenceText();
    } catch (err) {
      throw new Error(`[Profile.verifySeatPreferenceSaved] Failed to read seat preference text: ${err.message}`);
    }

    if (!actualText || actualText === 'No preference') {
      throw new Error(
        `[Profile.verifySeatPreferenceSaved] Seat preference was NOT saved — field still shows "${actualText || 'empty'}". ` +
        `The selection may not have been applied or the save did not persist the value.`
      );
    }

    logger.info(`[Profile.verifySeatPreferenceSaved] Seat preference is saved: "${actualText}"`);
    return { seatPreference: actualText };
  },

  /**
   * Clears the seat preference by opening the dropdown and selecting "No preference".
   */
  async clearSeatPreference(page) {
    if (!page) throw new Error('[Profile.clearSeatPreference] "page" is required.');

    logger.debug('[Profile.clearSeatPreference] Clearing seat preference by selecting "No preference"');

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSeatPreferenceDropdown();
      await profilePage.selectSeatPreferenceOption('No preference');
    } catch (err) {
      throw new Error(
        `[Profile.clearSeatPreference] Failed to clear seat preference — could not select "No preference": ${err.message}`
      );
    }

    logger.info('[Profile.clearSeatPreference] Seat preference cleared (set to "No preference")');
  },

  /**
   * Verifies that the seat preference shows the default "No preference" placeholder (i.e., is cleared).
   */
  async verifySeatPreferenceCleared(page) {
    if (!page) throw new Error('[Profile.verifySeatPreferenceCleared] "page" is required.');

    logger.debug('[Profile.verifySeatPreferenceCleared] Verifying seat preference is cleared');

    const profilePage = getPageObject(page, ProfilePage);
    let actualText;

    try {
      actualText = await profilePage.getSeatPreferenceText();
    } catch (err) {
      throw new Error(`[Profile.verifySeatPreferenceCleared] Failed to read seat preference text: ${err.message}`);
    }

    if (actualText !== 'No preference') {
      throw new Error(
        `[Profile.verifySeatPreferenceCleared] Seat preference was NOT cleared — field shows "${actualText}" but expected "No preference". ` +
        `The "No preference" option may not have been selected or the save did not persist the change.`
      );
    }

    logger.info('[Profile.verifySeatPreferenceCleared] Seat preference confirmed cleared ("No preference")');
  },

  /**
   * Verifies no validation warning messages are visible in the dynamic reference fields section of the profile.
   */
  async verifyNoDynamicFieldWarnings(page) {
    if (!page) throw new Error('[Profile.verifyNoDynamicFieldWarnings] "page" is required.');

    logger.debug('[Profile.verifyNoDynamicFieldWarnings] Waiting for personal details form before checking warnings');

    try {
      await page.locator('.personal-details-form-content').waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Personal details form did not become visible — cannot check for dynamic field warnings. ` +
        `Original: ${err.message}`
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    let warningCount;

    try {
      warningCount = await profilePage.getDynamicFieldWarningCount();
    } catch (err) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Failed to count dynamic field warnings: ${err.message}`
      );
    }

    if (warningCount > 0) {
      throw new Error(
        `[Profile.verifyNoDynamicFieldWarnings] Expected no dynamic field warning messages but found ${warningCount}. ` +
        `This means a required dynamic reference field may not be filled in the traveler profile. ` +
        `Check the profile data for the test user.`
      );
    }

    logger.info('[Profile.verifyNoDynamicFieldWarnings] No dynamic field warning messages are visible');
  },

  /**
   * Verifies the selected value of the dynamic profile dropdown field matches the expected value.
   */
  async verifyDynamicFieldValue(page, expectedValue) {
    if (!page) throw new Error('[Profile.verifyDynamicFieldValue] "page" is required.');
    if (typeof expectedValue !== 'string') {
      throw new Error(
        `[Profile.verifyDynamicFieldValue] "expectedValue" must be a string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Profile.verifyDynamicFieldValue] Verifying dynamic reference field shows "${expectedValue}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let actualValue;

    try {
      actualValue = await profilePage.getDynamicFieldSelectValue();
    } catch (err) {
      throw new Error(`[Profile.verifyDynamicFieldValue] Failed to read dynamic field value: ${err.message}`);
    }

    const trimmed = (actualValue || '').trim();
    if (trimmed !== expectedValue) {
      throw new Error(
        `[Profile.verifyDynamicFieldValue] Dynamic profile field shows "${trimmed}" but expected "${expectedValue}". ` +
        `The field may have a different value saved in the profile, or the locator is reading the placeholder instead of the selected value.`
      );
    }

    logger.info(`[Profile.verifyDynamicFieldValue] Dynamic profile field confirmed showing "${trimmed}"`);
    return { dynamicFieldValue: trimmed };
  },

  /**
   * Verifies the dynamic profile field is not editable (disabled) in the profile.
   * A field configured as "Editable = Nowhere" only displays its option value and
   * cannot be changed — it renders as a disabled dropdown.
   */
  async verifyDynamicFieldNotEditable(page) {
    if (!page) throw new Error('[Profile.verifyDynamicFieldNotEditable] "page" is required.');

    logger.debug('[Profile.verifyDynamicFieldNotEditable] Verifying dynamic profile field is not editable');

    const profilePage = getPageObject(page, ProfilePage);

    let editable;
    try {
      editable = await profilePage.isDynamicFieldEditable();
    } catch (err) {
      throw new Error(`[Profile.verifyDynamicFieldNotEditable] Failed to read dynamic field editability: ${err.message}`);
    }

    if (editable) {
      throw new Error(
        '[Profile.verifyDynamicFieldNotEditable] The dynamic profile field is editable, but it was expected to be ' +
        'non-editable ("Editable = Nowhere"). The field dropdown is enabled — verify the field configuration for this user.'
      );
    }

    logger.info('[Profile.verifyDynamicFieldNotEditable] Dynamic profile field confirmed not editable');
  },

  /**
   * Verifies the Personal Details tab is the active tab by checking the "Title" field label is visible.
   */
  async verifyPersonalDetailsTabActive(page, expectedLabel = 'Title') {
    if (!page) throw new Error('[Profile.verifyPersonalDetailsTabActive] "page" is required.');
    if (typeof expectedLabel !== 'string' || !expectedLabel) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] "expectedLabel" must be a non-empty string, got: ${typeof expectedLabel} (${JSON.stringify(expectedLabel)})`
      );
    }

    logger.debug(`[Profile.verifyPersonalDetailsTabActive] Verifying Personal Details tab is active — expecting field label "${expectedLabel}"`);

    const profilePage = getPageObject(page, ProfilePage);
    let label;

    try {
      label = await profilePage.getTitleFieldLabel();
    } catch (err) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] Failed to read the first field label from the Personal Details form: ${err.message}. ` +
        `The Personal Details tab may not be the active tab when the profile opens.`
      );
    }

    if (!label.includes(expectedLabel)) {
      throw new Error(
        `[Profile.verifyPersonalDetailsTabActive] Expected the first label in name-inputs-container to contain "${expectedLabel}" but got "${label}". ` +
        `The Personal Details tab may not be open or the form layout has changed.`
      );
    }

    logger.info(`[Profile.verifyPersonalDetailsTabActive] Personal Details tab confirmed active — field label "${label}" contains "${expectedLabel}"`);
    return { label };
  },

  async openPersonalDetailsTab(page) {
    if (!page) throw new Error('[Profile.openPersonalDetailsTab] "page" is required.');
    logger.debug('[Profile.openPersonalDetailsTab] Clicking Personal Details tab');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.clickPersonalDetailsTab();
      await profilePage.waitForPersonalDetailsForm();
    } catch (err) {
      throw new Error(`[Profile.openPersonalDetailsTab] Failed to open Personal Details tab: ${err.message}`);
    }
    logger.info('[Profile.openPersonalDetailsTab] Personal Details tab opened');
  },

  async scrollToDynamicFields(page) {
    if (!page) throw new Error('[Profile.scrollToDynamicFields] "page" is required.');
    logger.debug('[Profile.scrollToDynamicFields] Scrolling to dynamic reference fields section');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.scrollToDynamicFieldLabel();
    } catch (err) {
      throw new Error(`[Profile.scrollToDynamicFields] Failed to scroll to dynamic reference fields: ${err.message}`);
    }
    logger.info('[Profile.scrollToDynamicFields] Scrolled to dynamic reference fields section');
  },

  async hoverDynamicFieldIcon(page) {
    if (!page) throw new Error('[Profile.hoverDynamicFieldIcon] "page" is required.');
    logger.debug('[Profile.hoverDynamicFieldIcon] Hovering over dynamic field info icon');
    const profilePage = getPageObject(page, ProfilePage);
    try {
      await profilePage.hoverDynamicFieldInfoIcon();
    } catch (err) {
      throw new Error(`[Profile.hoverDynamicFieldIcon] Failed to hover over dynamic field info icon: ${err.message}`);
    }
    logger.info('[Profile.hoverDynamicFieldIcon] Hovered over dynamic field info icon');
  },

  async verifyTooltipText(page, expectedText) {
    if (!page) throw new Error('[Profile.verifyTooltipText] "page" is required.');
    if (typeof expectedText !== 'string') {
      throw new Error(
        `[Profile.verifyTooltipText] "expectedText" must be a string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }
    logger.debug(`[Profile.verifyTooltipText] Verifying tooltip displays "${expectedText}"`);
    const profilePage = getPageObject(page, ProfilePage);
    let actualText;
    try {
      actualText = await profilePage.getDynamicFieldTooltipText();
    } catch (err) {
      throw new Error(`[Profile.verifyTooltipText] Failed to read tooltip text: ${err.message}`);
    }
    const trimmed = (actualText || '').trim();
    if (trimmed !== expectedText) {
      throw new Error(
        `[Profile.verifyTooltipText] Tooltip shows "${trimmed}" but expected "${expectedText}". ` +
        `The tooltip may not have appeared, or the dynamic field helpQuestionText is different from expected.`
      );
    }
    logger.info(`[Profile.verifyTooltipText] Tooltip text confirmed: "${trimmed}"`);
    return { tooltipText: trimmed };
  },

  async verifyLoyaltyNumbersMasked(page) {
    if (!page) throw new Error('[Profile.verifyLoyaltyNumbersMasked] "page" is required.');
    logger.debug('[Profile.verifyLoyaltyNumbersMasked] Reading all loyalty number input values');
    const profilePage = getPageObject(page, ProfilePage);
    let values;
    try {
      values = await profilePage.getAllLoyaltyInputValues();
    } catch (err) {
      throw new Error(`[Profile.verifyLoyaltyNumbersMasked] Failed to read loyalty inputs: ${err.message}`);
    }
    if (values.length === 0) {
      throw new Error(
        '[Profile.verifyLoyaltyNumbersMasked] No loyalty number inputs found in the frequent programs form. ' +
        'Ensure the traveler has loyalty numbers and the Frequent Programs tab is open.'
      );
    }
    const maskedValues = values.filter(v => /^\*{9}.{3}$/.test(v));
    if (maskedValues.length === 0) {
      throw new Error(
        `[Profile.verifyLoyaltyNumbersMasked] None of the ${values.length} input(s) are masked with the expected format. ` +
        `Values found: ${JSON.stringify(values)}. Expected format: *********XXX. ` +
        `Ensure the logged-in user has "Can view profile of other users" privilege to trigger masking.`
      );
    }
    logger.info(`[Profile.verifyLoyaltyNumbersMasked] ${maskedValues.length}/${values.length} loyalty numbers confirmed masked`);
    return { maskedCount: maskedValues.length, totalCount: values.length };
  },

  async verifyMaskedLoyaltyEnding(page, lastDigits) {
    if (!page) throw new Error('[Profile.verifyMaskedLoyaltyEnding] "page" is required.');
    if (typeof lastDigits !== 'string' || !lastDigits) {
      throw new Error(
        `[Profile.verifyMaskedLoyaltyEnding] "lastDigits" must be a non-empty string, got: ${typeof lastDigits} (${JSON.stringify(lastDigits)})`
      );
    }
    logger.debug(`[Profile.verifyMaskedLoyaltyEnding] Looking for masked loyalty number ending in "${lastDigits}"`);
    const profilePage = getPageObject(page, ProfilePage);
    let values;
    try {
      values = await profilePage.getAllLoyaltyInputValues();
    } catch (err) {
      throw new Error(`[Profile.verifyMaskedLoyaltyEnding] Failed to read loyalty inputs: ${err.message}`);
    }
    const match = values.find(v => v.endsWith(lastDigits));
    if (!match) {
      throw new Error(
        `[Profile.verifyMaskedLoyaltyEnding] No loyalty number ending in "${lastDigits}" found. ` +
        `Values present: ${JSON.stringify(values)}. ` +
        `Expected a masked entry matching "*********${lastDigits}". Verify the traveler's loyalty data in their profile.`
      );
    }
    logger.info(`[Profile.verifyMaskedLoyaltyEnding] Found masked loyalty number ending in "${lastDigits}": "${match}"`);
    return { matchedValue: match };
  },

  /**
   * Birth Date encryption on ANOTHER user's profile (AB#35195).
   *
   * Deliberately NOT folded into verifyLoyaltyNumbersMasked: personal-details-form.vue binds the
   * app-datepicker's `format` prop to the literal '*********' while the value is untouched, so the
   * input displays nine asterisks and NO digits at all. The loyalty/passport rendering
   * ('*********' + last 3) does not apply here, so the *********XXX regex would never match.
   *
   * The encryption is IDENTITY-based, not privilege-based — user-profile.ts's
   * isUserHasEncryptedFields returns false only when you are looking at your own profile. So a
   * readable date means the wrong profile is open, not a missing privilege.
   */
  async verifyBirthDateEncrypted(page) {
    if (!page) throw new Error('[Profile.verifyBirthDateEncrypted] "page" is required.');

    logger.debug('[Profile.verifyBirthDateEncrypted] Reading the Birth Date input value');

    const profilePage = getPageObject(page, ProfilePage);
    let value;

    try {
      value = await profilePage.getDobInputValue();
    } catch (err) {
      throw new Error(`[Profile.verifyBirthDateEncrypted] Failed to read the Birth Date input: ${err.message}`);
    }

    const birthDateValue = (value || '').trim();

    // An empty field must fail loudly — a traveller with no saved birth date would otherwise read
    // as "not a date" and pass an inverted assertion by accident.
    if (!birthDateValue) {
      throw new Error(
        '[Profile.verifyBirthDateEncrypted] The Birth Date input is EMPTY, so encryption cannot be confirmed. ' +
        'Either the traveller has no birth date saved on their profile, or the Personal Details form did not finish rendering.'
      );
    }

    if (birthDateValue !== '*********') {
      throw new Error(
        `[Profile.verifyBirthDateEncrypted] Expected the Birth Date input to read "*********" but got "${birthDateValue}". ` +
        'Encryption is identity-based (user-profile.ts isUserHasEncryptedFields), so a readable date means the logged-in ' +
        "user is viewing their OWN profile — check that the traveller-name link opened the traveller's profile, not the booker's."
      );
    }

    logger.info('[Profile.verifyBirthDateEncrypted] Birth Date confirmed encrypted as "*********"');
    return { birthDateValue };
  },

  /**
   * Passport-number encryption on ANOTHER user's profile (AB#35195).
   *
   * passport-visa-form.vue binds :value to utilService.getEncryptedStr(), i.e.
   * '*********' + the last 3 characters — the same shape verifyLoyaltyNumbersMasked asserts.
   * Reads the FIRST saved passport only: getEncryptedStr is str.substr(-3), so a shorter passport
   * number yields fewer than 3 trailing characters and would break an every-row assertion.
   *
   * Call openPassportsAndVisasTab first.
   */
  async verifyPassportNumberEncrypted(page) {
    if (!page) throw new Error('[Profile.verifyPassportNumberEncrypted] "page" is required.');

    logger.debug('[Profile.verifyPassportNumberEncrypted] Reading the passport number input value');

    const profilePage = getPageObject(page, ProfilePage);
    let value;

    try {
      value = await profilePage.getPassportNumberInputValue();
    } catch (err) {
      throw new Error(`[Profile.verifyPassportNumberEncrypted] Failed to read the passport number input: ${err.message}`);
    }

    const passportNumberValue = (value || '').trim();

    if (!passportNumberValue) {
      throw new Error(
        '[Profile.verifyPassportNumberEncrypted] The passport number input is EMPTY, so encryption cannot be confirmed. ' +
        'Either the traveller has no saved passport (the tab then renders only "Add new passport"), or the ' +
        'Passports & Visas form did not finish rendering.'
      );
    }

    if (!/^\*{9}.{3}$/.test(passportNumberValue)) {
      throw new Error(
        `[Profile.verifyPassportNumberEncrypted] Expected the passport number to be encrypted as "*********XXX" ` +
        `(nine asterisks plus the last 3 characters) but got "${passportNumberValue}". ` +
        'Encryption is identity-based (user-profile.ts isUserHasEncryptedFields), so a readable number means the ' +
        'logged-in user is viewing their OWN profile rather than the traveller\'s.'
      );
    }

    logger.info(`[Profile.verifyPassportNumberEncrypted] Passport number confirmed encrypted: "${passportNumberValue}"`);
    return { passportNumberValue };
  },

  /**
   * Adds a credit card using name (alias), type, number, expiry month and year only.
   * Does not require billing address fields (uses defaults for non-mandatory fields).
   * Call openFormOfPaymentTab first.
   */
  async addCreditCardFull(page, { name, type, number, expiryMonth, expiryYear } = {}) {
    if (!page) {
      throw new Error('[Profile.addCreditCardFull] "page" is required.');
    }
    if (!name || typeof name !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "name" (card alias) must be a non-empty string, got: ${typeof name} (${JSON.stringify(name)})`
      );
    }
    if (!type || typeof type !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "type" (card type e.g. "visa") must be a non-empty string, got: ${typeof type} (${JSON.stringify(type)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "number" (card number) must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }
    if (!expiryMonth || typeof expiryMonth !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "expiryMonth" must be a non-empty string (e.g. "02"), got: ${typeof expiryMonth} (${JSON.stringify(expiryMonth)})`
      );
    }
    if (!expiryYear || typeof expiryYear !== 'string') {
      throw new Error(
        `[Profile.addCreditCardFull] "expiryYear" must be a non-empty string (e.g. "2032"), got: ${typeof expiryYear} (${JSON.stringify(expiryYear)})`
      );
    }

    logger.debug(`[Profile.addCreditCardFull] Adding card with name="${name}", type="${type}", expiry=${expiryMonth}/${expiryYear}`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickAddNewCard();
      await profilePage.waitForFopForm();
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to open add-card form: ${err.message}`);
    }

    try {
      await profilePage.fillCardDisplayName(name);
      await profilePage.selectCardType(type);
      await profilePage.fillCardHolderName(name);
      await profilePage.insertCardNumber(number);
      await profilePage.selectExpiryMonth(expiryMonth);
      await profilePage.selectExpiryYear(expiryYear);
      await profilePage.fillBillingAddress('123 Main Street');
      await profilePage.fillBillingCity('London');
      // The zip/postcode field only accepts numeric input.
      await profilePage.fillBillingZipCode('12345');
      // Use United Kingdom rather than United States: a US billing country makes the
      // State field mandatory, and this form does not populate it, so the card silently
      // fails validation and never saves. The UK has no mandatory state/province field.
      await profilePage.selectBillingCountry('UNITED KINGDOM (GB)');
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to fill card details for "${name}": ${err.message}`);
    }

    try {
      await profilePage.clickSaveFop();
    } catch (err) {
      throw new Error(`[Profile.addCreditCardFull] Failed to save credit card "${name}": ${err.message}`);
    }

    logger.info(`[Profile.addCreditCardFull] Credit card "${name}" saved successfully`);
  },

  /**
   * Verifies the card display name (alias) shown in the profile FOP card preview.
   * Checks the .card-name element, which differs from the cardholder name (.card-holder-name).
   */
  /**
   * Verifies the AB#83252 red-dot indicator is shown on the "Form of payment" profile tab.
   *
   * Call this BEFORE opening that tab. The story's criterion is that the dot is "visible regardless
   * of which tab is active" — asserting it only from inside the Form of Payment pane would pass even
   * if the indicator rendered exclusively on the active tab, which is the defect it guards against.
   *
   * @param {import('playwright').Page} page - the profile page (new tab returned by navigateToProfile)
   * @param {string} tabName - tab the dot is expected on, for the failure message. Only
   *   "Form of payment" is implemented; any other name throws rather than passing vacuously.
   */
  async verifyExpiredCardDotOnTab(page, tabName = 'Form of payment') {
    if (!page) {
      throw new Error('[Profile.verifyExpiredCardDotOnTab] "page" is required.');
    }
    if (String(tabName).trim().toLowerCase() !== 'form of payment') {
      throw new Error(
        `[Profile.verifyExpiredCardDotOnTab] Only the "Form of payment" tab carries an expired-card dot ` +
        `(AB#83252 scopes the indicator to the tab holding the card), got "${tabName}".`
      );
    }

    logger.debug(`[Profile.verifyExpiredCardDotOnTab] Verifying the expired-card dot on the "${tabName}" tab`);

    await getPageObject(page, ProfilePage).waitForFormOfPaymentExpiredDot();

    logger.info(`[Profile.verifyExpiredCardDotOnTab] Expired-card dot is displayed on the "${tabName}" tab`);
    return { tabName, dotDisplayed: true };
  },

  /**
   * Verifies the stored credit card with the given display name carries the AB#83252 "Expired"
   * label, and that no OTHER card on the profile is mislabelled as expired alongside it.
   *
   * The second half matters: the story requires the indicator to "reflect the expired card
   * specifically", so a valid sibling card wearing the label is a real defect that a
   * name-scoped-only assertion would walk straight past.
   *
   * @param {import('playwright').Page} page
   * @param {string} cardName - the card's display name, e.g. "test-expired-fop"
   * @param {string} expectedLabel - the label text expected on the row, e.g. "Expired"
   */
  async verifyCardMarkedExpired(page, cardName, expectedLabel = 'Expired') {
    if (!page) {
      throw new Error('[Profile.verifyCardMarkedExpired] "page" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Profile.verifyCardMarkedExpired] "cardName" must be a non-empty string, got: ${typeof cardName} ` +
        `(${JSON.stringify(cardName)})`
      );
    }

    logger.debug(`[Profile.verifyCardMarkedExpired] Verifying card "${cardName}" is labelled "${expectedLabel}"`);

    const rows = await getPageObject(page, ProfilePage).getFormOfPaymentCardRows();
    const target = rows.find((row) => row.name.toLowerCase() === cardName.toLowerCase());

    if (!target) {
      throw new Error(
        `[Profile.verifyCardMarkedExpired] No stored card named "${cardName}" on this profile. ` +
        `Cards found: ${rows.length ? rows.map((r) => `"${r.name}"`).join(', ') : '(none)'}. ` +
        `This is a test-data precondition, not a product defect — the scenario needs that card on file.`
      );
    }

    if (!target.isExpired) {
      throw new Error(
        `[Profile.verifyCardMarkedExpired] Card "${cardName}" carries no "${expectedLabel}" label. ` +
        `profile-form-of-payment.vue renders it behind isCardExpired(form), so either the card's ` +
        `expiration date is not in the past, or the per-card indicator regressed.`
      );
    }

    if (target.expiredLabel.toLowerCase() !== expectedLabel.toLowerCase()) {
      throw new Error(
        `[Profile.verifyCardMarkedExpired] Card "${cardName}" is flagged, but its label reads ` +
        `"${target.expiredLabel}" instead of "${expectedLabel}". The label is i18n copy ` +
        `(selectCreditCard.cardExpired) and the language is persisted on the profile — check the ` +
        `account is left in English before treating this as a product defect.`
      );
    }

    // AB#83252: "a non-expired second card on the same profile must not itself trigger the indicator"
    const wronglyFlagged = rows.filter((row) => row.isExpired && row.name.toLowerCase() !== cardName.toLowerCase());
    if (wronglyFlagged.length) {
      throw new Error(
        `[Profile.verifyCardMarkedExpired] "${cardName}" is correctly labelled "${expectedLabel}", but so ` +
        `${wronglyFlagged.length === 1 ? 'is' : 'are'} ${wronglyFlagged.map((r) => `"${r.name}"`).join(', ')}. ` +
        `AB#83252 requires the indicator to reflect the expired card specifically. If those cards are also ` +
        `genuinely expired this is a test-data problem, not a defect — the scenario needs exactly one.`
      );
    }

    logger.info(`[Profile.verifyCardMarkedExpired] Card "${cardName}" is labelled "${target.expiredLabel}"`);
    return { cardName: target.name, expiredLabel: target.expiredLabel, totalCards: rows.length };
  },

  async verifyCardName(page, cardName) {
    if (!page) {
      throw new Error('[Profile.verifyCardName] "page" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Profile.verifyCardName] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }

    logger.debug(`[Profile.verifyCardName] Verifying card display name "${cardName}" is shown in FOP preview`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualName;
    try {
      actualName = await profilePage.getCardNameFromPreview();
    } catch (err) {
      throw new Error(
        `[Profile.verifyCardName] Failed to read card display name from FOP preview: ${err.message}`
      );
    }

    if (!actualName.toLowerCase().includes(cardName.toLowerCase())) {
      throw new Error(
        `[Profile.verifyCardName] Card display name "${actualName}" does not contain expected "${cardName}". ` +
        `The card may not have been saved correctly or the alias did not persist.`
      );
    }

    logger.info(`[Profile.verifyCardName] Card display name "${actualName}" matches expected "${cardName}"`);
    return { actualName };
  },

  /**
   * Waits for the user-profile mandatory-field dialog popup to appear and verifies
   * that the specified field is marked as mandatory inside the popup.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} fieldName - The field label text expected to carry the "mandatory" class (e.g. "Mobile")
   */
  async verifyMandatoryFieldPopup(page, fieldName) {
    if (!page) {
      throw new Error('[Profile.verifyMandatoryFieldPopup] "page" is required.');
    }
    if (!fieldName || typeof fieldName !== 'string') {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] "fieldName" must be a non-empty string, got: ${typeof fieldName} (${JSON.stringify(fieldName)})`
      );
    }

    logger.debug(`[Profile.verifyMandatoryFieldPopup] Waiting for profile popup and verifying "${fieldName}" is mandatory`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.waitForProfilePopup();
    } catch (err) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Profile mandatory-field popup did not appear: ${err.message}`
      );
    }

    let actualLabel;
    try {
      actualLabel = await profilePage.getMandatoryFieldLabel();
    } catch (err) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Could not read mandatory field label from popup: ${err.message}. ` +
        `The popup may be open but no field carries the CSS class "mandatory" — check that the mobile field is actually mandatory for this corporation.`
      );
    }

    if (!actualLabel.includes(fieldName)) {
      throw new Error(
        `[Profile.verifyMandatoryFieldPopup] Mandatory field label "${actualLabel}" does not contain expected field "${fieldName}". ` +
        `The label class "mandatory" is applied conditionally by checkIsMandateField() — verify the corporation settings mark Mobile as mandatory.`
      );
    }

    logger.info(`[Profile.verifyMandatoryFieldPopup] Profile popup shows "${actualLabel}" as mandatory`);
    return { actualLabel };
  },

  /**
   * Clicks the "Save Contact Information" button in the profile popup to trigger validation.
   * Use this when the popup has empty mandatory fields and you want to see the validation messages.
   */
  async trySaveProfilePopup(page) {
    if (!page) {
      throw new Error('[Profile.trySaveProfilePopup] "page" is required.');
    }

    logger.debug('[Profile.trySaveProfilePopup] Clicking Save in profile popup to trigger validation');
    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.clickSaveInPopup();
    } catch (err) {
      throw new Error(
        `[Profile.trySaveProfilePopup] Failed to click the Save button in the profile popup: ${err.message}. ` +
        `Ensure the profile popup is visible and the Save button is present.`
      );
    }

    logger.info('[Profile.trySaveProfilePopup] Save button clicked — validation messages should now appear');
  },

  /**
   * Verifies the validation message displayed inside the profile popup.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} message - The expected validation message text (e.g. "Invalid phone number")
   */
  async verifyValidationMessage(page, message) {
    if (!page) {
      throw new Error('[Profile.verifyValidationMessage] "page" is required.');
    }
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[Profile.verifyValidationMessage] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`
      );
    }

    logger.debug(`[Profile.verifyValidationMessage] Verifying validation message contains "${message}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualMessage;
    try {
      actualMessage = await profilePage.getValidationMessage();
    } catch (err) {
      throw new Error(
        `[Profile.verifyValidationMessage] Could not read validation message from profile popup: ${err.message}. ` +
        `The message appears only when a phone input is touched and invalid — ensure the popup has been triggered by saving with empty mobile.`
      );
    }

    if (!actualMessage.includes(message)) {
      throw new Error(
        `[Profile.verifyValidationMessage] Validation message "${actualMessage}" does not contain expected text "${message}". ` +
        `Check the i18n key "validation.invalidPhone" for the correct translated value.`
      );
    }

    logger.info(`[Profile.verifyValidationMessage] Validation message verified: "${actualMessage}"`);
    return { actualMessage };
  },

  /**
   * Verifies the informational message displayed at the bottom of the profile popup
   * (the "please fill all required fields" message rendered when form is invalid on submit).
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {string} message - The expected info message text
   */
  async verifyInfoMessage(page, message) {
    if (!page) {
      throw new Error('[Profile.verifyInfoMessage] "page" is required.');
    }
    if (!message || typeof message !== 'string') {
      throw new Error(
        `[Profile.verifyInfoMessage] "message" must be a non-empty string, got: ${typeof message} (${JSON.stringify(message)})`
      );
    }

    logger.debug(`[Profile.verifyInfoMessage] Verifying info message contains "${message}"`);

    const profilePage = getPageObject(page, ProfilePage);

    let actualMessage;
    try {
      actualMessage = await profilePage.getInfoMessage();
    } catch (err) {
      throw new Error(
        `[Profile.verifyInfoMessage] Could not read info message from profile popup: ${err.message}. ` +
        `The message appears only when markFields is true and the form is invalid — ensure the save was attempted before checking.`
      );
    }

    if (!actualMessage.includes(message)) {
      throw new Error(
        `[Profile.verifyInfoMessage] Info message "${actualMessage}" does not contain expected text "${message}". ` +
        `Check the i18n key "userProfile.pleaseFillRequiredFields" for the correct translated value.`
      );
    }

    logger.info(`[Profile.verifyInfoMessage] Info message verified: "${actualMessage}"`);
    return { actualMessage };
  },

  /**
   * Fills in the mobile phone number fields inside the profile mandatory-field popup
   * and clicks Save. The popup should already be open.
   *
   * @param {import('playwright').Page} page - The OBT page where the popup is rendered
   * @param {{ countryCode: string, areaCode: string, number: string }} options
   */
  async enterMobileInPopup(page, { countryCode, areaCode, number } = {}) {
    if (!page) {
      throw new Error('[Profile.enterMobileInPopup] "page" is required.');
    }
    if (!countryCode || typeof countryCode !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "countryCode" must be a non-empty string, got: ${typeof countryCode} (${JSON.stringify(countryCode)})`
      );
    }
    if (!areaCode || typeof areaCode !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "areaCode" must be a non-empty string, got: ${typeof areaCode} (${JSON.stringify(areaCode)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Profile.enterMobileInPopup] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }

    logger.debug(`[Profile.enterMobileInPopup] Filling mobile in popup: ${countryCode}-${areaCode}-${number}`);

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.fillMobileInPopup({ countryCode, areaCode, number });
    } catch (err) {
      throw new Error(
        `[Profile.enterMobileInPopup] Failed to fill mobile (${countryCode}-${areaCode}-${number}) in popup: ${err.message}`
      );
    }

    try {
      await profilePage.clickSaveInPopup();
    } catch (err) {
      throw new Error(
        `[Profile.enterMobileInPopup] Failed to click Save in popup after filling mobile: ${err.message}. ` +
        `The phone number may still be invalid — verify the format is correct for the configured validator.`
      );
    }

    logger.info(`[Profile.enterMobileInPopup] Mobile entered and saved in popup: ${countryCode}-${areaCode}-${number}`);
  },
  /**
   * Waits for the editable "User profile" dialog — raised when the selected traveller has
   * missing mandate fields that the logged-in user is allowed to fill in.
   */
  async verifyUserProfilePopupOpen(page) {
    if (!page) {
      throw new Error("[Profile.verifyUserProfilePopupOpen] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForDialogByTitle("User profile");
    logger.info("[Profile.verifyUserProfilePopupOpen] Editable \"User profile\" popup is open");
  },

  /**
   * Asserts the editable "User profile" dialog stays closed — the expected outcome whenever the
   * privilege combination sends the user to the warning popup instead.
   */
  async verifyUserProfilePopupNotOpen(page) {
    if (!page) {
      throw new Error("[Profile.verifyUserProfilePopupNotOpen] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.waitForDialogByTitleHidden("User profile");
    } catch (err) {
      throw new Error(
        "[Profile.verifyUserProfilePopupNotOpen] The editable \"User profile\" popup is open, but this privilege " +
        "combination must send the user to the \"Mandatory Details Are Missing\" warning instead — the traveller " +
        `must not become editable. Original: ${err.message}`,
      );
    }

    logger.info("[Profile.verifyUserProfilePopupNotOpen] Editable \"User profile\" popup did not open, as expected");
  },

  /**
   * Waits for the read-only "Mandatory Details Are Missing" warning dialog.
   */
  async verifyMandatoryDetailsWarningOpen(page) {
    if (!page) {
      throw new Error("[Profile.verifyMandatoryDetailsWarningOpen] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForDialogByTitle("Mandatory Details Are Missing");
    logger.info("[Profile.verifyMandatoryDetailsWarningOpen] \"Mandatory Details Are Missing\" popup is open");
  },

  async verifyMandatoryDetailsWarningNotOpen(page) {
    if (!page) {
      throw new Error("[Profile.verifyMandatoryDetailsWarningNotOpen] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);

    try {
      await profilePage.waitForDialogByTitleHidden("Mandatory Details Are Missing");
    } catch (err) {
      throw new Error(
        "[Profile.verifyMandatoryDetailsWarningNotOpen] The \"Mandatory Details Are Missing\" popup is open, but " +
        "this privilege combination must open the editable profile popup instead — the traveller is being " +
        `blocked when they should be fillable. Original: ${err.message}`,
      );
    }

    logger.info("[Profile.verifyMandatoryDetailsWarningNotOpen] Warning popup did not open, as expected");
  },

  /**
   * Asserts the warning dialog body contains the given sentence.
   */
  async verifyMandatoryDetailsWarningText(page, expectedText) {
    if (!page) {
      throw new Error("[Profile.verifyMandatoryDetailsWarningText] \"page\" is required.");
    }
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(
        `[Profile.verifyMandatoryDetailsWarningText] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`,
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    const actual = await profilePage.getDialogBodyText("Mandatory Details Are Missing");
    const normalise = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();

    if (!normalise(actual).includes(normalise(expectedText))) {
      throw new Error(
        `[Profile.verifyMandatoryDetailsWarningText] The warning popup does not mention "${expectedText}". ` +
        `Actual popup text: "${actual}"`,
      );
    }

    logger.info(`[Profile.verifyMandatoryDetailsWarningText] Warning popup mentions "${expectedText}"`);
  },

  /**
   * Asserts the open "User profile" popup is the one belonging to the given traveller, by reading
   * the Email field the popup loaded into its Personal Details tab.
   *
   * verifyUserProfilePopupOpen only proves *a* profile popup opened. For a booker who may edit
   * other profiles that is not enough: the failure this guards against is the popup opening on the
   * booker's OWN profile after another traveller was selected, which would satisfy every other
   * assertion in the scenario — editable, starred, no warning — while testing nothing about the
   * traveller. Comparing the loaded email is what ties the popup to the traveller who was picked.
   *
   * @param {import("@playwright/test").Page} page
   * @param {string} expectedEmail traveller the popup is expected to have loaded
   */
  async verifyUserProfilePopupBelongsTo(page, expectedEmail) {
    if (!page) {
      throw new Error("[Profile.verifyUserProfilePopupBelongsTo] \"page\" is required.");
    }
    if (!expectedEmail || typeof expectedEmail !== "string") {
      throw new Error(
        `[Profile.verifyUserProfilePopupBelongsTo] "expectedEmail" must be a non-empty string, got: ${typeof expectedEmail} (${JSON.stringify(expectedEmail)})`,
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.waitForDialogByTitle("User profile");
    const actualEmail = await profilePage.getDialogEmailValue("User profile");

    if (!actualEmail) {
      throw new Error(
        "[Profile.verifyUserProfilePopupBelongsTo] The \"User profile\" popup is open but its Email field on the " +
        `Personal Details tab is empty or absent, so the popup cannot be confirmed as "${expectedEmail}"'s. ` +
        "Check that the popup opened on the Personal Details tab and that the traveller's profile actually loaded.",
      );
    }

    if (actualEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      throw new Error(
        `[Profile.verifyUserProfilePopupBelongsTo] The "User profile" popup loaded "${actualEmail}" but ` +
        `"${expectedEmail}" was expected. Selecting a traveller must open THAT traveller's profile — a popup ` +
        "showing anyone else (typically the booker's own profile) means the traveller selection did not reach " +
        "the profile popup, and every later assertion in this scenario would be checking the wrong profile.",
      );
    }

    logger.info(`[Profile.verifyUserProfilePopupBelongsTo] Popup belongs to "${expectedEmail}", as expected`);
  },

  /**
   * Asserts the profile popup opened on the expected tab. user-profile.ts sends the popup to the
   * tab holding the first missing mandate field, so the tab it lands on is the observable proof
   * that the mandate-field configuration was read and applied.
   */
  async verifyUserProfilePopupActiveTab(page, expectedTab) {
    if (!page) {
      throw new Error("[Profile.verifyUserProfilePopupActiveTab] \"page\" is required.");
    }
    if (!expectedTab || typeof expectedTab !== "string") {
      throw new Error(
        `[Profile.verifyUserProfilePopupActiveTab] "expectedTab" must be a non-empty string, got: ${typeof expectedTab} (${JSON.stringify(expectedTab)})`,
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    const actualTab = await profilePage.getActiveDialogTabName("User profile");

    if (actualTab !== expectedTab) {
      throw new Error(
        `[Profile.verifyUserProfilePopupActiveTab] The "User profile" popup opened on tab "${actualTab}" but ` +
        `"${expectedTab}" was expected. The popup is supposed to land on the tab holding the first missing ` +
        "mandate field — a different tab means the mandate-field configuration was not applied, or the field " +
        "that is actually missing lives on another tab.",
      );
    }

    logger.info(`[Profile.verifyUserProfilePopupActiveTab] Popup opened on the "${expectedTab}" tab, as expected`);
  },

  /**
   * Asserts the Date of Birth label carries the red star. Only this label is bound to the mandate
   * configuration — personal-details-form.vue stars firstName/lastName/email/language/currency
   * unconditionally — so it is the one that proves the mandate-field rule reached the UI.
   */
  async verifyDateOfBirthMarkedAsMandatory(page) {
    if (!page) {
      throw new Error("[Profile.verifyDateOfBirthMarkedAsMandatory] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    const isMandatory = await profilePage.isDobFieldMarkedMandatory("User profile");

    if (!isMandatory) {
      throw new Error(
        "[Profile.verifyDateOfBirthMarkedAsMandatory] The \"Date of Birth\" label in the open \"User profile\" " +
        "popup is not marked with a red star (CSS class \"mandatory\"). Date of Birth must be configured as a " +
        "mandate field in Corporate Administration > Users > Mandate Fields for this test, and the popup must " +
        "reflect it.",
      );
    }

    logger.info("[Profile.verifyDateOfBirthMarkedAsMandatory] \"Date of Birth\" is marked with a red star");
  },

  /**
   * Asserts the open profile popup is editable: the profile forms only render Save when the
   * form is not read-only, and a read-only profile disables every input.
   *
   * The Save-button and enabled-input counts both follow from the same read-only styling, so a
   * third check proves the form is genuinely usable: the mandate field the popup exists to collect
   * must actually accept a click. user-profile.scss sets `pointer-events: none` on read-only forms,
   * so an interactive Date of Birth is the one signal that cannot be satisfied by styling alone.
   */
  async verifyUserProfilePopupEditable(page) {
    if (!page) {
      throw new Error("[Profile.verifyUserProfilePopupEditable] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    const { saveButtons, editableInputs } = await profilePage.getDialogEditability("User profile");

    if (saveButtons < 1 || editableInputs < 1) {
      throw new Error(
        "[Profile.verifyUserProfilePopupEditable] The \"User profile\" popup is read-only " +
        `(visible Save buttons: ${saveButtons}, editable inputs: ${editableInputs}). ` +
        "A user who may edit this profile must be able to fill in and save the missing mandate fields, " +
        "otherwise they are stuck and cannot book.",
      );
    }

    if (!(await profilePage.isDateOfBirthInputInteractive())) {
      throw new Error(
        "[Profile.verifyUserProfilePopupEditable] The \"User profile\" popup renders a Save button and " +
        `${editableInputs} enabled input(s), but its Date of Birth field cannot receive a click — the form is ` +
        "blocking pointer events. The user cannot fill in the missing mandate field, so they are stuck and " +
        "cannot book, even though the popup looks editable.",
      );
    }

    logger.info(
      `[Profile.verifyUserProfilePopupEditable] Popup is editable (Save buttons: ${saveButtons}, editable inputs: ${editableInputs}, Date of Birth interactive)`,
    );
  },
  /**
   * Closes the editable "User profile" popup without saving, so the next traveller can be
   * selected. Deliberately does not save — the test asserts the field can be filled, not stored.
   */
  async closeUserProfilePopup(page) {
    if (!page) {
      throw new Error("[Profile.closeUserProfilePopup] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.closeDialogByTitle("User profile");
    logger.info("[Profile.closeUserProfilePopup] Closed the \"User profile\" popup without saving");
  },

  /**
   * Dismisses the read-only "Mandatory Details Are Missing" warning so the flow can continue.
   */
  async closeMandatoryDetailsWarning(page) {
    if (!page) {
      throw new Error("[Profile.closeMandatoryDetailsWarning] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    await profilePage.closeDialogByTitle("Mandatory Details Are Missing");
    logger.info("[Profile.closeMandatoryDetailsWarning] Closed the \"Mandatory Details Are Missing\" popup");
  },

  /**
   * Reads the warning popup's wording so a later step can compare it against another traveller's.
   * The two popups can only be compared inside one scenario, so the caller holds the text.
   *
   * @returns {Promise<string>} the popup body text, whitespace-normalised
   */
  async captureMandatoryDetailsWarningText(page) {
    if (!page) {
      throw new Error("[Profile.captureMandatoryDetailsWarningText] \"page\" is required.");
    }

    const profilePage = getPageObject(page, ProfilePage);
    const text = normaliseWarningText(await profilePage.getDialogBodyText(MANDATORY_DETAILS_DIALOG_TITLE));

    if (!text) {
      throw new Error(
        "[Profile.captureMandatoryDetailsWarningText] The \"Mandatory Details Are Missing\" popup body is empty, so " +
        "there is no wording to compare against. The dialog frame paints before its content mounts — if this " +
        "fires, the popup was read too early.",
      );
    }

    logger.info(`[Profile.captureMandatoryDetailsWarningText] Captured warning wording: "${text}"`);
    return text;
  },

  /**
   * Asserts the currently open warning popup reads exactly like a previously captured one.
   *
   * ADO 83279 requires the wording to be identical whether the incomplete profile is the booker's
   * own or another traveller's — a booker holding "Prevent updating others and own profile" must
   * not be able to tell the two cases apart, since they can act on neither.
   */
  async verifyMandatoryDetailsWarningTextMatches(page, expectedText) {
    if (!page) {
      throw new Error("[Profile.verifyMandatoryDetailsWarningTextMatches] \"page\" is required.");
    }
    if (!expectedText || typeof expectedText !== "string") {
      throw new Error(
        "[Profile.verifyMandatoryDetailsWarningTextMatches] \"expectedText\" must be a non-empty string, got: " +
        `${typeof expectedText} (${JSON.stringify(expectedText)}). Capture the first popup's wording before ` +
        "comparing against it.",
      );
    }

    const profilePage = getPageObject(page, ProfilePage);
    const actual = normaliseWarningText(await profilePage.getDialogBodyText(MANDATORY_DETAILS_DIALOG_TITLE));
    const expected = normaliseWarningText(expectedText);

    if (actual !== expected) {
      throw new Error(
        "[Profile.verifyMandatoryDetailsWarningTextMatches] The warning popup wording differs between my own " +
        "profile and another traveller, but a user who may update neither must see the same message for both.\n" +
        `  Remembered: "${expected}"\n` +
        `  Now shown:  "${actual}"`,
      );
    }

    logger.info("[Profile.verifyMandatoryDetailsWarningTextMatches] Warning wording is identical for both travellers");
  },
};

module.exports = Profile;
