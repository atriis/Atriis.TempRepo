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
    const actualText = await page.getAdminToastText();

    if (!actualText.includes(expectedText)) {
      throw new Error(
        `[Administration.verifyAdminToast] Confirmation toast mismatch. ` +
        `Expected to contain "${expectedText}" but toast showed "${actualText}". ` +
        `The save may not have succeeded.`
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
};

module.exports = Administration;
