const { faker } = require("@faker-js/faker");
const { getPageObject } = require("@utils/pageObjectCache");
const AdministrationPage = require("@src/pages/AdministrationPage");
const LoginPage = require("@src/pages/LoginPage");
const logger = require("@utils/logger").child("Administration");

/**
 * Administration DSL
 *
 * High-level actions for the external AngularJS administration portal.
 * The admin portal is a separate application that opens in a new browser tab.
 */
const Administration = {
  /**
   * Navigates to the administration portal by clicking the admin settings icon in the OBT side nav.
   * The admin opens in a new browser tab; returns the new page instance.
   *
   * @param {import('playwright').Page} page - The current OBT page (profile or main app page)
   * @returns {import('playwright').Page} The administration page
   */
  async navigateToAdministration(page) {
    if (!page) {
      throw new Error('[Administration.navigateToAdministration] "page" is required.');
    }

    logger.debug('[Administration.navigateToAdministration] Clicking admin settings icon in side nav');

    const context = page.context();
    if (!context) {
      throw new Error('[Administration.navigateToAdministration] Page context is null — cannot detect new tab.');
    }

    const adminPage = getPageObject(page, AdministrationPage);

    // Dismiss cookie consent banner if present — it can intercept pointer events
    const loginPage = getPageObject(page, LoginPage);
    await loginPage.acceptCookiesIfPresent(5000);

    const newPagePromise = context.waitForEvent('page', { timeout: 20000 }).catch(() => null);

    try {
      await adminPage.clickAdminSettingsIcon();
    } catch (err) {
      throw new Error(
        `[Administration.navigateToAdministration] Failed to click admin settings icon: ${err.message}`
      );
    }

    const newAdminTab = await newPagePromise;

    if (!newAdminTab) {
      throw new Error(
        `[Administration.navigateToAdministration] Administration did not open in a new tab after clicking the settings icon. ` +
        `Ensure the logged-in user has administration access (isAccessAdministration or isLimitedAdmin must be true).`
      );
    }

    logger.info('[Administration.navigateToAdministration] Administration portal opened in a new tab');

    const adminPageInNewTab = getPageObject(newAdminTab, AdministrationPage);
    await adminPageInNewTab.waitForAdminPageReady();

    // The admin portal opens on a separate host with its own CookieHub consent
    // banner that overlays the page and intercepts pointer events, blocking clicks
    // on the user search, tabs, and save buttons. Dismiss it once — CookieHub
    // persists the consent for the rest of the session, so it survives the tab
    // reload performed by the "switch to administration" step.
    const adminLoginPage = getPageObject(newAdminTab, LoginPage);
    await adminLoginPage.acceptCookiesIfPresent(6000);

    logger.info('[Administration.navigateToAdministration] Administration portal is ready');
    return newAdminTab;
  },

  /**
   * Verifies that a named administration section is visible in the admin left menu.
   * Throws with context if the section is not visible — e.g. the user's role does not grant it.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} sectionName - The section name (e.g. "Users", "Point of Interest")
   */
  async verifyAdminSectionVisible(adminPage, sectionName) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAdminSectionVisible] "adminPage" is required.');
    }
    if (!sectionName || typeof sectionName !== 'string') {
      throw new Error(
        `[Administration.verifyAdminSectionVisible] "sectionName" must be a non-empty string, got: ${typeof sectionName} (${JSON.stringify(sectionName)})`
      );
    }

    logger.debug(`[Administration.verifyAdminSectionVisible] Verifying admin section "${sectionName}" is visible`);

    const page = getPageObject(adminPage, AdministrationPage);
    const visible = await page.isAdminSectionVisible(sectionName);

    if (!visible) {
      throw new Error(
        `[Administration.verifyAdminSectionVisible] The administration section "${sectionName}" is not visible in ` +
        `the admin menu (selector [title='${sectionName}']). The logged-in user's role may not grant access to it.`
      );
    }

    logger.info(`[Administration.verifyAdminSectionVisible] Admin section "${sectionName}" is visible`);
  },

  /**
   * Verifies that exactly the expected number of administration sections are displayed in the admin
   * left menu. Used to assert a limited-admin role sees only its permitted sections and no more.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {number} expectedCount - The exact number of sections that should be visible
   */
  async verifyAdminSectionCount(adminPage, expectedCount) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAdminSectionCount] "adminPage" is required.');
    }
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[Administration.verifyAdminSectionCount] "expectedCount" must be a non-negative integer, got: ${typeof expectedCount} (${JSON.stringify(expectedCount)})`
      );
    }

    logger.debug(`[Administration.verifyAdminSectionCount] Verifying exactly ${expectedCount} admin sections are displayed`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actualCount = await page.countAdminSections();

    if (actualCount !== expectedCount) {
      throw new Error(
        `[Administration.verifyAdminSectionCount] Expected exactly ${expectedCount} administration section(s) to be ` +
        `displayed for this role, but found ${actualCount}. Either the role's permitted sections changed, or the ` +
        `section-menu selector (AdministrationPage.ADMIN_SECTION_MENU_ITEM) needs adjustment against the live admin DOM.`
      );
    }

    logger.info(`[Administration.verifyAdminSectionCount] Confirmed ${actualCount} admin sections displayed`);
  },

  /**
   * Searches for a user in the administration Users list and opens their record.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The user's full name to search for (e.g. "Brunina tist")
   */
  async searchUserInAdmin(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.searchUserInAdmin] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.searchUserInAdmin] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.searchUserInAdmin] Searching for user "${userName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickUsersTab();
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to click Users tab before searching for "${userName}": ${err.message}`
      );
    }

    try {
      await page.fillUserSearch(userName);
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to type "${userName}" into user search: ${err.message}`
      );
    }

    try {
      await page.clickFirstUserRowWithName(userName);
    } catch (err) {
      throw new Error(
        `[Administration.searchUserInAdmin] Failed to click user row for "${userName}": ${err.message}. ` +
        `The search may have returned no results — verify the user exists in the administration.`
      );
    }

    logger.info(`[Administration.searchUserInAdmin] User "${userName}" record opened`);
  },

  /**
   * Opens the Form of Payment tab inside the administration user view.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openFopTabInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFopTabInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.openFopTabInAdmin] Clicking Form of Payment tab in admin user view');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickFopTab();
    } catch (err) {
      throw new Error(
        `[Administration.openFopTabInAdmin] Failed to click Form of Payment tab in admin: ${err.message}. ` +
        `The user record must be open and have a Form of Payment tab.`
      );
    }

    logger.info('[Administration.openFopTabInAdmin] Form of Payment tab opened in administration');
  },

  /**
   * Opens the "Passports and Visas" tab in the administration user-detail view.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openPassportsAndVisasTabInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openPassportsAndVisasTabInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.openPassportsAndVisasTabInAdmin] Clicking Passports and Visas tab');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickPassportTab();
    } catch (err) {
      throw new Error(
        `[Administration.openPassportsAndVisasTabInAdmin] Failed to open the Passports and Visas tab: ` +
        `${err.message} The user record must be open in the administration user view first.`
      );
    }

    logger.info('[Administration.openPassportsAndVisasTabInAdmin] Passports and Visas tab opened');
  },

  /**
   * Verifies no passport is stored on the administration user's profile: the tab shows its
   * "Add Passport" empty-state form and lists no saved passport rows.
   *
   * @param {import('playwright').Page} adminPage - The administration page, on the Passports and Visas tab
   */
  async verifyPassportSectionEmpty(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyPassportSectionEmpty] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyPassportSectionEmpty] Verifying no passport is saved on the profile');

    const page = getPageObject(adminPage, AdministrationPage);
    const hasAddPassportHeader = await page.isFieldGroupHeaderVisible('Add Passport');

    if (!hasAddPassportHeader) {
      throw new Error(
        '[Administration.verifyPassportSectionEmpty] The "Add Passport" section header is not visible, ' +
        'so the Passports and Visas tab is not showing its empty-state form. Either the tab did not ' +
        'open (a "Proceed without saving" dialog may be blocking it) or a passport is already stored.'
      );
    }

    const savedPassportCount = await page.getSavedPassportRowCount();

    if (savedPassportCount !== 0) {
      throw new Error(
        `[Administration.verifyPassportSectionEmpty] Expected no saved passports on the profile but ` +
        `found ${savedPassportCount} passport row(s). Passport details entered in the trip must NOT be ` +
        `persisted to the administration for a user with the "prevent updating others and own profile" role.`
      );
    }

    logger.info('[Administration.verifyPassportSectionEmpty] No passport is stored on the administration profile');
  },

  /**
   * Opens the "Frequent flyer" tab in the administration user-detail view.
   * Dismisses the "Proceed without saving" confirm the admin raises when leaving a tab with
   * pending edits, then confirms the tab actually rendered before any assertion runs against it.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openFrequentFlyerTabInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFrequentFlyerTabInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.openFrequentFlyerTabInAdmin] Clicking Frequent flyer tab');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickFrequentFlyerTab();
      const dismissed = await page.dismissProceedWithoutSavingIfVisible();
      if (dismissed) {
        logger.info('[Administration.openFrequentFlyerTabInAdmin] Dismissed the "Proceed without saving" dialog');
      }
    } catch (err) {
      throw new Error(
        `[Administration.openFrequentFlyerTabInAdmin] Failed to open the Frequent flyer tab: ` +
        `${err.message} The user record must be open in the administration user view first.`
      );
    }

    const headerVisible = await page.isFieldGroupHeaderVisible('Frequent flyer / Membership number');

    if (!headerVisible) {
      throw new Error(
        '[Administration.openFrequentFlyerTabInAdmin] The "Frequent flyer / Membership number" section ' +
        'header did not appear, so the Frequent flyer tab is not loaded. Any absence assertion run now ' +
        'would be reading the previous tab and would pass for the wrong reason.'
      );
    }

    logger.info('[Administration.openFrequentFlyerTabInAdmin] Frequent flyer tab opened');
  },

  /**
   * Verifies a value entered during the trip was NOT persisted to the administration user profile.
   * Scrolls the user-detail form first so lazily rendered lower sections are included in the read.
   *
   * @param {import('playwright').Page} adminPage - The administration page, on the relevant user tab
   * @param {string} value - The value that must be absent (e.g. a frequent flyer or loyalty number)
   * @param {string} fieldLabel - Human-readable name of the field, used in the failure message
   */
  async verifyValueNotSavedInUserProfile(adminPage, value, fieldLabel) {
    if (!adminPage) {
      throw new Error('[Administration.verifyValueNotSavedInUserProfile] "adminPage" is required.');
    }
    if (!value || typeof value !== 'string') {
      throw new Error(
        `[Administration.verifyValueNotSavedInUserProfile] "value" must be a non-empty string, got: ` +
        `${typeof value} (${JSON.stringify(value)})`
      );
    }
    if (!fieldLabel || typeof fieldLabel !== 'string') {
      throw new Error(
        `[Administration.verifyValueNotSavedInUserProfile] "fieldLabel" must be a non-empty string, got: ` +
        `${typeof fieldLabel} (${JSON.stringify(fieldLabel)})`
      );
    }

    logger.debug('[Administration.verifyValueNotSavedInUserProfile] Verifying a trip value was not persisted', {
      value,
      fieldLabel,
    });

    const page = getPageObject(adminPage, AdministrationPage);
    const profileText = await page.getUserDetailVisibleText();

    if (profileText.includes(value)) {
      throw new Error(
        `[Administration.verifyValueNotSavedInUserProfile] "${fieldLabel}" value "${value}" WAS found on ` +
        `the administration user profile, but a user with the "prevent updating others and own profile" ` +
        `role must not have trip-entered details written back to the administration.`
      );
    }

    logger.info('[Administration.verifyValueNotSavedInUserProfile] Value is absent from the administration profile', {
      value,
      fieldLabel,
    });
  },

  /**
   * Opens the Travel Policies section in the administration portal.
   * If an unsaved-items dialog appears, it is dismissed before continuing.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openTravelPoliciesSection(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openTravelPoliciesSection] "adminPage" is required.');
    }

    logger.debug('[Administration.openTravelPoliciesSection] Opening Travel Policies section in admin portal');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickTravelPoliciesTab();
    } catch (err) {
      throw new Error(
        `[Administration.openTravelPoliciesSection] Failed to click the Travel Policies tab: ${err.message}`
      );
    }

    try {
      await page.dismissUnsavedItemsDialogIfPresent();
    } catch (err) {
      throw new Error(
        `[Administration.openTravelPoliciesSection] Travel Policies tab opened, but the unsaved-items dialog could not be dismissed: ${err.message}`
      );
    }

    logger.info('[Administration.openTravelPoliciesSection] Travel Policies section opened');
  },

  /**
   * Searches for and opens a travel policy by name.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} policyName - The policy name to search for
   */
  async searchTravelPolicy(adminPage, policyName) {
    if (!adminPage) {
      throw new Error('[Administration.searchTravelPolicy] "adminPage" is required.');
    }
    if (!policyName || typeof policyName !== 'string') {
      throw new Error(
        `[Administration.searchTravelPolicy] "policyName" must be a non-empty string, got: ${typeof policyName} (${JSON.stringify(policyName)})`
      );
    }

    logger.debug(`[Administration.searchTravelPolicy] Searching for travel policy "${policyName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillTravelPolicySearch(policyName);
    } catch (err) {
      throw new Error(
        `[Administration.searchTravelPolicy] Failed to search for travel policy "${policyName}": ${err.message}`
      );
    }

    try {
      await page.clickFirstTravelPolicyItem(policyName);
    } catch (err) {
      throw new Error(
        `[Administration.searchTravelPolicy] Failed to open travel policy "${policyName}" from the search results: ${err.message}. ` +
        `The search may have returned no policy rows.`
      );
    }

    logger.info(`[Administration.searchTravelPolicy] Travel policy "${policyName}" opened`);
  },

  /**
   * Opens the first travel policy rule in the currently selected policy.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openFirstTravelPolicyRule(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFirstTravelPolicyRule] "adminPage" is required.');
    }

    logger.debug('[Administration.openFirstTravelPolicyRule] Opening the first travel policy rule');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickFirstTravelPolicyRule();
    } catch (err) {
      throw new Error(
        `[Administration.openFirstTravelPolicyRule] Failed to open the first travel policy rule: ${err.message}`
      );
    }

    logger.info('[Administration.openFirstTravelPolicyRule] First travel policy rule opened');
  },

  /**
   * Verifies the flight direction dropdown contains the expected options.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string[]} expectedOptions - The options that must be present
   */
  async verifyFlightDirectionDropdownOptions(adminPage, expectedOptions) {
    if (!adminPage) {
      throw new Error('[Administration.verifyFlightDirectionDropdownOptions] "adminPage" is required.');
    }
    if (!Array.isArray(expectedOptions)) {
      throw new Error(
        `[Administration.verifyFlightDirectionDropdownOptions] "expectedOptions" must be an array, got: ${typeof expectedOptions} (${JSON.stringify(expectedOptions)})`
      );
    }
    if (expectedOptions.length === 0) {
      throw new Error('[Administration.verifyFlightDirectionDropdownOptions] "expectedOptions" must not be empty.');
    }

    logger.debug('[Administration.verifyFlightDirectionDropdownOptions] Verifying flight direction dropdown options', { expectedOptions });

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      return await page.verifyFlightDirectionDropdownOptions(expectedOptions);
    } catch (err) {
      throw new Error(
        `[Administration.verifyFlightDirectionDropdownOptions] Failed to verify flight direction dropdown options: ${err.message}`
      );
    }
  },

  /**
   * Verifies the expiry month and year of a credit card in the administration FOP view.
   * Clicks on the card row to open its edit form, then reads the Select2 dropdown values.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {{ cardName: string, month: string, year: string }} options
   */
  async verifyCcExpiryInAdmin(adminPage, { cardName, month, year } = {}) {
    if (!adminPage) {
      throw new Error('[Administration.verifyCcExpiryInAdmin] "adminPage" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }
    if (!month || typeof month !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "month" must be a non-empty string (e.g. "2" or "02"), got: ${typeof month} (${JSON.stringify(month)})`
      );
    }
    if (!year || typeof year !== 'string') {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] "year" must be a non-empty string (e.g. "2032"), got: ${typeof year} (${JSON.stringify(year)})`
      );
    }

    logger.debug(`[Administration.verifyCcExpiryInAdmin] Verifying card "${cardName}" shows expiry ${month}/${year}`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickCreditCardRow(cardName);
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not open card edit form for "${cardName}": ${err.message}`
      );
    }

    let actualMonth;
    try {
      actualMonth = await page.getExpiryMonth();
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not read expiry month for card "${cardName}": ${err.message}`
      );
    }

    let actualYear;
    try {
      actualYear = await page.getExpiryYear();
    } catch (err) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Could not read expiry year for card "${cardName}": ${err.message}`
      );
    }

    // The admin displays month as a number without leading zero (e.g. "2" not "02")
    const normalizedExpectedMonth = String(parseInt(month, 10));

    if (actualMonth !== normalizedExpectedMonth) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry month mismatch. ` +
        `Expected "${normalizedExpectedMonth}" (from input "${month}") but admin shows "${actualMonth}". ` +
        `This means the month set in the profile did not synchronise to administration correctly.`
      );
    }

    if (actualYear !== year) {
      throw new Error(
        `[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry year mismatch. ` +
        `Expected "${year}" but admin shows "${actualYear}". ` +
        `This means the year set in the profile did not synchronise to administration correctly.`
      );
    }

    logger.info(`[Administration.verifyCcExpiryInAdmin] Card "${cardName}" expiry verified: ${actualMonth}/${actualYear}`);
    return { actualMonth, actualYear };
  },

  /**
   * Deletes a credit card from the administration FOP view.
   * Clicks the delete image for the card and confirms the dialog.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} cardName - The display name of the card to delete
   */
  async deleteCcFromAdmin(adminPage, cardName) {
    if (!adminPage) {
      throw new Error('[Administration.deleteCcFromAdmin] "adminPage" is required.');
    }
    if (!cardName || typeof cardName !== 'string') {
      throw new Error(
        `[Administration.deleteCcFromAdmin] "cardName" must be a non-empty string, got: ${typeof cardName} (${JSON.stringify(cardName)})`
      );
    }

    logger.debug(`[Administration.deleteCcFromAdmin] Deleting card "${cardName}" from administration`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickDeleteImageForCard(cardName);
    } catch (err) {
      throw new Error(
        `[Administration.deleteCcFromAdmin] Could not click delete image for card "${cardName}": ${err.message}`
      );
    }

    try {
      await page.confirmDeleteDialog();
    } catch (err) {
      throw new Error(
        `[Administration.deleteCcFromAdmin] Delete dialog did not appear or confirmation failed for card "${cardName}": ${err.message}`
      );
    }

    logger.info(`[Administration.deleteCcFromAdmin] Card "${cardName}" deleted from administration`);
  },

  /**
   * Searches for a user in the administration, opens their record, navigates to the
   * Contact Information tab, clears all mobile phone inputs, and saves the changes.
   * Used to set up a test scenario where mandatory mobile field is empty.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - Full name of the user to search for (e.g. "mendy tori")
   */
  async clearUserMobileInAdmin(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.clearUserMobileInAdmin] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.clearUserMobileInAdmin] Clearing mobile for user "${userName}"`);

    await Administration.searchUserInAdmin(adminPage, userName);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickContactInfoTab();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to open Contact Information tab for user "${userName}": ${err.message}`
      );
    }

    try {
      await page.clearMobileInputsInAdmin();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to clear mobile inputs for user "${userName}": ${err.message}`
      );
    }

    try {
      await page.saveContactInfoInAdmin();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserMobileInAdmin] Failed to save after clearing mobile for user "${userName}": ${err.message}`
      );
    }

    logger.info(`[Administration.clearUserMobileInAdmin] Mobile field cleared and saved for user "${userName}"`);
  },

  /**
   * Verifies the mobile phone values shown in the administration Contact Information tab.
   * Assumes the user record is already open (e.g. after searchUserInAdmin).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {{ countryCode: string, areaCode: string, number: string }} options
   */
  async verifyMobileInAdmin(adminPage, { countryCode, areaCode, number } = {}) {
    if (!adminPage) {
      throw new Error('[Administration.verifyMobileInAdmin] "adminPage" is required.');
    }
    if (!countryCode || typeof countryCode !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "countryCode" must be a non-empty string, got: ${typeof countryCode} (${JSON.stringify(countryCode)})`
      );
    }
    if (!areaCode || typeof areaCode !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "areaCode" must be a non-empty string, got: ${typeof areaCode} (${JSON.stringify(areaCode)})`
      );
    }
    if (!number || typeof number !== 'string') {
      throw new Error(
        `[Administration.verifyMobileInAdmin] "number" must be a non-empty string, got: ${typeof number} (${JSON.stringify(number)})`
      );
    }

    logger.debug(`[Administration.verifyMobileInAdmin] Verifying mobile ${countryCode}-${areaCode}-${number} in administration`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickContactInfoTab();
    } catch (err) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Failed to open Contact Information tab: ${err.message}`
      );
    }

    let actual;
    try {
      actual = await page.getAdminMobileValues();
    } catch (err) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Failed to read mobile values from admin: ${err.message}`
      );
    }

    if (actual.countryCode !== countryCode) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile country code mismatch. ` +
        `Expected "${countryCode}" but admin shows "${actual.countryCode}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }
    if (actual.areaCode !== areaCode) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile area code mismatch. ` +
        `Expected "${areaCode}" but admin shows "${actual.areaCode}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }
    if (actual.number !== number) {
      throw new Error(
        `[Administration.verifyMobileInAdmin] Mobile number mismatch. ` +
        `Expected "${number}" but admin shows "${actual.number}". ` +
        `The value entered in the profile popup may not have synced to administration.`
      );
    }

    logger.info(`[Administration.verifyMobileInAdmin] Mobile verified in admin: ${actual.countryCode}-${actual.areaCode}-${actual.number}`);
    return actual;
  },

  /**
   * Clicks the "Add new user" button in the administration Users list.
   * Proves a limited-admin role is permitted to add corporate users.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async clickAddNewUser(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.clickAddNewUser] "adminPage" is required.');
    }

    logger.debug('[Administration.clickAddNewUser] Clicking the Add new user button');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAddNewUser();
    } catch (err) {
      throw new Error(
        `[Administration.clickAddNewUser] Failed to click the Add new user button: ${err.message}`
      );
    }

    logger.info('[Administration.clickAddNewUser] Add new user popup opened');
  },

  /**
   * Verifies the new corporate user form's first field displays the expected label
   * (e.g. "First Name:"), confirming the add-user form rendered for a limited admin.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedLabel - The expected field label (e.g. "First Name:")
   */
  async verifyNewUserFormField(adminPage, expectedLabel) {
    if (!adminPage) {
      throw new Error('[Administration.verifyNewUserFormField] "adminPage" is required.');
    }
    if (!expectedLabel || typeof expectedLabel !== 'string') {
      throw new Error(
        `[Administration.verifyNewUserFormField] "expectedLabel" must be a non-empty string, got: ${typeof expectedLabel} (${JSON.stringify(expectedLabel)})`
      );
    }

    logger.debug(`[Administration.verifyNewUserFormField] Verifying new user form shows label "${expectedLabel}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actualLabel = await page.getNewUserFormFirstFieldLabel();

    if (!actualLabel.includes(expectedLabel)) {
      throw new Error(
        `[Administration.verifyNewUserFormField] New corporate user form field label mismatch. ` +
        `Expected to contain "${expectedLabel}" but found "${actualLabel}". ` +
        `The add-new-user form may not have rendered or its layout changed.`
      );
    }

    logger.info(`[Administration.verifyNewUserFormField] New user form displays label "${actualLabel}"`);
  },

  /**
   * Closes the add-new-user popup to return to the Users list.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async closeAddNewUserPopup(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.closeAddNewUserPopup] "adminPage" is required.');
    }

    logger.debug('[Administration.closeAddNewUserPopup] Closing the add-new-user popup');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.closeAddNewUserPopup();
    } catch (err) {
      throw new Error(
        `[Administration.closeAddNewUserPopup] Failed to close the add-new-user popup: ${err.message}`
      );
    }

    logger.info('[Administration.closeAddNewUserPopup] Add-new-user popup closed');
  },

  /**
   * Fills the first mandatory dynamic user question with a generated random value so the record
   * can be saved. The value is generated in code (never hardcoded) to keep runs repeatable, and
   * the field is located dynamically (first mandatory question) rather than by a fixed question id.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @returns {Promise<string>} The random value that was entered
   */
  async fillFirstMandatoryUserFieldWithRandomValue(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.fillFirstMandatoryUserFieldWithRandomValue] "adminPage" is required.');
    }

    // Generate an 8-character alphanumeric value in code (Testim random-value-generator equivalent)
    const randomValue = faker.string.alphanumeric(8);

    logger.debug(`[Administration.fillFirstMandatoryUserFieldWithRandomValue] Filling first mandatory question with "${randomValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillFirstMandatoryUserField(randomValue);
    } catch (err) {
      throw new Error(
        `[Administration.fillFirstMandatoryUserFieldWithRandomValue] Failed to fill the first mandatory user field: ${err.message}`
      );
    }

    logger.info(`[Administration.fillFirstMandatoryUserFieldWithRandomValue] First mandatory user field filled with random value`);
    return randomValue;
  },

  /**
   * Clicks Save on the currently open user record.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async saveUserRecordInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.saveUserRecordInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.saveUserRecordInAdmin] Saving the user record');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickSaveUserRecord();
    } catch (err) {
      throw new Error(
        `[Administration.saveUserRecordInAdmin] Failed to save the user record: ${err.message}`
      );
    }

    logger.info('[Administration.saveUserRecordInAdmin] User record saved');
  },

  /**
   * Verifies the expected confirmation toast (e.g. "Save succeeded") is displayed.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedText - The expected toast title text
   */
  async verifyAdminToast(adminPage, expectedText) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAdminToast] "adminPage" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Administration.verifyAdminToast] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    logger.debug(`[Administration.verifyAdminToast] Verifying toast "${expectedText}" is displayed`);

    const page = getPageObject(adminPage, AdministrationPage);

    // Poll (do not read once): the result toast arrives ~0.5s after the action and can briefly coexist
    // with a lingering earlier toast, so a single immediate read races that window and can grab the
    // stale toast. waitForAdminToast throws a context-rich error (listing the toasts it saw) on timeout.
    let actualText;
    try {
      actualText = await page.waitForAdminToast(expectedText);
    } catch (err) {
      throw new Error(
        `[Administration.verifyAdminToast] Confirmation toast mismatch. ` +
        `Expected a toast containing "${expectedText}". ${err.message}`
      );
    }

    logger.info(`[Administration.verifyAdminToast] Toast "${actualText}" displayed`);
  },

  /**
   * Verifies the expected filter chip (e.g. "Active") is visible in the admin user search bar.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedFilter - The expected filter chip text (e.g. "Active")
   */
  async verifyAdminSearchBarFilter(adminPage, expectedFilter) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAdminSearchBarFilter] "adminPage" is required.');
    }
    if (!expectedFilter || typeof expectedFilter !== 'string') {
      throw new Error(
        `[Administration.verifyAdminSearchBarFilter] "expectedFilter" must be a non-empty string, got: ${typeof expectedFilter} (${JSON.stringify(expectedFilter)})`
      );
    }

    logger.debug(`[Administration.verifyAdminSearchBarFilter] Verifying search-bar filter "${expectedFilter}" is visible`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actualFilter = await page.getSearchBarFilterText();

    if (!actualFilter.includes(expectedFilter)) {
      throw new Error(
        `[Administration.verifyAdminSearchBarFilter] Admin search-bar filter mismatch. ` +
        `Expected to contain "${expectedFilter}" but found "${actualFilter}".`
      );
    }

    logger.info(`[Administration.verifyAdminSearchBarFilter] Search-bar filter "${actualFilter}" is visible`);
  },

  /**
   * Clears the user search box so the Users list returns to its default (active-only) view.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async clearUserSearchInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.clearUserSearchInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.clearUserSearchInAdmin] Clearing the user search box');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clearUserSearch();
    } catch (err) {
      throw new Error(
        `[Administration.clearUserSearchInAdmin] Failed to clear the user search box: ${err.message}`
      );
    }

    logger.info('[Administration.clearUserSearchInAdmin] User search box cleared');
  },

  /**
   * Verifies the "Inactive" users filter checkbox is unchecked (default state).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyInactiveUsersFilterUnchecked(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyInactiveUsersFilterUnchecked] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyInactiveUsersFilterUnchecked] Verifying the Inactive filter is unchecked');

    const page = getPageObject(adminPage, AdministrationPage);
    const checked = await page.isInactiveFilterChecked();

    if (checked) {
      throw new Error(
        `[Administration.verifyInactiveUsersFilterUnchecked] The "Inactive" users filter is checked, but it should be ` +
        `unchecked by default so only active users are listed.`
      );
    }

    logger.info('[Administration.verifyInactiveUsersFilterUnchecked] Inactive users filter is unchecked');
  },

  /**
   * Verifies the "Active" users filter checkbox is checked (default state).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyActiveUsersFilterChecked(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyActiveUsersFilterChecked] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyActiveUsersFilterChecked] Verifying the Active filter is checked');

    const page = getPageObject(adminPage, AdministrationPage);
    const checked = await page.isActiveFilterChecked();

    if (!checked) {
      throw new Error(
        `[Administration.verifyActiveUsersFilterChecked] The "Active" users filter is unchecked, but it should be ` +
        `checked by default so active users are listed.`
      );
    }

    logger.info('[Administration.verifyActiveUsersFilterChecked] Active users filter is checked');
  },

  /**
   * Verifies only active users are listed — every user row's status column reads "Active".
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyOnlyActiveUsersListed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyOnlyActiveUsersListed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyOnlyActiveUsersListed] Verifying only active users are listed');

    const page = getPageObject(adminPage, AdministrationPage);
    const statuses = await page.getUserRowStatuses();

    if (statuses.length === 0) {
      throw new Error(
        `[Administration.verifyOnlyActiveUsersListed] No user rows were found in the corporate-users list, ` +
        `so the active-only filter could not be confirmed. The list may not have rendered after clearing the search.`
      );
    }

    // The status cell also carries a trailing action label (e.g. "Active Deleted" — "Deleted" is a
    // row action, not a status), so match the leading status token rather than the whole cell. A
    // first-token check also avoids the substring trap where "Inactive" contains the letters "active".
    const statusToken = (s) => s.trim().toLowerCase().split(/\s+/)[0];
    const nonActive = statuses.filter((s) => statusToken(s) !== 'active');
    if (nonActive.length > 0) {
      throw new Error(
        `[Administration.verifyOnlyActiveUsersListed] Expected only "Active" users to be listed, but ${nonActive.length} ` +
        `of ${statuses.length} rows had a non-active status: ${JSON.stringify(nonActive)}. ` +
        `The default active-users filter may not be applied.`
      );
    }

    logger.info(`[Administration.verifyOnlyActiveUsersListed] All ${statuses.length} listed users are active`);
  },

  // --- Per Diem removal flow (test 18418) ---

  /**
   * Opens the Users tab/list in the administration portal.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openUsersTab(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openUsersTab] "adminPage" is required.');
    }

    logger.debug('[Administration.openUsersTab] Opening the Users tab in administration');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickUsersTab();
    } catch (err) {
      throw new Error(
        `[Administration.openUsersTab] Failed to open the Users tab in administration: ${err.message}`
      );
    }

    logger.info('[Administration.openUsersTab] Users tab opened');
  },

  /**
   * Verifies the administration users list (datatable) is displayed.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyUsersListDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyUsersListDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyUsersListDisplayed] Verifying the users list is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const displayed = await page.isUsersListDisplayed();

    if (!displayed) {
      throw new Error(
        `[Administration.verifyUsersListDisplayed] The administration users list is not displayed. ` +
        `The Users tab may not be open or the datatable did not render.`
      );
    }

    logger.info('[Administration.verifyUsersListDisplayed] Administration users list is displayed');
  },

  /**
   * Opens the first user in the administration users list.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openFirstUserInAdmin(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFirstUserInAdmin] "adminPage" is required.');
    }

    logger.debug('[Administration.openFirstUserInAdmin] Opening the first user in the administration users list');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickFirstUserRow();
    } catch (err) {
      throw new Error(
        `[Administration.openFirstUserInAdmin] Failed to open the first user in the administration users list: ${err.message}`
      );
    }

    logger.info('[Administration.openFirstUserInAdmin] First user record opened');
  },

  /**
   * Verifies the administration user detail form is shown (its first field reads "First Name:").
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyUserDetailFormDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyUserDetailFormDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyUserDetailFormDisplayed] Verifying the user detail form is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const label = await page.getUserDetailFirstFieldLabel();

    if (!label.includes('First Name')) {
      throw new Error(
        `[Administration.verifyUserDetailFormDisplayed] User detail form first field label mismatch. ` +
        `Expected to contain "First Name" but found "${label}". ` +
        `The user record may not have opened.`
      );
    }

    logger.info(`[Administration.verifyUserDetailFormDisplayed] User detail form displayed ("${label}")`);
  },

  /**
   * Verifies the Per Diem section is displayed on the user detail form.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyPerDiemSectionDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyPerDiemSectionDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyPerDiemSectionDisplayed] Verifying the Per Diem section is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const header = await page.getPerDiemSectionHeaderText();

    if (!header.includes('Per Diem')) {
      throw new Error(
        `[Administration.verifyPerDiemSectionDisplayed] Per Diem section header mismatch. ` +
        `Expected to contain "Per Diem" but found "${header}". ` +
        `The user detail form may not expose a Per Diem section.`
      );
    }

    logger.info(`[Administration.verifyPerDiemSectionDisplayed] Per Diem section displayed ("${header}")`);
  },

  /**
   * Sets a user-level per diem: switches off inheritance if needed, opens the per-diem select2, and
   * picks the option matching the given value.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} perDiemValue - The per diem option to select (e.g. "per diem for user")
   */
  async setPerDiemSetting(adminPage, perDiemValue) {
    if (!adminPage) {
      throw new Error('[Administration.setPerDiemSetting] "adminPage" is required.');
    }
    if (!perDiemValue || typeof perDiemValue !== 'string') {
      throw new Error(
        `[Administration.setPerDiemSetting] "perDiemValue" must be a non-empty string, got: ${typeof perDiemValue} (${JSON.stringify(perDiemValue)})`
      );
    }

    logger.debug(`[Administration.setPerDiemSetting] Setting user-level per diem to "${perDiemValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.ensureUserLevelPerDiemEnabled();
    } catch (err) {
      throw new Error(
        `[Administration.setPerDiemSetting] Failed to switch the per diem to user level before selecting "${perDiemValue}": ${err.message}`
      );
    }

    try {
      await page.openPerDiemSelect2();
    } catch (err) {
      throw new Error(
        `[Administration.setPerDiemSetting] Failed to open the per diem select2 dropdown: ${err.message}`
      );
    }

    try {
      await page.selectPerDiemOption(perDiemValue);
    } catch (err) {
      throw new Error(
        `[Administration.setPerDiemSetting] Failed to select per diem option "${perDiemValue}": ${err.message}`
      );
    }

    logger.info(`[Administration.setPerDiemSetting] User-level per diem set to "${perDiemValue}"`);
  },

  /**
   * Verifies the per diem setting currently displayed equals the expected value. Reads the user-level
   * select2 chosen value when set, or the inherited group hint when the per diem was removed.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedValue - The per diem value expected to be shown
   */
  async verifyPerDiemSettingShows(adminPage, expectedValue) {
    if (!adminPage) {
      throw new Error('[Administration.verifyPerDiemSettingShows] "adminPage" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Administration.verifyPerDiemSettingShows] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Administration.verifyPerDiemSettingShows] Verifying per diem shows "${expectedValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getDisplayedPerDiemValue();

    // Exact match (whitespace-normalised): "per diem for user" and "per diem for user group" are
    // distinct entities, and a substring check would let one satisfy the other — masking whether the
    // user-level per diem was actually set vs the group value being inherited.
    const normalize = (s) => s.replace(/\s+/g, ' ').trim();
    if (normalize(actual) !== normalize(expectedValue)) {
      throw new Error(
        `[Administration.verifyPerDiemSettingShows] Per diem value mismatch. ` +
        `Expected exactly "${expectedValue}" but the form shows "${actual}". ` +
        `The per diem may not have been set or removed as expected.`
      );
    }

    logger.info(`[Administration.verifyPerDiemSettingShows] Per diem shows "${actual}"`);
  },

  /**
   * Reopens a user by the name held in the users-list row's 5th cell.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The user display name to match in the row's 5th cell
   */
  async reopenUserByName(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.reopenUserByName] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.reopenUserByName] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.reopenUserByName] Reopening user "${userName}" from the users list`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.reopenUserByFifthCell(userName);
    } catch (err) {
      throw new Error(
        `[Administration.reopenUserByName] Failed to reopen user "${userName}" from the administration users list: ${err.message}`
      );
    }

    logger.info(`[Administration.reopenUserByName] User "${userName}" reopened`);
  },

  // --- Roles admin section (test 40136) ---

  /**
   * Opens the Roles section in the administration and waits for the roles list to render.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openRolesSection(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openRolesSection] "adminPage" is required.');
    }

    logger.debug('[Administration.openRolesSection] Opening the Roles section in administration');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAdminSectionByTitle('Roles');
      await page.waitForRolesListReady();
    } catch (err) {
      throw new Error(
        `[Administration.openRolesSection] Failed to open the Roles section in administration: ${err.message}`
      );
    }

    logger.info('[Administration.openRolesSection] Roles section opened');
  },

  /**
   * Clicks "Add new role" to open the role edit form.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async addNewRole(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.addNewRole] "adminPage" is required.');
    }

    logger.debug('[Administration.addNewRole] Clicking Add new role');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAddNewRole();
    } catch (err) {
      throw new Error(
        `[Administration.addNewRole] Failed to open the new role form: ${err.message}`
      );
    }

    logger.info('[Administration.addNewRole] New role form opened');
  },

  /**
   * Generates a unique role name in code (never hardcoded) and types it into the role name input.
   * Returns the generated name so the caller can store it for later search/verification.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @returns {Promise<string>} The generated role name
   */
  async enterRandomRoleName(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.enterRandomRoleName] "adminPage" is required.');
    }

    const roleName = `role-${faker.string.alphanumeric(6)}`;

    logger.debug(`[Administration.enterRandomRoleName] Entering random role name "${roleName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillRoleName(roleName);
    } catch (err) {
      throw new Error(
        `[Administration.enterRandomRoleName] Failed to enter random role name "${roleName}": ${err.message}`
      );
    }

    logger.info(`[Administration.enterRandomRoleName] Random role name "${roleName}" entered`);
    return roleName;
  },

  /**
   * Selects all privileges for the role in the privilege dual-list.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async selectAllRolePrivileges(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.selectAllRolePrivileges] "adminPage" is required.');
    }

    logger.debug('[Administration.selectAllRolePrivileges] Selecting all privileges for the role');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.selectAllRolePrivileges();
    } catch (err) {
      throw new Error(
        `[Administration.selectAllRolePrivileges] Failed to select all privileges for the role: ${err.message}`
      );
    }

    logger.info('[Administration.selectAllRolePrivileges] All privileges selected for the role');
  },

  /**
   * Adds a user to the role via the users dual-list.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The user name to filter and add to the role
   */
  async addUserToRole(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.addUserToRole] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.addUserToRole] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.addUserToRole] Adding user "${userName}" to the role`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.addUserToRole(userName);
    } catch (err) {
      throw new Error(
        `[Administration.addUserToRole] Failed to add user "${userName}" to the role: ${err.message}`
      );
    }

    logger.info(`[Administration.addUserToRole] User "${userName}" added to the role`);
  },

  /**
   * Saves the role edit form.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async saveRole(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.saveRole] "adminPage" is required.');
    }

    logger.debug('[Administration.saveRole] Saving the role');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickSaveRole();
    } catch (err) {
      throw new Error(
        `[Administration.saveRole] Failed to save the role: ${err.message}`
      );
    }

    logger.info('[Administration.saveRole] Role saved');
  },

  /**
   * Searches the roles list for the given role name so the created role can be located.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} roleName - The role name to search for (the stored generated name)
   */
  async searchCreatedRole(adminPage, roleName) {
    if (!adminPage) {
      throw new Error('[Administration.searchCreatedRole] "adminPage" is required.');
    }
    if (!roleName || typeof roleName !== 'string') {
      throw new Error(
        `[Administration.searchCreatedRole] "roleName" must be a non-empty string, got: ${typeof roleName} (${JSON.stringify(roleName)}). ` +
        `Ensure the "I enter a random role name" step stored the name before searching.`
      );
    }

    logger.debug(`[Administration.searchCreatedRole] Searching for created role "${roleName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillRoleSearch(roleName);
    } catch (err) {
      throw new Error(
        `[Administration.searchCreatedRole] Failed to search for created role "${roleName}": ${err.message}`
      );
    }

    logger.info(`[Administration.searchCreatedRole] Searched for created role "${roleName}"`);
  },

  /**
   * Verifies the first role in the filtered list matches the expected (created) role name.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedRoleName - The role name expected to be listed
   */
  async verifyCreatedRoleListed(adminPage, expectedRoleName) {
    if (!adminPage) {
      throw new Error('[Administration.verifyCreatedRoleListed] "adminPage" is required.');
    }
    if (!expectedRoleName || typeof expectedRoleName !== 'string') {
      throw new Error(
        `[Administration.verifyCreatedRoleListed] "expectedRoleName" must be a non-empty string, got: ${typeof expectedRoleName} (${JSON.stringify(expectedRoleName)}). ` +
        `Ensure the "I enter a random role name" step stored the name before verifying.`
      );
    }

    logger.debug(`[Administration.verifyCreatedRoleListed] Verifying created role "${expectedRoleName}" is listed`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getFirstRoleRowName();

    if (actual !== expectedRoleName) {
      throw new Error(
        `[Administration.verifyCreatedRoleListed] Created role not listed as expected. ` +
        `Expected the first role row to read "${expectedRoleName}" but it read "${actual}". ` +
        `The role may not have been saved, or the search did not narrow the list to the created role.`
      );
    }

    logger.info(`[Administration.verifyCreatedRoleListed] Created role "${actual}" is listed`);
  },

  /**
   * Verifies the delete-role button is visible for the selected role.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyDeleteRoleButtonVisible(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyDeleteRoleButtonVisible] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyDeleteRoleButtonVisible] Verifying the delete-role button is visible');

    const page = getPageObject(adminPage, AdministrationPage);
    const visible = await page.isDeleteRoleBtnVisible();

    if (!visible) {
      throw new Error(
        `[Administration.verifyDeleteRoleButtonVisible] The delete-role button is not visible for the selected role. ` +
        `The created role may not be selected in the list.`
      );
    }

    logger.info('[Administration.verifyDeleteRoleButtonVisible] Delete-role button is visible');
  },

  /**
   * Clicks the delete-role button to open the deletion confirmation dialog.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async clickDeleteRole(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.clickDeleteRole] "adminPage" is required.');
    }

    logger.debug('[Administration.clickDeleteRole] Clicking the delete-role button');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickDeleteRoleBtn();
    } catch (err) {
      throw new Error(
        `[Administration.clickDeleteRole] Failed to click the delete-role button: ${err.message}`
      );
    }

    logger.info('[Administration.clickDeleteRole] Delete-role button clicked');
  },

  /**
   * Verifies the delete-role confirmation dialog is displayed (its title reads "Delete Role").
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyDeleteRoleDialogDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyDeleteRoleDialogDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyDeleteRoleDialogDisplayed] Verifying the delete-role dialog is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const title = await page.getDeleteRoleDialogTitle();

    if (!title.includes('Delete Role')) {
      throw new Error(
        `[Administration.verifyDeleteRoleDialogDisplayed] Delete-role dialog title mismatch. ` +
        `Expected to contain "Delete Role" but found "${title}". ` +
        `The confirmation dialog may not have opened.`
      );
    }

    logger.info(`[Administration.verifyDeleteRoleDialogDisplayed] Delete-role dialog displayed ("${title}")`);
  },

  /**
   * Confirms role deletion by accepting the confirmation dialog.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async confirmRoleDeletion(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.confirmRoleDeletion] "adminPage" is required.');
    }

    logger.debug('[Administration.confirmRoleDeletion] Confirming role deletion');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.confirmRoleDeletion();
    } catch (err) {
      throw new Error(
        `[Administration.confirmRoleDeletion] Failed to confirm role deletion: ${err.message}`
      );
    }

    logger.info('[Administration.confirmRoleDeletion] Role deletion confirmed');
  },

  // --- Per Diem Settings admin section (test 40136) ---

  /**
   * Opens the Per Diem Settings section in the administration.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openPerDiemSettingsSection(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openPerDiemSettingsSection] "adminPage" is required.');
    }

    logger.debug('[Administration.openPerDiemSettingsSection] Opening the Per Diem Settings section');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAdminSectionByTitle('Per Diem Settings');
      // Part A leaves the role edit form with unsaved changes (the blocked deletion), so navigating
      // away raises the "unsaved items" navigation guard. Confirm it to proceed, otherwise the detail
      // panel keeps showing the role's "Users" group instead of the per diem. No-op when absent.
      await page.dismissUnsavedItemsDialogIfPresent();
    } catch (err) {
      throw new Error(
        `[Administration.openPerDiemSettingsSection] Failed to open the Per Diem Settings section: ${err.message}`
      );
    }

    logger.info('[Administration.openPerDiemSettingsSection] Per Diem Settings section opened');
  },

  /**
   * Opens a specific per diem by its name (title attribute).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} perDiemName - The per diem name to open
   */
  async openNamedPerDiem(adminPage, perDiemName) {
    if (!adminPage) {
      throw new Error('[Administration.openNamedPerDiem] "adminPage" is required.');
    }
    if (!perDiemName || typeof perDiemName !== 'string') {
      throw new Error(
        `[Administration.openNamedPerDiem] "perDiemName" must be a non-empty string, got: ${typeof perDiemName} (${JSON.stringify(perDiemName)})`
      );
    }

    logger.debug(`[Administration.openNamedPerDiem] Opening per diem "${perDiemName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAdminSectionByTitle(perDiemName);
    } catch (err) {
      throw new Error(
        `[Administration.openNamedPerDiem] Failed to open per diem "${perDiemName}": ${err.message}. ` +
        `The per diem fixture may not exist in this environment.`
      );
    }

    logger.info(`[Administration.openNamedPerDiem] Per diem "${perDiemName}" opened`);
  },

  /**
   * Verifies the per diem detail panel opened by asserting its general-information header.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyPerDiemGeneralInfoDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyPerDiemGeneralInfoDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyPerDiemGeneralInfoDisplayed] Verifying per diem general information is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const header = await page.getPerDiemGeneralInfoHeader();

    if (!header.includes('General information')) {
      throw new Error(
        `[Administration.verifyPerDiemGeneralInfoDisplayed] Per diem general-information header mismatch. ` +
        `Expected to contain "General information" but found "${header}". ` +
        `The per diem detail panel may not have opened.`
      );
    }

    logger.info(`[Administration.verifyPerDiemGeneralInfoDisplayed] Per diem general information displayed ("${header}")`);
  },

  /**
   * Adds a new destination row to the per diem.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async addPerDiemDestination(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.addPerDiemDestination] "adminPage" is required.');
    }

    logger.debug('[Administration.addPerDiemDestination] Adding a per diem destination');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAddPerDiemDestination();
    } catch (err) {
      throw new Error(
        `[Administration.addPerDiemDestination] Failed to add a per diem destination: ${err.message}`
      );
    }

    logger.info('[Administration.addPerDiemDestination] Per diem destination added');
  },

  /**
   * Selects the first destination in the newly added destination row.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async selectFirstDestination(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.selectFirstDestination] "adminPage" is required.');
    }

    logger.debug('[Administration.selectFirstDestination] Selecting the first destination');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.selectFirstDestinationOption();
    } catch (err) {
      throw new Error(
        `[Administration.selectFirstDestination] Failed to select the first destination: ${err.message}`
      );
    }

    logger.info('[Administration.selectFirstDestination] First destination selected');
  },

  /**
   * Sets the per diem daily sum for the destination row.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} value - The daily sum value (e.g. "10")
   */
  async setPerDiemDailySum(adminPage, value) {
    if (!adminPage) {
      throw new Error('[Administration.setPerDiemDailySum] "adminPage" is required.');
    }
    if (!value || typeof value !== 'string') {
      throw new Error(
        `[Administration.setPerDiemDailySum] "value" must be a non-empty string, got: ${typeof value} (${JSON.stringify(value)})`
      );
    }

    logger.debug(`[Administration.setPerDiemDailySum] Setting per diem daily sum to "${value}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillDailySum(value);
    } catch (err) {
      throw new Error(
        `[Administration.setPerDiemDailySum] Failed to set per diem daily sum to "${value}": ${err.message}`
      );
    }

    logger.info(`[Administration.setPerDiemDailySum] Per diem daily sum set to "${value}"`);
  },

  /**
   * Selects the first per diem currency in the destination row.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async selectFirstPerDiemCurrency(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.selectFirstPerDiemCurrency] "adminPage" is required.');
    }

    logger.debug('[Administration.selectFirstPerDiemCurrency] Selecting the first per diem currency');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.selectFirstCurrencyOption();
    } catch (err) {
      throw new Error(
        `[Administration.selectFirstPerDiemCurrency] Failed to select the first per diem currency: ${err.message}`
      );
    }

    logger.info('[Administration.selectFirstPerDiemCurrency] First per diem currency selected');
  },

  /**
   * Saves the per diem detail form.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async savePerDiem(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.savePerDiem] "adminPage" is required.');
    }

    logger.debug('[Administration.savePerDiem] Saving the per diem');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickSavePerDiem();
    } catch (err) {
      throw new Error(
        `[Administration.savePerDiem] Failed to save the per diem: ${err.message}`
      );
    }

    logger.info('[Administration.savePerDiem] Per diem saved');
  },

  /**
   * Removes the destination from the per diem.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async removePerDiemDestination(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.removePerDiemDestination] "adminPage" is required.');
    }

    logger.debug('[Administration.removePerDiemDestination] Removing the per diem destination');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickRemovePerDiemDestination();
    } catch (err) {
      throw new Error(
        `[Administration.removePerDiemDestination] Failed to remove the per diem destination: ${err.message}`
      );
    }

    logger.info('[Administration.removePerDiemDestination] Per diem destination removed');
  },

  /**
   * Verifies the removed destination is no longer listed (no destination row remains).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyDestinationNoLongerListed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyDestinationNoLongerListed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyDestinationNoLongerListed] Verifying the destination is no longer listed');

    const page = getPageObject(adminPage, AdministrationPage);
    const present = await page.isDestinationRowPresent();

    if (present) {
      throw new Error(
        `[Administration.verifyDestinationNoLongerListed] A destination row is still present after removal + save, ` +
        `but the removed destination should no longer be listed in the per diem destinations table.`
      );
    }

    logger.info('[Administration.verifyDestinationNoLongerListed] No destination row remains — removal confirmed');
  },

  // --- Deactivate user with dependencies (test 37921) ---

  /**
   * Verifies the administration users table displays the expected column header.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedHeader - The expected column header text (e.g. "First Name")
   */
  async verifyUsersTableColumnHeader(adminPage, expectedHeader) {
    if (!adminPage) {
      throw new Error('[Administration.verifyUsersTableColumnHeader] "adminPage" is required.');
    }
    if (!expectedHeader || typeof expectedHeader !== 'string') {
      throw new Error(
        `[Administration.verifyUsersTableColumnHeader] "expectedHeader" must be a non-empty string, got: ${typeof expectedHeader} (${JSON.stringify(expectedHeader)})`
      );
    }

    logger.debug(`[Administration.verifyUsersTableColumnHeader] Verifying users table shows column header "${expectedHeader}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getUsersTableColumnHeader();

    if (!actual.includes(expectedHeader)) {
      throw new Error(
        `[Administration.verifyUsersTableColumnHeader] Users table column header mismatch. ` +
        `Expected to contain "${expectedHeader}" but found "${actual}". ` +
        `The Users list may not have rendered or its column layout changed.`
      );
    }

    logger.info(`[Administration.verifyUsersTableColumnHeader] Users table displays column header "${actual}"`);
  },

  /**
   * Filters the administration users list by typing into the search box. Unlike searchUserInAdmin,
   * this only narrows the list — it does NOT open the matched record.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The text to filter the users list by
   */
  async filterUsersInAdmin(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.filterUsersInAdmin] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.filterUsersInAdmin] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.filterUsersInAdmin] Filtering users by "${userName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillUserSearch(userName);
    } catch (err) {
      throw new Error(
        `[Administration.filterUsersInAdmin] Failed to filter the users list by "${userName}": ${err.message}`
      );
    }

    logger.info(`[Administration.filterUsersInAdmin] Users list filtered by "${userName}"`);
  },

  /**
   * Precondition guard: leaves the given user Active before a deactivation flow runs.
   *
   * A deactivation scenario deactivates a real staging user and only reactivates it in its tail, so a
   * run that dies mid-scenario leaves the user Inactive. The users list defaults to active-only, so
   * every later run's filter then legitimately returns zero rows and the scenario can never recover
   * on its own. This reactivates the user when needed, then restores the default active-only view so
   * the scenario's own assertions still exercise the real filter.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} userName - The user to filter by (as typed into the users search box)
   */
  async ensureUserIsActive(adminPage, userName) {
    if (!adminPage) {
      throw new Error('[Administration.ensureUserIsActive] "adminPage" is required.');
    }
    if (!userName || typeof userName !== 'string') {
      throw new Error(
        `[Administration.ensureUserIsActive] "userName" must be a non-empty string, got: ${typeof userName} (${JSON.stringify(userName)})`
      );
    }

    logger.debug(`[Administration.ensureUserIsActive] Ensuring "${userName}" is active`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      // Inactive users are hidden by default — the user must be visible before its status can be read
      await page.checkShowInactive();
      await page.fillUserSearch(userName);

      const status = await page.getFirstUserStatusOrNull();

      if (status === null) {
        throw new Error(
          `no user row matched "${userName}" even with inactive users shown — the staging user may ` +
          `have been renamed or deleted.`
        );
      }

      if (status.toLowerCase() === 'active') {
        logger.info(`[Administration.ensureUserIsActive] "${userName}" is already active — nothing to restore`);
      } else {
        logger.warn(
          `[Administration.ensureUserIsActive] "${userName}" was left "${status}" by an earlier run — reactivating it`
        );
        await page.checkFirstUserRow();
        await page.clickActivateUser();
        await page.waitForFirstUserStatus('Active');
        // Clear the selection while the healed user is still the only filtered row, so it cannot leak
        // into the scenario's own deactivate action
        await page.uncheckFirstUserRow();
        logger.info(`[Administration.ensureUserIsActive] "${userName}" reactivated`);
      }

      // Restore the default view the scenario expects: search cleared, inactive users hidden
      await page.clearUserSearch();
      await page.uncheckShowInactive();
    } catch (err) {
      throw new Error(
        `[Administration.ensureUserIsActive] Failed to ensure "${userName}" is active: ${err.message}`
      );
    }
  },

  /**
   * Verifies the first filtered user result contains the expected text (case-insensitive).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedText - The text the first result's name should contain
   */
  async verifyFirstUserResultContains(adminPage, expectedText) {
    if (!adminPage) {
      throw new Error('[Administration.verifyFirstUserResultContains] "adminPage" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Administration.verifyFirstUserResultContains] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    logger.debug(`[Administration.verifyFirstUserResultContains] Verifying first user result contains "${expectedText}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getFirstUserResultName();

    if (!actual.toLowerCase().includes(expectedText.toLowerCase())) {
      throw new Error(
        `[Administration.verifyFirstUserResultContains] First filtered user result mismatch. ` +
        `Expected the first result name to contain "${expectedText}" (case-insensitive) but found "${actual}". ` +
        `The filter may have returned a different user or no rows.`
      );
    }

    logger.info(`[Administration.verifyFirstUserResultContains] First user result "${actual}" contains "${expectedText}"`);
  },

  /**
   * Selects the first user in the filtered administration results (checks its row checkbox).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async selectFirstUserInResults(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.selectFirstUserInResults] "adminPage" is required.');
    }

    logger.debug('[Administration.selectFirstUserInResults] Selecting the first user in the results');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.checkFirstUserRow();
    } catch (err) {
      throw new Error(
        `[Administration.selectFirstUserInResults] Failed to select the first user in the results: ${err.message}`
      );
    }

    logger.info('[Administration.selectFirstUserInResults] First user selected');
  },

  /**
   * Clicks the deactivate-user button, opening the dependencies popup.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async clickDeactivateUser(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.clickDeactivateUser] "adminPage" is required.');
    }

    logger.debug('[Administration.clickDeactivateUser] Clicking the deactivate-user button');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickDeactivateUserButton();
    } catch (err) {
      throw new Error(
        `[Administration.clickDeactivateUser] Failed to open the deactivation dependencies popup: ${err.message}`
      );
    }

    logger.info('[Administration.clickDeactivateUser] Deactivation dependencies popup opened');
  },

  /**
   * Verifies the deactivation dependencies popup states the given sentence (substring match).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedText - The sentence expected in the popup body
   */
  async verifyDeactivationPopupStatement(adminPage, expectedText) {
    if (!adminPage) {
      throw new Error('[Administration.verifyDeactivationPopupStatement] "adminPage" is required.');
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Administration.verifyDeactivationPopupStatement] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    logger.debug(`[Administration.verifyDeactivationPopupStatement] Verifying popup states "${expectedText}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.waitForPopupTextVisible(expectedText);
    } catch (err) {
      throw new Error(
        `[Administration.verifyDeactivationPopupStatement] The deactivation dependencies popup did not state the expected sentence "${expectedText}": ${err.message}`
      );
    }

    logger.info(`[Administration.verifyDeactivationPopupStatement] Popup states "${expectedText}"`);
  },

  /**
   * Verifies the deactivation dependencies popup lists the given dependency (substring match, so
   * partial fixture names like "specific approver1" resolve).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedDependency - The dependency line expected in the popup
   */
  async verifyDeactivationPopupDependency(adminPage, expectedDependency) {
    if (!adminPage) {
      throw new Error('[Administration.verifyDeactivationPopupDependency] "adminPage" is required.');
    }
    if (!expectedDependency || typeof expectedDependency !== 'string') {
      throw new Error(
        `[Administration.verifyDeactivationPopupDependency] "expectedDependency" must be a non-empty string, got: ${typeof expectedDependency} (${JSON.stringify(expectedDependency)})`
      );
    }

    logger.debug(`[Administration.verifyDeactivationPopupDependency] Verifying popup lists dependency "${expectedDependency}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.waitForPopupTextVisible(expectedDependency);
    } catch (err) {
      throw new Error(
        `[Administration.verifyDeactivationPopupDependency] The deactivation dependencies popup did not list the dependency "${expectedDependency}": ${err.message}`
      );
    }

    logger.info(`[Administration.verifyDeactivationPopupDependency] Popup lists dependency "${expectedDependency}"`);
  },

  /**
   * Confirms the user deactivation in the popup.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async confirmUserDeactivation(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.confirmUserDeactivation] "adminPage" is required.');
    }

    logger.debug('[Administration.confirmUserDeactivation] Confirming the user deactivation');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.confirmDeactivationPopup();
    } catch (err) {
      throw new Error(
        `[Administration.confirmUserDeactivation] Failed to confirm the user deactivation: ${err.message}`
      );
    }

    logger.info('[Administration.confirmUserDeactivation] User deactivation confirmed');
  },

  /**
   * Verifies the deactivation was submitted by confirming the dependencies popup has dismissed. The
   * deeper "no longer an ACTIVE dependency" assertion is flagged manual in the Testim source; this is
   * the strongest observable automated post-condition.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyUserNotListedAsDependency(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyUserNotListedAsDependency] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyUserNotListedAsDependency] Verifying the deactivation completed (popup dismissed)');

    const page = getPageObject(adminPage, AdministrationPage);
    const closed = await page.isDeactivationPopupClosed();

    if (!closed) {
      throw new Error(
        `[Administration.verifyUserNotListedAsDependency] The deactivation dependencies popup is still open after confirming, ` +
        `so the deactivation was not submitted. (The deeper "no longer an active dependency" check is flagged manual in the Testim source.)`
      );
    }

    logger.info('[Administration.verifyUserNotListedAsDependency] Deactivation submitted — dependencies popup dismissed');
  },

  /**
   * Enables the "show inactive users" filter so deactivated users appear in the list.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async showInactiveUsers(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.showInactiveUsers] "adminPage" is required.');
    }

    logger.debug('[Administration.showInactiveUsers] Enabling the show-inactive-users filter');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.checkShowInactive();
    } catch (err) {
      throw new Error(
        `[Administration.showInactiveUsers] Failed to enable the show-inactive-users filter: ${err.message}`
      );
    }

    logger.info('[Administration.showInactiveUsers] Inactive users are now shown');
  },

  /**
   * Verifies the first user row's status badge equals the expected status (e.g. "Active"/"Inactive").
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedStatus - The expected status text
   */
  async verifyUserStatusBadge(adminPage, expectedStatus) {
    if (!adminPage) {
      throw new Error('[Administration.verifyUserStatusBadge] "adminPage" is required.');
    }
    if (!expectedStatus || typeof expectedStatus !== 'string') {
      throw new Error(
        `[Administration.verifyUserStatusBadge] "expectedStatus" must be a non-empty string, got: ${typeof expectedStatus} (${JSON.stringify(expectedStatus)})`
      );
    }

    logger.debug(`[Administration.verifyUserStatusBadge] Verifying user status badge is "${expectedStatus}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    // Poll (do not read once): the row status updates asynchronously after a deactivate/activate
    // action, so a single read can catch the stale prior status. Leading-token exact match — "Active"
    // is a substring of "Inactive", so a contains check would let one satisfy the other.
    let actual;
    try {
      actual = await page.waitForFirstUserStatus(expectedStatus);
    } catch (err) {
      throw new Error(
        `[Administration.verifyUserStatusBadge] User status mismatch. ` +
        `Expected "${expectedStatus}". ${err.message}`
      );
    }

    logger.info(`[Administration.verifyUserStatusBadge] User status badge reads "${actual}"`);
  },

  /**
   * Verifies the open approver record's approval-flow section lists a dependency containing the given
   * value (case-insensitive) — used to confirm a deactivated user still appears on the approver.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedValue - The dependency value expected in the approval-flow choices
   */
  async verifyApprovalFlowDependency(adminPage, expectedValue) {
    if (!adminPage) {
      throw new Error('[Administration.verifyApprovalFlowDependency] "adminPage" is required.');
    }
    if (!expectedValue || typeof expectedValue !== 'string') {
      throw new Error(
        `[Administration.verifyApprovalFlowDependency] "expectedValue" must be a non-empty string, got: ${typeof expectedValue} (${JSON.stringify(expectedValue)})`
      );
    }

    logger.debug(`[Administration.verifyApprovalFlowDependency] Verifying approval-flow dependency shows "${expectedValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const values = await page.getApprovalFlowChoiceValues();
    const found = values.some((v) => v.toLowerCase().includes(expectedValue.toLowerCase()));

    if (!found) {
      throw new Error(
        `[Administration.verifyApprovalFlowDependency] Approval-flow dependency not found. ` +
        `Expected a value containing "${expectedValue}" but the approver's approval-flow choices were: ${JSON.stringify(values)}. ` +
        `The deactivated user may no longer be listed on the approver's record.`
      );
    }

    logger.info(`[Administration.verifyApprovalFlowDependency] Approval-flow dependency shows "${expectedValue}"`);
  },

  /**
   * Opens the first dependency link in the popup and returns the new tab it opens.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @returns {Promise<import('playwright').Page>} The linked-dependency tab
   */
  async openFirstDependencyLink(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openFirstDependencyLink] "adminPage" is required.');
    }

    logger.debug('[Administration.openFirstDependencyLink] Opening the first dependency link from the popup');

    const page = getPageObject(adminPage, AdministrationPage);

    let linkedTab;
    try {
      linkedTab = await page.clickFirstDependencyLink();
    } catch (err) {
      throw new Error(
        `[Administration.openFirstDependencyLink] Failed to open the first dependency link: ${err.message}`
      );
    }

    logger.info('[Administration.openFirstDependencyLink] First dependency link opened in a new tab');
    return linkedTab;
  },

  /**
   * Verifies the linked dependency page's Name field equals the expected name, then closes the linked
   * tab so it does not leak into later steps.
   *
   * @param {import('playwright').Page} linkedTab - The tab opened by openFirstDependencyLink
   * @param {string} expectedName - The expected entity name
   */
  async verifyLinkedDependencyName(linkedTab, expectedName) {
    if (!linkedTab) {
      throw new Error(
        '[Administration.verifyLinkedDependencyName] "linkedTab" is required — the dependency-link step must run first and store the opened tab.'
      );
    }
    if (!expectedName || typeof expectedName !== 'string') {
      throw new Error(
        `[Administration.verifyLinkedDependencyName] "expectedName" must be a non-empty string, got: ${typeof expectedName} (${JSON.stringify(expectedName)})`
      );
    }

    logger.debug(`[Administration.verifyLinkedDependencyName] Verifying linked dependency page name is "${expectedName}"`);

    const page = getPageObject(linkedTab, AdministrationPage);

    let actual;
    try {
      actual = await page.getEntityNameFieldValue();
    } catch (err) {
      // Close the linked tab before re-throwing so it does not leak into later steps
      await linkedTab.close().catch(() => {});
      throw new Error(
        `[Administration.verifyLinkedDependencyName] Failed to read the linked dependency page name: ${err.message}`
      );
    }

    const normalize = (s) => s.replace(/\s+/g, ' ').trim();
    if (normalize(actual) !== normalize(expectedName)) {
      await linkedTab.close().catch(() => {});
      throw new Error(
        `[Administration.verifyLinkedDependencyName] Linked dependency page name mismatch. ` +
        `Expected "${expectedName}" but the linked page's Name field reads "${actual}". ` +
        `The popup link may point to a different entity.`
      );
    }

    // Clean up the linked tab so subsequent admin-page steps are not left on a background tab
    await linkedTab.close().catch(() => {});
    logger.info(`[Administration.verifyLinkedDependencyName] Linked dependency page name is "${actual}"`);
  },

  /**
   * Closes the deactivation dependencies popup, bringing the admin tab back to the front first (a
   * dependency link opened earlier may have backgrounded it).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async closeDeactivationPopup(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.closeDeactivationPopup] "adminPage" is required.');
    }

    logger.debug('[Administration.closeDeactivationPopup] Closing the deactivation dependencies popup');

    await adminPage.bringToFront().catch(() => {});

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.closeDeactivationPopup();
    } catch (err) {
      throw new Error(
        `[Administration.closeDeactivationPopup] Failed to close the deactivation dependencies popup: ${err.message}`
      );
    }

    logger.info('[Administration.closeDeactivationPopup] Deactivation dependencies popup closed');
  },

  /**
   * Reactivates the selected (deactivated) user, restoring it for the next run.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async activateFirstUser(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.activateFirstUser] "adminPage" is required.');
    }

    logger.debug('[Administration.activateFirstUser] Reactivating the selected user');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickActivateUser();
    } catch (err) {
      throw new Error(
        `[Administration.activateFirstUser] Failed to reactivate the selected user: ${err.message}`
      );
    }

    logger.info('[Administration.activateFirstUser] Selected user reactivated');
  },

  // --- Corporate email provider setting (test 48270 / 51634) ---

  /**
   * Verifies the corporate main email provider setting is displayed on the administration
   * settings form.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async verifyEmailProviderSettingDisplayed(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.verifyEmailProviderSettingDisplayed] "adminPage" is required.');
    }

    logger.debug('[Administration.verifyEmailProviderSettingDisplayed] Verifying the email provider setting is displayed');

    const page = getPageObject(adminPage, AdministrationPage);
    const label = await page.getEmailProviderLabelText();

    if (!label.includes('Corporate main email provider')) {
      throw new Error(
        `[Administration.verifyEmailProviderSettingDisplayed] Corporate main email provider setting mismatch. ` +
        `Expected to contain "Corporate main email provider" but found "${label}". ` +
        `The administration settings form may not have rendered.`
      );
    }

    logger.info(`[Administration.verifyEmailProviderSettingDisplayed] Email provider setting displayed ("${label}")`);
  },

  /**
   * Verifies the email provider tooltip ("?" icon) shows the expected title text.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedTitle - The expected tooltip title text
   */
  async verifyEmailProviderTooltipTitle(adminPage, expectedTitle) {
    if (!adminPage) {
      throw new Error('[Administration.verifyEmailProviderTooltipTitle] "adminPage" is required.');
    }
    if (!expectedTitle || typeof expectedTitle !== 'string') {
      throw new Error(
        `[Administration.verifyEmailProviderTooltipTitle] "expectedTitle" must be a non-empty string, got: ${typeof expectedTitle} (${JSON.stringify(expectedTitle)})`
      );
    }

    logger.debug(`[Administration.verifyEmailProviderTooltipTitle] Verifying email provider tooltip title "${expectedTitle}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getEmailProviderTooltipTitle();

    if (actual !== expectedTitle) {
      throw new Error(
        `[Administration.verifyEmailProviderTooltipTitle] Email provider tooltip title mismatch. ` +
        `Expected "${expectedTitle}" but found "${actual}". ` +
        `The tooltip icon locator is unconfirmed against the live admin DOM (see AdministrationPage.ADMIN_EMAIL_PROVIDER_TOOLTIP_ICON) — verify and adjust it if this is not the intended icon.`
      );
    }

    logger.info(`[Administration.verifyEmailProviderTooltipTitle] Email provider tooltip title verified: "${actual}"`);
  },

  /**
   * Opens the corporate main email provider select2 dropdown.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openEmailProviderDropdown(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openEmailProviderDropdown] "adminPage" is required.');
    }

    logger.debug('[Administration.openEmailProviderDropdown] Opening the corporate main email provider dropdown');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.openEmailProviderSelect2();
    } catch (err) {
      throw new Error(
        `[Administration.openEmailProviderDropdown] Failed to open the corporate main email provider dropdown: ${err.message}`
      );
    }

    logger.info('[Administration.openEmailProviderDropdown] Corporate main email provider dropdown opened');
  },

  /**
   * Verifies the Nth email provider dropdown option (1-based) displays the expected text.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {number} index - 1-based option index (e.g. 1 for "option 1")
   * @param {string} expectedText - The expected option text (e.g. "Outlook")
   */
  async verifyEmailProviderDropdownOption(adminPage, index, expectedText) {
    if (!adminPage) {
      throw new Error('[Administration.verifyEmailProviderDropdownOption] "adminPage" is required.');
    }
    if (!Number.isInteger(index) || index < 1) {
      throw new Error(
        `[Administration.verifyEmailProviderDropdownOption] "index" must be a positive integer, got: ${typeof index} (${JSON.stringify(index)})`
      );
    }
    if (!expectedText || typeof expectedText !== 'string') {
      throw new Error(
        `[Administration.verifyEmailProviderDropdownOption] "expectedText" must be a non-empty string, got: ${typeof expectedText} (${JSON.stringify(expectedText)})`
      );
    }

    logger.debug(`[Administration.verifyEmailProviderDropdownOption] Verifying email provider dropdown option ${index} is "${expectedText}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getEmailProviderDropdownOptionText(index);

    if (actual !== expectedText) {
      throw new Error(
        `[Administration.verifyEmailProviderDropdownOption] Email provider dropdown option ${index} mismatch. ` +
        `Expected "${expectedText}" but found "${actual}".`
      );
    }

    logger.info(`[Administration.verifyEmailProviderDropdownOption] Email provider dropdown option ${index} is "${actual}"`);
  },

  /**
   * Verifies the email provider dropdown contains exactly the expected number of options.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {number} expectedCount - The exact number of options expected
   */
  async verifyEmailProviderDropdownOptionCount(adminPage, expectedCount) {
    if (!adminPage) {
      throw new Error('[Administration.verifyEmailProviderDropdownOptionCount] "adminPage" is required.');
    }
    if (!Number.isInteger(expectedCount) || expectedCount < 0) {
      throw new Error(
        `[Administration.verifyEmailProviderDropdownOptionCount] "expectedCount" must be a non-negative integer, got: ${typeof expectedCount} (${JSON.stringify(expectedCount)})`
      );
    }

    logger.debug(`[Administration.verifyEmailProviderDropdownOptionCount] Verifying email provider dropdown has ${expectedCount} option(s)`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actualCount = await page.countEmailProviderDropdownOptions();

    if (actualCount !== expectedCount) {
      throw new Error(
        `[Administration.verifyEmailProviderDropdownOptionCount] Email provider dropdown option count mismatch. ` +
        `Expected exactly ${expectedCount} option(s) but found ${actualCount}.`
      );
    }

    logger.info(`[Administration.verifyEmailProviderDropdownOptionCount] Email provider dropdown has ${actualCount} option(s)`);
  },

  // --- Agreements / PTC Special Fares tooltip edit (test 27016) ---

  /**
   * Opens the Agreements section in the administration left menu.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async openAgreementsSection(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openAgreementsSection] "adminPage" is required.');
    }

    logger.debug('[Administration.openAgreementsSection] Opening the Agreements section in administration');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAdminSectionByTitle('Agreements');
      // Leaving the settings form raises the "unsaved items" navigation guard; confirm it so the
      // Agreements list actually loads. No-op when the dialog is absent.
      await page.dismissUnsavedItemsDialogIfPresent();
      await page.waitForAgreementsListReady();
    } catch (err) {
      throw new Error(
        `[Administration.openAgreementsSection] Failed to open the Agreements section in administration: ${err.message}`
      );
    }

    logger.info('[Administration.openAgreementsSection] Agreements section is open');
    return { opened: true };
  },

  /**
   * Filters the agreements list by a category and opens the first agreement in it.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} categoryName - Agreement category to filter by (e.g. "PTC Special Fares")
   */
  async openFirstAgreementUnderCategory(adminPage, categoryName) {
    if (!adminPage) {
      throw new Error('[Administration.openFirstAgreementUnderCategory] "adminPage" is required.');
    }
    if (!categoryName || typeof categoryName !== 'string') {
      throw new Error(
        `[Administration.openFirstAgreementUnderCategory] "categoryName" must be a non-empty string, got: ${typeof categoryName} (${JSON.stringify(categoryName)})`
      );
    }

    logger.debug(`[Administration.openFirstAgreementUnderCategory] Opening the first agreement under "${categoryName}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickAdminSectionByTitle(categoryName);
      await page.clickFirstAgreementRow();
    } catch (err) {
      throw new Error(
        `[Administration.openFirstAgreementUnderCategory] Failed to open the first agreement under category ` +
        `"${categoryName}": ${err.message}. The category may not exist, or it holds no agreements in this environment.`
      );
    }

    logger.info(`[Administration.openFirstAgreementUnderCategory] First agreement under "${categoryName}" is open`);
    return { opened: true, categoryName };
  },

  /**
   * Sets the open agreement's tooltip to a freshly generated random value and returns it, so the
   * caller can later assert the same value surfaces in the booking flow.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @returns {Promise<string>} The generated tooltip value
   */
  async enterRandomAgreementTooltipValue(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.enterRandomAgreementTooltipValue] "adminPage" is required.');
    }

    const randomValue = `tooltip-${faker.string.alphanumeric(8)}`;

    logger.debug(`[Administration.enterRandomAgreementTooltipValue] Setting the agreement tooltip to "${randomValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillAgreementTooltip(randomValue);
    } catch (err) {
      throw new Error(
        `[Administration.enterRandomAgreementTooltipValue] Failed to set the agreement tooltip to the generated ` +
        `value "${randomValue}": ${err.message}`
      );
    }

    logger.info(`[Administration.enterRandomAgreementTooltipValue] Agreement tooltip set to "${randomValue}"`);
    return randomValue;
  },

  /**
   * Sets the open agreement's tooltip to an explicit value (used to revert the change).
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} tooltipValue - The tooltip text to set
   */
  async enterAgreementTooltipValue(adminPage, tooltipValue) {
    if (!adminPage) {
      throw new Error('[Administration.enterAgreementTooltipValue] "adminPage" is required.');
    }
    if (!tooltipValue || typeof tooltipValue !== 'string') {
      throw new Error(
        `[Administration.enterAgreementTooltipValue] "tooltipValue" must be a non-empty string, got: ${typeof tooltipValue} (${JSON.stringify(tooltipValue)})`
      );
    }

    logger.debug(`[Administration.enterAgreementTooltipValue] Setting the agreement tooltip to "${tooltipValue}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillAgreementTooltip(tooltipValue);
    } catch (err) {
      throw new Error(
        `[Administration.enterAgreementTooltipValue] Failed to set the agreement tooltip to "${tooltipValue}": ${err.message}`
      );
    }

    logger.info(`[Administration.enterAgreementTooltipValue] Agreement tooltip set to "${tooltipValue}"`);
    return { tooltipValue };
  },

  /**
   * Records the mandatory change reason on the open agreement.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} comment - The change reason
   */
  async enterAgreementChangeComment(adminPage, comment) {
    if (!adminPage) {
      throw new Error('[Administration.enterAgreementChangeComment] "adminPage" is required.');
    }
    if (!comment || typeof comment !== 'string') {
      throw new Error(
        `[Administration.enterAgreementChangeComment] "comment" must be a non-empty string, got: ${typeof comment} (${JSON.stringify(comment)})`
      );
    }

    logger.debug(`[Administration.enterAgreementChangeComment] Recording the agreement change reason "${comment}"`);

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.fillAgreementChangeComment(comment);
    } catch (err) {
      throw new Error(
        `[Administration.enterAgreementChangeComment] Failed to record the agreement change reason "${comment}": ${err.message}`
      );
    }

    logger.info(`[Administration.enterAgreementChangeComment] Agreement change reason recorded`);
    return { comment };
  },

  /**
   * Saves the open agreement.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   */
  async saveAgreement(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.saveAgreement] "adminPage" is required.');
    }

    logger.debug('[Administration.saveAgreement] Saving the agreement');

    const page = getPageObject(adminPage, AdministrationPage);

    try {
      await page.clickSaveAgreement();
    } catch (err) {
      throw new Error(
        `[Administration.saveAgreement] Failed to save the agreement: ${err.message}`
      );
    }

    logger.info('[Administration.saveAgreement] Agreement saved');
    return { saved: true };
  },

  /**
   * Verifies the open agreement's tooltip holds the expected value — used to confirm the revert
   * actually persisted.
   *
   * @param {import('playwright').Page} adminPage - The administration page
   * @param {string} expectedTooltip - The tooltip text the agreement should hold
   */
  async verifyAgreementTooltipValue(adminPage, expectedTooltip) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAgreementTooltipValue] "adminPage" is required.');
    }
    if (!expectedTooltip || typeof expectedTooltip !== 'string') {
      throw new Error(
        `[Administration.verifyAgreementTooltipValue] "expectedTooltip" must be a non-empty string, got: ${typeof expectedTooltip} (${JSON.stringify(expectedTooltip)})`
      );
    }

    logger.debug(`[Administration.verifyAgreementTooltipValue] Verifying the agreement tooltip reads "${expectedTooltip}"`);

    const page = getPageObject(adminPage, AdministrationPage);
    const actual = await page.getAgreementTooltipValue();

    if (actual !== expectedTooltip) {
      throw new Error(
        `[Administration.verifyAgreementTooltipValue] Agreement tooltip mismatch. ` +
        `Expected "${expectedTooltip}" but the field holds "${actual}". ` +
        `The revert save may not have persisted.`
      );
    }

    logger.info(`[Administration.verifyAgreementTooltipValue] Agreement tooltip reads "${actual}"`);
    return { expectedTooltip, actual };
  },

  // --- Agency Fare Rules Management (agent GTP Admin Center, test 43181) ---

  /**
   * Opens Fare Management > Agency Fare Rules Management in the agency GTP Admin Center and returns
   * the rules currently saved for the agency.
   *
   * Product race, worked around here: the section binds its Currency list once
   * (`currency in ::currencies`). When the currencies arrive after that first render - typical on a
   * freshly loaded admin page - both Currency dropdowns stay EMPTY for the visit, and no rule can be
   * saved with a currency. Leaving the section and coming back reuses the now-cached list, so the
   * section is reopened until its dropdowns are populated.
   *
   * @param {import('playwright').Page} adminPage - The agent's GTP Admin Center page
   * @returns {Promise<{change: object|null, cancel: object|null}>} Each fee as
   *   { amount, markupType: "Fixed Value"|"Percentage", currency }, or null when none is saved
   */
  async openAgencyFareRulesManagement(adminPage) {
    if (!adminPage) {
      throw new Error('[Administration.openAgencyFareRulesManagement] "adminPage" is required.');
    }

    const page = getPageObject(adminPage, AdministrationPage);
    let currencyCounts = [];

    for (let attempt = 1; attempt <= AGENCY_FARE_RULES_OPEN_ATTEMPTS; attempt += 1) {
      const savedRules = await page.openAgencyFareRulesManagementFromMenu();
      currencyCounts = [
        await page.countAgencyFareRuleCurrencyOptions(AGENCY_FARE_RULE_FEES.change.rowIndex),
        await page.countAgencyFareRuleCurrencyOptions(AGENCY_FARE_RULE_FEES.cancel.rowIndex),
      ];

      if (currencyCounts.every((count) => count > 0)) {
        const rules = toAgencyFareRules(savedRules);
        logger.info('[Administration.openAgencyFareRulesManagement] Agency Fare Rules Management is open', { attempt, rules });
        return rules;
      }

      logger.warn(
        '[Administration.openAgencyFareRulesManagement] The Currency dropdowns rendered empty (one-time binding ' +
        'raced the currency list) - leaving the section and reopening it',
        { attempt, currencyCounts },
      );
      await page.clickAdminSectionByTitle(AGENCY_FARE_RULES_DETOUR_SECTION);
      await page.dismissUnsavedItemsDialogIfPresent();
    }

    throw new Error(
      `[Administration.openAgencyFareRulesManagement] After ${AGENCY_FARE_RULES_OPEN_ATTEMPTS} visits the Agency Fare ` +
      `Rules Management Currency dropdowns still offer no currency (options per row: ${JSON.stringify(currencyCounts)}). ` +
      `A markup cannot be saved with a currency in this state.`
    );
  },

  /**
   * Sets the agency fare rules markup on the open Agency Fare Rules Management section and saves it.
   * A fee left out of `rules` is not touched. A fee given as null is set to a 0 Fixed Value markup:
   * the section has no way to delete a saved rule, and 0 adds nothing (ApplyFixedAdminFee).
   *
   * @param {import('playwright').Page} adminPage - The agent's GTP Admin Center page
   * @param {{change?: object|null, cancel?: object|null}} rules - { amount, markupType, currency } per fee
   * @param {string} comment - Modification comment recorded with the change
   * @returns {Promise<{status: number, requestBody: string, responseBody: string}>}
   */
  async setAgencyFareRules(adminPage, rules, comment) {
    if (!adminPage) {
      throw new Error('[Administration.setAgencyFareRules] "adminPage" is required.');
    }
    if (!rules || typeof rules !== 'object') {
      throw new Error(`[Administration.setAgencyFareRules] "rules" must be an object, got: ${typeof rules}`);
    }
    if (!comment || typeof comment !== 'string') {
      throw new Error(`[Administration.setAgencyFareRules] "comment" must be a non-empty string, got: ${typeof comment}`);
    }

    const page = getPageObject(adminPage, AdministrationPage);

    for (const [fee, rule] of Object.entries(rules)) {
      const row = AGENCY_FARE_RULE_FEES[fee];
      if (!row) {
        throw new Error(`[Administration.setAgencyFareRules] Unknown fee "${fee}". Use one of: ${Object.keys(AGENCY_FARE_RULE_FEES).join(', ')}`);
      }
      const target = rule || { amount: 0, markupType: MARKUP_TYPE_LABELS[1], currency: null };

      await page.fillAgencyFareRuleAmount(row.rowIndex, target.amount);
      await page.selectAgencyFareRuleMarkupType(row.rowIndex, target.markupType);
      if (target.currency) {
        await page.selectAgencyFareRuleCurrency(row.rowIndex, target.currency);
      }

      const shown = await page.getAgencyFareRuleRowValues(row.rowIndex);
      logger.info(`[Administration.setAgencyFareRules] ${row.label} set`, { target, shown });
    }

    const result = await page.saveAgencyFareRules(comment);
    if (result.status !== 200) {
      throw new Error(
        `[Administration.setAgencyFareRules] Saving the agency fare rules answered HTTP ${result.status}. ` +
        `Sent: ${result.requestBody}. Answer: ${result.responseBody.slice(0, 500)}`
      );
    }

    logger.info('[Administration.setAgencyFareRules] Agency fare rules saved', { sent: result.requestBody });
    return result;
  },

  /**
   * Reopens Agency Fare Rules Management (so the rules are read back from the server, not from the
   * form just edited) and asserts each given fee holds the expected markup.
   *
   * @param {import('playwright').Page} adminPage - The agent's GTP Admin Center page
   * @param {{change?: object|null, cancel?: object|null}} expected - { amount, markupType, currency } per
   *   fee; null means "no markup" (no saved rule, or a saved 0)
   * @returns {Promise<{change: object|null, cancel: object|null}>} The rules read back
   */
  async verifyAgencyFareRules(adminPage, expected) {
    if (!adminPage) {
      throw new Error('[Administration.verifyAgencyFareRules] "adminPage" is required.');
    }
    if (!expected || typeof expected !== 'object') {
      throw new Error(`[Administration.verifyAgencyFareRules] "expected" must be an object, got: ${typeof expected}`);
    }

    const page = getPageObject(adminPage, AdministrationPage);
    await page.clickAdminSectionByTitle(AGENCY_FARE_RULES_DETOUR_SECTION);
    await page.dismissUnsavedItemsDialogIfPresent();
    const saved = await this.openAgencyFareRulesManagement(adminPage);

    const mismatches = [];
    for (const [fee, want] of Object.entries(expected)) {
      const got = saved[fee];
      const matches = want
        ? Boolean(got) && Number(got.amount) === Number(want.amount) && got.markupType === want.markupType &&
          (!want.currency || got.currency === want.currency)
        : !got || Number(got.amount) === 0;
      if (!matches) {
        mismatches.push(`${AGENCY_FARE_RULE_FEES[fee].label}: expected ${JSON.stringify(want)}, saved ${JSON.stringify(got)}`);
      }
    }

    if (mismatches.length > 0) {
      throw new Error(
        `[Administration.verifyAgencyFareRules] The agency fare rules read back from the server differ from what was ` +
        `saved: ${mismatches.join('; ')}`
      );
    }

    logger.info('[Administration.verifyAgencyFareRules] Agency fare rules read back as expected', { saved });
    return saved;
  },
};

// --- Agency Fare Rules Management helpers (test 43181) ---

// Fee rows of the section, ordered by the backend's AdministrationFeeType (ChangeFee = 0, CancellationFee = 1).
const AGENCY_FARE_RULE_FEES = {
  change: { rowIndex: 0, feeType: 0, label: 'Change fee' },
  cancel: { rowIndex: 1, feeType: 1, label: 'Cancellation fee' },
};
// MarkupType enum as the section labels it.
const MARKUP_TYPE_LABELS = { 0: 'Percentage', 1: 'Fixed Value' };
const AGENCY_FARE_RULES_OPEN_ATTEMPTS = 4;
// Any other section works as the detour that makes the section reload; this one is light.
const AGENCY_FARE_RULES_DETOUR_SECTION = 'Lowest Fares';

/**
 * Maps the section's GetAgencyFareRulesManagement answer onto { change, cancel }.
 * @param {Array<{FeeType:number, Amount:number, MarkupType:number, Currency:string}>} apiRules
 */
function toAgencyFareRules(apiRules) {
  const byFeeType = (feeType) => {
    const rule = apiRules.find((entry) => Number(entry.FeeType) === feeType);
    return rule
      ? {
          amount: Number(rule.Amount),
          markupType: MARKUP_TYPE_LABELS[Number(rule.MarkupType)] ?? String(rule.MarkupType),
          currency: rule.Currency ?? null,
        }
      : null;
  };
  return {
    change: byFeeType(AGENCY_FARE_RULE_FEES.change.feeType),
    cancel: byFeeType(AGENCY_FARE_RULE_FEES.cancel.feeType),
  };
}

module.exports = Administration;
